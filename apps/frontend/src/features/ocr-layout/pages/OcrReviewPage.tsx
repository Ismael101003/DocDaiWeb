import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useDocumentPages } from '../hooks/useDocumentPages';
import { useOcrReview } from '../hooks/useOcrReview';
import { useReviewState } from '../hooks/useReviewState';
import { DocumentViewer } from '../components/DocumentViewer';
import { PageThumbnails } from '../components/PageThumbnails';
import { ExtractionPanel } from '../components/ExtractionPanel';
import { EvidencePanel } from '../components/EvidencePanel';
import { ReviewActions } from '../components/ReviewActions';
import { AmbiguousPatientResolutionModal } from '../components/AmbiguousPatientResolutionModal';
import { approveReview, saveReview } from '../services/ocrLayoutService';
import { ApiError, finalizeDocument, resolveAmbiguousPatient } from '@/services/documents';
import type { FinalizeDocumentResponse, PatientMatchCandidate } from '@/types/documents';

type SubmissionState =
  | { kind: 'idle'; message: string }
  | { kind: 'saving_review'; message: string }
  | { kind: 'approving'; message: string }
  | { kind: 'finalizing'; message: string }
  | { kind: 'success'; message: string; patientId?: string }
  | { kind: 'ambiguous_match'; message: string; candidates: PatientMatchCandidate[] }
  | { kind: 'error'; message: string };

