import dotenv from 'dotenv';
dotenv.config();

export interface BusinessInsightItem {
  type: 'POSITIVE' | 'WARNING' | 'NEUTRAL' | 'TIP';
  title: string;
  message: string;
  action_recommendation?: string;
}

export interface AIServiceContext {
  period_type: string;
  total_omzet: number;
  total_expenses: number;
  total_transactions_count: number;
  total_items_sold: number;
  top_selling_products: Array<{
    product_name: string;
    business_unit: string;
    qty_sold: number;
    total_revenue: number;
  }>;
  slow_moving_products: Array<{
    product_name: string;
    business_unit: string;
    qty_sold: number;
  }>;
  category_distribution: Array<{
    category_name: string;
    omzet: number;
    business_unit: string;
  }>;
  peak_hour_summary?: string;
}

class AIService {
  private keyIndex: number = 0;
  private cache: Map<string, { insights: BusinessInsightItem[]; timestamp: number }> = new Map();
  private CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit cache

  /**
   * Mengambil daftar API Key Gemini yang tersedia (Mendukung hingga 5 Key dengan Fallback Auto-Rotation)
   */
  private getApiKeys(): string[] {
    const keys: string[] = [];

    // Check individual environment variables
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && key.trim().length > 0) {
        keys.push(key.trim());
      }
    }

    // Check comma-separated string if available
    if (process.env.GEMINI_API_KEYS) {
      const parsed = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
      for (const k of parsed) {
        if (!keys.includes(k)) keys.push(k);
      }
    }

    return keys;
  }

  /**
   * Menghasilkan rekomendasi bisnis cerdas berbasis AI Gemini dengan Fallback Auto-Rotation 5 Keys
   */
  public async generateBusinessInsights(context: AIServiceContext): Promise<BusinessInsightItem[]> {
    const cacheKey = `${context.period_type}_${context.total_omzet}_${context.total_transactions_count}_${context.top_selling_products.length}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.insights;
    }

    const apiKeys = this.getApiKeys();

    // Jika ada API Key yang dikonfigurasi, coba panggil AI Gemini dengan mekanisme rotasi 5 Key
    if (apiKeys.length > 0) {
      let attempts = 0;
      const maxAttempts = apiKeys.length;

      while (attempts < maxAttempts) {
        const currentKey = apiKeys[this.keyIndex % apiKeys.length];
        const keyNumber = (this.keyIndex % apiKeys.length) + 1;

        try {
          console.log(`[AI Engine] Memproses analisis bisnis menggunakan Gemini API Key #${keyNumber}...`);
          const aiInsights = await this.callGeminiAPI(currentKey, context);

          if (aiInsights && aiInsights.length > 0) {
            console.log(`[AI Engine] Berhasil mendapatkan ${aiInsights.length} rekomendasi cerdas via Gemini Key #${keyNumber}!`);
            this.cache.set(cacheKey, { insights: aiInsights, timestamp: Date.now() });
            return aiInsights;
          }
        } catch (err: any) {
          console.warn(`[AI Engine Warning] Gemini API Key #${keyNumber} mengalami kendala/limit (${err.message || err}). Mengalihkan ke Key berikutnya...`);
          this.keyIndex++; // Rotasi ke key berikutnya
        }

        attempts++;
      }

      console.warn(`[AI Engine Warning] Seluruh ${apiKeys.length} API Key Gemini telah mencapai kuota/limit. Mengaktifkan Heuristic Machine Learning Rule Engine lokal.`);
    } else {
      console.log('[AI Engine Info] Tidak ada GEMINI_API_KEY yang dikonfigurasi di .env. Menggunakan Heuristic Statistical Engine lokal.');
    }

    // Fallback Heuristic Engine lokal berstandar ML untuk keandalan 100% tanpa downtime
    const fallbackInsights = this.generateLocalHeuristicInsights(context);
    this.cache.set(cacheKey, { insights: fallbackInsights, timestamp: Date.now() });
    return fallbackInsights;
  }

  /**
   * Panggilan langsung ke API Gemini menggunakan fetch bawaan Node.js
   */
  private async callGeminiAPI(apiKey: string, ctx: AIServiceContext): Promise<BusinessInsightItem[]> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Anda adalah seorang AI Senior Business Analyst & Retail Specialist untuk toko POS campuran (Fotokopi/Printing & Snack/Minuman F&B).
