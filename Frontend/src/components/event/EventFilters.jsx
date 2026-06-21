export default function EventFilters({ filters, onChange, onReset }) {
  return (
    <aside className="filters-sidebar">
      <div className="filters-title">Filters</div>

      <div className="filter-group">
        <div className="filter-label">Date</div>
        <div className="radio-group">
          {['all', 'today', 'weekend'].map((val) => (
            <label className="radio-item" key={val}>
              <input
                type="radio"
                name="date"
                value={val}
                checked={filters.date === val}
                onChange={() => onChange('date', val)}
              />
              {val === 'all' ? 'All Dates' : val === 'today' ? 'Today' : 'This Weekend'}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-label">Category</div>
        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => onChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {['Music', 'Food', 'Sports', 'Culture', 'Tech', 'Nightlife'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <div className="filter-label">Price Range (KES)</div>
        <div className="price-inputs">
          <input
            className="price-input"
            type="number"
            placeholder="Min"
            min="0"
            value={filters.minPrice}
            onChange={(e) => onChange('minPrice', e.target.value)}
          />
          <span className="price-dash">—</span>
          <input
            className="price-input"
            type="number"
            placeholder="Max"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => onChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-label">Location</div>
        <div className="check-group">
          {['Nyali', 'Bamburi', 'Old Town', 'Mtwapa'].map((loc) => (
            <label className="check-item" key={loc}>
              <input
                type="checkbox"
                checked={filters.locations.includes(loc)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...filters.locations, loc]
                    : filters.locations.filter((l) => l !== loc);
                  onChange('locations', next);
                }}
              />
              {loc}
            </label>
          ))}
        </div>
      </div>

      <button className="reset-btn" onClick={onReset}>Reset Filters</button>
    </aside>
  );
}
