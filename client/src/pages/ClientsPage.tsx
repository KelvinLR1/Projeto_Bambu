import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Users, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Search, 
  X, 
  Edit,
  ShoppingBag
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

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
      } else {
        await api.createClient({
          name,
          phone,
          email,
          document,
          address,
          notes,
        });
      }
      setIsModalOpen(false);
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

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestão de Clientes & Contatos WhatsApp</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Base de clientes, histórico de compras e integração direta com WhatsApp
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            width: 260
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <button className="btn btn-primary btn-sm" onClick={openNewModal}>
            <Plus size={16} />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 18 }}>
        {filteredClients.map(client => (
          <div
            key={client.id}
            className="glass-panel"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700 }}>
                  {client.name}
                </h3>
                <button
                  onClick={() => openEditModal(client)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4
                  }}
                  title="Editar dados"
                >
                  <Edit size={16} />
                </button>
              </div>

              {client.document && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  CPF/CNPJ: {client.document}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} color="var(--brand-primary)" />
                  <span>{client.phone}</span>
                </div>

                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} color="var(--accent-blue)" />
                    <span>{client.email}</span>
                  </div>
                )}

                {client.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="var(--accent-amber)" />
                    <span>{client.address}</span>
                  </div>
                )}
              </div>

              {client.notes && (
                <p style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginTop: 10,
                  fontStyle: 'italic'
                }}>
                  💬 {client.notes}
                </p>
              )}
            </div>

            <div style={{
              marginTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL INVESTIDO</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {formatCurrency(client.total_spent)} ({client.orders_count || 0} OS)
                </div>
              </div>

              <button
                className="btn btn-whatsapp btn-sm"
                onClick={() => handleOpenWhatsApp(client.phone)}
                title="Conversar diretamente no WhatsApp"
              >
                <MessageCircle size={15} />
                <span>Conversar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Client */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem' }}>
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
                      placeholder="Ex: 5511999998888"
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
                    placeholder="Ex: Colecionador de anime, gosta de pintura brilhante, arquiteto..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
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
