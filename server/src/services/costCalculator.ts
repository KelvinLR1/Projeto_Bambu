export interface FdmCalcInput {
  spoolPrice: number;
  spoolWeightG: number;
  weightG: number;
  printHours: number;
  powerWatts?: number;
  kwhCost?: number;
  hourlyDepreciation?: number;
  cadHours?: number;
  cadRateHour?: number;
  failureRatePercent?: number;
  profitMarginPercent?: number;
}

export interface ResinCalcInput {
  bottlePrice: number;
  bottleVolumeMl: number;
  volumeMl: number;
  printHours: number;
  washCureCostPerMl?: number;
  powerWatts?: number;
  kwhCost?: number;
  hourlyDepreciation?: number;
  cadHours?: number;
  cadRateHour?: number;
  failureRatePercent?: number;
  profitMarginPercent?: number;
}

export interface LaserCalcInput {
  sheetPrice: number;
  sheetsCount: number;
  tonerCostPerPage?: number;
  laserHours?: number;
  powerWatts?: number;
  kwhCost?: number;
  hourlyDepreciation?: number;
  finishingCost?: number;
  laborHours?: number;
  laborRateHour?: number;
  profitMarginPercent?: number;
}

export interface PaintingCalcInput {
  partSize: 'P' | 'M' | 'G' | 'GG' | 'COMPLEXA';
  prepHours: number;
  paintHours: number;
  laborRateHour?: number;
  painterRateHour?: number;
  consumablesCost?: number;
  varnishType?: 'FOSCO' | 'BRILHANTE' | 'ACETINADO';
  equipmentDepreciation?: number;
  profitMarginPercent?: number;
}

export interface StickerCalcInput {
  sheetPrice: number;
  sheetWidthMm?: number;
  sheetHeightMm?: number;
  stickerWidthMm: number;
  stickerHeightMm: number;
  spacingMm?: number;
  marginMm?: number;
  quantityTotal: number;
  inkCostPerSheet?: number;
  hasLamination?: boolean;
  laminationCostPerSheet?: number;
  cutHours?: number;
  powerWatts?: number;
  kwhCost?: number;
  plotterHourlyDepreciation?: number;
  laborHours?: number;
  laborRateHour?: number;
  wasteBufferPercent?: number;
  profitMarginPercent?: number;
}

