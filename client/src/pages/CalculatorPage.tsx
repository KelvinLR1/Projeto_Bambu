import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, PROCESS_MAP } from '../utils/formatters';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { 
  Calculator, 
  Printer, 
  TestTube, 
  Zap, 
  Paintbrush, 
  PlusCircle, 
  ArrowRight,
  FolderOpen,
  Save,
  Copy,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Layers,
  CheckSquare,
  Square,
  FileCode,
  Check
} from 'lucide-react';
import { Product, ProductFile } from '../types';

interface ProfitMarginControlProps {
  marginPercent: number;
  onChangeMargin: (newMarginPercent: number) => void;
  totalCost: number;
  accentColor: string;
  tabLabel: string;
}

const ProfitMarginControl: React.FC<ProfitMarginControlProps> = ({
  marginPercent,
  onChangeMargin,
  totalCost,
  accentColor,
  tabLabel,
}) => {
  // Lucro em R$ calculado a partir do custo total e da margem %
  const profitAmount = totalCost > 0 ? totalCost * ((marginPercent || 0) / 100) : 0;
  const suggestedPrice = totalCost + profitAmount;

  // Rastreia qual campo está com foco para permitir digitação fluida sem conflito de arredondamento
  const [focusedField, setFocusedField] = useState<'percent' | 'amount' | 'price' | null>(null);
  const [localPercent, setLocalPercent] = useState<string>('');
  const [localAmount, setLocalAmount] = useState<string>('');
  const [localPrice, setLocalPrice] = useState<string>('');

  useEffect(() => {
    if (focusedField !== 'percent') {
      setLocalPercent(marginPercent !== undefined && marginPercent !== null ? String(Math.round(marginPercent * 10) / 10) : '0');
    }
  }, [marginPercent, focusedField]);

  useEffect(() => {
    if (focusedField !== 'amount') {
      setLocalAmount(profitAmount > 0 ? profitAmount.toFixed(2) : '0.00');
    }
  }, [profitAmount, focusedField]);

  useEffect(() => {
    if (focusedField !== 'price') {
      setLocalPrice(suggestedPrice > 0 ? suggestedPrice.toFixed(2) : '0.00');
    }
  }, [suggestedPrice, focusedField]);

  const handlePercentChange = (valStr: string) => {
    setLocalPercent(valStr);
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeMargin(Math.round(parsed * 10) / 10);
    }
  };

  const handleAmountChange = (valStr: string) => {
    setLocalAmount(valStr);
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      if (totalCost > 0) {
        const calculatedPercent = (parsed / totalCost) * 100;
        onChangeMargin(Math.round(calculatedPercent * 10) / 10);
      }
    }
  };

  const handlePriceChange = (valStr: string) => {
    setLocalPrice(valStr);
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      const calculatedProfit = Math.max(0, parsed - totalCost);
      if (totalCost > 0) {
        const calculatedPercent = (calculatedProfit / totalCost) * 100;
        onChangeMargin(Math.round(calculatedPercent * 10) / 10);
      }
    }
  };

  const maxSlider = Math.max(200, Math.ceil(((marginPercent || 0) / 50) + 1) * 50);

  return (
    <div
      style={{
        background: 'var(--bg-surface-elevated, var(--bg-surface))',
        border: `1px solid color-mix(in srgb, ${accentColor} 30%, var(--border-subtle))`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        marginTop: 6,
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Header com indicador do ganho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              background: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
              color: accentColor,
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUp size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              Lucro & Margem Desejada ({tabLabel})
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Defina o ganho por <strong>%</strong> ou pelo <strong>valor em R$</strong>
            </div>
          </div>
        </div>

        <span
          style={{
            background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            color: accentColor,
            border: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {marginPercent}% = +{formatCurrency(profitAmount)}
        </span>
      </div>

      {/* Grid de Inputs Sincronizados: % e R$ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {/* Opção 1: Porcentagem (%) */}
        <div>
          <label
            className="form-label"
            style={{ fontSize: '0.78rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span>Ganho em Porcentagem</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(%)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              inputMode="decimal"
              className="form-control mono"
              value={localPercent}
              onFocus={() => setFocusedField('percent')}
              onBlur={() => setFocusedField(null)}
              onChange={e => handlePercentChange(e.target.value)}
              placeholder="ex: 65"
              style={{
                paddingRight: 32,
                fontWeight: 700,
                borderColor: focusedField === 'percent' ? accentColor : undefined,
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: accentColor,
                fontWeight: 800,
                fontSize: '0.9rem',
                pointerEvents: 'none',
              }}
            >
              %
            </span>
          </div>
        </div>

        {/* Opção 2: Valor em Dinheiro (R$) */}
        <div>
          <label
            className="form-label"
            style={{ fontSize: '0.78rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span>Lucro Desejado</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(R$)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.78rem',
                pointerEvents: 'none',
              }}
            >
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              className="form-control mono"
              value={localAmount}
              onFocus={() => setFocusedField('amount')}
              onBlur={() => setFocusedField(null)}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="ex: 45.00"
              style={{
                paddingLeft: 30,
                fontWeight: 700,
                borderColor: focusedField === 'amount' ? accentColor : undefined,
              }}
            />
          </div>
        </div>

        {/* Opção 3: Preço Final Sugerido (R$) */}
        <div>
          <label
            className="form-label"
            style={{ fontSize: '0.78rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <span>Preço Final de Venda</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(R$)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.78rem',
                pointerEvents: 'none',
              }}
            >
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              className="form-control mono"
              value={localPrice}
              onFocus={() => setFocusedField('price')}
              onBlur={() => setFocusedField(null)}
              onChange={e => handlePriceChange(e.target.value)}
              placeholder="ex: 95.00"
              style={{
                paddingLeft: 30,
                fontWeight: 700,
                color: accentColor,
                borderColor: focusedField === 'price' ? accentColor : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Slider Interativo */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
          <span>Ajuste fino no controle deslizante:</span>
          <strong style={{ color: accentColor }}>{marginPercent}%</strong>
        </div>
        <input
          type="range"
          min="0"
          max={maxSlider}
          step="1"
          value={Math.min(marginPercent || 0, maxSlider)}
          onChange={e => onChangeMargin(Number(e.target.value))}
          style={{ width: '100%', accentColor, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
          <span>0% (Sem lucro)</span>
          <span>50%</span>
          <span>100% (2x)</span>
          <span>{maxSlider}%</span>
        </div>
      </div>


      {/* Resumo Dinâmico em Linha: Custo + Lucro = Preço */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '0.76rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <div style={{ color: 'var(--text-secondary)' }}>
          Custo de Produção: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalCost)}</strong>
          {' '}+ Ganho Desejado: <strong className="mono" style={{ color: accentColor }}>{formatCurrency(profitAmount)}</strong>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          = Preço de Venda Sugerido:{' '}
          <strong className="mono" style={{ color: accentColor, fontSize: '0.86rem' }}>
            {formatCurrency(suggestedPrice)}
          </strong>
        </div>
      </div>
    </div>
  );
};

interface CalculatorPageProps {
  onGenerateOrder: (calcItem: any) => void;
  initialProduct?: Product | null;
  onClearInitialProduct?: () => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  onGenerateOrder,
  initialProduct,
  onClearInitialProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'FDM' | 'RESIN' | 'LASER' | 'PINTURA'>('FDM');
  const [materials, setMaterials] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [] });
  const [equipments, setEquipments] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sub-peças do Projeto Selecionado
  const [projectParts, setProjectParts] = useState<ProductFile[]>([]);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [loadingParts, setLoadingParts] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsForm, setSaveAsForm] = useState({ name: '', sku: '', category: 'Geral' });

  // FDM State
  const [fdmMaterialId, setFdmMaterialId] = useState('');
  const [fdmWeightG, setFdmWeightG] = useState(150);
  const [fdmHours, setFdmHours] = useState(6);
  const [fdmEquipId, setFdmEquipId] = useState('');
  const [fdmCadHours, setFdmCadHours] = useState(0.5);
  const [fdmFailureRate, setFdmFailureRate] = useState(10);
  const [fdmMargin, setFdmMargin] = useState(65);
  const [fdmResult, setFdmResult] = useState<any>(null);

  // Resin State
  const [resinMaterialId, setResinMaterialId] = useState('');
  const [resinVolumeMl, setResinVolumeMl] = useState(80);
  const [resinHours, setResinHours] = useState(4);
  const [resinEquipId, setResinEquipId] = useState('');
  const [resinCadHours, setResinCadHours] = useState(0.5);
  const [resinFailureRate, setResinFailureRate] = useState(12);
  const [resinMargin, setResinMargin] = useState(65);
  const [resinResult, setResinResult] = useState<any>(null);

  // Laser State
  const [laserMaterialId, setLaserMaterialId] = useState('');
  const [laserSheets, setLaserSheets] = useState(25);
  const [laserMinutes, setLaserMinutes] = useState(30);
  const [laserFinishingCost, setLaserFinishingCost] = useState(15);
  const [laserLaborHours, setLaserLaborHours] = useState(0.5);
  const [laserMargin, setLaserMargin] = useState(65);
  const [laserResult, setLaserResult] = useState<any>(null);

  // Painting State
  const [paintSize, setPaintSize] = useState<'P' | 'M' | 'G' | 'GG' | 'COMPLEXA'>('M');
  const [paintPrepHours, setPaintPrepHours] = useState(2);
  const [paintPaintHours, setPaintPaintHours] = useState(3);
  const [paintVarnish, setPaintVarnish] = useState('FOSCO');
  const [paintMargin, setPaintMargin] = useState(70);
  const [paintResult, setPaintResult] = useState<any>(null);

  useEffect(() => {
    loadDatabaseOptions();
  }, []);

  useEffect(() => {
    if (initialProduct) {
      loadProductIntoCalculator(initialProduct);
    }
  }, [initialProduct]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadDatabaseOptions = async () => {
    try {
      const [mats, eqs, prods] = await Promise.all([
        api.getMaterials(),
        api.getEquipments(),
        api.getProducts().catch(() => []),
      ]);

      setMaterials(mats);
      setEquipments(eqs);
      setProducts(prods || []);

      if (mats.fdm.length > 0) setFdmMaterialId(mats.fdm[0].id);
      if (mats.resin.length > 0) setResinMaterialId(mats.resin[0].id);
      if (mats.laser.length > 0) setLaserMaterialId(mats.laser[0].id);

      const fdmEq = eqs.find((e: any) => e.type === 'FDM');
      if (fdmEq) setFdmEquipId(fdmEq.id);

      const resinEq = eqs.find((e: any) => e.type === 'RESIN');
      if (resinEq) setResinEquipId(resinEq.id);
    } catch (err) {
      console.error('Erro ao carregar opções da calculadora:', err);
    }
  };

  const loadProductIntoCalculator = (prod: Product) => {
    setSelectedProduct(prod);

    // Identificar processo alvo
    const validTabs: ('FDM' | 'RESIN' | 'LASER' | 'PINTURA')[] = ['FDM', 'RESIN', 'LASER', 'PINTURA'];
    const pType = (prod.process_type || 'FDM').toUpperCase() as any;
    const targetTab = validTabs.includes(pType) ? pType : 'FDM';
    setActiveTab(targetTab);

    // Parse calc_params_json
    let params: any = null;
    if (prod.calc_params_json) {
      try {
        params = typeof prod.calc_params_json === 'string'
          ? JSON.parse(prod.calc_params_json)
          : prod.calc_params_json;
      } catch (e) {
        console.warn('Erro ao parsear calc_params_json:', e);
      }
    }

    if (targetTab === 'FDM') {
      if (params?.materialId) setFdmMaterialId(params.materialId);
      else if (prod.material_id) setFdmMaterialId(prod.material_id);

      if (params?.equipmentId) setFdmEquipId(params.equipmentId);
      else if (prod.equipment_id) setFdmEquipId(prod.equipment_id);

      if (params?.weightG != null) setFdmWeightG(Number(params.weightG));
      else if (prod.weight_g != null && prod.weight_g > 0) setFdmWeightG(Number(prod.weight_g));

      if (params?.printHours != null) setFdmHours(Number(params.printHours));
      else if (prod.production_time_hours != null && prod.production_time_hours > 0) setFdmHours(Number(prod.production_time_hours));

      if (params?.cadHours != null) setFdmCadHours(Number(params.cadHours));
      if (params?.failureRatePercent != null) setFdmFailureRate(Number(params.failureRatePercent));
      if (params?.profitMarginPercent != null) setFdmMargin(Number(params.profitMarginPercent));
      else if (prod.margin_percent != null) setFdmMargin(Number(prod.margin_percent));
    } else if (targetTab === 'RESIN') {
      if (params?.materialId) setResinMaterialId(params.materialId);
      else if (prod.material_id) setResinMaterialId(prod.material_id);

      if (params?.equipmentId) setResinEquipId(params.equipmentId);
      else if (prod.equipment_id) setResinEquipId(prod.equipment_id);

      if (params?.volumeMl != null) setResinVolumeMl(Number(params.volumeMl));
      else if (prod.weight_g != null && prod.weight_g > 0) setResinVolumeMl(Number(prod.weight_g));

      if (params?.printHours != null) setResinHours(Number(params.printHours));
      else if (prod.production_time_hours != null && prod.production_time_hours > 0) setResinHours(Number(prod.production_time_hours));

      if (params?.cadHours != null) setResinCadHours(Number(params.cadHours));
      if (params?.failureRatePercent != null) setResinFailureRate(Number(params.failureRatePercent));
      if (params?.profitMarginPercent != null) setResinMargin(Number(params.profitMarginPercent));
      else if (prod.margin_percent != null) setResinMargin(Number(prod.margin_percent));
    } else if (targetTab === 'LASER') {
      if (params?.materialId) setLaserMaterialId(params.materialId);
      else if (prod.material_id) setLaserMaterialId(prod.material_id);

      if (params?.sheetsCount != null) setLaserSheets(Number(params.sheetsCount));
      else if (prod.weight_g != null && prod.weight_g > 0) setLaserSheets(Number(prod.weight_g));

      if (params?.laserMinutes != null) setLaserMinutes(Number(params.laserMinutes));
      else if (prod.production_time_hours != null && prod.production_time_hours > 0) {
        setLaserMinutes(Math.round(Number(prod.production_time_hours) * 60));
      }

      if (params?.finishingCost != null) setLaserFinishingCost(Number(params.finishingCost));
      if (params?.laborHours != null) setLaserLaborHours(Number(params.laborHours));
      if (params?.profitMarginPercent != null) setLaserMargin(Number(params.profitMarginPercent));
      else if (prod.margin_percent != null) setLaserMargin(Number(prod.margin_percent));
    } else if (targetTab === 'PINTURA') {
      if (params?.partSize) setPaintSize(params.partSize);
      if (params?.prepHours != null) setPaintPrepHours(Number(params.prepHours));
      if (params?.paintHours != null) setPaintPaintHours(Number(params.paintHours));
      else if (prod.production_time_hours != null && prod.production_time_hours > 0) {
        setPaintPaintHours(Number(prod.production_time_hours));
      }
      if (params?.varnishType) setPaintVarnish(params.varnishType);
      if (params?.profitMarginPercent != null) setPaintMargin(Number(params.profitMarginPercent));
      else if (prod.margin_percent != null) setPaintMargin(Number(prod.margin_percent));
    }

    setSaveAsForm({
      name: `${prod.name} (Cópia)`,
      sku: '',
      category: prod.category || 'Geral',
    });

    // Carregar arquivos e sub-peças do projeto
    setLoadingParts(true);
    api.getProductFiles(prod.id)
      .then(files => {
        setProjectParts(files);
        setSelectedPartIds(new Set(files.map(f => f.id)));
      })
      .catch(err => {
        console.warn('Erro ao carregar sub-peças do projeto:', err);
        setProjectParts([]);
        setSelectedPartIds(new Set());
      })
      .finally(() => {
        setLoadingParts(false);
      });

    showToast(`Projeto "${prod.name}" carregado na calculadora!`, 'success');
  };

  const applySelectedPartsToCalculator = (
    parts: ProductFile[],
    selectedIds: Set<string>,
    prod: Product | null,
    targetTab: 'FDM' | 'RESIN' | 'LASER' | 'PINTURA'
  ) => {
    if (!prod || parts.length === 0) return;

    const selectedParts = parts.filter(p => selectedIds.has(p.id));

    if (selectedParts.length === 0) {
      if (targetTab === 'FDM') {
        setFdmWeightG(0);
        setFdmHours(0);
      } else if (targetTab === 'RESIN') {
        setResinVolumeMl(0);
        setResinHours(0);
      }
      return;
    }

    // Se todas as peças estão selecionadas e o produto possui valores padrão:
    if (selectedParts.length === parts.length) {
      const hasExplicitWeights = parts.some(p => (Number(p.weight_g) || 0) > 0);
      const hasExplicitHours = parts.some(p => (Number(p.print_time_hours) || 0) > 0);

      const weight = hasExplicitWeights
        ? selectedParts.reduce((acc, p) => acc + (Number(p.weight_g) || 0) * (Number(p.quantity) || 1), 0)
        : (Number(prod.weight_g) || 100);

      const hours = hasExplicitHours
        ? Number(selectedParts.reduce((acc, p) => acc + (Number(p.print_time_hours) || 0) * (Number(p.quantity) || 1), 0).toFixed(1))
        : (Number(prod.production_time_hours) || 4);

      if (targetTab === 'FDM') {
        setFdmWeightG(weight);
        setFdmHours(Math.max(0.1, hours));
      } else if (targetTab === 'RESIN') {
        setResinVolumeMl(weight);
        setResinHours(Math.max(0.1, hours));
      }
      return;
    }

    // Seleção parcial de sub-peças:
    const hasExplicitWeights = parts.some(p => (Number(p.weight_g) || 0) > 0);
    const hasExplicitHours = parts.some(p => (Number(p.print_time_hours) || 0) > 0);

    let calculatedWeight = 0;
    let calculatedHours = 0;

    if (hasExplicitWeights) {
      calculatedWeight = selectedParts.reduce((acc, p) => acc + (Number(p.weight_g) || 0) * (Number(p.quantity) || 1), 0);
    } else {
      const totalPieces = parts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      const selectedPieces = selectedParts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      const ratio = totalPieces > 0 ? selectedPieces / totalPieces : 1;
      calculatedWeight = Math.round((Number(prod.weight_g) || 100) * ratio);
    }

    if (hasExplicitHours) {
      calculatedHours = Number(selectedParts.reduce((acc, p) => acc + (Number(p.print_time_hours) || 0) * (Number(p.quantity) || 1), 0).toFixed(1));
    } else {
      const totalPieces = parts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      const selectedPieces = selectedParts.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);
      const ratio = totalPieces > 0 ? selectedPieces / totalPieces : 1;
      calculatedHours = Number(((Number(prod.production_time_hours) || 4) * ratio).toFixed(1));
    }

    if (targetTab === 'FDM') {
      setFdmWeightG(calculatedWeight);
      setFdmHours(Math.max(0.1, calculatedHours));
    } else if (targetTab === 'RESIN') {
      setResinVolumeMl(calculatedWeight);
      setResinHours(Math.max(0.1, calculatedHours));
    }
  };

  const handleTogglePart = (partId: string) => {
    setSelectedPartIds(prev => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      applySelectedPartsToCalculator(projectParts, next, selectedProduct, activeTab);
      return next;
    });
  };

  const handleSelectAllParts = () => {
    const next = new Set(projectParts.map(p => p.id));
    setSelectedPartIds(next);
    applySelectedPartsToCalculator(projectParts, next, selectedProduct, activeTab);
  };

  const handleDeselectAllParts = () => {
    const next = new Set<string>();
    setSelectedPartIds(next);
    applySelectedPartsToCalculator(projectParts, next, selectedProduct, activeTab);
  };

  const handleSelectProduct = (productId: string) => {
    if (!productId) {
      handleClearProject();
      return;
    }
    const found = products.find(p => p.id === productId);
    if (found) {
      loadProductIntoCalculator(found);
    }
  };

  const handleClearProject = () => {
    setSelectedProduct(null);
    setProjectParts([]);
    setSelectedPartIds(new Set());
    setSaveAsForm({
      name: 'Novo Projeto',
      sku: '',
      category: 'Geral',
    });
    if (onClearInitialProduct) {
      onClearInitialProduct();
    }
    showToast('Projeto desvinculado. Modo cálculo avulso ativo.', 'success');
  };

  const handleSaveProjectChanges = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const currentResult =
        activeTab === 'FDM'
          ? fdmResult
          : activeTab === 'RESIN'
          ? resinResult
          : activeTab === 'LASER'
          ? laserResult
          : paintResult;

      let updatedParams: any = {};
      let timeHours = 0;
      let weightOrQty = 0;
      let materialId: string | null = null;
      let equipmentId: string | null = null;
      let margin = 60;

      if (activeTab === 'FDM') {
        timeHours = fdmHours;
        weightOrQty = fdmWeightG;
        materialId = fdmMaterialId || null;
        equipmentId = fdmEquipId || null;
        margin = fdmMargin;
        updatedParams = {
          materialId: fdmMaterialId,
          equipmentId: fdmEquipId,
          weightG: fdmWeightG,
          printHours: fdmHours,
          cadHours: fdmCadHours,
          failureRatePercent: fdmFailureRate,
          profitMarginPercent: fdmMargin,
        };
      } else if (activeTab === 'RESIN') {
        timeHours = resinHours;
        weightOrQty = resinVolumeMl;
        materialId = resinMaterialId || null;
        equipmentId = resinEquipId || null;
        margin = resinMargin;
        updatedParams = {
          materialId: resinMaterialId,
          equipmentId: resinEquipId,
          volumeMl: resinVolumeMl,
          printHours: resinHours,
          cadHours: resinCadHours,
          failureRatePercent: resinFailureRate,
          profitMarginPercent: resinMargin,
        };
      } else if (activeTab === 'LASER') {
        timeHours = Number((laserMinutes / 60).toFixed(2));
        weightOrQty = laserSheets;
        materialId = laserMaterialId || null;
        margin = laserMargin;
        updatedParams = {
          materialId: laserMaterialId,
          sheetsCount: laserSheets,
          laserMinutes: laserMinutes,
          finishingCost: laserFinishingCost,
          laborHours: laserLaborHours,
          profitMarginPercent: laserMargin,
        };
      } else if (activeTab === 'PINTURA') {
        timeHours = paintPaintHours;
        margin = paintMargin;
        updatedParams = {
          partSize: paintSize,
          prepHours: paintPrepHours,
          paintHours: paintPaintHours,
          varnishType: paintVarnish,
          profitMarginPercent: paintMargin,
        };
      }

      const payload = {
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        category: selectedProduct.category,
        process_type: activeTab,
        description: selectedProduct.description,
        material_id: materialId,
        equipment_id: equipmentId,
        production_time_hours: timeHours,
        weight_g: weightOrQty,
        unit_cost: currentResult?.totalCost ?? selectedProduct.unit_cost,
        unit_price: currentResult?.suggestedPrice ?? selectedProduct.unit_price,
        margin_percent: margin,
        image_url: selectedProduct.image_url,
        calc_params_json: updatedParams,
      };

      const updated = await api.updateProduct(selectedProduct.id, payload);
      setSelectedProduct(updated);
      setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      showToast(`Projeto "${updated.name}" atualizado com sucesso no catálogo!`, 'success');
    } catch (err: any) {
      console.error('Erro ao atualizar projeto:', err);
      showToast(`Erro ao atualizar: ${err.message || 'Falha na requisição'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNewProduct = async () => {
    if (!saveAsForm.name.trim()) {
      showToast('Informe o nome do projeto para cadastrar.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const currentResult =
        activeTab === 'FDM'
          ? fdmResult
          : activeTab === 'RESIN'
          ? resinResult
          : activeTab === 'LASER'
          ? laserResult
          : paintResult;

      let updatedParams: any = {};
      let timeHours = 0;
      let weightOrQty = 0;
      let materialId: string | null = null;
      let equipmentId: string | null = null;
      let margin = 60;

      if (activeTab === 'FDM') {
        timeHours = fdmHours;
        weightOrQty = fdmWeightG;
        materialId = fdmMaterialId || null;
        equipmentId = fdmEquipId || null;
        margin = fdmMargin;
        updatedParams = {
          materialId: fdmMaterialId,
          equipmentId: fdmEquipId,
          weightG: fdmWeightG,
          printHours: fdmHours,
          cadHours: fdmCadHours,
          failureRatePercent: fdmFailureRate,
          profitMarginPercent: fdmMargin,
        };
      } else if (activeTab === 'RESIN') {
        timeHours = resinHours;
        weightOrQty = resinVolumeMl;
        materialId = resinMaterialId || null;
        equipmentId = resinEquipId || null;
        margin = resinMargin;
        updatedParams = {
          materialId: resinMaterialId,
          equipmentId: resinEquipId,
          volumeMl: resinVolumeMl,
          printHours: resinHours,
          cadHours: resinCadHours,
          failureRatePercent: resinFailureRate,
          profitMarginPercent: resinMargin,
        };
      } else if (activeTab === 'LASER') {
        timeHours = Number((laserMinutes / 60).toFixed(2));
        weightOrQty = laserSheets;
        materialId = laserMaterialId || null;
        margin = laserMargin;
        updatedParams = {
          materialId: laserMaterialId,
          sheetsCount: laserSheets,
          laserMinutes: laserMinutes,
          finishingCost: laserFinishingCost,
          laborHours: laserLaborHours,
          profitMarginPercent: laserMargin,
        };
      } else if (activeTab === 'PINTURA') {
        timeHours = paintPaintHours;
        margin = paintMargin;
        updatedParams = {
          partSize: paintSize,
          prepHours: paintPrepHours,
          paintHours: paintPaintHours,
          varnishType: paintVarnish,
          profitMarginPercent: paintMargin,
        };
      }

      const payload = {
        name: saveAsForm.name.trim(),
        sku: saveAsForm.sku.trim() || undefined,
        category: saveAsForm.category || 'Geral',
        process_type: activeTab,
        description: selectedProduct?.description || `Projeto calculado em ${activeTab}`,
        material_id: materialId,
        equipment_id: equipmentId,
        production_time_hours: timeHours,
        weight_g: weightOrQty,
        unit_cost: currentResult?.totalCost ?? 0,
        unit_price: currentResult?.suggestedPrice ?? 0,
        margin_percent: margin,
        image_url: selectedProduct?.image_url || null,
        calc_params_json: updatedParams,
      };

      const created = await api.createProduct(payload);
      setProducts(prev => [created, ...prev]);
      setSelectedProduct(created);
      setIsSaveAsModalOpen(false);
      showToast(`Novo projeto "${created.name}" cadastrado com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Erro ao cadastrar novo projeto:', err);
      showToast(`Erro ao salvar: ${err.message || 'Falha na requisição'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Re-calculate FDM
  useEffect(() => {
    const calc = async () => {
      try {
        const res = await api.calculateFdm({
          materialId: fdmMaterialId,
          weightG: fdmWeightG,
          printHours: fdmHours,
          equipmentId: fdmEquipId,
          cadHours: fdmCadHours,
          failureRatePercent: fdmFailureRate,
          profitMarginPercent: fdmMargin,
        });
        setFdmResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    calc();
  }, [fdmMaterialId, fdmWeightG, fdmHours, fdmEquipId, fdmCadHours, fdmFailureRate, fdmMargin]);

  // Re-calculate Resin
  useEffect(() => {
    const calc = async () => {
      try {
        const res = await api.calculateResin({
          materialId: resinMaterialId,
          volumeMl: resinVolumeMl,
          printHours: resinHours,
          equipmentId: resinEquipId,
          cadHours: resinCadHours,
          failureRatePercent: resinFailureRate,
          profitMarginPercent: resinMargin,
        });
        setResinResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    calc();
  }, [resinMaterialId, resinVolumeMl, resinHours, resinEquipId, resinCadHours, resinFailureRate, resinMargin]);

  // Re-calculate Laser
  useEffect(() => {
    const calc = async () => {
      try {
        const res = await api.calculateLaser({
          materialId: laserMaterialId,
          sheetsCount: laserSheets,
          laserHours: Number((laserMinutes / 60).toFixed(2)),
          finishingCost: laserFinishingCost,
          laborHours: laserLaborHours,
          profitMarginPercent: laserMargin,
        });
        setLaserResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    calc();
  }, [laserMaterialId, laserSheets, laserMinutes, laserFinishingCost, laserLaborHours, laserMargin]);

  // Re-calculate Painting
  useEffect(() => {
    const calc = async () => {
      try {
        const res = await api.calculatePainting({
          partSize: paintSize,
          prepHours: paintPrepHours,
          paintHours: paintPaintHours,
          varnishType: paintVarnish,
          profitMarginPercent: paintMargin,
        });
        setPaintResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    calc();
  }, [paintSize, paintPrepHours, paintPaintHours, paintVarnish, paintMargin]);

  // Handler to export to Order Modal
  const handleConvertToOrder = () => {
    let item: any = null;

    const selectedPartsList = projectParts.filter(p => selectedPartIds.has(p.id));
    const isPartialAssembly = projectParts.length > 0 && selectedPartsList.length < projectParts.length;
    const partsSummaryText = projectParts.length > 0
      ? isPartialAssembly
        ? ` [${selectedPartsList.length}/${projectParts.length} sub-peças: ${selectedPartsList.map(p => `${p.name} (${p.quantity}x)`).join(', ')}]`
        : ` [Projeto Completo: ${projectParts.length} sub-peças]`
      : '';

    if (activeTab === 'FDM' && fdmResult) {
      const mat = materials.fdm.find((m: any) => m.id === fdmMaterialId);
      const title = selectedProduct ? selectedProduct.name : `Impressão FDM: ${mat?.name || 'Filamento'}`;
      item = {
        process_type: 'FDM',
        description: `${title}${partsSummaryText} (${fdmWeightG}g, ${fdmHours}h)`,
        quantity: 1,
        material_id: fdmMaterialId,
        equipment_id: fdmEquipId,
        unit_cost: fdmResult.totalCost,
        unit_price: fdmResult.suggestedPrice,
        product_id: selectedProduct?.id || null,
        calc_params: {
          weight_g: fdmWeightG,
          hours: fdmHours,
          selected_parts: selectedPartsList,
          is_partial: isPartialAssembly,
          ...fdmResult,
        },
      };
    } else if (activeTab === 'RESIN' && resinResult) {
      const mat = materials.resin.find((m: any) => m.id === resinMaterialId);
      const title = selectedProduct ? selectedProduct.name : `Impressão Resina: ${mat?.name || 'Resina'}`;
      item = {
        process_type: 'RESIN',
        description: `${title}${partsSummaryText} (${resinVolumeMl}ml, ${resinHours}h)`,
        quantity: 1,
        material_id: resinMaterialId,
        equipment_id: resinEquipId,
        unit_cost: resinResult.totalCost,
        unit_price: resinResult.suggestedPrice,
        product_id: selectedProduct?.id || null,
        calc_params: {
          volume_ml: resinVolumeMl,
          hours: resinHours,
          selected_parts: selectedPartsList,
          is_partial: isPartialAssembly,
          ...resinResult,
        },
      };
    } else if (activeTab === 'LASER' && laserResult) {
      const mat = materials.laser.find((m: any) => m.id === laserMaterialId);
      const title = selectedProduct ? selectedProduct.name : `Corte/Impressão Laser: ${mat?.name || 'Papel'}`;
      item = {
        process_type: 'LASER',
        description: `${title}${partsSummaryText} (${laserSheets} folhas)`,
        quantity: 1,
        material_id: laserMaterialId,
        unit_cost: laserResult.totalCost,
        unit_price: laserResult.suggestedPrice,
        product_id: selectedProduct?.id || null,
        calc_params: {
          sheets: laserSheets,
          selected_parts: selectedPartsList,
          is_partial: isPartialAssembly,
          ...laserResult,
        },
      };
    } else if (activeTab === 'PINTURA' && paintResult) {
      const title = selectedProduct ? selectedProduct.name : `Pós-Processamento e Pintura Porte ${paintSize}`;
      item = {
        process_type: 'PINTURA',
        description: `${title}${partsSummaryText} (Prep: ${paintPrepHours}h, Pintura: ${paintPaintHours}h, Verniz ${paintVarnish})`,
        quantity: 1,
        material_id: null,
        unit_cost: paintResult.totalCost,
        unit_price: paintResult.suggestedPrice,
        product_id: selectedProduct?.id || null,
        calc_params: {
          selected_parts: selectedPartsList,
          is_partial: isPartialAssembly,
          ...paintResult,
        },
      };
    }

    if (item) {
      onGenerateOrder(item);
    }
  };

  const currentResult =
    activeTab === 'FDM'
      ? fdmResult
      : activeTab === 'RESIN'
      ? resinResult
      : activeTab === 'LASER'
      ? laserResult
      : paintResult;

  return (
    <div className="page-container">
      {/* 1. Header Principal */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Calculadora de Custos & Precificação Maker
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          Simulação com custos reais de matéria-prima, consumo energético em kWh, depreciação de máquinas e margem de lucro
        </p>
      </div>

      {/* 2. Barra de Seleção & Vínculo de Projeto Cadastrado */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          zIndex: 40,
          padding: '14px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
          <div style={{ background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)', padding: 8, borderRadius: 10 }}>
            <FolderOpen size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Carregar Projeto Cadastrado
              </span>
              {selectedProduct ? (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 8px',
                    borderRadius: 4,
                    background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)',
                    color: 'var(--brand-primary)',
                    fontWeight: 700,
                  }}
                >
                  PROJETO ATIVO
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '1px 8px',
                    borderRadius: 4,
                    background: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  CÁLCULO AVULSO
                </span>
              )}
            </div>
            <CustomSelect
              value={selectedProduct?.id || ''}
              onChange={val => handleSelectProduct(val)}
              placeholder="-- Selecionar Projeto Cadastrado (ou Criar do Zero) --"
              options={[
                { value: '', label: '-- Selecionar Projeto Cadastrado (ou Criar do Zero) --' },
                ...products.map(p => {
                  const meta = (PROCESS_MAP as any)[p.process_type] || { label: p.process_type, icon: '📦' };
                  return {
                    value: p.id,
                    label: `${p.name} ${p.sku ? `(${p.sku})` : ''}`,
                    badge: p.process_type,
                    icon: meta.icon,
                    subtitle: `Tabela: ${formatCurrency(p.unit_price)} • Custo: ${formatCurrency(p.unit_cost)}`,
                  };
                }),
              ]}
              ariaLabel="Selecionar Projeto Cadastrado"
              style={{ width: '100%', marginTop: 4 }}
              menuStyle={{ width: '100%', maxWidth: '100%' }}
            />
          </div>
        </div>

        {/* Botões de Ação do Projeto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {selectedProduct ? (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearProject}
                title="Desvincular projeto e manter os parâmetros para cálculo livre"
                style={{ fontSize: '0.8rem', padding: '7px 12px' }}
              >
                <X size={14} />
                <span>Desvincular</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsSaveAsModalOpen(true)}
                style={{ fontSize: '0.8rem', padding: '7px 12px' }}
                title="Salvar como cópia / novo projeto"
              >
                <Copy size={14} />
                <span>Salvar como Cópia</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveProjectChanges}
                disabled={isSaving}
                style={{ fontSize: '0.8rem', padding: '7px 16px', fontWeight: 700 }}
              >
                <Save size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar no Projeto'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsSaveAsModalOpen(true)}
              style={{ fontSize: '0.82rem', padding: '7px 14px' }}
            >
              <Save size={15} color="var(--brand-primary)" />
              <span>Salvar no Catálogo</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Banner Informativo do Projeto Selecionado */}
      {selectedProduct && (
        <div
          style={{
            background: 'color-mix(in srgb, var(--brand-primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--brand-primary) 24%, transparent)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: projectParts.length > 0 ? 14 : 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--brand-primary)" />
            <span>
              Editando parâmetros de: <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct.name}</strong>
              {selectedProduct.sku && (
                <> • SKU: <code className="mono" style={{ color: 'var(--brand-primary)' }}>{selectedProduct.sku}</code></>
              )}
              {selectedProduct.category && (
                <> • Categoria: <strong>{selectedProduct.category}</strong></>
              )}
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Preço cadastrado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(selectedProduct.unit_price)}</strong> ({selectedProduct.margin_percent}% margem)
          </div>
        </div>
      )}

      {/* 3.1. Painel Interativo de Sub-peças do Projeto */}
      {selectedProduct && projectParts.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: 24,
            border: selectedPartIds.size < projectParts.length
              ? '1px solid rgba(245, 158, 11, 0.45)'
              : '1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)',
            background: selectedPartIds.size < projectParts.length
              ? 'color-mix(in srgb, #f59e0b 5%, var(--bg-surface))'
              : 'var(--bg-surface-elevated, var(--bg-surface))',
            borderRadius: 'var(--radius-lg, 14px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header da Barra de Sub-peças */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  background: selectedPartIds.size < projectParts.length
                    ? 'rgba(245, 158, 11, 0.18)'
                    : 'color-mix(in srgb, var(--brand-primary) 18%, transparent)',
                  color: selectedPartIds.size < projectParts.length ? '#f59e0b' : 'var(--brand-primary)',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Sub-peças do Projeto ({selectedPartIds.size} de {projectParts.length} selecionadas)
                  </h4>
                  {selectedPartIds.size === projectParts.length ? (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      MONTAGEM COMPLETA
                    </span>
                  ) : selectedPartIds.size > 0 ? (
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      PRODUÇÃO PARCIAL
                    </span>
                  ) : (
                    <span
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      NENHUMA PEÇA MARCADA
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Marque ou desmarque as partes que compõem este modelo. O peso, tempo e custos são recalculados automaticamente na simulação.
                </div>
              </div>
            </div>

            {/* Ações de Seleção Rápida */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSelectAllParts}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                title="Marcar todas as sub-peças"
              >
                <CheckSquare size={14} color="var(--brand-primary)" />
                <span>Selecionar Todas</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDeselectAllParts}
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                title="Desmarcar todas as sub-peças"
              >
                <Square size={14} color="var(--text-muted)" />
                <span>Desmarcar Todas</span>
              </button>
            </div>
          </div>

          {/* Grid de Sub-peças com Cards Clicáveis */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
            }}
          >
            {projectParts.map(part => {
              const isSelected = selectedPartIds.has(part.id);
              return (
                <div
                  key={part.id}
                  onClick={() => handleTogglePart(part.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    userSelect: 'none',
                    border: isSelected
                      ? '1px solid var(--brand-primary)'
                      : '1px dashed var(--border-subtle)',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--brand-primary) 10%, var(--bg-surface))'
                      : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.18s ease',
                    opacity: isSelected ? 1 : 0.6,
                    transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: isSelected ? '0 2px 8px var(--brand-primary-glow)' : 'none',
                  }}
                >
                  {/* Checkbox visual interativo */}
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: isSelected ? '2px solid var(--brand-primary)' : '2px solid var(--text-muted)',
                      background: isSelected ? 'var(--brand-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>

                  {/* Foto individual ou ícone da sub-peça */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {part.image_url ? (
                      <img
                        src={part.image_url}
                        alt={part.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <FileCode size={20} color={isSelected ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                    )}
                  </div>

                  {/* Dados e Badges da sub-peça */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                      title={part.name}
                    >
                      {part.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 4,
                          padding: '1px 5px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                        }}
                      >
                        {part.quantity || 1}x
                      </span>

                      <span
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-muted)',
                          borderRadius: 4,
                          padding: '1px 5px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                        }}
                      >
                        {part.file_type || '3D'}
                      </span>

                      {part.weight_g ? (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#10b981',
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                          title={`Peso unitário: ${part.weight_g}g`}
                        >
                          ⚖️ {part.weight_g}g
                        </span>
                      ) : null}

                      {part.print_time_hours ? (
                        <span
                          style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#f59e0b',
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                          title={`Tempo estimado: ${part.print_time_hours}h`}
                        >
                          ⏱️ {part.print_time_hours}h
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé informativo de cálculo do sub-conjunto */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: '1px dashed var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: '0.78rem',
            }}
          >
            <div style={{ color: selectedPartIds.size < projectParts.length ? '#f59e0b' : 'var(--text-secondary)' }}>
              {selectedPartIds.size < projectParts.length ? (
                <span>⚠️ <strong>Projeto parcial ativo:</strong> Custos, consumo de filamento/resina e tempo de máquina recalculados exclusivamente para as {selectedPartIds.size} sub-peças ativas.</span>
              ) : (
                <span>✅ <strong>Montagem completa:</strong> Todas as {projectParts.length} sub-peças do modelo estão incluídas no cálculo de custos e precificação.</span>
              )}
            </div>

            <div className="mono" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
              {activeTab === 'FDM' ? `Consumo: ${fdmWeightG}g • Tempo: ${fdmHours}h` : activeTab === 'RESIN' ? `Volume: ${resinVolumeMl}ml • Tempo: ${resinHours}h` : ''}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tabs de Tecnologia */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'FDM', label: 'Impressão 3D FDM', icon: Printer, color: 'var(--brand-primary)' },
          { id: 'RESIN', label: 'Impressão 3D Resina', icon: TestTube, color: 'var(--brand-purple, #8b5cf6)' },
          { id: 'LASER', label: 'Laser & Papelaria', icon: Zap, color: '#f59e0b' },
          { id: 'PINTURA', label: 'Pós-Processamento & Pintura', icon: Paintbrush, color: '#f43f5e' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                border: isActive ? `2px solid ${tab.color}` : '1px solid var(--border-subtle)',
                background: isActive ? 'var(--bg-surface-elevated)' : 'var(--bg-card)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? `0 4px 16px -2px color-mix(in srgb, ${tab.color} 25%, transparent)` : 'none',
              }}
            >
              <Icon size={18} color={isActive ? tab.color : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Grid Principal: Formulário na Esquerda, Orçamento na Direita */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, alignItems: 'start' }}>
        {/* COLUNA ESQUERDA: PARÂMETROS */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div key={activeTab} className="tab-pane-animated">
          {activeTab === 'FDM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Printer size={20} color="var(--brand-primary)" />
                Parâmetros FDM (Filamento)
              </h3>

              <div className="form-group">
                <label className="form-label">Filamento / Carretel</label>
                <select
                  className="form-control"
                  value={fdmMaterialId}
                  onChange={e => setFdmMaterialId(e.target.value)}
                >
                  {materials.fdm.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} - {m.name} ({formatCurrency(m.spool_price)} / {m.spool_weight_g}g)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Peso da Peça + Suportes (g)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control mono"
                    value={fdmWeightG}
                    onChange={e => setFdmWeightG(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tempo de Impressão (Horas)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control mono"
                    value={fdmHours}
                    onChange={e => setFdmHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Impressora / Equipamento</label>
                <select
                  className="form-control"
                  value={fdmEquipId}
                  onChange={e => setFdmEquipId(e.target.value)}
                >
                  {equipments.filter(e => e.type === 'FDM').map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.power_watts}W, Deprec. {formatCurrency(eq.hourly_depreciation)}/h)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Horas Fatiamento / CAD (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mono"
                    value={fdmCadHours}
                    onChange={e => setFdmCadHours(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Margem de Falha / Risco (%)</label>
                  <input
                    type="number"
                    className="form-control mono"
                    value={fdmFailureRate}
                    onChange={e => setFdmFailureRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <ProfitMarginControl
                marginPercent={fdmMargin}
                onChangeMargin={setFdmMargin}
                totalCost={fdmResult?.totalCost || 0}
                accentColor="var(--brand-primary)"
                tabLabel="FDM"
              />
            </div>
          )}

          {activeTab === 'RESIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <TestTube size={20} color="var(--brand-purple, #8b5cf6)" />
                Parâmetros Resina (SLA / DLP)
              </h3>

              <div className="form-group">
                <label className="form-label">Garrafa de Resina</label>
                <select
                  className="form-control"
                  value={resinMaterialId}
                  onChange={e => setResinMaterialId(e.target.value)}
                >
                  {materials.resin.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.brand} - {m.name} ({formatCurrency(m.bottle_price)} / {m.bottle_volume_ml}ml)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Volume Total (ml)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control mono"
                    value={resinVolumeMl}
                    onChange={e => setResinVolumeMl(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tempo de Exposição (Horas)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="form-control mono"
                    value={resinHours}
                    onChange={e => setResinHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Impressora de Resina</label>
                <select
                  className="form-control"
                  value={resinEquipId}
                  onChange={e => setResinEquipId(e.target.value)}
                >
                  {equipments.filter(e => e.type === 'RESIN').map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.power_watts}W)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Horas Fatiamento / CAD (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mono"
                    value={resinCadHours}
                    onChange={e => setResinCadHours(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Margem de Falha / Risco (%)</label>
                  <input
                    type="number"
                    className="form-control mono"
                    value={resinFailureRate}
                    onChange={e => setResinFailureRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <ProfitMarginControl
                marginPercent={resinMargin}
                onChangeMargin={setResinMargin}
                totalCost={resinResult?.totalCost || 0}
                accentColor="var(--brand-purple, #8b5cf6)"
                tabLabel="Resina"
              />
            </div>
          )}

          {activeTab === 'LASER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Zap size={20} color="#f59e0b" />
                Parâmetros Impressão Laser & Gráfica
              </h3>

              <div className="form-group">
                <label className="form-label">Tipo de Papel / Mídia</label>
                <select
                  className="form-control"
                  value={laserMaterialId}
                  onChange={e => setLaserMaterialId(e.target.value)}
                >
                  {materials.laser.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(m.sheet_price)} / folha)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Quantidade de Folhas</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control mono"
                    value={laserSheets}
                    onChange={e => setLaserSheets(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tempo de Laser / Corte (Minutos)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control mono"
                    value={laserMinutes}
                    onChange={e => setLaserMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Custos de Acabamento (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control mono"
                    value={laserFinishingCost}
                    onChange={e => setLaserFinishingCost(Number(e.target.value))}
                    placeholder="Laminação, vinco, corte especial"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horas Operador (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mono"
                    value={laserLaborHours}
                    onChange={e => setLaserLaborHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <ProfitMarginControl
                marginPercent={laserMargin}
                onChangeMargin={setLaserMargin}
                totalCost={laserResult?.totalCost || 0}
                accentColor="#f59e0b"
                tabLabel="Laser"
              />
            </div>
          )}

          {activeTab === 'PINTURA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                <Paintbrush size={20} color="#f43f5e" />
                Parâmetros Pós-Processamento & Pintura
              </h3>

              <div className="form-group">
                <label className="form-label">Porte / Complexidade da Peça</label>
                <select
                  className="form-control"
                  value={paintSize}
                  onChange={e => setPaintSize(e.target.value as any)}
                >
                  <option value="P">Pequeno (Miniaturas até 8cm - ex: RPG, D&D)</option>
                  <option value="M">Médio (Estátuas 15-20cm)</option>
                  <option value="G">Grande (Peças 25-35cm)</option>
                  <option value="GG">Extra Grande / Cosplay (Capacetes, Armaduras)</option>
                  <option value="COMPLEXA">Complexa (Camuflagem, Múltiplas Cores, Weathering)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Horas Preparação & Lixamento (h)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control mono"
                    value={paintPrepHours}
                    onChange={e => setPaintPrepHours(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horas Pintura & Aerografia (h)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control mono"
                    value={paintPaintHours}
                    onChange={e => setPaintPaintHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Verniz Protetor</label>
                <select
                  className="form-control"
                  value={paintVarnish}
                  onChange={e => setPaintVarnish(e.target.value)}
                >
                  <option value="FOSCO">Verniz Bi-componente Fosco Acetinado (Anime/Colecionáveis)</option>
                  <option value="BRILHANTE">Verniz Bi-componente Ultra Brilho (Efeito Automotivo/Candy)</option>
                  <option value="ACETINADO">Verniz Acetinado Semibrilho</option>
                </select>
              </div>

              <ProfitMarginControl
                marginPercent={paintMargin}
                onChangeMargin={setPaintMargin}
                totalCost={paintResult?.totalCost || 0}
                accentColor="#f43f5e"
                tabLabel="Pintura"
              />
            </div>
          )}
          </div>
        </div>

        {/* COLUNA DIREITA: DETALHAMENTO DO ORÇAMENTO */}
        <div className="glass-panel" style={{ padding: 24, position: 'sticky', top: 90 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Detalhamento do Orçamento</h3>
            <span
              style={{
                background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
                color: 'var(--brand-primary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              CÁLCULO EM TEMPO REAL
            </span>
          </div>

          {(() => {
            if (!currentResult) {
              return <p style={{ color: 'var(--text-muted)' }}>Calculando valores...</p>;
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Highlight Big Price Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 12%, transparent) 0%, rgba(6, 182, 212, 0.08) 100%)',
                    border: '1px solid color-mix(in srgb, var(--brand-primary) 35%, transparent)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                    Preço de Venda Sugerido
                  </div>
                  <div className="mono" style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--brand-primary)', margin: '4px 0' }}>
                    {formatCurrency(currentResult.suggestedPrice)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>Lucro Bruto:</span>
                    <strong style={{ color: 'var(--brand-primary)' }}>+{formatCurrency(currentResult.marginAmount)}</strong>
                    <span>({currentResult.marginPercent}%)</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, borderTop: '1px dashed color-mix(in srgb, var(--brand-primary) 20%, transparent)', paddingTop: 6 }}>
                    Custo {formatCurrency(currentResult.totalCost)} + Ganho {formatCurrency(currentResult.marginAmount)}
                  </div>
                </div>

                {/* Detailed Line Items */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: '0.86rem',
                  }}
                >
                  {currentResult.rawMaterialCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Matéria-Prima Direta:</span>
                      <strong className="mono">{formatCurrency(currentResult.rawMaterialCost)}</strong>
                    </div>
                  )}

                  {currentResult.washCureCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Lavagem/Cura (Álcool + FEP):</span>
                      <strong className="mono">{formatCurrency(currentResult.washCureCost)}</strong>
                    </div>
                  )}

                  {currentResult.paperCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mídia / Folhas:</span>
                      <strong className="mono">{formatCurrency(currentResult.paperCost)}</strong>
                    </div>
                  )}

                  {currentResult.energyCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Energia Elétrica (kWh):</span>
                      <strong className="mono">{formatCurrency(currentResult.energyCost)}</strong>
                    </div>
                  )}

                  {currentResult.machineDepreciation !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Depreciação de Máquina:</span>
                      <strong className="mono">{formatCurrency(currentResult.machineDepreciation)}</strong>
                    </div>
                  )}

                  {currentResult.cadCost !== undefined && currentResult.cadCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mão de Obra CAD / Fatiamento:</span>
                      <strong className="mono">{formatCurrency(currentResult.cadCost)}</strong>
                    </div>
                  )}

                  {currentResult.prepCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Lixamento & Preparação:</span>
                      <strong className="mono">{formatCurrency(currentResult.prepCost)}</strong>
                    </div>
                  )}

                  {currentResult.paintCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Pintura & Aerografia:</span>
                      <strong className="mono">{formatCurrency(currentResult.paintCost)}</strong>
                    </div>
                  )}

                  {currentResult.consumablesCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Insumos (Primer, Tintas, Verniz):</span>
                      <strong className="mono">{formatCurrency(currentResult.consumablesCost)}</strong>
                    </div>
                  )}

                  {currentResult.failureBuffer !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Reserva de Risco / Falhas:</span>
                      <strong className="mono">{formatCurrency(currentResult.failureBuffer)}</strong>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>CUSTO TOTAL DE PRODUÇÃO:</span>
                    <span className="mono">{formatCurrency(currentResult.totalCost)}</span>
                  </div>
                </div>

                {/* Ações de Salvar no Projeto */}
                {selectedProduct ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSaveProjectChanges}
                      disabled={isSaving}
                      style={{ flex: 1, padding: '11px', fontSize: '0.84rem' }}
                    >
                      <Save size={16} color="var(--brand-primary)" />
                      <span>{isSaving ? 'Salvando...' : 'Salvar no Projeto'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsSaveAsModalOpen(true)}
                      title="Salvar como cópia / novo projeto"
                      style={{ padding: '11px 14px' }}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsSaveAsModalOpen(true)}
                    style={{ width: '100%', padding: '11px', fontSize: '0.84rem' }}
                  >
                    <Save size={16} color="var(--brand-primary)" />
                    <span>Salvar como Novo Projeto no Catálogo</span>
                  </button>
                )}

                {/* Convert to Order Action */}
                <button
                  className="btn btn-primary"
                  onClick={handleConvertToOrder}
                  style={{ width: '100%', padding: '12px' }}
                >
                  <PlusCircle size={18} />
                  <span>Transformar em Ordem de Serviço</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 6. Modal: Salvar como Novo Projeto / Cópia no Catálogo */}
      {isSaveAsModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 24,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)', padding: 8, borderRadius: 10 }}>
                  <FolderOpen size={20} color="var(--brand-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Salvar no Catálogo</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Cadastre esta precificação como um projeto reutilizável
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveAsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nome do Projeto / Peça *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Luminária Lua 15cm"
                  value={saveAsForm.name}
                  onChange={e => setSaveAsForm(prev => ({ ...prev, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">SKU / Código (Opcional)</label>
                  <input
                    type="text"
                    className="form-control mono"
                    placeholder="Ex: PRD-NOVO"
                    value={saveAsForm.sku}
                    onChange={e => setSaveAsForm(prev => ({ ...prev, sku: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-control"
                    value={saveAsForm.category}
                    onChange={e => setSaveAsForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Colecionáveis & Miniaturas">Colecionáveis & Miniaturas</option>
                    <option value="Decoração & Iluminação">Decoração & Iluminação</option>
                    <option value="Utilidades & Gadgets">Utilidades & Gadgets</option>
                    <option value="Papelaria & Brindes">Papelaria & Brindes</option>
                    <option value="Engenharia & Prototipagem">Engenharia & Prototipagem</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-secondary)' }}>Processo: <strong>{activeTab}</strong></div>
                  <div style={{ color: 'var(--text-secondary)' }}>Custo: <strong>{formatCurrency(currentResult?.totalCost || 0)}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Preço Calculado:</div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {formatCurrency(currentResult?.suggestedPrice || 0)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSaveAsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAsNewProduct}
                  disabled={isSaving || !saveAsForm.name.trim()}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar no Catálogo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Toast Notificação */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 10000,
            background: toast.type === 'success' ? '#065f46' : '#991b1b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8, padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
