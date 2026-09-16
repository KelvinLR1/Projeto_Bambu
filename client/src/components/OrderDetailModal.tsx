import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate, formatDateTime, STATUS_MAP, PROCESS_MAP, celebrateSuccess } from '../utils/formatters';
import { 
  X, 
  Printer, 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  Check, 
  Receipt, 
  Calendar, 
  User, 
  CreditCard,
  Layers,
  ChevronDown
} from 'lucide-react';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
  onOrderUpdated: () => void;
  onPrintA4: (order: any) => void;
  onPrintThermal: (order: any) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
  onOrderUpdated,
  onPrintA4,
  onPrintThermal,
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
      console.error(err);
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
      alert(err.message);
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
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: 500, padding: 30, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da Ordem de Serviço...</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_MAP[order.status as OrderStatus] || STATUS_MAP.ORCAMENTO;
  const remaining = order.total_price - (order.down_payment || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: 840 }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--brand-primary)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {order.order_number}
            </span>

            {/* Status Pill & Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={order.status}
                onChange={e => handleStatusChange(e.target.value as OrderStatus)}
                disabled={updatingStatus}
                className="form-control"
                style={{
                  padding: '4px 28px 4px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  height: 32,
                  width: 'auto',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer'
                }}
              >
                {Object.entries(STATUS_MAP).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onPrintThermal(order)}
              title="Cupom Térmico 80mm"
            >
              <Receipt size={15} />
              <span>Cupom 80mm</span>
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => onPrintA4(order)}
              title="Imprimir OS A4 Completa"
            >
              <Printer size={15} />
              <span>OS A4</span>
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Title & Client Card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Projeto / Serviço
              </span>
              <h3 style={{ fontSize: '1.05rem', marginTop: 2, marginBottom: 6 }}>
                {order.title}
              </h3>
              {order.notes && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 4 }}>
                  💬 {order.notes}
                </p>
              )}
            </div>

            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 16 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Dados do Cliente
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <User size={16} color="var(--brand-primary)" />
                <span style={{ fontWeight: 600 }}>{order.client_name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                📞 {order.client_phone} {order.client_email ? ` • ✉️ ${order.client_email}` : ''}
              </div>
              {order.client_address && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  📍 {order.client_address}
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Itens da Ordem de Serviço ({order.items?.length || 0})</h4>
              {order.delivery_date && (
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  Entrega prevista: {formatDate(order.delivery_date)}
                </span>
              )}
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Processo</th>
                    <th>Descrição & Detalhes</th>
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
                          <span className={`process-tag process-${item.process_type}`}>
                            {procInfo.icon} {procInfo.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{item.description}</div>
                          {item.material_name && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Material: {item.material_name}
                            </div>
                          )}
                          {item.equipment_name && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Equipamento: {item.equipment_name}
                            </div>
                          )}
                        </td>
                        <td className="mono">{item.quantity}</td>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.unit_cost)}</td>
                        <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(item.unit_price)}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {formatCurrency(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            background: 'var(--bg-surface)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CUSTO TOTAL DE PRODUÇÃO</div>
              <div className="mono" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                {formatCurrency(order.total_cost)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>VALOR TOTAL COBRADO</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                {formatCurrency(order.total_price)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SINAL DE ENTRADA (50%)</div>
              <div className="mono" style={{ fontSize: '1rem', color: order.down_payment > 0 ? '#34d399' : '#f87171' }}>
                {formatCurrency(order.down_payment)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SALDO NA RETIRADA</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: remaining > 0 ? 'var(--accent-amber)' : '#34d399' }}>
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>

          {/* WhatsApp Communications Module */}
          <div style={{
            background: 'rgba(37, 211, 102, 0.04)',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  background: '#25D366',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageCircle size={17} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Central de WhatsApp & Notificações</h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Envio com 1 clique para {order.client_phone}
                  </span>
                </div>
              </div>

              {/* Template Selectors */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(order.whatsapp?.templates || {}).map(([key, tpl]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateChange(key)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      background: selectedTemplateKey === key ? '#25D366' : 'rgba(255, 255, 255, 0.06)',
                      color: selectedTemplateKey === key ? '#ffffff' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {tpl.label.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <textarea
              className="form-control"
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                minHeight: 120,
                background: '#0d131f',
                borderColor: 'rgba(37, 211, 102, 0.25)'
              }}
            />

            {/* WhatsApp Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyMessage}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                className="btn btn-whatsapp btn-sm"
                onClick={handleSendWhatsApp}
              >
                <MessageCircle size={15} />
                <span>Enviar no WhatsApp</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
