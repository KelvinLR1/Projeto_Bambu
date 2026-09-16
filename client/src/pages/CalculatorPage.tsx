import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { 
  Calculator, 
  Printer, 
  TestTube, 
  Zap, 
  Paintbrush, 
  PlusCircle, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock
} from 'lucide-react';

interface CalculatorPageProps {
  onGenerateOrder: (calcItem: any) => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ onGenerateOrder }) => {
  const [activeTab, setActiveTab] = useState<'FDM' | 'RESIN' | 'LASER' | 'PINTURA'>('FDM');
  const [materials, setMaterials] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [] });
  const [equipments, setEquipments] = useState<any[]>([]);

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

  const loadDatabaseOptions = async () => {
    try {
      const [mats, eqs] = await Promise.all([api.getMaterials(), api.getEquipments()]);
      setMaterials(mats);
      setEquipments(eqs);

      if (mats.fdm.length > 0) setFdmMaterialId(mats.fdm[0].id);
      if (mats.resin.length > 0) setResinMaterialId(mats.resin[0].id);
      if (mats.laser.length > 0) setLaserMaterialId(mats.laser[0].id);

      const fdmEq = eqs.find(e => e.type === 'FDM');
      if (fdmEq) setFdmEquipId(fdmEq.id);

      const resinEq = eqs.find(e => e.type === 'RESIN');
      if (resinEq) setResinEquipId(resinEq.id);
    } catch (err) {
      console.error(err);
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

    if (activeTab === 'FDM' && fdmResult) {
      const mat = materials.fdm.find((m: any) => m.id === fdmMaterialId);
      item = {
        process_type: 'FDM',
        description: `Impressão FDM: ${mat?.name || 'Filamento'} (${fdmWeightG}g, ${fdmHours}h)`,
        quantity: 1,
        material_id: fdmMaterialId,
        equipment_id: fdmEquipId,
        unit_cost: fdmResult.totalCost,
        unit_price: fdmResult.suggestedPrice,
        calc_params: { weight_g: fdmWeightG, hours: fdmHours, ...fdmResult },
      };
    } else if (activeTab === 'RESIN' && resinResult) {
      const mat = materials.resin.find((m: any) => m.id === resinMaterialId);
      item = {
        process_type: 'RESIN',
        description: `Impressão Resina: ${mat?.name || 'Resina'} (${resinVolumeMl}ml, ${resinHours}h)`,
        quantity: 1,
        material_id: resinMaterialId,
        equipment_id: resinEquipId,
        unit_cost: resinResult.totalCost,
        unit_price: resinResult.suggestedPrice,
        calc_params: { volume_ml: resinVolumeMl, hours: resinHours, ...resinResult },
      };
    } else if (activeTab === 'LASER' && laserResult) {
      const mat = materials.laser.find((m: any) => m.id === laserMaterialId);
      item = {
        process_type: 'LASER',
        description: `Corte/Impressão Laser: ${mat?.name || 'Papel'} (${laserSheets} folhas)`,
        quantity: 1,
        material_id: laserMaterialId,
        unit_cost: laserResult.totalCost,
        unit_price: laserResult.suggestedPrice,
        calc_params: { sheets: laserSheets, ...laserResult },
      };
    } else if (activeTab === 'PINTURA' && paintResult) {
      item = {
        process_type: 'PINTURA',
        description: `Pós-Processamento e Pintura Artesanal Porte ${paintSize} (Prep: ${paintPrepHours}h, Pintura: ${paintPaintHours}h, Verniz ${paintVarnish})`,
        quantity: 1,
        material_id: null,
        unit_cost: paintResult.totalCost,
        unit_price: paintResult.suggestedPrice,
        calc_params: { ...paintResult },
      };
    }

    if (item) {
      onGenerateOrder(item);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Calculadora de Custos & Precificação Maker</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Simulação com custos reais de matéria-prima, consumo energético em kWh, depreciação de máquinas e margem de lucro
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'FDM', label: 'Impressão 3D FDM', icon: Printer, color: 'var(--brand-primary)' },
          { id: 'RESIN', label: 'Impressão 3D Resina', icon: TestTube, color: 'var(--accent-purple)' },
          { id: 'LASER', label: 'Laser & Papelaria', icon: Zap, color: 'var(--accent-amber)' },
          { id: 'PINTURA', label: 'Pós-Processamento & Pintura', icon: Paintbrush, color: 'var(--accent-rose)' },
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
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem'
              }}
            >
              <Icon size={18} color={isActive ? tab.color : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Inputs on Left, Results on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 24, alignItems: 'start' }}>
        {/* LEFT COLUMN: PARAMETERS */}
        <div className="glass-panel" style={{ padding: 24 }}>
          {activeTab === 'FDM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
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

              <div className="form-group">
                <label className="form-label">
                  <span>Margem de Lucro Desejada</span>
                  <strong style={{ color: 'var(--brand-primary)' }}>{fdmMargin}%</strong>
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={fdmMargin}
                  onChange={e => setFdmMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'RESIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TestTube size={20} color="var(--accent-purple)" />
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

              <div className="form-group">
                <label className="form-label">
                  <span>Margem de Lucro Desejada</span>
                  <strong style={{ color: 'var(--accent-purple)' }}>{resinMargin}%</strong>
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={resinMargin}
                  onChange={e => setResinMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-purple)' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'LASER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} color="var(--accent-amber)" />
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

              <div className="form-group">
                <label className="form-label">
                  <span>Margem de Lucro Desejada</span>
                  <strong style={{ color: 'var(--accent-amber)' }}>{laserMargin}%</strong>
                </label>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={laserMargin}
                  onChange={e => setLaserMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
                />
              </div>
            </div>
          )}

          {activeTab === 'PINTURA' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Paintbrush size={20} color="var(--accent-rose)" />
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

              <div className="form-group">
                <label className="form-label">
                  <span>Margem de Lucro Desejada</span>
                  <strong style={{ color: 'var(--accent-rose)' }}>{paintMargin}%</strong>
                </label>
                <input
                  type="range"
                  min="30"
                  max="200"
                  value={paintMargin}
                  onChange={e => setPaintMargin(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-rose)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DYNAMIC RESULTS BREAKDOWN */}
        <div className="glass-panel" style={{ padding: 24, position: 'sticky', top: 90 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Detalhamento do Orçamento</h3>
            <span style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--brand-primary)',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)'
            }}>
              CÁLCULO EM TEMPO REAL
            </span>
          </div>

          {/* Target Result */}
          {(() => {
            const res =
              activeTab === 'FDM'
                ? fdmResult
                : activeTab === 'RESIN'
                ? resinResult
                : activeTab === 'LASER'
                ? laserResult
                : paintResult;

            if (!res) {
              return <p style={{ color: 'var(--text-muted)' }}>Calculando valores...</p>;
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Highlight Big Price Card */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Preço de Venda Sugerido
                  </div>
                  <div className="mono" style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--brand-primary)', margin: '4px 0' }}>
                    {formatCurrency(res.suggestedPrice)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Lucro Bruto Estimado: <strong style={{ color: '#34d399' }}>{formatCurrency(res.marginAmount)}</strong> ({res.marginPercent}%)
                  </div>
                </div>

                {/* Detailed Line Items */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: '0.86rem'
                }}>
                  {res.rawMaterialCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Matéria-Prima Direta:</span>
                      <strong className="mono">{formatCurrency(res.rawMaterialCost)}</strong>
                    </div>
                  )}

                  {res.washCureCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Lavagem/Cura (Álcool + FEP):</span>
                      <strong className="mono">{formatCurrency(res.washCureCost)}</strong>
                    </div>
                  )}

                  {res.paperCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mídia / Folhas:</span>
                      <strong className="mono">{formatCurrency(res.paperCost)}</strong>
                    </div>
                  )}

                  {res.energyCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Energia Elétrica (kWh):</span>
                      <strong className="mono">{formatCurrency(res.energyCost)}</strong>
                    </div>
                  )}

                  {res.machineDepreciation !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Depreciação de Máquina:</span>
                      <strong className="mono">{formatCurrency(res.machineDepreciation)}</strong>
                    </div>
                  )}

                  {res.cadCost !== undefined && res.cadCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Mão de Obra CAD / Fatiamento:</span>
                      <strong className="mono">{formatCurrency(res.cadCost)}</strong>
                    </div>
                  )}

                  {res.prepCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Lixamento & Preparação:</span>
                      <strong className="mono">{formatCurrency(res.prepCost)}</strong>
                    </div>
                  )}

                  {res.paintCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Pintura & Aerografia:</span>
                      <strong className="mono">{formatCurrency(res.paintCost)}</strong>
                    </div>
                  )}

                  {res.consumablesCost !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Insumos (Primer, Tintas, Verniz):</span>
                      <strong className="mono">{formatCurrency(res.consumablesCost)}</strong>
                    </div>
                  )}

                  {res.failureBuffer !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Reserva de Risco / Falhas:</span>
                      <strong className="mono">{formatCurrency(res.failureBuffer)}</strong>
                    </div>
                  )}

                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}>
                    <span>CUSTO TOTAL DE PRODUÇÃO:</span>
                    <span className="mono">{formatCurrency(res.totalCost)}</span>
                  </div>
                </div>

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
    </div>
  );
};
