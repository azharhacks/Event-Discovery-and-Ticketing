export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (Math.abs(i - currentPage) === 2) {
      pages.push('…');
    }
  }

  return (
    <div className="pagination">
      <button
        className="page-btn arrow"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >‹</button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="page-dots">…</span>
        ) : (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >{p}</button>
        )
      )}

      <button
        className="page-btn arrow"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >›</button>
    </div>
  );
}
