import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, CheckCircle2, RotateCcw, PlayCircle, Printer, FileSpreadsheet, Power, X, Edit3, Trash2, Plus, AlertTriangle, Boxes, Search, PackageCheck, Sparkles, FileText } from 'lucide-react';
import { apiService, ActiveShiftDetailsData } from '../services/api';
import { User, Product } from '../types';
import { formatRupiah, formatDateIndoFull } from '../utils/formatters';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';
import { CustomConfirmModal } from '../components/common/CustomConfirmModal';
import { exportShiftToExcel, printShiftPDF } from '../utils/shiftReportExporter';

interface ShiftPageProps {
  currentUser: User;
  onShiftStatusChange?: () => void;
  storeName?: string;
}

interface StaffEntry {
  id: string;
  name: string;
  time: string;
}

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

const getCurrentTimeHHMM = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

const parseStaffStringToEntries = (staffStringOrArray: string | string[], fallbackTime?: string): StaffEntry[] => {
  let list: string[] = [];
  if (Array.isArray(staffStringOrArray)) {
    list = staffStringOrArray;
  } else if (typeof staffStringOrArray === 'string' && staffStringOrArray.trim()) {
    list = staffStringOrArray.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return list.map((item, idx) => {
    const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
    const name = match && match[1] ? match[1].trim() : item.trim();
    let timeStr = match && match[2] ? match[2].replace(/\s*WIB/i, '').trim() : '';

    if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
      timeStr = fallbackTime || getCurrentTimeHHMM();
    }

    return {
      id: `staff-${idx}-${Date.now()}`,
      name,
      time: timeStr,
    };
  });
};

