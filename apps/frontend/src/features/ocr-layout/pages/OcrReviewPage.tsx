import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useDocumentPages } from '../hooks/useDocumentPages';
import { useOcrReview } from '../hooks/useOcrReview';
import { useReviewState } from '../hooks/useReviewState';
import { DocumentViewer } from '../components/DocumentViewer';
import { PageThumbnails } from '../components/PageThumbnails';
import { ExtractionPanel } from '../components/ExtractionPanel';
import { EvidencePanel } from '../components/EvidencePanel';
import { ReviewActions } from '../components/ReviewActions';

export function OcrReviewPage() {
  const { documentId } = useParams(); const { document } = useOcrReview(documentId);
  if (!document) return <section className="card docdai-surface border-0 rounded-4"><div className="card-body p-5 text-center"><h2 className="h4">Documento no disponible en esta sesión</h2><p className="text-secondary">Por privacidad, los datos de OCR no se guardan en el navegador. Procesa el documento de nuevo para revisarlo.</p><Link className="btn btn-primary" to="/doctor/uploads">Cargar documento</Link></div></section>;
  const pages = useDocumentPages(document); const [page, setPage] = useState(1); const [selectedOcrText, setSelectedOcrText] = useState<string | null>(null); const review = useReviewState(document.parsed?.evidence ?? []); const selectedPage = pages.find((item) => item.number === page) ?? pages[0];
  const save = () => window.alert('Cambios guardados temporalmente en esta sesión. La persistencia clínica requiere un endpoint de revisión.');
  const approve = () => { if (window.confirm('¿Confirmas que todos los campos fueron revisados? Esta aprobación aún no se envía al backend.')) window.alert('Revisión lista para persistir cuando el endpoint clínico esté disponible.'); };
  return <div className="docdai-ocr-review"><header className="docdai-review-heading"><div><span className="docdai-eyebrow">Revisión humana requerida</span><h1>{document.filename}</h1><p>OCR original → parser → corrección humana. Ningún dato se aprueba automáticamente.</p></div><Link className="btn btn-outline-secondary" to="/doctor/documents">Volver a documentos</Link></header><div className="docdai-review-grid"><PageThumbnails pages={pages} selected={page} onSelect={setPage} /><DocumentViewer page={selectedPage} totalPages={pages.length} filename={document.filename} onOcrSelect={setSelectedOcrText} /><ExtractionPanel fields={review.fields} selectedId={review.selectedId} onSelect={review.setSelectedId} /></div><EvidencePanel field={review.selected} onUpdate={(patch) => review.selected && review.update(review.selected.id, patch)} />{selectedOcrText ? <details className="docdai-ocr-details" open><summary>Texto OCR seleccionado</summary><pre>{selectedOcrText}</pre></details> : null}{document.ocr ? <details className="docdai-ocr-details"><summary>Texto OCR de referencia</summary><pre>{document.ocr.text}</pre></details> : null}<ReviewActions pending={review.pending} onSave={save} onApprove={approve} /></div>;
}
