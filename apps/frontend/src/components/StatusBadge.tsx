export function StatusBadge({ confidence }: { confidence: number }) {
  const className = confidence >= 90 ? 'text-bg-success' : confidence >= 70 ? 'text-bg-warning' : 'text-bg-danger';

  return <span className={`badge ${className}`}>{confidence}%</span>;
}
