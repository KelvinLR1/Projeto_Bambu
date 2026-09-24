import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  Layers, 
  Kanban, 
  Calculator, 
  Package, 
  Wrench, 
  DollarSign, 
  Users, 
  Settings, 
  Plus,
  AlertTriangle,
  Printer,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewOrder: () => void;
  alertsCount: number;
}

interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeDanger?: boolean;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onNewOrder,
  alertsCount,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('bambu_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('bambu_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navGroups: NavGroup[] = [
    {
      title: 'PRODUÇÃO',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'kanban', label: 'Kanban Produção', icon: Kanban },
        { id: 'orders', label: 'Pedidos & OS', icon: Layers },
      ]
    },
    {
      title: 'ENGENHARIA & CATÁLOGO',
      items: [
        { id: 'calculator', label: 'Calculadora de Custos', icon: Calculator },
        { id: 'products', label: 'Catálogo de Peças', icon: ShoppingBag },
      ]
    },
    {
      title: 'RECURSOS & ATELIER',
      items: [
        { id: 'stock', label: 'Estoque & Refugos', icon: Package, badge: alertsCount, badgeDanger: alertsCount > 0 },
        { id: 'equipments', label: 'Equipamentos', icon: Wrench },
      ]
    },
    {
      title: 'GESTÃO & NEGÓCIO',
      items: [
        { id: 'financial', label: 'Financeiro & DRE', icon: DollarSign },
        { id: 'clients', label: 'Clientes (CRM)', icon: Users },
        { id: 'settings', label: 'Configurações Atelier', icon: Settings },
      ]
    }
  ];

  const sidebarWidth = isCollapsed ? 76 : 264;

  return (
    <>
      <aside
        className="no-print sidebar-container"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: 'calc(100vh / 0.85)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
          transition: 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowX: 'hidden',
        }}
      >
      {/* 1. Header: Marca & Atelier */}
      <div style={{ padding: isCollapsed ? '18px 14px' : '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          onClick={() => setActiveTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}
          title="Projeto Bambu - Ir para o Dashboard"
        >
          {/* Logo Ícone */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--brand-primary-glow), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              flexShrink: 0,
            }}
          >
            <Printer size={20} />
          </div>

          {/* Nome e subtítulo (quando expandido) */}
          {!isCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  PROJETO <span style={{ color: 'var(--brand-primary)' }}>BAMBU</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--brand-primary)',
                    boxShadow: '0 0 6px var(--brand-primary)',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                  STUDIO OS • ATIVO
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Ação Rápida: Novo Pedido */}
        <div style={{ marginTop: 16 }}>
          {isCollapsed ? (
            <button
              onClick={onNewOrder}
              className="btn btn-primary"
              style={{
                width: 44,
                height: 44,
                padding: 0,
                borderRadius: 12,
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Criar Novo Pedido (+)"
            >
              <Plus size={20} />
            </button>
          ) : (
            <button
              onClick={onNewOrder}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '9px 14px',
                fontSize: '0.86rem',
                fontWeight: 700,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Plus size={16} />
              <span>Novo Pedido</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Menu de Navegação com Grupos Organizados */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 10px' : '14px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {/* Título do Grupo (visível somente quando expandido) */}
            {!isCollapsed ? (
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  padding: '4px 10px 6px',
                  textTransform: 'uppercase',
                }}
              >
                {group.title}
              </div>
            ) : (
              <div
                style={{
                  height: 1,
                  background: 'var(--border-subtle)',
                  margin: '6px 4px 10px',
                }}
              />
            )}

            {/* Itens do Grupo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: isCollapsed ? '10px 0' : '9px 12px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: 9,
                      border: isActive
                        ? '1px solid color-mix(in srgb, var(--brand-primary) 28%, transparent)'
                        : '1px solid transparent',
                      background: isActive
                        ? 'color-mix(in srgb, var(--brand-primary) 12%, transparent)'
                        : 'transparent',
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                      position: 'relative',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 6%, transparent)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Indicador de Barra Ativa à Esquerda */}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '18%',
                          bottom: '18%',
                          width: 3,
                          borderRadius: '0 4px 4px 0',
                          background: 'var(--brand-primary)',
                          boxShadow: '0 0 8px var(--brand-primary)',
                        }}
                      />
                    )}

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon
                        size={17}
                        color={isActive ? 'var(--brand-primary)' : 'currentColor'}
                        style={{
                          filter: isActive ? 'drop-shadow(0 0 6px var(--brand-primary-glow))' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      {/* Ponto indicador de badge quando recolhido */}
                      {isCollapsed && Boolean(item.badge && item.badge > 0) && (
                        <span
                          style={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#ef4444',
                            boxShadow: '0 0 6px #ef4444',
                          }}
                        />
                      )}
                    </div>

                    {!isCollapsed && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: isActive ? 700 : 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.label}
                        </span>

                        {/* Badge de contador / alertas */}
                        {Boolean(item.badge && item.badge > 0) && (
                          <span
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 999,
                              minWidth: 18,
                              textAlign: 'center',
                              boxShadow: '0 0 8px rgba(239, 68, 68, 0.25)',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. Rodapé: Alertas Rápidos & Recolher/Expandir */}
      <div
        style={{
          padding: isCollapsed ? '14px 10px' : '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Banner de alerta de insumos críticos se houver */}
        {!isCollapsed && alertsCount > 0 && (
          <div
            onClick={() => setActiveTab('stock')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            title="Clique para ir ao Estoque e ver insumos críticos"
          >
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {alertsCount} {alertsCount === 1 ? 'insumo crítico' : 'insumos críticos'}
            </span>
          </div>
        )}

        {/* Botão de Recolher / Expandir */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            width: '100%',
            padding: '7px 10px',
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {!isCollapsed && <span>Recolher Menu</span>}
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
    {/* Spacer com largura sincronizada para manter o layout em flex do app-shell */}
    <div
      aria-hidden="true"
      className="sidebar-spacer no-print"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        flexShrink: 0,
        transition: 'width 0.24s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    />
  </>
  );
};
