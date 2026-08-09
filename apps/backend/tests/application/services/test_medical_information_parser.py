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

    def test_extracts_multiline_medications_without_classifying_noise(self) -> None:
        record = self.parser.parse(
            "Paciente:\nMariana López Hernández\n"
            "Medicamentos:\n"
            "Paracetamol\nTabletas 500 mg\nPara dolor o fiebre, según indicación médica.\nCada 8 horas\n"
            "Solución salina\nSpray nasal\nPara aliviar congestión nasal.\nSegún necesidad\n"
            "Antecedentes y observaciones\nRecomendaciones:\nMantener adecuada hidratación y descanso.\n"
            "Aviso legal:\nRECETA MÉDICA — DOCUMENTO DE PRUEBA OCR\nEJEMPLO FICTICIO · SIN VALIDEZ MÉDICA\n"
            "Institución:\nClínica San Miguel — Consulta externa\n"
        )

        self.assertEqual(record.patient.name if record.patient else None, "Mariana López Hernández")
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(len(record.medications), 2)
        self.assertEqual(record.medications[0].name, "Paracetamol")
        self.assertEqual(record.medications[0].dose, "500 mg")
        self.assertEqual(record.medications[0].presentation, "Tabletas")
        self.assertEqual(record.medications[0].frequency, "Cada 8 horas")
        self.assertEqual(record.medications[1].name, "Solución salina")
        self.assertEqual(record.medications[1].presentation, "Spray nasal")
        self.assertEqual(record.medications[1].frequency, "Según necesidad")
        self.assertEqual(record.dates, ())
        self.assertEqual(record.institution, "Clínica San Miguel — Consulta externa")
        self.assertNotIn("MÉDICA — DOCUMENTO DE PRUEBA OCR", [medication.name for medication in record.medications])

    def test_extracts_only_valid_date_patterns(self) -> None:
        record = self.parser.parse(
            "Fecha: 01 de Septiembre de 2026\n"
            "Consulta: Consultar a un profesional de salud si los síntomas empeoran.\n"
        )

        self.assertEqual(record.dates, ("01 de Septiembre de 2026",))

    def test_does_not_treat_antecedents_as_diagnosis(self) -> None:
        record = self.parser.parse("Antecedentes y observaciones\nSin alergias conocidas\n")

        self.assertEqual(record.diagnoses, ())

    def test_extracts_bare_section_headers_with_values_on_following_lines(self) -> None:
        record = self.parser.parse(
            "PACIENTE\nNombre: Mariana López Hernández\nEdad\n54 años\n\n"
            "DIAGNÓSTICO\nHipertensión arterial\n\n"
            "MEDICAMENTOS\nParacetamol\n500 mg\nCada 8 horas\n\n"
            "Médico\nDr. Juan Pérez\n\nInstitución\nClínica San Miguel\n"
        )

        self.assertEqual(record.patient.name if record.patient else None, "Mariana López Hernández")
        self.assertEqual(record.patient.age if record.patient else None, 54)
        self.assertEqual(record.diagnoses, ("Hipertensión arterial",))
        self.assertEqual(record.medications[0].name, "Paracetamol")
        self.assertEqual(record.medications[0].dose, "500 mg")
        self.assertEqual(record.medications[0].frequency, "Cada 8 horas")
        self.assertEqual(record.doctor, "Dr. Juan Pérez")
        self.assertEqual(record.institution, "Clínica San Miguel")
        self.assertEqual(
            {evidence.field for evidence in record.evidence},
            {
                "patient.name",
                "patient.age",
                "diagnoses[0]",
                "medications[0].name",
                "medications[0].dose",
                "medications[0].frequency",
                "doctor",
                "institution",
            },
        )

    def test_extracts_multiple_medications_with_separate_dose_lines(self) -> None:
        record = self.parser.parse(
            "MEDICAMENTOS\nIbuprofeno\n400 mg\nCada 8 horas\n\n"
            "Loratadina\n10 mg\nUna vez al día\n\nOBSERVACIONES\nRevisar en consulta.\n"
        )

        self.assertEqual(len(record.medications), 2)
        self.assertEqual(record.medications[0].name, "Ibuprofeno")
        self.assertEqual(record.medications[0].dose, "400 mg")
        self.assertEqual(record.medications[0].frequency, "Cada 8 horas")
        self.assertEqual(record.medications[1].name, "Loratadina")
        self.assertEqual(record.medications[1].dose, "10 mg")
        self.assertEqual(record.medications[1].frequency, "Una vez al día")

    def test_tolerates_ocr_spacing_without_using_unlabeled_values(self) -> None:
        record = self.parser.parse(
            "  PACIENTE :  \n  Ana   Ruiz  \nEDAD :\n  37  años\n\n"
            "DATOS CLÍNICOS\nMigraña\nAspirina\n"
        )

        self.assertEqual(record.patient.name if record.patient else None, "Ana Ruiz")
        self.assertEqual(record.patient.age if record.patient else None, 37)
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(record.medications, ())

    def test_does_not_extract_from_sections_without_a_recognized_label(self) -> None:
        record = self.parser.parse(
            "RESUMEN CLÍNICO\nAna Ruiz\nMigraña\n"
            "Amoxicilina\n500 mg\nCada 8 horas\n"
        )

        self.assertIsNone(record.patient)
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(record.medications, ())


if __name__ == "__main__":
    unittest.main()
