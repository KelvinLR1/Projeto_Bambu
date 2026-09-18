import React from 'react';
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
  PlusCircle,
  AlertTriangle,
  Printer,
  ShoppingBag
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Produção', icon: Kanban },
    { id: 'orders', label: 'Pedidos & OS', icon: Layers },
    { id: 'products', label: 'Catálogo Peças', icon: ShoppingBag },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'stock', label: 'Estoque & Refugos', icon: Package, badge: alertsCount },
    { id: 'equipments', label: 'Equipamentos', icon: Wrench },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Atelier', icon: Settings },
  ];

  return (
    <header className="no-print" style={{
      background: 'rgba(8, 12, 22, 0.82)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), inset 0 -1px 0 rgba(16, 185, 129, 0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '11px 28px'
    }}>
      <div style={{
        maxWidth: 1680,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand & Logo with glowing orb */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            color: '#fff',
            width: 42,
            height: 42,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <Printer size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                PROJETO <span className="text-gradient-emerald">BAMBU</span>
              </h1>
              <span style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                STUDIO OS
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>
              Manufatura 3D • Corte Laser • Acabamento Artesanal
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(5, 8, 15, 0.65)',
          padding: '5px',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
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
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.12) 100%)' 
                    : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
              >
                <Icon size={16} color={isActive ? '#34d399' : 'currentColor'} />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 999,
                    marginLeft: 2,
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
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
