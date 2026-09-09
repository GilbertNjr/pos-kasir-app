import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface ResponsivePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
  themeColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ResponsivePagination: React.FC<ResponsivePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemName = 'data',
  themeColor = '#2563eb',
  className = '',
  style = {},
}) => {
  if (totalItems <= 0) return null;

  const validCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(validCurrentPage * itemsPerPage, totalItems);

  // Compute smart windowed page numbers for desktop view (max 7 items)
  const getDesktopPages = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  };

  const desktopPages = getDesktopPages();

  return (
    <div
      className={`pos-pagination-container ${className}`}
      style={
        {
          '--pagination-theme': themeColor,
          ...style,
        } as React.CSSProperties
      }
    >
      {/* Top Row / Left Info */}
      <div className="pos-pagination-top-row">
        <div className="pos-pagination-info">
          Menampilkan <strong>{startIndex}</strong> - <strong>{endIndex}</strong> dari{' '}
          <strong>{totalItems}</strong> {itemName}
        </div>

        {/* Page size dropdown on Mobile (compact) */}
        {onPageSizeChange && (
          <div className="pos-page-size-selector pos-page-size-mobile-only">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="pos-page-size-select"
              aria-label={`Jumlah ${itemName} per halaman`}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / hal
                </option>
              ))}
              {totalItems > 100 && <option value={totalItems}>Semua ({totalItems})</option>}
            </select>
          </div>
        )}
      </div>

      {/* Desktop Pagination Controls (Visible on Tablet & Desktop >= 641px) */}
      <div className="pos-pagination-desktop">
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="pos-page-btn"
          title="Halaman Sebelumnya"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>

        {desktopPages.map((pageItem, idx) => {
          if (pageItem === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="pos-page-ellipsis">
                •••
              </span>
            );
          }

          const pageNumber = pageItem as number;
          const isActive = pageNumber === validCurrentPage;

          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`pos-page-btn ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="pos-page-btn"
          title="Halaman Selanjutnya"
          aria-label="Halaman Selanjutnya"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Mobile Pagination Controls (Visible on Phones <= 640px) */}
      <div className="pos-pagination-mobile">
        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="pos-mobile-nav-btn"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={18} />
          <span>Sebelumnya</span>
        </button>

        <div className="pos-mobile-page-select-container">
          <select
            value={validCurrentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="pos-mobile-page-select"
            aria-label="Pilih Halaman"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Hal. {p} dari {totalPages}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pos-mobile-page-select-chevron" />
        </div>

        <button
          type="button"
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="pos-mobile-nav-btn"
          aria-label="Halaman Selanjutnya"
        >
          <span>Selanjutnya</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Desktop Items Per Page Selector (Visible on Desktop) */}
      {onPageSizeChange && (
        <div className="pos-page-size-selector pos-page-size-desktop-only">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="pos-page-size-select"
            aria-label={`Jumlah ${itemName} per halaman`}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / halaman
              </option>
            ))}
            {totalItems > 100 && <option value={totalItems}>Semua ({totalItems})</option>}
          </select>
        </div>
      )}
    </div>
  );
};
