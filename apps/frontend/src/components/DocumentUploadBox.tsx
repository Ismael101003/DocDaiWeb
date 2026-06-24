import type { ChangeEvent } from 'react';
import type { UploadStatus } from '@/types/medical';

interface DocumentUploadBoxProps {
  fileName: string | null;
  status: UploadStatus;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

const statusCopy: Record<UploadStatus, { tone: string; title: string; body: string }> = {
  idle: {
    tone: 'secondary',
    title: 'Ready to upload',
    body: 'PDF and image files are queued for OCR, extraction, and human review.',
  },
  processing: {
    tone: 'warning',
    title: 'Processing document',
    body: 'OCR is extracting text and checking the structure before the chart is updated.',
  },
  success: {
    tone: 'success',
    title: 'Upload complete',
    body: 'The document was processed and is ready for review in the validation queue.',
  },
  error: {
    tone: 'danger',
    title: 'Upload needs attention',
    body: 'The file could not be processed. Check the file type and try again.',
  },
};

export function DocumentUploadBox({ fileName, status, onFileChange, onUpload }: DocumentUploadBoxProps) {
  const copy = statusCopy[status];

  return (
    <div className="card docdai-surface border-0 rounded-4">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
          <div>
            <h2 className="h5 mb-2">Upload a clinical document</h2>
            <p className="mb-0 text-secondary">
              Add PDFs, scans, or photos. The OCR pipeline keeps the human validation gate in place.
            </p>
          </div>
          <span className={`badge text-bg-${copy.tone}`}>{copy.title}</span>
        </div>

        <div className="mb-3">
          <label className="form-label fw-medium" htmlFor="document-upload">
            File
          </label>
          <input
            id="document-upload"
            type="file"
            className="form-control"
            accept="application/pdf,image/*"
            onChange={onFileChange}
          />
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <button type="button" className="btn btn-primary" onClick={onUpload} disabled={!fileName || status === 'processing'}>
            {status === 'processing' ? 'Processing…' : 'Start upload'}
          </button>
          <span className="small text-secondary">{fileName ?? 'No file selected yet'}</span>
        </div>

        <div className={`alert alert-${copy.tone} mb-0`} role="status">
          <div className="fw-semibold mb-1">{copy.title}</div>
          <div>{copy.body}</div>
        </div>
      </div>
    </div>
  );
}
