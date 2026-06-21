import EventCard from './EventCard';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

export default function EventGrid({ events, loading }) {
  if (loading) {
    return (
      <div className="events-grid">
        {Array(3).fill(0).map((_, i) => (
          <div className="event-card" key={i}>
            <Skeleton height={190} />
            <div className="event-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton height={12} width="60%" />
              <Skeleton height={18} width="85%" />
              <Skeleton height={32} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return <div className="events-grid"><EmptyState /></div>;
  }

  return (
    <div className="events-grid">
      {events.map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
    </div>
  );
}
