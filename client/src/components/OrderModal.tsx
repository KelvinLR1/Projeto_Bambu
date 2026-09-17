import React, { useState, useEffect } from 'react';
import { Client, ProcessType, Product } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { X, Plus, Trash2, Calculator, Check, ShoppingBag, Zap } from 'lucide-react';

interface OrderModalProps {
  onClose: () => void;
  onOrderCreated: () => void;
  initialItem?: any; // If triggered from Calculator or Product Catalog!
}

export const OrderModal: React.FC<OrderModalProps> = ({
  onClose,
  onOrderCreated,
  initialItem,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [materials, setMaterials] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [] });
  const [equipments, setEquipments] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const [title, setTitle] = useState(initialItem ? `Produção: ${initialItem.description}` : '');
  const [status, setStatus] = useState('ORCAMENTO');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [downPaymentPercent, setDownPaymentPercent] = useState(50);
  const [registerCashTransaction, setRegisterCashTransaction] = useState(true);

  // Items
  const [items, setItems] = useState<any[]>(
    initialItem
      ? [initialItem]
      : [
          {
            process_type: 'FDM',
            description: '',
            quantity: 1,
            material_id: '',
            equipment_id: '',
            unit_cost: 0,
            unit_price: 0,
          },
        ]
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cls, mats, eqs, prods] = await Promise.all([
        api.getClients(),
        api.getMaterials(),
        api.getEquipments(),
        api.getProducts(),
      ]);
      setClients(cls);
      setMaterials(mats);
      setEquipments(eqs);
      setCatalogProducts(prods);
      if (cls.length > 0 && !clientId) {
        setClientId(cls[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCatalogProduct = (productId: string) => {
    if (!productId) return;
    const prod = catalogProducts.find(p => p.id === productId);
    if (!prod) return;

    if (!title.trim()) {
      setTitle(`Produção: ${prod.name}`);
    }

    const newItem = {
      process_type: prod.process_type,
      description: `[${prod.sku || 'PRD'}] ${prod.name}`,
      quantity: 1,
      material_id: prod.material_id || '',
      equipment_id: prod.equipment_id || '',
      unit_cost: prod.unit_cost || 0,
      unit_price: prod.unit_price || 0,
    };

    // If there's only 1 item and it's empty, replace it
    if (items.length === 1 && !items[0].description.trim() && items[0].unit_price === 0) {
      setItems([newItem]);
    } else {
      setItems([...items, newItem]);
    }
    setSelectedCatalogId('');
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        process_type: 'FDM',
        description: '',
        quantity: 1,
        material_id: '',
        equipment_id: '',
        unit_cost: 0,
        unit_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Totals
  const totalCost = items.reduce((acc, it) => acc + (Number(it.unit_cost) || 0) * (Number(it.quantity) || 1), 0);
  const totalPrice = items.reduce((acc, it) => acc + (Number(it.unit_price) || 0) * (Number(it.quantity) || 1), 0);
  const downPaymentAmount = Number(((totalPrice * downPaymentPercent) / 100).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor informe o título do pedido.');
      return;
    }

    try {
      setLoading(true);

      let finalClientId = clientId;
      if (newClientMode) {
        if (!newClientName || !newClientPhone) {
          alert('Nome e WhatsApp do novo cliente são obrigatórios.');
          setLoading(false);
          return;
        }
        const createdClient = await api.createClient({
          name: newClientName,
          phone: newClientPhone,
        });
        finalClientId = createdClient.id;
      }

      await api.createOrder({
        client_id: finalClientId,
        title,
        status,
        total_cost: totalCost,
        total_price: totalPrice,
        margin_percent: totalCost > 0 ? Math.round(((totalPrice - totalCost) / totalCost) * 100) : 50,
        down_payment: downPaymentAmount,
        payment_status: downPaymentAmount > 0 && status !== 'ORCAMENTO' ? 'SINAL_PAGO' : 'PENDENTE',
        payment_method: paymentMethod,
        delivery_date: deliveryDate || null,
        notes: notes || null,
        items,
        registerPaymentTransaction: registerCashTransaction && downPaymentAmount > 0 && status !== 'ORCAMENTO',
      });

      onOrderCreated();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              display: 'flex'
            }}>
              <Plus size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Novo Pedido & Ordem de Serviço</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Client Section */}
            <div style={{ background: 'var(--bg-surface)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="form-label" style={{ margin: 0 }}>Vincular Cliente</span>
                <button
                  type="button"
                  onClick={() => setNewClientMode(!newClientMode)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {newClientMode ? '← Escolher existente' : '+ Cadastrar Novo Cliente'}
                </button>
              </div>

              {newClientMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome Completo do Cliente *"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="WhatsApp (ex: 11999998888) *"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <select
                  className="form-control"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* General Order Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Título do Projeto *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Estátua Wolverine 1/6, Maquete, etc."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Status Inicial</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="ORCAMENTO">Orçamento</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="EM_IMPRESSAO">Em Impressão</option>
                  <option value="EM_PREPARACAO">Em Preparação</option>
                  <option value="EM_PINTURA">Em Pintura</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Previsão Entrega</label>
                <input
                  type="date"
                  className="form-control"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Itens do Pedido ({items.length})</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddItem}
                  >
                    <Plus size={14} />
                    <span>Item Manual</span>
                  </button>
                </div>
              </div>

              {/* Quick Select from Product Catalog */}
              {catalogProducts.length > 0 && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                    <ShoppingBag size={16} />
                    <span>Puxar Peça Pré-Cadastrada:</span>
                  </div>
                  <select
                    className="form-control"
                    style={{ flex: 1, minWidth: 200, fontSize: '0.84rem' }}
                    value={selectedCatalogId}
                    onChange={e => handleSelectCatalogProduct(e.target.value)}
                  >
                    <option value="">-- Escolha um produto do catálogo para auto-preencher --</option>
                    {catalogProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} ({p.process_type}) — {formatCurrency(p.unit_price)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 12,
                      display: 'grid',
                      gridTemplateColumns: '130px 1fr 70px 100px 110px 36px',
                      gap: 8,
                      alignItems: 'center'
                    }}
                  >
                    {/* Process */}
                    <select
                      className="form-control"
                      value={item.process_type}
                      onChange={e => handleItemChange(idx, 'process_type', e.target.value)}
                    >
                      <option value="FDM">FDM</option>
                      <option value="RESIN">Resina</option>
                      <option value="LASER">Laser</option>
                      <option value="PINTURA">Pintura</option>
                      <option value="COMBO">Combo</option>
                    </select>

                    {/* Description */}
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Descrição do item / peça"
                      value={item.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      required
                    />

                    {/* Quantity */}
                    <input
                      type="number"
                      min="1"
                      className="form-control mono"
                      placeholder="Qtd"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      required
                    />

                    {/* Unit Cost */}
                    <input
                      type="number"
                      step="0.01"
                      className="form-control mono"
                      placeholder="Custo R$"
                      value={item.unit_cost}
                      onChange={e => handleItemChange(idx, 'unit_cost', Number(e.target.value))}
                      title="Custo unitário de produção"
                    />

                    {/* Unit Price */}
                    <input
                      type="number"
                      step="0.01"
                      className="form-control mono"
                      placeholder="Preço R$"
                      value={item.unit_price}
                      onChange={e => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                      title="Preço cobrado do cliente"
                      required
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length <= 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: items.length > 1 ? '#ef4444' : 'var(--text-muted)',
                        cursor: items.length > 1 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Totals */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 14,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
              alignItems: 'center'
            }}>
              <div>
                <label className="form-label">Forma de Pagamento</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="PIX">Pix</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="DINHEIRO">Dinheiro</option>
                </select>
              </div>

              <div>
                <label className="form-label">Sinal de Entrada</label>
                <select
                  className="form-control"
                  value={downPaymentPercent}
                  onChange={e => setDownPaymentPercent(Number(e.target.value))}
                >
                  <option value={0}>Sem Sinal (0%)</option>
                  <option value={30}>30% de Entrada</option>
                  <option value={50}>50% de Entrada (Padrão)</option>
                  <option value={100}>100% Antecipado</option>
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL COBRADO:</div>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  {formatCurrency(totalPrice)}
                </div>
                {downPaymentAmount > 0 && (
                  <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
                    Sinal ({downPaymentPercent}%): {formatCurrency(downPaymentAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Observações e Especificações do Cliente</label>
              <textarea
                className="form-control"
                placeholder="Ex: Cor matte especial, cuidados na embalagem, etc."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
