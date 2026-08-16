import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface PeriodFilterState {
  period_type: PeriodType;
  start_date?: string;
  end_date?: string;
}

interface PeriodFilterBarProps {
  currentFilter: PeriodFilterState;
  onFilterChange: (filter: PeriodFilterState) => void;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({ currentFilter, onFilterChange }) => {
  const [showCustom, setShowCustom] = useState(currentFilter.period_type === 'CUSTOM');
  const [startDate, setStartDate] = useState(currentFilter.start_date || '');
  const [endDate, setEndDate] = useState(currentFilter.end_date || '');

  const handleSelectType = (type: PeriodType) => {
    if (type === 'CUSTOM') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onFilterChange({ period_type: type });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    onFilterChange({
      period_type: 'CUSTOM',
      start_date: startDate,
      end_date: endDate,
    });
  };

  const options: { type: PeriodType; label: string; icon?: string }[] = [
    { type: 'DAILY', label: 'Hari Ini' },
    { type: 'WEEKLY', label: '7 Hari Terakhir' },
    { type: 'MONTHLY', label: 'Bulan Ini' },
    { type: 'YEARLY', label: 'Tahun Ini' },
    { type: 'CUSTOM', label: 'Rentang Custom' },
  ];

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '0.85rem 1.35rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b45309',
            border: '1px solid #fde68a',
          }}
        >
          <Filter size={17} />
        </div>
        <div>
          <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
            Filter Periode Waktu
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Sesuaikan cakupan data metrik & grafik
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.35rem',
          alignItems: 'center',
          background: '#f8fafc',
          padding: '0.35rem',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
        }}
      >
        {options.map((opt) => {
          const isActive = currentFilter.period_type === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleSelectType(opt.type)}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 600,
                border: isActive ? '1px solid #b45309' : '1px solid transparent',
                background: isActive ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 12px rgba(180, 83, 9, 0.25)' : 'none',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <form
          onSubmit={handleApplyCustom}
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            width: '100%',
            marginTop: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #e2e8f0',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#475569', fontWeight: 600 }}>
            <Calendar size={15} color="#2563eb" />
            <span>Mulai:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                fontWeight: 600,
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#475569', fontWeight: 600 }}>
            <span>Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                fontWeight: 600,
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
            }}
          >
            Terapkan Filter
          </button>
        </form>
      )}
    </div>
  );
};
