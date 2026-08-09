import type { ReviewStatus as Status } from '../types/ocrLayout.types';
const labels: Record<Status, string> = { pending_review: 'Pendiente', approved: 'Revisado', corrected: 'Corregido', rejected: 'Rechazado' };
export function ReviewStatus({ status }: { status: Status }) { return <span className={`docdai-review-status is-${status}`}>{labels[status]}</span>; }
