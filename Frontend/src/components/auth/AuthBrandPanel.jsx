const FEATURES = {
  login: [
    'Instant e-ticket delivery to your phone',
    'Seamless M-Pesa payments',
    'Manage and track all your bookings',
    'Get event reminders & exclusive deals',
  ],
  signup: [
    'Free to sign up — no hidden fees',
    'Book events in seconds with M-Pesa',
    'Organizers get powerful event tools',
    'Personalised event recommendations',
  ],
};

export default function AuthBrandPanel({ variant = 'login' }) {
  const isLogin = variant === 'login';

  return (
    <div className="auth-brand">
      <div className="auth-brand-tagline-wrap">
        <span className="auth-brand-tagline">
          {isLogin ? '✦ Where Mombasa Comes Alive ✦' : '❖ Where Mombasa Comes Alive ❖'}
        </span>
      </div>

      <div className="auth-brand-body">
        <h2>{isLogin
          ? 'Your coastal event hub awaits.'
          : 'Join thousands of event lovers on the coast.'
        }</h2>
        <p>{isLogin
          ? 'Discover concerts, food fests, sports, cultural events and more — all in one place across Mombasa and the coast.'
          : 'Sign up in under a minute and start discovering concerts, food festivals, sports and cultural experiences happening near you.'
        }</p>
      </div>

      <div className="auth-features">
        {FEATURES[variant].map((feat) => (
          <div className="auth-feature" key={feat}>
            <div className="auth-feature-dot" />
            <span>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
