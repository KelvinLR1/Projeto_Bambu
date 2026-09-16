import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Settings, Save, Check, ShieldCheck, Zap, DollarSign, Palette } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data.map || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Configurações & Parâmetros Base do Atelier</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Valores base para a calculadora de custos, energia, taxas horárias e dados para WhatsApp / Pix
          </p>
        </div>

        {saved && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <Check size={16} />
            <span>Configurações salvas!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Identificação do Negócio & Pix */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="var(--brand-primary)" />
              Identificação do Atelier & Chave Pix
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome Fantasia do Atelier</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings['atelier_name'] || ''}
                  onChange={e => handleChange('atelier_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Oficial do Negócio</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings['atelier_phone'] || ''}
                  onChange={e => handleChange('atelier_phone', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chave Pix para Recebimento</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: telefone, e-mail ou aleatória"
                  value={settings['atelier_pix_key'] || ''}
                  onChange={e => handleChange('atelier_pix_key', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Titular da Conta Pix</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings['atelier_pix_name'] || ''}
                  onChange={e => handleChange('atelier_pix_name', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Taxas Horárias & Energia */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color="var(--accent-amber)" />
              Custos Fixos, Energia & Mão de Obra Técnica
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Custo Energia (R$ / kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control mono"
                  value={settings['kwh_cost'] || '0.92'}
                  onChange={e => handleChange('kwh_cost', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Modelagem / CAD (R$/h)</label>
                <input
                  type="number"
                  step="1"
                  className="form-control mono"
                  value={settings['cad_rate_hour'] || '60'}
                  onChange={e => handleChange('cad_rate_hour', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Operador Máquina (R$/h)</label>
                <input
                  type="number"
                  step="1"
                  className="form-control mono"
                  value={settings['print_operator_rate_hour'] || '25'}
                  onChange={e => handleChange('print_operator_rate_hour', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hora Artesão / Pintor (R$/h)</label>
                <input
                  type="number"
                  step="1"
                  className="form-control mono"
                  value={settings['painter_rate_hour'] || '45'}
                  onChange={e => handleChange('painter_rate_hour', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Margens Padrão */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="var(--accent-purple)" />
              Margem de Lucro & Condições Comerciais
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Margem de Lucro Padrão (%)</label>
                <input
                  type="number"
                  className="form-control mono"
                  value={settings['default_profit_margin'] || '65'}
                  onChange={e => handleChange('default_profit_margin', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sinal de Entrada Padrão (%)</label>
                <input
                  type="number"
                  className="form-control mono"
                  value={settings['default_down_payment_percent'] || '50'}
                  onChange={e => handleChange('default_down_payment_percent', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              <Save size={18} />
              <span>Salvar Todas as Configurações</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
