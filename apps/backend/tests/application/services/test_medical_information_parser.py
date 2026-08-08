"""Pruebas con OCR sintético para el parser determinista de información médica."""

import unittest

from src.application.services.medical_information_parser import MedicalInformationParser


class MedicalInformationParserTest(unittest.TestCase):
    """Verifica extracción explícita sin inferencias clínicas."""

    def setUp(self) -> None:
        self.parser = MedicalInformationParser()

    def test_returns_empty_values_when_no_medical_information_is_recognized(self) -> None:
        record = self.parser.parse("Documento digitalizado\nTexto sin etiquetas clínicas\n")

        self.assertIsNone(record.patient)
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(record.medications, ())
        self.assertEqual(record.dates, ())
        self.assertIsNone(record.doctor)
        self.assertIsNone(record.institution)
        self.assertEqual(record.evidence, ())

    def test_extracts_explicit_patient_name_and_age(self) -> None:
        record = self.parser.parse("Paciente:\nJuan Pérez\nEdad: 54 años\n")

        self.assertEqual(record.patient.name if record.patient else None, "Juan Pérez")
        self.assertEqual(record.patient.age if record.patient else None, 54)
        self.assertEqual(record.evidence[0].field, "patient.name")
        self.assertEqual(record.evidence[0].status, "pending_review")

    def test_extracts_explicit_date_only_when_labeled(self) -> None:
        record = self.parser.parse("Fecha: 12/03/2026\nConsulta: 1 de agosto de 2026\n")

        self.assertEqual(record.dates, ("12/03/2026", "1 de agosto de 2026"))

    def test_extracts_explicit_diagnosis(self) -> None:
        record = self.parser.parse("Diagnóstico: Hipertensión arterial\n")

        self.assertEqual(record.diagnoses, ("Hipertensión arterial",))

    def test_extracts_explicit_medication(self) -> None:
        record = self.parser.parse(
            "Medicamentos:\nMetformina 850 mg\nTomar una tableta cada 12 horas\n"
        )

        self.assertEqual(record.medications[0].name, "Metformina")
        self.assertEqual(record.medications[0].dose, "850 mg")
        self.assertEqual(record.medications[0].frequency, "Cada 12 horas")

    def test_extracts_explicit_institution(self) -> None:
        record = self.parser.parse("Institución: TECNOLOGIAS RAPPI SAPI DE CV\n")

        self.assertEqual(record.institution, "TECNOLOGIAS RAPPI SAPI DE CV")

    def test_extracts_explicit_doctor(self) -> None:
        record = self.parser.parse("Médico tratante: Dr. Carlos Gómez\n")

        self.assertEqual(record.doctor, "Dr. Carlos Gómez")

    def test_handles_noisy_ocr_text_without_guessing(self) -> None:
        record = self.parser.parse(
            "PACIENTE :   María  López\nEDAD:  45 anos\n"
            "DIAGNOSTICO :  Asma\nMEDICAMENTOS :\n  Salbutamol   100 mcg\n"
            "Texto ilegible sin etiqueta"
        )

        self.assertEqual(record.patient.name if record.patient else None, "María López")
        self.assertEqual(record.patient.age if record.patient else None, 45)
        self.assertEqual(record.diagnoses, ("Asma",))
        self.assertEqual(record.medications[0].name, "Salbutamol")
        self.assertEqual(record.medications[0].dose, "100 mcg")
        self.assertIsNone(record.medications[0].frequency)

    def test_does_not_invent_information_from_medical_looking_text_without_context(self) -> None:
        record = self.parser.parse("Datos del aprendiz\nISMAEL MARTINEZ RAMIREZ\nAspirina\n")

        self.assertIsNone(record.patient)
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(record.medications, ())

    def test_does_not_capture_arbitrary_institution_fragments(self) -> None:
        record = self.parser.parse("Institución: de tu el\n")

        self.assertIsNone(record.institution)
        self.assertEqual(record.evidence, ())

    def test_preserves_page_information_when_pages_are_provided(self) -> None:
        record = self.parser.parse(
            "",
            page_texts=("Paciente: Ana Ruiz", "Edad: 40 años"),
        )

        self.assertEqual(record.patient.name if record.patient else None, "Ana Ruiz")
        self.assertEqual(record.patient.age if record.patient else None, 40)
        self.assertEqual([evidence.page for evidence in record.evidence], [1, 2])

    def test_includes_auditable_evidence_without_probability(self) -> None:
        record = self.parser.parse("Paciente: Juan Pérez\n")

        evidence = record.evidence[0]
        self.assertEqual(evidence.field, "patient.name")
        self.assertEqual(evidence.value, "Juan Pérez")
        self.assertEqual(evidence.source_text, "Paciente: Juan Pérez")
        self.assertEqual(evidence.match_type, "explicit_label_or_section")
        self.assertIsNone(evidence.confidence)
        self.assertEqual(evidence.status, "pending_review")


if __name__ == "__main__":
    unittest.main()
