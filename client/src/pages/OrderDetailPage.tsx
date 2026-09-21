import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { 
  formatCurrency, 
  formatDate, 
  STATUS_MAP, 
  PROCESS_MAP, 
  celebrateSuccess 
} from '../utils/formatters';
import { CustomSelect, SelectOption } from '../components/CustomSelect';
import { 
  ArrowLeft, 
  Printer, 
  Receipt, 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  Check, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Layers, 
  ChevronDown, 
  Clock, 
  AlertCircle,
  Sparkles,
  Package,
  Wrench
} from 'lucide-react';

interface OrderDetailPageProps {
  orderId: string;
  onBack: () => void;
  onOrderUpdated: () => void;
  onPrintA4: (order: any) => void;
  onPrintThermal: (order: any) => void;
  onSelectClient?: (clientId: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  orderId,
  onBack,
  onOrderUpdated,
  onPrintA4,
  onPrintThermal,
  onSelectClient,
}) => {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('ORCAMENTO');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getOrder(orderId);
      setOrder(data);

      // Default template based on status
      let defaultTpl = 'ORCAMENTO';
      if (['EM_IMPRESSAO', 'EM_PREPARACAO'].includes(data.status)) defaultTpl = 'EM_PRODUCAO';
      else if (['EM_PINTURA', 'SECAGEM_VERNIZ'].includes(data.status)) defaultTpl = 'EM_PINTURA';
      else if (data.status === 'PRONTO') defaultTpl = 'PRONTO';
      else if (data.status === 'APROVADO') defaultTpl = 'COBRANCA_LEMBRETE';

      setSelectedTemplateKey(defaultTpl);
      if (data.whatsapp?.templates?.[defaultTpl]) {
        setCustomMessage(data.whatsapp.templates[defaultTpl].text);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do pedido:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (key: string) => {
    setSelectedTemplateKey(key);
    if (order?.whatsapp?.templates?.[key]) {
      setCustomMessage(order.whatsapp.templates[key].text);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(true);
      await api.updateOrderStatus(order.id, newStatus);
      if (newStatus === 'ENTREGUE' || newStatus === 'PRONTO') {
        celebrateSuccess();
      }
      await loadOrder();
      onOrderUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!order?.client_phone || !customMessage) return;
    const cleanPhone = order.client_phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !order) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚙️</div>
          <p style={{ fontWeight: 600 }}>Carregando dados da Ordem de Serviço...</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_MAP[order.status as OrderStatus] || STATUS_MAP.ORCAMENTO;
  const remaining = order.total_price - (order.down_payment || 0);

  return (
    <div className="page-container">
      {/* 1. Header Superior de Navegação & Ações */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            title="Voltar à tela anterior"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mono" style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: 'var(--brand-primary)',
              background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid color-mix(in srgb, var(--brand-primary) 28%, transparent)',
            }}>
              {order.order_number}
            </span>

            {/* Seletor de Status Interativo no Padrão do Sistema */}
            <CustomSelect
              value={order.status}
              onChange={val => handleStatusChange(val as OrderStatus)}
              options={Object.entries(STATUS_MAP).map(([key, item]) => ({
                value: key,
                label: item.label,
                color: item.color,
              }))}
              disabled={updatingStatus}
              variant="pill"
              ariaLabel="Status do Pedido"
              style={{ minWidth: 155 }}
              menuStyle={{ minWidth: 180 }}
            />
          </div>
        </div>

        {/* Botões de Ação de Impressão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onPrintThermal(order)}
            title="Imprimir Cupom Térmico 80mm"
            style={{ fontSize: '0.84rem' }}
          >
            <Receipt size={15} color="var(--accent-amber)" />
            <span>Cupom 80mm</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onPrintA4(order)}
            title="Imprimir Ordem de Serviço A4 Completa"
            style={{ fontSize: '0.84rem' }}
          >
            <Printer size={15} color="#3b82f6" />
            <span>Imprimir OS A4</span>
          </button>
        </div>
      </div>

      {/* 2. Grid Principal: Detalhes do Projeto e Itens à Esquerda, Cliente e Financeiro à Direita */}
      <div className="order-detail-grid">
        {/* COLUNA ESQUERDA: PROJETO E ITENS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card Resumo do Projeto */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              Identificação do Trabalho / Projeto
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, marginBottom: 8 }}>
              {order.title}
            </h2>

            {order.notes && (
              <div style={{
                fontSize: '0.86rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                marginTop: 10,
              }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                  💬 Observações & Instruções de Oficina:
                </span>
                {order.notes}
              </div>
            )}

            {order.delivery_date && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 14,
                padding: '6px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--accent-amber)',
              }}>
                <Calendar size={14} />
                <span>Previsão de Entrega: {formatDate(order.delivery_date)}</span>
              </div>
            )}
          </div>

          {/* Tabela de Itens da OS */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Itens e Serviços Cadastrados ({order.items?.length || 0})
                </h3>
              </div>
            </div>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Processo</th>
                    <th>Descrição & Detalhes Técnicos</th>
                    <th>Qtd</th>
                    <th>Custo Unit.</th>
                    <th>Preço Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any) => {
                    const procInfo = PROCESS_MAP[item.process_type as keyof typeof PROCESS_MAP] || { label: item.process_type, icon: '⚙️' };
                    return (
                      <tr key={item.id}>
                        <td>
                          <span className={`process-tag process-${item.process_type}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span>{procInfo.icon}</span>
                            <span>{procInfo.label}</span>
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {item.description}
                          </div>
                          {item.material_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Package size={12} />
                              <span>Material: {item.material_name}</span>
                            </div>
                          )}
                          {item.equipment_name && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Wrench size={12} />
                              <span>Máquina: {item.equipment_name}</span>
                            </div>
                          )}
                        </td>
                        <td className="mono" style={{ fontWeight: 600 }}>{item.quantity}</td>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.unit_cost)}</td>
                        <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(item.unit_price)}</td>
                        <td className="mono" style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.92rem' }}>
                          {formatCurrency(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CLIENTE, FINANCEIRO E WHATSAPP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card do Cliente */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                Dados do Cliente
              </span>
              <User size={16} color="var(--brand-primary)" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div 
                onClick={() => {
                  if (order.client_id && onSelectClient) {
                    onSelectClient(order.client_id);
                  }
                }}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  cursor: order.client_id && onSelectClient ? 'pointer' : 'default',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (order.client_id && onSelectClient) {
                    e.currentTarget.style.color = 'var(--brand-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (order.client_id && onSelectClient) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                title={order.client_id && onSelectClient ? 'Abrir tela de perfil do cliente' : undefined}
              >
                {order.client_name}
              </div>

              {order.client_id && onSelectClient && (
                <button
                  type="button"
                  onClick={() => onSelectClient(order.client_id)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Abrir tela do cliente"
                >
                  <ExternalLink size={12} />
                  <span>Ver Perfil</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: '0.86rem' }}>
              {order.client_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Phone size={14} color="var(--text-muted)" />
                  <span className="mono">{order.client_phone}</span>
                </div>
              )}

              {order.client_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Mail size={14} color="var(--text-muted)" />
                  <span>{order.client_email}</span>
                </div>
              )}

              {order.client_address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{order.client_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Financeiro Consolidado */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                Resumo Financeiro da OS
              </span>
              <CreditCard size={16} color="var(--brand-primary)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>CUSTO DE PRODUÇÃO</div>
                <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {formatCurrency(order.total_cost)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid color-mix(in srgb, var(--brand-primary) 30%, var(--border-subtle))' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 2 }}>VALOR TOTAL</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                  {formatCurrency(order.total_price)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>SINAL DE ENTRADA</div>
                <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: order.down_payment > 0 ? '#34d399' : '#f87171' }}>
                  {formatCurrency(order.down_payment)}
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>SALDO NA RETIRADA</div>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: remaining > 0 ? 'var(--accent-amber)' : '#34d399' }}>
                  {formatCurrency(remaining)}
                </div>
              </div>
            </div>
          </div>

          {/* Central de WhatsApp & Notificações */}
          <div style={{
            background: 'color-mix(in srgb, #25D366 5%, var(--bg-card))',
            border: '1px solid color-mix(in srgb, #25D366 30%, var(--border-subtle))',
            borderRadius: 'var(--radius-lg)',
            padding: 22,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  background: '#25D366',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(37, 211, 102, 0.35)',
                }}>
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Central de WhatsApp</h4>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Envio direto para {order.client_phone || 'o cliente'}
                  </span>
                </div>
              </div>

              {/* Seletor de Templates Rápidos */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(order.whatsapp?.templates || {}).map(([key, tpl]: [string, any]) => {
                  const isSel = selectedTemplateKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleTemplateChange(key)}
                      style={{
                        padding: '5px 11px',
                        fontSize: '0.74rem',
                        fontWeight: isSel ? 700 : 500,
                        borderRadius: 'var(--radius-sm)',
                        background: isSel ? '#25D366' : 'var(--bg-surface)',
                        color: isSel ? '#ffffff' : 'var(--text-secondary)',
                        border: isSel ? '1px solid #25D366' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {tpl.label.split('/')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caixa de Mensagem Editável */}
            <textarea
              className="form-control"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                minHeight: 140,
                background: 'var(--bg-surface)',
                borderColor: 'color-mix(in srgb, #25D366 30%, var(--border-subtle))',
                lineHeight: 1.5,
              }}
            />

            {/* Ações de Envio e Cópia */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar Mensagem'}</span>
              </button>

              <button
                className="btn btn-whatsapp"
                onClick={handleSendWhatsApp}
                style={{ padding: '8px 18px', fontSize: '0.86rem' }}
              >
                <MessageCircle size={16} />
                <span>Enviar no WhatsApp</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
