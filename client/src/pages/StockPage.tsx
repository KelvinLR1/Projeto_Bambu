import React, { useState, useEffect } from 'react';
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
  PlusCircle,
  Clock
} from 'lucide-react';

export const StockPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'REFUGOS'>('FDM');
  const [data, setData] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [], alerts: [], summary: {} });
  const [failuresData, setFailuresData] = useState<any>({ failures: [], stats: {}, topReasons: [] });
  const [loading, setLoading] = useState(true);

  // New Scrap/Failure Modal
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapProcess, setScrapProcess] = useState('FDM');
  const [scrapMaterial, setScrapMaterial] = useState('');
  const [scrapQty, setScrapQty] = useState(150);
  const [scrapHours, setScrapHours] = useState(5);
  const [scrapCost, setScrapCost] = useState(35);
  const [scrapReason, setScrapReason] = useState('Descolamento da mesa de impressão (Warping)');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mats, fails] = await Promise.all([api.getMaterials(), api.getFailures()]);
      setData(mats);
      setFailuresData(fails);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdjust = async (table: string, id: string, amount: number) => {
    try {
      await api.adjustStock(table, id, amount);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateScrap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFailure({
        process_type: scrapProcess,
        material_name: scrapMaterial || null,
        lost_qty: scrapQty,
        lost_hours: scrapHours,
        financial_loss: scrapCost,
        reason: scrapReason,
      });
      setIsScrapModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Controle de Estoque Inteligente & Refugos</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Monitoramento de insumos com baixa automática, alertas de ponto de pedido e registro de falhas
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-danger btn-sm" onClick={() => setIsScrapModalOpen(true)}>
            <TrendingDown size={16} />
            <span>Registrar Falha / Refugo</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="glass-panel" style={{ padding: 16 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Valor Total em Estoque
          </span>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 4 }}>
            {formatCurrency(data.summary?.totalStockValue)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Filamentos, resinas, papéis e tintas
          </span>
        </div>

        <div className="glass-panel" style={{ padding: 16 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Alertas de Estoque Mínimo
          </span>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: data.alerts?.length > 0 ? '#f87171' : '#34d399', marginTop: 4 }}>
            {data.alerts?.length || 0} itens
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Abaixo da margem de segurança
          </span>
        </div>

        <div className="glass-panel" style={{ padding: 16 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Prejuízo Acumulado com Falhas
          </span>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f87171', marginTop: 4 }}>
            {formatCurrency(failuresData.stats?.total_financial_loss)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {failuresData.stats?.total_lost_hours || 0}h perdidas em máquinas
          </span>
        </div>
      </div>

      {/* Critical Stock Alerts Banner */}
      {data.alerts && data.alerts.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#f87171" />
            <h4 style={{ fontSize: '0.92rem', color: '#f87171', fontWeight: 700 }}>
              ATENÇÃO: Insumos Críticos Abaixo do Estoque Mínimo ({data.alerts.length})
            </h4>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {data.alerts.map((al: any) => (
              <div
                key={al.id}
                style={{
                  background: 'rgba(17, 23, 38, 0.8)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span style={{ fontWeight: 600 }}>{al.name}</span>
                <span className="mono" style={{ color: '#f87171', fontWeight: 700 }}>
                  Restam {al.currentStock}{al.unit} (Mín: {al.minStock}{al.unit})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
        {[
          { id: 'FDM', label: `Filamentos FDM (${data.fdm?.length || 0})` },
          { id: 'RESIN', label: `Resinas SLA/DLP (${data.resin?.length || 0})` },
          { id: 'LASER', label: `Mídias Laser (${data.laser?.length || 0})` },
          { id: 'PINTURA', label: `Insumos Pintura (${data.finishing?.length || 0})` },
          { id: 'REFUGOS', label: `Falhas & Refugos (${failuresData.failures?.length || 0})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              background: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content by Tab */}
      {activeTab === 'FDM' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filamento / Cor</th>
                <th>Marca & Tipo</th>
                <th>Preço Spool</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Status Nível</th>
                <th style={{ textAlign: 'right' }}>Reabastecer Rápido</th>
              </tr>
            </thead>
            <tbody>
              {data.fdm.map((f: any) => {
                const isLow = f.stock_weight_g <= f.min_stock_g;
                const percent = Math.min(100, Math.round((f.stock_weight_g / 1000) * 100));

                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: f.color_hex || '#fff',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }} />
                        <span style={{ fontWeight: 600 }}>{f.name}</span>
                      </div>
                    </td>
                    <td>{f.brand} • {f.material_type}</td>
                    <td className="mono">{formatCurrency(f.spool_price)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {f.stock_weight_g}g
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{f.min_stock_g}g</td>
                    <td style={{ width: 140 }}>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${percent}%`,
                            background: isLow ? '#ef4444' : 'var(--brand-primary)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: isLow ? '#f87171' : 'var(--text-muted)' }}>
                        {isLow ? 'CRÍTICO' : `${percent}% do rolo`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_fdm', f.id, 1000)}
                        title="Adicionar 1kg (1 carretel novo)"
                      >
                        <Plus size={13} />
                        <span>+1 Carretel (1kg)</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'RESIN' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resina / Cor</th>
                <th>Marca & Tipo</th>
                <th>Preço Garrafa</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th>Nível</th>
                <th style={{ textAlign: 'right' }}>Reabastecer Rápido</th>
              </tr>
            </thead>
            <tbody>
              {data.resin.map((r: any) => {
                const isLow = r.stock_volume_ml <= r.min_stock_ml;
                const percent = Math.min(100, Math.round((r.stock_volume_ml / 1000) * 100));

                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: r.color_hex || '#718096',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }} />
                        <span style={{ fontWeight: 600 }}>{r.name}</span>
                      </div>
                    </td>
                    <td>{r.brand} • {r.resin_type}</td>
                    <td className="mono">{formatCurrency(r.bottle_price)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {r.stock_volume_ml}ml
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{r.min_stock_ml}ml</td>
                    <td style={{ width: 140 }}>
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${percent}%`,
                            background: isLow ? '#ef4444' : 'var(--accent-purple)'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: isLow ? '#f87171' : 'var(--text-muted)' }}>
                        {isLow ? 'CRÍTICO' : `${percent}%`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_resin', r.id, 1000)}
                        title="Adicionar 1 Garrafa (1000ml)"
                      >
                        <Plus size={13} />
                        <span>+1 Garrafa (1L)</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'LASER' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Papel / Mídia</th>
                <th>Gramatura</th>
                <th>Preço por Folha</th>
                <th>Estoque Atual</th>
                <th>Mínimo</th>
                <th style={{ textAlign: 'right' }}>Reabastecer Rápido</th>
              </tr>
            </thead>
            <tbody>
              {data.laser.map((l: any) => {
                const isLow = l.stock_sheets <= l.min_stock_sheets;

                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>{l.grammature}g/m²</td>
                    <td className="mono">{formatCurrency(l.sheet_price)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {l.stock_sheets} folhas
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>{l.min_stock_sheets} folhas</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_laser', l.id, 50)}
                      >
                        <Plus size={13} />
                        <span>+50 Folhas</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'PINTURA' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item / Insumo</th>
                <th>Categoria</th>
                <th>Marca</th>
                <th>Custo Unit.</th>
                <th>Estoque Atual</th>
                <th>Estoque Mínimo</th>
                <th style={{ textAlign: 'right' }}>Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody>
              {data.finishing.map((f: any) => {
                const isLow = f.stock_qty <= f.min_stock_qty;

                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.name}</td>
                    <td>
                      <span style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem'
                      }}>
                        {f.category}
                      </span>
                    </td>
                    <td>{f.brand || 'Geral'}</td>
                    <td className="mono">{formatCurrency(f.cost_per_unit)} / {f.unit_type}</td>
                    <td className="mono" style={{ fontWeight: 700, color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                      {f.stock_qty} {f.unit_type}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-muted)' }}>
                      {f.min_stock_qty} {f.unit_type}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickAdjust('materials_finishing', f.id, f.unit_type === 'ml' ? 100 : 10)}
                      >
                        <Plus size={13} />
                        <span>+{f.unit_type === 'ml' ? '100ml' : '10 un'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'REFUGOS' && (
        <div>
          {/* Top Causes */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {failuresData.topReasons?.map((r: any, idx: number) => (
              <div key={idx} className="glass-panel" style={{ padding: '10px 16px', flex: 1, minWidth: 240 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Causa #{idx + 1} de Falha
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', marginTop: 2 }}>{r.reason}</div>
                <div className="mono" style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 2 }}>
                  {r.count} ocorrência(s) • Prejuízo: {formatCurrency(r.loss)}
                </div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Processo</th>
                  <th>Motivo da Falha / Ocorrência</th>
                  <th>Material Perdido</th>
                  <th>Horas Perdidas</th>
                  <th>Prejuízo Financeiro</th>
                </tr>
              </thead>
              <tbody>
                {failuresData.failures.map((f: any) => (
                  <tr key={f.id}>
                    <td>{formatDate(f.date)}</td>
                    <td>
                      <span className={`process-tag process-${f.process_type}`}>{f.process_type}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f87171' }}>{f.reason}</td>
                    <td className="mono">{f.lost_qty}g/ml {f.material_name ? `(${f.material_name})` : ''}</td>
                    <td className="mono">{f.lost_hours}h</td>
                    <td className="mono" style={{ fontWeight: 700, color: '#ef4444' }}>
                      {formatCurrency(f.financial_loss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Register Failure/Scrap */}
      {isScrapModalOpen && (
        <div className="modal-overlay" onClick={() => setIsScrapModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} />
                Registrar Falha de Impressão / Refugo
              </h3>
              <button onClick={() => setIsScrapModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
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
                      onChange={e => setScrapProcess(e.target.value)}
                    >
                      <option value="FDM">FDM (Filamento)</option>
                      <option value="RESIN">Resina 3D</option>
                      <option value="LASER">Laser / Papelaria</option>
                      <option value="PINTURA">Pintura / Acabamento</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Material Desperdiçado</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: PLA Preto, Resina 8K..."
                      value={scrapMaterial}
                      onChange={e => setScrapMaterial(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Qtd Perdida (g/ml)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={scrapQty}
                      onChange={e => setScrapQty(Number(e.target.value))}
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
                      onChange={e => setScrapHours(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Prejuízo (R$) *</label>
                    <input
                      type="number"
                      step="0.5"
                      className="form-control mono"
                      value={scrapCost}
                      onChange={e => setScrapCost(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Motivo da Falha *</label>
                  <select
                    className="form-control"
                    value={scrapReason}
                    onChange={e => setScrapReason(e.target.value)}
                  >
                    <option value="Descolamento da mesa de impressão (Warping)">Descolamento da mesa de impressão (Warping)</option>
                    <option value="Entupimento do bico / Nozzle clog">Entupimento do bico / Nozzle clog</option>
                    <option value="Falha ou quebra de suportes">Falha ou quebra de suportes</option>
                    <option value="Queda de energia elétrica / Parada súbita">Queda de energia elétrica / Parada súbita</option>
                    <option value="Filamento quebrado no AMS/Extrusor">Filamento quebrado no AMS/Extrusor</option>
                    <option value="Delaminação de camadas de resina">Delaminação de camadas de resina</option>
                    <option value="Bolhas de ar ou tanque sujo">Bolhas de ar ou tanque sujo</option>
                    <option value="Erro no arquivo fatiado / G-Code">Erro no arquivo fatiado / G-Code</option>
                    <option value="Outro motivo">Outro motivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsScrapModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Salvar Registro de Falha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
