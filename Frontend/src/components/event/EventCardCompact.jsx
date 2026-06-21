import { useNavigate } from 'react-router-dom';
import { formatKES, formatDateBadge } from '../../lib/utils';
import { ROUTES } from '../../config/routes';

export default function EventCardCompact({ event, index = 0 }) {
  const navigate     = useNavigate();
  const { month, day } = formatDateBadge(event.eventDate);
  const price        = formatKES(event.ticketPrice);

  return (
    <div
      className="upcoming-item fade-up"
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={() => navigate(ROUTES.EVENT(event.id))}
    >
      <div className="date-badge">
        <div className="month">{month}</div>
        <div className="day">{day}</div>
      </div>
      <div className="upcoming-info">
        <div className="upcoming-title">{event.title}</div>
        <div className="upcoming-sub">{event.venue} &nbsp;·&nbsp; {event.eventTime}</div>
      </div>
      <div className="upcoming-right">
        <span className="upcoming-price">{price}</span>
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); navigate(ROUTES.EVENT(event.id)); }}
        >Tickets</button>
      </div>
    </div>
  );
}
