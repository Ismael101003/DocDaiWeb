import { useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '@/app/providers/DocumentsProvider';
import { extractOCR, parseMedicalInformation, prepareDocument, uploadDocument } from '@/services/documents';
import type { AsyncState, DocumentStage, ProcessingDocument } from '@/types/documents';

const accepted = ['application/pdf', 'image/png', 'image/jpeg'];
const steps: Array<{ key: DocumentStage; label: string; description: string }> = [
  { key: 'stored', label: 'Carga', description: 'Archivo validado y almacenado temporalmente' },
  { key: 'prepared', label: 'Preparar', description: 'Páginas normalizadas para OCR' },
  { key: 'processed', label: 'OCR', description: 'Texto y confianza extraídos por PaddleOCR' },
  { key: 'pending_human_review', label: 'Parsear', description: 'Campos y evidencia listos para verificación humana' },
];
const stageIndex = (stage: DocumentStage) => steps.findIndex((step) => step.key === stage);

export function UploadDocumentPage() {
  const { activeDocument, addDocument, updateDocument, selectDocument } = useDocuments();
  const [file, setFile] = useState<File | null>(null); const [state, setState] = useState<AsyncState>('idle'); const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pick = (candidate: File | null) => { if (!candidate) return; if (!accepted.includes(candidate.type)) { setError('Selecciona un PDF, PNG, JPG o JPEG.'); return; } setFile(candidate); setError(null); };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); pick(event.dataTransfer.files[0] ?? null); };
  const run = async () => {
    try {
      setState('loading'); setError(null);
      if (!activeDocument) { if (!file) throw new Error('Selecciona un documento antes de continuar.'); const response = await uploadDocument(file); const next: ProcessingDocument = { id: response.document_id, filename: response.filename, size: file.size, createdAt: new Date().toISOString(), stage: 'stored', previewUrl: URL.createObjectURL(file) }; addDocument(next); setFile(null); setState('success'); return; }
      if (activeDocument.stage === 'stored') { const response = await prepareDocument(activeDocument.id); updateDocument(activeDocument.id, { stage: 'prepared', pages: response.pages }); }
      else if (activeDocument.stage === 'prepared') { const response = await extractOCR(activeDocument.id); updateDocument(activeDocument.id, { stage: 'processed', pages: response.pages, ocr: response }); }
      else if (activeDocument.stage === 'processed') { const response = await parseMedicalInformation(activeDocument.id); updateDocument(activeDocument.id, { stage: 'pending_human_review', parsed: response }); }
      setState('success');
    } catch (cause) { setState('error'); setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.'); }
  };
  const action = !activeDocument ? 'Cargar documento' : activeDocument.stage === 'stored' ? 'Preparar páginas' : activeDocument.stage === 'prepared' ? 'Ejecutar OCR' : activeDocument.stage === 'processed' ? 'Extraer información' : 'Abrir revisión humana';
  return <div className="d-grid gap-4">
    <section className="docdai-process-hero"><div><span className="docdai-eyebrow">Cadena de custodia documental</span><h2>Del escaneo a una revisión clínica trazable.</h2><p>DocDaiWeb no aprueba resultados automáticamente: cada extracción queda visible con su evidencia antes de cualquier decisión humana.</p></div><Link className="btn btn-light" to="/doctor/documents">Ver documentos</Link></section>
    <section className="card docdai-surface border-0 rounded-4"><div className="card-body p-4 p-xl-5"><div className="row g-4 align-items-center"><div className="col-lg-5"><h3 className="h5">1. Selecciona el documento</h3><p className="text-secondary">PDF, PNG, JPG o JPEG. El archivo se envía mediante el endpoint real de carga.</p><div className="docdai-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') inputRef.current?.click(); }}><strong>{file?.name ?? 'Arrastra el archivo aquí'}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB · listo para cargar` : 'o selecciónalo desde tu equipo'}</span><input ref={inputRef} className="d-none" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => pick(event.target.files?.[0] ?? null)} /></div></div><div className="col-lg-7"><div className="docdai-stepper">{steps.map((step, index) => { const current = activeDocument ? stageIndex(activeDocument.stage) : -1; const completed = index <= current; return <div className={`docdai-step ${completed ? 'is-complete' : ''}`} key={step.key}><div className="docdai-step-marker">{index + 1}</div><div><strong>{step.label}</strong><span>{step.description}</span></div></div>; })}</div></div></div>
      <div className="d-flex flex-wrap gap-3 align-items-center mt-4"><button className="btn btn-primary" type="button" disabled={state === 'loading' || (!activeDocument && !file)} onClick={async () => { if (activeDocument?.stage === 'pending_human_review') { selectDocument(activeDocument.id); return; } await run(); }}>{state === 'loading' ? 'Procesando…' : action}</button>{activeDocument?.stage === 'pending_human_review' ? <Link className="btn btn-outline-primary" to={`/doctor/review/${activeDocument.id}`}>Revisar resultados</Link> : null}<span className="small text-secondary">{activeDocument ? `ID: ${activeDocument.id}` : 'Aún no se ha enviado ningún archivo.'}</span></div>
      {error ? <div className="alert alert-danger mt-3 mb-0">{error}</div> : null}{state === 'success' ? <div className="alert alert-success mt-3 mb-0">Paso completado. Continúa con el siguiente control del flujo.</div> : null}
    </div></section>
  </div>;
}
