import { useNavigate } from 'react-router-dom';
import { formatKES, formatDate } from '../../lib/utils';
import { getEventImageUrl } from '../../lib/images';
import { ROUTES } from '../../config/routes';

const FALLBACKS = [
  'linear-gradient(135deg,#0B3D2E,#128C6B)',
  'linear-gradient(135deg,#0F7A75,#0B3D2E)',
  'linear-gradient(135deg,#16241D,#0E5A43)',
  'linear-gradient(135deg,#083328,#0F7A75)',
];

export default function EventCardFull({ event, index = 0 }) {
  const navigate = useNavigate();
  const isFree = Number(event.ticketPrice) === 0;
  const imageUrl = getEventImageUrl(event);

  return (
    <div
      onClick={() => navigate(ROUTES.EVENT(event.id))}
      style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        height: 300,
        background: imageUrl ? 'none' : FALLBACKS[index % FALLBACKS.length],
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={event.title}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        />
      )}

      {/* Scrim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.80) 100%)',
      }} />

      {/* Category badge */}
      <span style={{
        position: 'absolute', top: 14, left: 14,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff',
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.8px',
        padding: '4px 11px', borderRadius: 999,
      }}>
        {event.category?.name || 'Event'}
      </span>

      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 20px',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 5,
        }}>
          {formatDate(event.eventDate)} · {event.venue}
        </p>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 17, fontWeight: 800,
          color: '#fff', lineHeight: 1.25,
          marginBottom: 14,
          textShadow: '0 1px 6px rgba(0,0,0,0.25)',
        }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
            {isFree ? 'FREE' : formatKES(event.ticketPrice)}
          </span>
          <span style={{
            background: '#fff', color: '#0B3D2E',
            fontSize: 11, fontWeight: 700,
            padding: '6px 15px', borderRadius: 999,
          }}>
            Get Tickets
          </span>
        </div>
      </div>
    </div>
  );
}
