import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all equipments + maintenance alerts
router.get('/', (req, res) => {
  try {
    const equipments = db.prepare(`SELECT * FROM equipments ORDER BY name ASC`).all() as any[];

    const enriched = equipments.map(eq => {
      const remainingHours = Math.max(0, eq.maintenance_interval_hours - eq.hours_since_last_maint);
      const isDue = eq.hours_since_last_maint >= eq.maintenance_interval_hours;
      const progressPercent = Math.min(100, Math.round((eq.hours_since_last_maint / eq.maintenance_interval_hours) * 100));

      return {
        ...eq,
        remainingHours,
        isDue,
        progressPercent
      };
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single equipment + maintenance history
router.get('/:id', (req, res) => {
  try {
    const equipment = db.prepare(`SELECT * FROM equipments WHERE id = ?`).get(req.params.id) as any;
    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });

    const maintenances = db.prepare(`
      SELECT * FROM equipment_maintenances WHERE equipment_id = ? ORDER BY performed_at DESC
    `).all(req.params.id);

    res.json({ ...equipment, maintenances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create equipment
router.post('/', (req, res) => {
  try {
    const id = uuidv4();
    const { name, type, power_watts, purchase_cost, lifespan_hours, hourly_depreciation, maintenance_interval_hours, total_hours, notes } = req.body;
    db.prepare(`
      INSERT INTO equipments (id, name, type, power_watts, purchase_cost, lifespan_hours, hourly_depreciation, maintenance_interval_hours, total_hours, hours_since_last_maint, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'ATIVO', ?)
    `).run(id, name, type, power_watts || 150, purchase_cost || 0, lifespan_hours || 5000, hourly_depreciation || 2.0, maintenance_interval_hours || 200, total_hours || 0, notes || null);

    res.status(201).json(db.prepare(`SELECT * FROM equipments WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update equipment
router.put('/:id', (req, res) => {
  try {
    const { name, type, power_watts, purchase_cost, lifespan_hours, hourly_depreciation, maintenance_interval_hours, status, notes } = req.body;
    db.prepare(`
      UPDATE equipments
      SET name = ?, type = ?, power_watts = ?, purchase_cost = ?, lifespan_hours = ?, hourly_depreciation = ?, maintenance_interval_hours = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(name, type, power_watts, purchase_cost, lifespan_hours, hourly_depreciation, maintenance_interval_hours, status || 'ATIVO', notes, req.params.id);

    res.json(db.prepare(`SELECT * FROM equipments WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST register maintenance performed
router.post('/:id/maintenance', (req, res) => {
  try {
    const { type, description, cost, registerExpense } = req.body;
    const equip = db.prepare(`SELECT * FROM equipments WHERE id = ?`).get(req.params.id) as any;
    if (!equip) return res.status(404).json({ error: 'Equipamento não encontrado' });

    const maintId = uuidv4();
    const currentHours = equip.total_hours;
    const nextDue = currentHours + equip.maintenance_interval_hours;

    db.prepare(`
      INSERT INTO equipment_maintenances (id, equipment_id, type, description, cost, hours_at_maint, next_due_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(maintId, req.params.id, type || 'PREVENTIVA', description, cost || 0, currentHours, nextDue);

    // Reset horômetro parcial desde a última manutenção
    db.prepare(`
      UPDATE equipments
      SET hours_since_last_maint = 0, status = 'ATIVO'
      WHERE id = ?
    `).run(req.params.id);

    // Se solicitado registrar despesa no fluxo de caixa
    if (registerExpense && cost > 0) {
      db.prepare(`
        INSERT INTO financial_transactions (id, order_id, type, category, amount, payment_method, status, notes)
        VALUES (?, NULL, 'DESPESA', 'Manutencao', ?, 'PIX', 'PAGO', ?)
      `).run(uuidv4(), cost, `Manutenção ${equip.name}: ${description}`);
    }

    res.status(201).json({ success: true, maintId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
