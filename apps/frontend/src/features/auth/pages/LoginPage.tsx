import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { homePathForRole } from '@/utils/formatters';

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('Dr. Sofia Alvarez');
  const [email, setEmail] = useState('sofia@docdaiweb.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<'doctor' | 'patient'>('doctor');
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
      await login({ name, email, password, role });
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center align-items-center g-4">
          <div className="col-12 col-lg-5">
            <div className="pe-lg-4">
              <span className="badge text-bg-primary mb-3">DocDaiWeb</span>
              <h1 className="display-6 fw-bold mb-3">Medical OCR workspace for faster clinical review.</h1>
              <p className="lead text-secondary mb-4">
                Sign in to a role-aware dashboard built for doctors and patients, with human validation preserved for every uncertain extraction.
              </p>
              <div className="card docdai-surface border-0 rounded-4">
                <div className="card-body p-4">
                  <div className="fw-semibold mb-2">Session defaults</div>
                  <ul className="mb-0 text-secondary">
                    <li>Mock users are stored in localStorage for now.</li>
                    <li>Route guards redirect after authentication.</li>
                    <li>Bootstrap-only UI with responsive layout primitives.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="card docdai-surface border-0 rounded-4">
              <div className="card-body p-4 p-xl-5">
                <h2 className="h4 mb-2">Welcome back</h2>
                <p className="text-secondary mb-4">Use the sample credentials to explore the doctor and patient flows.</p>

                <form className="d-grid gap-3" onSubmit={handleSubmit}>
                  <div>
                    <label className="form-label" htmlFor="login-name">
                      Full name
                    </label>
                    <input id="login-name" className="form-control" value={name} onChange={(event) => setName(event.target.value)} required />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="login-email">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="login-password">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" htmlFor="login-role">
                      Role
                    </label>
                    <select id="login-role" className="form-select" value={role} onChange={(event) => setRole(event.target.value as 'doctor' | 'patient')}>
                      <option value="doctor">Doctor</option>
                      <option value="patient">Patient</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <span className="text-secondary">Need an account?</span>
                  <Link to="/register" className="fw-semibold">
                    Create one
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
