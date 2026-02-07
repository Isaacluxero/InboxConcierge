import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GoogleAuthButton from './components/Auth/GoogleAuthButton';
import BucketView from './components/EmailBuckets/BucketView';
import SmartSearchBar from './components/Search/SmartSearchBar';
import SearchResults from './components/Search/SearchResults';
import CreateBucketModal from './components/BucketManager/CreateBucketModal';
import Dashboard from './components/Analytics/Dashboard';
import { authService, emailService, bucketService, searchService } from './services/auth';
import { useSmartSearch } from './hooks/useSearch';

const LoginPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-dark" style={{
        textAlign: 'center',
        maxWidth: '520px',
        padding: '3rem 2.5rem',
        margin: '1rem'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1.5rem',
          fontWeight: '900',
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: '-0.05em'
        }}>
          📧
        </div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '900',
          marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.025em'
        }}>
          Inbox Concierge
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '2.5rem',
          fontWeight: '500'
        }}>
          AI-powered email management with smart search
        </p>
        <GoogleAuthButton />
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '2rem',
          lineHeight: '1.6'
        }}>
          Sign in with Google to start organizing your inbox with AI
        </p>
      </div>
    </div>
  );
};

const DashboardPage = ({ user, onLogout }) => {
  const queryClient = useQueryClient();
  const { search, results, clearResults, isLoading: searchLoading } = useSmartSearch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const syncMutation = useMutation({
    mutationFn: emailService.syncEmails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });

  const createBucketMutation = useMutation({
    mutationFn: bucketService.createBucket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });

  const reclassifyMutation = useMutation({
    mutationFn: bucketService.reclassifyEmails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['buckets'] });
    }
  });

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      <header className="glass-dark" style={{
        padding: '1.5rem 0',
        marginBottom: '2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ffffff 0%, #d1d5db 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.025em'
          }}>
            Inbox Concierge
          </h1>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
              className="btn btn-secondary"
            >
              + New Bucket
            </button>

            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="btn btn-primary"
            >
              {syncMutation.isPending ? (
                <>
                  <span className="spinner" />
                  Syncing<span className="loading-dots" />
                </>
              ) : (
                'Sync Emails'
              )}
            </button>

            <button
              onClick={() => reclassifyMutation.mutate()}
              disabled={reclassifyMutation.isPending}
              className="btn btn-gradient"
              style={{
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {reclassifyMutation.isPending && (
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s infinite',
                  pointerEvents: 'none'
                }} />
              )}
              {reclassifyMutation.isPending ? (
                <>
                  <span className="spinner-lg" />
                  Reclassifying<span className="loading-dots" />
                </>
              ) : (
                'Reclassify All'
              )}
            </button>

            <div className="glass" style={{
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: '#fff',
              fontWeight: '500'
            }}>
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
              <BucketView />
            )}
          </>
        )}

        {syncMutation.isSuccess && (
          <div className="success" style={{ marginTop: '1rem' }}>
            Successfully synced {syncMutation.data.data.saved} emails, classified {syncMutation.data.data.classified}, and prepared {syncMutation.data.data.embeddings} for search
          </div>
        )}

        {syncMutation.isError && (
          <div className="error" style={{ marginTop: '1rem' }}>
            Error: {syncMutation.error.message}
          </div>
        )}

        {reclassifyMutation.isSuccess && (
          <div className="success" style={{ marginTop: '1rem' }}>
            Successfully reclassified {reclassifyMutation.data.data.classified} emails!
          </div>
        )}

        {reclassifyMutation.isError && (
          <div className="error" style={{ marginTop: '1rem' }}>
            Reclassification error: {reclassifyMutation.error.message}
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

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner-large" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: '#fff' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
