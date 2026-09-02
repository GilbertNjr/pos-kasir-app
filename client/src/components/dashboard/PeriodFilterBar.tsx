import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

export type PeriodType = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

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
    { type: 'ALL', label: 'Semua Riwayat' },
    { type: 'DAILY', label: 'Hari Ini' },
    { type: 'WEEKLY', label: '7 Hari Terakhir' },
    { type: 'MONTHLY', label: 'Bulan Ini' },
    { type: 'YEARLY', label: 'Tahun Ini' },
    { type: 'CUSTOM', label: 'Rentang Custom' },
  ];

  return (
    <div className="period-filter-card">
      <div className="period-filter-header">
        <div className="period-filter-icon">
          <Filter size={18} />
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

      <div className="period-filter-pills">
        {options.map((opt) => {
          const isActive = currentFilter.period_type === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleSelectType(opt.type)}
              className={`period-filter-pill-btn ${isActive ? 'active' : 'inactive'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <form onSubmit={handleApplyCustom} className="period-custom-range-form">
          <div className="period-custom-range-inputs">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={13} color="#4f46e5" /> Mulai
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#f8fafc',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#64748b' }}>
                Sampai
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#f8fafc',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="period-custom-range-submit"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.8rem',
              fontWeight: 800,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              alignSelf: 'flex-end',
            }}
          >
            Terapkan Filter
          </button>
        </form>
      )}
    </div>
  );
};