Tugas Anda adalah mempelajari data transaksi toko berikut dan memberikan 3 hingga 4 rekomendasi bisnis yang sangat tajam, akurat, dan dapat dieksekusi oleh Pemilik Toko (Owner).

DATA KINERJA OPERASIONAL TOKO:
- Periode Analisis: ${ctx.period_type}
- Total Omzet: Rp ${ctx.total_omzet.toLocaleString('id-ID')}
- Total Pengeluaran Kas: Rp ${ctx.total_expenses.toLocaleString('id-ID')}
- Total Transaksi: ${ctx.total_transactions_count} Nota
- Total Barang/Jasa Terjual: ${ctx.total_items_sold} unit

PRODUK TERLARIS (BARANG TERJUAL TINGGI):
${ctx.top_selling_products.length > 0 ? ctx.top_selling_products.map((p, i) => `${i + 1}. ${p.product_name} (${p.business_unit}) - ${p.qty_sold} terjual, Omzet: Rp ${p.total_revenue.toLocaleString('id-ID')}`).join('\n') : 'Belum ada transaksi terjual'}

PRODUK SLOW MOVING / BELUM TERJUAL (PERHATIAN STOK):
${ctx.slow_moving_products.length > 0 ? ctx.slow_moving_products.map((p, i) => `${i + 1}. ${p.product_name} (${p.business_unit}) - ${p.qty_sold} terjual`).join('\n') : 'Semua produk memiliki perputaran baik'}

DISTRIBUSI KATEGORI:
${ctx.category_distribution.length > 0 ? ctx.category_distribution.map((c) => `- ${c.category_name} (${c.business_unit}): Rp ${c.omzet.toLocaleString('id-ID')}`).join('\n') : 'Belum ada data kategori'}

