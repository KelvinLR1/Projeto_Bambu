import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all clients
router.get('/', (req, res) => {
  try {
    const clients = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM orders o WHERE o.client_id = c.id) as orders_count,
        (SELECT COALESCE(SUM(o.total_price), 0) FROM orders o WHERE o.client_id = c.id) as total_spent
      FROM clients c
      ORDER BY c.name ASC
    `).all();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single client
router.get('/:id', (req, res) => {
  try {
    const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });
    
    const orders = db.prepare(`
      SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ ...client, orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create client
router.post('/', (req, res) => {
  try {
    const { name, phone, email, document, address, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e Telefone/WhatsApp são obrigatórios' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO clients (id, name, phone, email, document, address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, email || null, document || null, address || null, notes || null);

    const created = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update client
router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, document, address, notes } = req.body;
    db.prepare(`
      UPDATE clients
      SET name = ?, phone = ?, email = ?, document = ?, address = ?, notes = ?
      WHERE id = ?
    `).run(name, phone, email || null, document || null, address || null, notes || null, req.params.id);

    const updated = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE client
router.delete('/:id', (req, res) => {
  try {
    const hasOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE client_id = ?`).get(req.params.id) as any;
    if (hasOrders && hasOrders.count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir cliente com pedidos vinculados.' });
    }

    db.prepare(`DELETE FROM clients WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
