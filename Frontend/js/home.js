/* ═══════════════════════════════════════════════
   HOME PAGE — Logic
   ═══════════════════════════════════════════════ */
import { getEvents, isLoggedIn, getUser, clearAuth } from './api.js';

// ── Demo event data (shown when API returns nothing) ──
const DEMO_FEATURED = [
  {
    id: 'demo-1',
    title: 'Coastline Music Festival 2025',
    description: 'A high-energy celebration of local music and international DJs on the white sands of Nyali.',
    venue: 'Nyali Beach',
    eventDate: '2025-10-12',
    eventTime: '15:00',
    ticketPrice: '2500',
    status: 'APPROVED',
    badge: 'FEATURED',
    category: { name: 'Music' },
    img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
  },
  {
    id: 'demo-2',
    title: 'Mombasa Cultural Gala',
    description: 'Experience the rich heritage of the coast through food, dance, and historical storytelling.',
    venue: 'Fort Jesus',
    eventDate: '2025-10-17',
    eventTime: '18:00',
    ticketPrice: '0',
    status: 'APPROVED',
    badge: 'FREE',
    category: { name: 'Culture' },
    img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  },
  {
    id: 'demo-3',
    title: 'Eco-Awareness Fun Run',
    description: 'Join hundreds in a 5km run through the beautiful trails to support conservation efforts.',
    venue: 'Haller Park',
    eventDate: '2025-10-25',
    eventTime: '06:30',
    ticketPrice: '1000',
    status: 'APPROVED',
    badge: 'FEATURED',
    category: { name: 'Sports' },
    img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80',
  },
];

const DEMO_UPCOMING = [
  { id: 'u1', title: 'Sauti Sol Live in Mombasa', venue: 'Mombasa Sports Club', eventTime: '7:00 PM', eventDate: '2025-11-02', ticketPrice: '3500', category: { name: 'Music' } },
  { id: 'u2', title: 'Tech-Coast Summit', venue: 'Swahilipot Hub', eventTime: '9:00 AM', eventDate: '2025-11-05', ticketPrice: '800', category: { name: 'Tech' } },
  { id: 'u3', title: 'Old Town Street Food Tour', venue: 'Mombasa Old Town', eventTime: '4:00 PM', eventDate: '2025-11-10', ticketPrice: '1000', category: { name: 'Food' } },
];

// ── Helpers ──
const fmt = (price) =>
  Number(price) === 0 ? 'FREE' : `KES ${Number(price).toLocaleString()}`;

const fmtDate = (dateStr) => {
  const d = new Date(dateStr);
  return { month: d.toLocaleString('en', { month: 'short' }).toUpperCase(), day: d.getDate() };
};

const metaStr = (ev) => {
  const d = new Date(ev.eventDate);
  const label = d.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${label} · ${ev.venue}`;
};

// ── Render featured cards ──
function renderFeatured(events) {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  grid.innerHTML = '';
  events.slice(0, 3).forEach((ev, i) => {
    const price = fmt(ev.ticketPrice);
    const isFree = Number(ev.ticketPrice) === 0;
    const badgeClass = ev.badge === 'FREE' || isFree ? 'badge-free' : 'badge-featured';
    const badgeText = ev.badge || (isFree ? 'FREE' : 'FEATURED');
    const imgSrc = ev.img || `https://images.unsplash.com/photo-153${i}?w=600&q=80`;

    grid.insertAdjacentHTML('beforeend', `
      <div class="event-card fade-up" style="animation-delay:${i * 0.1}s" onclick="location.href='events.html?id=${ev.id}'">
        <div class="event-card-img">
          <img src="${imgSrc}" alt="${ev.title}" loading="lazy"
               onerror="this.parentElement.style.background='var(--light)'">
          <span class="event-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="event-card-body">
          <p class="event-meta">${metaStr(ev)}</p>
          <h3 class="event-card-title">${ev.title}</h3>
          <p class="event-card-desc">${ev.description || ''}</p>
          <div class="event-card-footer">
            <span class="event-price ${isFree ? 'free' : ''}">${price}</span>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Tickets</button>
          </div>
        </div>
      </div>
    `);
  });
}

