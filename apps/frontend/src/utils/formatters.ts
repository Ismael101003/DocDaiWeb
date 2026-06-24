export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-ES', {
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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const statusTone = (status: string) => {
  const normalized = normalizeText(status);

  if (normalized.includes('final') || normalized.includes('establ') || normalized.includes('procesad')) {
    return 'success';
  }

  if (normalized.includes('pendient') || normalized.includes('seguim') || normalized.includes('marcad')) {
    return 'warning';
  }

  return 'danger';
};

export const homePathForRole = (role: 'doctor' | 'patient') =>
  role === 'doctor' ? '/doctor' : '/patient';
