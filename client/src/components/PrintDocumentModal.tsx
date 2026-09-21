import React, { useState } from 'react';
import { formatCurrency, formatDate, formatDateTime, PROCESS_MAP } from '../utils/formatters';
import { Printer, X, Receipt, FileText } from 'lucide-react';

interface PrintDocumentModalProps {
  order: any;
  mode: 'A4' | 'THERMAL';
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  order,
  mode: initialMode,
  onClose,
}) => {
  const [mode, setMode] = useState<'A4' | 'THERMAL'>(initialMode);

  const handlePrint = () => {
    window.print();
  };

  const remaining = order.total_price - (order.down_payment || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: mode === 'THERMAL' ? 480 : 840,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="modal-header no-print"
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'nowrap'
          }}
        >
          {/* Seletor Segmentado de Formato (OS A4 vs Cupom 80mm) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            gap: 3
          }}>
            <button
              type="button"
              onClick={() => setMode('A4')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                background: mode === 'A4' ? 'var(--brand-primary)' : 'transparent',
                color: mode === 'A4' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: mode === 'A4' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
              }}
            >
              <FileText size={14} />
              <span>OS (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('THERMAL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 34,
                padding: '0 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                background: mode === 'THERMAL' ? 'var(--brand-primary)' : 'transparent',
                color: mode === 'THERMAL' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: mode === 'THERMAL' ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
              }}
            >
              <Receipt size={14} />
              <span>Cupom 80mm</span>
            </button>
          </div>

          {/* Ações: Imprimir Agora + Fechar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              type="button"
              className="btn btn-primary btn-sm" 
              onClick={handlePrint}
              style={{
                height: 34,
                padding: '0 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                gap: 6,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <Printer size={14} />
              <span>Imprimir Agora</span>
            </button>

            <button 
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ background: mode === 'THERMAL' ? '#f1f5f9' : '#fff', color: '#000', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: mode === 'THERMAL' ? '20px 16px' : 32, maxHeight: '82vh', overflowY: 'auto' }}>
          {mode === 'A4' ? (
            /* --- MODELO A4 ORDEM DE SERVIÇO --- */
            <div className="printable-document" style={{ fontFamily: 'var(--font-sans)', color: '#1a202c', fontSize: '0.9rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>PROJETO BAMBU</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Atelier de Manufatura 3D, Laser & Pintura Artesanal</p>
                  <p style={{ fontSize: '0.78rem', color: '#64748b' }}>WhatsApp: +55 (11) 98765-4321 • contato@bambustudio.com.br</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ORDEM DE SERVIÇO</div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
                    {order.order_number}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Emissão: {formatDateTime(order.created_at)}</p>
                </div>
              </div>

              {/* Client and Project Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 14, borderRadius: 6, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DADOS DO CLIENTE</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>{order.client_name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>Tel: {order.client_phone}</div>
                  {order.client_address && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.client_address}</div>}
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>PROJETO & STATUS</span>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>{order.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>Status: {order.status}</div>
                  {order.delivery_date && <div style={{ fontSize: '0.78rem', color: '#475569' }}>Previsão: {formatDate(order.delivery_date)}</div>}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Item</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Processo</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Descrição / Especificações</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>Qtd</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Preço Unit.</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{item.process_type}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div>{item.description}</div>
                        {item.material_name && <small style={{ color: '#64748b' }}>Matéria: {item.material_name}</small>}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals and Pix Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', width: '50%' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>CHAVE PIX PARA PAGAMENTO</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 4 }}>11987654321 (Telefone)</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Titular: Bambu Maker Studio Ltda</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                    Condições: 50% de sinal para início e 50% na retirada/envio.
                  </div>
                </div>

                <div style={{ width: '42%', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#64748b' }}>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(order.total_price)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#ef4444' }}>
                      <span>Desconto:</span>
                      <span>-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: '#10b981' }}>Sinal Pago (50%):</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(order.down_payment)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', marginTop: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Saldo Restante:</span>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: remaining > 0 ? '#0f172a' : '#10b981' }}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 50, paddingTop: 10 }}>
                <div style={{ width: '45%', borderTop: '1px solid #94a3b8', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  Assinatura do Atelier Responsável
                </div>
                <div style={{ width: '45%', borderTop: '1px solid #94a3b8', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                  Assinatura do Cliente ({order.client_name})
                </div>
              </div>
            </div>
          ) : (
            /* --- MODELO 80MM CUPOM TÉRMICO --- */
            <div 
              className="printable-document thermal-receipt" 
              style={{ 
                maxWidth: 360,
                margin: '0 auto',
                background: '#ffffff',
                color: '#000000',
                padding: '20px 20px 24px',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                fontFamily: 'monospace',
                fontSize: '10pt',
                lineHeight: 1.25
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold' }}>PROJETO BAMBU</h3>
                <div>ATELIER 3D / LASER / PINTURA</div>
                <div style={{ fontSize: '8pt' }}>Tel: (11) 98765-4321</div>
                <div style={{ fontSize: '8pt' }}>São Paulo - SP</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                <div><strong>OS: {order.order_number}</strong></div>
                <div>Data: {formatDateTime(order.created_at)}</div>
                <div>Cliente: {order.client_name}</div>
                <div>Tel: {order.client_phone}</div>
                <div>Status: {order.status}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>ITENS DO PEDIDO:</div>
                {order.items?.map((item: any, i: number) => (
                  <div key={item.id} style={{ marginBottom: 4 }}>
                    <div>{i + 1}. {item.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt' }}>
                      <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                      <strong>{formatCurrency(item.quantity * item.unit_price)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>VALOR TOTAL:</span>
                  <strong>{formatCurrency(order.total_price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SINAL PAGO:</span>
                  <span>{formatCurrency(order.down_payment)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', marginTop: 4 }}>
                  <span>A PAGAR:</span>
                  <span>{formatCurrency(remaining)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '8pt', paddingTop: 6 }}>
                <div>PAGAMENTO VIA PIX</div>
                <div>Chave: 11987654321</div>
                <div style={{ marginTop: 8 }}>Obrigado pela preferência!</div>
                <div>www.bambustudio.com.br</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
