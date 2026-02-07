import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bucketService, emailService } from '../../services/auth';
import BucketTabs from './BucketTabs';
import EmailCard from './EmailCard';

const BucketView = ({ onDeleteBucket, deletingBucket, creatingBucket, deletingBucketId, creatingBucketId }) => {
  const [activeBucketId, setActiveBucketId] = useState(null);

  const { data: bucketsData, isLoading: bucketsLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: bucketService.getBuckets
  });

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['emails', activeBucketId],
    queryFn: () => emailService.getEmails({ bucketId: activeBucketId })
  });

  // Auto-select the newly created bucket to show the loading overlay
  React.useEffect(() => {
    if (creatingBucketId) {
      setActiveBucketId(creatingBucketId);
    }
  }, [creatingBucketId]);

  if (bucketsLoading) {
    return <div className="loading">Loading buckets...</div>;
  }

  const buckets = bucketsData?.data || [];
  const emails = emailsData?.data?.emails || [];

  // Show loading overlay only when viewing the specific bucket being created or deleted
  const showLoadingOverlay =
    (creatingBucket && activeBucketId === creatingBucketId) ||
    (deletingBucket && activeBucketId === deletingBucketId);

  return (
    <div>
      <BucketTabs
        buckets={buckets}
        activeBucketId={activeBucketId}
        onSelectBucket={setActiveBucketId}
        onShowAll={() => setActiveBucketId(null)}
        onDeleteBucket={onDeleteBucket}
        deletingBucket={deletingBucket}
        creatingBucket={creatingBucket}
        deletingBucketId={deletingBucketId}
        creatingBucketId={creatingBucketId}
      />

      {showLoadingOverlay ? (
        // Loading overlay when reclassifying emails for this specific bucket
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div className="glass-dark" style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: `1px solid ${creatingBucket ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            backgroundColor: creatingBucket ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}>
            <div
              className="spinner-lg"
              style={{
                borderColor: creatingBucket ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                borderTopColor: creatingBucket ? '#3B82F6' : '#ef4444',
                margin: '0 auto 1.5rem'
              }}
            />
            <div style={{
              fontWeight: '700',
              fontSize: '1.25rem',
              color: creatingBucket ? '#3B82F6' : '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {creatingBucket ? 'Creating bucket and reclassifying emails...' : 'Deleting bucket and reclassifying emails...'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              This may take a moment depending on how many emails you have
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem' }}>
              {creatingBucket ? 'You can view other buckets while this completes' : 'Switch to another bucket to continue browsing'}
            </div>
          </div>
        </div>
      ) : emailsLoading ? (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner-lg" style={{ borderTopColor: '#3B82F6' }} />
          <div style={{
            fontWeight: '600',
            fontSize: '1.125rem',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Loading emails...
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            If this is your first sync, it may take a minute
          </div>
        </div>
      ) : emails.length === 0 ? (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center',
          padding: '3rem'
        }}>
          <div style={{ fontSize: '3rem' }}>📭</div>
          <div style={{
            fontWeight: '600',
            fontSize: '1.125rem',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            No emails found
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {activeBucketId ? 'Try selecting a different bucket' : 'Click "Sync Emails" to fetch your Gmail messages'}
          </div>
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

export default BucketView;
