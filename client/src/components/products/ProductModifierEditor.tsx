import React from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { Product, ProductModifierGroup, ProductModifierOption } from '../../types';

interface ProductModifierEditorProps {
  modifiers: ProductModifierGroup[];
  onChange: (modifiers: ProductModifierGroup[]) => void;
  availableProducts: Product[];
  currentProductId?: string;
}

export const ProductModifierEditor: React.FC<ProductModifierEditorProps> = ({
  modifiers,
  onChange,
  availableProducts,
  currentProductId,
}) => {
  const stockCandidateProducts = availableProducts.filter(
    (p) => p.manage_stock && p.product_id !== currentProductId && !p.linked_product_id
  );

  const handleAddGroup = () => {
    const newGroup: ProductModifierGroup = {
      id: `grp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: modifiers.length === 0 ? 'Cara Penyajian' : 'Topping / Tambahan',
      selection_type: modifiers.length === 0 ? 'SINGLE' : 'MULTIPLE',
      required: modifiers.length === 0,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          name: modifiers.length === 0 ? 'Mentah / Bawa Pulang' : 'Telur Ayam',
          price: 0,
          linked_product_id: null,
          qty_deduct: 1,
        },
        {
          id: `opt-${Date.now()}-2`,
          name: modifiers.length === 0 ? 'Dimasak di Tempat' : 'Sosis',
          price: modifiers.length === 0 ? 4500 : 3000,
          linked_product_id: null,
          qty_deduct: 1,
        },
      ],
    };
    onChange([...modifiers, newGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    onChange(modifiers.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<ProductModifierGroup>) => {
    onChange(
      modifiers.map((g) => {
        if (g.id === groupId) {
          return { ...g, ...updates };
        }
        return g;
      })
    );
  };

  const handleAddOption = (groupId: string) => {
    const newOption: ProductModifierOption = {
      id: `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: '',
      price: 0,
      linked_product_id: null,
      qty_deduct: 1,
    };

    onChange(
      modifiers.map((g) => {
        if (g.id === groupId) {
          return { ...g, options: [...g.options, newOption] };
        }
        return g;
      })
    );
  };

  const handleRemoveOption = (groupId: string, optionId: string) => {
    onChange(
      modifiers.map((g) => {
        if (g.id === groupId) {
          return { ...g, options: g.options.filter((o) => o.id !== optionId) };
        }
        return g;
      })
    );
  };

  const handleUpdateOption = (
    groupId: string,
    optionId: string,
    updates: Partial<ProductModifierOption>
  ) => {
    onChange(
      modifiers.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            options: g.options.map((o) => (o.id === optionId ? { ...o, ...updates } : o)),
          };
        }
        return g;
      })
    );
  };

  return (
    <div
      style={{
        marginTop: '1rem',
        padding: '0.85rem',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Layers size={16} color="#4f46e5" />
            Varian, Cara Saji, & Topping / Mix (Opsional)
          </span>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.725rem', color: '#64748b' }}>
            Atur pilihan penyajian (mentah/masak) atau topping tambahan (telur/sosis) yang bisa di-mix di kasir.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddGroup}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #c7d2fe',
            background: '#eef2ff',
            color: '#4338ca',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          + Tambah Grup Pilihan
        </button>
      </div>

      {modifiers.length === 0 ? (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            color: '#64748b',
            fontSize: '0.775rem',
          }}
        >
          Belum ada varian atau topping untuk produk ini. Klik <b>"+ Tambah Grup Pilihan"</b> jika ingin membuat menu olahan/topping.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {modifiers.map((group, groupIdx) => (
            <div
              key={group.id || groupIdx}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Grup Header Form */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.65rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ flex: 2, minWidth: '150px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                    Nama Grup:
                  </label>
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                    placeholder="Contoh: Cara Penyajian / Pilihan Topping"
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                    required
                  />
                </div>

                <div style={{ flex: 1.5, minWidth: '130px' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                    Tipe Seleksi:
                  </label>
                  <select
                    value={group.selection_type}
                    onChange={(e) =>
                      handleUpdateGroup(group.id, {
                        selection_type: e.target.value as 'SINGLE' | 'MULTIPLE',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  >
                    <option value="SINGLE">🔘 Pilih 1 Saja (Radio)</option>
                    <option value="MULTIPLE">☑️ Bisa Di-Mix (Checkbox)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={group.required}
                      onChange={(e) => handleUpdateGroup(group.id, { required: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    Wajib 1
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.id)}
                  title="Hapus Grup Ini"
                  style={{
                    marginLeft: 'auto',
                    marginTop: '0.9rem',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #fee2e2',
                    background: '#fef2f2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Trash2 size={13} />
                  Hapus Grup
                </button>
              </div>

              {/* Opsi List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>
                  Daftar Pilihan / Opsi ({group.options.length} Opsi):
                </span>

                {group.options.map((opt, optIdx) => (
                  <div
                    key={opt.id || optIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 2, minWidth: '120px' }}>
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) =>
                          handleUpdateOption(group.id, opt.id, { name: e.target.value })
                        }
                        placeholder="Nama Opsi (misal: Dimasak / Telur)"
                        style={{
                          width: '100%',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.775rem',
                          fontWeight: 700,
                          outline: 'none',
                        }}
                        required
                      />
                    </div>

                    <div style={{ width: '90px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0.35rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>+Rp</span>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={opt.price}
                          onChange={(e) =>
                            handleUpdateOption(group.id, opt.id, { price: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '0.3rem 0.35rem 0.3rem 1.6rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                            textAlign: 'right',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Dropdown Tautkan Pemotongan Stok Bahan Fisik */}
                    <div style={{ flex: 2, minWidth: '150px' }}>
                      <select
                        value={opt.linked_product_id || ''}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          handleUpdateOption(group.id, opt.id, { linked_product_id: val });
                        }}
                        style={{
                          width: '100%',
                          padding: '0.3rem 0.45rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          outline: 'none',
                          background: opt.linked_product_id ? '#ecfdf5' : '#ffffff',
                          color: opt.linked_product_id ? '#065f46' : '#334155',
                        }}
                      >
                        <option value="">-- Tanpa Potong Bahan (Jasa) --</option>
                        <option value="self">📦 Potong Mie Ini Tambahan (+1 Pcs)</option>
                        {stockCandidateProducts.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            📦 Potong: {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {opt.linked_product_id && (
                      <div style={{ width: '55px', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <input
                          type="number"
                          min={0.1}
                          step={0.5}
                          value={opt.qty_deduct ?? 1}
                          onChange={(e) =>
                            handleUpdateOption(group.id, opt.id, {
                              qty_deduct: Number(e.target.value) || 1,
                            })
                          }
                          title="Jumlah bahan fisik terpotong per porsi"
                          style={{
                            width: '100%',
                            padding: '0.3rem 0.2rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.725rem',
                            textAlign: 'center',
                          }}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveOption(group.id, opt.id)}
                      disabled={group.options.length <= 1}
                      title="Hapus Opsi"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: group.options.length <= 1 ? '#cbd5e1' : '#ef4444',
                        cursor: group.options.length <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddOption(group.id)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: '0.3rem',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px dashed #94a3b8',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Tambah Pilihan Opsi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
