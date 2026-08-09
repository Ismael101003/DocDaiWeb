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
  const pending = fields.filter((field) => field.status === 'pending_review').length;
  return { fields, selected, selectedId, setSelectedId, update, pending };
}
