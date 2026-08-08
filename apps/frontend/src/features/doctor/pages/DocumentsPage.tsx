import { Link } from 'react-router-dom';
import { useDocuments } from '@/app/providers/DocumentsProvider';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/utils/formatters';

const labels: Record<string, string> = { stored: 'Cargado', prepared: 'Preparado', processed: 'Procesado', pending_human_review: 'Pendiente de revisión' };
export function DocumentsPage() {
  const { documents, selectDocument } = useDocuments();
  return <div className="card docdai-surface border-0 rounded-4"><div className="card-body p-4 p-xl-5">
    <div className="d-flex justify-content-between align-items-start gap-3 mb-4"><div><h2 className="h4 mb-1">Documentos recientes</h2><p className="text-secondary mb-0">Los archivos se conservan temporalmente en el backend; los resultados requieren revisión humana.</p></div><Link className="btn btn-primary" to="/doctor/uploads">Cargar documento</Link></div>
    {documents.length === 0 ? <div className="py-5 text-center text-secondary">Aún no hay documentos en esta sesión. <Link to="/doctor/uploads">Carga el primero</Link>.</div> : <div className="table-responsive"><table className="table align-middle mb-0"><thead><tr><th>Documento</th><th>Estado</th><th>Fecha</th><th>Páginas</th><th>Confianza</th><th /></tr></thead><tbody>{documents.map((document) => <tr key={document.id}><td><div className="fw-semibold">{document.filename}</div><div className="small text-secondary">{(document.size / 1024).toFixed(1)} KB</div></td><td><span className="badge text-bg-secondary">{labels[document.stage]}</span></td><td>{formatDateTime(document.createdAt)}</td><td>{document.pages ?? '—'}</td><td>{document.ocr ? <StatusBadge confidence={Math.round(document.ocr.confidence * 100)} /> : '—'}</td><td className="text-end"><Link onClick={() => selectDocument(document.id)} className="btn btn-sm btn-outline-primary" to={`/doctor/review/${document.id}`}>Abrir</Link></td></tr>)}</tbody></table></div>}
  </div></div>;
}
