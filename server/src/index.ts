import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSchema } from './database/schema.js';

import clientsRouter from './routes/clients.js';
import materialsRouter from './routes/materials.js';
import equipmentsRouter from './routes/equipments.js';
import ordersRouter from './routes/orders.js';
import calculatorRouter from './routes/calculator.js';
import failuresRouter from './routes/failures.js';
import financialRouter from './routes/financial.js';
import settingsRouter from './routes/settings.js';
import whatsappRouter from './routes/whatsapp.js';
import productsRouter from './routes/products.js';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const productUploadsDir = path.join(uploadsDir, 'products');
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}
const filesUploadsDir = path.join(uploadsDir, 'files');
if (!fs.existsSync(filesUploadsDir)) {
  fs.mkdirSync(filesUploadsDir, { recursive: true });
}

// Ensure DB schema initialized
initSchema();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos de uploads estáticos
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/clients', clientsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/equipments', equipmentsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/calculator', calculatorRouter);
app.use('/api/failures', failuresRouter);
app.use('/api/financial', financialRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/products', productsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Bambu Maker Studio & Atelier OS',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Projeto Bambu API Server rodando na porta ${PORT}`);
  console.log(`📡 Healthcheck: http://localhost:${PORT}/api/health`);
});
