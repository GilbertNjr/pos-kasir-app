import { formatRupiah } from './formatters';

export interface ShiftReportExportOptions {
  storeName?: string;
  dateStr?: string;
  shiftId?: string;
  dutyUsers?: string[];
  currentUserFullName?: string;
  transactions: any[];
  expenses: any[];
}

const extractBaseName = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim();

export const formatDutyUsersHtml = (dutyUsers: string[] = [], currentUserFullName?: string) => {
  if (!dutyUsers || dutyUsers.length === 0) {
    return currentUserFullName
      ? `<u style="text-decoration: underline; font-weight: 800; color: #0f172a;">${currentUserFullName}</u>`
      : 'Karyawan Shift';
  }

  const loggedInClean = currentUserFullName ? extractBaseName(currentUserFullName).toLowerCase() : '';

  const sortedUsers = [...dutyUsers].sort((a, b) => {
    const aClean = extractBaseName(a).toLowerCase();
    const bClean = extractBaseName(b).toLowerCase();
    if (loggedInClean && aClean === loggedInClean) return -1;
    if (loggedInClean && bClean === loggedInClean) return 1;
    return 0;
  });

  return sortedUsers
    .map((fullNameWithTime) => {
      const baseName = extractBaseName(fullNameWithTime);
      const isLoggedUser = loggedInClean && baseName.toLowerCase() === loggedInClean;
      if (isLoggedUser) {
        return `<u style="text-decoration: underline; font-weight: 800; color: #0f172a;">${fullNameWithTime}</u>`;
      }
      return fullNameWithTime;
    })
    .join(', ');
};

export const formatDutyUsersText = (dutyUsers: string[] = [], currentUserFullName?: string) => {
  if (!dutyUsers || dutyUsers.length === 0) {
    return currentUserFullName || 'Karyawan Shift';
  }

  const loggedInClean = currentUserFullName ? extractBaseName(currentUserFullName).toLowerCase() : '';

  const sortedUsers = [...dutyUsers].sort((a, b) => {
    const aClean = extractBaseName(a).toLowerCase();
    const bClean = extractBaseName(b).toLowerCase();
    if (loggedInClean && aClean === loggedInClean) return -1;
    if (loggedInClean && bClean === loggedInClean) return 1;
    return 0;
  });

  return sortedUsers
    .map((fullNameWithTime) => {
      const baseName = extractBaseName(fullNameWithTime);
      const isLoggedUser = loggedInClean && baseName.toLowerCase() === loggedInClean;
      if (isLoggedUser) {
        return `${fullNameWithTime} (Akun Login)`;
      }
      return fullNameWithTime;
    })
    .join(', ');
};

// Helper: Aggregates items from transactions list
export const aggregateShiftData = (transactions: any[], expenses: any[]) => {
  const itemMap: Record<string, { qty: number; name: string; price: number; subtotal: number }> = {};

  transactions.forEach((tx) => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach((it: any) => {
        const name = it.product_name || it.name || 'Produk';
        const price = Number(it.unit_price || it.harga_jual || 0);
        const qty = Number(it.quantity || it.qty || 1);
        const subtotal = Number(it.subtotal || it.total_price || (price * qty));

        const key = `${name.toLowerCase().trim()}_${price}`;
        if (!itemMap[key]) {
          itemMap[key] = { qty: 0, name, price, subtotal: 0 };
        }
        itemMap[key].qty += qty;
        itemMap[key].subtotal += subtotal;
      });
    }
  });

  const itemList = Object.values(itemMap);
  const totalGrossSales = itemList.reduce((sum, i) => sum + i.subtotal, 0);

  const expenseList = expenses.map((exp: any) => ({
    description: exp.description || exp.category || 'Pengeluaran Kas',
    amount: Number(exp.amount || 0),
  }));
  const totalExpenses = expenseList.reduce((sum, e) => sum + e.amount, 0);

  const netTotal = Math.max(0, totalGrossSales - totalExpenses);

  return {
    itemList,
    totalGrossSales,
    expenseList,
    totalExpenses,
    netTotal,
  };
};

