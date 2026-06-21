export default function RolePicker({ value, onChange }) {
  const roles = [
    { value: 'ATTENDEE',  icon: '🎟️', title: 'Attend Events',   sub: 'Browse & book tickets' },
    { value: 'ORGANIZER', icon: '🎪', title: 'Organise Events', sub: 'Create & manage events' },
  ];

  return (
    <div className="role-picker">
      {roles.map((role) => (
        <label
          key={role.value}
          className={`role-option ${value === role.value ? 'selected' : ''}`}
          onClick={() => onChange(role.value)}
        >
          <input type="radio" name="role" value={role.value} checked={value === role.value} readOnly />
          <div className="role-option-icon">{role.icon}</div>
          <div className="role-option-title">{role.title}</div>
          <div className="role-option-sub">{role.sub}</div>
        </label>
      ))}
    </div>
  );
}
