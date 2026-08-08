import { useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '@/app/providers/DocumentsProvider';
import { MedicalInformation } from '@/features/doctor/processing/MedicalInformation';
import { OCRResult } from '@/features/doctor/processing/OCRResult';
import { ProcessingLog } from '@/features/doctor/processing/ProcessingLog';
import { ProcessingStepper } from '@/features/doctor/processing/ProcessingStepper';
import { useDocumentProcessing } from '@/features/doctor/processing/useDocumentProcessing';
import type { PipelineStep } from '@/types/documents';

const accepted = ['application/pdf', 'image/png', 'image/jpeg'];
const completedStep = (stage?: string): PipelineStep | null => stage === 'pending_human_review' ? 'parse' : stage === 'processed' ? 'ocr' : stage === 'prepared' ? 'prepare' : stage === 'stored' ? 'upload' : null;

export function UploadDocumentPage() {
  const { activeDocument } = useDocuments(); const { events, processingStep, completedThrough, failedStep, error, perform } = useDocumentProcessing();
  const [file, setFile] = useState<File | null>(null); const inputRef = useRef<HTMLInputElement>(null);
  const pick = (candidate: File | null) => { if (!candidate) return; if (!accepted.includes(candidate.type)) return; setFile(candidate); };
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); pick(event.dataTransfer.files[0] ?? null); };
  const busy = processingStep !== null;
  return <div className="d-grid gap-4">
    <section className="docdai-process-hero"><div><span className="docdai-eyebrow">Trazabilidad del procesamiento</span><h2>Una lectura clínica, paso a paso y verificable.</h2><p>Cada evento aparece cuando el frontend inicia una operación o recibe una respuesta real del backend. La aprobación sigue siendo humana.</p></div><Link className="btn btn-light" to="/doctor/documents">Ver documentos</Link></section>
    <section className="card docdai-surface border-0 rounded-4"><div className="card-body p-4 p-xl-5"><div className="row g-4"><div className="col-lg-5"><h3 className="h5">Selecciona un documento</h3><p className="text-secondary">Al cargarlo, DocDaiWeb ejecuta upload, prepare, OCR y parse de forma secuencial.</p><div className="docdai-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={drop} onClick={() => !busy && inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' && !busy) inputRef.current?.click(); }}><strong>{file?.name ?? 'Arrastra el archivo aquí'}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB · listo para procesar` : 'PDF, PNG, JPG o JPEG'}</span><input ref={inputRef} className="d-none" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={busy} onChange={(event) => pick(event.target.files?.[0] ?? null)} /></div><button className="btn btn-primary mt-3" type="button" disabled={!file || busy} onClick={() => { void perform(file ?? undefined); setFile(null); }}>{busy ? 'Procesando documento…' : 'Cargar y procesar'}</button></div><div className="col-lg-7"><ProcessingStepper current={processingStep} failed={failedStep} completeThrough={completedThrough ?? completedStep(activeDocument?.stage)} />{error ? <div className="alert alert-danger mt-3 mb-0"><strong>{failedStep === 'ocr' ? 'Error durante OCR.' : failedStep === 'parse' ? 'Error al estructurar información.' : 'Error durante el procesamiento.'}</strong><br />{error}<button className="btn btn-sm btn-outline-danger ms-3" type="button" onClick={() => void perform()}>Reintentar</button></div> : null}</div></div></div></section>
    <div className="row g-4"><div className="col-xl-5"><ProcessingLog events={events} /></div><div className="col-xl-7 d-grid gap-4">{activeDocument?.ocr ? <OCRResult result={activeDocument.ocr} /> : null}{activeDocument?.parsed ? <MedicalInformation information={activeDocument.parsed} /> : null}{activeDocument?.stage === 'pending_human_review' ? <div className="alert alert-info mb-0">👤 <strong>Pendiente de revisión humana.</strong> La interfaz de aprobación está disponible, pero la persistencia se implementará cuando exista un endpoint.</div> : null}</div></div>
  </div>;
}
