import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all failures with stats
router.get('/', (req, res) => {
  try {
    const failures = db.prepare(`
      SELECT f.*, 
        o.order_number, o.title as order_title,
        e.name as equipment_name
      FROM print_failures f
      LEFT JOIN orders o ON o.id = f.order_id
      LEFT JOIN equipments e ON e.id = f.equipment_id
      ORDER BY f.date DESC
    `).all();

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_failures,
        COALESCE(SUM(financial_loss), 0) as total_financial_loss,
        COALESCE(SUM(lost_hours), 0) as total_lost_hours
      FROM print_failures
    `).get();

    const reasons = db.prepare(`
      SELECT reason, COUNT(*) as count, SUM(financial_loss) as loss
      FROM print_failures
      GROUP BY reason
      ORDER BY count DESC
    `).all();

    res.json({
      failures,
      stats,
      topReasons: reasons
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST register failure
router.post('/', (req, res) => {
  try {
    const { order_id, equipment_id, process_type, material_name, lost_qty, lost_hours, financial_loss, reason, date } = req.body;
    if (!process_type || !financial_loss || !reason) {
      return res.status(400).json({ error: 'Processo, Perda financeira e Motivo são obrigatórios' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO print_failures (id, order_id, equipment_id, process_type, material_name, lost_qty, lost_hours, financial_loss, reason, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      order_id || null,
      equipment_id || null,
      process_type,
      material_name || null,
      lost_qty || 0,
      lost_hours || 0,
      financial_loss,
      reason,
      date || new Date().toISOString().replace('T', ' ').substring(0, 19)
    );

    const created = db.prepare(`SELECT * FROM print_failures WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE failure log
router.delete('/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM print_failures WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
