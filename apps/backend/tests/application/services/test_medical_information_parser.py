"""Pruebas con OCR sintético para el parser determinista de información médica."""

import unittest

from src.application.services.medical_information_parser import MedicalInformationParser


class MedicalInformationParserTest(unittest.TestCase):
    """Verifica extracción explícita sin inferencias clínicas."""

    def setUp(self) -> None:
        self.parser = MedicalInformationParser()

    def test_extracts_healthy_document(self) -> None:
        record = self.parser.parse(
            "Paciente:\nJuan Pérez\nEdad: 54 años\nDiagnóstico: Hipertensión arterial\n\n"
            "Medicamentos\nMetformina 850 mg\nTomar una tableta cada 12 horas\n"
            "Fecha: 12/03/2026\nDoctor: Dra. Ana Gómez\nInstitución: Clínica Central"
        )

        self.assertEqual(record.patient.name if record.patient else None, "Juan Pérez")
        self.assertEqual(record.patient.age if record.patient else None, 54)
        self.assertEqual(record.diagnoses, ("Hipertensión arterial",))
        self.assertEqual(record.medications[0].name, "Metformina")
        self.assertEqual(record.medications[0].dose, "850 mg")
        self.assertEqual(record.medications[0].frequency, "Cada 12 horas")
        self.assertEqual(record.dates, ("12/03/2026",))
        self.assertEqual(record.doctor, "Dra. Ana Gómez")
        self.assertEqual(record.institution, "Clínica Central")

    def test_returns_none_when_patient_is_absent(self) -> None:
        record = self.parser.parse("Diagnóstico: Migraña\n")

        self.assertIsNone(record.patient)

    def test_returns_empty_medications_when_section_is_absent(self) -> None:
        record = self.parser.parse("Paciente: Laura Ruiz\nEdad: 30 años\n")

        self.assertEqual(record.medications, ())

    def test_extracts_multiple_diagnoses_and_medications(self) -> None:
        record = self.parser.parse(
            "Diagnósticos:\nDiabetes tipo 2; Hipertensión arterial\n"
            "Medicamentos:\nMetformina 850 mg\nLosartán 50 mg\n"
        )

        self.assertEqual(record.diagnoses, ("Diabetes tipo 2", "Hipertensión arterial"))
        self.assertEqual([medication.name for medication in record.medications], ["Metformina", "Losartán"])
        self.assertEqual([medication.dose for medication in record.medications], ["850 mg", "50 mg"])
        self.assertEqual([medication.frequency for medication in record.medications], [None, None])

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

    def test_does_not_invent_missing_dose_or_frequency(self) -> None:
        record = self.parser.parse("Medicamentos:\nParacetamol\n")

        self.assertEqual(record.medications[0].name, "Paracetamol")
        self.assertIsNone(record.medications[0].dose)
        self.assertIsNone(record.medications[0].frequency)

    def test_extracts_medication_without_dose_but_with_frequency(self) -> None:
        record = self.parser.parse("Medicamentos:\nMetformina cada 12 horas\n")

        self.assertEqual(record.medications[0].name, "Metformina")
        self.assertIsNone(record.medications[0].dose)
        self.assertEqual(record.medications[0].frequency, "Cada 12 horas")

    def test_extracts_doctor_from_treating_doctor_label(self) -> None:
        record = self.parser.parse("Médico tratante: Dr. Carlos Gómez\n")

        self.assertEqual(record.doctor, "Dr. Carlos Gómez")

    def test_extracts_institution(self) -> None:
        record = self.parser.parse("Hospital: Hospital General de México\n")

        self.assertEqual(record.institution, "Hospital General de México")

    def test_extracts_common_numeric_and_written_dates(self) -> None:
        record = self.parser.parse("Fecha: 01.08.2026\nConsulta: 1 de agosto de 2026\n")

        self.assertEqual(record.dates, ("01.08.2026", "1 de agosto de 2026"))

    def test_returns_empty_values_when_no_medical_information_is_recognized(self) -> None:
        record = self.parser.parse("Documento digitalizado\nTexto sin etiquetas clínicas\n")

        self.assertIsNone(record.patient)
        self.assertEqual(record.diagnoses, ())
        self.assertEqual(record.medications, ())
        self.assertEqual(record.dates, ())
        self.assertIsNone(record.doctor)
        self.assertIsNone(record.institution)

    def test_accepts_ocr_label_variants(self) -> None:
        record = self.parser.parse("PACIENTE : ANA RUIZ\nEDAD: 40 ANOS\nDX: Migraña\n")

        self.assertEqual(record.patient.name if record.patient else None, "ANA RUIZ")
        self.assertEqual(record.patient.age if record.patient else None, 40)
        self.assertEqual(record.diagnoses, ("Migraña",))

    def test_keeps_partially_absent_information_as_none(self) -> None:
        record = self.parser.parse("Paciente: Elena Díaz\nMedicamentos:\nIbuprofeno 400 mg\n")

        self.assertEqual(record.patient.name if record.patient else None, "Elena Díaz")
        self.assertIsNone(record.patient.age if record.patient else None)
        self.assertEqual(record.medications[0].dose, "400 mg")
        self.assertIsNone(record.medications[0].frequency)

    def test_includes_auditable_evidence_without_probability(self) -> None:
        record = self.parser.parse("Paciente: Juan Pérez\n")

        evidence = record.evidence[0]
        self.assertEqual(evidence.field, "patient.name")
        self.assertEqual(evidence.source_text, "Paciente: Juan Pérez")
        self.assertEqual(evidence.match_type, "explicit_label_or_section")
        self.assertIsNone(evidence.confidence)


if __name__ == "__main__":
    unittest.main()
