import { useNavigate } from 'react-router-dom';
import { formatKES, formatDate } from '../../lib/utils';
import { getEventImageUrl } from '../../lib/images';
import { ROUTES } from '../../config/routes';

function FeaturedCard({ event, index = 0, large = false }) {
  const navigate = useNavigate();
  const isFree = Number(event.ticketPrice) === 0;
  const imageUrl = getEventImageUrl(event);
  const gradients = [
    'linear-gradient(135deg,#0B3D2E,#128C6B)',
    'linear-gradient(135deg,#0F7A75,#0B3D2E)',
    'linear-gradient(135deg,#16241D,#0E5A43)',
  ];

  return (
    <div
      onClick={() => navigate(ROUTES.EVENT(event.id))}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
        height: large ? '100%' : '100%',
        minHeight: large ? 480 : 220,
        background: imageUrl ? 'none' : gradients[index % 3],
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

      {/* Scrim — stronger at bottom where text lives */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.78) 100%)',
      }} />

      {/* Category badge — top left */}
      <span style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff',
        fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.8px',
        padding: '5px 12px', borderRadius: 999,
      }}>
        {event.category?.name || 'Event'}
      </span>

      {/* Text content — bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: large ? '28px 24px' : '18px 18px',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
          textTransform: 'uppercase', letterSpacing: '0.8px',
          marginBottom: 6,
        }}>
          {formatDate(event.eventDate)} · {event.venue}
        </p>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: large ? 26 : 16,
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: 14,
          textShadow: '0 1px 8px rgba(0,0,0,0.3)',
        }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: large ? 16 : 14, fontWeight: 800, color: '#fff',
          }}>
            {isFree ? 'FREE' : formatKES(event.ticketPrice)}
          </span>
          <span style={{
            background: '#fff', color: '#0B3D2E',
            fontSize: 12, fontWeight: 700,
            padding: '6px 16px', borderRadius: 999,
          }}>
            Get Tickets
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedGrid({ events, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap: 16, height: 480 }}>
        <div className="skeleton" style={{ borderRadius: 20, gridRow: '1 / 3', minHeight: 480 }} />
        <div className="skeleton" style={{ borderRadius: 20 }} />
        <div className="skeleton" style={{ borderRadius: 20 }} />
      </div>
    );
  }

  if (!events.length) return null;

  const [first, ...rest] = events;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: rest.length ? '1.4fr 1fr' : '1fr',
      gridTemplateRows: rest.length > 1 ? '1fr 1fr' : '1fr',
      gap: 16,
      height: 480,
    }}>
      {/* Large featured card — spans both rows */}
      <div style={{ gridRow: '1 / 3' }}>
        <FeaturedCard event={first} index={0} large />
      </div>

      {/* Smaller cards stacked on the right */}
      {rest.slice(0, 2).map((ev, i) => (
        <FeaturedCard key={ev.id} event={ev} index={i + 1} />
      ))}
    </div>
  );
}
