import type {
  DoctorStat,
  MedicalDocument,
  MedicalRecord,
  PatientProfile,
  PatientSummary,
  ReviewField,
  TimelineEvent,
} from '@/types/medical';

export const doctorStats: DoctorStat[] = [
  {
    label: 'Pacientes bajo cuidado',
    value: '128',
    note: '8 nuevos esta semana',
  },
  {
    label: 'Archivos subidos',
    value: '46',
    note: '12 procesados hoy',
  },
  {
    label: 'Validaciones pendientes',
    value: '9',
    note: 'Requiere revisión humana',
  },
];

export const patientStats: DoctorStat[] = [
  {
    label: 'Últimos registros',
    value: '14',
    note: '4 actualizados este mes',
  },
  {
    label: 'Planes de cuidado activos',
    value: '3',
    note: 'Todos sincronizados con el expediente',
  },
  {
    label: 'Alertas de revisión',
    value: '1',
    note: 'Esperando confirmación médica',
  },
];

export const patients: PatientSummary[] = [
  {
    id: 'pt-2045',
    name: 'Maria Torres',
    age: 42,
    gender: 'Female',
    condition: 'Seguimiento de hipertensión',
    lastVisit: '2026-05-28T09:00:00Z',
    status: 'en seguimiento',
    documents: 18,
  },
  {
    id: 'pt-2071',
    name: 'Luis Herrera',
    age: 56,
    gender: 'Male',
    condition: 'Control de diabetes',
    lastVisit: '2026-06-11T11:30:00Z',
    status: 'pendiente de revisión',
    documents: 24,
  },
  {
    id: 'pt-2088',
    name: 'Elena Cruz',
    age: 31,
    gender: 'Female',
    condition: 'Recuperación posoperatoria',
    lastVisit: '2026-06-18T08:20:00Z',
    status: 'estable',
    documents: 9,
  },
  {
    id: 'pt-2099',
    name: 'Diego Navarro',
    age: 64,
    gender: 'Male',
    condition: 'Consulta de cardiología',
    lastVisit: '2026-06-21T14:10:00Z',
    status: 'en seguimiento',
    documents: 31,
  },
];

export const patientTimeline: TimelineEvent[] = [
  {
    id: 'evt-1',
    title: 'OCR importó el informe de laboratorio',
    date: '2026-06-20T10:15:00Z',
    description: 'La biometría hemática y el panel químico se extrajeron con alta confianza y se vincularon al expediente.',
    tone: 'success',
  },
  {
    id: 'evt-2',
    title: 'Plan de medicación actualizado',
    date: '2026-06-18T16:40:00Z',
    description: 'La dosis de amlodipino se ajustó y quedó marcada para revisión médica antes de finalizarla.',
    tone: 'warning',
  },
  {
    id: 'evt-3',
    title: 'Alerta de presión arterial',
    date: '2026-06-14T07:55:00Z',
    description: 'El monitoreo en casa registró un pico por encima del rango objetivo y activó un seguimiento.',
    tone: 'danger',
  },
];

export const patientDocuments: MedicalDocument[] = [
  {
    id: 'doc-1',
    fileName: 'cbc_june_2026.pdf',
    type: 'Informe de laboratorio',
    uploadedAt: '2026-06-20T10:15:00Z',
    status: 'procesado',
    confidence: 96,
    summary: 'Los valores de biometría se normalizaron en campos estructurados sin secciones faltantes.',
  },
  {
    id: 'doc-2',
    fileName: 'radiology_scan.png',
    type: 'Imagen',
    uploadedAt: '2026-06-18T16:40:00Z',
    status: 'pendiente de revisión',
    confidence: 84,
    summary: 'Las notas de radiología se extrajeron con una línea incierta que requiere validación manual.',
  },
  {
    id: 'doc-3',
    fileName: 'prescription_photo.jpg',
    type: 'Receta',
    uploadedAt: '2026-06-14T07:55:00Z',
    status: 'marcado',
    confidence: 69,
    summary: 'La línea de dosis manuscrita necesita verificación clínica antes de guardar el registro.',
  },
];

