import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Package,
  AlertTriangle,
  Plus,
  Trash2,
  TrendingDown,
  ShieldAlert,
  Check,
  X,
  Clock,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Edit3,
  DollarSign,
  Box,
  Droplet,
  FileText,
  Palette,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

// Helper to calculate subtle, high-contrast, beautiful color effects for stock items
const getMaterialVisualTheme = (rawHex?: string, isLow?: boolean) => {
  const hex = rawHex && rawHex.startsWith('#') ? rawHex : '#10b981';
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  // Perceived luminance (0-255)
  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = luma < 55;
  const isLight = luma > 195;

  // Subtle ambient glow for the top of the card
  const ambientGlow = isLow
    ? 'rgba(239, 68, 68, 0.12)'
    : isDark
      ? 'rgba(100, 116, 139, 0.1)'
      : isLight
        ? 'rgba(148, 163, 184, 0.12)'
        : `color-mix(in srgb, ${hex} 14%, transparent)`;

  // 2.5px top accent line
  const topAccent = isLow
    ? 'linear-gradient(90deg, #ef4444 0%, rgba(239, 68, 68, 0.25) 100%)'
    : isDark
      ? 'linear-gradient(90deg, #64748b 0%, rgba(100, 116, 139, 0.2) 100%)'
      : isLight
        ? 'linear-gradient(90deg, #94a3b8 0%, rgba(148, 163, 184, 0.2) 100%)'
        : `linear-gradient(90deg, ${hex} 0%, ${hex}33 100%)`;

  // Safe bar fill that is ALWAYS visible and high-contrast in light and dark themes
  const barFill = isLow
    ? '#ef4444'
    : isDark
      ? 'linear-gradient(90deg, #475569, #64748b)'
      : isLight
        ? 'linear-gradient(90deg, #64748b, #94a3b8)'
        : `linear-gradient(90deg, ${hex}dd, ${hex})`;

  // Swatch styling
  const swatchBorder = isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';
  const swatchShadow = isDark
    ? 'inset 0 1px 2px rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.35)'
    : `inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 8px color-mix(in srgb, ${hex} 40%, transparent)`;

  return {
    hex,
    isDark,
    isLight,
    ambientGlow,
    topAccent,
    barFill,
    swatchBorder,
    swatchShadow,
  };
};

