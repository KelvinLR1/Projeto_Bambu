import React, { useState, useEffect } from 'react';
import { Client, Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate, STATUS_MAP, PROCESS_MAP } from '../utils/formatters';
import {
  ArrowLeft,
  MessageCircle,
  Mail,
  MapPin,
  FileText,
  Plus,
  ExternalLink,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Star,
  Edit3,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Save,
  X
} from 'lucide-react';

interface ClientDetailPageProps {
  clientId: string;
  onBack: () => void;
  onSelectOrder?: (orderId: string) => void;
  onNewOrderForClient?: (clientId: string) => void;
  onClientUpdated?: () => void;
}

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  clientId,
  onBack,
  onSelectOrder,
  onNewOrderForClient,
  onClientUpdated,
}) => {
  const [client, setClient] = useState<(Client & { orders?: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Edição de Dados do Cliente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    document: '',
    address: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getClient(clientId);
      setClient(data);
      if (data) {
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          document: data.document || '',
          address: data.address || '',
          notes: data.notes || '',
        });
      }
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    try {
      setSavingEdit(true);
      await api.updateClient(client.id, editForm);
      setIsEditModalOpen(false);
      await loadClientData();
      if (onClientUpdated) onClientUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⚙️</div>
          <p style={{ fontWeight: 600 }}>Carregando dados do cliente e histórico de pedidos...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="page-container">
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} />
          <span>Voltar</span>
        </button>
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: '#f87171' }}>
          <AlertCircle size={40} style={{ marginBottom: 12 }} />
          <h3>Erro ao carregar cliente</h3>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>{error || 'Cliente não encontrado no sistema.'}</p>
        </div>
      </div>
    );
  }

  const orders = client.orders || [];
  const totalSpent = client.total_spent ?? orders.reduce((acc, o) => acc + (o.total_price || 0), 0);
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0;
  const completedOrders = orders.filter(o => o.status === 'ENTREGUE' || o.status === 'PRONTO').length;
  const inProgressOrders = orders.filter(o => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO').length;
  const isVip = totalSpent >= 1000;

  // Peças frequentes
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

  const frequentItems: { name: string; count: number; process: string }[] = [];
  Object.entries(itemMap).forEach(([name, val]) => {
    frequentItems.push({ name, count: val.count, process: val.process });
  });
  frequentItems.sort((a, b) => b.count - a.count);

  return (
    <div className="page-container">
      {/* 1. Header de Navegação e Perfil */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            title="Voltar à lista de clientes"
          >
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: getAvatarGradient(client.name),
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.15rem',
                letterSpacing: '0.04em',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.15)',
              }}
            >
              {getInitials(client.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {client.name}
                </h2>

                {isVip && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: 'rgba(245, 158, 11, 0.18)',
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Cliente VIP - Faturamento acumulado superior a R$ 1.000,00"
                  >
                    <Star size={12} />
                    CLIENTE VIP
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {client.document && (
                  <span>
                    CPF/CNPJ: <strong style={{ color: 'var(--text-secondary)' }}>{client.document}</strong>
                  </span>
                )}
                {client.document && <span>•</span>}
                <span>Cadastrado em: {formatDate(client.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {client.phone && (
            <button
              className="btn btn-whatsapp"
              onClick={() => handleOpenWhatsApp(client.phone)}
              style={{ fontSize: '0.84rem', height: 36, padding: '0 14px' }}
              title="Abrir WhatsApp Web"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </button>
          )}

          {onNewOrderForClient && (
            <button
              className="btn btn-primary"
              onClick={() => onNewOrderForClient(client.id)}
              style={{ fontSize: '0.84rem', height: 36, padding: '0 14px' }}
              title="Criar nova ordem de serviço vinculada a este cliente"
            >
              <Plus size={15} />
              <span>Nova OS</span>
            </button>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
            style={{ fontSize: '0.84rem', height: 36, padding: '0 14px' }}
            title="Editar dados cadastrais do cliente"
          >
            <Edit3 size={15} />
            <span>Editar Dados</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de KPIs Principais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand-primary)', marginBottom: 6 }}>
            <DollarSign size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              TOTAL GASTO (LTV)
            </span>
          </div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
            {formatCurrency(totalSpent)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-blue)', marginBottom: 6 }}>
            <ShoppingBag size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              TOTAL DE PEDIDOS
            </span>
          </div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {orders.length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>OS cadastradas</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 6 }}>
            <TrendingUp size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              TICKET MÉDIO
            </span>
          </div>
          <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-secondary)' }}>
            {formatCurrency(avgTicket)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', marginBottom: 6 }}>
            <Clock size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              STATUS DAS ORDENS
            </span>
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            <span style={{ color: '#10b981' }}>{completedOrders} concluídas</span>
            {inProgressOrders > 0 && <span style={{ color: '#38bdf8' }}> • {inProgressOrders} ativas</span>}
          </div>
        </div>
      </div>

      {/* 3. Grade Principal de Conteúdo */}
      <div className="order-detail-grid">
        {/* COLUNA ESQUERDA: HISTÓRICO DE ORDENS DE SERVIÇO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={18} color="var(--brand-primary)" />
                  <span>Histórico de Ordens de Serviço ({orders.length})</span>
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Trabalhos solicitados e acompanhamento financeiro individual
                </p>
              </div>

              {onNewOrderForClient && (
                <button
                  onClick={() => onNewOrderForClient(client.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <Plus size={14} />
                  <span>Adicionar Pedido</span>
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingBag size={38} style={{ opacity: 0.25, marginBottom: 10 }} />
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 12px 0' }}>
                  Nenhuma ordem de serviço vinculada a este cliente ainda.
                </p>
                {onNewOrderForClient && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onNewOrderForClient(client.id)}
                  >
                    <Plus size={14} />
                    <span>Criar Primeira Ordem de Serviço</span>
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {orders.map((ord: any) => {
                  const statusConfig = STATUS_MAP[ord.status as OrderStatus] || {
                    label: ord.status,
                    color: 'var(--text-muted)',
                  };

                  return (
                    <div
                      key={ord.id}
                      style={{
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-highlight)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Header Strip: OS number + Status color accent */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: 'rgba(255,255,255,0.02)',
                          gap: 12,
                        }}
                      >
                        {/* Left: OS badge + title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: 'var(--brand-primary)',
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              padding: '2px 8px',
                              borderRadius: 5,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {ord.order_number}
                          </span>
                          <h4
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={ord.title}
                          >
                            {ord.title}
                          </h4>
                        </div>

                        {/* Right: Status + price + action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 9px',
                              borderRadius: 5,
                              background: `color-mix(in srgb, ${statusConfig.color} 15%, transparent)`,
                              color: statusConfig.color,
                              border: `1px solid color-mix(in srgb, ${statusConfig.color} 35%, transparent)`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {statusConfig.label}
                          </span>

                          <span className="mono" style={{ fontSize: '1.0rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                            {formatCurrency(ord.total_price)}
                          </span>

                          {onSelectOrder && (
                            <button
                              onClick={() => onSelectOrder(ord.id)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '4px 11px',
                                fontSize: '0.76rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                whiteSpace: 'nowrap',
                              }}
                              title="Ver tela completa desta OS"
                            >
                              <span>Abrir OS</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Body: meta info + notes + items */}
                      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Dates row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <Calendar size={12} />
                            <span>Criado em: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatDate(ord.created_at)}</strong></span>
                          </span>

                          {ord.delivery_date && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              <Clock size={12} />
                              <span>Entrega: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatDate(ord.delivery_date)}</strong></span>
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {ord.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: 2 }}>
                            💬 "{ord.notes}"
                          </div>
                        )}

                        {/* Items */}
                        {ord.items && ord.items.length > 0 && (
                          <div
                            style={{
                              background: 'rgba(0,0,0,0.18)',
                              borderRadius: 6,
                              padding: '8px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 5,
                            }}
                          >
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                              Itens e Serviços Cadastrados:
                            </span>
                            {ord.items.map((item: any) => {
                              const meta = (PROCESS_MAP as any)[item.process_type] || { icon: '📦', label: item.process_type };
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: '0.78rem',
                                  }}
                                >
                                  <span style={{ flexShrink: 0 }}>{meta.icon}</span>
                                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)', flexShrink: 0 }}>{item.quantity}x</span>
                                  <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.description}
                                  </span>
                                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.74rem', flexShrink: 0 }}>
                                    ({formatCurrency(item.unit_price * item.quantity)})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Peças & Modelos Frequentes */}
          {frequentItems.length > 0 && (
            <div className="glass-panel" style={{ padding: 22 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }}>
                Peças & Modelos Recorrentes Solicitados por Este Cliente
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {frequentItems.map((fi, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                    }}
                  >
                    <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>{fi.count}x</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fi.name}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
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
        </div>

        {/* COLUNA DIREITA: CONTATO, LOCALIZAÇÃO E OBSERVAÇÕES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card de Contato */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>
              Informações de Contato & Entrega
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Telefone / WhatsApp */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(37, 211, 102, 0.15)', padding: 9, borderRadius: 8, color: '#25D366' }}>
                  <MessageCircle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TELEFONE / WHATSAPP</div>
                  <div style={{ fontSize: '0.94rem', color: 'var(--text-primary)', fontWeight: 700, marginTop: 2 }}>
                    {client.phone || 'Não informado'}
                  </div>
                </div>
                {client.phone && (
                  <button
                    className="btn btn-whatsapp btn-sm"
                    onClick={() => handleOpenWhatsApp(client.phone)}
                    style={{ height: 32, padding: '0 10px', fontSize: '0.76rem' }}
                    title="Abrir WhatsApp"
                  >
                    Conversar
                  </button>
                )}
              </div>

              {/* E-mail */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: 9, borderRadius: 8, color: '#3b82f6' }}>
                  <Mail size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>E-MAIL</div>
                  <div style={{ fontSize: '0.94rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
                    {client.email || 'Não informado'}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 9, borderRadius: 8, color: '#f59e0b' }}>
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENDEREÇO DE ENTREGA</div>
                  <div style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                    {client.address || 'Nenhum endereço cadastrado'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações e Perfil Técnico */}
          <div className="glass-panel" style={{ padding: 22 }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 10 }}>
              Perfil Técnico & Observações do Atelier
            </div>

            {client.notes ? (
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 16px',
                  borderRadius: 8,
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {client.notes}
              </div>
            ) : (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhuma observação técnica registrada para este cliente.
              </p>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsEditModalOpen(true)}
              style={{ marginTop: 14, width: '100%' }}
            >
              <Edit3 size={14} />
              <span>{client.notes ? 'Editar Observações' : 'Adicionar Observações'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edição Cadastral Rápida */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 540, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Editar Cliente</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo / Empresa *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CPF / CNPJ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.document}
                      onChange={(e) => setEditForm((p) => ({ ...p, document: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço de Entrega</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.address}
                    onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Observações & Preferências Técnicas</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary"
                >
                  <Save size={15} />
                  <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
