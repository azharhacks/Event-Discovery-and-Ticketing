import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import EventGrid from '../../components/event/EventGrid';
import EventCardCompact from '../../components/event/EventCardCompact';
import { getEvents } from '../../lib/api';
import { ROUTES } from '../../config/routes';

const DEMO_FEATURED = [
  { id: 'demo-1', title: 'Coastline Music Festival 2025', description: 'A high-energy celebration of local music and international DJs on the white sands of Nyali.', venue: 'Nyali Beach', eventDate: '2025-10-12', eventTime: '15:00', ticketPrice: '2500', badge: 'FEATURED', category: { name: 'Music' }, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80' },
  { id: 'demo-2', title: 'Mombasa Cultural Gala', description: 'Experience the rich heritage of the coast through food, dance, and historical storytelling.', venue: 'Fort Jesus', eventDate: '2025-10-17', eventTime: '18:00', ticketPrice: '0', badge: 'FREE', category: { name: 'Culture' }, img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'demo-3', title: 'Eco-Awareness Fun Run', description: 'Join hundreds in a 5km run through the beautiful trails to support conservation efforts.', venue: 'Haller Park', eventDate: '2025-10-25', eventTime: '06:30', ticketPrice: '1000', badge: 'FEATURED', category: { name: 'Sports' }, img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=600&q=80' },
];

const DEMO_UPCOMING = [
  { id: 'u1', title: 'Sauti Sol Live in Mombasa', venue: 'Mombasa Sports Club', eventTime: '7:00 PM', eventDate: '2025-11-02', ticketPrice: '3500', category: { name: 'Music' } },
  { id: 'u2', title: 'Tech-Coast Summit', venue: 'Swahilipot Hub', eventTime: '9:00 AM', eventDate: '2025-11-05', ticketPrice: '800', category: { name: 'Tech' } },
  { id: 'u3', title: 'Old Town Street Food Tour', venue: 'Mombasa Old Town', eventTime: '4:00 PM', eventDate: '2025-11-10', ticketPrice: '1000', category: { name: 'Food' } },
];

const FILTER_TABS = ['Popular', 'Concerts', 'Marathons', 'Perform', 'Food', 'Tech'];

export default function HomePage() {
  const [featured, setFeatured]       = useState([]);
  const [upcoming, setUpcoming]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('Popular');
  const [keyword, setKeyword]         = useState('');
  const [location, setLocation]       = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getEvents()
      .then((res) => {
        const events = res.data || [];
        if (events.length >= 3) {
          setFeatured(events.slice(0, 3));
          setUpcoming(events.slice(0, 3));
        } else {
          setFeatured([...events, ...DEMO_FEATURED].slice(0, 3));
          setUpcoming([...events, ...DEMO_UPCOMING].slice(0, 3));
        }
      })
      .catch(() => {
        setFeatured(DEMO_FEATURED);
        setUpcoming(DEMO_UPCOMING);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword)  params.set('q', keyword);
    if (location) params.set('location', location);
    navigate(`${ROUTES.EVENTS}?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <p className="hero-eyebrow">Mombasa's #1 Ticketing Platform</p>
          <h1 className="hero-title">Discover Events<br />Around the Coast</h1>
          <p className="hero-sub">From beach parties to cultural tours — find what's happening near you</p>

          <div className="search-bar">
            <div className="search-field">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              <input
                type="text"
                placeholder="Event name or keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="search-divider" />
            <div className="search-field">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                type="text"
                placeholder="Location (e.g., Nyali)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="hero-btn" onClick={handleSearch}>SEARCH</button>
          </div>

          <div className="filter-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`filter-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >{tab}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Events</h2>
            <a href={ROUTES.EVENTS} className="see-all">See all →</a>
          </div>
          <EventGrid events={featured} loading={loading} />
        </div>
      </section>

      {/* Browse by Category */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse by Category</h2>
          </div>
          <div className="categories-grid">
            {[
              { name: 'Music',   color: '#EA580C', icon: <path d="M9 18V5l12-2v13"/>, extra: <><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></> },
              { name: 'Food',    color: '#16A34A', icon: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></> },
              { name: 'Sports',  color: '#2563EB', icon: <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93 19.07 19.07"/><path d="M4.93 19.07 19.07 4.93"/></> },
              { name: 'Culture', color: '#7C3AED', icon: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></> },
            ].map(({ name, color, icon, extra }) => (
              <div
                key={name}
                className="category-tile"
                onClick={() => navigate(`${ROUTES.EVENTS}?category=${name}`)}
              >
                <div className={`cat-icon cat-${name.toLowerCase()}`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
                    {icon}{extra}
                  </svg>
                </div>
                <span className="cat-label">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Upcoming Events</h2>
            <a href={ROUTES.EVENTS} className="see-all">See all →</a>
          </div>
          <div className="upcoming-list">
            {upcoming.map((ev, i) => <EventCardCompact key={ev.id} event={ev} index={i} />)}
          </div>
          <div className="load-more-wrap" style={{ marginTop: 28 }}>
            <button className="btn btn-outline" onClick={() => navigate(ROUTES.EVENTS)}>
              Load more events
            </button>
          </div>
        </div>
      </section>

      {/* Organizer CTA */}
      <section className="cta-section" id="organizers">
        <div className="container cta-inner">
          <p className="cta-eyebrow">For Organizers</p>
          <h2 className="cta-title">Take Your Events to the Next Level</h2>
          <p className="cta-sub">Take advantage of our powerful tools to manage ticket sales, track analytics, and reach more attendees in the Mombasa region.</p>
          <div className="cta-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(ROUTES.ORGANIZER_CREATE)}>Create an Event</button>
            <button className="btn btn-ghost btn-lg">Learn More</button>
          </div>
        </div>
      </section>

      <Footer />

      <button className="fab" title="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
    </>
  );
}
