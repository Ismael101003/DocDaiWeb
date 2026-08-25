"""Finaliza documentos aprobados sin interpretar nuevamente el contenido clínico."""

from dataclasses import replace
from datetime import datetime, timezone
import re
from uuid import uuid4

from src.application.schemas.finalization import FinalizeDocumentResponse
from src.application.schemas.medical_information import MedicalInformationResponse
from src.application.use_cases.parse_medical_information import OcrResultNotAvailableError, ParseMedicalInformationUseCase
from src.domain.entities.clinical_patient import ClinicalPatient
from src.domain.entities.document_finalization import DocumentFinalization
from src.domain.entities.medical_record import Medication
from src.domain.entities.patient_medical_record import PatientMedicalRecord
from src.domain.interfaces.document_finalization_storage import DocumentFinalizationStorage
from src.domain.interfaces.document_review_storage import DocumentReviewStorage
from src.domain.interfaces.medical_record_repository import MedicalRecordRepository
from src.domain.interfaces.patient_repository import PatientRepository
from src.domain.interfaces.temporary_document_storage import TemporaryDocumentStorage


class FinalizeDocumentNotFoundError(Exception): pass
class FinalizeDocumentConflictError(Exception): pass
class FinalizeDocumentPatientNotFoundError(Exception): pass


def _response(document_id: str, action: str, status: str, patient: ClinicalPatient | None, record: PatientMedicalRecord | None, match_identifier: str | None) -> FinalizeDocumentResponse:
    return FinalizeDocumentResponse(document_id=document_id, action=action, status=status, match_identifier=match_identifier, patient=patient and patient.__dict__, record=record and {**record.__dict__, "medications": [item.__dict__ for item in record.medications]})


def _merge(current: tuple, additions: tuple) -> tuple:
    return tuple(dict.fromkeys((*current, *additions)))


class FinalizeDocumentUseCase:
    def __init__(self, *, document_storage: TemporaryDocumentStorage, parse_use_case: ParseMedicalInformationUseCase, review_storage: DocumentReviewStorage, patient_repository: PatientRepository, medical_record_repository: MedicalRecordRepository, finalization_storage: DocumentFinalizationStorage) -> None:
        self._document_storage, self._parse_use_case, self._review_storage = document_storage, parse_use_case, review_storage
        self._patient_repository, self._medical_record_repository, self._finalization_storage = patient_repository, medical_record_repository, finalization_storage

    def execute(self, *, document_id: str, patient_id=None) -> FinalizeDocumentResponse:
        existing = self._finalization_storage.get(document_id=document_id)
        if existing:
            patient = self._patient_repository.get(patient_id=existing.patient_id) if existing.patient_id else None
            record = self._medical_record_repository.get(patient_id=existing.patient_id) if existing.patient_id else None
            return _response(document_id, existing.action, existing.status, patient, record, existing.match_identifier)
        try: self._document_storage.get_path(document_id=document_id)
        except FileNotFoundError as exc: raise FinalizeDocumentNotFoundError("El documento temporal no existe.") from exc
        review = self._review_storage.get(document_id=document_id)
        if review is None or review.status != "approved": raise FinalizeDocumentConflictError("El documento requiere aprobación humana antes de finalizarse.")
        try: information = self._parse_use_case.execute(document_id=document_id)
        except OcrResultNotAvailableError as exc: raise FinalizeDocumentConflictError("No existe información OCR para finalizar el documento.") from exc
        selected_patient = None
        if patient_id is not None:
            selected_patient = self._patient_repository.get(patient_id=patient_id)
            if selected_patient is None:
                raise FinalizeDocumentPatientNotFoundError("El paciente seleccionado no existe.")
        values = {item.field: item.value for item in review.reviewed_fields if item.status in {"approved", "corrected"}}
        rejected = {item.field for item in review.reviewed_fields if item.status == "rejected"}
        name = values.get("patient.name", information.patient.name if information.patient else None)
        age_value = values.get("patient.age")
        age = int(age_value) if age_value and age_value.isdigit() else (information.patient.age if information.patient else None)
        curp, nss = values.get("patient.curp"), values.get("patient.nss")
        date_of_birth = values.get("patient.date_of_birth")
        matches, identifier = ([] , None)
        if selected_patient is None:
            if curp: matches, identifier = self._patient_repository.find_by_curp(curp=curp), "CURP"
            elif nss: matches, identifier = self._patient_repository.find_by_nss(nss=nss), "NSS"
            elif name and date_of_birth:
                from datetime import date
                try: dob = date.fromisoformat(date_of_birth); matches, identifier = self._patient_repository.find_by_name_and_date_of_birth(name=name, date_of_birth=dob), "nombre+fecha_nacimiento"
                except ValueError: pass
            elif name and self._patient_repository.find_by_normalized_name(name=name):
                return self._ambiguous(document_id)
            if len(matches) > 1: return self._ambiguous(document_id)
        now = datetime.now(timezone.utc)
        if selected_patient is not None:
            patient, action, identifier = selected_patient, "updated", "explicit_patient_selection"
            patient = replace(patient, updated_at=now)
        elif matches:
            patient, action = matches[0], "updated"
            patient = replace(patient, age=patient.age if patient.age is not None else age, updated_at=now)
        else:
            patient, action = ClinicalPatient(uuid4(), name, age, None, curp, nss, now, now), "created"
        self._patient_repository.save(patient=patient)
        current = self._medical_record_repository.get(patient_id=patient.id) or PatientMedicalRecord(patient_id=patient.id)
        diagnoses = tuple(values.get(f"diagnoses[{index}]", item) for index, item in enumerate(information.diagnoses) if f"diagnoses[{index}]" not in rejected)
        medications: list[Medication] = []
        for index, item in enumerate(information.medications):
            if f"medications[{index}].name" in rejected: continue
            medications.append(Medication(values.get(f"medications[{index}].name", item.name), values.get(f"medications[{index}].dose", item.dose), values.get(f"medications[{index}].frequency", item.frequency), values.get(f"medications[{index}].presentation", item.presentation), values.get(f"medications[{index}].indication", item.indication)))
        dates = tuple(values.get(f"dates[{index}]", item) for index, item in enumerate(information.dates) if f"dates[{index}]" not in rejected)
        doctor = None if "doctor" in rejected else values.get("doctor", information.doctor)
        institution = None if "institution" in rejected else values.get("institution", information.institution)
        record = PatientMedicalRecord(patient_id=patient.id, diagnoses=_merge(current.diagnoses, diagnoses), medications=_merge(current.medications, tuple(medications)), dates=_merge(current.dates, dates), doctors=_merge(current.doctors, (doctor,) if doctor else ()), institutions=_merge(current.institutions, (institution,) if institution else ()), documents=_merge(current.documents, (document_id,)), updated_at=now)
        self._medical_record_repository.save(record=record)
        self._finalization_storage.save(finalization=DocumentFinalization(document_id, action, "finalized", patient.id, identifier, now, "explicit_patient_selection" if selected_patient is not None else "patient_matching"))
        return _response(document_id, action, "finalized", patient, record, identifier)

    def _ambiguous(self, document_id: str) -> FinalizeDocumentResponse:
        now = datetime.now(timezone.utc)
        self._finalization_storage.save(finalization=DocumentFinalization(document_id, "ambiguous_match", "ambiguous_match", None, "nombre", now))
        return _response(document_id, "ambiguous_match", "ambiguous_match", None, None, "nombre")
