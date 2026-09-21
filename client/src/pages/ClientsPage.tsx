import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { 
  Users, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Search, 
  X, 
  Edit3,
  Trash2,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  List,
  LayoutGrid,
  TrendingUp,
  Star,
  Clock
} from 'lucide-react';
import { ClientHistoryModal } from '../components/ClientHistoryModal';

interface ClientsPageProps {
  onSelectOrder?: (orderId: string) => void;
  onNewOrderForClient?: (clientId: string) => void;
}

export const ClientsPage: React.FC<ClientsPageProps> = ({
  onSelectOrder,
  onNewOrderForClient,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedHistoryClientId, setSelectedHistoryClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'VIP'>('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingClient(null);
    setName('');
    setPhone('');
    setEmail('');
    setDocument('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setDocument(c.document || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, {
          name,
          phone,
          email,
          document,
          address,
          notes,
        });
        showToast('Cliente atualizado com sucesso!');
      } else {
        await api.createClient({
          name,
          phone,
          email,
          document,
          address,
          notes,
        });
        showToast('Novo cliente cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      await loadClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?`)) return;
    try {
      await api.deleteClient(id);
      showToast(`Cliente "${clientName}" removido.`);
      await loadClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenWhatsApp = (phoneStr: string) => {
    const clean = phoneStr.replace(/\D/g, '');
    const full = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${full}`, '_blank');
  };

  // Avatar Initials
  const getInitials = (fullName: string) => {
    if (!fullName) return 'CL';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Avatar Gradient
  const getAvatarGradient = (str: string) => {
    const gradients = [
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  // KPIs
  const totalLTV = useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.total_spent || 0), 0);
  }, [clients]);

  const totalOrders = useMemo(() => {
    return clients.reduce((acc, c) => acc + (c.orders_count || 0), 0);
  }, [clients]);

  const avgTicket = useMemo(() => {
    return clients.length > 0 ? totalLTV / clients.length : 0;
  }, [clients, totalLTV]);

  // Filtered
  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return clients.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.document && c.document.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      if (filterType === 'ACTIVE') return matchSearch && (c.orders_count || 0) > 0;
      if (filterType === 'VIP') return matchSearch && (c.total_spent || 0) >= 1000;
      return matchSearch;
    });
  }, [clients, searchTerm, filterType]);

  return (
    <div style={{ maxWidth: 1680, margin: '0 auto', padding: '24px 28px' }}>
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

      {/* 1. Header com Título e Ação Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Base de Clientes & CRM
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Gestão de carteira, histórico acumulado de compras (LTV) e disparos diretos de WhatsApp.
          </p>
        </div>

        <button className="btn btn-primary" onClick={openNewModal} style={{ fontWeight: 700, padding: '9px 18px' }}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* 2. KPIs Rápidos da Carteira de Clientes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>TOTAL DE CLIENTES</div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {clients.length} <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>cadastrados</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>FATURAMENTO TOTAL (LTV)</div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 2 }}>
              {formatCurrency(totalLTV)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>ORDENS DE SERVIÇO</div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              {totalOrders} <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>pedidos</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>TICKET MÉDIO / CLIENTE</div>
            <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: 2 }}>
              {formatCurrency(avgTicket)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Barra de Controles: Busca, Filtros Rápidos & Alternador de Visualização */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        {/* Campo de Busca */}
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 460 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome, telefone, e-mail, documento ou endereço..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 38, height: 40, fontSize: '0.86rem' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros de Segmentação e Alternador de Modo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`filter-chip ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              Todos ({clients.length})
            </button>
            <button
              className={`filter-chip ${filterType === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilterType('ACTIVE')}
            >
              Com Pedidos
            </button>
            <button
              className={`filter-chip ${filterType === 'VIP' ? 'active' : ''}`}
              onClick={() => setFilterType('VIP')}
              style={{ color: filterType === 'VIP' ? '#f59e0b' : undefined }}
            >
              <Star size={12} style={{ display: 'inline', marginRight: 4 }} />
              Top Clientes (&gt; R$ 1k)
            </button>
          </div>

          {/* Alternador Lista vs Cards */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: 3, borderRadius: 8, gap: 2 }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'table' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
              title="Visualização em Lista / Tabela"
            >
              <List size={14} />
              <span>Lista</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                border: 'none',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
              title="Visualização em Cards"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTEÚDO PRINCIPAL (Tabela ou Cards Equilibrados) */}
      {filteredClients.length === 0 ? (
        <div className="glass-panel" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <Users size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Nenhum cliente encontrado com os filtros atuais.
          </p>
          {searchTerm && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchTerm('')} style={{ marginTop: 12 }}>
              Limpar busca
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ========================================================
           MODO 1: LISTAGEM EM TABELA MODERNA (ESTILO AIRTABLE/LINEAR)
        ======================================================== */
        <div className="table-container" style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Cliente</th>
                <th style={{ minWidth: 170 }}>WhatsApp / Contato</th>
                <th style={{ minWidth: 200 }}>E-mail</th>
                <th style={{ minWidth: 220 }}>Localização</th>
                <th style={{ minWidth: 160 }}>Histórico & LTV</th>
                <th style={{ minWidth: 220 }}>Observações / Perfil</th>
                <th style={{ textAlign: 'right', minWidth: 100 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const initials = getInitials(client.name);
                const avatarBg = getAvatarGradient(client.name);
                const isVip = (client.total_spent || 0) >= 1000;

                return (
                  <tr key={client.id} style={{ transition: 'background 0.15s ease' }}>
                    {/* Cliente com Avatar e Iniciais (Clicável para Histórico) */}
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                        onClick={() => setSelectedHistoryClientId(client.id)}
                        title="Clique para ver o histórico completo deste cliente"
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: avatarBg,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            letterSpacing: '0.04em',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                            transition: 'transform 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                              {client.name}
                            </span>
                            {isVip && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                                title="Cliente VIP (+R$ 1.000 investidos)"
                              >
                                VIP
                              </span>
                            )}
                          </div>
                          {client.document && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                              CPF/CNPJ: {client.document}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* WhatsApp Direto */}
                    <td>
                      <button
                        onClick={() => handleOpenWhatsApp(client.phone)}
                        className="btn btn-whatsapp"
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: 7,
                          gap: 6,
                          display: 'inline-flex',
                        }}
                        title="Iniciar conversa no WhatsApp Web"
                      >
                        <MessageCircle size={13} />
                        <span>{client.phone}</span>
                      </button>
                    </td>

                    {/* E-mail */}
                    <td>
                      {client.email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Mail size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.email}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>

                    {/* Localização */}
                    <td>
                      {client.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={13} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }} title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>

                    {/* LTV & Pedidos (Clicável para Histórico) */}
                    <td>
                      <div
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedHistoryClientId(client.id)}
                        title="Ver histórico de compras e ordens de serviço"
                      >
                        <div className="mono" style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.94rem' }}>
                          {formatCurrency(client.total_spent || 0)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {client.orders_count || 0} {client.orders_count === 1 ? 'pedido realizado' : 'pedidos realizados'}
                        </div>
                      </div>
                    </td>

                    {/* Observações / Perfil */}
                    <td>
                      {client.notes ? (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '4px 8px',
                            borderRadius: 6,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 240,
                          }}
                          title={client.notes}
                        >
                          💬 {client.notes}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => setSelectedHistoryClientId(client.id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '4px 9px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderColor: 'rgba(16, 185, 129, 0.25)',
                            color: 'var(--brand-primary)',
                          }}
                          title="Ver histórico completo de compras e ordens de serviço"
                        >
                          <Clock size={13} />
                          <span>Histórico</span>
                        </button>

                        <button
                          onClick={() => openEditModal(client)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-secondary)',
                            borderRadius: 6,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                          title="Editar cadastro"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            borderRadius: 6,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          title="Excluir cliente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========================================================
           MODO 2: GRADE MODERNA (ORGANIZADA & EQUILIBRADA)
        ======================================================== */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filteredClients.map((client) => {
            const initials = getInitials(client.name);
            const avatarBg = getAvatarGradient(client.name);
            const isVip = (client.total_spent || 0) >= 1000;

            return (
              <div
                key={client.id}
                className="glass-panel"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div>
                  {/* Top card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      onClick={() => setSelectedHistoryClientId(client.id)}
                      title="Ver histórico deste cliente"
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: avatarBg,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                        }}
                      >
                        {initials}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {client.name}
                          </h3>
                          {isVip && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '1px 5px', borderRadius: 4 }}>
                              VIP
                            </span>
                          )}
                        </div>
                        {client.document && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            CPF/CNPJ: {client.document}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => openEditModal(client)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        title="Editar"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 4 }}
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Informações de Contato */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={13} color="var(--brand-primary)" />
                      <span>{client.phone}</span>
                    </div>

                    {client.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={13} color="var(--text-muted)" />
                        <span>{client.email}</span>
                      </div>
                    )}

                    {client.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={13} color="var(--accent-amber)" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.address}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      marginTop: 10,
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                    }}>
                      💬 {client.notes}
                    </p>
                  )}
                </div>

                {/* Rodapé do Card */}
                <div style={{
                  marginTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL INVESTIDO</div>
                    <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {formatCurrency(client.total_spent || 0)}{' '}
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({client.orders_count || 0} OS)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedHistoryClientId(client.id)}
                      style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="Ver histórico de ordens de serviço"
                    >
                      <Clock size={13} />
                      <span>Histórico</span>
                    </button>

                    <button
                      className="btn btn-whatsapp btn-sm"
                      onClick={() => handleOpenWhatsApp(client.phone)}
                      style={{ fontSize: '0.76rem', padding: '5px 12px' }}
                      title="Conversar diretamente no WhatsApp"
                    >
                      <MessageCircle size={14} />
                      <span>Conversar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Histórico Completo do Cliente */}
      {selectedHistoryClientId && (
        <ClientHistoryModal
          clientId={selectedHistoryClientId}
          onClose={() => setSelectedHistoryClientId(null)}
          onSelectOrder={onSelectOrder}
          onNewOrderForClient={onNewOrderForClient}
          onEditClient={openEditModal}
        />
      )}

      {/* Modal for Client */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--brand-primary)" />
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: João da Silva / Studio XYZ"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: 11999998888"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">CPF ou CNPJ</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="000.000.000-00"
                      value={document}
                      onChange={e => setDocument(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Endereço de Entrega</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Preferências / Observações</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Ex: Colecionador de anime, gosta de acabamento brilhante, arquiteto..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
