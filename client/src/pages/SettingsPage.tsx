import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SYSTEM_THEMES, applyTheme, getCurrentThemeId, SystemTheme } from '../utils/theme';
import {
  Save,
  Check,
  Zap,
  DollarSign,
  Palette,
  Building2,
  MessageCircle,
  Database,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
  FileText,
  Smartphone,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

type SettingsSubTab = 'atelier' | 'costs' | 'themes' | 'whatsapp' | 'system';

export const SettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('themes');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Themes state
  const [currentThemeId, setCurrentThemeId] = useState<string>(getCurrentThemeId());
  const [themeModeFilter, setThemeModeFilter] = useState<'ALL' | 'light' | 'dark'>('ALL');
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    setCurrentThemeId(getCurrentThemeId());
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettings(data.map || {});
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSelectTheme = (theme: SystemTheme) => {
    applyTheme(theme.id);
    setCurrentThemeId(theme.id);
    setThemeSuccessMsg(`Tema "${theme.name}" (${theme.mode === 'light' ? 'Claro' : 'Escuro'}) aplicado com sucesso!`);
    setTimeout(() => setThemeSuccessMsg(null), 3000);
  };

  // Filtrar temas por modo (Todos / Claros / Escuros)
  const filteredThemes = SYSTEM_THEMES.filter(t => {
    return themeModeFilter === 'ALL' || t.mode === themeModeFilter;
  });

  const lightCount = SYSTEM_THEMES.filter(t => t.mode === 'light').length;
  const darkCount = SYSTEM_THEMES.filter(t => t.mode === 'dark').length;

  const currentThemeObj = SYSTEM_THEMES.find(t => t.id === currentThemeId) || SYSTEM_THEMES[0];

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {themeSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--brand-primary)',
            color: '#000000',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 800,
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={18} />
          <span>{themeSuccessMsg}</span>
        </div>
      )}

      {/* Header Principal */}
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
            Configurações & Parâmetros do Sistema
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Gerencie identidade do atelier, custos operacionais, temas visuais, mensagens e rotinas.
          </p>
        </div>

        {saved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            <Check size={16} />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* SUB-MENU SEGMENTADO MODERNO E LIMPO */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 10,
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('themes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeSubTab === 'themes' ? 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' : 'transparent',
            color: activeSubTab === 'themes' ? 'var(--brand-primary)' : 'var(--text-secondary)',
          }}
        >
          <Palette size={16} />
          <span>Aparência & Temas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('atelier')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeSubTab === 'atelier' ? 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' : 'transparent',
            color: activeSubTab === 'atelier' ? 'var(--brand-primary)' : 'var(--text-secondary)',
          }}
        >
          <Building2 size={16} />
          <span>Atelier & Pix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('costs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeSubTab === 'costs' ? 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' : 'transparent',
            color: activeSubTab === 'costs' ? 'var(--brand-primary)' : 'var(--text-secondary)',
          }}
        >
          <Zap size={16} />
          <span>Custos & Precificação</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('whatsapp')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeSubTab === 'whatsapp' ? 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' : 'transparent',
            color: activeSubTab === 'whatsapp' ? 'var(--brand-primary)' : 'var(--text-secondary)',
          }}
        >
          <MessageCircle size={16} />
          <span>WhatsApp & Mensagens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('system')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeSubTab === 'system' ? 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' : 'transparent',
            color: activeSubTab === 'system' ? 'var(--brand-primary)' : 'var(--text-secondary)',
          }}
        >
          <Database size={16} />
          <span>Sistema & Dados</span>
        </button>
      </div>

      {/* CONTEÚDO DE ACORDO COM A SUB-TAB ATIVA */}

      {/* ========================================================
          SUB-TAB 1: PERSONALIZAÇÃO & TEMAS (DESIGN ULTRA CLEAN)
      ======================================================== */}
      {activeSubTab === 'themes' && (
        <div>
          {/* Header Compacto com Controle de Modo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Aparência da Interface
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Tema ativo: <strong style={{ color: 'var(--brand-primary)' }}>{currentThemeObj.name}</strong> • {currentThemeObj.mode === 'light' ? 'Modo Claro' : 'Modo Escuro'}
              </p>
            </div>

            {/* Segmented Control Limpo (Todos / Claro / Escuro) */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--bg-surface)',
                padding: 3,
                borderRadius: 9,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setThemeModeFilter('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: themeModeFilter === 'ALL' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: themeModeFilter === 'ALL' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                Todos ({SYSTEM_THEMES.length})
              </button>
              <button
                type="button"
                onClick={() => setThemeModeFilter('light')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: themeModeFilter === 'light' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: themeModeFilter === 'light' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                ☀️ Claros ({lightCount})
              </button>
              <button
                type="button"
                onClick={() => setThemeModeFilter('dark')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: themeModeFilter === 'dark' ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: themeModeFilter === 'dark' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                🌙 Escuros ({darkCount})
              </button>
            </div>
          </div>

          {/* Grid de Mini-Mockups (Estilo Apple macOS / Linear) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
              gap: 14,
            }}
          >
            {filteredThemes.map(theme => {
              const isSelected = theme.id === currentThemeId;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    padding: 8,
                    background: isSelected ? 'color-mix(in srgb, var(--brand-primary) 8%, transparent)' : 'transparent',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 16px color-mix(in srgb, var(--brand-primary) 30%, transparent)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-highlight)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {/* Mini Window Preview (Apple macOS Style) */}
                  <div
                    style={{
                      height: 80,
                      borderRadius: 8,
                      background: theme.previewColors.bg,
                      border: '1px solid rgba(128, 128, 128, 0.2)',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Mini Sidebar */}
                    <div
                      style={{
                        width: '28%',
                        height: '100%',
                        background: theme.previewColors.surface,
                        borderRight: '1px solid rgba(128, 128, 128, 0.15)',
                        padding: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.previewColors.primary }} />
                      <div style={{ width: '80%', height: 3, borderRadius: 2, background: 'rgba(128, 128, 128, 0.3)', marginTop: 2 }} />
                      <div style={{ width: '60%', height: 3, borderRadius: 2, background: 'rgba(128, 128, 128, 0.2)' }} />
                    </div>

                    {/* Mini Content Area */}
                    <div
                      style={{
                        flex: 1,
                        padding: 7,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '50%', height: 4, borderRadius: 2, background: 'rgba(128, 128, 128, 0.3)' }} />
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: theme.previewColors.accent,
                          }}
                        />
                      </div>

                      {/* Mini Primary Button / Accent */}
                      <div
                        style={{
                          height: 16,
                          borderRadius: 4,
                          background: theme.previewColors.primary,
                          opacity: 0.95,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ width: '40%', height: 2, borderRadius: 1, background: '#ffffff', opacity: 0.8 }} />
                      </div>

                      <div style={{ display: 'flex', gap: 3 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 3, background: theme.previewColors.surface }} />
                        <div style={{ flex: 1, height: 8, borderRadius: 3, background: theme.previewColors.surface }} />
                      </div>
                    </div>
                  </div>

                  {/* Nome do Tema & Checkmark */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {theme.name}
                    </span>

                    {isSelected && (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: 'var(--brand-primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: DADOS DO ATELIER & PIX
      ======================================================== */}
      {activeSubTab === 'atelier' && (
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Informações Gerais do Negócio */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={20} color="var(--brand-primary)" />
                Identificação do Atelier & Oficina
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Nome Fantasia do Atelier</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Bambu Maker Studio"
                    value={settings['atelier_name'] || ''}
                    onChange={e => handleChange('atelier_name', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CNPJ ou CPF do Responsável</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="00.000.000/0001-00"
                    value={settings['atelier_document'] || ''}
                    onChange={e => handleChange('atelier_document', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp Oficial de Atendimento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="5511999998888"
                    value={settings['atelier_phone'] || ''}
                    onChange={e => handleChange('atelier_phone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail de Contato Comercial</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="contato@atelier.com.br"
                    value={settings['atelier_email'] || ''}
                    onChange={e => handleChange('atelier_email', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Endereço Completo do Atelier (Para Retiradas)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                    value={settings['atelier_address'] || ''}
                    onChange={e => handleChange('atelier_address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dados de Pagamento Pix */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--brand-primary)" />
                Configuração de Pagamento Pix (Orçamentos & Recibos)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Chave Pix para Recebimento</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: CNPJ, telefone, e-mail ou aleatória"
                    value={settings['atelier_pix_key'] || ''}
                    onChange={e => handleChange('atelier_pix_key', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Titular da Conta Bancária</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Studio Bambu Impressão 3D Ltda"
                    value={settings['atelier_pix_name'] || ''}
                    onChange={e => handleChange('atelier_pix_name', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Rodapé e Termos de Garantia */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--brand-primary)" />
                Rodapé & Observações Padrão das Ordens de Serviço (Impressão A4 / Térmica)
              </h3>

              <div className="form-group">
                <label className="form-label">Texto de Garantia & Termos de Retirada</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Ex: Garantia de 30 dias contra delaminação ou defeitos de fabricação. Peças não retiradas em até 60 dias serão descartadas."
                  value={settings['order_footer_notes'] || ''}
                  onChange={e => handleChange('order_footer_notes', e.target.value)}
                />
              </div>
            </div>

            {/* Salvar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: 800 }}>
                <Save size={18} />
                <span>Salvar Informações do Atelier</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================
          SUB-TAB 3: CUSTOS & PRECIFICAÇÃO
      ======================================================== */}
      {activeSubTab === 'costs' && (
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Energia & Mão de Obra */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={20} color="var(--accent-amber)" />
                Taxas de Energia & Mão de Obra Técnica (Hora)
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
                Estes valores são usados como referência automática na Calculadora de Custos de Impressão FDM, Resina, Laser e Acabamento.
              </p>

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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Tarifa média de eletricidade da sua região</small>
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Design 3D, engenharia reversa e ajustes de STL</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Hora Operador de Máquina (R$/h)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-control mono"
                    value={settings['print_operator_rate_hour'] || '25'}
                    onChange={e => handleChange('print_operator_rate_hour', e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Fatiamento, troca de filamento e supervisão</small>
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Lixamento, primer, pintura e verniz</small>
                </div>
              </div>
            </div>

            {/* Margens & Condições Comerciais */}
            <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={20} color="var(--brand-primary)" />
                Margens de Lucro & Condições Padrão
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
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Margem aplicada sobre o custo total de fabricação</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Sinal de Entrada Padrão (%)</label>
                  <input
                    type="number"
                    className="form-control mono"
                    value={settings['default_down_payment_percent'] || '50'}
                    onChange={e => handleChange('default_down_payment_percent', e.target.value)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Percentual exigido antes de iniciar a impressão</small>
                </div>
              </div>
            </div>

            {/* Salvar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: 800 }}>
                <Save size={18} />
                <span>Salvar Custos & Precificação</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================
          SUB-TAB 4: WHATSAPP & MENSAGENS
      ======================================================== */}
      {activeSubTab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={20} color="var(--brand-primary)" />
              Automação de Mensagens WhatsApp
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              O sistema gera automaticamente os links oficiais do WhatsApp Web com texto formatado contendo dados da OS, valores e chaves Pix.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Template 1 */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--brand-primary)', marginBottom: 8, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  <span>1. Envio de Orçamento</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Olá, [Cliente]! Tudo bem? Segue o orçamento da sua OS [Número]: [Projeto]. Valor Total: R$ [Valor]. Chave Pix para confirmação: [Pix]..."
                </div>
              </div>

              {/* Template 2 */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#38bdf8', marginBottom: 8, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  <span>2. Produção Iniciada</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Olá, [Cliente]! Seu pedido [Número] entrou na linha de produção nas impressoras Bambu Lab! Previsão de conclusão: [Data]..."
                </div>
              </div>

              {/* Template 3 */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#22c55e', marginBottom: 8, fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  <span>3. Pedido Pronto para Retirada</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: 12, borderRadius: 8, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "Boas notícias, [Cliente]! Sua encomenda [Número] está 100% pronta e inspecionada! Você já pode retirar no atelier no endereço: [Endereço]..."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: SISTEMA & DADOS
      ======================================================== */}
      {activeSubTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={20} color="var(--brand-primary)" />
              Armazenamento & Banco de Dados
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MOTOR DE BANCO</div>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  SQLite (Local / Zero Latência)
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERSÃO DO PROJETO BAMBU</div>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 4 }}>
                  v0.1.0 Pro Studio
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: 16, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MODO DE EXECUÇÃO</div>
                <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                  Fullstack Node + Vite React
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  alert('Backup realizado: Os dados ficam salvos no arquivo "bambu.db" na pasta server/src/database.');
                }}
              >
                <Database size={16} />
                <span>Informações de Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
