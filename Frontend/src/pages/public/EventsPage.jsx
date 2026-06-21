import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import EventFilters from '../../components/event/EventFilters';
import EventCard from '../../components/event/EventCard';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { getEvents } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 6;

const DEMO_EVENTS = [
  { id: 'd1', title: 'Coastal Vibes Beach Party', venue: 'Nyali Beachfront, Mombasa', eventDate: '2025-10-24', eventTime: '8:00 PM', ticketPrice: '2500', category: { name: 'Music' }, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80' },
  { id: 'd2', title: 'Old Town Architecture Walk', venue: 'Fort Jesus, Old Town', eventDate: '2025-10-25', eventTime: '9:00 AM', ticketPrice: '0', category: { name: 'Culture' }, img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'd3', title: 'Dev Summit Mombasa', venue: 'Swahilipot Hub', eventDate: '2025-11-01', eventTime: '10:00 AM', ticketPrice: '1000', category: { name: 'Tech' }, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
  { id: 'd4', title: 'Gala Night at Mtwapa', venue: 'Mtwapa Entertainment Center', eventDate: '2025-11-02', eventTime: '11:00 PM', ticketPrice: '5000', category: { name: 'Nightlife' }, img: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80' },
  { id: 'd5', title: 'Coastal Marathon 2025', venue: 'Mama Ngina Waterfront', eventDate: '2025-11-10', eventTime: '6:00 AM', ticketPrice: '500', category: { name: 'Sports' }, img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80' },
  { id: 'd6', title: 'Swahili Food Festival', venue: 'Haller Park', eventDate: '2025-11-16', eventTime: '12:00 PM', ticketPrice: '1500', category: { name: 'Food' }, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80' },
  { id: 'd7', title: 'Mombasa Jazz Night 2025', venue: 'Fort Jesus Grounds', eventDate: '2025-12-31', eventTime: '7:00 PM', ticketPrice: '1500', category: { name: 'Music' }, img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80' },
  { id: 'd8', title: 'Yoga at the Beach', venue: 'Bamburi Beach', eventDate: '2025-10-30', eventTime: '7:00 AM', ticketPrice: '800', category: { name: 'Sports' }, img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80' },
];

const DEFAULT_FILTERS = { date: 'all', category: '', minPrice: '', maxPrice: '', locations: [] };

export default function EventsPage() {
  const [searchParams] = useSearchParams();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({
    ...DEFAULT_FILTERS,
    category: searchParams.get('category') || '',
  });
  const [sort, setSort]         = useState('latest');
  const [currentPage, setPage]  = useState(1);

  const debouncedMin = useDebounce(filters.minPrice);
  const debouncedMax = useDebounce(filters.maxPrice);

  useEffect(() => {
    getEvents()
      .then((res) => {
        const live = res.data || [];
        const ids  = new Set(live.map((e) => e.id));
        setAllEvents([...live, ...DEMO_EVENTS.filter((e) => !ids.has(e.id))]);
      })
      .catch(() => setAllEvents(DEMO_EVENTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...allEvents];
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (filters.date === 'today') {
      result = result.filter((ev) => {
        const d = new Date(ev.eventDate); d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (filters.date === 'weekend') {
      const diff = (6 - today.getDay() + 7) % 7;
      const sat  = new Date(today); sat.setDate(today.getDate() + diff);
      const sun  = new Date(sat);   sun.setDate(sat.getDate() + 1);
      result = result.filter((ev) => {
        const d = new Date(ev.eventDate); d.setHours(0, 0, 0, 0);
        return d >= sat && d <= sun;
      });
    }

    if (filters.category) {
      result = result.filter((ev) =>
        ev.category?.name?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    const min = Number(debouncedMin || 0);
    const max = Number(debouncedMax || 999999);
    result = result.filter((ev) => {
      const p = Number(ev.ticketPrice);
      return p >= min && p <= max;
    });

    if (filters.locations.length) {
      result = result.filter((ev) =>
        filters.locations.some((loc) => ev.venue?.toLowerCase().includes(loc.toLowerCase()))
      );
    }

    const q = searchParams.get('q');
    if (q) {
      result = result.filter((ev) =>
        ev.title?.toLowerCase().includes(q.toLowerCase())
      );
    }

    if (sort === 'latest')     result.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    if (sort === 'price-asc')  result.sort((a, b) => Number(a.ticketPrice) - Number(b.ticketPrice));
    if (sort === 'price-desc') result.sort((a, b) => Number(b.ticketPrice) - Number(a.ticketPrice));

    return result;
  }, [allEvents, filters, debouncedMin, debouncedMax, sort, searchParams]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEvents = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const handleReset = () => { setFilters(DEFAULT_FILTERS); setPage(1); };

  return (
    <>
      <Navbar />

      <div className="events-page-hero">
        <div className="container">
          <h1>Explore Mombasa Events</h1>
          <p>Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> events available in your selected area</p>
        </div>
      </div>

      <div className="container">
        <div className="events-layout">
          <EventFilters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

          <main className="events-main">
            <div className="events-toolbar">
              <p className="results-count"><strong>{filtered.length}</strong> events found</p>
              <div className="sort-wrap">
                <span>Sort by:</span>
                <select
                  className="filter-select"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  style={{ width: 'auto', padding: '7px 28px 7px 10px' }}
                >
                  <option value="latest">Latest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="events-grid-2">
                {Array(6).fill(0).map((_, i) => (
                  <div className="event-card" key={i}>
                    <Skeleton height={190} />
                    <div className="event-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Skeleton height={12} width="60%" />
                      <Skeleton height={18} width="85%" />
                      <Skeleton height={12} width="70%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pageEvents.length === 0 ? (
              <div className="events-grid-2"><EmptyState /></div>
            ) : (
              <div className="events-grid-2">
                {pageEvents.map((ev, i) => <EventCard key={ev.id} event={ev} index={i} />)}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </main>
        </div>
      </div>

      <Footer />
    </>
  );
}
