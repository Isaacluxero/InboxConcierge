import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bucketService, emailService } from '../../services/auth';
import BucketTabs from './BucketTabs';
import EmailCard from './EmailCard';

const BucketView = () => {
  const [activeBucketId, setActiveBucketId] = useState(null);

  const { data: bucketsData, isLoading: bucketsLoading } = useQuery({
    queryKey: ['buckets'],
    queryFn: bucketService.getBuckets
  });

  const { data: emailsData, isLoading: emailsLoading } = useQuery({
    queryKey: ['emails', activeBucketId],
    queryFn: () => emailService.getEmails({ bucketId: activeBucketId })
  });

  if (bucketsLoading) {
    return <div className="loading">Loading buckets...</div>;
  }

  const buckets = bucketsData?.data || [];
  const emails = emailsData?.data?.emails || [];

  return (
    <div>
      <BucketTabs
        buckets={buckets}
        activeBucketId={activeBucketId}
        onSelectBucket={setActiveBucketId}
        onShowAll={() => setActiveBucketId(null)}
      />

      {emailsLoading ? (
        <div className="loading">Loading emails...</div>
      ) : emails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>No emails found</p>
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
