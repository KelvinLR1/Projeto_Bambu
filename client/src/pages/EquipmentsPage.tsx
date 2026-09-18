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
  Zap,
  Edit3,
  Trash2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText
} from 'lucide-react';

export const EquipmentsPage: React.FC = () => {
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Maintenance Modal
  const [selectedEquipForMaint, setSelectedEquipForMaint] = useState<any | null>(null);
  const [maintType, setMaintType] = useState('PREVENTIVA');
  const [maintDesc, setMaintDesc] = useState('Lubrificação de eixos e fusos + limpeza das guias');
  const [maintCost, setMaintCost] = useState(30);
  const [registerExpense, setRegisterExpense] = useState(true);

  // History Modal
  const [historyEquip, setHistoryEquip] = useState<any | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create / Edit Equipment Modal
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [editingEquipId, setEditingEquipId] = useState<string | null>(null);
  const [equipForm, setEquipForm] = useState({
    name: '',
    type: 'FDM',
    power_watts: 180,
    purchase_cost: 5000,
    maintenance_interval_hours: 200,
    total_hours: 0,
    hourly_depreciation: 1.0,
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleOpenCreateModal = () => {
    setEditingEquipId(null);
    setEquipForm({
      name: '',
      type: 'FDM',
      power_watts: 180,
      purchase_cost: 4500,
      maintenance_interval_hours: 200,
      total_hours: 0,
      hourly_depreciation: 0.9,
      notes: 'Limpeza de bicos e lubrificação periódica com graxa de PTFE',
    });
    setIsEquipModalOpen(true);
  };

  const handleOpenEditModal = (eq: any) => {
    setEditingEquipId(eq.id);
    setEquipForm({
      name: eq.name,
      type: eq.type,
      power_watts: eq.power_watts || 150,
      purchase_cost: eq.purchase_cost || 0,
      maintenance_interval_hours: eq.maintenance_interval_hours || 200,
      total_hours: eq.total_hours || 0,
      hourly_depreciation: eq.hourly_depreciation || 1.0,
      notes: eq.notes || '',
    });
    setIsEquipModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const depreciation = equipForm.purchase_cost > 0 
        ? Number((equipForm.purchase_cost / 5000).toFixed(2)) 
        : 1.0;

      const payload = {
        ...equipForm,
        hourly_depreciation: depreciation,
      };

      if (editingEquipId) {
        await api.updateEquipment(editingEquipId, payload);
        showToast('Equipamento atualizado com sucesso!');
      } else {
        await api.createEquipment(payload);
        showToast('Novo equipamento cadastrado com sucesso!');
      }

      setIsEquipModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o equipamento "${name}"? Todo o histórico de revisões também será apagado.`)) return;
    try {
      await api.deleteEquipment(id);
      showToast(`Equipamento "${name}" removido.`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenHistoryModal = async (eq: any) => {
    setHistoryEquip(eq);
    setLoadingHistory(true);
    try {
      const full = await api.getEquipment(eq.id);
      setHistoryList(full.maintenances || []);
    } catch (err: any) {
      console.error(err);
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRegisterMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipForMaint) return;

    try {
      await api.registerMaintenance(selectedEquipForMaint.id, {
        type: maintType,
        description: maintDesc,
        cost: maintCost,
        registerExpense,
      });
      showToast(`Manutenção registrada para ${selectedEquipForMaint.name}! Horômetro parcial zerado.`);
      setSelectedEquipForMaint(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 28px' }}>
      {/* Toast Notification */}
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Parque de Equipamentos & Manutenções
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Horômetros acumulados, intervalos preventivos, custos de revisão e controle de vida útil.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreateModal} style={{ fontWeight: 700 }}>
          <Plus size={16} />
          <span>Novo Equipamento</span>
        </button>
      </div>

      {/* Grid of Equipment Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 18 }}>
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
                border: isDue ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isDue ? '0 10px 26px -8px rgba(239, 68, 68, 0.15), 0 4px 12px rgba(0,0,0,0.4)' : undefined,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: isDue 
                    ? 'linear-gradient(90deg, #ef4444 0%, rgba(239, 68, 68, 0.3) 100%)' 
                    : 'linear-gradient(90deg, var(--brand-primary) 0%, rgba(16, 185, 129, 0.2) 100%)'
                }}
              />

              <div>
                {/* Header card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span className={`process-tag process-${eq.type}`} style={{ marginBottom: 6, display: 'inline-block' }}>
                      {eq.type}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {eq.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isDue ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        <AlertTriangle size={12} />
                        REVISÃO NECESSÁRIA
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6
                      }}>
                        <CheckCircle size={12} />
                        OPERACIONAL
                      </span>
                    )}

                    {/* Action buttons */}
                    <button
                      onClick={() => handleOpenHistoryModal(eq)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      title="Ver Histórico de Manutenções"
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(eq)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                      title="Editar Configurações"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer', padding: 4 }}
                      title="Excluir Equipamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Horometer Box */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 14,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>HORÔMETRO TOTAL</span>
                    <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                      {eq.total_hours}h
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>POTÊNCIA / HORA</span>
                    <div className="mono" style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {eq.power_watts}W <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({formatCurrency(eq.hourly_depreciation)}/h)</span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Progress Gauge */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Uso desde a última revisão: <strong style={{ color: 'var(--text-primary)' }}>{eq.hours_since_last_maint}h</strong> / {eq.maintenance_interval_hours}h
                    </span>
                    <span className="mono" style={{ fontWeight: 700, color: isDue ? '#f87171' : 'var(--text-muted)' }}>
                      {progress}%
                    </span>
                  </div>

                  <div className="progress-bar-bg" style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        width: `${progress}%`,
                        background: isDue ? '#ef4444' : progress > 75 ? '#f59e0b' : 'var(--brand-primary)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: '0.72rem', color: isDue ? '#f87171' : 'var(--text-muted)', marginTop: 6 }}>
                    {isDue 
                      ? '⚠️ Prazo preventivo atingido! Realize a lubrificação ou substitua peças de desgaste.'
                      : `Faltam ${eq.remainingHours}h para a próxima intervenção recomendada.`
                    }
                  </div>
                </div>

                {eq.notes && (
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 6, marginBottom: 14 }}>
                    ℹ️ {eq.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  className={`btn btn-sm ${isDue ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setSelectedEquipForMaint(eq)}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px 12px', fontWeight: 700 }}
                >
                  <Wrench size={13} />
                  <span>Registrar Manutenção</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenHistoryModal(eq)}
                  style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  title="Histórico de revisões"
                >
                  <History size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Maintenance Modal */}
      {selectedEquipForMaint && (
        <div className="modal-overlay" onClick={() => setSelectedEquipForMaint(null)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={18} color="var(--brand-primary)" />
                Registrar Manutenção: {selectedEquipForMaint.name}
              </h3>
              <button onClick={() => setSelectedEquipForMaint(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                    <option value="TROCA_PECA">Troca de Peça (Filme FEP, Bico, Correia, Filtros)</option>
                    <option value="CORRETIVA">Manutenção Corretiva (Conserto de Falha)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Descrição dos Serviços Realizados *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Ex: Limpeza com álcool isopropílico, aplicação de graxa PTFE nos eixos Z e troca do bico 0.4mm."
                    value={maintDesc}
                    onChange={e => setMaintDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Custo de Peças / Insumos (R$)</label>
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
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedEquipForMaint(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  Confirmar e Zerar Intervalo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyEquip && (
        <div className="modal-overlay" onClick={() => setHistoryEquip(null)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} color="var(--brand-primary)" />
                Histórico de Manutenções: {historyEquip.name}
              </h3>
              <button onClick={() => setHistoryEquip(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Carregando histórico...</div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <Wrench size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p style={{ fontSize: '0.88rem' }}>Nenhum registro de manutenção arquivado para este equipamento ainda.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {historyList.map((m: any) => (
                    <div
                      key={m.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: 8,
                        padding: 14,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: m.type === 'CORRETIVA' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: m.type === 'CORRETIVA' ? '#f87171' : '#34d399',
                            }}
                          >
                            {m.type}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} />
                            {formatDate(m.performed_at)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Às {m.hours_at_maint}h de uso
                          </span>
                          <span className="mono" style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.86rem' }}>
                            {formatCurrency(m.cost)}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                        {m.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setHistoryEquip(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Equipment Modal */}
      {isEquipModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEquipModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingEquipId ? <Edit3 size={18} color="var(--brand-primary)" /> : <Plus size={18} color="var(--brand-primary)" />}
                {editingEquipId ? 'Editar Parâmetros do Equipamento' : 'Cadastrar Novo Equipamento'}
              </h3>
              <button onClick={() => setIsEquipModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nome do Equipamento *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Bambu Lab X1 Carbon, Elegoo Saturn 4, Sculpfun S30 Pro, etc."
                    value={equipForm.name}
                    onChange={e => setEquipForm({ ...equipForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tipo / Processo</label>
                    <select
                      className="form-control"
                      value={equipForm.type}
                      onChange={e => setEquipForm({ ...equipForm, type: e.target.value })}
                    >
                      <option value="FDM">FDM (Filamento 3D)</option>
                      <option value="RESIN">Resina (SLA / DLP 3D)</option>
                      <option value="LASER">Corte & Gravação Laser</option>
                      <option value="AIRBRUSH">Aerógrafo / Pintura</option>
                      <option value="BOOTH">Cabine de Pintura</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Potência (Watts)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={equipForm.power_watts}
                      onChange={e => setEquipForm({ ...equipForm, power_watts: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Valor de Compra (R$)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      value={equipForm.purchase_cost}
                      onChange={e => setEquipForm({ ...equipForm, purchase_cost: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Intervalo de Revisão (h)</label>
                    <input
                      type="number"
                      className="form-control mono"
                      placeholder="Ex: 200"
                      value={equipForm.maintenance_interval_hours}
                      onChange={e => setEquipForm({ ...equipForm, maintenance_interval_hours: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Horômetro Total Acumulado (h)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control mono"
                    placeholder="0"
                    value={equipForm.total_hours}
                    onChange={e => setEquipForm({ ...equipForm, total_hours: Number(e.target.value) })}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Permite calibrar com as horas reais já marcadas no display da máquina.
                  </span>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Observações & Procedimentos Recomendados</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Ex: Limpeza com álcool isopropílico e lubrificação com graxa de PTFE nos fusos Z."
                    value={equipForm.notes}
                    onChange={e => setEquipForm({ ...equipForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEquipModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {editingEquipId ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
