import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import shiftRoutes from './routes/shiftRoutes';
import transactionRoutes from './routes/transactionRoutes';
import expenseRoutes from './routes/expenseRoutes';
import stockRoutes from './routes/stockRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import backupRoutes from './routes/backupRoutes';
import auditRoutes from './routes/auditRoutes';
import sseRoutes from './routes/sseRoutes';
import settingsRoutes from './routes/settingsRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api', sseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check Route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    message: 'POS Kasir Usaha Campuran API Engine Operational',
    timestamp: new Date().toISOString(),
    dal: 'Google Sheets Adapter Interface Ready',
  });
});

// Serve static files in production (Docker setup)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start Server if not imported as module
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[POS Server] Server running on http://localhost:${PORT}`);
  });
}

export default app;
