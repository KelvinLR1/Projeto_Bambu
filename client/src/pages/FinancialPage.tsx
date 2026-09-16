import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  PieChart, 
  Filter, 
  X,
  CreditCard,
  Wallet
} from 'lucide-react';

export const FinancialPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [txCategory, setTxCategory] = useState('Compra Filamento');
  const [txAmount, setTxAmount] = useState(150);
  const [txMethod, setTxMethod] = useState('PIX');
  const [txNotes, setTxNotes] = useState('');

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [sum, txs] = await Promise.all([
        api.getFinancialSummary(),
        api.getTransactions(),
      ]);
      setSummary(sum);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTransaction({
        type: txType,
        category: txCategory,
        amount: txAmount,
        payment_method: txMethod,
        status: 'PAGO',
        notes: txNotes || null,
      });
      setIsModalOpen(false);
      setTxNotes('');
      await loadFinancialData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Controle Financeiro & Fluxo de Caixa</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Receitas de pedidos e sinais, despesas operacionais com insumos e análise de margem real
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Receitas */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Receitas Realizadas
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: 4, borderRadius: '50%' }}>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399', marginTop: 4 }}>
            {formatCurrency(summary?.totalIncome)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Pedidos quitados e sinais recebidos
          </span>
        </div>

        {/* Despesas */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Despesas Totais
            </span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: 4, borderRadius: '50%' }}>
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171', marginTop: 4 }}>
            {formatCurrency(summary?.totalExpense)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Insumos, energia, manutenção e custos
          </span>
        </div>

        {/* Lucro Líquido */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Lucro Líquido Real
            </span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: 4, borderRadius: '50%' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: (summary?.netProfit || 0) >= 0 ? 'var(--brand-primary)' : '#f87171', marginTop: 4 }}>
            {formatCurrency(summary?.netProfit)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Margem Líquida Global: <strong>{summary?.profitMargin || 0}%</strong>
          </span>
        </div>

        {/* Contas a Receber */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Saldos a Receber na Entrega
            </span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: 4, borderRadius: '50%' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: 4 }}>
            {formatCurrency(summary?.pendingReceivable)}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Pedidos em andamento com saldo pendente
          </span>
        </div>
      </div>

      {/* Analytics: Rentabilidade por Processo & Despesas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 24 }}>
        {/* Rentabilidade por Processo */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>
            Rentabilidade Real por Tipo de Processo
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary?.processProfitability?.map((proc: any) => (
              <div key={proc.process_type} style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span className={`process-tag process-${proc.process_type}`}>
                    {proc.process_type}
                  </span>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {proc.total_items} item(ns) produzidos
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                    Lucro: {formatCurrency(proc.profit)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Receita: {formatCurrency(proc.revenue)} • Margem: <strong style={{ color: '#34d399' }}>{proc.margin}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas por Categoria */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>
            Despesas por Categoria
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary?.expensesByCategory?.map((cat: any) => (
              <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{cat.category} ({cat.count}x):</span>
                <span className="mono" style={{ fontWeight: 700, color: '#f87171' }}>
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Extrato do Fluxo de Caixa */}
      <div className="table-container">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Extrato de Lançamentos Financeiros</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {transactions.length} transação(ões) registradas
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Descrição / Observação</th>
              <th>Método</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const isIncome = tx.type === 'RECEITA';
              return (
                <tr key={tx.id}>
                  <td>{formatDate(tx.transaction_date)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isIncome ? '#34d399' : '#f87171'
                    }}>
                      {isIncome ? '+ RECEITA' : '- DESPESA'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{tx.category}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {tx.notes || (tx.order_number ? `Vinculado à ${tx.order_number}` : '-')}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{tx.payment_method}</span>
                  </td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 800, color: isIncome ? '#34d399' : '#f87171' }}>
                    {isIncome ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal for New Transaction */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem' }}>Novo Lançamento no Fluxo de Caixa</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Tipo de Lançamento</label>
                    <select
                      className="form-control"
                      value={txType}
                      onChange={e => setTxType(e.target.value as any)}
                    >
                      <option value="DESPESA">Despesa (Saída)</option>
                      <option value="RECEITA">Receita (Entrada)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-control"
                      value={txCategory}
                      onChange={e => setTxCategory(e.target.value)}
                    >
                      {txType === 'DESPESA' ? (
                        <>
                          <option value="Compra Filamento">Compra de Filamento</option>
                          <option value="Compra Resina">Compra de Resina</option>
                          <option value="Compra Tintas">Tintas, Primers & Verniz</option>
                          <option value="Energia Eletrica">Conta de Luz / Energia</option>
                          <option value="Manutencao">Peças & Manutenção</option>
                          <option value="Custos Fixos">Aluguel / Custos Fixos</option>
                          <option value="Outros">Outras Despesas</option>
                        </>
                      ) : (
                        <>
                          <option value="Venda Pedido">Venda de Pedido</option>
                          <option value="Sinal Pedido">Sinal de Pedido (50%)</option>
                          <option value="Servico Avulso">Serviço Avulso / Modelagem</option>
                          <option value="Outros">Outras Entradas</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control mono"
                      value={txAmount}
                      onChange={e => setTxAmount(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Forma de Pagamento</label>
                    <select
                      className="form-control"
                      value={txMethod}
                      onChange={e => setTxMethod(e.target.value)}
                    >
                      <option value="PIX">Pix</option>
                      <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                      <option value="CARTAO_DEBITO">Cartão de Débito</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="BOLETO">Boleto Bancário</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Descrição / Observações</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Compra de 2x rolos PLA Preto na loja X..."
                    value={txNotes}
                    onChange={e => setTxNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