// ── Render upcoming list ──
function renderUpcoming(events) {
  const list = document.getElementById('upcoming-list');
  if (!list) return;
  list.innerHTML = '';
  events.slice(0, 3).forEach((ev, i) => {
    const { month, day } = fmtDate(ev.eventDate);
    const price = fmt(ev.ticketPrice);
    list.insertAdjacentHTML('beforeend', `
      <div class="upcoming-item fade-up" style="animation-delay:${i * 0.08}s" onclick="location.href='events.html?id=${ev.id}'">
        <div class="date-badge">
          <div class="month">${month}</div>
          <div class="day">${day}</div>
        </div>
        <div class="upcoming-info">
          <div class="upcoming-title">${ev.title}</div>
          <div class="upcoming-sub">
            ${ev.venue} &nbsp;·&nbsp; ${ev.eventTime}
          </div>
        </div>
        <div class="upcoming-right">
          <span class="upcoming-price">${price}</span>
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation()">Tickets</button>
        </div>
      </div>
    `);
  });
}

// ── Search ──
function initSearch() {
  const btn = document.getElementById('search-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const keyword = document.getElementById('search-keyword')?.value.trim();
    const location = document.getElementById('search-location')?.value.trim();
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (location) params.set('location', location);
    location.href = `events.html?${params.toString()}`;
  });

  // Enter key
  ['search-keyword', 'search-location'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') btn.click();
    });
  });
}

// ── Filter tabs ──
function initFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ── Navbar auth state ──
function initNavAuth() {
  const authArea = document.getElementById('nav-auth');
  if (!authArea) return;

  if (isLoggedIn()) {
    const user = getUser();
    const initials = (user?.fullName || 'U')
      .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const firstName = user?.fullName?.split(' ')[0] || 'User';
    const isOrganizer = user?.role === 'ORGANIZER';

    authArea.innerHTML = `
      <div class="nav-user" id="nav-user-wrap">
        <button class="nav-avatar-btn" id="nav-avatar-btn" aria-label="User menu">
          <div class="nav-avatar">${initials}</div>
          <span class="nav-username">${firstName}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-dropdown" id="nav-dropdown">
          <div class="nav-dropdown-header">
            <div class="nav-avatar nav-avatar-lg">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:14px;color:var(--text)">${user?.fullName}</div>
              <div style="font-size:12px;color:var(--muted)">${user?.email}</div>
              <span class="nav-role-badge">${isOrganizer ? '🎪 Organizer' : '🎟 Attendee'}</span>
            </div>
          </div>
          <div class="nav-dropdown-divider"></div>
          <a href="#" class="nav-dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            My Tickets
          </a>
          ${isOrganizer ? `<a href="#" class="nav-dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            My Events
          </a>` : ''}
          <a href="#" class="nav-dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile Settings
          </a>
          <div class="nav-dropdown-divider"></div>
          <button class="nav-dropdown-item nav-dropdown-logout" id="logout-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    `;

    // Toggle dropdown
    const btn      = document.getElementById('nav-avatar-btn');
    const dropdown = document.getElementById('nav-dropdown');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown?.classList.remove('open'));

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      clearAuth();
      location.reload();
    });
  } else {
    authArea.innerHTML = `<a href="login.html" class="btn btn-dark btn-sm">Login / Sign Up</a>`;
  }
}

// ── Init ──
async function init() {
  initNavAuth();
  initSearch();
  initFilterTabs();

  try {
    const res = await getEvents();
    const events = res.data || [];
    if (events.length >= 3) {
      renderFeatured(events);
      renderUpcoming(events);
    } else {
      // Merge real + demo
      const filled = [...events, ...DEMO_FEATURED].slice(0, 3);
      renderFeatured(filled);
      const upFilled = [...events, ...DEMO_UPCOMING].slice(0, 3);
      renderUpcoming(upFilled);
    }
  } catch {
    // Fallback to demo data
    renderFeatured(DEMO_FEATURED);
    renderUpcoming(DEMO_UPCOMING);
  }
}

document.addEventListener('DOMContentLoaded', init);
