export default function RolePicker({ value, onChange }) {
  const roles = [
    {
      value: 'ATTENDEE',
      title: 'Attend Events',
      sub: 'Browse & book tickets',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
          <path d="M13 5v14"/>
          <path d="M9 10h2"/>
          <path d="M9 14h2"/>
        </svg>
      )
    },
    {
      value: 'ORGANIZER',
      title: 'Organise Events',
      sub: 'Create & manage events',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" x2="16" y1="2" y2="6"/>
          <line x1="8" x2="8" y1="2" y2="6"/>
          <line x1="3" x2="21" y1="10" y2="10"/>
          <path d="M12 14v4"/>
          <path d="M10 16h4"/>
        </svg>
      )
    },
  ];

  return (
    <div className="role-picker">
      {roles.map((role) => (
        <div
          key={role.value}
          className={`role-option role-option--${role.value.toLowerCase()} ${value === role.value ? 'selected' : ''}`}
          onClick={() => onChange(role.value)}
        >
          <div className="role-option-radio">
            <div className="role-option-radio-inner" />
          </div>
          <div className="role-option-icon">{role.icon}</div>
          <div className="role-option-title">{role.title}</div>
          <div className="role-option-sub">{role.sub}</div>
          <div className="role-option-badge">
            {role.value === 'ATTENDEE' ? 'Buy Tickets' : 'Host & Sell'}
          </div>
        </div>
      ))}
    </div>
  );
}
