import { Router } from 'express';
import db from '../database/db.js';
import {
  calculateFdmCost,
  calculateResinCost,
  calculateLaserCost,
  calculatePaintingCost,
  calculateStickerCost
} from '../services/costCalculator.js';

const router = Router();

// Helper to get active settings
function getSettingsMap() {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as any[];
  return rows.reduce((acc, cur) => ({ ...acc, [cur.key]: Number(cur.value) || cur.value }), {});
}

// POST calculate FDM
router.post('/fdm', (req, res) => {
  try {
    const settings = getSettingsMap();
    const {
      materialId,
      weightG,
      printHours,
      equipmentId,
      cadHours = 0,
      failureRatePercent = 10,
      profitMarginPercent = settings.default_profit_margin || 60,
      hasPostProcessing = false,
      partSize = 'M',
      prepHours = 1,
      paintHours = 2,
      varnishType = 'FOSCO',
      consumablesCost
    } = req.body;

    let spoolPrice = 139.90;
    let spoolWeightG = 1000;
    if (materialId) {
      const mat = db.prepare(`SELECT spool_price, spool_weight_g FROM materials_fdm WHERE id = ?`).get(materialId) as any;
      if (mat) {
        spoolPrice = mat.spool_price;
        spoolWeightG = mat.spool_weight_g;
      }
    }

    let powerWatts = 180;
    let hourlyDepreciation = 2.20;
    if (equipmentId) {
      const eq = db.prepare(`SELECT power_watts, hourly_depreciation FROM equipments WHERE id = ?`).get(equipmentId) as any;
      if (eq) {
        powerWatts = eq.power_watts;
        hourlyDepreciation = eq.hourly_depreciation;
      }
    }

    const result = calculateFdmCost({
      spoolPrice,
      spoolWeightG,
      weightG: Number(weightG) || 0,
      printHours: Number(printHours) || 0,
      powerWatts,
      kwhCost: Number(settings.kwh_cost) || 0.92,
      hourlyDepreciation,
      cadHours: Number(cadHours) || 0,
      cadRateHour: Number(settings.cad_rate_hour) || 60,
      failureRatePercent: Number(failureRatePercent) || 10,
      profitMarginPercent: Number(profitMarginPercent) || 60,
      hasPostProcessing: Boolean(hasPostProcessing),
      partSize,
      prepHours: Number(prepHours) || 0,
      paintHours: Number(paintHours) || 0,
      varnishType,
      consumablesCost: consumablesCost !== undefined ? Number(consumablesCost) : undefined,
      laborRateHour: Number(settings.print_operator_rate_hour) || 30,
      painterRateHour: Number(settings.painter_rate_hour) || 45,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST calculate Resin
router.post('/resin', (req, res) => {
  try {
    const settings = getSettingsMap();
    const {
      materialId,
      volumeMl,
      printHours,
      equipmentId,
      cadHours = 0,
      failureRatePercent = 12,
      profitMarginPercent = settings.default_profit_margin || 65,
      hasPostProcessing = false,
      partSize = 'M',
      prepHours = 1,
      paintHours = 2,
      varnishType = 'FOSCO',
      consumablesCost
    } = req.body;

    let bottlePrice = 189.90;
    let bottleVolumeMl = 1000;
    let washCureCostPerMl = 0.07;
    if (materialId) {
      const mat = db.prepare(`SELECT bottle_price, bottle_volume_ml, wash_cure_cost_per_ml FROM materials_resin WHERE id = ?`).get(materialId) as any;
      if (mat) {
        bottlePrice = mat.bottle_price;
        bottleVolumeMl = mat.bottle_volume_ml;
        washCureCostPerMl = mat.wash_cure_cost_per_ml || 0.07;
      }
    }

    let powerWatts = 120;
    let hourlyDepreciation = 1.80;
    if (equipmentId) {
      const eq = db.prepare(`SELECT power_watts, hourly_depreciation FROM equipments WHERE id = ?`).get(equipmentId) as any;
      if (eq) {
        powerWatts = eq.power_watts;
        hourlyDepreciation = eq.hourly_depreciation;
      }
    }

    const result = calculateResinCost({
      bottlePrice,
      bottleVolumeMl,
      volumeMl: Number(volumeMl) || 0,
      printHours: Number(printHours) || 0,
      washCureCostPerMl,
      powerWatts,
      kwhCost: Number(settings.kwh_cost) || 0.92,
      hourlyDepreciation,
      cadHours: Number(cadHours) || 0,
      cadRateHour: Number(settings.cad_rate_hour) || 60,
      failureRatePercent: Number(failureRatePercent) || 12,
      profitMarginPercent: Number(profitMarginPercent) || 65,
      hasPostProcessing: Boolean(hasPostProcessing),
      partSize,
      prepHours: Number(prepHours) || 0,
      paintHours: Number(paintHours) || 0,
      varnishType,
      consumablesCost: consumablesCost !== undefined ? Number(consumablesCost) : undefined,
      laborRateHour: Number(settings.print_operator_rate_hour) || 30,
      painterRateHour: Number(settings.painter_rate_hour) || 45,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST calculate Laser
router.post('/laser', (req, res) => {
  try {
    const settings = getSettingsMap();
    const {
      materialId,
      sheetsCount,
      laserHours = 0,
      finishingCost = 0,
      laborHours = 0,
      profitMarginPercent = 65
    } = req.body;

    let sheetPrice = 1.20;
    let tonerCostPerPage = 0.30;
    if (materialId) {
      const mat = db.prepare(`SELECT sheet_price, toner_cost_per_page FROM materials_laser WHERE id = ?`).get(materialId) as any;
      if (mat) {
        sheetPrice = mat.sheet_price;
        tonerCostPerPage = mat.toner_cost_per_page;
      }
    }

    const result = calculateLaserCost({
      sheetPrice,
      sheetsCount: Number(sheetsCount) || 1,
      tonerCostPerPage,
      laserHours: Number(laserHours) || 0,
      powerWatts: 130,
      kwhCost: Number(settings.kwh_cost) || 0.92,
      hourlyDepreciation: 1.30,
      finishingCost: Number(finishingCost) || 0,
      laborHours: Number(laborHours) || 0,
      laborRateHour: Number(settings.print_operator_rate_hour) || 25,
      profitMarginPercent: Number(profitMarginPercent) || 65
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST calculate Painting
router.post('/painting', (req, res) => {
  try {
    const settings = getSettingsMap();
    const {
      partSize = 'M',
      prepHours = 1,
      paintHours = 2,
      varnishType = 'FOSCO',
      consumablesCost,
      profitMarginPercent = 70
    } = req.body;

    const result = calculatePaintingCost({
      partSize,
      prepHours: Number(prepHours) || 0,
      paintHours: Number(paintHours) || 0,
      laborRateHour: Number(settings.print_operator_rate_hour) || 30,
      painterRateHour: Number(settings.painter_rate_hour) || 45,
      varnishType,
      consumablesCost: consumablesCost !== undefined ? Number(consumablesCost) : undefined,
      equipmentDepreciation: 10,
      profitMarginPercent: Number(profitMarginPercent) || 70
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST calculate Stickers / Vinil
router.post('/sticker', (req, res) => {
  try {
    const settings = getSettingsMap();
    const {
      materialId,
      equipmentId,
      sheetWidthMm = 210,
      sheetHeightMm = 297,
      stickerWidthMm = 50,
      stickerHeightMm = 50,
      spacingMm = 3,
      marginMm = 10,
      quantityTotal = 50,
      hasLamination = false,
      cutHours = 0.25,
      laborHours = 0.25,
      profitMarginPercent = settings.default_profit_margin || 65
    } = req.body;

    let sheetPrice = 2.50;
    let inkCostPerSheet = 0.50;
    let laminationCostPerSheet = 0.35;
    let customSheetWidth = Number(sheetWidthMm) || 210;
    let customSheetHeight = Number(sheetHeightMm) || 297;

    if (materialId) {
      const mat = db.prepare(`SELECT * FROM materials_stickers WHERE id = ?`).get(materialId) as any;
      if (mat) {
        sheetPrice = mat.unit_price;
        inkCostPerSheet = mat.ink_cost_per_unit ?? 0.50;
        laminationCostPerSheet = mat.lamination_cost_per_unit ?? 0.35;
        if (mat.sheet_width_mm && mat.sheet_height_mm) {
          customSheetWidth = mat.sheet_width_mm;
          customSheetHeight = mat.sheet_height_mm;
        }
      }
    }

    let powerWatts = 60;
    let plotterHourlyDepreciation = 1.20;
    if (equipmentId) {
      const eq = db.prepare(`SELECT power_watts, hourly_depreciation FROM equipments WHERE id = ?`).get(equipmentId) as any;
      if (eq) {
        powerWatts = eq.power_watts || 60;
        plotterHourlyDepreciation = eq.hourly_depreciation || 1.20;
      }
    }

    const result = calculateStickerCost({
      sheetPrice,
      sheetWidthMm: customSheetWidth,
      sheetHeightMm: customSheetHeight,
      stickerWidthMm: Number(stickerWidthMm) || 50,
      stickerHeightMm: Number(stickerHeightMm) || 50,
      spacingMm: Number(spacingMm) || 3,
      marginMm: Number(marginMm) || 10,
      quantityTotal: Number(quantityTotal) || 50,
      inkCostPerSheet,
      hasLamination: Boolean(hasLamination),
      laminationCostPerSheet,
      cutHours: Number(cutHours) || 0.25,
      powerWatts,
      kwhCost: Number(settings.kwh_cost) || 0.92,
      plotterHourlyDepreciation,
      laborHours: Number(laborHours) || 0.25,
      laborRateHour: Number(settings.print_operator_rate_hour) || 25,
      profitMarginPercent: Number(profitMarginPercent) || 65
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
