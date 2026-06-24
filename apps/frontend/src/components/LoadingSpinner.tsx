interface LoadingSpinnerProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ label = 'Loading', fullScreen = false }: LoadingSpinnerProps) {
  return (
    <div
      className={fullScreen ? 'd-flex min-vh-100 align-items-center justify-content-center' : 'd-flex align-items-center gap-2'}
    >
      <div className="spinner-border text-primary" role="status" aria-hidden="true" />
      <span className="fw-medium text-secondary">{label}</span>
    </div>
  );
}
