import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Package,
  Users,
  Palette,
  Key,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PhoneCall,
  Mail,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: string[];
}

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'faq' | 'contact'>('guides');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories: GuideCategory[] = [
    {
      id: 'pos',
      title: 'Transaksi & Kasir POS',
      icon: <ShoppingBag size={20} color="var(--color-primary)" />,
      description: 'Panduan lengkap melakukan transaksi penjualan, cetak struk, dan pembayaran.',
      steps: [
        'Buka menu POS Kasir dari sidebar.',
        'Pilih item produk FC/Print atau F&B dari grid atau gunakan pencarian cepat.',
        'Atur jumlah barang di keranjang kanan.',
        'Pilih metode pembayaran (Tunai, QRIS, Transfer, Debit).',
        'Klik "Selesaikan Transaksi" untuk menyimpan transaksi dan mencetak struk.',
      ],
    },
    {
      id: 'shift',
      title: 'Sistem Shift Kasir',
      icon: <BookOpen size={20} color="#059669" />,
      description: 'Cara memulai shift kerja baru dan menutup shift di akhir jam kerja.',
      steps: [
        'Klik tombol "Buka Shift" saat masuk kerja.',
        'Masukkan nominal modal awal kasir (cash drawer).',
        'Lakukan transaksi selama shift aktif.',
        'Sistem akan otomatis mencatat ringkasan laporan sesi shift secara real-time.',
      ],
    },
    {
      id: 'stock',
      title: 'Stok & Katalog Produk',
      icon: <Package size={20} color="#d97706" />,
      description: 'Kelola persediaan barang, produk jasa FC/Print, dan koreksi stok.',
      steps: [
        'Masuk ke menu "Stok Barang" atau "Produk".',
        'Untuk menambah produk baru, klik "+ Tambah Produk" dan lengkapi harga modal & jual.',
        'Atur opsi "Kelola Stok = Ya" untuk barang fisik (snack, ATK) atau "Kelola Stok = Tidak" untuk jasa (fotokopi, print).',
        'Gunakan fitur "Koreksi Stok" untuk memperbarui stok barang masukan baru.',
        'Lihat indikator warna (merah = stok menipis) untuk segera restock.',
      ],
    },
    {
      id: 'users',
      title: 'Kelola Pegawai & Hak Akses',
      icon: <Users size={20} color="#7c3aed" />,
      description: 'Pendaftaran karyawan baru, role PJ vs Kasir, dan kode aktivasi.',
      steps: [
        'Buka menu "Data Pegawai" dari sidebar Owner.',
        'Klik "+ Tambah Pegawai", isi nama, nomor HP, dan tentukan Role (PJ / Kasir).',
        'Sistem akan menerbitkan 6-digit Kode Aktivasi.',
        'Berikan Kode Aktivasi tersebut kepada karyawan untuk aktivasi akun pertamanya.',
        'Owner dapat mengaktifkan atau menonaktifkan akun karyawan kapan saja.',
      ],
    },
    {
      id: 'branding',
      title: 'Branding & Palette Warna Toko',
      icon: <Palette size={20} color="#db2777" />,
      description: 'Kustomisasi nama toko, logo, warna tema, dan latar belakang dashboard.',
      steps: [
        'Buka menu "Pengaturan" > tab "Logo & Branding".',
        'Isi Nama Toko dan upload Logo Toko (PNG/JPG/SVG).',
        'Pilih salah satu dari 6 Palette Warna Pilihan (Mocha Brown, Emerald, Royal Blue, Purple, Amber, Slate) atau gunakan Custom Hex Picker.',
        'Atur latar belakang layout sesuai kenyamanan visual.',
        'Klik "Simpan Branding & Tema" untuk menerapkan perubahan secara real-time ke seluruh aplikasi.',
      ],
    },
    {
      id: 'security',
      title: 'Keamanan & Reset Password',
      icon: <Key size={20} color="#2563eb" />,
      description: 'Pengaturan kata sandi rahasia & pemulihan password akun.',
      steps: [
        'Di menu Pengaturan > tab "Keamanan & Akun", Owner dapat mengganti password kapan saja.',
        'Jika lupa kata sandi di halaman Login, klik "Lupa Password?".',
        'Masukkan Username Akun dan Password Baru untuk mereset password secara langsung.',
      ],
    },
    {
      id: 'export',
      title: 'Laporan & Backup Data',
      icon: <FileText size={20} color="#0284c7" />,
      description: 'Ekspor laporan ke Excel/CSV, backup snapshot JSON, dan Google Sheets.',
      steps: [
        'Menu Laporan mendukung pembuatan Laporan Harian, Bulanan, dan Per Shift.',
        'Klik "Export Excel" atau "Export CSV" untuk mendownload berkas data.',
        'Gunakan menu Pengaturan > tab "Backup & Restore" untuk mengunduh snapshot database.',
        'Integrasi Google Sheets memungkinkan sinkronisasi otomatis data transaksi ke Cloud.',
      ],
    },
  ];

  const faqs: FaqItem[] = [
    {
      category: 'security',
      question: 'Bagaimana jika lupa kata sandi untuk masuk ke aplikasi?',
      answer: 'Di halaman login utama, klik "Lupa Password?". Masukkan username Anda dan buat password baru secara langsung tanpa syarat PIN.',
    },
    {
      category: 'branding',
      question: 'Apakah warna tema dan logo toko akan berubah untuk semua kasir?',
      answer: 'Ya! Seluruh perubahan nama toko, logo, dan palette warna yang disimpan oleh Owner akan tersinkronisasi secara otomatis via Server-Sent Events (SSE) ke seluruh perangkat kasir secara real-time.',
    },
    {
      category: 'users',
      question: 'Apa perbedaan antara Penanggung Jawab (PJ) dan Kasir biasa?',
      answer: 'Penanggung Jawab (PJ) memiliki wewenang tambahan seperti membuka/menutup shift kasir lain, melakukan koreksi stok, dan melihat ringkasan harian shift. Kasir biasa hanya dapat melakukan transaksi penjualan.',
    },
    {
      category: 'stock',
      question: 'Apakah layanan Jasa seperti Fotokopi & Print memerlukan stok?',
      answer: 'Tidak. Untuk jasa seperti Fotokopi, Print, Scan, atau Ketik, Anda dapat menyetel opsi "Kelola Stok = Tidak". Transaksi tetap tercatat dalam keuangan tanpa memotong jumlah barang fisik.',
    },
    {
      category: 'pos',
      question: 'Bagaimana cara membatalkan transaksi yang salah input?',
      answer: 'Transaksi yang telah selesai dapat dibatalkan melalui menu Riwayat Transaksi oleh Owner atau PJ. Pembatalan akan otomatis mengembalikan jumlah stok barang jika kelola stok aktif.',
    },
    {
      category: 'export',
      question: 'Apakah data transaksi aman jika laptop/komputer mati tiba-tiba?',
      answer: 'Sangat aman. Seluruh data tersimpan secara real-time di Database PostgreSQL lokal / cloud server. Anda juga dapat mendownload backup snapshot kapan saja dari menu Pengaturan.',
    },
  ];

  const filteredCategories = categories.filter((cat) => {
    if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.steps.some((s) => s.toLowerCase().includes(q))
    );
  });

  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            background: 'var(--primary-gradient, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={24} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                Pusat Bantuan & Panduan Sistem POS
              </h3>
              <p style={{ fontSize: '0.775rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.15rem 0 0 0' }}>
                Temukan panduan penggunaan, solusi masalah, dan kontak bantuan teknis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* TOP SEARCH & NAVIGATION TABS */}
        <div
          style={{
            padding: '1rem 1.75rem 0.5rem 1.75rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
            <input
              type="text"
              placeholder="Cari topik bantuan (cth: ganti password, transaksi, stok, barcode, kasir)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.6rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                outline: 'none',
                color: '#0f172a',
                background: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              }}
            />
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('guides')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: activeTab === 'guides' ? '#ffffff' : 'transparent',
                color: activeTab === 'guides' ? 'var(--color-primary)' : '#64748b',
                fontWeight: activeTab === 'guides' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'guides' ? '3px solid var(--color-primary)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <BookOpen size={16} /> Panduan Lengkap
            </button>

            <button
              onClick={() => setActiveTab('faq')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: activeTab === 'faq' ? '#ffffff' : 'transparent',
                color: activeTab === 'faq' ? 'var(--color-primary)' : '#64748b',
                fontWeight: activeTab === 'faq' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'faq' ? '3px solid var(--color-primary)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <HelpCircle size={16} /> Pertanyaan Sering Diajukan (FAQ)
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                background: activeTab === 'contact' ? '#ffffff' : 'transparent',
                color: activeTab === 'contact' ? 'var(--color-primary)' : '#64748b',
                fontWeight: activeTab === 'contact' ? 800 : 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'contact' ? '3px solid var(--color-primary)' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <MessageSquare size={16} /> Hubungi Support Teknis
            </button>
          </div>
        </div>

        {/* MODAL BODY CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem', background: '#ffffff' }}>
          {/* TAB 1: PANDUAN LENGKAP */}
          {activeTab === 'guides' && (
            <div>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedCategory === 'all' ? 'var(--color-primary)' : '#f1f5f9',
                    color: selectedCategory === 'all' ? '#ffffff' : '#475569',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Semua Topik
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      border: 'none',
                      background: selectedCategory === cat.id ? 'var(--color-primary)' : '#f1f5f9',
                      color: selectedCategory === cat.id ? '#ffffff' : '#475569',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {cat.title.split('&')[0]}
                  </button>
                ))}
              </div>

              {filteredCategories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#ffffff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {cat.icon}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {cat.title}
                          </h4>
                          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.1rem 0 0 0' }}>
                            {cat.description}
                          </p>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                          Langkah-langkah Penggunaan:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                          {cat.steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada panduan yang cocok dengan pencarian "{searchQuery}".
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      }}
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '1rem 1.25rem',
                          background: isExpanded ? 'var(--accent-bg, #f8fafc)' : '#ffffff',
                          border: 'none',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color: isExpanded ? 'var(--color-primary)' : '#0f172a',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{faq.question}</span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            padding: '1rem 1.25rem',
                            borderTop: '1px solid #f1f5f9',
                            background: '#ffffff',
                            fontSize: '0.825rem',
                            color: '#475569',
                            lineHeight: 1.6,
                          }}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  Tidak ada FAQ yang sesuai.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACT SUPPORT */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <MessageSquare size={28} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Layanan Support WhatsApp Cepat
                  </h4>
                </div>
                <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                  Butuh bantuan langsung dari teknisi POS? Tim Customer Service & Engineer kami siap membantu kendala sistem Anda via WhatsApp.
                </p>

                <a
                  href="https://wa.me/6285808495978?text=Halo%20Tim%20Support%20POS%20Kasir,%20saya%20membutuhkan%20bantuan%20mengenai..."
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.35rem',
                    borderRadius: '12px',
                    background: '#ffffff',
                    color: '#047857',
                    fontWeight: 900,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <span>Chat CS via WhatsApp</span> <ExternalLink size={16} />
                </a>
              </div>

              {/* Grid Channel Support */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#2563eb', fontWeight: 800 }}>
                    <Mail size={18} /> Email Support
                  </div>
                  <a href="mailto:gebyargumelar@gmail.com?subject=Bantuan%20Sistem%20POS" style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', textDecoration: 'none', wordBreak: 'break-all' }}>gebyargumelar@gmail.com</a>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Respon email maksimal 1x24 jam</div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: '#7c3aed', fontWeight: 800 }}>
                    <PhoneCall size={18} /> Hotline Support
                  </div>
                  <a href="tel:085808495978" style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', textDecoration: 'none' }}>0858-0849-5978</a>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Senin - Minggu (07:00 - 22:00 WIB)</div>
                </div>
              </div>

              {/* System Info Box */}
              <div style={{ padding: '1rem 1.25rem', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.78rem', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
                  <ShieldCheck size={16} color="var(--color-primary)" /> Informasii Sistem & Lisensi POS Kasir
                </div>
                <div>Versi Aplikasi: <strong>v2.5.0 Enterprise Realtime Edition</strong></div>
                <div>Status Koneksi Database: <span style={{ color: '#059669', fontWeight: 800 }}>✓ PostgreSQL Realtime Online</span></div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '1rem 1.75rem',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            Pusat Bantuan Sistem POS • Dukungan 24/7
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--primary-gradient, linear-gradient(135deg, #0f172a 0%, #1e293b 100%))',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
            }}
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
