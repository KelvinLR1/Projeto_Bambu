import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate, STATUS_MAP } from '../utils/formatters';
import { 
  FileText, 
  CheckCircle, 
  Printer, 
  Wrench, 
  Paintbrush, 
  Wind, 
  PackageCheck, 
  CheckCheck,
  Calendar,
  MessageCircle,
  Clock
} from 'lucide-react';

interface KanbanBoardProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onSelectOrder: (order: Order) => void;
}

const COLUMNS: { id: OrderStatus; label: string; icon: any; color: string }[] = [
  { id: 'ORCAMENTO', label: 'Orçamento', icon: FileText, color: '#94a3b8' },
  { id: 'APROVADO', label: 'Aprovado', icon: CheckCircle, color: '#3b82f6' },
  { id: 'EM_IMPRESSAO', label: 'Em Impressão', icon: Printer, color: '#10b981' },
  { id: 'EM_PREPARACAO', label: 'Preparação / Pós', icon: Wrench, color: '#f59e0b' },
  { id: 'EM_PINTURA', label: 'Em Pintura', icon: Paintbrush, color: '#a855f7' },
  { id: 'SECAGEM_VERNIZ', label: 'Secagem / Verniz', icon: Wind, color: '#06b6d4' },
  { id: 'PRONTO', label: 'Pronto Retirada', icon: PackageCheck, color: '#22c55e' },
  { id: 'ENTREGUE', label: 'Entregue / Concluído', icon: CheckCheck, color: '#64748b' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  onStatusChange,
  onSelectOrder,
}) => {
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDragOver = (e: React.DragEvent, colId: OrderStatus) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId;
    if (orderId) {
      await onStatusChange(orderId, newStatus);
    }
    setDraggedOrderId(null);
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map(col => {
        const colOrders = orders.filter(o => o.status === col.id);
        const colTotal = colOrders.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
        const Icon = col.icon;
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            className="kanban-column"
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.id)}
            style={{
              borderColor: isTarget ? col.color : undefined,
              background: isTarget ? 'rgba(25, 36, 58, 0.85)' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Column Header */}
            <div className="kanban-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: col.color,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Icon size={16} />
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{col.label}</span>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)'
                }}>
                  {colOrders.length}
                </span>
              </div>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {formatCurrency(colTotal)}
              </span>
            </div>

            {/* Column Body / Draggable Cards */}
            <div className="kanban-body">
              {colOrders.length === 0 ? (
                <div style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  border: '1px dashed rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  margin: 'auto 0'
                }}>
                  Nenhum pedido nesta etapa
                </div>
              ) : (
                colOrders.map(order => {
                  const remaining = order.total_price - (order.down_payment || 0);

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={e => handleDragStart(e, order.id)}
                      onClick={() => onSelectOrder(order)}
                      className={`kanban-card ${draggedOrderId === order.id ? 'is-dragging' : ''}`}
                    >
                      {/* OS Number & Status badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {order.order_number}
                        </span>
                        {order.delivery_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <Calendar size={12} />
                            <span>{formatDate(order.delivery_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Project Title */}
                      <h4 style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 6,
                        lineHeight: 1.3
                      }}>
                        {order.title}
                      </h4>

                      {/* Client Name */}
                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>👤 {order.client_name || 'Cliente'}</span>
                        {order.client_phone && (
                          <span 
                            style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrder(order);
                            }}
                            title="Abrir WhatsApp para este pedido"
                          >
                            <MessageCircle size={13} />
                          </span>
                        )}
                      </div>

                      {/* Footer: Prices and Down Payment */}
                      <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        paddingTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL</div>
                          <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(order.total_price)}
                          </div>
                        </div>

                        {order.down_payment > 0 ? (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: '#10b981' }}>SINAL PAGO</div>
                            <div className="mono" style={{ fontSize: '0.75rem', color: '#34d399' }}>
                              {formatCurrency(order.down_payment)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#f87171',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}>
                              Aguardando Sinal
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
