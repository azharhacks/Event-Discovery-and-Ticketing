import { useNavigate } from 'react-router-dom';
import { formatKES, formatDate } from '../../lib/utils';
import { ROUTES } from '../../config/routes';

export default function EventCard({ event, index = 0 }) {
  const navigate = useNavigate();
  const isFree   = Number(event.ticketPrice) === 0;
  const price    = formatKES(event.ticketPrice);
  const badgeText  = event.badge || (isFree ? 'FREE' : 'FEATURED');
  const badgeClass = isFree ? 'badge-free' : 'badge-featured';
  const meta     = `${formatDate(event.eventDate)} · ${event.venue}`;

  return (
    <div
      className="event-card fade-up"
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={() => navigate(ROUTES.EVENT(event.id))}
    >
      <div className="event-card-img">
        {event.img ? (
          <img
            src={event.img}
            alt={event.title}
            loading="lazy"
            onError={(e) => { e.target.parentElement.style.background = 'var(--light)'; }}
          />
        ) : (
          <div className={`img-placeholder card-grad-${(index % 6) + 1}`} />
        )}
        <span className={`event-badge ${badgeClass}`}>{badgeText}</span>
      </div>
      <div className="event-card-body">
        <p className="event-meta">{meta}</p>
        <h3 className="event-card-title">{event.title}</h3>
        {event.description && (
          <p className="event-card-desc">{event.description}</p>
        )}
        <div className="event-card-footer">
          <span className={`event-price ${isFree ? 'free' : ''}`}>{price}</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => { e.stopPropagation(); navigate(ROUTES.EVENT(event.id)); }}
          >Tickets</button>
        </div>
      </div>
    </div>
  );
}