export const StockPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'ADESIVOS' | 'REFUGOS'>('FDM');
  const [data, setData] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [], stickers: [], alerts: [], summary: {} });
  const [failuresData, setFailuresData] = useState<any>({ failures: [], stats: {}, topReasons: [] });
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'HEALTHY'>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [failureProcessFilter, setFailureProcessFilter] = useState<string>('ALL');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal: Register Scrap / Failure
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapProcess, setScrapProcess] = useState('FDM');
  const [scrapMaterial, setScrapMaterial] = useState('');
  const [scrapQty, setScrapQty] = useState(120);
  const [scrapHours, setScrapHours] = useState(3.5);
  const [scrapCost, setScrapCost] = useState(25);
  const [scrapReason, setScrapReason] = useState('Descolamento da mesa de impressão (Warping)');
  const [scrapEquipmentId, setScrapEquipmentId] = useState('');

  // Modal: Create / Edit Material
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialModalType, setMaterialModalType] = useState<'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'ADESIVOS'>('FDM');
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [materialForm, setMaterialForm] = useState<any>({});

  // Modal: Precise Stock Adjust
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<{ table: string; id: string; name: string; current: number; unit: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract' | 'set'>('add');

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [mats, fails, eqs] = await Promise.all([
        api.getMaterials(),
        api.getFailures(),
        api.getEquipments().catch(() => [])
      ]);
      setData(mats);
      setFailuresData(fails);
      setEquipments(eqs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick stock adjust
  const handleQuickAdjust = async (table: string, id: string, amount: number, itemName?: string) => {
    try {
      await api.adjustStock(table, id, amount);
      showToast(`${amount > 0 ? `+${amount}` : amount} no estoque de ${itemName || 'insumo'}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Precise adjust handler
  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    try {
      let delta = adjustAmount;
      if (adjustMode === 'subtract') {
        delta = -Math.abs(adjustAmount);
      } else if (adjustMode === 'set') {
        delta = adjustAmount - adjustTarget.current;
      }

      await api.adjustStock(adjustTarget.table, adjustTarget.id, delta);
      showToast(`Estoque de ${adjustTarget.name} atualizado!`);
      setIsAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Auto suggest scrap cost
  const handleAutoSuggestScrapCost = () => {
    let costPerUnit = 0.12;
    if (scrapProcess === 'FDM') {
      const found = data.fdm?.find((m: any) => m.name === scrapMaterial);
      if (found) costPerUnit = found.spool_price / (found.spool_weight_g || 1000);
      else costPerUnit = 0.13;
    } else if (scrapProcess === 'RESIN') {
      const found = data.resin?.find((m: any) => m.name === scrapMaterial);
      if (found) costPerUnit = found.bottle_price / (found.bottle_volume_ml || 1000);
      else costPerUnit = 0.22;
    }

    const matLoss = (scrapQty || 0) * costPerUnit;
    const energyPerHour = 1.25;
    const totalEst = Number((matLoss + (scrapHours || 0) * energyPerHour).toFixed(2));
    setScrapCost(totalEst > 0 ? totalEst : 15);
    showToast(`Custo estimado: ${formatCurrency(totalEst)}`);
  };

  const handleCreateScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFailure({
        process_type: scrapProcess,
        material_name: scrapMaterial || null,
        equipment_id: scrapEquipmentId || null,
        lost_qty: scrapQty,
        lost_hours: scrapHours,
        financial_loss: scrapCost,
        reason: scrapReason,
      });
      setIsScrapModalOpen(false);
      showToast('Ocorrência de refugo registrada com sucesso!');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteScrap = async (id: string) => {
    if (!window.confirm('Excluir este registro de falha?')) return;
    try {
      await api.deleteFailure(id);
      showToast('Registro de refugo excluído.');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Material Modal
  const handleOpenMaterialModal = (type: 'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'ADESIVOS', item?: any) => {
    setMaterialModalType(type);
    setEditingMaterial(item || null);

    if (item) {
      setMaterialForm({ ...item });
    } else {
      if (type === 'FDM') {
        setMaterialForm({
          name: '',
          brand: 'Bambu Lab',
          material_type: 'PLA Basic',
          color: 'Preto',
          color_hex: '#1e293b',
          spool_price: 119.90,
          spool_weight_g: 1000,
          stock_weight_g: 1000,
          min_stock_g: 250,
          temp_print: 215,
          temp_bed: 60,
        });
      } else if (type === 'RESIN') {
        setMaterialForm({
          name: '',
          brand: 'Elegoo',
          resin_type: 'Standard 8K',
          color: 'Cinza',
          color_hex: '#64748b',
          bottle_price: 169.90,
          bottle_volume_ml: 1000,
          stock_volume_ml: 1000,
          min_stock_ml: 300,
          wash_cure_cost_per_ml: 0.08,
        });
      } else if (type === 'LASER') {
        setMaterialForm({
          name: '',
          paper_type: 'Couchê Fosco',
          grammature: 300,
          sheet_price: 1.85,
          stock_sheets: 100,
          min_stock_sheets: 30,
          toner_cost_per_page: 0.35,
        });
      } else if (type === 'ADESIVOS') {
        setMaterialForm({
          name: '',
          brand: 'Imprimax',
          finish: 'BRILHO',
          unit_type: 'FOLHA_A4',
          sheet_width_mm: 210,
          sheet_height_mm: 297,
          unit_price: 2.20,
          ink_cost_per_unit: 0.50,
          lamination_cost_per_unit: 0.35,
          color_hex: '#3b82f6',
          stock_qty: 50,
          min_stock_qty: 15,
        });
      } else {
        setMaterialForm({
          name: '',
          category: 'Tinta Acrílica',
          brand: 'Acrilex',
          unit_type: 'un',
          cost_per_unit: 14.50,
          stock_qty: 5,
          min_stock_qty: 2,
        });
      }
    }
    setIsMaterialModalOpen(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (materialModalType === 'FDM') {
        if (editingMaterial) {
          await api.updateMaterialFdm(editingMaterial.id, materialForm);
          showToast('Filamento atualizado!');
        } else {
          await api.createMaterialFdm(materialForm);
          showToast('Filamento adicionado ao estoque!');
        }
      } else if (materialModalType === 'RESIN') {
        if (editingMaterial) {
          await api.updateMaterialResin(editingMaterial.id, materialForm);
          showToast('Resina atualizada!');
        } else {
          await api.createMaterialResin(materialForm);
          showToast('Resina adicionada ao estoque!');
        }
      } else if (materialModalType === 'LASER') {
        if (editingMaterial) {
          await api.updateMaterialLaser(editingMaterial.id, materialForm);
          showToast('Mídia laser atualizada!');
        } else {
          await api.createMaterialLaser(materialForm);
          showToast('Mídia adicionada ao estoque!');
        }
      } else if (materialModalType === 'ADESIVOS') {
        if (editingMaterial) {
          await api.updateMaterialSticker(editingMaterial.id, materialForm);
          showToast('Insumo de adesivo atualizado!');
        } else {
          await api.createMaterialSticker(materialForm);
          showToast('Adesivo adicionado ao estoque!');
        }
      } else {
        if (editingMaterial) {
          await api.updateMaterialFinishing(editingMaterial.id, materialForm);
          showToast('Insumo atualizado!');
        } else {
          await api.createMaterialFinishing(materialForm);
          showToast('Insumo adicionado ao estoque!');
        }
      }

      setIsMaterialModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMaterial = async (type: string, id: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir "${name}"?`)) return;
    try {
      if (type === 'FDM') await api.deleteMaterialFdm(id);
      else if (type === 'RESIN') await api.deleteMaterialResin(id);
      else if (type === 'LASER') await api.deleteMaterialLaser(id);
      else if (type === 'ADESIVOS') await api.deleteMaterialSticker(id);
      else await api.deleteMaterialFinishing(id);

      showToast(`Item "${name}" removido.`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Color palette presets
  const colorPresets = [
    { name: 'Preto', hex: '#111827' },
    { name: 'Branco', hex: '#f8fafc' },
    { name: 'Cinza', hex: '#64748b' },
    { name: 'Verde Bambu', hex: '#10b981' },
    { name: 'Azul', hex: '#3b82f6' },
    { name: 'Vermelho', hex: '#ef4444' },
    { name: 'Laranja', hex: '#f97316' },
    { name: 'Amarelo', hex: '#eab308' },
    { name: 'Roxo', hex: '#a855f7' },
  ];

  // Filtered lists
  const filteredFdm = useMemo(() => {
    return (data.fdm || []).filter((item: any) => {
      const match =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material_type.toLowerCase().includes(searchTerm.toLowerCase());
      const isCritical = item.stock_weight_g <= item.min_stock_g;
      if (statusFilter === 'CRITICAL') return match && isCritical;
      if (statusFilter === 'HEALTHY') return match && !isCritical;
      return match;
    });
  }, [data.fdm, searchTerm, statusFilter]);

  const filteredResin = useMemo(() => {
    return (data.resin || []).filter((item: any) => {
      const match =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resin_type.toLowerCase().includes(searchTerm.toLowerCase());
      const isCritical = item.stock_volume_ml <= item.min_stock_ml;
      if (statusFilter === 'CRITICAL') return match && isCritical;
      if (statusFilter === 'HEALTHY') return match && !isCritical;
      return match;
    });
  }, [data.resin, searchTerm, statusFilter]);

  const filteredLaser = useMemo(() => {
    return (data.laser || []).filter((item: any) => {
      const match =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paper_type.toLowerCase().includes(searchTerm.toLowerCase());
      const isCritical = item.stock_sheets <= item.min_stock_sheets;
      if (statusFilter === 'CRITICAL') return match && isCritical;
      if (statusFilter === 'HEALTHY') return match && !isCritical;
      return match;
    });
  }, [data.laser, searchTerm, statusFilter]);

  const filteredFinishing = useMemo(() => {
    return (data.finishing || []).filter((item: any) => {
      const match =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const isCritical = item.stock_qty <= item.min_stock_qty;
      if (statusFilter === 'CRITICAL') return match && isCritical;
      if (statusFilter === 'HEALTHY') return match && !isCritical;
      return match;
    });
  }, [data.finishing, searchTerm, statusFilter]);

  const filteredStickers = useMemo(() => {
    return (data.stickers || []).filter((item: any) => {
      const match =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.finish && item.finish.toLowerCase().includes(searchTerm.toLowerCase()));
      const isCritical = item.stock_qty <= item.min_stock_qty;
      if (statusFilter === 'CRITICAL') return match && isCritical;
      if (statusFilter === 'HEALTHY') return match && !isCritical;
      return match;
    });
  }, [data.stickers, searchTerm, statusFilter]);

  const filteredFailures = useMemo(() => {
    return (failuresData.failures || []).filter((f: any) => {
      const matchSearch =
        f.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.material_name && f.material_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchProc = failureProcessFilter === 'ALL' || f.process_type === failureProcessFilter;
      return matchSearch && matchProc;
    });
  }, [failuresData.failures, searchTerm, failureProcessFilter]);

  const activeCount = useMemo(() => {
    if (activeTab === 'FDM') return filteredFdm.length;
    if (activeTab === 'RESIN') return filteredResin.length;
    if (activeTab === 'LASER') return filteredLaser.length;
    if (activeTab === 'PINTURA') return filteredFinishing.length;
    if (activeTab === 'ADESIVOS') return filteredStickers.length;
    return filteredFailures.length;
  }, [activeTab, filteredFdm, filteredResin, filteredLaser, filteredFinishing, filteredStickers, filteredFailures]);

  return (
    <div className="page-container">
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#10b981',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.86rem',
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Limpo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 22,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Estoque de Insumos & Refugos
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Controle de matérias-primas, cálculo de valor imobilizado e registro de falhas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={loadData}
            title="Atualizar"
            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Atualizar</span>
          </button>

          {activeTab !== 'REFUGOS' && (
            <button
              className="btn btn-primary"
              onClick={() => handleOpenMaterialModal(activeTab as any)}
              style={{ fontSize: '0.86rem', padding: '8px 16px', fontWeight: 700 }}
            >
              <Plus size={16} />
              <span>Novo Insumo ({activeTab})</span>
            </button>
          )}

          <button
            className="btn btn-danger"
            onClick={() => setIsScrapModalOpen(true)}
            style={{ fontSize: '0.86rem', padding: '8px 16px', fontWeight: 600 }}
          >
            <ShieldAlert size={16} />
            <span>Registrar Refugo</span>
          </button>
        </div>
      </div>

      {/* 2. Três KPIs Enxutos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 22,
        }}
      >
        {/* Total Valor Estoque */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Valor Total em Estoque
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 8 }}>
              <DollarSign size={16} color="#10b981" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 6 }}>
            {formatCurrency(data.summary?.totalStockValue || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {(data.fdm?.length || 0) + (data.resin?.length || 0) + (data.laser?.length || 0) + (data.finishing?.length || 0) + (data.stickers?.length || 0)} insumos cadastrados
          </div>
        </div>

        {/* Nível de Segurança */}
        <div
          className="glass-panel"
          style={{ padding: '16px 20px', cursor: (data.alerts?.length || 0) > 0 ? 'pointer' : 'default' }}
          onClick={() => (data.alerts?.length || 0) > 0 && setStatusFilter(statusFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Margem de Segurança
            </span>
            <div style={{ background: (data.alerts?.length || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 8 }}>
              <AlertTriangle size={16} color={(data.alerts?.length || 0) > 0 ? '#f87171' : '#10b981'} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: (data.alerts?.length || 0) > 0 ? '#f87171' : '#34d399', marginTop: 6 }}>
            {data.alerts?.length > 0 ? `${data.alerts.length} Críticos` : '100% Seguro'}
          </div>
          <div style={{ fontSize: '0.75rem', color: (data.alerts?.length || 0) > 0 ? '#f87171' : 'var(--text-secondary)', marginTop: 4 }}>
            {data.alerts?.length > 0 ? 'Clique para filtrar itens em falta' : 'Todos acima do estoque mínimo'}
          </div>
        </div>

        {/* Perdas com Falhas */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Perdas com Refugos
            </span>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 6, borderRadius: 8 }}>
              <TrendingDown size={16} color="#f87171" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f87171', marginTop: 6 }}>
            {formatCurrency(failuresData.stats?.total_financial_loss || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {failuresData.stats?.total_failures || 0} falhas • {failuresData.stats?.total_lost_hours || 0}h de máquina
          </div>
        </div>
      </div>

      {/* 3. Abas Limpas de Categoria */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 10,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'FDM', label: 'Filamentos FDM', count: data.fdm?.length || 0, icon: <Box size={14} /> },
            { id: 'RESIN', label: 'Resinas 3D', count: data.resin?.length || 0, icon: <Droplet size={14} /> },
            { id: 'LASER', label: 'Mídias Laser', count: data.laser?.length || 0, icon: <FileText size={14} /> },
            { id: 'PINTURA', label: 'Insumos Pintura', count: data.finishing?.length || 0, icon: <Palette size={14} /> },
            { id: 'ADESIVOS', label: 'Adesivos & Vinil', count: data.stickers?.length || 0, icon: <Sparkles size={14} /> },
            { id: 'REFUGOS', label: 'Histórico de Refugos', count: failuresData.failures?.length || 0, icon: <ShieldAlert size={14} />, danger: true },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchTerm('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive
                    ? tab.danger ? 'rgba(239, 68, 68, 0.15)' : 'var(--brand-primary)'
                    : 'transparent',
                  color: isActive
                    ? tab.danger ? '#f87171' : '#ffffff'
                    : 'var(--text-secondary)',
                  border: isActive && tab.danger ? '1px solid rgba(239, 68, 68, 0.35)' : 'none',
                  borderRadius: 8,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? (tab.danger ? '0 4px 14px rgba(239, 68, 68, 0.25)' : '0 4px 14px var(--brand-primary-glow)') : 'none',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--bg-surface-hover)',
                    border: isActive ? 'none' : '1px solid var(--border-subtle)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Alternador de Visualização Cards vs Tabela */}
        {activeTab !== 'REFUGOS' && (
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: 3, borderRadius: 8, gap: 2 }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '4px 9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
              title="Visualização em Cards"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'table' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '4px 9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.74rem',
                fontWeight: 600,
              }}
              title="Visualização em Tabela"
            >
              <List size={13} />
              <span>Tabela</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Barra de Busca e Filtros Rápidos */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder={
              activeTab === 'REFUGOS'
                ? 'Buscar por motivo ou material...'
                : 'Buscar por nome, marca ou cor...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 36, fontSize: '0.84rem', height: 38 }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeTab !== 'REFUGOS' ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className={`filter-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos ({activeCount})
            </button>
            <button
              className={`filter-chip ${statusFilter === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CRITICAL')}
              style={{ color: statusFilter === 'CRITICAL' ? '#f87171' : undefined }}
            >
              Abaixo do Mínimo
            </button>
            <button
              className={`filter-chip ${statusFilter === 'HEALTHY' ? 'active' : ''}`}
              onClick={() => setStatusFilter('HEALTHY')}
            >
              Nível Seguro
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {['ALL', 'FDM', 'RESIN', 'LASER', 'PINTURA'].map((p) => (
              <button
                key={p}
                className={`filter-chip ${failureProcessFilter === p ? 'active' : ''}`}
                onClick={() => setFailureProcessFilter(p)}
              >
                {p === 'ALL' ? 'Todos' : p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {activeCount === 0 && (
        <div className="glass-panel" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            Nenhum insumo encontrado para este filtro.
          </div>
          {searchTerm && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchTerm('')} style={{ marginTop: 10 }}>
              Limpar busca
            </button>
          )}
        </div>
      )}

      {/* ==========================================
          TAB CONTENT WRAPPER ANIMATED
      ========================================== */}
      <div key={activeTab} className="tab-pane-animated">
        {/* ==========================================
            TAB 1: FILAMENTOS FDM
        ========================================== */}
        {activeTab === 'FDM' && activeCount > 0 && (
        <>
          {viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
              {filteredFdm.map((f: any) => {
                const isLow = f.stock_weight_g <= f.min_stock_g;
                const spoolTotal = f.spool_weight_g || 1000;
                const percent = Math.min(100, Math.round((f.stock_weight_g / spoolTotal) * 100));
                const stockVal = (f.stock_weight_g / spoolTotal) * f.spool_price;
                const theme = getMaterialVisualTheme(f.color_hex, isLow);

                return (
                  <div
                    key={f.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      position: 'relative',
                      overflow: 'hidden',
                      background: `linear-gradient(180deg, ${theme.ambientGlow} 0%, var(--bg-card) 60px, var(--bg-card) 100%)`,
                      border: isLow ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-card)',
                      boxShadow: isLow
                        ? '0 10px 24px -8px rgba(239, 68, 68, 0.25), var(--shadow-sm)'
                        : 'var(--shadow-md)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Linha de acento sutil no topo */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2.5,
                        background: theme.topAccent,
                      }}
                    />

                    <div>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: theme.hex,
                              border: `1.5px solid ${theme.swatchBorder}`,
                              boxShadow: theme.swatchShadow,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.94rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={f.name}
                            >
                              {f.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              <span>{f.brand} • {f.material_type}</span>
                              {f.color && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: 'var(--bg-surface-hover)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '0.68rem',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {f.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={() => handleOpenMaterialModal('FDM', f)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            title="Editar"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial('FDM', f.id, f.name)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Level bar */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                            {f.stock_weight_g}g
                          </span>
                          {isLow ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#f87171',
                                background: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                padding: '2px 7px',
                                borderRadius: 6,
                              }}
                            >
                              Abaixo do mín ({f.min_stock_g}g)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {percent}% do rolo
                            </span>
                          )}
                        </div>

                        <div className="progress-bar-bg" style={{ height: 6, borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background: theme.barFill,
                              borderRadius: 999,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Preço: <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(f.spool_price)}</span></span>
                        <span>Imobilizado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(stockVal)}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_fdm', f.id, 1000, f.name)}
                        style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                      >
                        <Plus size={12} />
                        <span>+1kg</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setAdjustTarget({ table: 'materials_fdm', id: f.id, name: f.name, current: f.stock_weight_g, unit: 'g' });
                          setAdjustAmount(f.stock_weight_g);
                          setAdjustMode('set');
                          setIsAdjustModalOpen(true);
                        }}
                        style={{
                          fontSize: '0.74rem',
                          padding: '4px 10px',
                        }}
                      >
                        Ajustar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filamento / Cor</th>
                    <th>Marca & Tipo</th>
                    <th>Preço Carretel</th>
                    <th>Estoque Atual</th>
                    <th>Nível</th>
                    <th>Valor Imobilizado</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFdm.map((f: any) => {
                    const isLow = f.stock_weight_g <= f.min_stock_g;
                    const spoolTotal = f.spool_weight_g || 1000;
                    const percent = Math.min(100, Math.round((f.stock_weight_g / spoolTotal) * 100));
                    const stockVal = (f.stock_weight_g / spoolTotal) * f.spool_price;
                    const theme = getMaterialVisualTheme(f.color_hex, isLow);

                    return (
                      <tr key={f.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: theme.hex,
                                flexShrink: 0,
                                border: `1px solid ${theme.swatchBorder}`,
                                boxShadow: theme.swatchShadow,
                              }}
                            />
                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{f.brand} • {f.material_type}</td>
                        <td className="mono">{formatCurrency(f.spool_price)}</td>
                        <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                          {f.stock_weight_g}g
                        </td>
                        <td style={{ width: 120 }}>
                          <div className="progress-bar-bg" style={{ height: 6, borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{ height: '100%', width: `${percent}%`, background: theme.barFill, borderRadius: 999 }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', color: isLow ? '#f87171' : 'var(--text-muted)' }}>
                            {isLow ? `Mínimo: ${f.min_stock_g}g` : `${percent}%`}
                          </span>
                        </td>
                        <td className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                          {formatCurrency(stockVal)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleQuickAdjust('materials_fdm', f.id, 1000, f.name)}
                              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                            >
                              +1kg
                            </button>
                            <button
                              onClick={() => handleOpenMaterialModal('FDM', f)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          TAB 2: RESINAS 3D
      ========================================== */}
      {activeTab === 'RESIN' && activeCount > 0 && (
        <>
          {viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
              {filteredResin.map((r: any) => {
                const isLow = r.stock_volume_ml <= r.min_stock_ml;
                const bottleTotal = r.bottle_volume_ml || 1000;
                const percent = Math.min(100, Math.round((r.stock_volume_ml / bottleTotal) * 100));
                const stockVal = (r.stock_volume_ml / bottleTotal) * r.bottle_price;
                const theme = getMaterialVisualTheme(r.color_hex, isLow);

                return (
                  <div
                    key={r.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      position: 'relative',
                      overflow: 'hidden',
                      background: `linear-gradient(180deg, ${theme.ambientGlow} 0%, var(--bg-card) 60px, var(--bg-card) 100%)`,
                      border: isLow ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-card)',
                      boxShadow: isLow
                        ? '0 10px 24px -8px rgba(239, 68, 68, 0.25), var(--shadow-sm)'
                        : 'var(--shadow-md)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Linha de acento sutil no topo */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2.5,
                        background: theme.topAccent,
                      }}
                    />

                    <div>
                      {/* Top row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: theme.hex,
                              border: `1.5px solid ${theme.swatchBorder}`,
                              boxShadow: theme.swatchShadow,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.94rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={r.name}
                            >
                              {r.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              <span>{r.brand} • {r.resin_type}</span>
                              {r.color && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: 'var(--bg-surface-hover)',
                                    border: '1px solid var(--border-subtle)',
                                    fontSize: '0.68rem',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {r.color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={() => handleOpenMaterialModal('RESIN', r)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                            title="Editar"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial('RESIN', r.id, r.name)}
                            style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Level bar */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                            {r.stock_volume_ml}ml
                          </span>
                          {isLow ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#f87171',
                                background: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                padding: '2px 7px',
                                borderRadius: 6,
                              }}
                            >
                              Abaixo do mín ({r.min_stock_ml}ml)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {percent}% da garrafa
                            </span>
                          )}
                        </div>

                        <div className="progress-bar-bg" style={{ height: 6, borderRadius: 999, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background: theme.barFill,
                              borderRadius: 999,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Garrafa: <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(r.bottle_price)}</span></span>
                        <span>Imobilizado: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(stockVal)}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_resin', r.id, 1000, r.name)}
                        style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                      >
                        <Plus size={12} />
                        <span>+1L</span>
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setAdjustTarget({ table: 'materials_resin', id: r.id, name: r.name, current: r.stock_volume_ml, unit: 'ml' });
                          setAdjustAmount(r.stock_volume_ml);
                          setAdjustMode('set');
                          setIsAdjustModalOpen(true);
                        }}
                        style={{
                          fontSize: '0.74rem',
                          padding: '4px 10px',
                        }}
                      >
                        Ajustar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Resina / Cor</th>
                    <th>Marca & Tipo</th>
                    <th>Preço Garrafa</th>
                    <th>Estoque Atual</th>
                    <th>Nível</th>
                    <th>Valor Imobilizado</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResin.map((r: any) => {
                    const isLow = r.stock_volume_ml <= r.min_stock_ml;
                    const bottleTotal = r.bottle_volume_ml || 1000;
                    const percent = Math.min(100, Math.round((r.stock_volume_ml / bottleTotal) * 100));
                    const stockVal = (r.stock_volume_ml / bottleTotal) * r.bottle_price;
                    const theme = getMaterialVisualTheme(r.color_hex, isLow);

                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                background: theme.hex,
                                flexShrink: 0,
                                border: `1px solid ${theme.swatchBorder}`,
                                boxShadow: theme.swatchShadow,
                              }}
                            />
                            <span style={{ fontWeight: 600 }}>{r.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{r.brand} • {r.resin_type}</td>
                        <td className="mono">{formatCurrency(r.bottle_price)}</td>
                        <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                          {r.stock_volume_ml}ml
                        </td>
                        <td style={{ width: 120 }}>
                          <div className="progress-bar-bg" style={{ height: 6, borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{ height: '100%', width: `${percent}%`, background: theme.barFill, borderRadius: 999 }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', color: isLow ? '#f87171' : 'var(--text-muted)' }}>
                            {isLow ? `Mín: ${r.min_stock_ml}ml` : `${percent}%`}
                          </span>
                        </td>
                        <td className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                          {formatCurrency(stockVal)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleQuickAdjust('materials_resin', r.id, 1000, r.name)}
                            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          >
                            +1L
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ==========================================
          TAB 3: MÍDIAS LASER
      ========================================== */}
      {activeTab === 'LASER' && activeCount > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Papel / Mídia</th>
                <th>Gramatura</th>
                <th>Preço por Folha</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Valor Imobilizado</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredLaser.map((l: any) => {
                const isLow = l.stock_sheets <= l.min_stock_sheets;
                const stockVal = l.stock_sheets * l.sheet_price;

                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700 }}>{l.name}</td>
                    <td>{l.grammature}g/m²</td>
                    <td className="mono">{formatCurrency(l.sheet_price)}</td>
                    <td className="mono" style={{ fontWeight: 800, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {l.stock_sheets} folhas
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{l.min_stock_sheets} folhas</td>
                    <td className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{formatCurrency(stockVal)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleQuickAdjust('materials_laser', l.id, 50, l.name)}
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          +50 Fls
                        </button>
                        <button
                          onClick={() => handleOpenMaterialModal('LASER', l)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          TAB 4: PINTURA & ACABAMENTO
      ========================================== */}
      {activeTab === 'PINTURA' && activeCount > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item / Insumo</th>
                <th>Categoria</th>
                <th>Marca</th>
                <th>Custo Unit.</th>
                <th>Estoque Atual</th>
                <th>Estoque Mín.</th>
                <th>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredFinishing.map((f: any) => {
                const isLow = f.stock_qty <= f.min_stock_qty;
                const stockVal = f.stock_qty * f.cost_per_unit;

                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700 }}>{f.name}</td>
                    <td>
                      <span style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', padding: '2px 6px', borderRadius: 4, fontSize: '0.74rem' }}>
                        {f.category}
                      </span>
                    </td>
                    <td>{f.brand || 'Geral'}</td>
                    <td className="mono">{formatCurrency(f.cost_per_unit)} / {f.unit_type}</td>
                    <td className="mono" style={{ fontWeight: 800, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {f.stock_qty} {f.unit_type}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{f.min_stock_qty} {f.unit_type}</td>
                    <td className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{formatCurrency(stockVal)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleQuickAdjust('materials_finishing', f.id, f.unit_type === 'ml' ? 100 : 5, f.name)}
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          +{f.unit_type === 'ml' ? '100ml' : '5 un'}
                        </button>
                        <button
                          onClick={() => handleOpenMaterialModal('PINTURA', f)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          TAB 5: ADESIVOS & VINIL
      ========================================== */}
      {activeTab === 'ADESIVOS' && activeCount > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Adesivo / Vinil</th>
                <th>Acabamento</th>
                <th>Formato / Unidade</th>
                <th>Preço Unit.</th>
                <th>Custo Tinta</th>
                <th>Estoque Atual</th>
                <th>Estoque Mín.</th>
                <th>Valor Total</th>
                <th style={{ textAlign: 'right' }}>Ações Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filteredStickers.map((s: any) => {
                const isLow = s.stock_qty <= s.min_stock_qty;
                const stockVal = s.stock_qty * s.unit_price;
                const unitLabel = s.unit_type.toLowerCase().includes('folha') ? 'folhas' : 'm';

                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: s.color_hex || '#3b82f6',
                            border: '1px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 0 8px ' + (s.color_hex || '#3b82f6') + '66'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.brand || 'Genérico'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`process-tag process-ADESIVO`} style={{ fontSize: '0.72rem' }}>
                        {s.finish}
                      </span>
                    </td>
                    <td>{s.unit_type.replace('_', ' ')}</td>
                    <td className="mono">{formatCurrency(s.unit_price)}</td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(s.ink_cost_per_unit || 0)}</td>
                    <td className="mono" style={{ fontWeight: 800, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {s.stock_qty} {unitLabel}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{s.min_stock_qty} {unitLabel}</td>
                    <td className="mono" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{formatCurrency(stockVal)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleQuickAdjust('materials_stickers', s.id, 20, s.name)}
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        >
                          +20 {unitLabel}
                        </button>
                        <button
                          onClick={() => handleOpenMaterialModal('ADESIVOS', s)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                          title="Editar"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial('ADESIVOS', s.id, s.name)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                          title="Excluir"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          TAB 6: REFUGOS & FALHAS
      ========================================== */}
      {activeTab === 'REFUGOS' && (
        <div>
          {/* Top 3 Causas em Linha Limpa */}
          {failuresData.topReasons && failuresData.topReasons.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 18 }}>
              {failuresData.topReasons.slice(0, 3).map((r: any, idx: number) => (
                <div key={idx} className="glass-panel" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                    #{idx + 1} Causa de Perda
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginTop: 2 }}>{r.reason}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {r.count} ocorrência(s) • <strong style={{ color: '#f87171' }}>{formatCurrency(r.loss)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredFailures.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Processo</th>
                    <th>Motivo da Falha</th>
                    <th>Material Perdido</th>
                    <th>Horas</th>
                    <th>Prejuízo</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFailures.map((f: any) => (
                    <tr key={f.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(f.date)}</td>
                      <td>
                        <span className={`process-tag process-${f.process_type}`}>{f.process_type}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#f87171' }}>{f.reason}</td>
                      <td className="mono" style={{ fontSize: '0.82rem' }}>
                        {f.lost_qty > 0 ? `${f.lost_qty}g/ml` : '—'} {f.material_name ? `(${f.material_name})` : ''}
                      </td>
                      <td className="mono" style={{ fontSize: '0.82rem' }}>{f.lost_hours > 0 ? `${f.lost_hours}h` : '—'}</td>
                      <td className="mono" style={{ fontWeight: 800, color: '#ef4444' }}>
                        {formatCurrency(f.financial_loss)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteScrap(f.id)}
                          style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum refugo registrado neste filtro.
            </div>
          )}
        </div>
      )}
      </div>

      {/* ==========================================
          MODAL: REGISTRAR REFUGOS
      ========================================== */}
      {isScrapModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScrapModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} />
                Registrar Falha / Refugo
              </h3>
              <button onClick={() => setIsScrapModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateScrap}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Processo</label>
                    <select
                      className="form-control"
                      value={scrapProcess}
                      onChange={(e) => {
                        setScrapProcess(e.target.value);
                        setScrapMaterial('');
                      }}
                    >
                      <option value="FDM">FDM (Filamento)</option>
                      <option value="RESIN">Resina 3D</option>
                      <option value="LASER">Laser / Papelaria</option>
                      <option value="PINTURA">Pintura / Acabamento</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Material Perdido</label>
                    {scrapProcess === 'FDM' && data.fdm?.length > 0 ? (
                      <select className="form-control" value={scrapMaterial} onChange={(e) => setScrapMaterial(e.target.value)}>
                        <option value="">Selecione...</option>
                        {data.fdm.map((f: any) => (
                          <option key={f.id} value={f.name}>{f.name}</option>
                        ))}
                      </select>
                    ) : scrapProcess === 'RESIN' && data.resin?.length > 0 ? (
                      <select className="form-control" value={scrapMaterial} onChange={(e) => setScrapMaterial(e.target.value)}>
                        <option value="">Selecione...</option>
                        {data.resin.map((r: any) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: PLA Preto..."
                        value={scrapMaterial}
                        onChange={(e) => setScrapMaterial(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Qtd (g/ml)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={scrapQty}
                      onChange={(e) => setScrapQty(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Horas Perdidas</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control mono"
                      value={scrapHours}
                      onChange={(e) => setScrapHours(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ margin: 0 }}>Prejuízo (R$)</label>
                      <button
                        type="button"
                        onClick={handleAutoSuggestScrapCost}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Auto
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control mono"
                      value={scrapCost}
                      onChange={(e) => setScrapCost(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Motivo da Falha</label>
                  <select className="form-control" value={scrapReason} onChange={(e) => setScrapReason(e.target.value)}>
                    <option value="Descolamento da mesa de impressão (Warping)">Descolamento da mesa de impressão (Warping)</option>
                    <option value="Entupimento do bico / Nozzle clog">Entupimento do bico / Nozzle clog</option>
                    <option value="Falha ou quebra de suportes">Falha ou quebra de suportes</option>
                    <option value="Queda de energia elétrica / Parada súbita">Queda de energia elétrica / Parada súbita</option>
                    <option value="Filamento quebrado no AMS/Extrusor">Filamento quebrado no AMS/Extrusor</option>
                    <option value="Delaminação de camadas de resina">Delaminação de camadas de resina</option>
                    <option value="Erro no arquivo fatiado / G-Code">Erro no arquivo fatiado / G-Code</option>
                    <option value="Outro motivo">Outro motivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 18 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsScrapModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Salvar Refugo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: NOVO / EDITAR INSUMO
      ========================================== */}
      {isMaterialModalOpen && (
        <div className="modal-overlay" onClick={() => setIsMaterialModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                {editingMaterial ? 'Editar Insumo' : `Novo Insumo (${materialModalType})`}
              </h3>
              <button onClick={() => setIsMaterialModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {materialModalType === 'FDM' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nome do Filamento</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: PLA Preto..."
                          value={materialForm.name || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: Bambu Lab..."
                          value={materialForm.brand || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, brand: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Tipo de Polímero</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: PLA Basic, PETG..."
                          value={materialForm.material_type || 'PLA'}
                          onChange={(e) => setMaterialForm({ ...materialForm, material_type: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Cor Amostra</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={materialForm.color_hex || '#10b981'}
                            onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                            style={{ width: 38, height: 38, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                          />
                          <input
                            type="text"
                            className="form-control mono"
                            value={materialForm.color_hex || '#10b981'}
                            onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Preço Spool (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control mono"
                          value={materialForm.spool_price ?? 119.90}
                          onChange={(e) => setMaterialForm({ ...materialForm, spool_price: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Atual (g)</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.stock_weight_g ?? 1000}
                          onChange={(e) => setMaterialForm({ ...materialForm, stock_weight_g: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Mín. (g)</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.min_stock_g ?? 250}
                          onChange={(e) => setMaterialForm({ ...materialForm, min_stock_g: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {materialModalType === 'RESIN' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nome da Resina</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: Elegoo 8K Cinza..."
                          value={materialForm.name || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          value={materialForm.brand || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, brand: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Preço Garrafa (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control mono"
                          value={materialForm.bottle_price ?? 169.90}
                          onChange={(e) => setMaterialForm({ ...materialForm, bottle_price: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque (ml)</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.stock_volume_ml ?? 1000}
                          onChange={(e) => setMaterialForm({ ...materialForm, stock_volume_ml: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Mín. (ml)</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.min_stock_ml ?? 300}
                          onChange={(e) => setMaterialForm({ ...materialForm, min_stock_ml: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {materialModalType === 'LASER' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Nome do Papel</label>
                      <input
                        type="text"
                        className="form-control"
                        value={materialForm.name || ''}
                        onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Preço por Folha</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mono"
                        value={materialForm.sheet_price ?? 1.50}
                        onChange={(e) => setMaterialForm({ ...materialForm, sheet_price: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                )}

                {materialModalType === 'PINTURA' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Nome do Insumo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={materialForm.name || ''}
                        onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Custo Unitário</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mono"
                        value={materialForm.cost_per_unit ?? 15.00}
                        onChange={(e) => setMaterialForm({ ...materialForm, cost_per_unit: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                )}

                {materialModalType === 'ADESIVOS' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Nome do Adesivo / Vinil</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: Vinil Adesivo Branco Brilho..."
                          value={materialForm.name || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Marca</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: Imprimax, Alltak..."
                          value={materialForm.brand || ''}
                          onChange={(e) => setMaterialForm({ ...materialForm, brand: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Acabamento</label>
                        <select
                          className="form-control"
                          value={materialForm.finish || 'BRILHO'}
                          onChange={(e) => setMaterialForm({ ...materialForm, finish: e.target.value })}
                        >
                          <option value="BRILHO">Brilho</option>
                          <option value="FOSCO">Fosco</option>
                          <option value="HOLOGRAFICO">Holográfico</option>
                          <option value="TRANSPARENTE">Transparente</option>
                          <option value="METALICO">Metálico</option>
                          <option value="REFLETIVO">Refletivo</option>
                          <option value="KRAFT">Kraft</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Formato / Unidade</label>
                        <select
                          className="form-control"
                          value={materialForm.unit_type || 'FOLHA_A4'}
                          onChange={(e) => {
                            const u = e.target.value;
                            const w = u === 'FOLHA_A3' ? 297 : u === 'METRO_LINEAR' ? 1000 : 210;
                            const h = u === 'FOLHA_A3' ? 420 : u === 'METRO_LINEAR' ? 1000 : 297;
                            setMaterialForm({ ...materialForm, unit_type: u, sheet_width_mm: w, sheet_height_mm: h });
                          }}
                        >
                          <option value="FOLHA_A4">Folha A4 (210x297mm)</option>
                          <option value="FOLHA_A3">Folha A3 (297x420mm)</option>
                          <option value="METRO_LINEAR">Metro Linear (Rolo)</option>
                          <option value="M2">Metro Quadrado (m²)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Cor de Amostra</label>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={materialForm.color_hex || '#3b82f6'}
                            onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                            style={{ width: 34, height: 34, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'transparent' }}
                          />
                          <input
                            type="text"
                            className="form-control mono"
                            value={materialForm.color_hex || '#3b82f6'}
                            onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                            style={{ fontSize: '0.78rem' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Preço da Mídia (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control mono"
                          value={materialForm.unit_price ?? 2.20}
                          onChange={(e) => setMaterialForm({ ...materialForm, unit_price: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Custo Tinta/Folha (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control mono"
                          value={materialForm.ink_cost_per_unit ?? 0.50}
                          onChange={(e) => setMaterialForm({ ...materialForm, ink_cost_per_unit: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Custo Laminação (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control mono"
                          value={materialForm.lamination_cost_per_unit ?? 0.35}
                          onChange={(e) => setMaterialForm({ ...materialForm, lamination_cost_per_unit: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Atual (Qtd)</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.stock_qty ?? 50}
                          onChange={(e) => setMaterialForm({ ...materialForm, stock_qty: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Estoque Mínimo</label>
                        <input
                          type="number"
                          className="form-control mono"
                          value={materialForm.min_stock_qty ?? 15}
                          onChange={(e) => setMaterialForm({ ...materialForm, min_stock_qty: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: 18 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsMaterialModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: AJUSTAR ESTOQUE
      ========================================== */}
      {isAdjustModalOpen && adjustTarget && (
        <div className="modal-overlay" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Ajustar Saldo em Estoque</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saldo Atual:</span>
                  <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {adjustTarget.current} {adjustTarget.unit}
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Modo de Ajuste</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      { id: 'set', label: 'Definir Saldo' },
                      { id: 'add', label: '+ Entrada' },
                      { id: 'subtract', label: '- Baixa' },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setAdjustMode(m.id as any);
                          if (m.id === 'set') setAdjustAmount(adjustTarget.current);
                          else setAdjustAmount(100);
                        }}
                        style={{
                          padding: '6px',
                          fontSize: '0.74rem',
                          fontWeight: adjustMode === m.id ? 700 : 500,
                          background: adjustMode === m.id ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--bg-surface)',
                          border: adjustMode === m.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                          color: adjustMode === m.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Quantidade ({adjustTarget.unit})</label>
                  <input
                    type="number"
                    className="form-control mono"
                    style={{ fontSize: '1.15rem', fontWeight: 800 }}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 18 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
