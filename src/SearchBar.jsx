// File: src/SearchBar.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './SearchBar.css';

export default function SearchBar({ options, onSearch }) {
  const [selected, setSelected] = useState('');

  const handleChange = e => setSelected(e.target.value);
  const handleSearch = () => onSearch(selected);

  return (
    <div className="search-bar-container">
      <select value={selected} onChange={handleChange} className="search-dropdown">
        <option value="">-- Select Filter --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button className="search-btn" onClick={handleSearch} disabled={!selected}>
        Search
      </button>
    </div>
  );
}

SearchBar.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
  ).isRequired,
  onSearch: PropTypes.func.isRequired,
};
