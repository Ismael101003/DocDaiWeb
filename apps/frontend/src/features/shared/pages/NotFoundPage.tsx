import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card docdai-surface border-0 rounded-4 text-center">
            <div className="card-body p-5">
              <div className="display-6 fw-bold mb-3">404</div>
              <h1 className="h4 mb-2">Page not found</h1>
              <p className="text-secondary mb-4">
                The requested route does not exist in this medical workspace.
              </p>
              <Link to="/dashboard" className="btn btn-primary">
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
