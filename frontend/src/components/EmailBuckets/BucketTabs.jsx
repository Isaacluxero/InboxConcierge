import React, { useState } from 'react';

const BucketTabs = ({ buckets, activeBucketId, onSelectBucket, onShowAll, onDeleteBucket, deletingBucket, creatingBucket, deletingBucketId, creatingBucketId }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDeleteClick = (bucket, e) => {
    e.stopPropagation();
    // Don't allow delete if a bucket is being created or deleted
    if (creatingBucket || deletingBucket) return;
    setConfirmDelete(bucket);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDeleteBucket(confirmDelete.id);
      setConfirmDelete(null);
    }
  };

  return (
    <>
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
            <div
              key={bucket.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <button
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
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {bucket.name}
                {creatingBucketId === bucket.id && (
                  <span
                    className="spinner"
                    style={{
                      width: '12px',
                      height: '12px',
                      borderWidth: '2px',
                      borderColor: 'rgba(59, 130, 246, 0.3)',
                      borderTopColor: '#3B82F6'
                    }}
                  />
                )}
                {deletingBucketId === bucket.id && (
                  <span
                    className="spinner"
                    style={{
                      width: '12px',
                      height: '12px',
                      borderWidth: '2px',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      borderTopColor: '#ef4444'
                    }}
                  />
                )}
                {bucket._count?.emails > 0 && (
                  <span
                    style={{
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
              {!bucket.isDefault && activeBucketId === bucket.id && (
                <button
                  onClick={(e) => handleDeleteClick(bucket, e)}
                  disabled={creatingBucket || deletingBucket}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: (creatingBucket || deletingBucket) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    opacity: (creatingBucket || deletingBucket) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!creatingBucket && !deletingBucket) {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!creatingBucket && !deletingBucket) {
                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    }
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deletion in progress message */}
      {deletingBucketId && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div
            className="spinner"
            style={{
              width: '16px',
              height: '16px',
              borderWidth: '2px',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              borderTopColor: '#ef4444'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#ef4444',
              marginBottom: '0.25rem'
            }}>
              Deleting bucket and reclassifying emails...
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              This may take a moment. All emails will be redistributed to remaining buckets.
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-dark" style={{
            padding: '2rem',
            maxWidth: '400px',
            width: '100%',
            margin: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'rgba(255, 255, 255, 0.95)'
            }}>
              Delete Bucket?
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete "<strong>{confirmDelete.name}</strong>"? This will unassign all emails from this bucket and reclassify them.
            </p>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingBucket || creatingBucket}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingBucket || creatingBucket}
                className="btn"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: (deletingBucket || creatingBucket) ? 'not-allowed' : 'pointer',
                  opacity: (deletingBucket || creatingBucket) ? 0.6 : 1
                }}
              >
                {deletingBucket ? 'Deleting...' : creatingBucket ? 'Bucket Operation in Progress...' : 'Delete Bucket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BucketTabs;
