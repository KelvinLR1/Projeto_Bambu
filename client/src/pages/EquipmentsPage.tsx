import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  History, 
  X,
  Zap
} from 'lucide-react';

export const EquipmentsPage: React.FC = () => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Maintenance Modal
  const [selectedEquip, setSelectedEquip] = useState<any | null>(null);
  const [maintType, setMaintType] = useState('PREVENTIVA');
  const [maintDesc, setMaintDesc] = useState('Lubrificação de eixos e fusos + limpeza');
  const [maintCost, setMaintCost] = useState(30);
  const [registerExpense, setRegisterExpense] = useState(true);

  // New Equipment Modal
  const [isNewEquipModalOpen, setIsNewEquipModalOpen] = useState(false);
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipType, setNewEquipType] = useState('FDM');
  const [newEquipWatts, setNewEquipWatts] = useState(180);
  const [newEquipCost, setNewEquipCost] = useState(5000);
  const [newEquipInterval, setNewEquipInterval] = useState(200);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getEquipments();
      setEquipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquip) return;

    try {
      await api.registerMaintenance(selectedEquip.id, {
        type: maintType,
        description: maintDesc,
        cost: maintCost,
        registerExpense,
      });
      setSelectedEquip(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment({
        name: newEquipName,
        type: newEquipType,
        power_watts: newEquipWatts,
        purchase_cost: newEquipCost,
        maintenance_interval_hours: newEquipInterval,
        hourly_depreciation: Number((newEquipCost / 5000).toFixed(2)),
      });
      setIsNewEquipModalOpen(false);
      setNewEquipName('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Parque de Equipamentos & Manutenção Preventiva</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Horômetros automáticos, alertas de lubrificação de guias, troca de películas e calibrações
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsNewEquipModalOpen(true)}>
          <Plus size={16} />
          <span>Novo Equipamento</span>
        </button>
      </div>

      {/* Grid of Equipment Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {equipments.map(eq => {
          const isDue = eq.isDue;
          const progress = eq.progressPercent || 0;

          return (
            <div
              key={eq.id}
              className="glass-panel"
              style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isDue ? 'rgba(239, 68, 68, 0.4)' : undefined,
                position: 'relative'
              }}
            >
              <div>
                {/* Header card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span className={`process-tag process-${eq.type}`} style={{ marginBottom: 4 }}>
                      {eq.type}
                    </span>
                    <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginTop: 4 }}>
                      {eq.name}
                    </h3>
                  </div>

                  {isDue ? (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <AlertTriangle size={13} />
                      REVISÃO NECESSÁRIA
                    </span>
                  ) : (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      <CheckCircle size={13} />
                      OPERACIONAL
                    </span>
                  )}
                </div>

                {/* Horometer Box */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                  marginBottom: 14,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HORÔMETRO TOTAL</span>
                    <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {eq.total_hours}h
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POTÊNCIA / HORA</span>
                    <div className="mono" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {eq.power_watts}W ({formatCurrency(eq.hourly_depreciation)}/h)
                    </div>
                  </div>
                </div>

                {/* Maintenance Progress Gauge */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Uso desde a última revisão: <strong>{eq.hours_since_last_maint}h</strong> / {eq.maintenance_interval_hours}h
                    </span>
                    <span className="mono" style={{ color: isDue ? '#f87171' : 'var(--text-muted)' }}>
                      {progress}%
                    </span>
                  </div>

                  <div className="progress-bar-bg" style={{ height: 10 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progress}%`,
                        background: isDue ? '#ef4444' : progress > 75 ? '#f59e0b' : 'var(--brand-primary)'
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.72rem', color: isDue ? '#f87171' : 'var(--text-muted)', marginTop: 4 }}>
                    {isDue 
                      ? '⚠️ Prazo preventivo atingido! Lubrifique os eixos ou substitua peças de desgaste.'
                      : `Faltam ${eq.remainingHours}h para a próxima intervenção recomendada.`
                    }
                  </div>
                </div>

                {eq.notes && (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 14 }}>
                    ℹ️ {eq.notes}
                  </p>
                )}
              </div>

              {/* Action */}
              <button
                className={`btn btn-sm ${isDue ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setSelectedEquip(eq)}
                style={{ width: '100%' }}
              >
                <Wrench size={14} />
                <span>Registrar Manutenção Realizada</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Register Maintenance Modal */}
      {selectedEquip && (
        <div className="modal-overlay" onClick={() => setSelectedEquip(null)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={18} color="var(--brand-primary)" />
                Registrar Manutenção: {selectedEquip.name}
              </h3>
              <button onClick={() => setSelectedEquip(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterMaintenance}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tipo de Intervenção</label>
                  <select
                    className="form-control"
                    value={maintType}
                    onChange={e => setMaintType(e.target.value)}
                  >
                    <option value="PREVENTIVA">Manutenção Preventiva / Limpeza Geral</option>
                    <option value="LUBRIFICACAO">Lubrificação de Eixos e Fusos</option>
                    <option value="TROCA_PECA">Troca de Peça (Filme FEP, Bico, Fitas, Filtros)</option>
                    <option value="CORRETIVA">Manutenção Corretiva (Conserto)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Descrição dos Serviços Feitos *</label>
                  <textarea
                    className="form-control"
                    value={maintDesc}
                    onChange={e => setMaintDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Custo das Peças / Insumos (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control mono"
                    value={maintCost}
                    onChange={e => setMaintCost(Number(e.target.value))}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={registerExpense}
                    onChange={e => setRegisterExpense(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }}
                  />
                  <span>Lançar este custo como despesa de Manutenção no Fluxo de Caixa</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEquip(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar e Resetar Horômetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Equipment Modal */}
      {isNewEquipModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewEquipModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem' }}>Cadastrar Novo Equipamento</h3>
              <button onClick={() => setIsNewEquipModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nome do Equipamento *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Bambu Lab A1 Mini, Anycubic Photon Mono, etc."
                    value={newEquipName}
                    onChange={e => setNewEquipName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tipo / Categoria</label>
                    <select
                      className="form-control"
                      value={newEquipType}
                      onChange={e => setNewEquipType(e.target.value)}
                    >
                      <option value="FDM">FDM (Filamento)</option>
                      <option value="RESIN">Resina (SLA / DLP)</option>
                      <option value="LASER">Laser Cutter / Gravadora</option>
                      <option value="AIRBRUSH">Aerógrafo / Pintura</option>
                      <option value="BOOTH">Cabine de Pintura</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Potência (Watts)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={newEquipWatts}
                      onChange={e => setNewEquipWatts(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Valor de Compra (R$)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={newEquipCost}
                      onChange={e => setNewEquipCost(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Intervalo Revisão (h)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={newEquipInterval}
                      onChange={e => setNewEquipInterval(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewEquipModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
