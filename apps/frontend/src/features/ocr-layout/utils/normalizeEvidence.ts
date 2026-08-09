import type { Evidence } from '@/types/documents';
import type { ReviewField, ReviewStatus } from '../types/ocrLayout.types';

const statuses: ReviewStatus[] = ['pending_review', 'approved', 'corrected', 'rejected'];

export function normalizeEvidence(evidence: Evidence[]): ReviewField[] {
  return evidence.map((item, index) => ({
    id: `${item.field}-${index}`,
    evidence: item,
    originalValue: item.value,
    value: item.value,
    status: statuses.includes(item.status as ReviewStatus) ? item.status as ReviewStatus : 'pending_review',
  }));
}
