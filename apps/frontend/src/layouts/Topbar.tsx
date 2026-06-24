import { useMemo } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { getInitials } from '@/utils/formatters';

interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { user, logout } = useAuth();

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [],
  );

  if (!user) {
    return null;
  }

  return (
    <header className="docdai-topbar border-bottom border-white border-opacity-10 px-3 px-md-4 py-3 sticky-top">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <div className="small text-secondary text-uppercase fw-semibold mb-1">{currentDate}</div>
          <h1 className="h4 mb-1 docdai-section-title">{title}</h1>
          <div className="text-secondary">{subtitle}</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-md-block">
            <div className="small text-secondary">{user.organization ?? 'Patient portal'}</div>
            <div className="fw-semibold">{user.name}</div>
          </div>
          <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold" style={{ width: '2.75rem', height: '2.75rem' }}>
            {getInitials(user.name)}
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
