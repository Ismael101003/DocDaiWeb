import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const titleMap: Array<[RegExp, { title: string; subtitle: string }]> = [
  [/^\/doctor\/patients\/[^/]+$/, { title: 'Detalle del paciente', subtitle: 'Cronología, archivos y vista previa de extracción con IA' }],
  [/^\/doctor\/patients$/, { title: 'Pacientes', subtitle: 'Busca y supervisa el listado de pacientes' }],
  [/^\/doctor\/uploads$/, { title: 'Cargar documentos', subtitle: 'Procesa escaneos, PDFs y fotos mediante OCR' }],
  [/^\/doctor\/documents$/, { title: 'Documentos', subtitle: 'Estado del procesamiento y cola de revisión' }],
  [/^\/doctor\/review\/[^/]+$/, { title: 'Revisión del expediente', subtitle: 'Aprueba o edita los datos clínicos extraídos' }],
  [/^\/doctor$/, { title: 'Panel del doctor', subtitle: 'Carga clínica, cola de revisión y actividad de pacientes' }],
  [/^\/patient\/records\/[^/]+$/, { title: 'Detalle del expediente', subtitle: 'Vista de reporte legible para el paciente' }],
  [/^\/patient\/records$/, { title: 'Expedientes médicos', subtitle: 'Todos los registros estructurados en un solo lugar' }],
  [/^\/patient\/profile$/, { title: 'Perfil del paciente', subtitle: 'Información personal y resumen de atención' }],
  [/^\/patient$/, { title: 'Panel del paciente', subtitle: 'Registros recientes y estado actual' }],
];

export function AppLayout() {
  const location = useLocation();

  const pageMeta = titleMap.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? {
    title: 'Espacio clínico',
    subtitle: 'Registros estructurados y validación OCR',
  };

  return (
    <div className="container-fluid px-0 docdai-shell">
      <div className="row g-0 min-vh-100">
        <Sidebar />

        <div className="col-12 col-lg-9 col-xxl-10 d-flex flex-column">
          <Topbar title={pageMeta.title} subtitle={pageMeta.subtitle} />

          <main className="flex-grow-1 p-3 p-md-4 p-xl-5">
            <div className="container-fluid px-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