// 1. EXPORT TO EXCEL (.xls) - FORMAT LAPORAN SHIFT (GAMBAR #2)
export const exportShiftToExcel = (options: ShiftReportExportOptions) => {
  const {
    storeName = 'Kedai POS',
    dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    shiftId = 'Shift Sesi Aktif',
    dutyUsers = ['Karyawan Kasir'],
    currentUserFullName,
    transactions,
    expenses,
  } = options;

  const { itemList, totalGrossSales, expenseList, totalExpenses, netTotal } = aggregateShiftData(
    transactions,
    expenses
  );

  const dutyUsersStr = formatDutyUsersText(dutyUsers, currentUserFullName);

  const itemRowsHtml = itemList
    .map(
      (item) => `
      <tr>
        <td style="text-align: center;">${item.qty}</td>
        <td>${item.name}</td>
        <td style="text-align: right;">${formatRupiah(item.price)}</td>
        <td style="text-align: right; font-weight: bold;">${formatRupiah(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const expenseRowsHtml =
    expenseList.length > 0
      ? expenseList
          .map(
            (exp) => `
        <tr>
          <td colspan="3" style="text-align: left; padding-left: 20px;">- ${exp.description}</td>
          <td style="text-align: right; color: #dc2626; font-weight: bold;">${formatRupiah(exp.amount)}</td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="text-align: left; font-style: italic; color: #64748b;">(Tidak ada pengeluaran kas pada shift ini)</td>
          <td style="text-align: right;">Rp 0</td>
        </tr>
      `;

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan Shift</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0f172a; }
        .header-title { font-size: 16pt; font-weight: bold; color: #059669; text-align: center; }
        .store-title { font-size: 12pt; font-weight: bold; color: #334155; text-align: center; }
        .meta-table { width: 100%; margin-top: 15px; margin-bottom: 15px; font-size: 10pt; }
        table.data-table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
        table.data-table th { background-color: #047857; color: #ffffff; font-weight: bold; text-align: center; padding: 8px; border: 1px solid #065f46; }
        table.data-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
        .bg-subtotal { background-color: #f1f5f9; font-weight: bold; }
        .bg-expense-head { background-color: #fef2f2; color: #991b1b; font-weight: bold; }
        .total-box { background-color: #ecfdf5; border: 2px solid #059669; font-size: 14pt; font-weight: bold; color: #047857; padding: 10px; text-align: right; }
      </style>
    </head>
    <body>
      <div class="store-title">${storeName.toUpperCase()}</div>
      <div class="header-title">LAPORAN REKAPITULASI SHIFT & PENJUALAN HARIAN</div>
      
      <table class="meta-table">
        <tr>
          <td><strong>Tanggal:</strong> ${dateStr}</td>
          <td><strong>Shift Sesi:</strong> ${shiftId}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Pegawai Shift Jaga:</strong> ${dutyUsersStr}</td>
        </tr>
      </table>

      <!-- TABEL 1: REKAP PENJUALAN ITEM -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 60px;">Qty</th>
            <th style="width: 300px;">Nama Barang / Jasa</th>
            <th style="width: 130px;">Harga Satuan</th>
            <th style="width: 150px;">Total Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
          <tr class="bg-subtotal">
            <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL PENJUALAN KOTOR</td>
            <td style="text-align: right; font-weight: bold; color: #047857;">${formatRupiah(totalGrossSales)}</td>
          </tr>
        </tbody>
      </table>

      <!-- TABEL 2: PENGELUARAN SHIFT -->
      <table class="data-table">
        <thead>
          <tr class="bg-expense-head">
            <th colspan="3" style="text-align: left;">PENGELUARAN SHIFT</th>
            <th style="text-align: right;">NOMINAL</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRowsHtml}
          <tr class="bg-subtotal">
            <td colspan="3" style="text-align: right; font-weight: bold; color: #dc2626;">TOTAL PENGELUARAN SHIFT</td>
            <td style="text-align: right; font-weight: bold; color: #dc2626;">${formatRupiah(totalExpenses)}</td>
          </tr>
        </tbody>
      </table>

      <!-- GRAND TOTAL BERSIH SHIFT -->
      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="width: 50%;"></td>
          <td class="total-box">
            TOTAL SHIFT BERSIH (UANG FISIK KASIR): ${formatRupiah(netTotal)}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Shift_${dateStr.replace(/\//g, '-')}_${shiftId.slice(-6)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 2. PRINT TO PDF - CETAK MANDIRI SESUAI FORMAT GAMBAR #2
export const printShiftPDF = (options: ShiftReportExportOptions) => {
  const {
    storeName = 'Kedai POS',
    dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    shiftId = 'Shift Sesi Aktif',
    dutyUsers = ['Karyawan Kasir'],
    currentUserFullName,
    transactions,
    expenses,
  } = options;

  const { itemList, totalGrossSales, expenseList, totalExpenses, netTotal } = aggregateShiftData(
    transactions,
    expenses
  );

  const dutyUsersStr = formatDutyUsersHtml(dutyUsers, currentUserFullName);

  const itemRowsPrint = itemList
    .map(
      (item) => `
      <tr>
        <td style="text-align: center; border-bottom: 1px dashed #cbd5e1; padding: 4px;">${item.qty}</td>
        <td style="border-bottom: 1px dashed #cbd5e1; padding: 4px; font-weight: 600;">${item.name}</td>
        <td style="text-align: right; border-bottom: 1px dashed #cbd5e1; padding: 4px;">${formatRupiah(item.price)}</td>
        <td style="text-align: right; border-bottom: 1px dashed #cbd5e1; padding: 4px; font-weight: 700;">${formatRupiah(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const expenseRowsPrint =
    expenseList.length > 0
      ? expenseList
          .map(
            (exp) => `
        <tr>
          <td colspan="3" style="border-bottom: 1px dashed #cbd5e1; padding: 4px; font-size: 0.85rem;">- ${exp.description}</td>
          <td style="text-align: right; border-bottom: 1px dashed #cbd5e1; padding: 4px; font-weight: 700; color: #dc2626;">${formatRupiah(exp.amount)}</td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="padding: 4px; font-style: italic; color: #64748b; font-size: 0.85rem;">(Tidak ada pengeluaran kas pada shift ini)</td>
          <td style="text-align: right; padding: 4px;">Rp 0</td>
        </tr>
      `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Harap izinkan popup browser untuk membuka pratinjau cetak PDF.');
    return;
  }

  try {
    printWindow.opener = null;
  } catch {
    // Ignore if opener restriction
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak Laporan Shift - ${dateStr}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, sans-serif;
          color: #0f172a;
          line-height: 1.3;
          margin: 0;
          padding: 10px;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        .store-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #475569;
          text-transform: uppercase;
        }
        .report-title {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin-top: 2px;
        }
        .meta-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 13px;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12px;
        }
        th {
          border-top: 1px solid #0f172a;
          border-bottom: 1px solid #0f172a;
          padding: 6px 4px;
          text-align: left;
          font-weight: 700;
        }
        .section-label {
          font-size: 13px;
          font-weight: 800;
          margin-top: 15px;
          margin-bottom: 6px;
          color: #0f172a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
        }
        .total-row {
          font-weight: 800;
          font-size: 13px;
          border-top: 1px solid #0f172a;
          border-bottom: 1px solid #0f172a;
        }
        .grand-total-container {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .grand-total-box {
          border: 2px solid #0f172a;
          border-radius: 12px;
          padding: 10px 20px;
          text-align: right;
          min-width: 220px;
        }
        .grand-total-label {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }
        .grand-total-value {
          font-size: 22px;
          font-weight: 900;
          color: #059669;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="report-title">LAPORAN REKAPITULASI SHIFT & PENJUALAN HARIAN</div>
      </div>

      <div class="meta-grid">
        <div><strong>Tgl:</strong> ${dateStr}</div>
        <div><strong>Shift:</strong> ${shiftId}</div>
        <div><strong>Pegawai Shift:</strong> ${dutyUsersStr}</div>
      </div>

      <div class="section-label">1. TABEL REKAPITULASI BARANG TERJUAL</div>
      <table>
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">Qty</th>
            <th>Nama Barang</th>
            <th style="width: 110px; text-align: right;">Harga</th>
            <th style="width: 130px; text-align: right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsPrint}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 6px 4px;">Total Penjualan Kotor</td>
            <td style="text-align: right; padding: 6px 4px;">${formatRupiah(totalGrossSales)}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-label">2. PENGELUARAN SHIFT</div>
      <table>
        <thead>
          <tr>
            <th colspan="3">Keterangan / Keperluan</th>
            <th style="width: 130px; text-align: right;">Nominal</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRowsPrint}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding: 6px 4px; color: #dc2626;">Total Pengeluaran</td>
            <td style="text-align: right; padding: 6px 4px; color: #dc2626;">${formatRupiah(totalExpenses)}</td>
          </tr>
        </tbody>
      </table>

      <div class="grand-total-container">
        <div class="grand-total-box">
          <div class="grand-total-label">Total Bersih / Uang Kasir</div>
          <div class="grand-total-value">${formatRupiah(netTotal)}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          try {
            window.print();
          } catch(e) {}
          setTimeout(function() {
            try { window.close(); } catch(e) {}
          }, 300);
        };
        window.onafterprint = function() {
          try { window.close(); } catch(e) {}
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
