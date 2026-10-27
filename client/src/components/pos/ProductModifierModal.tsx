import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { Product, ProductModifierGroup, SelectedModifierItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface ProductModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (product: Product, selectedModifiers: SelectedModifierItem[], qty: number) => void;
}

export const ProductModifierModal: React.FC<ProductModifierModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
}) => {
  const [qty, setQty] = useState(1);
  // Map of group_id -> Set of selected option_ids (or single option_id)
  const [selectedSingle, setSelectedSingle] = useState<Record<string, string>>({});
  const [selectedMultiple, setSelectedMultiple] = useState<Record<string, string[]>>({});

  // Reset/Initialize state when product changes or modal opens
  useEffect(() => {
    if (isOpen && product && product.modifiers && product.modifiers.length > 0) {
      setQty(1);
      const initialSingle: Record<string, string> = {};
      const initialMultiple: Record<string, string[]> = {};

      product.modifiers.forEach((group: ProductModifierGroup) => {
        if (group.selection_type === 'SINGLE') {
          // Select the first option by default
          if (group.options && group.options.length > 0) {
            initialSingle[group.id] = group.options[0].id;
          }
        } else {
          initialMultiple[group.id] = [];
        }
      });

      setSelectedSingle(initialSingle);
      setSelectedMultiple(initialMultiple);
    }
  }, [isOpen, product]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product || !product.modifiers || product.modifiers.length === 0) {
    return null;
  }

  const basePrice = Number(product.selling_price) || 0;

  // Build the list of SelectedModifierItem based on current selections
  const currentSelectedItems = useMemo<SelectedModifierItem[]>(() => {
    const items: SelectedModifierItem[] = [];

    product.modifiers?.forEach((group) => {
      if (group.selection_type === 'SINGLE') {
        const selectedOptId = selectedSingle[group.id];
        const opt = group.options.find((o) => o.id === selectedOptId);
        if (opt) {
          items.push({
            group_id: group.id,
            group_name: group.name,
            option_id: opt.id,
            name: opt.name,
            price: Number(opt.price) || 0,
            linked_product_id: opt.linked_product_id,
            qty_deduct: opt.qty_deduct,
          });
        }
      } else {
        const selectedOptIds = selectedMultiple[group.id] || [];
        selectedOptIds.forEach((optId) => {
          const opt = group.options.find((o) => o.id === optId);
          if (opt) {
            items.push({
              group_id: group.id,
              group_name: group.name,
              option_id: opt.id,
              name: opt.name,
              price: Number(opt.price) || 0,
              linked_product_id: opt.linked_product_id,
              qty_deduct: opt.qty_deduct,
            });
          }
        });
      }
    });

    return items;
  }, [product, selectedSingle, selectedMultiple]);

  // Modifier extra sum per item
  const modifierExtraPerItem = currentSelectedItems.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = basePrice + modifierExtraPerItem;
  const grandTotal = unitPrice * qty;

  // Validation: check if all required groups are satisfied
  const isFormValid = useMemo(() => {
    if (!product.modifiers) return true;
    for (const group of product.modifiers) {
      if (group.required) {
        if (group.selection_type === 'SINGLE') {
          if (!selectedSingle[group.id]) return false;
        } else {
          const arr = selectedMultiple[group.id] || [];
          if (arr.length === 0) return false;
        }
      }
    }
    return true;
  }, [product.modifiers, selectedSingle, selectedMultiple]);

  const handleToggleMultiple = (groupId: string, optionId: string) => {
    setSelectedMultiple((prev) => {
      const current = prev[groupId] || [];
      const exists = current.includes(optionId);
      const updated = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [groupId]: updated };
    });
  };

  const handleSelectSingle = (groupId: string, optionId: string) => {
    setSelectedSingle((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const handleConfirm = () => {
    if (!isFormValid) return;
    onConfirm(product, currentSelectedItems, qty);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10060,
        padding: 'clamp(0.5rem, 2vw, 1rem)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '520px',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.18s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                }}
              >
                <Sparkles size={11} /> Kustomisasi Pesanan
              </span>
            </div>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              {product.product_name}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.15rem' }}>
              Harga Dasar: <strong style={{ color: '#0f172a' }}>{formatRupiah(basePrice)}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body - Modifiers List */}
        <div
          style={{
            padding: '1rem 1.25rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
          }}
        >
          {product.modifiers.map((group) => {
            const isSingle = group.selection_type === 'SINGLE';

            return (
              <div
                key={group.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                      {group.name}
                    </span>
                    {group.required && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                        }}
                      >
                        Wajib
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    {isSingle ? 'Pilih salah satu' : 'Bisa pilih lebih dari satu'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: group.options.length > 2 ? '1fr 1fr' : '1fr',
                    gap: '0.5rem',
                  }}
                >
                  {group.options.map((opt) => {
                    const isSelected = isSingle
                      ? selectedSingle[group.id] === opt.id
                      : (selectedMultiple[group.id] || []).includes(opt.id);

                    const priceDelta = Number(opt.price) || 0;

                    return (
                      <div
                        key={opt.id}
                        onClick={() =>
                          isSingle
                            ? handleSelectSingle(group.id, opt.id)
                            : handleToggleMultiple(group.id, opt.id)
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: isSelected
                            ? '2px solid #2563eb'
                            : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: isSingle ? '50%' : '5px',
                              border: isSelected ? '2px solid #2563eb' : '2px solid #94a3b8',
                              background: isSelected ? '#2563eb' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                          </div>
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: isSelected ? 800 : 600,
                              color: isSelected ? '#1e40af' : '#1e293b',
                              wordBreak: 'break-word',
                            }}
                          >
                            {opt.name}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: priceDelta > 0 ? '#16a34a' : '#64748b',
                            marginLeft: '0.5rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {priceDelta > 0 ? `+${formatRupiah(priceDelta)}` : 'Termasuk'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Qty + Live Pricing + Submit */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Quantity selector & Unit Price Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                Jumlah Porsi:
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  padding: '0.15rem',
                  border: '1px solid #cbd5e1',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#1e293b',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span
                  style={{
                    minWidth: '34px',
                    textAlign: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((prev) => prev + 1)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#1e293b',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Harga Satuan: <strong>{formatRupiah(unitPrice)}</strong>
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#2563eb' }}>
                {formatRupiah(grandTotal)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isFormValid}
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '12px',
                border: 'none',
                background: isFormValid
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: isFormValid ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
              }}
            >
              <ShoppingBag size={16} />
              Tambahkan ({formatRupiah(grandTotal)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
