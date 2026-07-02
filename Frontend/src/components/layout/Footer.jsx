import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to={ROUTES.HOME} className="nav-logo">
              <img src="/images/hafla-logo.png" alt="Hafla" className="nav-logo-img nav-logo-img--footer" />
            </Link>
            <p>The leading platform for local events and experiences in the coastal region.</p>
          </div>
          <div className="footer-col">
            <h4>Popular Areas</h4>
            <ul>
              <li><Link to={`${ROUTES.EVENTS}?location=Nyali`}>Nyali</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?location=Bamburi`}>Bamburi</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?location=Old Town`}>Old Town</Link></li>
              <li><Link to={`${ROUTES.EVENTS}?location=Mtwapa`}>Mtwapa</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to={ROUTES.HELP}>How it Works</Link></li>
              <li><Link to={`${ROUTES.HOME}#organizers`}>For Organizers</Link></li>
              <li><Link to={ROUTES.HELP}>Help Center</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Mombasa Tickets. All rights reserved.</span>
          <span>Made in Mombasa</span>
        </div>
      </div>
    </footer>
  );
}