export const ShiftPage: React.FC<ShiftPageProps> = ({ currentUser, onShiftStatusChange, storeName }) => {
  const [activeShiftData, setActiveShiftData] = useState<ActiveShiftDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State Buka Shift Baru
  const [openInitialCash, setOpenInitialCash] = useState<number | ''>(50000);
  const [shiftDateInput, setShiftDateInput] = useState<string>(getTodayDateString());
  const [shiftTimeInput, setShiftTimeInput] = useState<string>(getCurrentTimeString());
  const [shiftCategoryOption, setShiftCategoryOption] = useState<string>('Shift Pagi');
  const [shiftCustomCategory, setShiftCustomCategory] = useState<string>('');
  const [openStaffEntries, setOpenStaffEntries] = useState<StaffEntry[]>([
    { id: `open-1`, name: currentUser.full_name, time: getCurrentTimeHHMM() },
  ]);

  // Form State Kas Tambahan
  const [addCapitalAmount, setAddCapitalAmount] = useState<number | ''>('');

  // Form State Tutup Shift
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualPhysicalCash, setActualPhysicalCash] = useState<number | ''>('');

  // Loading Modals
  const [openLoading, setOpenLoading] = useState(false);
  const [capitalLoading, setCapitalLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);

  // Modal State Edit Shift Sesi Aktif
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [editStaffEntries, setEditStaffEntries] = useState<StaffEntry[]>([]);

  // Modal State Hapus Rekonsiliasi Confirmation
  const [showConfirmDeleteReconciliation, setShowConfirmDeleteReconciliation] = useState(false);
  const [showConfirmCloseShiftModal, setShowConfirmCloseShiftModal] = useState(false);

  // State Mode Rekap Shift via Hitung Sisa Stok (Fast Stock Audit)
  const [showStockAuditModal, setShowStockAuditModal] = useState(false);
  const [auditMode, setAuditMode] = useState<'DIRECT_SOLD' | 'RACK_REMAINING'>('DIRECT_SOLD');
  const [auditProducts, setAuditProducts] = useState<Product[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSubmitting, setAuditSubmitting] = useState(false);
  const [auditStockInput, setAuditStockInput] = useState<Record<string, string>>({});
  const [auditFcPages, setAuditFcPages] = useState<string>('');
  const [auditFcPrice, setAuditFcPrice] = useState<number>(250);
  const [auditPrintRevenue, setAuditPrintRevenue] = useState<string>('');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const handleOpenStockAuditModal = async () => {
    setShowStockAuditModal(true);
    setAuditLoading(true);
    try {
      const products = await apiService.getProducts();
      const activeProds = products.filter((p) => p.is_active !== false);
      setAuditProducts(activeProds);

      const initialInputs: Record<string, string> = {};
      if (auditMode === 'RACK_REMAINING') {
        activeProds.forEach((p) => {
          if (p.manage_stock && p.stock !== undefined) {
            initialInputs[p.product_id] = String(p.stock);
          }
        });
      }
      setAuditStockInput(initialInputs);
    } catch (err: any) {
      alert('Gagal memuat daftar produk untuk audit stok: ' + (err.message || err));
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAuditStockInputChange = (productId: string, value: string) => {
    setAuditStockInput((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const getAuditCalculations = () => {
    let totalGoodsRevenue = 0;
    let totalGoodsSoldQty = 0;
    const soldItemsList: { product: Product; initialStock: number; remainingStock: number; soldQty: number; subtotal: number }[] = [];

    auditProducts.forEach((p) => {
      if (p.manage_stock) {
        const initialStock = p.stock ?? 0;
        const rawInput = auditStockInput[p.product_id];
        let soldQty = 0;
        let remainingStock = initialStock;

        if (auditMode === 'DIRECT_SOLD') {
          soldQty = rawInput === '' || rawInput === undefined ? 0 : Math.max(0, Number(rawInput));
          remainingStock = Math.max(0, initialStock - soldQty);
        } else {
          remainingStock = rawInput === '' || rawInput === undefined ? initialStock : Math.max(0, Number(rawInput));
          soldQty = Math.max(0, initialStock - remainingStock);
        }

        const subtotal = soldQty * (p.selling_price || 0);

        if (soldQty > 0) {
          totalGoodsSoldQty += soldQty;
          totalGoodsRevenue += subtotal;
          soldItemsList.push({
            product: p,
            initialStock,
            remainingStock,
            soldQty,
            subtotal,
          });
        }
      }
    });

    const fcPagesNum = Math.max(0, Number(auditFcPages) || 0);
    const fcRevenue = fcPagesNum * (auditFcPrice || 0);
    const printRevenue = Math.max(0, Number(auditPrintRevenue) || 0);
    const totalServicesRevenue = fcRevenue + printRevenue;

    const totalAuditSales = totalGoodsRevenue + totalServicesRevenue;
    const currentShift = activeShiftData?.shift;
    const initialCash = currentShift?.total_initial_cash || 0;
    const cashExpenses = currentShift?.total_cash_expenses || 0;
    const estimatedTheoreticalCash = initialCash + totalAuditSales - cashExpenses;

    return {
      soldItemsList,
      totalGoodsSoldQty,
      totalGoodsRevenue,
      fcPagesNum,
      fcRevenue,
      printRevenue,
      totalServicesRevenue,
      totalAuditSales,
      estimatedTheoreticalCash,
    };
  };

  const handleApplyAuditToCloseShift = async () => {
    const calc = getAuditCalculations();

    setAuditSubmitting(true);
    try {
      const transactionItemsDTO = calc.soldItemsList.map((item) => ({
        product_id: item.product.product_id,
        qty: item.soldQty,
      }));

      if (transactionItemsDTO.length > 0) {
        await apiService.createTransaction('CASH', transactionItemsDTO, calc.totalGoodsRevenue).catch((err) => {
          console.warn('Peringatan pencatatan rekap barang:', err);
        });
      }

      setActualPhysicalCash(calc.estimatedTheoreticalCash);
      setShowStockAuditModal(false);
      setShowCloseModal(true);
    } catch (err: any) {
      alert('Gagal menerapkan rekap stok sisa: ' + (err.message || err));
    } finally {
      setAuditSubmitting(false);
    }
  };

  // Status Setelah Tutup Shift (Rincian Return Capital) - Tersimpan di LocalStorage agar tidak hilang saat di-refresh!
  const [closedShiftResult, setClosedShiftResult] = useState<ActiveShiftDetailsData | null>(() => {
    try {
      const raw = localStorage.getItem('pos_last_closed_shift_result');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const updateClosedShiftResult = (data: ActiveShiftDetailsData | null) => {
    setClosedShiftResult(data);
    if (data) {
      localStorage.setItem('pos_last_closed_shift_result', JSON.stringify(data));
    } else {
      localStorage.removeItem('pos_last_closed_shift_result');
    }
  };

  const handleDeleteClosedShiftResult = () => {
    setShowConfirmDeleteReconciliation(true);
  };

  const confirmDeleteClosedShiftResult = () => {
    updateClosedShiftResult(null);
    setShowConfirmDeleteReconciliation(false);
  };
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    apiService.getUsers().then((res) => {
      if (Array.isArray(res)) {
        setAllUsers(res);
      }
    }).catch(() => {});
  }, []);

  const getUserDisplayName = (userId?: string) => {
    if (!userId) return '-';
    if (userId === currentUser.user_id) return `${currentUser.full_name} (Saya)`;
    const found = allUsers.find((u) => u.user_id === userId);
    if (found) return found.full_name;
    return userId;
  };

  const loadShift = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getActiveShift();
      setActiveShiftData(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat status shift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  const handlePrintShiftPDF = async () => {
    if (!activeShiftData?.shift?.shift_id) return;
    try {
      setLoading(true);
      const [salesReport, expensesData] = await Promise.all([
        apiService.getSalesReport({ shift_id: activeShiftData.shift.shift_id }),
        apiService.getExpenses(activeShiftData.shift.shift_id).catch(() => []),
      ]);

      let storedMeta: any = null;
      try {
        const raw = localStorage.getItem(`pos_shift_meta_${activeShiftData.shift.shift_id}`);
        if (raw) storedMeta = JSON.parse(raw);
      } catch {}

      const dutyUsers = storedMeta?.dutyStaffNames || activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      const shiftLabel = storedMeta?.shiftCategory
        ? storedMeta.shiftCategory
        : storedMeta?.shiftName || 'Shift Operasional';

      printShiftPDF({
        storeName: storeName || 'Kedai POS',
        dateStr: formatDateIndoFull(storedMeta?.date || activeShiftData.shift.start_time, storedMeta?.time),
        shiftId: shiftLabel,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
        currentUserFullName: currentUser.full_name,
        transactions: salesReport?.transactions || [],
        expenses: expensesData || [],
        startTime: activeShiftData.shift.start_time,
        endTime: activeShiftData.shift.end_time || new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Gagal memuat data shift untuk cetak PDF: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportShiftExcel = async () => {
    if (!activeShiftData?.shift?.shift_id) return;
    try {
      setLoading(true);
      const [salesReport, expensesData] = await Promise.all([
        apiService.getSalesReport({ shift_id: activeShiftData.shift.shift_id }),
        apiService.getExpenses(activeShiftData.shift.shift_id).catch(() => []),
      ]);

      let storedMeta: any = null;
      try {
        const raw = localStorage.getItem(`pos_shift_meta_${activeShiftData.shift.shift_id}`);
        if (raw) storedMeta = JSON.parse(raw);
      } catch {}

      const dutyUsers = storedMeta?.dutyStaffNames || activeShiftData.contributions.map((c) => getUserDisplayName(c.user_id));

      const shiftLabel = storedMeta?.shiftCategory
        ? storedMeta.shiftCategory
        : storedMeta?.shiftName || 'Shift Operasional';

      exportShiftToExcel({
        storeName: storeName || 'Kedai POS',
        dateStr: formatDateIndoFull(storedMeta?.date || activeShiftData.shift.start_time, storedMeta?.time),
        shiftId: shiftLabel,
        dutyUsers: dutyUsers.length > 0 ? dutyUsers : [currentUser.full_name],
        currentUserFullName: currentUser.full_name,
        transactions: salesReport?.transactions || [],
        expenses: expensesData || [],
        startTime: activeShiftData.shift.start_time,
        endTime: activeShiftData.shift.end_time || new Date().toISOString(),
      });
    } catch (err: any) {
      alert('Gagal memuat data shift untuk ekspor Excel: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setOpenLoading(true);
      setError(null);

      const staffList = openStaffEntries
        .filter((s) => s.name.trim())
        .map((s) => `${s.name.trim()} (${s.time || shiftTimeInput || getCurrentTimeHHMM()} WIB)`);

      if (staffList.length === 0) {
        staffList.push(`${currentUser.full_name} (${shiftTimeInput || getCurrentTimeHHMM()} WIB)`);
      }

      const categoryName =
        shiftCategoryOption === 'KUSTOM'
          ? (shiftCustomCategory.trim() || 'Shift Kustom')
          : shiftCategoryOption;

      const finalShiftName = `${categoryName} - ${staffList.join(', ')}`;
      const initialCashNum = Number(openInitialCash) || 0;

      const data = await apiService.openShift(initialCashNum);

      if (data?.shift?.shift_id) {
        const meta = {
          shiftCategory: categoryName,
          shiftName: finalShiftName,
          date: shiftDateInput,
          time: shiftTimeInput,
          dutyStaffNames: staffList,
          initialCash: initialCashNum,
        };
        localStorage.setItem(`pos_shift_meta_${data.shift.shift_id}`, JSON.stringify(meta));
        sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, data.shift.shift_id);
      }

      setActiveShiftData(data);
      updateClosedShiftResult(null);
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal membuka shift');
    } finally {
      setOpenLoading(false);
    }
  };



  const handleAddCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData) return;
    try {
      setCapitalLoading(true);
      setError(null);
      await apiService.addCapitalContribution(activeShiftData.shift.shift_id, Number(addCapitalAmount));
      sessionStorage.setItem(`pos_shift_activated_${currentUser.user_id}`, activeShiftData.shift.shift_id);
      await loadShift();
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan setoran modal');
    } finally {
      setCapitalLoading(false);
    }
  };

  const handleReturnCapital = async (contributionId: string) => {
    try {
      await apiService.returnCapitalContribution(contributionId);
      if (closedShiftResult) {
        updateClosedShiftResult({
          ...closedShiftResult,
          contributions: closedShiftResult.contributions.map((c) =>
            c.contribution_id === contributionId ? { ...c, status: 'RETURNED' } : c
          ),
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pengembalian modal');
    }
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData?.shift?.shift_id) return;
    setShowConfirmCloseShiftModal(true);
  };

  const executeCloseShift = async () => {
    setShowConfirmCloseShiftModal(false);
    if (!activeShiftData?.shift?.shift_id) return;

    try {
      setCloseLoading(true);
      setError(null);
      const physicalCashNum = actualPhysicalCash === '' ? activeShiftData.shift.theoretical_cash : Number(actualPhysicalCash);
      const closedShift = await apiService.closeShift(activeShiftData.shift.shift_id, physicalCashNum);

      // Clean up session activation & cache
      sessionStorage.removeItem(`pos_shift_activated_${currentUser.user_id}`);
      localStorage.removeItem('pos_cached_active_shift');

      updateClosedShiftResult({
        shift: closedShift,
        contributions: activeShiftData.contributions,
        shift_users: activeShiftData.shift_users,
        usersCount: activeShiftData.usersCount || activeShiftData.contributions.length,
      });

      setShowCloseModal(false);
      setActiveShiftData(null);
      await loadShift();
      if (onShiftStatusChange) onShiftStatusChange();
    } catch (err: any) {
      setError(err.message || 'Gagal menutup shift');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleOpenEditShiftModal = (dutyStaffList: string[], storedTime?: string) => {
    const parsed = parseStaffStringToEntries(dutyStaffList, storedTime || shiftTimeInput);
    setEditStaffEntries(parsed.length > 0 ? parsed : [{ id: `edit-1`, name: currentUser.full_name, time: getCurrentTimeHHMM() }]);
    setShowEditShiftModal(true);
  };

  const handleUpdateShiftMetaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftData?.shift?.shift_id) return;
    const shiftId = activeShiftData.shift.shift_id;
    let storedMeta: any = {};
    try {
      const raw = localStorage.getItem(`pos_shift_meta_${shiftId}`);
      if (raw) storedMeta = JSON.parse(raw);
    } catch {}

    const newStaffList = editStaffEntries
      .filter((s) => s.name.trim())
      .map((s) => `${s.name.trim()} (${s.time || getCurrentTimeHHMM()} WIB)`);

    if (newStaffList.length === 0) {
      newStaffList.push(`${currentUser.full_name} (${getCurrentTimeHHMM()} WIB)`);
    }

    const newShiftName = newStaffList.join(', ');

    const updatedMeta = {
      ...storedMeta,
      shiftName: newShiftName,
      dutyStaffNames: newStaffList,
    };
    localStorage.setItem(`pos_shift_meta_${shiftId}`, JSON.stringify(updatedMeta));
    setShowEditShiftModal(false);
    loadShift();
    if (onShiftStatusChange) onShiftStatusChange();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Memuat status sesi shift...</div>;
  }

  // Check if there is an active shift session in system
  const isShiftActive = Boolean(activeShiftData?.shift?.shift_status === 'ACTIVE');

  // TAMPILAN 1: Sesi Shift Aktif Berjalan (Langsung Masuk Dashboard Laci Kas Bersama)
  if (activeShiftData && isShiftActive) {
    const { shift, contributions } = activeShiftData;

    // Load custom metadata if available
    let storedMeta: any = null;
    try {
      const raw = localStorage.getItem(`pos_shift_meta_${shift.shift_id}`);
      if (raw) storedMeta = JSON.parse(raw);
    } catch {}

    const shiftTitle = storedMeta?.shiftName || `Shift Operasional (#${shift.shift_id.slice(-6)})`;
    const dutyStaffList: string[] = storedMeta?.dutyStaffNames || contributions.map((c) => getUserDisplayName(c.user_id));

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-fc">SHIFT SESI ACTIVE</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.15rem 0.6rem', borderRadius: '12px' }}>
                🏷️ {shiftTitle}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 800 }}>
              <ShoppingBag color="#059669" />
              Laci Kas Bersama
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.4rem 0' }}>
              Dimulai pada: {formatDateIndoFull(storedMeta?.date || shift.start_time, storedMeta?.time)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>👥 Tim Bertugas & Jam Masuk:</span>
              {dutyStaffList.map((staffStr, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#4f46e5',
                    background: '#e0e7ff',
                    border: '1px solid #c7d2fe',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {staffStr}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleOpenEditShiftModal(dutyStaffList, storedMeta?.time)}
              style={{
                padding: '0.55rem 1rem',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Edit3 size={16} />
              Edit Sesi & Tim
            </button>
            <button
              onClick={handlePrintShiftPDF}
              style={{
                padding: '0.55rem 1rem',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Printer size={16} />
              Cetak PDF Shift
            </button>
            <button
              onClick={handleExportShiftExcel}
              style={{
                padding: '0.55rem 1rem',
                background: '#15803d',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
              }}
            >
              <FileSpreadsheet size={16} />
              Export Excel Shift
            </button>
            <button
              onClick={handleOpenStockAuditModal}
              style={{
                padding: '0.55rem 1rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              <Boxes size={16} />
              📦 Rekap via Hitung Stok Sisa
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 900,
                  padding: '0.12rem 0.4rem',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                  marginLeft: '0.2rem',
                }}
              >
                BARU
              </span>
            </button>
            <button
              onClick={() => {
                setActualPhysicalCash(shift.theoretical_cash);
                setShowCloseModal(true);
              }}
              style={{
                padding: '0.55rem 1rem',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Power size={16} />
              🛑 Tutup Shift Sekarang
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Dynamic Metric Cards (5 RESPONSIVE CARDS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Modal Kas Awal</span>
            <h3 style={{ fontSize: '1.25rem', color: '#4f46e5', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.total_initial_cash)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Uang Modal Kembalian</p>
          </div>

          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Penjualan Tunai</span>
            <h3 style={{ fontSize: '1.25rem', color: '#059669', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.net_cash_sales)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Transaksi Tunai Shift</p>
          </div>

          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '14px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: 700 }}>Pengeluaran Kas</span>
            <h3 style={{ fontSize: '1.25rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.total_cash_expenses)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#6b7280' }}>Biaya Operasional Toko</p>
          </div>

          <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '14px', border: '2px solid #059669', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 800 }}>🎯 Hasil Murni Jualan</span>
            <h3 style={{ fontSize: '1.25rem', color: '#047857', marginTop: '0.25rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.net_cash_sales - shift.total_cash_expenses)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700 }}>Disetor ke Owner</p>
          </div>

          <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '14px', border: '2px solid #5b21b6', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 800 }}>📥 Total Fisik di Laci</span>
            <h3 style={{ fontSize: '1.25rem', color: '#5b21b6', marginTop: '0.25rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatRupiah(shift.theoretical_cash)}</h3>
            <p style={{ fontSize: '0.72rem', color: '#4c1d95', fontWeight: 700 }}>Modal + Hasil Jualan</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Panel Left: Tabel Setoran Modal Multi-User */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <DollarSign size={20} color="#5b21b6" />
              Rincian Setoran Modal Karyawan (Multi-User)
            </h3>

            {contributions.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Belum ada setoran modal awal pada shift ini.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#4b5563' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nama Pegawai</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Setoran</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Waktu Setor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => (
                      <tr key={c.contribution_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>{getUserDisplayName(c.user_id)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{formatRupiah(c.amount)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                          {new Date(c.contribution_time || (c as any).created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel Right: Tambah Modal Kas Darurat */}
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <Plus size={20} color="#059669" />
              Tambah Modal Kas Laci Tambahan
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>
              Gunakan form ini jika karyawan lain ikut menyetor modal fisik tambahan ke dalam laci selama shift berjalan.
            </p>

            <form onSubmit={handleAddCapital} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem', color: '#334155' }}>
                  Setor Tambahan Atas Nama:
                </label>
                <input
                  type="text"
                  value={currentUser.full_name}
                  disabled
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, color: '#64748b' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.35rem', color: '#334155' }}>
                  Nominal Tambahan Modal (Rp):
                </label>
                <input
                  type="number"
                  value={addCapitalAmount}
                  onChange={(e) => setAddCapitalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 50000"
                  min={0}
                  step="any"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '2px solid #059669', fontSize: '1.1rem', fontWeight: 800 }}
                />
              </div>

              <button
                type="submit"
                disabled={capitalLoading}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: capitalLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.25rem',
                }}
              >
                <Plus size={16} />
                {capitalLoading ? 'Menyimpan Modal...' : 'Simpan Modal Tambahan'}
              </button>
            </form>
          </div>
        </div>

        {/* MODAL TUTUP SHIFT */}
        {showCloseModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '480px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Power size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    🛑 Prosedur Penutupan Shift
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Hitung total uang fisik di laci kasir dan masukkan hasilnya.
                  </p>
                </div>
              </div>

              {/* BANNER QUICK SWITCH KE MODE HITUNG STOK SISA */}
              <div style={{ marginBottom: '1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    📦 Mau Pakai Mode Rekap Stok Sisa?
                    <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.6rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>FITUR BARU!</span>
                  </strong>
                  <span style={{ fontSize: '0.725rem', color: '#0284c7' }}>Hitung sisa barang di rak & lembar FC daripada ketik manual.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseModal(false);
                    handleOpenStockAuditModal();
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Buka Rekap
                </button>
              </div>

              <form onSubmit={handleCloseShiftSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* BANNER PERINGATAN SHIFT BERSAMA */}
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderLeft: '4px solid #ea580c', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <AlertTriangle size={20} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.8rem', color: '#9a3412', lineHeight: '1.45' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: '#c2410c', marginBottom: '2px' }}>
                      ⚠️ PERHATIAN: Sesi Shift Toko Bersama
                    </strong>
                    Shift ini digunakan oleh <strong>seluruh kasir toko yang sedang aktif</strong>. Menutup shift ini akan menyelesaikan sesi untuk seluruh tim bertugas.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#047857', fontWeight: 700 }}>🎯 Hasil Murni Jualan (Setoran):</span>
                    <span style={{ fontWeight: 800, color: '#047857' }}>{formatRupiah(shift.net_cash_sales - shift.total_cash_expenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 700 }}>💵 Modal Awal (Wajib Dipisah):</span>
                    <span style={{ fontWeight: 800, color: '#4f46e5' }}>{formatRupiah(shift.total_initial_cash)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingTop: '0.35rem', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ color: '#5b21b6', fontWeight: 800 }}>📥 Total Fisik Harus Ada di Laci:</span>
                    <span style={{ fontWeight: 900, color: '#5b21b6' }}>{formatRupiah(shift.theoretical_cash)}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0f172a' }}>
                    💵 Jumlah Uang Fisik Aktual di Laci (Rp):
                  </label>
                  <input
                    type="number"
                    value={actualPhysicalCash}
                    onChange={(e) => setActualPhysicalCash(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={`Sistem: ${shift.theoretical_cash}`}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '2px solid #dc2626', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }}
                    required
                  />
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', color: '#64748b' }}>
                    * Jika sama persis dengan sistem, klik tombol tutup di bawah.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={closeLoading}
                    style={{
                      flex: 1.5,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: closeLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                    }}
                  >
                    <Power size={18} />
                    {closeLoading ? 'Menutup Shift...' : '🛑 Ya, Tutup Shift Resmi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL REKAP SHIFT VIA HITUNG STOK SISA */}
        {showStockAuditModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '24px',
                maxWidth: '850px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                overflow: 'hidden',
              }}
            >
              {/* Header Modal */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Boxes size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                      📦 Rekap Penjualan Shift via Hitung Stok Sisa
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#e0f2fe', margin: '0.15rem 0 0 0' }}>
                      Hitung sisa barang di rak. Sistem akan menghitung jumlah terjual & estimasi uang laci secara otomatis.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStockAuditModal(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter Search */}
              <div style={{ padding: '1rem 1.5rem 0.5rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Cari nama produk / snack / ATK..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem 0.65rem 2.5rem',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {auditLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                    <p style={{ fontWeight: 700 }}>Memuat daftar produk toko...</p>
                  </div>
                ) : (
                  <>
                    {/* BAGIAN 1: TABEL STOK BARANG FISIK */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <PackageCheck size={18} color="#0284c7" />
                          1. Rekap Penjualan Barang Fisik (Snack, Es Krim, ATK, dll)
                        </h4>

                        {/* Mode Selector Toggle */}
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.2rem', borderRadius: '10px', gap: '0.2rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditMode('DIRECT_SOLD');
                              setAuditStockInput({});
                            }}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: auditMode === 'DIRECT_SOLD' ? '#0284c7' : 'transparent',
                              color: auditMode === 'DIRECT_SOLD' ? '#ffffff' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            🛒 Mode Input Terjual Langsung
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuditMode('RACK_REMAINING');
                              setAuditStockInput({});
                            }}
                            style={{
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: auditMode === 'RACK_REMAINING' ? '#0284c7' : 'transparent',
                              color: auditMode === 'RACK_REMAINING' ? '#ffffff' : '#475569',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            📉 Mode Hitung Sisa Rak
                          </button>
                        </div>
                      </div>

                      <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800 }}>Nama Produk</th>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800 }}>Harga</th>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, textAlign: 'center' }}>Stok Awal</th>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, textAlign: 'center', width: '150px' }}>
                                {auditMode === 'DIRECT_SOLD' ? '🛒 Input Qty Terjual' : '📉 Sisa Fisik Rak'}
                              </th>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, textAlign: 'center' }}>Terjual</th>
                              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auditProducts
                              .filter((p) => p.manage_stock && p.product_name.toLowerCase().includes(auditSearch.toLowerCase()))
                              .map((product) => {
                                const initialStock = product.stock ?? 0;
                                const rawInput = auditStockInput[product.product_id];
                                let soldQty = 0;
                                let remaining = initialStock;

                                if (auditMode === 'DIRECT_SOLD') {
                                  soldQty = rawInput === '' || rawInput === undefined ? 0 : Math.max(0, Number(rawInput));
                                  remaining = Math.max(0, initialStock - soldQty);
                                } else {
                                  remaining = rawInput === '' || rawInput === undefined ? initialStock : Math.max(0, Number(rawInput));
                                  soldQty = Math.max(0, initialStock - remaining);
                                }

                                const subtotal = soldQty * product.selling_price;

                                return (
                                  <tr key={product.product_id} style={{ borderBottom: '1px solid #e2e8f0', background: soldQty > 0 ? '#f0fdf4' : '#ffffff' }}>
                                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                      {product.product_name}
                                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>
                                        {product.business_unit === 'FC_PRINT' ? '🖨️ FC / ATK' : '🍿 F&B / Snack'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 600 }}>
                                      {formatRupiah(product.selling_price)}
                                    </td>
                                    <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#475569' }}>
                                      {initialStock} pcs
                                    </td>
                                    <td style={{ padding: '0.5rem 0.85rem', textAlign: 'center' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder={auditMode === 'DIRECT_SOLD' ? '0' : String(initialStock)}
                                        value={auditStockInput[product.product_id] ?? (auditMode === 'DIRECT_SOLD' ? '' : initialStock)}
                                        onChange={(e) => handleAuditStockInputChange(product.product_id, e.target.value)}
                                        style={{
                                          width: '100%',
                                          padding: '0.4rem',
                                          borderRadius: '8px',
                                          border: soldQty > 0 ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                          background: soldQty > 0 ? '#ffffff' : '#f8fafc',
                                          textAlign: 'center',
                                          fontWeight: 900,
                                          fontSize: '0.95rem',
                                          color: soldQty > 0 ? '#15803d' : '#0f172a',
                                          outline: 'none',
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                                      {soldQty > 0 ? (
                                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>
                                          {soldQty} pcs
                                        </span>
                                      ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>0</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: soldQty > 0 ? '#15803d' : '#94a3b8' }}>
                                      {formatRupiah(subtotal)}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* BAGIAN 2: ISIAN CEPAAT JASA (FOTOKOPI & PRINT) */}
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.65rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={18} color="#0284c7" />
                        2. Input Hasil Jasa (Fotokopi & Print)
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {/* Card Fotokopi */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                            📄 Total Lembaran Fotokopi:
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              min="0"
                              value={auditFcPages}
                              onChange={(e) => setAuditFcPages(e.target.value)}
                              placeholder="Contoh: 150 lembar"
                              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem', outline: 'none' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>lembar</span>
                          </div>
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: '#64748b' }}>Rp</span>
                              <input
                                type="number"
                                value={auditFcPrice}
                                onChange={(e) => setAuditFcPrice(Number(e.target.value) || 0)}
                                style={{ width: '60px', padding: '0.15rem 0.35rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                              />
                              <span style={{ color: '#64748b' }}>/lbr</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0369a1' }}>
                              Subtotal: {formatRupiah((Number(auditFcPages) || 0) * auditFcPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Card Print & Jasa Lain */}
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.4rem' }}>
                            🖨️ Total Omzet Print / Jasa Ketik (Rp):
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={auditPrintRevenue}
                            onChange={(e) => setAuditPrintRevenue(e.target.value)}
                            placeholder="Contoh: 25000"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '0.95rem', outline: 'none' }}
                          />
                          <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 800, color: '#0369a1' }}>
                              Subtotal: {formatRupiah(Number(auditPrintRevenue) || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Summary Box & Action Buttons */}
              {(() => {
                const calc = getAuditCalculations();
                return (
                  <div style={{ padding: '1.25rem 1.5rem', background: '#f0f9ff', borderTop: '2px solid #bae6fd', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 700 }}>Ringkasan Hasil Rekap Shift:</span>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                          <span>Barang: <strong>{calc.totalGoodsSoldQty} pcs ({formatRupiah(calc.totalGoodsRevenue)})</strong></span>
                          <span>Jasa: <strong>{formatRupiah(calc.totalServicesRevenue)}</strong></span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 800 }}>💵 Total Uang Fisik Wajib Ada di Laci:</span>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', margin: 0 }}>
                          {formatRupiah(calc.estimatedTheoreticalCash)}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowStockAuditModal(false)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#475569',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyAuditToCloseShift}
                        disabled={auditSubmitting}
                        style={{
                          flex: 2,
                          padding: '0.75rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          cursor: auditSubmitting ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)',
                        }}
                      >
                        <Sparkles size={18} />
                        {auditSubmitting ? 'Memproses Rekap...' : '🚀 Terapkan Rekap & Lanjutkan ke Tutup Shift'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* MODAL EDIT NAMA SESI & TIM BERTUGAS (DENGAN JAM MASUK PER PEGAWAI) */}
        {showEditShiftModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => setShowEditShiftModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Edit3 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    ✏️ Edit Tim Shift & Jam Datang Pegawai
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
                    Tambah pegawai susulan/telat dan atur jam masuk masing-masing pegawai.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateShiftMetaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    👥 Daftar Pegawai Bertugas & Jam Masuk Individu:
                  </label>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '-0.35rem 0 0.25rem 0' }}>
                    Atur jam kedatangan untuk setiap pegawai (pegawai yang menyusul/terlambat dapat disesuaikan jam masuknya).
                  </p>

                  {editStaffEntries.map((staff, idx) => (
                    <div key={staff.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                          Nama Pegawai #{idx + 1}:
                        </label>
                        <input
                          type="text"
                          value={staff.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, name: val } : s)));
                          }}
                          placeholder="Contoh: Budi / Dika"
                          style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                          required={idx === 0}
                        />
                      </div>
                      <div style={{ width: '125px', flexShrink: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '0.2rem' }}>
                          ⏰ Jam Datang:
                        </label>
                        <input
                          type="time"
                          value={staff.time}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, time: val } : s)));
                          }}
                          style={{ width: '100%', padding: '0.5rem 0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditStaffEntries((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, time: getCurrentTimeHHMM() } : s))
                          )
                        }
                        style={{
                          marginTop: '1.1rem',
                          padding: '0.5rem 0.6rem',
                          background: '#e0e7ff',
                          color: '#4f46e5',
                          border: '1px solid #c7d2fe',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                        title="Set ke Jam Sekarang"
                      >
                        🕒 Now
                      </button>
                      {editStaffEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditStaffEntries((prev) => prev.filter((_, i) => i !== idx))}
                          style={{ marginTop: '1.1rem', padding: '0.5rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer' }}
                          title="Hapus Pegawai Ini dari Shift"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setEditStaffEntries((prev) => [
                        ...prev,
                        { id: `staff-${Date.now()}`, name: '', time: getCurrentTimeHHMM() },
                      ])
                    }
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.55rem 0.95rem',
                      borderRadius: '10px',
                      border: '1px dashed #4f46e5',
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      fontWeight: 800,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.35rem',
                    }}
                  >
                    <Plus size={16} />
                    + Tambah Pegawai Susulan / Telat
                  </button>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  💡 <strong>Catatan:</strong> Pegawai yang menyusul atau terlambat akan dicatat jam masuknya masing-masing dan tersimpan secara otomatis di Laporan Shift (Cetak PDF & Export Excel).
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditShiftModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1.5,
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    <Edit3 size={18} />
                    Simpan Perubahan Tim & Jam
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN 2: Belum Ada Shift Aktif -> Form Registrasi & Buka Shift Baru (Clean UI)
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>


      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Rincian Pengembalian Modal setelah Closing Shift */}
      {closedShiftResult && (
        <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '2px solid #16a34a', marginBottom: '2rem', boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#16a34a', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={22} />
              Rekonsiliasi Shift Selesai - Prosedur Pengembalian Modal Awal
            </h3>
            <button
              onClick={handleDeleteClosedShiftResult}
              title="Selesaikan & Tutup Tampilan Rekonsiliasi Ini"
              style={{
                padding: '0.55rem 1.1rem',
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
              }}
            >
              <CheckCircle2 size={16} />
              ✓ Selesaikan Rekonsiliasi
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
            Kas bersama telah direkonsiliasi. Harap kembalikan uang modal fisik kepada masing-masing penyetor di bawah ini:
          </p>

          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            {(closedShiftResult.contributions && closedShiftResult.contributions.length > 0) ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#4b5563' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nama Pegawai Penyetor</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Nominal Modal Wajib Dikembalikan</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status Modal</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {closedShiftResult.contributions.map((c) => (
                    <tr key={c.contribution_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: '#0f172a' }}>
                        {getUserDisplayName(c.user_id)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 800, color: '#4f46e5' }}>
                        {formatRupiah(c.amount)}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span className={c.status === 'RETURNED' ? 'badge badge-fc' : 'badge badge-fnb'}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {c.status === 'HELD' ? (
                          <button
                            onClick={() => handleReturnCapital(c.contribution_id)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Tandai Dikembalikan
                          </button>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 800 }}>✓ Returned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', color: '#64748b', fontSize: '0.875rem', textAlign: 'center', fontWeight: 600 }}>
                💡 Tidak ada rincian setoran modal tambahan yang perlu dikembalikan pada shift ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM CLEAN BUKA SHIFT BARU (DENGAN DYNAMIC STAFF ARRIVAL TIME INPUTS) */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', background: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PlayCircle size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Registrasi & Buka Sesi Shift Baru
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Masukkan nama pegawai bertugas, jam masuk masing-masing, dan modal kas awal.
            </p>
          </div>
        </div>

        <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* 1. DAFTAR TIM PEGAWAI BERTUGAS & JAM MASUK INDIVIDU */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
              👥 Tim Pegawai Bertugas & Jam Masuk Individu:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem' }}>
              {openStaffEntries.map((staff, idx) => (
                <div key={staff.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={staff.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOpenStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, name: val } : s)));
                      }}
                      placeholder={`Nama Pegawai ${idx + 1} (cth: Dela, Amanda)`}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                      required={idx === 0}
                    />
                  </div>
                  <div style={{ width: '130px', flexShrink: 0 }}>
                    <input
                      type="time"
                      value={staff.time}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOpenStaffEntries((prev) => prev.map((s, i) => (i === idx ? { ...s, time: val } : s)));
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.6rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      required
                    />
                  </div>
                  {openStaffEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOpenStaffEntries((prev) => prev.filter((_, i) => i !== idx))}
                      style={{ padding: '0.65rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer' }}
                      title="Hapus Pegawai Ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpenStaffEntries((prev) => [...prev, { id: `staff-${Date.now()}`, name: '', time: getCurrentTimeHHMM() }])}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '10px',
                border: '1px dashed #4f46e5',
                background: '#e0e7ff',
                color: '#4f46e5',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Plus size={15} />
              + Tambah Pegawai Bertugas
            </button>
          </div>

          {/* 1.5 SESI SHIFT (OPSI 2: SHIFT PAGI / SIANG / MALAM / CUSTOM) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              🏷️ Sesi Shift Toko:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={shiftCategoryOption}
                onChange={(e) => setShiftCategoryOption(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '2px solid #4f46e5',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                }}
              >
                <option value="Shift Pagi">🌅 Shift Pagi</option>
                <option value="Shift Siang">☀️ Shift Siang</option>
                <option value="Shift Malam">🌙 Shift Malam</option>
                <option value="Shift Lembur">⚡ Shift Lembur</option>
                <option value="KUSTOM">✏️ Kustom (Ketik Sendiri)...</option>
              </select>

              {shiftCategoryOption === 'KUSTOM' && (
                <input
                  type="text"
                  value={shiftCustomCategory}
                  onChange={(e) => setShiftCustomCategory(e.target.value)}
                  placeholder="Ketik Nama Shift (cth: Shift Bazar / Shift Event)"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '2px solid #059669',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                  required
                />
              )}
            </div>
          </div>

          {/* 2. TANGGAL & JAM UTAMA SHIFT */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                📅 Tanggal Shift:
              </label>
              <input
                type="date"
                value={shiftDateInput}
                onChange={(e) => setShiftDateInput(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
                ⏰ Jam Mulai Shift Utama:
              </label>
              <input
                type="time"
                value={shiftTimeInput}
                onChange={(e) => setShiftTimeInput(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}
                required
              />
            </div>
          </div>

          {/* 3. NOMINAL UANG MODAL KAS AWAL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              💵 Nominal Uang Modal Kas Awal (Rp):
            </label>
            <input
              type="number"
              value={openInitialCash}
              onChange={(e) => setOpenInitialCash(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: '2px solid #059669', background: '#ffffff', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', outline: 'none' }}
              min={0}
              step="any"
              required
              placeholder="Contoh: 50000"
            />
          </div>

          <button
            type="submit"
            disabled={openLoading}
            style={{
              width: '100%',
              padding: '0.95rem 1.25rem',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              borderRadius: '14px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              cursor: openLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              transition: 'all 0.15s ease',
              marginTop: '0.5rem',
            }}
          >
            <PlayCircle size={22} />
            {openLoading ? 'Membuka & Mengaktifkan Shift...' : '🚀 Buka & Aktifkan Shift Baru Sekarang'}
          </button>
        </form>
      </div>

      {/* MODAL KONFIRMASI HAPUS REKONSILIASI (ELEGAN, MODERN & SIMPLE) */}
      {showConfirmDeleteReconciliation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 8px 16px rgba(220, 38, 38, 0.15)',
              }}
            >
              <AlertTriangle size={32} strokeWidth={2.2} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
              Selesaikan Rekonsiliasi Shift?
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, marginBottom: '1.75rem' }}>
              Apakah Anda yakin ingin menghapus & menyelesaikan tampilan rekonsiliasi pengembalian modal ini?
              <br /><br />
              <span style={{ fontSize: '0.825rem', color: '#047857', background: '#ecfdf5', padding: '0.5rem 0.85rem', borderRadius: '10px', display: 'inline-block', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                🛡️ Data transaksi & laporan shift tetap tersimpan aman di sistem.
              </span>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDeleteReconciliation(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteClosedShiftResult}
                style={{
                  flex: 1.2,
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} />
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionLoadingModal
        isOpen={openLoading || capitalLoading}
        message="Memproses registrasi sesi shift ke backend POS..."
        submessage="Menyiapkan laci kas dan verifikasi hak akses..."
      />

      {/* Modal Custom Sleek: Konfirmasi Penutupan Shift Toko */}
      <CustomConfirmModal
        isOpen={showConfirmCloseShiftModal}
        onClose={() => setShowConfirmCloseShiftModal(false)}
        onConfirm={executeCloseShift}
        title="Konfirmasi Penutupan Shift Toko"
        subtitle="Apakah Anda yakin ingin menutup sesi Shift Aktif Toko saat ini?"
        warningNote="Tindakan ini akan mengakhiri sesi shift untuk SELURUH tim kasir yang sedang bertugas."
        details={[
          {
            label: 'Uang Fisik Laci Kasir',
            value: formatRupiah(actualPhysicalCash === '' ? activeShiftData?.shift?.theoretical_cash || 0 : Number(actualPhysicalCash)),
            highlight: true,
            color: '#0284c7',
          },
        ]}
        confirmText="🛑 Ya, Tutup Shift Sekarang"
        cancelText="Batal / Kembali"
        confirmVariant="danger"
        iconType="power"
        loading={closeLoading}
      />

    </div>
  );
};

