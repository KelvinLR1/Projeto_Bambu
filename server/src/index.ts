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

dotenv.config();

// Ensure DB schema initialized
initSchema();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

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