PETUNJUK OUTPUT:
Berikan respon HANYA berupa JSON Array murni (tanpa markdown formatting seperti \`\`\`json) dengan format berikut:
[
  {
    "type": "POSITIVE" | "WARNING" | "NEUTRAL" | "TIP",
    "title": "Judul Analisis Singkat",
    "message": "Penjelasan mendalam berbasis data terjual & belum terjual secara kontekstual.",
    "action_recommendation": "Langkah praktis yang direkomendasikan untuk owner"
  }
]
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5 detik fast timeout agar dashboard tidak lemot

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) throw new Error('Respon AI kosong');

      // Clean potential JSON markdown blocks
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed: BusinessInsightItem[] = JSON.parse(cleanJson);

      return parsed;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Engine Statistik Heuristic Lokal (Machine Learning Rule Engine Fallback)
   * Berfungsi 100% offline saat API Key belum diisi atau habis kuota
   */
  private generateLocalHeuristicInsights(ctx: AIServiceContext): BusinessInsightItem[] {
    const insights: BusinessInsightItem[] = [];

    // 1. Analisis Perputaran Barang (Terjual vs Belum Terjual)
    const activeTop = ctx.top_selling_products.filter((p) => p.qty_sold > 0);
    const zeroSold = ctx.slow_moving_products.filter((p) => p.qty_sold === 0);

    if (activeTop.length > 0) {
      const best = activeTop[0];
      insights.push({
        type: 'POSITIVE',
        title: `Produk Unggulan: ${best.product_name}`,
        message: `${best.product_name} mendominasi volume penjualan dengan total ${best.qty_sold} item terjual (Omzet: Rp ${best.total_revenue.toLocaleString('id-ID')}).`,
        action_recommendation: `Pastikan stok ${best.product_name} selalu aman untuk mencegah kehabisan stok saat jam ramai.`,
      });
    }

    if (zeroSold.length > 0) {
      const sampleNames = zeroSold.slice(0, 2).map((p) => p.product_name).join(', ');
      insights.push({
        type: 'WARNING',
        title: 'Peringatan Barang Lambat / Belum Terjual',
        message: `Terdapat ${zeroSold.length} item seperti (${sampleNames}) yang belum mencatatkan penjualan pada periode ini.`,
        action_recommendation: 'Pertimbangkan untuk membuat paket bundling dengan produk terlaris atau berikan diskon cuci gudang.',
      });
    }

    // 2. Analisis Rasio Pengeluaran Kas vs Omzet
    if (ctx.total_omzet > 0) {
      const expenseRatio = Math.round((ctx.total_expenses / ctx.total_omzet) * 100);
      if (expenseRatio > 30) {
        insights.push({
          type: 'WARNING',
          title: `Rasio Pengeluaran Kas Tinggi (${expenseRatio}%)`,
          message: `Total pengeluaran kasir (Rp ${ctx.total_expenses.toLocaleString('id-ID')}) menyerap ${expenseRatio}% dari total omzet toko.`,
          action_recommendation: 'Lakukan verifikasi nota dan nota bukti kas kecil kasir untuk efisiensi margin.',
        });
      } else {
        insights.push({
          type: 'NEUTRAL',
          title: `Rasio Pengeluaran Sehat (${expenseRatio}%)`,
          message: `Pengeluaran operasional toko berada di batas aman (${expenseRatio}% dari omzet).`,
          action_recommendation: 'Pertahankan disiplin pencatatan kas kecil harian.',
        });
      }
    } else {
      insights.push({
        type: 'NEUTRAL',
        title: 'Analisis Siap Berjalan',
        message: 'Sistem AI siap menganalisis pola transaksi begitu penjualan pertama dicatat hari ini.',
        action_recommendation: 'Lakukan transaksi pertama untuk mengaktifkan analisis perputaran barang.',
      });
    }

    // 3. Rekomendasi Diversifikasi Bidang Usaha
    const fcPrintOmzet = ctx.category_distribution
      .filter((c) => c.business_unit === 'FC_PRINT')
      .reduce((sum, c) => sum + c.omzet, 0);

    const fnbOmzet = ctx.category_distribution
      .filter((c) => c.business_unit === 'FNB')
      .reduce((sum, c) => sum + c.omzet, 0);

    if (fcPrintOmzet > 0 && fnbOmzet > 0) {
      if (fcPrintOmzet > fnbOmzet * 2) {
        insights.push({
          type: 'TIP',
          title: 'Peluang Cross-Selling F&B',
          message: 'Pendapatan Fotokopi/Printing jauh lebih dominan dibanding Snack/Minuman.',
          action_recommendation: 'Pajang etalase minuman dingin atau snack dekat meja kasir fotokopi untuk mendorong pembelian spontan.',
        });
      } else if (fnbOmzet > fcPrintOmzet * 2) {
        insights.push({
          type: 'TIP',
          title: 'Peluang Penjualan ATK & Printing',
          message: 'Penjualan Snack/Minuman F&B sangat ramai dibanding jasa fotokopi.',
          action_recommendation: 'Sediakan promo paket cetak atau tambahkan etalase ATK populer di area F&B.',
        });
      }
    }

    // 4. Analisis Jam Sibuk Toko (Peak Hours Analysis)
    if (ctx.peak_hour_summary) {
      insights.push({
        type: 'TIP',
        title: 'Analisis Jam Sibuk Toko (Peak Hours)',
        message: `Puncak keramaian & volume transaksi toko terjadi pada kurun waktu ${ctx.peak_hour_summary}.`,
        action_recommendation: 'Pastikan ketersediaan pecahan uang kembalian dan siapkan minimal 2 kasir aktif di jam sibuk tersebut.',
      });
    }

    // 5. Strategi Bundling & Cross-Selling Lintas Kategori
    const topItem = activeTop.length > 0 ? activeTop[0] : null;
    const slowItem = zeroSold.length > 0 ? zeroSold[0] : null;

    if (topItem && slowItem) {
      insights.push({
        type: 'TIP',
        title: `Strategi Bundling (${topItem.product_name} + ${slowItem.product_name})`,
        message: `Produk terlaris (${topItem.product_name}) berpotensi mendongkrak perputaran produk lambat (${slowItem.product_name}).`,
        action_recommendation: `Buat paket bundling promo hemat menggabungkan ${topItem.product_name} dengan ${slowItem.product_name} untuk mempercepat omzet.`,
      });
    }

    return insights;
  }
}

export const aiService = new AIService();
