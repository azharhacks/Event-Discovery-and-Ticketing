const LEVELS = [
  { label: 'Too short',   color: '#EF4444', width: '15%' },
  { label: 'Weak',        color: '#F97316', width: '30%' },
  { label: 'Fair',        color: '#FBBF24', width: '55%' },
  { label: 'Good',        color: '#5FB593', width: '75%' },
  { label: 'Strong',      color: '#128C6B', width: '90%' },
  { label: 'Very strong', color: '#0E7257', width: '100%' },
];

function score(pw) {
  let s = 0;
  if (pw.length >= 8)          s++;
  if (pw.length >= 12)         s++;
  if (/[A-Z]/.test(pw))       s++;
  if (/[0-9]/.test(pw))       s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, LEVELS.length - 1);
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const level = LEVELS[score(password)];

  return (
    <div className="pw-strength" style={{ display: 'flex' }}>
      <div className="pw-strength-bar">
        <div
          className="pw-strength-fill"
          style={{ width: level.width, background: level.color }}
        />
      </div>
      <span className="pw-strength-label" style={{ color: level.color }}>{level.label}</span>
    </div>
  );
}
