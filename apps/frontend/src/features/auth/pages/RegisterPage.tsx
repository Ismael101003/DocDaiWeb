import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { homePathForRole } from '@/utils/formatters';

export function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('Maria Torres');
  const [email, setEmail] = useState('maria@example.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register({ name, email, password, role });
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center g-4">
          <div className="col-12 col-md-11 col-lg-8 col-xl-7">
            <div className="card docdai-surface border-0 rounded-4">
              <div className="card-body p-4 p-xl-5">
                <div className="mb-4">
                  <span className="badge text-bg-secondary mb-3">Create account</span>
                  <h1 className="h3 mb-2">Register for the clinical workspace</h1>
                  <p className="text-secondary mb-0">
                    New accounts start with local mock storage and can be swapped for an API-backed auth flow later.
                  </p>
                </div>

                <form className="row g-3" onSubmit={handleSubmit}>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="register-name">
                      Full name
                    </label>
                    <input id="register-name" className="form-control" value={name} onChange={(event) => setName(event.target.value)} required />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="register-role">
                      Role
                    </label>
                    <select id="register-role" className="form-select" value={role} onChange={(event) => setRole(event.target.value as 'doctor' | 'patient')}>
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="register-email">
                      Email
                    </label>
                    <input id="register-email" type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="register-password">
                      Password
                    </label>
                    <input id="register-password" type="password" className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  </div>

                  <div className="col-12 d-grid gap-3 mt-2">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating account…' : 'Create account'}
                    </button>
                    <div className="text-center text-secondary">
                      Already registered?{' '}
                      <Link to="/login" className="fw-semibold">
                        Sign in
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
