import { confidenceTone } from '@/utils/formatters';

interface StatusBadgeProps {
  confidence: number;
  label?: string;
}

export function StatusBadge({ confidence, label }: StatusBadgeProps) {
  const tone = confidenceTone(confidence);

  return (
    <span className={`badge rounded-pill text-bg-${tone}`}>
      {label ?? `${confidence}% confidence`}
    </span>
  );
}
