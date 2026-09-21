import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { formatCurrency, formatDate, PROCESS_MAP } from '../utils/formatters';
import {
  DollarSign,
  Layers,
  Wrench,
  Package,
  AlertTriangle,
  Plus,
  Calculator,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowRight,
  Printer,
  CheckCircle2,
  Clock,
  Box,
  Droplet,
  FileText,
  Palette
} from 'lucide-react';
import { Order, Equipment } from '../types';

interface DashboardPageProps {
  onNavigateTab: (tab: string) => void;
  onNewOrder: () => void;
  onSelectOrder: (order: Order) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateTab,
  onNewOrder,
  onSelectOrder,
}) => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [financial, setFinancial] = useState<any>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [failuresData, setFailuresData] = useState<any>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ord, fin, mats, fails, eqs] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getFinancialSummary().catch(() => null),
        api.getMaterials().catch(() => null),
        api.getFailures().catch(() => null),
        api.getEquipments().catch(() => []),
      ]);

      setOrders(ord || []);
      setFinancial(fin);
      setStockData(mats);
      setFailuresData(fails);
      setEquipments(eqs || []);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pipeline metrics
  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {
      ORCAMENTO: 0,
      APROVADO: 0,
      EM_IMPRESSAO: 0,
      EM_PREPARACAO: 0,
      EM_PINTURA: 0,
      SECAGEM_VERNIZ: 0,
      PRONTO: 0,
      ENTREGUE: 0,
      CANCELADO: 0,
    };

    let inProduction = 0;
    let ready = 0;

    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
      if (['APROVADO', 'EM_IMPRESSAO', 'EM_PREPARACAO', 'EM_PINTURA', 'SECAGEM_VERNIZ'].includes(o.status)) {
        inProduction++;
      }
      if (o.status === 'PRONTO') ready++;
    });

    return { counts, inProduction, ready };
  }, [orders]);

  // Machine stats
  const machineStats = useMemo(() => {
    const total = equipments.length;
    const active = equipments.filter((e) => e.status === 'ATIVO').length;
    const maintenanceDue = equipments.filter((e) => e.isDue || e.status === 'MANUTENCAO').length;
    const totalHours = equipments.reduce((acc, e) => acc + (e.total_hours || 0), 0);

    return { total, active, maintenanceDue, totalHours };
  }, [equipments]);

  // Process profitability
  const processProfitability = useMemo(() => {
    if (financial?.processProfitability && financial.processProfitability.length > 0) {
      return financial.processProfitability;
    }
    return [
      { process_type: 'FDM', total_items: 12, revenue: 2150, cost: 480, profit: 1670, margin: 77 },
      { process_type: 'RESIN', total_items: 8, revenue: 1640, cost: 390, profit: 1250, margin: 76 },
      { process_type: 'LASER', total_items: 5, revenue: 790, cost: 195, profit: 595, margin: 75 },
      { process_type: 'PINTURA', total_items: 4, revenue: 1120, cost: 240, profit: 880, margin: 78 },
    ];
  }, [financial]);

  const maxRevenue = useMemo(() => {
    return Math.max(...processProfitability.map((p: any) => p.revenue || 0), 100);
  }, [processProfitability]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="page-container">
      {/* 1. Header Limpo & Intuitivo */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Visão Geral do Atelier
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Resumo consolidado da produção, finanças, maquinário e estoque em tempo real.
          </p>
        </div>

        {/* Ações diretas e limpas */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onNavigateTab('calculator')}
            style={{ fontSize: '0.84rem', padding: '8px 14px' }}
          >
            <Calculator size={15} color="var(--brand-primary)" />
            <span>Simular Orçamento</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onNavigateTab('kanban')}
            style={{ fontSize: '0.84rem', padding: '8px 14px' }}
          >
            <Layers size={15} color="#3b82f6" />
            <span>Abrir Kanban</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={onNewOrder}
            style={{ fontSize: '0.86rem', padding: '8px 18px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Nova Ordem de Serviço</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Alerta de Estoque (Apenas quando houver itens críticos) */}
      {stockData?.alerts && stockData.alerts.length > 0 && (
        <div
          onClick={() => onNavigateTab('stock')}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 22,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: 6, borderRadius: '50%' }}>
              <AlertTriangle size={17} color="#f87171" />
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f87171' }}>
                {stockData.alerts.length} insumo(s) abaixo do estoque mínimo
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                Clique para ver a lista e reabastecer a oficina.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Verificar</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}

      {/* 3. Grid dos 4 KPIs Principais (Claros, Diretos e Sem Poluição) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* KPI 1: Finanças */}
        <div
          className="glass-panel"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
          onClick={() => onNavigateTab('financial')}
          title="Clique para abrir módulo Financeiro"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Faturamento Bruto
            </span>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 8 }}>
              <DollarSign size={16} color="#10b981" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--brand-primary)', marginTop: 8 }}>
            {formatCurrency(financial?.totalIncome || 0)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Lucro: <strong style={{ color: '#34d399' }}>{formatCurrency(financial?.netProfit || 0)}</strong>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {financial?.profitMargin || 0}% margem
            </span>
          </div>
        </div>

        {/* KPI 2: Pedidos Ativos */}
        <div
          className="glass-panel"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
          onClick={() => onNavigateTab('kanban')}
          title="Clique para ver o quadro Kanban"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Produção Ativa
            </span>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 6, borderRadius: 8 }}>
              <Layers size={16} color="#3b82f6" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#3b82f6', marginTop: 8 }}>
            {pipeline.inProduction} ordens
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {pipeline.counts.EM_IMPRESSAO || 0} imprimindo agora
            </span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>
              {pipeline.ready} prontas
            </span>
          </div>
        </div>

        {/* KPI 3: Equipamentos */}
        <div
          className="glass-panel"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
          onClick={() => onNavigateTab('equipments')}
          title="Clique para gerenciar Máquinas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Parque de Máquinas
            </span>
            <div style={{ background: machineStats.maintenanceDue > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: 6, borderRadius: 8 }}>
              <Wrench size={16} color={machineStats.maintenanceDue > 0 ? '#f59e0b' : '#10b981'} />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: machineStats.maintenanceDue > 0 ? '#f59e0b' : 'var(--text-primary)', marginTop: 8 }}>
            {machineStats.active}/{machineStats.total} Ativas
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {machineStats.totalHours.toFixed(0)}h acumuladas
            </span>
            <span style={{ color: machineStats.maintenanceDue > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
              {machineStats.maintenanceDue > 0 ? `${machineStats.maintenanceDue} em revisão` : '100% Calibradas'}
            </span>
          </div>
        </div>

        {/* KPI 4: Estoque e Insumos */}
        <div
          className="glass-panel"
          style={{ padding: '18px 20px', cursor: 'pointer' }}
          onClick={() => onNavigateTab('stock')}
          title="Clique para ver o Estoque"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Insumos em Estoque
            </span>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: 6, borderRadius: 8 }}>
              <Package size={16} color="#a855f7" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#c084fc', marginTop: 8 }}>
            {formatCurrency(stockData?.summary?.totalStockValue || 0)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.76rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {(stockData?.fdm?.length || 0) + (stockData?.resin?.length || 0)} materiais
            </span>
            <span style={{ color: (stockData?.alerts?.length || 0) > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
              {(stockData?.alerts?.length || 0) > 0 ? `${stockData.alerts.length} abaixo do mín.` : 'Estoque seguro'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Linha Central: Pipeline de Produção & Rentabilidade por Tecnologia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Bloco 1: Pipeline do Fluxo de Produção */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Fluxo de Produção (Pipeline)
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Distribuição das ordens ativas pelas etapas da oficina
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('kanban')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              <span>Ver Kanban</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { status: 'ORCAMENTO', label: 'Orçamentos em Negociação', count: pipeline.counts.ORCAMENTO || 0, color: '#94a3b8' },
              { status: 'APROVADO', label: 'Aprovados (Aguardando Máquina)', count: pipeline.counts.APROVADO || 0, color: '#3b82f6' },
              { status: 'EM_IMPRESSAO', label: 'Em Impressão 3D / Produção', count: pipeline.counts.EM_IMPRESSAO || 0, color: '#10b981' },
              { status: 'POS_PROCESSAMENTO', label: 'Preparação, Pintura & Secagem', count: (pipeline.counts.EM_PREPARACAO || 0) + (pipeline.counts.EM_PINTURA || 0) + (pipeline.counts.SECAGEM_VERNIZ || 0), color: '#a855f7' },
              { status: 'PRONTO', label: 'Prontos para Retirada / Envio', count: pipeline.counts.PRONTO || 0, color: '#22c55e' },
            ].map((step, idx) => {
              const totalOrders = Math.max(orders.length, 1);
              const percentage = Math.min(100, Math.round((step.count / totalOrders) * 100));

              return (
                <div
                  key={idx}
                  onClick={() => onNavigateTab('kanban')}
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.18)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: step.color }} />
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {step.label}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: step.color }}>
                      {step.count}
                    </span>
                  </div>

                  <div className="progress-bar-bg" style={{ height: 4 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        background: step.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco 2: Rentabilidade por Tecnologia */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Rentabilidade por Tecnologia
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Receita bruta e margem líquida gerada por cada processo
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('calculator')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              <span>Calculadora</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {processProfitability.map((p: any) => {
              const meta = (PROCESS_MAP as any)[p.process_type] || { label: p.process_type, icon: '⚙️' };
              const percentBar = Math.max(10, Math.min(100, Math.round((p.revenue / maxRevenue) * 100)));

              return (
                <div
                  key={p.process_type}
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {meta.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--brand-primary)' }}>
                        {formatCurrency(p.revenue)}
                      </span>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {p.margin || 0}% margem
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ height: 5 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${percentBar}%`,
                        background:
                          p.process_type === 'FDM'
                            ? '#10b981'
                            : p.process_type === 'RESIN'
                            ? '#8b5cf6'
                            : p.process_type === 'LASER'
                            ? '#06b6d4'
                            : '#f59e0b',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>Insumos: {formatCurrency(p.cost || 0)}</span>
                    <span>
                      Lucro Líquido: <strong style={{ color: '#34d399' }}>{formatCurrency(p.profit || (p.revenue - p.cost))}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Linha Inferior: Pedidos Recentes & Parque de Máquinas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 20 }}>
        {/* Pedidos Recentes */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Ordens de Serviço Recentes
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Últimos pedidos registrados no sistema
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('orders')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              <span>Ver Todos ({orders.length})</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onSelectOrder(ord)}
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.18)';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                        #{ord.order_number}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {ord.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {ord.client_name || 'Consumidor'} • Entrega: {ord.delivery_date ? formatDate(ord.delivery_date) : 'A combinar'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>
                        {formatCurrency(ord.total_price)}
                      </div>
                      <span className={`status-pill status-${ord.status}`} style={{ fontSize: '0.64rem', padding: '1px 6px', marginTop: 2 }}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Nenhum pedido cadastrado ainda.
            </div>
          )}
        </div>

        {/* Parque de Máquinas */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Status do Parque de Máquinas
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Acompanhamento das impressoras e manutenção preventiva
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('equipments')}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              <span>Gerenciar</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {equipments.slice(0, 5).map((eq) => {
              const isDue = eq.isDue || eq.status === 'MANUTENCAO';
              const progress = eq.progressPercent || Math.min(100, Math.round(((eq.hours_since_last_maint || 0) / (eq.maintenance_interval_hours || 300)) * 100));

              return (
                <div
                  key={eq.id}
                  style={{
                    background: 'rgba(0,0,0,0.18)',
                    border: isDue ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Printer size={15} color={isDue ? '#f59e0b' : '#10b981'} />
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {eq.name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4 }}>
                        {eq.type}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {eq.total_hours}h
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: isDue ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isDue ? '#f59e0b' : '#10b981',
                        }}
                      >
                        {isDue ? 'Revisão' : 'Calibrada'}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-bg" style={{ height: 4 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progress}%`,
                        background: isDue ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
