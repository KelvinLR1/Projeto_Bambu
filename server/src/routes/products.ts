import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET all active products
router.get('/', (req, res) => {
  try {
    const { category, process, search } = req.query;
    let query = `SELECT * FROM products WHERE active = 1`;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (process && process !== 'ALL') {
      query += ` AND process_type = ?`;
      params.push(process);
    }

    if (search) {
      query += ` AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY category ASC, name ASC`;

    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET product by ID
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE product
router.post('/', (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      process_type,
      description,
      material_id,
      equipment_id,
      production_time_hours,
      weight_g,
      unit_cost,
      unit_price,
      margin_percent,
      image_url,
      calc_params_json,
    } = req.body;

    if (!name || !process_type) {
      return res.status(400).json({ error: 'Nome e Processo são obrigatórios' });
    }

    const id = uuidv4();
    const finalSku = sku || `PRD-${String(Math.floor(1000 + Math.random() * 9000))}`;

    db.prepare(`
      INSERT INTO products (
        id, sku, name, category, process_type, description,
        material_id, equipment_id, production_time_hours, weight_g,
        unit_cost, unit_price, margin_percent, image_url, calc_params_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      finalSku,
      name,
      category || 'Geral',
      process_type,
      description || null,
      material_id || null,
      equipment_id || null,
      Number(production_time_hours) || 0,
      Number(weight_g) || 0,
      Number(unit_cost) || 0,
      Number(unit_price) || 0,
      Number(margin_percent) || 50,
      image_url || null,
      calc_params_json ? JSON.stringify(calc_params_json) : null
    );

    const created = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE product
router.put('/:id', (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      process_type,
      description,
      material_id,
      equipment_id,
      production_time_hours,
      weight_g,
      unit_cost,
      unit_price,
      margin_percent,
      image_url,
      calc_params_json,
    } = req.body;

    db.prepare(`
      UPDATE products SET
        name = ?,
        sku = ?,
        category = ?,
        process_type = ?,
        description = ?,
        material_id = ?,
        equipment_id = ?,
        production_time_hours = ?,
        weight_g = ?,
        unit_cost = ?,
        unit_price = ?,
        margin_percent = ?,
        image_url = ?,
        calc_params_json = ?
      WHERE id = ?
    `).run(
      name,
      sku,
      category,
      process_type,
      description || null,
      material_id || null,
      equipment_id || null,
      Number(production_time_hours) || 0,
      Number(weight_g) || 0,
      Number(unit_cost) || 0,
      Number(unit_price) || 0,
      Number(margin_percent) || 50,
      image_url || null,
      calc_params_json ? (typeof calc_params_json === 'string' ? calc_params_json : JSON.stringify(calc_params_json)) : null,
      req.params.id
    );

    const updated = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (soft delete or hard delete) product
router.delete('/:id', (req, res) => {
  try {
    db.prepare(`UPDATE products SET active = 0 WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Produto removido com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
