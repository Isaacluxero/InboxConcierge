import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import BucketView from '../components/EmailBuckets/BucketView';
import SmartSearchBar from '../components/Search/SmartSearchBar';
import SearchResults from '../components/Search/SearchResults';
import CreateBucketModal from '../components/BucketManager/CreateBucketModal';
import Dashboard from '../components/Analytics/Dashboard';
import { emailService, bucketService } from '../services/auth';
import { useSmartSearch } from '../hooks/useSearch';

/**
 * Main dashboard page component
 * Handles email viewing, bucket management, search, and analytics
 *
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @param {Function} props.onLogout - Logout handler
 */
const DashboardPage = ({ user, onLogout }) => {
  const queryClient = useQueryClient();
  const { search, results, clearResults, isLoading: searchLoading } = useSmartSearch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [deletingBucketId, setDeletingBucketId] = useState(null);
  const [creatingBucketId, setCreatingBucketId] = useState(null);

  const syncMutation = useMutation({
    mutationFn: emailService.syncEmails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });

  const createBucketMutation = useMutation({
    mutationFn: async (data) => {
      const result = await bucketService.createBucket(data);

      // Optimistically add new bucket to cache so it shows immediately
      queryClient.setQueryData(['buckets'], (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: [...old.data, { ...result.data, _count: { emails: 0 } }]
        };
      });

      // Set ID so loading overlay shows when clicking the new bucket
      setCreatingBucketId(result.data.id);

      // Reclassify ALL emails to check if they belong in the new bucket
      await bucketService.reclassifyEmails({ all: true });
      return result;
    },
    onSuccess: () => {
      // Refetch to get accurate email counts
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setCreatingBucketId(null);
    },
    onError: () => {
      setCreatingBucketId(null);
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });

  const deleteBucketMutation = useMutation({
    mutationFn: async (bucketId) => {
      setDeletingBucketId(bucketId);
      const result = await bucketService.deleteBucket(bucketId);
      // Reclassify ALL emails since bucket definitions changed
      await bucketService.reclassifyEmails({ all: true });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      setDeletingBucketId(null);
    },
    onError: () => {
      setDeletingBucketId(null);
    }
  });

  const isReclassifying = createBucketMutation.isPending || deleteBucketMutation.isPending;

  // Auto-close modal when bucket creation starts
  React.useEffect(() => {
    if (createBucketMutation.isPending) {
      setShowCreateModal(false);
    }
  }, [createBucketMutation.isPending]);

  // Auto-sync emails on session start
  React.useEffect(() => {
    syncMutation.mutate();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  React.useEffect(() => {
    if (syncMutation.isSuccess) {
      const timer = setTimeout(() => syncMutation.reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncMutation.isSuccess]);

  React.useEffect(() => {
    if (createBucketMutation.isSuccess) {
      const timer = setTimeout(() => createBucketMutation.reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [createBucketMutation.isSuccess]);

  React.useEffect(() => {
    if (deleteBucketMutation.isSuccess) {
      const timer = setTimeout(() => deleteBucketMutation.reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteBucketMutation.isSuccess]);

  return (
    <div style={{ minHeight: '100vh' }} className="pb-lg">
      <header className="glass-dark card-header">
        <div className="container flex-between flex-wrap flex-gap-lg">
          <h1 className="heading-lg gradient-text">
            Inbox Concierge
          </h1>

          <div className="flex-gap-md flex-wrap" style={{ alignItems: 'center' }}>
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                if (!showAnalytics) {
                  clearResults();
                }
              }}
              className="btn btn-secondary"
            >
              {showAnalytics ? 'Back to Inbox' : 'View Insights'}
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={isReclassifying}
              className="btn btn-secondary"
              style={{
                opacity: isReclassifying ? 0.5 : 1,
                cursor: isReclassifying ? 'not-allowed' : 'pointer'
              }}
            >
              + New Bucket
            </button>

            <div className="glass user-badge">
              {user?.email || 'User'}
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {showAnalytics ? (
          <Dashboard onClose={() => setShowAnalytics(false)} />
        ) : (
          <>
            <SmartSearchBar onSearch={search} isLoading={searchLoading} />

            {results ? (
              <SearchResults results={results} onClear={clearResults} />
            ) : (
              <BucketView
                onDeleteBucket={(bucketId) => deleteBucketMutation.mutate(bucketId)}
                deletingBucket={deleteBucketMutation.isPending}
                creatingBucket={createBucketMutation.isPending}
                deletingBucketId={deletingBucketId}
                creatingBucketId={creatingBucketId}
              />
            )}
          </>
        )}

        {syncMutation.isSuccess && (
          <div className="success mt-md">
            Successfully synced {syncMutation.data.data.saved} emails, classified {syncMutation.data.data.classified}, and prepared {syncMutation.data.data.embeddings} for search
          </div>
        )}

        {createBucketMutation.isSuccess && (
          <div className="success mt-md">
            Successfully created bucket and reclassified all emails!
          </div>
        )}

        {createBucketMutation.isError && (
          <div className="error mt-md">
            Unable to create bucket. Please try again.
          </div>
        )}

        {deleteBucketMutation.isError && (
          <div className="error mt-md">
            Unable to delete bucket. Please try again.
          </div>
        )}
      </main>

      <CreateBucketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createBucketMutation.mutate(data)}
      />
    </div>
  );
};

export default DashboardPage;
