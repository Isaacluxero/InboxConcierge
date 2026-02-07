import React from 'react';

const BucketTabs = ({ buckets, activeBucketId, onSelectBucket, onShowAll }) => {
  return (
    <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={onShowAll}
          className={activeBucketId === null ? 'glass' : ''}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: activeBucketId === null ? 'rgba(74, 85, 104, 0.5)' : 'transparent',
            color: activeBucketId === null ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
            border: 'none',
            borderBottom: activeBucketId === null ? '2px solid rgba(255, 255, 255, 0.5)' : '2px solid transparent',
            fontSize: '0.875rem',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
        >
          All Emails
        </button>

        {buckets.map((bucket) => (
          <button
            key={bucket.id}
            onClick={() => onSelectBucket(bucket.id)}
            className={activeBucketId === bucket.id ? 'glass' : ''}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: activeBucketId === bucket.id ? bucket.color : 'transparent',
              color: activeBucketId === bucket.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
              border: 'none',
              borderBottom: activeBucketId === bucket.id ? `2px solid ${bucket.color}` : '2px solid transparent',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: activeBucketId === bucket.id ? '0.5rem 0.5rem 0 0' : '0',
              whiteSpace: 'nowrap',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {bucket.name}
            {bucket._count?.emails > 0 && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.5rem',
                  backgroundColor: activeBucketId === bucket.id ? 'rgba(255,255,255,0.25)' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
              >
                {bucket._count.emails}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BucketTabs;
