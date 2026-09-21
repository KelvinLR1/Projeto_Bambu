import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate, STATUS_MAP } from '../utils/formatters';
import { CustomSelect } from '../components/CustomSelect';
import { Search, Filter, Eye, MessageCircle, FileText, Calendar } from 'lucide-react';

interface OrdersPageProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onNewOrder: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  orders,
  onSelectOrder,
  onNewOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.client_name && o.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      {/* Header & Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Ordens de Serviço & Pedidos</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Listagem completa de projetos com histórico financeiro e atalhos de impressão
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            width: 280
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por OS, cliente ou projeto..."
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

          {/* Filter Status no Padrão do Sistema */}
          <CustomSelect
            value={statusFilter}
            onChange={val => setStatusFilter(val)}
            options={[
              { value: 'ALL', label: `Todos os Status (${orders.length})` },
              ...Object.entries(STATUS_MAP).map(([key, item]) => ({
                value: key,
                label: item.label,
                color: item.color,
                badge: String(orders.filter(o => o.status === key).length),
              })),
            ]}
            ariaLabel="Filtrar por Status"
            style={{ minWidth: 200 }}
            menuStyle={{ minWidth: 230 }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>OS / Número</th>
              <th>Cliente</th>
              <th>Projeto / Título</th>
              <th>Status</th>
              <th>Itens</th>
              <th>Entrega Prevista</th>
              <th>Valor Total</th>
              <th>Sinal (50%)</th>
              <th>Saldo</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhuma ordem de serviço encontrada com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.ORCAMENTO;
                const remaining = order.total_price - (order.down_payment || 0);

                return (
                  <tr 
                    key={order.id} 
                    onClick={() => onSelectOrder(order)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono" style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {order.order_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.client_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.client_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.title}</div>
                      {order.notes && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                          {order.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status-${order.status}`}>
                        <span className="status-dot" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="mono">{order.items_count || 1} item(ns)</td>
                    <td>
                      {order.delivery_date ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formatDate(order.delivery_date)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td className="mono" style={{ fontWeight: 700 }}>
                      {formatCurrency(order.total_price)}
                    </td>
                    <td className="mono" style={{ color: order.down_payment > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {formatCurrency(order.down_payment)}
                    </td>
                    <td className="mono" style={{ fontWeight: 600, color: remaining > 0 ? 'var(--accent-amber)' : '#34d399' }}>
                      {formatCurrency(remaining)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                      >
                        <Eye size={14} />
                        <span>Ver OS</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
