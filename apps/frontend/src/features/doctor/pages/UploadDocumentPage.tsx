import { useEffect, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { DocumentUploadBox } from '@/components/DocumentUploadBox';
import type { UploadStatus } from '@/types/medical';

export function UploadDocumentPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');

  useEffect(() => {
    if (status !== 'processing') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setStatus('success'), 1300);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFileName(null);
      setStatus('idle');
      return;
    }

    setFileName(selectedFile.name);
    setStatus('idle');
  };

  const handleUpload = () => {
    if (!fileName) {
      setStatus('error');
      return;
    }

    setStatus('processing');
  };

  return (
    <div className="d-grid gap-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <h2 className="h4 mb-2">Upload document</h2>
          <p className="text-secondary mb-0">Prepare PDFs or images for OCR, extraction, and review.</p>
        </div>
        <Link to="/doctor/patients" className="btn btn-outline-secondary">
          Open patients
        </Link>
      </div>

      <DocumentUploadBox fileName={fileName} status={status} onFileChange={handleFileChange} onUpload={handleUpload} />

      <div className="row g-3">
        <div className="col-12 col-lg-4">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <div className="fw-semibold mb-2">Processing pipeline</div>
              <p className="text-secondary mb-0">Upload to OCR to NLP to validation. The workflow pauses when confidence is low.</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <div className="fw-semibold mb-2">Supported inputs</div>
              <p className="text-secondary mb-0">PDF, JPG, PNG, and other image-based records from clinics or patient devices.</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card docdai-surface border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <div className="fw-semibold mb-2">API placeholder</div>
              <p className="text-secondary mb-0">This screen is wired for a future upload endpoint and progress events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
