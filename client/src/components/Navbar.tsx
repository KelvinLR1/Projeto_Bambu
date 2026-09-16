import React from 'react';
import { 
  Layers, 
  Kanban, 
  Calculator, 
  Package, 
  Wrench, 
  DollarSign, 
  Users, 
  Settings, 
  PlusCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewOrder: () => void;
  alertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewOrder,
  alertsCount,
}) => {
  const tabs = [
    { id: 'kanban', label: 'Kanban Produção', icon: Kanban },
    { id: 'orders', label: 'Pedidos & OS', icon: Layers },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'stock', label: 'Estoque & Refugos', icon: Package, badge: alertsCount },
    { id: 'equipments', label: 'Equipamentos', icon: Wrench },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Atelier', icon: Settings },
  ];

  return (
    <header className="no-print" style={{
      background: 'rgba(17, 23, 38, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '10px 24px'
    }}>
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Printer size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              PROJETO <span style={{ color: 'var(--brand-primary)' }}>BAMBU</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Atelier & Manufatura 3D / Laser / Pintura
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(10, 13, 20, 0.7)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 13px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--brand-primary)' : 'currentColor'} />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    marginLeft: 2
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {alertsCount > 0 && (
            <div 
              onClick={() => setActiveTab('stock')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Estoque baixo detectado"
            >
              <AlertTriangle size={15} />
              <span>{alertsCount} em alerta</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={onNewOrder}
          >
            <PlusCircle size={18} />
            <span>Novo Pedido</span>
          </button>
        </div>
      </div>
    </header>
  );
};
