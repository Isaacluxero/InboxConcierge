import React from 'react';
import EmailCard from '../EmailBuckets/EmailCard';

const SearchResults = ({ results, onClear }) => {
  if (!results) return null;

  const { emails, totalCount, parsedFilters, query } = results;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="glass-dark" style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.5rem' }}>
              Search Results for "{query}"
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {totalCount && totalCount > emails.length ? (
                <>
                  Showing {emails.length} of <span style={{ color: '#06b6d4', fontWeight: '600' }}>{totalCount}</span> results
                </>
              ) : (
                <>Found {emails.length} email{emails.length !== 1 ? 's' : ''}</>
              )}
            </p>
          </div>
          <button
            onClick={onClear}
            className="btn btn-secondary"
          >
            Clear Search
          </button>
        </div>

        {parsedFilters && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {parsedFilters.topic && (
              <span className="glass" style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                fontWeight: '500',
                borderRadius: '9999px'
              }}>
                Topic: {parsedFilters.topic}
              </span>
            )}
            {parsedFilters.sender && (
              <span className="glass" style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                fontWeight: '500',
                borderRadius: '9999px'
              }}>
                From: {parsedFilters.sender}
              </span>
            )}
            {parsedFilters.timeframe && (
              <span className="glass" style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                fontWeight: '500',
                borderRadius: '9999px'
              }}>
                Timeframe: {new Date(parsedFilters.timeframe.start).toLocaleDateString()}
              </span>
            )}
            {parsedFilters.bucket && (
              <span className="glass" style={{
                padding: '0.375rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                fontWeight: '500',
                borderRadius: '9999px'
              }}>
                Bucket: {parsedFilters.bucket}
              </span>
            )}
          </div>
        )}
      </div>

      {emails.length === 0 ? (
        <div className="glass-dark" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255, 255, 255, 0.6)' }}>
          <p>No emails match your search criteria</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onClick={() => console.log('Email clicked:', email)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
