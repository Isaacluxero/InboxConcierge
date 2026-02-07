import React, { useState } from 'react';

const SmartSearchBar = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const suggestions = [
    'Emails from John last week',
    'Important emails about budget',
    'Newsletters from this month',
    'Emails from sarah@example.com'
  ];

  return (
    <div style={{ marginBottom: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emails with natural language (e.g., 'emails from John last week')..."
            disabled={isLoading}
            className="glass-dark"
            style={{
              width: '100%',
              padding: '1rem 3rem 1rem 1rem',
              fontSize: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              outline: 'none',
              transition: 'all 0.3s ease',
              color: 'rgba(255, 255, 255, 0.95)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.target.style.boxShadow = '0 0 0 3px rgba(100, 100, 100, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn btn-primary"
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem'
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginRight: '0.5rem' }}>
          Try:
        </span>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(suggestion);
              onSearch(suggestion);
            }}
            className="glass"
            style={{
              padding: '0.375rem 0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74, 85, 104, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(74, 85, 104, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartSearchBar;
