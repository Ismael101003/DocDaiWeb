export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const confidenceTone = (confidence: number) => {
  if (confidence >= 90) return 'success';
  if (confidence >= 75) return 'warning';
  return 'danger';
};

export const statusTone = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized.includes('final') || normalized.includes('stable') || normalized.includes('processed')) {
    return 'success';
  }

  if (normalized.includes('pending') || normalized.includes('monitor')) {
    return 'warning';
  }

  return 'danger';
};

export const homePathForRole = (role: 'doctor' | 'patient') =>
  role === 'doctor' ? '/doctor' : '/patient';
