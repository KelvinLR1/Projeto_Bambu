import React, { useState, useEffect } from 'react';
import { Client, Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate, STATUS_MAP } from '../utils/formatters';
import {
  X,
  Clock,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Mail,
  MapPin,
  FileText,
  Plus,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
  AlertCircle,
  Star,
  Edit3
} from 'lucide-react';

interface ClientHistoryModalProps {
  clientId: string;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
  onNewOrderForClient?: (clientId: string) => void;
  onEditClient?: (client: Client) => void;
}

export const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  clientId,
  onClose,
  onSelectOrder,
  onNewOrderForClient,
  onEditClient,
}) => {
  const [client, setClient] = useState<(Client & { orders?: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getClient(clientId);
      setClient(data);
    } catch (err: any) {
      console.error('Erro ao carregar histórico do cliente:', err);
      setError(err.message || 'Erro ao carregar os dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhatsApp = (phoneStr?: string) => {
    if (!phoneStr) return;
    const clean = phoneStr.replace(/\D/g, '');
    const full = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${full}`, '_blank');
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'CL';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarGradient = (str?: string) => {
    const gradients = [
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    ];
    let hash = 0;
    const s = str || 'default';
    for (let i = 0; i < s.length; i++) hash += s.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const orders = client?.orders || [];
  const totalSpent = client?.total_spent ?? orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0;
  const completedOrders = orders.filter(o => o.status === 'ENTREGUE' || o.status === 'PRONTO').length;
  const inProgressOrders = orders.filter(o => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO').length;
  const isVip = totalSpent >= 1000;

  // Agrupar itens e peças solicitadas
  const frequentItems: { name: string; count: number; process: string }[] = [];
  const itemMap: Record<string, { count: number; process: string }> = {};

  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const key = item.description?.trim();
        if (key) {
          if (!itemMap[key]) {
            itemMap[key] = { count: 0, process: item.process_type || 'FDM' };
          }
          itemMap[key].count += item.quantity || 1;
        }
      });
    }
  });

  Object.entries(itemMap).forEach(([name, val]) => {
    frequentItems.push({ name, count: val.count, process: val.process });
  });
  frequentItems.sort((a, b) => b.count - a.count);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 1000,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
              <div>
                <div style={{ width: 180, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
              </div>
            </div>
          ) : client ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: getAvatarGradient(client.name),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}
              >
                {getInitials(client.name)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {client.name}
                  </h2>

                  {isVip && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: 'rgba(245, 158, 11, 0.18)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        padding: '2px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                      title="Cliente VIP - Faturamento acumulado superior a R$ 1.000,00"
                    >
                      <Star size={11} />
                      CLIENTE VIP
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {client.document && <span>CPF/CNPJ: <strong style={{ color: 'var(--text-secondary)' }}>{client.document}</strong></span>}
                  <span>•</span>
                  <span>Cadastrado em: {formatDate(client.created_at)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {client && (
              <>
                <button
                  onClick={() => handleOpenWhatsApp(client.phone)}
                  className="btn btn-whatsapp btn-sm"
                  style={{ fontWeight: 700, padding: '7px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  title="Abrir WhatsApp Web"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </button>

                {onNewOrderForClient && (
                  <button
                    onClick={() => {
                      onClose();
                      onNewOrderForClient(client.id);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700, padding: '7px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    title="Criar nova ordem de serviço para este cliente"
                  >
                    <Plus size={15} />
                    <span>Nova OS</span>
                  </button>
                )}

                {onEditClient && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditClient(client);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '7px 12px', borderRadius: 8 }}
                    title="Editar dados cadastrais"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 4,
              }}
              title="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando histórico completo do cliente...
            </div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#f87171' }}>
              <AlertCircle size={36} style={{ marginBottom: 10 }} />
              <div>{error}</div>
            </div>
          ) : client ? (
            <>
              {/* 1. Barra de Contatos e Endereço */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '14px 16px',
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <MessageCircle size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TELEFONE / WHATSAPP</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{client.phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Mail size={15} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>E-MAIL</div>
                    <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client.email || 'Não informado'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 9, gridColumn: 'span 1' }}>
                  <MapPin size={15} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENDEREÇO DE ENTREGA</div>
                    <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={client.address}>
                      {client.address || 'Não cadastrado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações / Notas do Cliente (se houver) */}
              {client.notes && (
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    padding: '12px 16px',
                    borderRadius: 10,
                    marginBottom: 22,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <FileText size={18} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Observações & Preferências Técnicas do Cliente
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {client.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. KPIs Financeiros & Históricos do Cliente */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-primary)', marginBottom: 4 }}>
                    <DollarSign size={16} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-muted)' }}>
                      TOTAL GASTO (LTV)
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                    {formatCurrency(totalSpent)}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-blue)', marginBottom: 4 }}>
                    <ShoppingBag size={16} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-muted)' }}>
                      TOTAL DE PEDIDOS
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {orders.length} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>OS</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 4 }}>
                    <TrendingUp size={16} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-muted)' }}>
                      TICKET MÉDIO
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
                    {formatCurrency(avgTicket)}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '14px 16px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', marginBottom: 4 }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-muted)' }}>
                      STATUS DAS OS
                    </span>
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    <span style={{ color: '#10b981' }}>{completedOrders} concluídas</span>
                    {inProgressOrders > 0 && <span style={{ color: '#38bdf8' }}> • {inProgressOrders} ativas</span>}
                  </div>
                </div>
              </div>

              {/* 3. Peças Recorrentes / Itens Mais Pedidos (se houver) */}
              {frequentItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 10 }}>
                    PEÇAS & MODELOS FREQUENTES NESTE CLIENTE
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {frequentItems.map((fi, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: '0.78rem',
                        }}
                      >
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>{fi.count}x</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fi.name}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            background: 'rgba(255,255,255,0.07)',
                            borderRadius: 4,
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          {fi.process}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Timeline / Histórico Cronológico de Ordens de Serviço */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={17} color="var(--brand-primary)" />
                    <span>Histórico de Ordens de Serviço ({orders.length})</span>
                  </h3>

                  {onNewOrderForClient && (
                    <button
                      onClick={() => {
                        onClose();
                        onNewOrderForClient(client.id);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    >
                      <Plus size={13} />
                      <span>Adicionar Pedido</span>
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div
                    className="glass-panel"
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      borderRadius: 12,
                    }}
                  >
                    <ShoppingBag size={40} style={{ opacity: 0.25, marginBottom: 10 }} />
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 12px 0' }}>
                      Nenhum pedido ou ordem de serviço vinculada a este cliente ainda.
                    </p>
                    {onNewOrderForClient && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          onClose();
                          onNewOrderForClient(client.id);
                        }}
                      >
                        <Plus size={14} />
                        <span>Criar Primeira Ordem de Serviço</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {orders.map((ord: any) => {
                      const statusConfig = STATUS_MAP[ord.status as OrderStatus] || {
                        label: ord.status,
                        color: 'var(--text-muted)',
                      };

                      return (
                        <div
                          key={ord.id}
                          className="glass-panel"
                          style={{
                            padding: '16px 18px',
                            borderRadius: 12,
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Cabeçalho da Ordem */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: 12,
                              flexWrap: 'wrap',
                              marginBottom: 10,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span
                                className="mono"
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 800,
                                  color: 'var(--brand-primary)',
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                }}
                              >
                                {ord.order_number}
                              </span>

                              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {ord.title}
                              </h4>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {/* Status Badge */}
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 6,
                                  background: `color-mix(in srgb, ${statusConfig.color} 15%, transparent)`,
                                  color: statusConfig.color,
                                  border: `1px solid color-mix(in srgb, ${statusConfig.color} 35%, transparent)`,
                                }}
                              >
                                {statusConfig.label}
                              </span>

                              {/* Valor da Ordem */}
                              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                                {formatCurrency(ord.total_price)}
                              </span>

                              {/* Botão para Abrir OS */}
                              {onSelectOrder && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onSelectOrder(ord.id);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '0.76rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                  title="Ver todos os detalhes desta OS"
                                >
                                  <span>Abrir OS</span>
                                  <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Datas & Prazos */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                              fontSize: '0.76rem',
                              color: 'var(--text-muted)',
                              marginBottom: 10,
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={13} />
                              Criado em: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(ord.created_at)}</strong>
                            </span>

                            {ord.delivery_date && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={13} />
                                Prazo entrega: <strong style={{ color: 'var(--text-secondary)' }}>{formatDate(ord.delivery_date)}</strong>
                              </span>
                            )}

                            {ord.notes && (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                                Nota: "{ord.notes}"
                              </span>
                            )}
                          </div>

                          {/* Itens e Peças Desta OS */}
                          {ord.items && ord.items.length > 0 && (
                            <div
                              style={{
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 8,
                                padding: '8px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                              }}
                            >
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                Peças e Serviços Inclusos ({ord.items.length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {ord.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      fontSize: '0.78rem',
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid rgba(255,255,255,0.05)',
                                      padding: '3px 8px',
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Layers size={12} color="var(--brand-primary)" />
                                    <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{item.quantity}x</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      ({formatCurrency(item.unit_price)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
