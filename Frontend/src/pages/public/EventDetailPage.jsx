import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ROUTES } from '../../config/routes';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Event Detail</h2>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Event ID: {id}</p>
        <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={() => navigate(ROUTES.EVENTS)}>
          ← Back to Events
        </button>
      </div>
      <Footer />
    </>
  );
}
