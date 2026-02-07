import React, { useState } from 'react';

const CreateBucketModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#06B6D4'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, description, color });
    setName('');
    setDescription('');
    setColor('#3B82F6');
    onClose();
  };

  if (!isOpen) return null;

  return (
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
        maxWidth: '500px',
        width: '100%',
        margin: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.95)' }}>
          Create New Bucket
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Bucket Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="glass"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.95)',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="glass"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '1rem',
                color: 'rgba(255, 255, 255, 0.95)',
                outline: 'none',
                transition: 'all 0.3s ease',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: c,
                    border: color === c ? '3px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: color === c ? '0 0 0 2px rgba(255, 255, 255, 0.1)' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create Bucket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBucketModal;
