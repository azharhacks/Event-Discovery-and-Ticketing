export default function EmptyState({ title = 'No events found', subtitle = 'Try adjusting your filters or check back later' }) {
  return (
    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}
