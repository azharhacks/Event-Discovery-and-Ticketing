import { getEventImageUrl } from '../../lib/images';

const STATUS_STYLES = {
  APPROVED:  { bg: '#ecfdf5', color: '#047857' },
  PENDING:   { bg: '#eef2ff', color: '#4f46e5' },
  REJECTED:  { bg: '#fef2f2', color: '#b91c1c' },
  CANCELLED: { bg: '#f1f5f9', color: '#64748b' },
};

export default function EventDetailModal({ event, onClose, actions }) {
  if (!event) return null;

  const ss = STATUS_STYLES[event.status] || STATUS_STYLES.CANCELLED;
  const organiserName = event.organiser?.fullName || event.organizer?.fullName || '—';
  const organiserEmail = event.organiser?.email || event.organizer?.email || '';
  const avail = event.tickets?.[0]?.quantityAvailable ?? event.capacity;
  const sold = event.capacity != null ? Math.max(0, event.capacity - (avail ?? event.capacity)) : null;

  const fmtDate = (ds) => ds
    ? new Date(ds).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const fmtPrice = (p) => (Number(p) === 0 ? 'FREE' : `KES ${Number(p).toLocaleString()}`);
  const bannerImage = getEventImageUrl(event);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,61,46,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)', padding: 20 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, background: '#F1EFE4', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, zIndex: 1 }}
        >
          ×
        </button>

        {bannerImage && (
          <img src={bannerImage} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
        )}

        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: '#0B3D2E', margin: 0, flex: 1, minWidth: 200 }}>{event.title}</h2>
            <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color }}>
              {event.status}
            </span>
          </div>

          <p style={{ fontSize: 14, color: '#3A453E', lineHeight: 1.6, margin: '0 0 20px' }}>
            {event.description || 'No description provided.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: '#FAF8F3', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            {[
              ['Date', fmtDate(event.eventDate)],
              ['Time', event.eventTime || '—'],
              ['Venue', event.venue || '—'],
              ['Category', event.category?.name || '—'],
              ['Price', fmtPrice(event.ticketPrice)],
              ['Capacity', event.capacity ?? '—'],
              ...(sold != null ? [['Tickets Sold', `${sold} / ${event.capacity}`]] : []),
              ...(organiserName !== '—' ? [['Organizer', organiserName]] : []),
              ...(organiserEmail ? [['Organizer Email', organiserEmail]] : []),
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8A968D', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0B3D2E', wordBreak: 'break-word' }}>{val}</div>
              </div>
            ))}
          </div>

          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
      </div>
    </div>
  );
}
