import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Filter Skeleton */}
      <div style={{ height: '48px', background: '#e2e8f0', borderRadius: '10px', width: '100%', animation: 'pulse 1.5s infinite' }} />

      {/* KPI Cards Skeleton (5 Cards Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '110px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ height: '14px', width: '60%', background: '#e2e8f0', borderRadius: '4px' }} />
            <div style={{ height: '24px', width: '80%', background: '#cbd5e1', borderRadius: '4px' }} />
            <div style={{ height: '10px', width: '40%', background: '#e2e8f0', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div style={{ height: '280px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }} />
        <div style={{ height: '280px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }} />
      </div>

      {/* Products & Employee Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div style={{ height: '240px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }} />
        <div style={{ height: '240px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }} />
      </div>
    </div>
  );
};
