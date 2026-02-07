import React from 'react';

const EmailCard = ({ email, onClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className="glass-dark"
      style={{
        padding: '1rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.6)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.5)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.25rem' }}>
            {email.sender}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            {email.senderEmail}
          </div>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap' }}>
          {formatDate(email.receivedAt)}
        </div>
      </div>

      <div style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '0.5rem' }}>
        {email.subject}
      </div>

      <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.5' }}>
        {email.preview.substring(0, 150)}
        {email.preview.length > 150 && '...'}
      </div>

      {email.bucket && (
        <div style={{ marginTop: '0.75rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              backgroundColor: email.bucket.color || '#6b7280',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '500',
              borderRadius: '9999px'
            }}
          >
            {email.bucket.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default EmailCard;
