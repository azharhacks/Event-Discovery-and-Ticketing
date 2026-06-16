/* ═══════════════════════════════════════════════
   EVENTS PAGE — Logic (filters, grid, pagination)
   ═══════════════════════════════════════════════ */
import { getEvents, isLoggedIn, getUser, clearAuth } from './api.js';

const PAGE_SIZE = 6;

// ── Demo data (shown when API has few events) ──
const DEMO_EVENTS = [
  { id: 'd1', title: 'Coastal Vibes Beach Party', venue: 'Nyali Beachfront, Mombasa', eventDate: '2025-10-24', eventTime: '8:00 PM', ticketPrice: '2500', category: { name: 'Music' }, tags: 'MUSIC · CONCERT', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80' },
  { id: 'd2', title: 'Old Town Architecture Walk', venue: 'Fort Jesus, Old Town', eventDate: '2025-10-25', eventTime: '9:00 AM', ticketPrice: '0',    category: { name: 'Culture' }, tags: 'CULTURAL · TOUR', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'd3', title: 'Dev Summit Mombasa', venue: 'Swahilipot Hub', eventDate: '2025-11-01', eventTime: '10:00 AM', ticketPrice: '1000', category: { name: 'Tech' },    tags: 'TECH · WORKSHOP', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
  { id: 'd4', title: 'Gala Night at Mtwapa', venue: 'Mtwapa Entertainment Center', eventDate: '2025-11-02', eventTime: '11:00 PM', ticketPrice: '5000', category: { name: 'Nightlife' }, tags: 'NIGHTLIFE', img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80' },
  { id: 'd5', title: 'Coastal Marathon 2025', venue: 'Mama Ngina Waterfront', eventDate: '2025-11-10', eventTime: '6:00 AM', ticketPrice: '500',  category: { name: 'Sports' },  tags: 'SPORT', img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80' },
  { id: 'd6', title: 'Swahili Food Festival', venue: 'Haller Park', eventDate: '2025-11-16', eventTime: '12:00 PM', ticketPrice: '1500', category: { name: 'Food' },    tags: 'FOOD · FESTIVE', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80' },
  { id: 'd7', title: 'Mombasa Jazz Night 2025', venue: 'Fort Jesus Grounds', eventDate: '2025-12-31', eventTime: '7:00 PM', ticketPrice: '1500', category: { name: 'Music' },    tags: 'MUSIC · JAZZ', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80' },
  { id: 'd8', title: 'Yoga at the Beach', venue: 'Bamburi Beach', eventDate: '2025-10-30', eventTime: '7:00 AM', ticketPrice: '800',  category: { name: 'Sports' },  tags: 'WELLNESS · SPORT', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80' },
];

// State
let allEvents   = [];
let filtered    = [];
let currentPage = 1;

// ── Helpers ──
const fmt = (p) => Number(p) === 0 ? 'FREE' : `KES ${Number(p).toLocaleString()}`;
const fmtDate = (ds) => {
  const d = new Date(ds);
  return d.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric' });
};

// ── Render event cards ──
function renderCards(events) {
  const grid = document.getElementById('events-grid');
  const count = document.getElementById('result-count');
  if (!grid) return;

  if (count) count.textContent = events.length;

  if (!events.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No events found</h3>
        <p>Try adjusting your filters or check back later</p>
      </div>`;
    return;
  }

  const page = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  grid.innerHTML = '';

  page.forEach((ev, i) => {
    const isFree = Number(ev.ticketPrice) === 0;
    const price  = fmt(ev.ticketPrice);
    const tags   = ev.tags || ev.category?.name?.toUpperCase() || 'EVENT';
    const img    = ev.img || '';

    grid.insertAdjacentHTML('beforeend', `
      <div class="event-card fade-up" style="animation-delay:${i * 0.07}s"
           onclick="location.href='event-detail.html?id=${ev.id}'">
        <div class="event-card-img">
          ${img
            ? `<img src="${img}" alt="${ev.title}" loading="lazy"
                    onerror="this.parentElement.style.background='var(--light)'">`
            : `<div class="img-placeholder card-grad-${(i % 6) + 1}"></div>`}
          ${isFree ? '<span class="event-badge badge-free">FREE</span>' : ''}
        </div>
        <div class="event-card-body">
          <p class="event-meta">
            <span style="color:var(--muted)">${tags}</span>
            <span style="float:right;font-weight:700;color:var(--text)">${isFree ? 'Free' : price}</span>
          </p>
          <h3 class="event-card-title">${ev.title}</h3>
          <div class="upcoming-sub" style="margin-bottom:8px">
            ${fmtDate(ev.eventDate)} · ${ev.eventTime || ''}
          </div>
          <div class="upcoming-sub">
            ${ev.venue}
          </div>
        </div>
      </div>
    `);
  });

  renderPagination(events.length);
}

// ── Pagination ──
function renderPagination(total) {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) { wrap.innerHTML = ''; return; }

  let html = `<button class="page-btn arrow" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">‹</button>`;

  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span class="page-dots">…</span>`;
    }
  }

  html += `<button class="page-btn arrow" ${currentPage === pages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">›</button>`;
  wrap.innerHTML = html;
}

window.changePage = (p) => {
  currentPage = p;
  renderCards(filtered);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Filters ──
function applyFilters() {
  const dateFilter     = document.querySelector('input[name="date"]:checked')?.value || 'all';
  const categoryFilter = document.getElementById('cat-filter')?.value || '';
  const minPrice       = Number(document.getElementById('min-price')?.value || 0);
  const maxPrice       = Number(document.getElementById('max-price')?.value || 999999);
  const locations      = [...document.querySelectorAll('input[name="location"]:checked')].map(el => el.value.toLowerCase());
  const sortBy         = document.getElementById('sort-select')?.value || 'latest';

  let result = [...allEvents];

  // Date filter
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (dateFilter === 'today') {
    result = result.filter(ev => {
      const d = new Date(ev.eventDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  } else if (dateFilter === 'weekend') {
    const day = today.getDay();
    const diff = (6 - day + 7) % 7;
    const sat = new Date(today); sat.setDate(today.getDate() + diff);
    const sun = new Date(sat);   sun.setDate(sat.getDate() + 1);
    result = result.filter(ev => {
      const d = new Date(ev.eventDate); d.setHours(0, 0, 0, 0);
      return d >= sat && d <= sun;
    });
  }

  // Category
  if (categoryFilter) {
    result = result.filter(ev =>
      ev.category?.name?.toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  // Price
  result = result.filter(ev => {
    const p = Number(ev.ticketPrice);
    return p >= minPrice && p <= maxPrice;
  });

  // Location
  if (locations.length) {
    result = result.filter(ev =>
      locations.some(loc => ev.venue?.toLowerCase().includes(loc))
    );
  }

  // Sort
  if (sortBy === 'latest')       result.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  else if (sortBy === 'price-asc')  result.sort((a, b) => Number(a.ticketPrice) - Number(b.ticketPrice));
  else if (sortBy === 'price-desc') result.sort((a, b) => Number(b.ticketPrice) - Number(a.ticketPrice));

  filtered = result;
  currentPage = 1;
  renderCards(filtered);
}

function initFilters() {
  document.querySelectorAll('input[name="date"], input[name="location"]').forEach(el =>
    el.addEventListener('change', applyFilters)
  );
  ['cat-filter', 'sort-select'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', applyFilters)
  );
  ['min-price', 'max-price'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', () => {
      clearTimeout(window._priceTimer);
      window._priceTimer = setTimeout(applyFilters, 400);
    })
  );
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="date"]')[0].checked = true;
    document.getElementById('cat-filter').value = '';
    document.getElementById('min-price').value  = '';
    document.getElementById('max-price').value  = '';
    document.querySelectorAll('input[name="location"]').forEach(el => el.checked = false);
    applyFilters();
  });
}

// ── URL params (from home page search) ──
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && document.getElementById('nav-search-input')) {
    document.getElementById('nav-search-input').value = q;
  }
}

// ── Navbar auth ──
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
  applyURLParams();
  initFilters();

  // Show skeleton
  const grid = document.getElementById('events-grid');
  if (grid) {
    grid.innerHTML = Array(6).fill('').map(() => `
      <div class="event-card">
        <div class="skeleton" style="height:190px"></div>
        <div class="event-card-body" style="display:flex;flex-direction:column;gap:10px">
          <div class="skeleton" style="height:12px;width:60%"></div>
          <div class="skeleton" style="height:18px;width:85%"></div>
          <div class="skeleton" style="height:12px;width:70%"></div>
        </div>
      </div>`).join('');
  }

  try {
    const res = await getEvents();
    const live = res.data || [];
    // Merge live + demo, dedupe by id
    const ids = new Set(live.map(e => e.id));
    allEvents = [...live, ...DEMO_EVENTS.filter(e => !ids.has(e.id))];
  } catch {
    allEvents = [...DEMO_EVENTS];
  }

  filtered = [...allEvents];
  renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', init);