export const aiPreviewFields: ReviewField[] = [
  { label: 'Diagnóstico principal', value: 'Hipertensión esencial', confidence: 95 },
  { label: 'Medicamento', value: 'Amlodipino 5 mg diarios', confidence: 93 },
  { label: 'Seguimiento', value: 'Control de presión arterial en 14 días', confidence: 90 },
  { label: 'Nota de riesgo', value: 'Vigilar dolor de cabeza y mareo', confidence: 82 },
];

export const doctorReviewFields: ReviewField[] = [
  { label: 'Tipo de documento', value: 'Resumen de alta', confidence: 98 },
  { label: 'Fecha de atención', value: '20 jun 2026', confidence: 96 },
  { label: 'Sugerencia CIE-10', value: 'I10 - Hipertensión esencial', confidence: 91 },
  { label: 'Lista de medicamentos', value: 'Amlodipino, hidroclorotiazida', confidence: 88 },
  { label: 'Siguientes pasos', value: 'Confirmar la dosis y anotar lecturas en casa', confidence: 86 },
];

export const reviewRecord: MedicalRecord = {
  id: 'rec-404',
  patientName: 'Maria Torres',
  title: 'Revisión OCR del resumen de alta',
  date: '2026-06-20T10:15:00Z',
  status: 'pendiente de revisión',
  confidence: 91,
  source: 'PDF de alta del servicio de urgencias',
  summary:
    'La extracción estructurada está lista. Aún falta aprobar una sola línea de dosis antes de finalizar el expediente.',
  details: [
    'Los signos vitales se normalizaron al llegar y se mantuvieron estables durante la visita.',
    'No se detectaron contraindicaciones en la sección de alergias extraída.',
    'La dosis del medicamento parece consistente con la nota manuscrita después de limpiar el OCR.',
  ],
};

export const doctorPatientOverview = {
  name: 'Maria Torres',
  initials: 'MT',
  lastUpdated: '2026-06-20T10:15:00Z',
  nextTouchpoint: 'Validación médica pendiente',
  aiConfidence: 94,
};

export const patientRecordCards: MedicalRecord[] = [
  {
    id: 'pr-1',
    patientName: 'Maria Torres',
    title: 'Revisión anual de cardiología',
    date: '2026-06-20T10:15:00Z',
    status: 'finalizado',
    confidence: 96,
    source: 'Resumen de visita clínica',
    summary: 'El médico revisó el informe extraído y confirmó el plan de medicación.',
    details: ['La presión arterial está mejorando.', 'Se documentó el consejo de estilo de vida.', 'Continuar el monitoreo en casa.'],
  },
  {
    id: 'pr-2',
    patientName: 'Maria Torres',
    title: 'Resultados del panel de junio',
    date: '2026-06-18T16:40:00Z',
    status: 'finalizado',
    confidence: 93,
    source: 'PDF de laboratorio',
    summary: 'Biometría y química estructuradas con tendencias de las últimas cuatro semanas.',
    details: ['La función renal está dentro de rango.', 'El sodio está ligeramente bajo pero estable.', 'No se requiere escalamiento urgente.'],
  },
  {
    id: 'pr-3',
    patientName: 'Maria Torres',
    title: 'Solicitud de renovación de medicación',
    date: '2026-06-14T07:55:00Z',
    status: 'requiere cambios',
    confidence: 71,
    source: 'Foto de receta',
    summary: 'Una dosis manuscrita necesita confirmación manual antes de liberarla.',
    details: ['La línea de medicación estaba parcialmente oculta.', 'Revisar la dosis con el médico prescriptor.', 'En espera de aprobación.'],
  },
];

export const patientProfile: PatientProfile = {
  fullName: 'Maria Torres',
  patientId: 'PT-2045',
  dateOfBirth: '1984-03-12',
  bloodType: 'O+',
  allergies: 'Penicilina, látex',
  conditions: 'Hipertensión, asma estacional',
  emergencyContact: 'Ana Torres · +52 55 1234 5678',
};
