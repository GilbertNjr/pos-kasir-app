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

// 2. PRINT TO PDF - FORMAT STRUK THERMAL 58MM RAMPING / NOTA RINGKAS SHIFT
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

  const dutyUsersStr = formatDutyUsersText(dutyUsers, currentUserFullName);

  const itemRowsThermal =
    itemList.length > 0
      ? itemList
          .map(
            (item) => `
        <tr>
          <td style="text-align: left; padding: 2px 0;">
            <div style="font-weight: bold; font-size: 10px;">${item.name}</div>
            <div style="font-size: 9px; color: #475569;">${formatRupiah(item.price)}</div>
          </td>
          <td style="text-align: center; vertical-align: top; font-weight: bold; padding-top: 2px; font-size: 10px;">${item.qty}x</td>
          <td style="text-align: right; vertical-align: top; font-weight: bold; padding-top: 2px; font-size: 10px;">${formatRupiah(item.subtotal)}</td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="text-align: center; font-style: italic; color: #64748b; padding: 4px 0; font-size: 9px;">(Belum ada barang terjual)</td>
        </tr>
      `;

  const expenseRowsThermal =
    expenseList.length > 0
      ? expenseList
          .map(
            (exp) => `
        <tr>
          <td colspan="2" style="text-align: left; padding: 2px 0; font-size: 9.5px;">- ${exp.description}</td>
          <td style="text-align: right; font-weight: bold; color: #dc2626; font-size: 9.5px;">${formatRupiah(exp.amount)}</td>
        </tr>
      `
          )
          .join('')
      : `
        <tr>
          <td colspan="3" style="text-align: center; font-style: italic; color: #64748b; padding: 4px 0; font-size: 9px;">(Tidak ada pengeluaran kas)</td>
        </tr>
      `;

  const printWindow = window.open('', '_blank', 'width=380,height=680');
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
      <title>Struk 58mm Rekap Shift - ${dateStr}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0 auto;
        }
        html {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          color: #000000;
          width: 260px;
          max-width: 58mm;
          margin: 0 auto !important;
          padding: 6px 4px;
          font-size: 10px;
          line-height: 1.3;
          box-sizing: border-box;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .store-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-subtitle { font-size: 9.5px; font-weight: bold; margin-top: 2px; text-transform: uppercase; }
        .dashed-line { border-bottom: 1px dashed #000000; margin: 5px 0; }
        .solid-line { border-bottom: 1.5px solid #000000; margin: 6px 0; }
        .meta-item { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; margin-top: 3px; }
        th { border-bottom: 1px dashed #000000; padding: 3px 0; font-size: 9px; text-transform: uppercase; }
        td { padding: 2px 0; vertical-align: top; word-break: break-word; }
        .summary-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
        .grand-total-box {
          border: 1.5px solid #000000;
          padding: 6px;
          margin-top: 6px;
          margin-bottom: 6px;
          text-align: center;
          background: #ffffff;
        }
        .grand-total-label { font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .grand-total-value { font-size: 14px; font-weight: bold; margin-top: 2px; color: #000000; }
        @media print {
          html, body {
            width: 260px !important;
            max-width: 58mm !important;
            margin: 0 auto !important;
            padding: 4px 0 !important;
          }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="store-title">${(storeName || 'KEDAI POS').toUpperCase()}</div>
        <div class="report-subtitle">STRUK REKAPITULASI SHIFT KASIR</div>
      </div>
      <div class="dashed-line"></div>

      <div class="meta-item"><span>Waktu Cetak</span><span>: ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span></div>
      <div class="meta-item"><span>Tanggal Shift</span><span>: ${dateStr}</span></div>
      <div class="meta-item"><span>Sesi Shift</span><span>: ${shiftId}</span></div>
      <div class="meta-item" style="flex-direction: column; align-items: flex-start; gap: 1px; margin-top: 2px;">
        <span>Tim Bertugas Shift:</span>
        <span class="bold" style="padding-left: 4px; font-size: 8.5px; word-break: break-word;">${dutyUsersStr}</span>
      </div>
      <div class="dashed-line"></div>

      <!-- 1. BARANG TERJUAL -->
      <div class="bold" style="font-size: 9.5px; margin-top: 2px;">1. RINCIAN BARANG/JASA TERJUAL</div>
      <table>
        <thead>
          <tr>
            <th style="width: 50%; text-align: left;">Item</th>
            <th style="width: 15%; text-align: center;">Qty</th>
            <th style="width: 35%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsThermal}
        </tbody>
      </table>
      <div class="dashed-line"></div>
      <div class="summary-row bold">
        <span>TOTAL PENJUALAN KOTOR</span>
        <span>${formatRupiah(totalGrossSales)}</span>
      </div>
      <div class="dashed-line"></div>

      <!-- 2. PENGELUARAN SHIFT -->
      <div class="bold" style="font-size: 9.5px; margin-top: 2px;">2. PENGELUARAN KAS SHIFT</div>
      <table>
        <tbody>
          ${expenseRowsThermal}
        </tbody>
      </table>
      <div class="dashed-line"></div>
      <div class="summary-row bold">
        <span>TOTAL PENGELUARAN SHIFT</span>
        <span>-${formatRupiah(totalExpenses)}</span>
      </div>
      <div class="dashed-line"></div>

      <!-- GRAND TOTAL BERSIH -->
      <div class="grand-total-box">
        <div class="grand-total-label">UANG KASIR / TOTAL SHIFT BERSIH</div>
        <div class="grand-total-value">${formatRupiah(netTotal)}</div>
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
