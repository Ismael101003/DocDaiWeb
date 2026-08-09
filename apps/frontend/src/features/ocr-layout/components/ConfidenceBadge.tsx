export function ConfidenceBadge({ confidence }: { confidence: number | null | undefined }) {
  if (confidence === null || confidence === undefined) return <span className="docdai-confidence docdai-confidence-muted">Confianza no disponible</span>;
  return <span className="docdai-confidence">{Math.round(confidence * 100)}% confianza</span>;
}
