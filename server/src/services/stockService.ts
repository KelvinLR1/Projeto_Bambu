import db from '../database/db.js';

export interface StockAlert {
  id: string;
  type: 'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'ADESIVO';
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  percentageLeft: number;
}

export function getLowStockAlerts(): StockAlert[] {
  const alerts: StockAlert[] = [];

  // FDM
  const fdmItems = db.prepare(`
    SELECT id, name, brand, stock_weight_g, min_stock_g
    FROM materials_fdm
    WHERE active = 1 AND stock_weight_g <= min_stock_g
  `).all() as any[];

  fdmItems.forEach(item => {
    alerts.push({
      id: item.id,
      type: 'FDM',
      name: `${item.brand} - ${item.name}`,
      currentStock: item.stock_weight_g,
      minStock: item.min_stock_g,
      unit: 'g',
      percentageLeft: Math.round((item.stock_weight_g / (item.min_stock_g * 2 || 1000)) * 100)
    });
  });

  // Resin
  const resinItems = db.prepare(`
    SELECT id, name, brand, stock_volume_ml, min_stock_ml
    FROM materials_resin
    WHERE active = 1 AND stock_volume_ml <= min_stock_ml
  `).all() as any[];

  resinItems.forEach(item => {
    alerts.push({
      id: item.id,
      type: 'RESIN',
      name: `${item.brand} - ${item.name}`,
      currentStock: item.stock_volume_ml,
      minStock: item.min_stock_ml,
      unit: 'ml',
      percentageLeft: Math.round((item.stock_volume_ml / (item.min_stock_ml * 2 || 1000)) * 100)
    });
  });

  // Laser
  const laserItems = db.prepare(`
    SELECT id, name, stock_sheets, min_stock_sheets
    FROM materials_laser
    WHERE active = 1 AND stock_sheets <= min_stock_sheets
  `).all() as any[];

  laserItems.forEach(item => {
    alerts.push({
      id: item.id,
      type: 'LASER',
      name: item.name,
      currentStock: item.stock_sheets,
      minStock: item.min_stock_sheets,
      unit: 'folhas',
      percentageLeft: Math.round((item.stock_sheets / (item.min_stock_sheets * 2 || 100)) * 100)
    });
  });

  // Finishing / Paint
  const finishingItems = db.prepare(`
    SELECT id, name, category, brand, unit_type, stock_qty, min_stock_qty
    FROM materials_finishing
    WHERE active = 1 AND stock_qty <= min_stock_qty
  `).all() as any[];

  finishingItems.forEach(item => {
    alerts.push({
      id: item.id,
      type: 'PINTURA',
      name: `${item.category}: ${item.name} (${item.brand || 'Geral'})`,
      currentStock: item.stock_qty,
      minStock: item.min_stock_qty,
      unit: item.unit_type,
      percentageLeft: Math.round((item.stock_qty / (item.min_stock_qty * 2 || 100)) * 100)
    });
  });

  // Stickers / Vinyl
  const stickerItems = db.prepare(`
    SELECT id, name, brand, finish, unit_type, stock_qty, min_stock_qty
    FROM materials_stickers
    WHERE active = 1 AND stock_qty <= min_stock_qty
  `).all() as any[];

  stickerItems.forEach(item => {
    alerts.push({
      id: item.id,
      type: 'ADESIVO',
      name: `Adesivo: ${item.name} (${item.finish})`,
      currentStock: item.stock_qty,
      minStock: item.min_stock_qty,
      unit: item.unit_type.toLowerCase().includes('folha') ? 'folhas' : 'm',
      percentageLeft: Math.round((item.stock_qty / (item.min_stock_qty * 2 || 50)) * 100)
    });
  });

  return alerts;
}

export function deductStockForOrder(orderId: string) {
  const items = db.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).all(orderId) as any[];

  for (const item of items) {
    let params: any = {};
    try {
      params = JSON.parse(item.calc_params_json || '{}');
    } catch {
      params = {};
    }

    if (item.process_type === 'FDM' && item.material_id && params.weight_g) {
      db.prepare(`
        UPDATE materials_fdm
        SET stock_weight_g = MAX(0, stock_weight_g - ?)
        WHERE id = ?
      `).run(params.weight_g * item.quantity, item.material_id);
    } else if (item.process_type === 'RESIN' && item.material_id && params.volume_ml) {
      db.prepare(`
        UPDATE materials_resin
        SET stock_volume_ml = MAX(0, stock_volume_ml - ?)
        WHERE id = ?
      `).run(params.volume_ml * item.quantity, item.material_id);
    } else if (item.process_type === 'LASER' && item.material_id && params.sheets) {
      db.prepare(`
        UPDATE materials_laser
        SET stock_sheets = MAX(0, stock_sheets - ?)
        WHERE id = ?
      `).run(params.sheets * item.quantity, item.material_id);
    } else if (item.process_type === 'ADESIVO' && item.material_id && (params.sheetsNeeded || params.sheets)) {
      const sheetsToDeduct = (params.sheetsNeeded || params.sheets || 1) * item.quantity;
      db.prepare(`
        UPDATE materials_stickers
        SET stock_qty = MAX(0, stock_qty - ?)
        WHERE id = ?
      `).run(sheetsToDeduct, item.material_id);
    }

    // Se houver equipamento associado, soma as horas no horômetro
    if (item.equipment_id && (params.hours || params.printHours || params.laserHours || params.cutHours)) {
      const hoursToAdd = (params.hours || params.printHours || params.laserHours || params.cutHours || 0) * item.quantity;
      db.prepare(`
        UPDATE equipments
        SET total_hours = total_hours + ?,
            hours_since_last_maint = hours_since_last_maint + ?
        WHERE id = ?
      `).run(hoursToAdd, hoursToAdd, item.equipment_id);
    }
  }
}