export function OcrReviewPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { document, updateDocument } = useOcrReview(documentId);
  const [submission, setSubmission] = useState<SubmissionState>({ kind: 'idle', message: '' });
  const [isResolvingMatch, setIsResolvingMatch] = useState(false);
  const [reviewProgress, setReviewProgress] = useState<string | null>(null);
  const pages = useDocumentPages(document);
  const [page, setPage] = useState(1);
  const [selectedOcrText, setSelectedOcrText] = useState<string | null>(null);
  const review = useReviewState(document?.parsed?.evidence ?? []);
  if (!document) return <section className="card docdai-surface border-0 rounded-4"><div className="card-body p-5 text-center"><h2 className="h4">Documento no disponible en esta sesión</h2><p className="text-secondary">Por privacidad, los datos de OCR no se guardan en el navegador. Procesa el documento de nuevo para revisarlo.</p><Link className="btn btn-primary" to="/doctor/uploads">Cargar documento</Link></div></section>;
  const selectedPage = pages.find((item) => item.number === page) ?? pages[0];

  const reviewedBy = null;
  const debug = (event: string, metadata: Record<string, unknown> = {}) => {
    if (import.meta.env.DEV) console.info(`[DocDaiWeb] ${event}`, metadata);
  };
  const handleReviewUpdate = (patch: { value?: string; status?: 'pending_review' | 'approved' | 'corrected' | 'rejected' }) => {
    if (!review.selected) return;
    review.update(review.selected.id, patch);
  };
  const handleReviewDecision = (status: 'approved' | 'corrected' | 'rejected', value?: string) => {
    if (!review.selected) return;
    const currentField = review.selected;
    const remaining = currentField.status === 'pending_review' ? review.pending - 1 : review.pending;
    review.decide(currentField.id, status, value ? { value } : undefined);
    debug('Decisión de revisión registrada', { documentId, field: currentField.evidence.field, status, pendingFields: remaining });
    setReviewProgress(`Campo validado. ${remaining > 0 ? `Se seleccionó automáticamente el siguiente pendiente (${remaining} restantes).` : 'La revisión está lista para aprobar y finalizar.'}`);
  };
  const handleApproveAllPending = () => {
    if (review.pending === 0) return;
    debug('Aprobación masiva de revisión', { documentId, approvedFields: review.pending });
    review.approveAllPending();
    setReviewProgress('Todos los campos pendientes fueron aprobados por el profesional. La revisión está lista para finalizar.');
  };
  const handleOcrSelect = (text: string) => {
    setSelectedOcrText(text);
    if (!review.selected) return;
    handleReviewDecision('corrected', text);
  };

  const save = async () => {
    if (!documentId) return;
    setSubmission({ kind: 'saving_review', message: 'Guardando revisión clínica...' });
    try {
      const response = await saveReview(documentId, review.fields, reviewedBy);
      setSubmission({ kind: 'success', message: `Revisión guardada. ${response.summary.total_fields} campos sincronizados.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible guardar la revisión.';
      setSubmission({ kind: 'error', message });
    }
  };

  const finalize = async (): Promise<FinalizeDocumentResponse | null> => {
    if (!documentId) return null;
    debug('Inicio finalize', { documentId, patientId: document.targetPatientId ?? null });
    setSubmission({ kind: 'finalizing', message: 'Creando o actualizando expediente...' });
    try {
      const result = await finalizeDocument(documentId, document.targetPatientId);
      debug('Respuesta finalize', { documentId, action: result.action, patientId: result.patient?.id ?? null });
      if (result.action === 'ambiguous_match') {
        setSubmission({ kind: 'ambiguous_match', message: 'Selecciona el expediente correcto o confirma que se trata de un paciente nuevo.', candidates: result.candidates });
      } else if (result.patient) {
        updateDocument(document.id, { patientId: result.patient.id, patientName: result.patient.name ?? undefined });
        setSubmission({ kind: 'success', message: result.action === 'created' ? 'Nuevo expediente creado.' : 'Expediente actualizado.', patientId: result.patient.id });
      } else {
        setSubmission({ kind: 'error', message: 'El expediente se finalizó sin datos de paciente disponibles.' });
      }
      return result;
    } catch (error) {
      const message = error instanceof ApiError
        ? ({
            400: 'La solicitud para finalizar el documento no es válida.',
            404: 'El documento ya no está disponible para finalizarse.',
            409: 'No es posible finalizar el documento porque la revisión aún no está aprobada.',
            422: 'El documento requiere correcciones antes de poder finalizarse.',
            500: 'No fue posible finalizar el expediente. Intenta nuevamente.',
          }[error.status ?? 0] ?? error.message)
        : error instanceof Error ? error.message : 'No fue posible finalizar el documento.';
      setSubmission({ kind: 'error', message });
      return null;
    }
  };

  const navigateToPatient = (result: FinalizeDocumentResponse) => {
    if (!result.patient) return;
    updateDocument(document.id, { patientId: result.patient.id, patientName: result.patient.name ?? undefined });
    navigate(`/doctor/patients/${result.patient.id}`, { replace: true, state: { action: result.action } });
  };

  const resolvePatientMatch = async (action: 'existing_patient' | 'create_new_patient', patientId?: string) => {
    if (!documentId) return;
    setIsResolvingMatch(true);
    try {
      const result = await resolveAmbiguousPatient(documentId, action, patientId);
      if (!result.patient) throw new Error('No fue posible finalizar el expediente con la decisión seleccionada.');
      navigateToPatient(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible resolver la coincidencia clínica.';
      setSubmission((current) => current.kind === 'ambiguous_match' ? { ...current, message } : current);
    } finally {
      setIsResolvingMatch(false);
    }
  };

  const handleApproveAndFinalize = async () => {
    if (!documentId) return;
    debug('Inicio review/approve', { documentId, patientId: document.targetPatientId ?? null });
    setSubmission({ kind: 'approving', message: 'Aprobando y registrando la validación clínica...' });
    try {
      const response = await approveReview(documentId, review.fields, reviewedBy);
      debug('Respuesta review/approve', { documentId, status: response.status, pendingFields: response.summary.pending_fields });
      updateDocument(document.id, {
        stage: 'approved',
        parsed: response.parsed_information,
      });
      const result = await finalize();
      if (!result) return;
      if (result.patient && (result.action === 'created' || result.action === 'updated')) {
        const destination = `/doctor/patients/${result.patient.id}`;
        debug('Navegación a expediente', { documentId, patientId: result.patient.id, destination });
        navigate(destination, { replace: true, state: { action: result.action } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible aprobar la revisión.';
      setSubmission({ kind: 'error', message });
    }
  };

  return (
    <div className="docdai-ocr-review">
      <header className="docdai-review-heading">
        <div>
          <span className="docdai-eyebrow">Revisión humana requerida</span>
          <h1>{document.filename}</h1>
          <p>Documento original → extracción → validación humana. Ningún dato se aprueba automáticamente.</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/doctor/documents">
          Volver a documentos
        </Link>
      </header>

      {review.pending > 0 ? <div className="alert alert-info mb-0" role="status"><strong>Faltan {review.pending} campos por validar.</strong> Selecciona cada campo extraído y usa “Aprobar campo”, “Marcar corregido” o “Rechazar”. La finalización se habilita cuando no queden campos pendientes.</div> : <div className="alert alert-success mb-0" role="status"><strong>Revisión lista para finalizar.</strong> Confirma la aprobación para crear o actualizar el expediente.</div>}
      {reviewProgress ? <p className="small text-secondary mb-0" role="status">{reviewProgress}</p> : null}

      {submission.kind !== 'idle' ? (
        <div className={`alert ${submission.kind === 'error' ? 'alert-danger' : submission.kind === 'ambiguous_match' ? 'alert-warning' : 'alert-success'} mb-0`} role="status">
          {submission.message}
          {submission.kind === 'success' && submission.patientId ? (
            <button type="button" className="btn btn-sm btn-success ms-3" onClick={() => navigate(`/doctor/patients/${submission.patientId}`)}>Ver expediente</button>
          ) : null}
          {submission.kind === 'error' && document.stage === 'approved' ? (
            <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={() => void finalize()}>Reintentar finalización</button>
          ) : null}
        </div>
      ) : null}

      {submission.kind === 'ambiguous_match' ? <AmbiguousPatientResolutionModal candidates={submission.candidates} busy={isResolvingMatch} onLink={(patientId) => void resolvePatientMatch('existing_patient', patientId)} onCreateNew={() => void resolvePatientMatch('create_new_patient')} /> : null}

      <div className="docdai-review-grid">
        <PageThumbnails pages={pages} selected={page} onSelect={setPage} />
        <DocumentViewer page={selectedPage} totalPages={pages.length} filename={document.filename} onOcrSelect={handleOcrSelect} />
        <ExtractionPanel fields={review.fields} selectedId={review.selectedId} onSelect={review.setSelectedId} />
      </div>

      <EvidencePanel field={review.selected} onUpdate={handleReviewUpdate} onDecide={handleReviewDecision} />

      {selectedOcrText ? (
        <details className="docdai-ocr-details" open>
          <summary>Texto OCR seleccionado</summary>
          <pre>{selectedOcrText}</pre>
        </details>
      ) : null}

      {document.ocr ? (
        <details className="docdai-ocr-details">
          <summary>Texto OCR de referencia</summary>
          <pre>{document.ocr.text}</pre>
        </details>
      ) : null}

      <ReviewActions
        pending={review.pending}
        busy={submission.kind === 'saving_review' || submission.kind === 'approving' || submission.kind === 'finalizing'}
        approved={document.stage === 'approved'}
        onSave={save}
        onApproveAll={handleApproveAllPending}
        onApprove={handleApproveAndFinalize}
      />
    </div>
  );
}