export function calculateFdmCost(input: FdmCalcInput) {
  const {
    spoolPrice,
    spoolWeightG = 1000,
    weightG,
    printHours,
    powerWatts = 180,
    kwhCost = 0.92,
    hourlyDepreciation = 2.20,
    cadHours = 0,
    cadRateHour = 60,
    failureRatePercent = 10,
    profitMarginPercent = 60
  } = input;

  const costPerGram = spoolPrice / spoolWeightG;
  const rawMaterialCost = weightG * costPerGram;
  const energyCost = (powerWatts / 1000) * printHours * kwhCost;
  const machineDepreciation = printHours * hourlyDepreciation;
  const cadCost = cadHours * cadRateHour;

  const baseCost = rawMaterialCost + energyCost + machineDepreciation + cadCost;
  const failureBuffer = baseCost * (failureRatePercent / 100);
  const totalCost = baseCost + failureBuffer;

  const profitMultiplier = 1 + (profitMarginPercent / 100);
  const finalPrice = totalCost * profitMultiplier;

  return {
    rawMaterialCost: Number(rawMaterialCost.toFixed(2)),
    energyCost: Number(energyCost.toFixed(2)),
    machineDepreciation: Number(machineDepreciation.toFixed(2)),
    cadCost: Number(cadCost.toFixed(2)),
    failureBuffer: Number(failureBuffer.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    suggestedPrice: Number(finalPrice.toFixed(2)),
    marginAmount: Number((finalPrice - totalCost).toFixed(2)),
    marginPercent: profitMarginPercent
  };
}

export function calculateResinCost(input: ResinCalcInput) {
  const {
    bottlePrice,
    bottleVolumeMl = 1000,
    volumeMl,
    printHours,
    washCureCostPerMl = 0.07,
    powerWatts = 120,
    kwhCost = 0.92,
    hourlyDepreciation = 1.80,
    cadHours = 0,
    cadRateHour = 60,
    failureRatePercent = 12,
    profitMarginPercent = 65
  } = input;

  const costPerMl = bottlePrice / bottleVolumeMl;
  const rawMaterialCost = volumeMl * costPerMl;
  const washCureCost = volumeMl * washCureCostPerMl; // IPA + FEP film & LCD wear
  const energyCost = (powerWatts / 1000) * printHours * kwhCost;
  const machineDepreciation = printHours * hourlyDepreciation;
  const cadCost = cadHours * cadRateHour;

  const baseCost = rawMaterialCost + washCureCost + energyCost + machineDepreciation + cadCost;
  const failureBuffer = baseCost * (failureRatePercent / 100);
  const totalCost = baseCost + failureBuffer;

  const finalPrice = totalCost * (1 + (profitMarginPercent / 100));

  return {
    rawMaterialCost: Number(rawMaterialCost.toFixed(2)),
    washCureCost: Number(washCureCost.toFixed(2)),
    energyCost: Number(energyCost.toFixed(2)),
    machineDepreciation: Number(machineDepreciation.toFixed(2)),
    cadCost: Number(cadCost.toFixed(2)),
    failureBuffer: Number(failureBuffer.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    suggestedPrice: Number(finalPrice.toFixed(2)),
    marginAmount: Number((finalPrice - totalCost).toFixed(2)),
    marginPercent: profitMarginPercent
  };
}

export function calculateLaserCost(input: LaserCalcInput) {
  const {
    sheetPrice,
    sheetsCount,
    tonerCostPerPage = 0.30,
    laserHours = 0,
    powerWatts = 130,
    kwhCost = 0.92,
    hourlyDepreciation = 1.30,
    finishingCost = 0,
    laborHours = 0,
    laborRateHour = 30,
    profitMarginPercent = 65
  } = input;

  const paperCost = sheetPrice * sheetsCount;
  const tonerCost = tonerCostPerPage * sheetsCount;
  const energyCost = (powerWatts / 1000) * laserHours * kwhCost;
  const machineDepreciation = laserHours * hourlyDepreciation;
  const laborCost = laborHours * laborRateHour;

  const totalCost = paperCost + tonerCost + energyCost + machineDepreciation + finishingCost + laborCost;
  const finalPrice = totalCost * (1 + (profitMarginPercent / 100));

  return {
    paperCost: Number(paperCost.toFixed(2)),
    tonerCost: Number(tonerCost.toFixed(2)),
    energyCost: Number(energyCost.toFixed(2)),
    machineDepreciation: Number(machineDepreciation.toFixed(2)),
    finishingCost: Number(finishingCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    suggestedPrice: Number(finalPrice.toFixed(2)),
    marginAmount: Number((finalPrice - totalCost).toFixed(2)),
    marginPercent: profitMarginPercent
  };
}

export function calculatePaintingCost(input: PaintingCalcInput) {
  const {
    partSize,
    prepHours,
    paintHours,
    laborRateHour = 30,
    painterRateHour = 45,
    varnishType = 'FOSCO',
    equipmentDepreciation = 10,
    profitMarginPercent = 70
  } = input;

  // Custo estimado de insumos por tamanho da peça (Primer + Lixas + Tintas + Verniz)
  const sizeMultiplier = {
    P: 15.00,       // Miniatura até 7cm
    M: 30.00,       // Estátua 15-20cm
    G: 60.00,       // Peça 25-35cm
    GG: 110.00,     // Cosplay / Peça grande
    COMPLEXA: 90.00 // Detalhes múltiplos, mascaramento
  }[partSize] || 35.00;

  const prepCost = prepHours * laborRateHour;
  const paintCost = paintHours * painterRateHour;
  const consumablesCost = input.consumablesCost ?? sizeMultiplier;
  const totalCost = prepCost + paintCost + consumablesCost + equipmentDepreciation;

  const finalPrice = totalCost * (1 + (profitMarginPercent / 100));

  return {
    prepCost: Number(prepCost.toFixed(2)),
    paintCost: Number(paintCost.toFixed(2)),
    consumablesCost: Number(consumablesCost.toFixed(2)),
    equipmentDepreciation: Number(equipmentDepreciation.toFixed(2)),
    varnishType,
    partSize,
    totalCost: Number(totalCost.toFixed(2)),
    suggestedPrice: Number(finalPrice.toFixed(2)),
    marginAmount: Number((finalPrice - totalCost).toFixed(2)),
    marginPercent: profitMarginPercent
  };
}

export function calculateStickerCost(input: StickerCalcInput) {
  const {
    sheetPrice,
    sheetWidthMm = 210,
    sheetHeightMm = 297,
    stickerWidthMm,
    stickerHeightMm,
    spacingMm = 3,
    marginMm = 10,
    quantityTotal = 1,
    inkCostPerSheet = 0.50,
    hasLamination = false,
    laminationCostPerSheet = 0.35,
    cutHours = 0.2,
    powerWatts = 60,
    kwhCost = 0.92,
    plotterHourlyDepreciation = 1.20,
    laborHours = 0.2,
    laborRateHour = 25,
    wasteBufferPercent = 5,
    profitMarginPercent = 65
  } = input;

  // Área útil da folha descontando margens da plotter (marcas de registro)
  const usableWidth = Math.max(10, sheetWidthMm - (marginMm * 2));
  const usableHeight = Math.max(10, sheetHeightMm - (marginMm * 2));

  // Dimensão com espaçamento
  const itemW = Math.max(1, stickerWidthMm + spacingMm);
  const itemH = Math.max(1, stickerHeightMm + spacingMm);

  // Orientação Normal (sem girar)
  const colsNormal = Math.floor(usableWidth / itemW);
  const rowsNormal = Math.floor(usableHeight / itemH);
  const countNormal = Math.max(1, colsNormal * rowsNormal);

  // Orientação Rotacionada 90 graus
  const colsRotated = Math.floor(usableWidth / itemH);
  const rowsRotated = Math.floor(usableHeight / itemW);
  const countRotated = Math.max(1, colsRotated * rowsRotated);

  // Melhor aproveitamento
  const stickersPerSheet = Math.max(countNormal, countRotated);
  const isRotatedBest = countRotated > countNormal;

  // Folhas ou metros necessários
  const safeQuantity = Math.max(1, Number(quantityTotal) || 1);
  const sheetsNeeded = Math.ceil(safeQuantity / stickersPerSheet);

  // Eficiência de área (%)
  const singleAreaMm2 = stickerWidthMm * stickerHeightMm;
  const totalSheetAreaMm2 = sheetWidthMm * sheetHeightMm;
  const areaEfficiencyPercent = Math.min(100, Math.round(((stickersPerSheet * singleAreaMm2) / totalSheetAreaMm2) * 100));

  // Custos
  const mediaCost = sheetsNeeded * sheetPrice;
  const inkCost = sheetsNeeded * inkCostPerSheet;
  const laminationCost = hasLamination ? (sheetsNeeded * laminationCostPerSheet) : 0;
  const energyCost = (powerWatts / 1000) * cutHours * kwhCost;
  const machineDepreciation = cutHours * plotterHourlyDepreciation;
  const laborCost = laborHours * laborRateHour;

  const baseCost = mediaCost + inkCost + laminationCost + energyCost + machineDepreciation + laborCost;
  const wasteBuffer = baseCost * (wasteBufferPercent / 100);
  const totalCost = baseCost + wasteBuffer;

  const finalPrice = totalCost * (1 + (profitMarginPercent / 100));
  const unitCost = totalCost / safeQuantity;
  const unitPrice = finalPrice / safeQuantity;

  return {
    stickersPerSheet,
    sheetsNeeded,
    isRotatedBest,
    areaEfficiencyPercent,
    mediaCost: Number(mediaCost.toFixed(2)),
    inkCost: Number(inkCost.toFixed(2)),
    laminationCost: Number(laminationCost.toFixed(2)),
    energyCost: Number(energyCost.toFixed(2)),
    machineDepreciation: Number(machineDepreciation.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    wasteBuffer: Number(wasteBuffer.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    suggestedPrice: Number(finalPrice.toFixed(2)),
    unitCost: Number(unitCost.toFixed(3)),
    unitPrice: Number(unitPrice.toFixed(2)),
    marginAmount: Number((finalPrice - totalCost).toFixed(2)),
    marginPercent: profitMarginPercent
  };
}
