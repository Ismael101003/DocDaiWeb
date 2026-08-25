import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProcessingLog } from '../processing/ProcessingLog';
import { ProcessingStepper } from '../processing/ProcessingStepper';
import { useDocumentProcessing } from '../processing/useDocumentProcessing';

export function DocumentUploadPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { events, processingStep, completedThrough, failedStep, error, perform } = useDocumentProcessing(patientId);
  const isBusy = processingStep !== null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || isBusy) return;
    const documentId = await perform(selectedFile);
    if (documentId) navigate(`/doctor/documents/${documentId}/review`, { replace: true });
  };

  return <div className="container-fluid">
    <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
      <div><h1 className="h3 mb-1">Cargar documento</h1><p className="text-body-secondary mb-0">{patientId ? `Documento para el paciente seleccionado (${patientId}).` : 'El documento se procesa en el backend y requiere revisión humana antes de aprobarse.'}</p></div>
      <Link className="btn btn-outline-secondary align-self-md-start" to="/doctor/documents">Ver documentos</Link>
    </div>
    <div className="row g-4">
      <div className="col-lg-5">
        <form className="card shadow-sm" onSubmit={submit}>
          <div className="card-body p-4">
            <label className="form-label fw-semibold" htmlFor="document-file">Archivo médico</label>
            <input ref={inputRef} className="form-control" id="document-file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={isBusy} onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            <p className="small text-body-secondary mt-2 mb-4">PDF, PNG, JPG o JPEG. El archivo se conserva temporalmente para este flujo.</p>
            <button className="btn btn-primary" type="submit" disabled={!selectedFile || isBusy}>{isBusy ? 'Procesando…' : 'Procesar documento'}</button>
            {error ? <div className="alert alert-danger mt-3 mb-0" role="alert">{error}</div> : null}
          </div>
        </form>
      </div>
      <div className="col-lg-7"><ProcessingStepper current={processingStep} failed={failedStep} completeThrough={completedThrough} /><ProcessingLog events={events} /></div>
    </div>
    {patientId ? <div className="alert alert-info mt-4 mb-0">Este documento conservará el paciente objetivo durante la revisión y la finalización.</div> : null}
  </div>;
}
