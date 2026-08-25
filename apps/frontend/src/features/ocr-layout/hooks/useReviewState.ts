import { useMemo, useState } from 'react';
import type { Evidence } from '@/types/documents';
import { normalizeEvidence } from '../utils/normalizeEvidence';
import type { ReviewStatus } from '../types/ocrLayout.types';

export function useReviewState(evidence: Evidence[]) {
  const initial = useMemo(() => normalizeEvidence(evidence), [evidence]);
  const [fields, setFields] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const selected = fields.find((field) => field.id === selectedId) ?? null;
  const update = (id: string, patch: { value?: string; status?: ReviewStatus }) => setFields((current) => current.map((field) => field.id === id ? { ...field, ...patch } : field));
  const decide = (id: string, status: Exclude<ReviewStatus, 'pending_review'>, patch: { value?: string } = {}) => {
    const updated = fields.map((field) => field.id === id ? { ...field, ...patch, status } : field);
    const currentIndex = fields.findIndex((field) => field.id === id);
    const next = [...updated.slice(currentIndex + 1), ...updated.slice(0, currentIndex)].find((field) => field.status === 'pending_review');
    setFields(updated);
    setSelectedId(next?.id ?? id);
  };
  const approveAllPending = () => {
    setFields((current) => current.map((field) => field.status === 'pending_review' ? { ...field, status: 'approved' } : field));
    setSelectedId(null);
  };
  const pending = fields.filter((field) => field.status === 'pending_review').length;
  return { fields, selected, selectedId, setSelectedId, update, decide, approveAllPending, pending };
}
