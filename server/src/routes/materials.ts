import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { getLowStockAlerts } from '../services/stockService.js';

const router = Router();

// GET all materials categorized + alerts
router.get('/', (req, res) => {
  try {
    const fdm = db.prepare(`SELECT * FROM materials_fdm ORDER BY name ASC`).all();
    const resin = db.prepare(`SELECT * FROM materials_resin ORDER BY name ASC`).all();
    const laser = db.prepare(`SELECT * FROM materials_laser ORDER BY name ASC`).all();
    const finishing = db.prepare(`SELECT * FROM materials_finishing ORDER BY category ASC, name ASC`).all();
    const stickers = db.prepare(`SELECT * FROM materials_stickers ORDER BY name ASC`).all();
    const alerts = getLowStockAlerts();

    // Summary calculation
    let totalStockValue = 0;
    (fdm as any[]).forEach(i => {
      totalStockValue += (i.stock_weight_g / i.spool_weight_g) * i.spool_price;
    });
    (resin as any[]).forEach(i => {
      totalStockValue += (i.stock_volume_ml / i.bottle_volume_ml) * i.bottle_price;
    });
    (laser as any[]).forEach(i => {
      totalStockValue += i.stock_sheets * i.sheet_price;
    });
    (finishing as any[]).forEach(i => {
      totalStockValue += i.stock_qty * i.cost_per_unit;
    });
    (stickers as any[]).forEach(i => {
      totalStockValue += i.stock_qty * i.unit_price;
    });

    res.json({
      fdm,
      resin,
      laser,
      finishing,
      stickers,
      alerts,
      summary: {
        totalStockValue: Number(totalStockValue.toFixed(2)),
        criticalAlertsCount: alerts.length,
        fdmCount: fdm.length,
        resinCount: resin.length,
        laserCount: laser.length,
        finishingCount: finishing.length,
        stickersCount: stickers.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET low stock alerts only
router.get('/alerts', (req, res) => {
  try {
    const alerts = getLowStockAlerts();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- FDM CRUD ---
router.post('/fdm', (req, res) => {
  try {
    const id = uuidv4();
    const { name, brand, material_type, color, color_hex, spool_price, spool_weight_g, density, temp_print, temp_bed, stock_weight_g, min_stock_g } = req.body;
    db.prepare(`
      INSERT INTO materials_fdm (id, name, brand, material_type, color, color_hex, spool_price, spool_weight_g, density, temp_print, temp_bed, stock_weight_g, min_stock_g)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, brand, material_type, color, color_hex || '#4a5568', spool_price, spool_weight_g || 1000, density || 1.24, temp_print || 215, temp_bed || 60, stock_weight_g || 1000, min_stock_g || 250);
    res.status(201).json(db.prepare(`SELECT * FROM materials_fdm WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/fdm/:id', (req, res) => {
  try {
    const { name, brand, material_type, color, color_hex, spool_price, spool_weight_g, density, temp_print, temp_bed, stock_weight_g, min_stock_g, active } = req.body;
    db.prepare(`
      UPDATE materials_fdm
      SET name = ?, brand = ?, material_type = ?, color = ?, color_hex = ?, spool_price = ?, spool_weight_g = ?, density = ?, temp_print = ?, temp_bed = ?, stock_weight_g = ?, min_stock_g = ?, active = ?
      WHERE id = ?
    `).run(name, brand, material_type, color, color_hex, spool_price, spool_weight_g, density, temp_print, temp_bed, stock_weight_g, min_stock_g, active ?? 1, req.params.id);
    res.json(db.prepare(`SELECT * FROM materials_fdm WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/fdm/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM materials_fdm WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Resin CRUD ---
router.post('/resin', (req, res) => {
  try {
    const id = uuidv4();
    const { name, brand, resin_type, color, color_hex, bottle_price, bottle_volume_ml, wash_cure_cost_per_ml, stock_volume_ml, min_stock_ml } = req.body;
    db.prepare(`
      INSERT INTO materials_resin (id, name, brand, resin_type, color, color_hex, bottle_price, bottle_volume_ml, wash_cure_cost_per_ml, stock_volume_ml, min_stock_ml)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, brand, resin_type, color, color_hex || '#718096', bottle_price, bottle_volume_ml || 1000, wash_cure_cost_per_ml || 0.07, stock_volume_ml || 1000, min_stock_ml || 300);
    res.status(201).json(db.prepare(`SELECT * FROM materials_resin WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/resin/:id', (req, res) => {
  try {
    const { name, brand, resin_type, color, color_hex, bottle_price, bottle_volume_ml, wash_cure_cost_per_ml, stock_volume_ml, min_stock_ml, active } = req.body;
    db.prepare(`
      UPDATE materials_resin
      SET name = ?, brand = ?, resin_type = ?, color = ?, color_hex = ?, bottle_price = ?, bottle_volume_ml = ?, wash_cure_cost_per_ml = ?, stock_volume_ml = ?, min_stock_ml = ?, active = ?
      WHERE id = ?
    `).run(name, brand, resin_type, color, color_hex, bottle_price, bottle_volume_ml, wash_cure_cost_per_ml, stock_volume_ml, min_stock_ml, active ?? 1, req.params.id);
    res.json(db.prepare(`SELECT * FROM materials_resin WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/resin/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM materials_resin WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Laser CRUD ---
router.post('/laser', (req, res) => {
  try {
    const id = uuidv4();
    const { name, paper_type, grammature, sheet_price, toner_cost_per_page, stock_sheets, min_stock_sheets } = req.body;
    db.prepare(`
      INSERT INTO materials_laser (id, name, paper_type, grammature, sheet_price, toner_cost_per_page, stock_sheets, min_stock_sheets)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, paper_type, grammature || 250, sheet_price, toner_cost_per_page || 0.30, stock_sheets || 100, min_stock_sheets || 30);
    res.status(201).json(db.prepare(`SELECT * FROM materials_laser WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/laser/:id', (req, res) => {
  try {
    const { name, paper_type, grammature, sheet_price, toner_cost_per_page, stock_sheets, min_stock_sheets, active } = req.body;
    db.prepare(`
      UPDATE materials_laser
      SET name = ?, paper_type = ?, grammature = ?, sheet_price = ?, toner_cost_per_page = ?, stock_sheets = ?, min_stock_sheets = ?, active = ?
      WHERE id = ?
    `).run(name, paper_type, grammature, sheet_price, toner_cost_per_page, stock_sheets, min_stock_sheets, active ?? 1, req.params.id);
    res.json(db.prepare(`SELECT * FROM materials_laser WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/laser/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM materials_laser WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Finishing & Painting CRUD ---
router.post('/finishing', (req, res) => {
  try {
    const id = uuidv4();
    const { name, category, brand, unit_type, cost_per_unit, stock_qty, min_stock_qty } = req.body;
    db.prepare(`
      INSERT INTO materials_finishing (id, name, category, brand, unit_type, cost_per_unit, stock_qty, min_stock_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, category, brand || null, unit_type, cost_per_unit, stock_qty || 0, min_stock_qty || 0);
    res.status(201).json(db.prepare(`SELECT * FROM materials_finishing WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/finishing/:id', (req, res) => {
  try {
    const { name, category, brand, unit_type, cost_per_unit, stock_qty, min_stock_qty, active } = req.body;
    db.prepare(`
      UPDATE materials_finishing
      SET name = ?, category = ?, brand = ?, unit_type = ?, cost_per_unit = ?, stock_qty = ?, min_stock_qty = ?, active = ?
      WHERE id = ?
    `).run(name, category, brand, unit_type, cost_per_unit, stock_qty, min_stock_qty, active ?? 1, req.params.id);
    res.json(db.prepare(`SELECT * FROM materials_finishing WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/finishing/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM materials_finishing WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Stickers & Vinyl CRUD ---
router.post('/stickers', (req, res) => {
  try {
    const id = uuidv4();
    const {
      name,
      brand,
      finish,
      unit_type,
      sheet_width_mm,
      sheet_height_mm,
      unit_price,
      ink_cost_per_unit,
      lamination_cost_per_unit,
      color_hex,
      stock_qty,
      min_stock_qty
    } = req.body;

    db.prepare(`
      INSERT INTO materials_stickers (
        id, name, brand, finish, unit_type, sheet_width_mm, sheet_height_mm,
        unit_price, ink_cost_per_unit, lamination_cost_per_unit, color_hex,
        stock_qty, min_stock_qty
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      brand || null,
      finish || 'BRILHO',
      unit_type || 'FOLHA_A4',
      Number(sheet_width_mm) || 210,
      Number(sheet_height_mm) || 297,
      Number(unit_price),
      Number(ink_cost_per_unit) || 0.50,
      Number(lamination_cost_per_unit) || 0.35,
      color_hex || '#3b82f6',
      Number(stock_qty) || 0,
      Number(min_stock_qty) || 0
    );

    res.status(201).json(db.prepare(`SELECT * FROM materials_stickers WHERE id = ?`).get(id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/stickers/:id', (req, res) => {
  try {
    const {
      name,
      brand,
      finish,
      unit_type,
      sheet_width_mm,
      sheet_height_mm,
      unit_price,
      ink_cost_per_unit,
      lamination_cost_per_unit,
      color_hex,
      stock_qty,
      min_stock_qty,
      active
    } = req.body;

    db.prepare(`
      UPDATE materials_stickers
      SET name = ?, brand = ?, finish = ?, unit_type = ?, sheet_width_mm = ?, sheet_height_mm = ?,
          unit_price = ?, ink_cost_per_unit = ?, lamination_cost_per_unit = ?, color_hex = ?,
          stock_qty = ?, min_stock_qty = ?, active = ?
      WHERE id = ?
    `).run(
      name,
      brand || null,
      finish,
      unit_type,
      Number(sheet_width_mm),
      Number(sheet_height_mm),
      Number(unit_price),
      Number(ink_cost_per_unit),
      Number(lamination_cost_per_unit),
      color_hex,
      Number(stock_qty),
      Number(min_stock_qty),
      active ?? 1,
      req.params.id
    );

    res.json(db.prepare(`SELECT * FROM materials_stickers WHERE id = ?`).get(req.params.id));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/stickers/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM materials_stickers WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Quick stock adjustment (e.g. bought a new spool or restocked)
router.post('/adjust-stock', (req, res) => {
  try {
    const { table, id, changeAmount } = req.body;
    if (!['materials_fdm', 'materials_resin', 'materials_laser', 'materials_finishing', 'materials_stickers'].includes(table)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }

    const fieldMap: Record<string, string> = {
      materials_fdm: 'stock_weight_g',
      materials_resin: 'stock_volume_ml',
      materials_laser: 'stock_sheets',
      materials_finishing: 'stock_qty',
      materials_stickers: 'stock_qty'
    };
    const field = fieldMap[table];

    db.prepare(`
      UPDATE ${table}
      SET ${field} = MAX(0, ${field} + ?)
      WHERE id = ?
    `).run(Number(changeAmount), id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
