import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  EyeOff,
  Edit,
  X,
  Shield,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Trash2,
  AlertTriangle,
  Upload,
  Camera,
  Sparkles,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { User as UserType, UserStatus } from '../types';
import { apiService } from '../services/api';
import { ToastType } from '../components/ToastNotification';
import { HelpModal } from '../components/common/HelpModal';
import { ActionLoadingModal } from '../components/common/ActionLoadingModal';


interface UsersPageProps {
  currentUser?: UserType;
  onTriggerToast?: (type: ToastType, title: string, message: string) => void;
}

const PRESET_AVATARS = [
  { label: 'Pria 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { label: 'Wanita 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { label: 'Pria 2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
  { label: 'Wanita 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
  { label: 'Kasir 1', url: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150' },
];

export const UsersPage: React.FC<UsersPageProps> = ({ onTriggerToast }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [shiftFilter, setShiftFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [generatedCode, setGeneratedCode] = useState<{ username: string; code: string } | null>(null);

  // Password Visibility Eye Toggle States
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showDetailCredential, setShowDetailCredential] = useState(false);

  // Form Input State for Add/Edit
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    username: '',
    password: '',
    phone: '',
    is_pj: false,
    shift_mode: 'Pagi (08:00 - 16:00)', // 'Pagi (08:00 - 16:00)', 'Siang (16:00 - 00:00)', 'Malam (00:00 - 08:00)', or 'CUSTOM'
    custom_start: '08:00',
    custom_end: '16:00',
    status: 'ACTIVE' as UserStatus,
    avatar_url: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Gagal memuat pengguna:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Action Loading Modal State (for full form submission)
  const [actionLoading, setActionLoading] = useState(false);
  const [actionLoadingMessage, setActionLoadingMessage] = useState('Memproses perubahan pegawai...');

  // Fine-grained Row-level Loading States (to avoid full-screen screen blockage)
  const [loadingCodeId, setLoadingCodeId] = useState<string | null>(null);
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleGenerateActivationCode = async (user: UserType) => {
    try {
      setLoadingCodeId(user.user_id);
      const res = await apiService.generateActivationCode(user.user_id);
      setGeneratedCode({ username: user.username || user.full_name, code: res.activation_code });
      if (onTriggerToast) {
        onTriggerToast('success', 'Kode Aktivasi Diterbitkan', `Kode aktivasi untuk ${user.full_name}: ${res.activation_code}`);
      }
      loadUsers();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal', err.message || 'Gagal menerbitkan kode aktivasi.');
      }
    } finally {
      setLoadingCodeId(null);
    }
  };

  // Helper username auto-suggestions
  const getUsernameSuggestions = (name: string, isPj: boolean) => {
    if (!name.trim()) return [];
    const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return [];
    
    const cleanFirst = parts[0].replace(/[^a-z0-9]/g, '');
    const suggestions: string[] = [];

    if (parts.length === 1) {
      suggestions.push(cleanFirst);
      suggestions.push(`kasir.${cleanFirst}`);
      suggestions.push(`${cleanFirst}123`);
    } else {
      const cleanSecond = parts[1].replace(/[^a-z0-9]/g, '');
      suggestions.push(cleanFirst);
      suggestions.push(`${cleanFirst}.${cleanSecond}`);
      suggestions.push(`${cleanFirst}_${cleanSecond}`);
      suggestions.push(`kasir.${cleanFirst}`);
    }
    if (isPj) {
      suggestions.unshift(`pj.${cleanFirst}`);
    }
    return Array.from(new Set(suggestions));
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (onTriggerToast) onTriggerToast('danger', 'Ukuran File Terlalu Besar', 'Maksimal ukuran foto adalah 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute final shift string
  const getComputedShiftString = () => {
    if (formData.shift_mode === 'CUSTOM') {
      return `Custom (${formData.custom_start || '08:00'} - ${formData.custom_end || '16:00'})`;
    }
    return formData.shift_mode;
  };

  // Exclude OWNER from Employee Management page & metrics
  const employeeUsers = users.filter((u) => u.role !== 'OWNER');

  // Filter Logic
  const filteredUsers = employeeUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q));

    let matchesRole = true;
    if (roleFilter === 'PJ') {
      matchesRole = Boolean(u.is_pj);
    } else if (roleFilter === 'KASIR') {
      matchesRole = !u.is_pj;
    }

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = u.status === 'ACTIVE' || u.status === 'PENDING_ACTIVATION';
    } else if (statusFilter === 'INACTIVE') {
      matchesStatus = u.status === 'INACTIVE' || u.status === 'SUSPENDED';
    } else if (statusFilter === 'PENDING') {
      matchesStatus = u.status === 'PENDING_ACTIVATION';
    }

    let matchesShift = true;
    if (shiftFilter !== 'ALL') {
      matchesShift = u.shift ? u.shift.startsWith(shiftFilter) : true;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesShift;
  });

  // Calculate Metrics from Employee Dataset (excluding OWNER)
  const totalPegawaiCount = employeeUsers.length;
  const pjCount = employeeUsers.filter((u) => u.is_pj && (u.status === 'ACTIVE' || u.status === 'PENDING_ACTIVATION')).length;
  const kasirCount = employeeUsers.filter((u) => !u.is_pj && (u.status === 'ACTIVE' || u.status === 'PENDING_ACTIVATION')).length;
  const activeCount = employeeUsers.filter((u) => u.status === 'ACTIVE' || u.status === 'PENDING_ACTIVATION').length;
  const inactiveCount = employeeUsers.filter((u) => u.status === 'INACTIVE' || u.status === 'SUSPENDED').length;

  // Pagination Calculations
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setShiftFilter('ALL');
    setCurrentPage(1);
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionLoadingMessage('Mendaftarkan akun pegawai baru ke database backend...');
      const finalShift = getComputedShiftString();
      const created = await apiService.createUser({
        full_name: formData.full_name,
        username: formData.username || formData.full_name.toLowerCase().replace(/\s+/g, ''),
        password: formData.password || 'kasir123',
        phone: formData.phone,
        is_pj: formData.is_pj,
        shift: finalShift,
        status: formData.status,
        role: 'KARYAWAN',
        avatar_url: formData.avatar_url || PRESET_AVATARS[0].url,
      }) as any;

      if (created) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.user_id === created.user_id);
          return exists ? prev : [created, ...prev];
        });
        if (created.activation_code) {
          setGeneratedCode({ username: formData.username || formData.full_name, code: created.activation_code });
        }
      }

      if (onTriggerToast) {
        onTriggerToast('success', 'Pegawai Ditambahkan', `Akun ${formData.full_name} (${formData.username}) berhasil terdaftar.`);
      }
      setIsAddModalOpen(false);
      resetForm();
      setCurrentPage(1);
      await loadUsers();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Menambah Pegawai', err.message || 'Terjadi kesalahan sistem.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Edit User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setActionLoadingMessage('Memperbarui informasi akun pegawai ke database backend...');
      const finalShift = getComputedShiftString();
      await apiService.updateUser(formData.user_id, {
        full_name: formData.full_name,
        username: formData.username,
        phone: formData.phone,
        is_pj: formData.is_pj,
        shift: finalShift,
        status: formData.status,
        avatar_url: formData.avatar_url,
        ...(formData.password ? { password: formData.password } : {}),
      });

      if (onTriggerToast) {
        onTriggerToast('success', 'Data Diperbarui', `Informasi akun ${formData.full_name} berhasil diperbarui.`);
      }
      setIsEditModalOpen(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Memperbarui', err.message || 'Terjadi kesalahan.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleteLoading(true);
      await apiService.deleteUser(userToDelete.user_id);
      if (onTriggerToast) {
        onTriggerToast('success', 'Pegawai Dihapus', `Akun pegawai ${userToDelete.full_name} (@${userToDelete.username}) berhasil dihapus.`);
      }
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
      if (onTriggerToast) {
        onTriggerToast('info', 'Data Diperbarui', err.message || 'Data pegawai telah diperbarui dari server.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (user: UserType) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setLoadingStatusId(user.user_id);
      await apiService.toggleUserStatus(user.user_id, newStatus);
      if (onTriggerToast) {
        onTriggerToast(
          'info',
          'Status Pegawai Diubah',
          `Akun ${user.full_name} sekarang berstatus ${newStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`
        );
      }
      loadUsers();
    } catch (err: any) {
      if (onTriggerToast) {
        onTriggerToast('danger', 'Gagal Mengubah Status', err.message || 'Terjadi kesalahan.');
      }
    } finally {
      setLoadingStatusId(null);
    }
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    const existingShift = user.shift || 'Pagi (08:00 - 16:00)';
    let mode = 'Pagi (08:00 - 16:00)';
    let cStart = '08:00';
    let cEnd = '16:00';

    if (existingShift.startsWith('Custom')) {
      mode = 'CUSTOM';
      const match = existingShift.match(/Custom\s*\((.*?)-(.*?)\)/);
      if (match) {
        cStart = match[1].trim();
        cEnd = match[2].trim();
      }
    } else if (existingShift.startsWith('Siang')) {
      mode = 'Siang (16:00 - 00:00)';
    } else if (existingShift.startsWith('Malam')) {
      mode = 'Malam (00:00 - 08:00)';
    }

    setFormData({
      user_id: user.user_id,
      full_name: user.full_name,
      username: user.username,
      password: '',
      phone: user.phone || '',
      is_pj: Boolean(user.is_pj),
      shift_mode: mode,
      custom_start: cStart,
      custom_end: cEnd,
      status: user.status || 'ACTIVE',
      avatar_url: user.avatar_url || '',
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (user: UserType) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const openDeleteModal = (user: UserType) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      full_name: '',
      username: '',
      password: '',
      phone: '',
      is_pj: false,
      shift_mode: 'Pagi (08:00 - 16:00)',
      custom_start: '08:00',
      custom_end: '16:00',
      status: 'ACTIVE',
      avatar_url: '',
    });
    setSelectedUser(null);
  };

  // Excel Export Handler (Matches Reference Design HTML Table Export)
  const downloadFormattedExcel = () => {
    const dateFormatted = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = new Date().toLocaleTimeString('id-ID');
    const fullDateStr = `${dateFormatted} ${timeFormatted}`;

    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Data Pegawai</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          .title-main { font-size: 16pt; font-weight: bold; color: #047857; text-align: center; font-family: sans-serif; }
          .title-sub { font-size: 14pt; font-weight: bold; color: #047857; text-align: center; font-family: sans-serif; }
          .date-sub { font-size: 10pt; color: #64748b; text-align: center; font-family: sans-serif; }
          .th-header { background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #03543f; text-align: center; font-family: sans-serif; padding: 8px; }
          .td-cell { border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 10pt; padding: 6px; vertical-align: middle; }
          .td-center { border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 10pt; padding: 6px; text-align: center; vertical-align: middle; }
          .badge-owner { background-color: #f3e8ff; color: #7e22ce; font-weight: bold; padding: 4px 8px; border-radius: 6px; }
          .badge-pj { background-color: #fffbe6; color: #b45309; font-weight: bold; padding: 4px 8px; border-radius: 6px; }
          .badge-kasir { background-color: #dbeafe; color: #1d4ed8; font-weight: bold; padding: 4px 8px; border-radius: 6px; }
          .badge-active { background-color: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 8px; border-radius: 12px; }
          .badge-inactive { background-color: #fee2e2; color: #b91c1c; font-weight: bold; padding: 4px 8px; border-radius: 12px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10"></td></tr>
          <tr><td colspan="10" class="title-main">DATA PEGAWAI</td></tr>
          <tr><td colspan="10" class="title-sub">TOKO UTAMA</td></tr>
          <tr><td colspan="10" class="date-sub">Tanggal Export: ${fullDateStr}</td></tr>
          <tr><td colspan="10" style="border-bottom: 3px solid #047857;"></td></tr>
          <tr>
            <th class="th-header">No.</th>
            <th class="th-header">Nama Lengkap</th>
            <th class="th-header">Username</th>
            <th class="th-header">Role</th>
            <th class="th-header">No. HP</th>
            <th class="th-header">Shift</th>
            <th class="th-header">Kode Aktivasi</th>
            <th class="th-header">Status</th>
            <th class="th-header">Terakhir Login</th>
            <th class="th-header">Dibuat Pada</th>
          </tr>
    `;

    filteredUsers.forEach((u, i) => {
      const roleBadgeClass = u.role === 'OWNER' ? 'badge-owner' : u.is_pj ? 'badge-pj' : 'badge-kasir';
      const roleText = u.role === 'OWNER' ? 'OWNER' : u.is_pj ? 'PJ' : 'KASIR';
      const statusBadgeClass = u.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive';
      const statusText = u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif';

      excelContent += `
        <tr>
          <td class="td-center">${i + 1}</td>
          <td class="td-cell"><strong>${u.full_name}</strong></td>
          <td class="td-cell">@${u.username}</td>
          <td class="td-center"><span class="${roleBadgeClass}">${roleText}</span></td>
          <td class="td-cell">${u.phone || '-'}</td>
          <td class="td-cell">${u.shift || 'Pagi (08:00 - 16:00)'}</td>
          <td class="td-center">-</td>
          <td class="td-center"><span class="${statusBadgeClass}">${statusText}</span></td>
          <td class="td-cell">${u.last_login || '-'}</td>
          <td class="td-cell">${dateFormatted}</td>
        </tr>
      `;
    });

    excelContent += `
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_Pegawai_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) {
      onTriggerToast('success', 'Ekspor Excel Berhasil', 'File Data_Pegawai.xls berhasil di-download.');
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['No', 'Nama Lengkap', 'Username', 'Role', 'No. HP', 'Shift', 'Status', 'Terakhir Login'];
    const rows = filteredUsers.map((u, i) => [
      i + 1,
      `"${u.full_name}"`,
      u.username,
      u.is_pj ? 'PJ' : 'KASIR',
      u.phone || '-',
      `"${u.shift || '-'}"`,
      u.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif',
      `"${u.last_login || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Pegawai_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onTriggerToast) {
      onTriggerToast('success', 'Ekspor Berhasil', 'Daftar data pegawai telah di-download sebagai file CSV.');
    }
  };

  const usernameSuggestions = getUsernameSuggestions(formData.full_name, formData.is_pj);

  return (
    <div style={{ paddingBottom: '3rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 1. TOP METRIC STAT CARDS ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Total Pegawai */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem 1.35rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ecfdf5',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Pegawai</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{totalPegawaiCount}</div>
          </div>
        </div>

        {/* Card 2: Penanggung Jawab */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem 1.35rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#f3e8ff',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tim PJ / Supervisor</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{pjCount}</div>
          </div>
        </div>

        {/* Card 3: Kasir / Karyawan */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem 1.35rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#dbeafe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kasir / Operator</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{kasirCount}</div>
          </div>
        </div>

        {/* Card 4: Akun Aktif */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem 1.35rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Akun Aktif</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{activeCount}</div>
          </div>
        </div>

        {/* Card 5: Akun Nonaktif */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem 1.35rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Akun Nonaktif</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{inactiveCount}</div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR: SEARCH, FILTERS, ADD USER & EXPORT BUTTONS (1 SINGLE MINIMALIST ROW) */}
      <div
        style={{
          background: '#ffffff',
          padding: '0.85rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', overflowX: 'auto' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px', maxWidth: '280px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Cari nama, username, no. HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                color: '#0f172a',
                background: '#f8fafc',
              }}
            />
          </div>

          {/* Filter 1: Role */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="ALL">Semua Role</option>
            <option value="PJ">PJ / Penanggung Jawab</option>
            <option value="KASIR">Kasir / Karyawan</option>
          </select>

          {/* Filter 2: Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif & Pending</option>
            <option value="PENDING">Menunggu Aktivasi</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>

          {/* Filter 3: Shift */}
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#334155',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="ALL">Semua Shift</option>
            <option value="Pagi">Pagi (08:00 - 16:00)</option>
            <option value="Siang">Siang (16:00 - 00:00)</option>
            <option value="Malam">Malam (00:00 - 08:00)</option>
            <option value="Custom">Custom / Fleksibel</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            title="Reset Filter"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f1f5f9',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <Filter size={15} /> Reset
          </button>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', flexShrink: 0 }}>
            {/* Primary Button: + Tambah Pegawai */}
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--primary-gradient, linear-gradient(135deg, #047857 0%, #059669 100%))',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                whiteSpace: 'nowrap',
              }}
            >
              <Plus size={16} /> Tambah Pegawai
            </button>

            {/* Secondary Export Button */}
            <button
              onClick={() => setIsExcelPreviewOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Download size={15} /> Export
            </button>

            {/* Functional Bantuan Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--color-primary, #cbd5e1)',
                background: 'var(--accent-bg, #ffffff)',
                color: 'var(--color-primary, #334155)',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <HelpCircle size={15} /> Bantuan
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN DATA TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--accent-bg, #f8fafc)', borderBottom: '2px solid #e2e8f0', color: 'var(--color-primary, #0f172a)', fontWeight: 800 }}>
                <th style={{ padding: '0.85rem 1rem', width: '50px', textAlign: 'center' }}>No.</th>
                <th style={{ padding: '0.85rem 1rem', width: '70px', textAlign: 'center' }}>Foto</th>
                <th style={{ padding: '0.85rem 1rem' }}>Nama</th>
                <th style={{ padding: '0.85rem 1rem' }}>Username</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>No. HP</th>
                <th style={{ padding: '0.85rem 1rem' }}>Shift</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Kode Aktivasi</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Terakhir Login</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', width: '140px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    Memuat data pegawai...
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((u, idx) => {
                  const globalIdx = (currentPage - 1) * rowsPerPage + idx + 1;
                  const isPjRole = Boolean(u.is_pj);
                  const isStatusActive = u.status === 'ACTIVE';
                  const isPendingActivation = u.status === 'PENDING_ACTIVATION';
                  const isOwnerUser = u.role === 'OWNER';

                  return (
                    <tr
                      key={u.user_id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-bg, #f8fafc)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* 1. No */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        {globalIdx}
                      </td>

                      {/* 2. Foto */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            overflow: 'hidden',
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span>{u.full_name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Nama */}
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#0f172a' }}>
                        {u.full_name}
                      </td>

                      {/* 4. Username */}
                      <td style={{ padding: '0.75rem 1rem', color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                        @{u.username}
                      </td>

                      {/* 5. Role Badge (PJ / KASIR) */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: isPjRole ? '#f3e8ff' : '#dbeafe',
                            color: isPjRole ? '#9333ea' : '#2563eb',
                            border: isPjRole ? '1px solid #e9d5ff' : '1px solid #bfdbfe',
                          }}
                        >
                          {isOwnerUser ? 'OWNER' : isPjRole ? 'PJ' : 'KASIR'}
                        </span>
                      </td>

                      {/* 6. No. HP */}
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                        {u.phone || '-'}
                      </td>

                      {/* 7. Shift */}
                      <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 600 }}>
                        {u.shift || 'Pagi (08:00 - 16:00)'}
                      </td>

                      {/* 7B. Kode Aktivasi */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {loadingCodeId === u.user_id ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            <Loader2 size={13} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} /> Memproses...
                          </span>
                        ) : (u as any).activation_code ? (
                          <button
                            onClick={() => handleGenerateActivationCode(u)}
                            title="Klik untuk lihat / salin kode aktivasi"
                            disabled={loadingCodeId !== null}
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              fontFamily: 'monospace',
                              background: '#f3e8ff',
                              color: '#9333ea',
                              border: '1px solid #d8b4fe',
                              cursor: 'pointer',
                            }}
                          >
                            🔑 {(u as any).activation_code}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateActivationCode(u)}
                            title="Lihat / minta kode aktivasi"
                            disabled={loadingCodeId !== null}
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px dashed #cbd5e1',
                              cursor: 'pointer',
                            }}
                          >
                            + Minta Kode
                          </button>
                        )}
                      </td>

                      {/* 8. Status Badge */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {loadingStatusId === u.user_id ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} /> Ubah...
                          </span>
                        ) : (
                          <span
                            onClick={() => !isOwnerUser && loadingStatusId === null && handleToggleStatus(u)}
                            title={
                              isOwnerUser
                                ? 'Status Owner Aktif'
                                : isStatusActive
                                ? 'Klik untuk Menonaktifkan'
                                : isPendingActivation
                                ? 'Menunggu aktivasi pegawai via Kode Aktivasi (Klik untuk mengaktifkan langsung)'
                                : 'Klik untuk Mengaktifkan'
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: isStatusActive ? '#ecfdf5' : isPendingActivation ? '#fffbe6' : '#fef2f2',
                              color: isStatusActive ? '#047857' : isPendingActivation ? '#b45309' : '#dc2626',
                              border: isStatusActive ? '1px solid #a7f3d0' : isPendingActivation ? '1px solid #fef3c7' : '1px solid #fecaca',
                              cursor: isOwnerUser ? 'default' : 'pointer',
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: isStatusActive ? '#059669' : isPendingActivation ? '#d97706' : '#dc2626',
                              }}
                            />
                            {isStatusActive ? 'Aktif' : isPendingActivation ? 'Belum Aktivasi' : 'Nonaktif'}
                          </span>
                        )}
                      </td>

                      {/* 9. Terakhir Login */}
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.78rem' }}>
                        {u.last_login || '-'}
                      </td>

                      {/* 10. Aksi Icons (Detail, Edit, Hapus) */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          {/* 1. Eye / Detail Button (Blue) */}
                          <button
                            onClick={() => openDetailModal(u)}
                            title="Lihat Detail Profil"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #dbeafe',
                              borderRadius: '10px',
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#2563eb',
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          {/* 2. Edit Pencil Button (Orange) */}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit Data Pegawai"
                            style={{
                              background: '#fffbe6',
                              border: '1px solid #fef3c7',
                              borderRadius: '10px',
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#d97706',
                            }}
                          >
                            <Edit size={16} />
                          </button>

                          {/* 3. Trash / Hapus Button (Red) */}
                          <button
                            onClick={() => {
                              if (isOwnerUser) {
                                if (onTriggerToast) {
                                  onTriggerToast('warning', 'Akses Ditolak', 'Akun Pemilik Toko (Owner) adalah akun utama dan tidak dapat dihapus!');
                                }
                                return;
                              }
                              openDeleteModal(u);
                            }}
                            title={isOwnerUser ? 'Akun Owner tidak dapat dihapus' : 'Hapus Pegawai'}
                            style={{
                              background: isOwnerUser ? '#f8fafc' : '#fef2f2',
                              border: isOwnerUser ? '1px solid #e2e8f0' : '1px solid #fecaca',
                              borderRadius: '10px',
                              width: '34px',
                              height: '34px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: isOwnerUser ? 'not-allowed' : 'pointer',
                              color: isOwnerUser ? '#94a3b8' : '#dc2626',
                              opacity: isOwnerUser ? 0.6 : 1,
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    Tidak ada pegawai yang sesuai dengan kriteria filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. FOOTER PAGINATION BAR */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: '#64748b',
          }}
        >
          <div>
            Menampilkan {filteredUsers.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * rowsPerPage, filteredUsers.length)} dari {filteredUsers.length} data
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: currentPage === pg ? '#047857' : '#ffffff',
                    color: currentPage === pg ? '#ffffff' : '#475569',
                    fontWeight: currentPage === pg ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: currentPage === pg ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                  }}
                >
                  {pg}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
                <option value={50}>50 / halaman</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: TAMBAH PEGAWAI BARU */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '580px',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Tambah Pegawai Baru</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>Daftarkan akun karyawan POS baru</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateUser} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* UPLOAD FOTO PEGAWAI */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  📸 Foto Karyawan (Opsional / Upload)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {/* Photo Preview */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#cbd5e1',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2px solid #047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="#64748b" />
                    )}
                  </div>

                  {/* Upload Controls & Presets */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #047857',
                          background: '#ecfdf5',
                          color: '#047857',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={14} /> Pilih File Foto
                      </button>

                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar_url: '' })}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    {/* Preset Avatars Fast Selection */}
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Atau pilih Avatar Cepat:
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                        {PRESET_AVATARS.map((av, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar_url: av.url })}
                            style={{
                              border: formData.avatar_url === av.url ? '2px solid #047857' : '1px solid #cbd5e1',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              overflow: 'hidden',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <img src={av.url} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* USERNAME SELECTION & SUGGESTIONS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    Username Login *
                  </label>
                  {usernameSuggestions.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Sparkles size={12} /> Rekomendasi Otomatis
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: budi.santoso"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}
                  />

                  {/* Dropdown Options for Username Selection */}
                  {usernameSuggestions.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setFormData({ ...formData, username: e.target.value });
                      }}
                      style={{ padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #047857', background: '#ecfdf5', color: '#047857', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      <option value="">Pilih Username...</option>
                      {usernameSuggestions.map((s, i) => (
                        <option key={i} value={s}>
                          @{s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Clickable Username Pill Badges */}
                {usernameSuggestions.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {usernameSuggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, username: s })}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          border: formData.username === s ? '1px solid #047857' : '1px solid #e2e8f0',
                          background: formData.username === s ? '#047857' : '#f1f5f9',
                          color: formData.username === s ? '#ffffff' : '#475569',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  No. HP / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-3456-7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              {/* Role & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Role / Wewenang
                  </label>
                  <select
                    value={formData.is_pj ? 'PJ' : 'KASIR'}
                    onChange={(e) => setFormData({ ...formData, is_pj: e.target.value === 'PJ' })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="KASIR">Kasir / Karyawan</option>
                    <option value="PJ">PJ / Penanggung Jawab</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* SHIFT SELECTION & CUSTOM TIME INPUTS */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  ⏰ Shift Tugas Karyawan
                </label>
                <select
                  value={formData.shift_mode}
                  onChange={(e) => setFormData({ ...formData, shift_mode: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="Pagi (08:00 - 16:00)">Pagi (08:00 - 16:00)</option>
                  <option value="Siang (16:00 - 00:00)">Siang (16:00 - 00:00)</option>
                  <option value="Malam (00:00 - 08:00)">Malam (00:00 - 08:00)</option>
                  <option value="CUSTOM">⚙️ Custom Shift (Tentukan Jam Mandiri)...</option>
                </select>

                {/* Custom Time Pickers */}
                {formData.shift_mode === 'CUSTOM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                        Jam Mulai Shift
                      </label>
                      <input
                        type="time"
                        value={formData.custom_start}
                        onChange={(e) => setFormData({ ...formData, custom_start: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                        Jam Selesai Shift
                      </label>
                      <input
                        type="time"
                        value={formData.custom_end}
                        onChange={(e) => setFormData({ ...formData, custom_end: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', background: '#047857', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA PEGAWAI */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '580px',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Edit size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Edit Data Pegawai</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>Perbarui informasi akun {formData.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateUser} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* UPLOAD FOTO PEGAWAI */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  📸 Foto Karyawan
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#cbd5e1',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '2px solid #2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Camera size={24} color="#64748b" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #2563eb',
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={14} /> Ubah Foto File
                      </button>

                      {formData.avatar_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar_url: '' })}
                          style={{
                            padding: '0.45rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Preset Avatar:
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                        {PRESET_AVATARS.map((av, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFormData({ ...formData, avatar_url: av.url })}
                            style={{
                              border: formData.avatar_url === av.url ? '2px solid #2563eb' : '1px solid #cbd5e1',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              overflow: 'hidden',
                              padding: 0,
                              cursor: 'pointer',
                            }}
                          >
                            <img src={av.url} alt={av.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Password Baru (Opsional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="Kosongkan jika tidak diubah"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.6rem 0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={showEditPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                    >
                      {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    No. HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Role / Wewenang
                  </label>
                  <select
                    value={formData.is_pj ? 'PJ' : 'KASIR'}
                    onChange={(e) => setFormData({ ...formData, is_pj: e.target.value === 'PJ' })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="KASIR">Kasir / Karyawan</option>
                    <option value="PJ">PJ / Penanggung Jawab</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Status Akun
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Shift Options for Edit */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  ⏰ Shift Tugas Karyawan
                </label>
                <select
                  value={formData.shift_mode}
                  onChange={(e) => setFormData({ ...formData, shift_mode: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <option value="Pagi (08:00 - 16:00)">Pagi (08:00 - 16:00)</option>
                  <option value="Siang (16:00 - 00:00)">Siang (16:00 - 00:00)</option>
                  <option value="Malam (00:00 - 08:00)">Malam (00:00 - 08:00)</option>
                  <option value="CUSTOM">⚙️ Custom Shift (Tentukan Jam Mandiri)...</option>
                </select>

                {formData.shift_mode === 'CUSTOM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                        Jam Mulai Shift
                      </label>
                      <input
                        type="time"
                        value={formData.custom_start}
                        onChange={(e) => setFormData({ ...formData, custom_start: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.2rem' }}>
                        Jam Selesai Shift
                      </label>
                      <input
                        type="time"
                        value={formData.custom_end}
                        onChange={(e) => setFormData({ ...formData, custom_end: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL PROFIL PEGAWAI */}
      {isDetailModalOpen && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Profil Pegawai</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Content */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  overflow: 'hidden',
                  margin: '0 auto 0.75rem auto',
                  border: '3px solid #047857',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#475569', lineHeight: '72px' }}>
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedUser.full_name}</h4>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>@{selectedUser.username}</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.6rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    background: selectedUser.is_pj ? '#f3e8ff' : '#dbeafe',
                    color: selectedUser.is_pj ? '#9333ea' : '#2563eb',
                  }}
                >
                  Role: {selectedUser.is_pj ? 'PJ / Penanggung Jawab' : 'Kasir / Karyawan'}
                </span>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: selectedUser.status === 'ACTIVE' ? '#ecfdf5' : selectedUser.status === 'PENDING_ACTIVATION' ? '#fffbe6' : '#fef2f2',
                    color: selectedUser.status === 'ACTIVE' ? '#047857' : selectedUser.status === 'PENDING_ACTIVATION' ? '#b45309' : '#dc2626',
                    border: selectedUser.status === 'ACTIVE' ? '1px solid #a7f3d0' : selectedUser.status === 'PENDING_ACTIVATION' ? '1px solid #fef3c7' : '1px solid #fecaca',
                  }}
                >
                  {selectedUser.status === 'ACTIVE' ? 'Aktif' : selectedUser.status === 'PENDING_ACTIVATION' ? 'Belum Aktivasi' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Profile Info Rows */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569' }}>
                <Phone size={16} color="#047857" />
                <span style={{ fontWeight: 600 }}>No. HP:</span>
                <span style={{ fontWeight: 800, color: '#0f172a', marginLeft: 'auto' }}>{selectedUser.phone || '-'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569' }}>
                <Clock size={16} color="#2563eb" />
                <span style={{ fontWeight: 600 }}>Shift Tugas:</span>
                <span style={{ fontWeight: 800, color: '#0f172a', marginLeft: 'auto' }}>{selectedUser.shift || 'Pagi (08:00 - 16:00)'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569' }}>
                <Shield size={16} color="#9333ea" />
                <span style={{ fontWeight: 600 }}>Terakhir Login:</span>
                <span style={{ fontWeight: 800, color: '#0f172a', marginLeft: 'auto' }}>{selectedUser.last_login || '-'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569' }}>
                <Shield size={16} color="#047857" />
                <span style={{ fontWeight: 600 }}>Keamanan Akun:</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {showDetailCredential ? (
                      (selectedUser as any).activation_code ? (
                        <span style={{ background: '#f3e8ff', color: '#9333ea', padding: '0.15rem 0.5rem', borderRadius: '6px', fontFamily: 'monospace' }}>
                          🔑 {(selectedUser as any).activation_code}
                        </span>
                      ) : (
                        <span style={{ color: '#059669', fontSize: '0.78rem' }}>Tersimpan Aman (Bcrypt Hash)</span>
                      )
                    ) : (
                      '••••••••'
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDetailCredential(!showDetailCredential)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showDetailCredential ? 'Sembunyikan' : 'Lihat Detail Keamanan'}
                  >
                    {showDetailCredential ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <button
                onClick={() => handleGenerateActivationCode(selectedUser)}
                style={{
                  padding: '0.6rem 1rem',
                  background: '#f3e8ff',
                  color: '#9333ea',
                  border: '1px solid #d8b4fe',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                🔑 Terbitkan Kode Aktivasi
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ padding: '0.6rem 1.25rem', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: POPUP KODE AKTIVASI PEGAWAI */}
      {generatedCode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '2rem',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#f3e8ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              🔑
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              Kode Aktivasi Pegawai
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
              Berikan kode aktivasi 6-karakter ini kepada <strong>{generatedCode.username}</strong> untuk aktivasi mandiri di halaman login.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '2px dashed #9333ea',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  color: '#7e22ce',
                  fontFamily: 'monospace',
                }}
              >
                {generatedCode.code}
              </span>
            </div>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#7e22ce',
                background: '#f3e8ff',
                border: '1px solid #e9d5ff',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                lineHeight: 1.45,
              }}
            >
              💡 Berikan kode 6-digit ini kepada <strong>{generatedCode.username}</strong>. Pegawai dapat menggunakannya di halaman login untuk aktivasi akun atau setel password.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode.code);
                  if (onTriggerToast) {
                    onTriggerToast('info', 'Tersalin', 'Kode aktivasi telah disalin ke clipboard.');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #9333ea',
                  background: '#f3e8ff',
                  color: '#7e22ce',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                📋 Salin Kode
              </button>
              <button
                onClick={() => setGeneratedCode(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PERINGATAN HAPUS PEGAWAI (DEEP WARNING CONFIRMATION MODAL) */}
      {isDeleteModalOpen && userToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25)',
              padding: '1.75rem',
              border: '2px solid #fecaca',
            }}
          >
            {/* Warning Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#991b1b', margin: 0 }}>
                  Konfirmasi Hapus Akun Pegawai
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                  Tindakan ini memerlukan perhatian khusus dari Owner
                </p>
              </div>
            </div>

            {/* Target Employee Info Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#e2e8f0',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {userToDelete.avatar_url ? (
                  <img src={userToDelete.avatar_url} alt={userToDelete.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 900, color: '#475569' }}>
                    {userToDelete.full_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>{userToDelete.full_name}</h4>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.1rem' }}>
                  @{userToDelete.username} • <span style={{ fontWeight: 800, color: userToDelete.is_pj ? '#9333ea' : '#2563eb' }}>{userToDelete.is_pj ? 'PJ' : 'Kasir'}</span>
                </div>
              </div>
            </div>

            {/* Deep Warning Content Box */}
            <div
              style={{
                background: '#fff1f2',
                borderRadius: '14px',
                padding: '1rem',
                border: '1px solid #ffe4e6',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#9f1239',
                lineHeight: '1.55',
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: '0.4rem', color: '#881337', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Shield size={15} /> PERHATIAN SANGAT PENTING:
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                <li>Akun pegawai ini akan <strong>dihapus permanen</strong> dan tidak akan dapat digunakan untuk login POS.</li>
                <li><strong>Keamanan Pembukuan:</strong> Seluruh riwayat transaksi nota, kasir shift, pengeluaran kas, dan audit log yang pernah dilakukan oleh pegawai ini <u>TETAP TERSIMPAN AMAN</u> di database untuk audit keuangan toko.</li>
                <li>Tindakan ini tidak dapat dibatalkan secara otomatis.</li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteUser}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: deleteLoading ? '#ef4444' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  opacity: deleteLoading ? 0.8 : 1,
                }}
              >
                {deleteLoading ? (
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleteLoading ? 'Menghapus...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW EXCEL (MATCHING REFERENSI USER 100%) */}
      {isExcelPreviewOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '1020px',
              maxHeight: '92vh',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #cbd5e1',
            }}
          >
            {/* Top Excel Window Bar */}
            <div
              style={{
                background: '#f8fafc',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: '#0f172a',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>📊</span> Preview Excel • Data_Pegawai_{new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: '1px solid #bbf7d0',
                  }}
                >
                  Siap untuk diekspor
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  Sheet: <strong style={{ color: '#0f172a' }}>Data Pegawai ▾</strong> | Total Data: <strong style={{ color: '#047857' }}>{filteredUsers.length}</strong>
                </span>
                <button
                  onClick={() => setIsExcelPreviewOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.35rem',
                    borderRadius: '8px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Excel Sheet View Container */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9', padding: '1rem' }}>
              {/* Excel Spreadsheet Wrapper */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                {/* Excel Grid Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif' }}>
                    {/* Excel Column Letters Bar (A - K) */}
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>
                        <th style={{ width: '40px', padding: '0.4rem', borderRight: '1px solid #cbd5e1', background: '#e2e8f0' }}>#</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1', width: '40px' }}>A</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>B</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>C</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>D</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>E</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>F</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>G</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>H</th>
                        <th style={{ padding: '0.4rem', borderRight: '1px solid #cbd5e1' }}>I</th>
                        <th style={{ padding: '0.4rem' }}>J</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1: Spacing */}
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', background: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '0.7rem' }}>1</td>
                        <td colSpan={10} style={{ padding: '0.2rem' }}></td>
                      </tr>

                      {/* Row 2 & 3: Header Document Branding */}
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ textAlign: 'center', background: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '0.7rem' }}>2</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              margin: '0 auto',
                              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)',
                            }}
                          >
                            <Shield size={24} />
                          </div>
                        </td>
                        <td colSpan={9} style={{ padding: '0.75rem 1rem', textTransform: 'uppercase' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', letterSpacing: '0.5px', textAlign: 'center' }}>
                            DATA PEGAWAI
                          </div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857', textAlign: 'center' }}>
                            TOKO UTAMA
                          </div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textAlign: 'center', marginTop: '0.25rem', textTransform: 'none' }}>
                            Tanggal Export: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} {new Date().toLocaleTimeString('id-ID')}
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: Green Solid Separator Line */}
                      <tr style={{ borderBottom: '3px solid #047857' }}>
                        <td style={{ textAlign: 'center', background: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '0.7rem' }}>4</td>
                        <td colSpan={10} style={{ padding: '0.15rem' }}></td>
                      </tr>

                      {/* Row 5: Table Header (Emerald Green Background) */}
                      <tr style={{ background: '#047857', color: '#ffffff', fontWeight: 800 }}>
                        <td style={{ textAlign: 'center', background: '#03543f', borderRight: '1px solid #024030', color: '#a7f3d0', fontSize: '0.7rem' }}>5</td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #059669' }}>No.</td>
                        <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #059669' }}>Nama Lengkap</td>
                        <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #059669' }}>Username</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', borderRight: '1px solid #059669' }}>Role</td>
                        <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #059669' }}>No. HP</td>
                        <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #059669' }}>Shift</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', borderRight: '1px solid #059669' }}>Kode Aktivasi</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', borderRight: '1px solid #059669' }}>Status</td>
                        <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #059669' }}>Terakhir Login</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>Dibuat Pada</td>
                      </tr>

                      {/* Data Rows (6+) */}
                      {filteredUsers.map((u, i) => {
                        const rowNum = i + 6;
                        return (
                          <tr key={u.user_id} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ textAlign: 'center', background: '#f8fafc', borderRight: '1px solid #cbd5e1', color: '#94a3b8', fontSize: '0.7rem' }}>{rowNum}</td>
                            <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #e2e8f0', color: '#475569' }}>{i + 1}</td>
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>{u.full_name}</td>
                            <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', color: '#334155', borderRight: '1px solid #e2e8f0' }}>@{u.username}</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                              <span
                                style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: u.role === 'OWNER' ? '#f3e8ff' : u.is_pj ? '#fffbe6' : '#dbeafe',
                                  color: u.role === 'OWNER' ? '#7e22ce' : u.is_pj ? '#b45309' : '#1d4ed8',
                                }}
                              >
                                {u.role === 'OWNER' ? 'OWNER' : u.is_pj ? 'PJ' : 'KASIR'}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{u.phone || '-'}</td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{u.shift || 'Pagi (08:00 - 16:00)'}</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: '#94a3b8', borderRight: '1px solid #e2e8f0' }}>-</td>
                            <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                              <span
                                style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  background: u.status === 'ACTIVE' ? '#dcfce7' : u.status === 'PENDING_ACTIVATION' ? '#fffbe6' : '#fee2e2',
                                  color: u.status === 'ACTIVE' ? '#15803d' : u.status === 'PENDING_ACTIVATION' ? '#b45309' : '#b91c1c',
                                }}
                              >
                                {u.status === 'ACTIVE' ? 'Aktif' : u.status === 'PENDING_ACTIVATION' ? 'Belum Aktivasi' : 'Nonaktif'}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontSize: '0.75rem', borderRight: '1px solid #e2e8f0' }}>{u.last_login || '-'}</td>
                            <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontSize: '0.75rem' }}>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Sheet Tab Navigator */}
                <div style={{ background: '#f8fafc', padding: '0.4rem 0.75rem', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderBottom: '3px solid #047857', padding: '0.3rem 0.85rem', borderRadius: '6px 6px 0 0', fontWeight: 800, color: '#047857', fontSize: '0.78rem' }}>
                      Data Pegawai
                    </div>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 700 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
                    <span>‹</span> <span>›</span> <span>•••</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer Actions */}
            <div style={{ padding: '1rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                💡 Dokumen Excel akan di-export dengan format tabel resmi & terstruktur.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsExcelPreviewOpen(false)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                  }}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '10px',
                    border: '1px solid #047857',
                    background: '#ffffff',
                    color: '#047857',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Download CSV (.csv)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadFormattedExcel();
                    setIsExcelPreviewOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)',
                  }}
                >
                  <Download size={16} /> Download Excel (.xlsx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Global Action Loading Modal */}
      <ActionLoadingModal
        isOpen={actionLoading}
        message={actionLoadingMessage}
        submessage="Mencegah duplikasi aksi & memperbarui data pegawai..."
      />
    </div>
  );
};
