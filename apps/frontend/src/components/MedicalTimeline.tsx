import type { TimelineEvent } from '@/types/medical';
import { formatDateTime } from '@/utils/formatters';

interface MedicalTimelineProps {
  events: TimelineEvent[];
}

const toneMap: Record<TimelineEvent['tone'], string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export function MedicalTimeline({ events }: MedicalTimelineProps) {
  return (
    <div className="card docdai-surface border-0 rounded-4 h-100">
      <div className="card-body p-4 p-xl-5">
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="h5 mb-1">Clinical timeline</h2>
            <p className="mb-0 text-secondary">Key events from OCR, uploads, and review checkpoints.</p>
          </div>
        </div>

        <div className="position-relative ps-4">
          <div className="position-absolute top-0 bottom-0 start-0 ms-1 docdai-timeline-line" />
          <div className="d-grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="position-relative">
                <div className={`position-absolute start-0 translate-middle-x mt-1 ${toneMap[event.tone]} docdai-timeline-dot`} />
                <div className="ps-3">
                  <div className="small text-secondary mb-1">{formatDateTime(event.date)}</div>
                  <div className="fw-semibold">{event.title}</div>
                  <div className="text-secondary">{event.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
