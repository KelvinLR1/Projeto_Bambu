import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { KanbanBoard } from './components/KanbanBoard';
import { OrdersPage } from './pages/OrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { StockPage } from './pages/StockPage';
import { EquipmentsPage } from './pages/EquipmentsPage';
import { FinancialPage } from './pages/FinancialPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';

import { OrderModal } from './components/OrderModal';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { PrintDocumentModal } from './components/PrintDocumentModal';
import { GlobalTooltip } from './components/GlobalTooltip';

import { Order, OrderStatus, Product } from './types';
import { api } from './services/api';
import { celebrateSuccess } from './utils/formatters';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [previousTab, setPreviousTab] = useState<string>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [calcInitialItem, setCalcInitialItem] = useState<any | null>(null);
  const [orderModalClientId, setOrderModalClientId] = useState<string | undefined>(undefined);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [calculatorInitialProduct, setCalculatorInitialProduct] = useState<Product | null>(null);

  const [printOrder, setPrintOrder] = useState<any | null>(null);
  const [printMode, setPrintMode] = useState<'A4' | 'THERMAL'>('A4');

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      const [allOrders, alerts] = await Promise.all([
        api.getOrders(),
        api.getStockAlerts(),
      ]);
      setOrders(allOrders);
      setAlertsCount(alerts.length);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      if (newStatus === 'PRONTO' || newStatus === 'ENTREGUE') {
        celebrateSuccess();
      }
      await loadGlobalData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenOrder = (orderOrId: Order | string) => {
    setPreviousTab(activeTab);
    setSelectedOrderId(typeof orderOrId === 'string' ? orderOrId : orderOrId.id);
    setActiveTab('order-detail');
  };

  const handleBackFromOrderDetail = () => {
    setSelectedOrderId(null);
    setActiveTab(previousTab || 'orders');
  };

  const handleOpenClient = (clientId: string) => {
    setPreviousTab(activeTab);
    setSelectedClientId(clientId);
    setActiveTab('client-detail');
  };

  const handleBackFromClientDetail = () => {
    setSelectedClientId(null);
    setActiveTab(previousTab || 'clients');
  };

  const handleOpenNewOrderWithItem = (item: any) => {
    setCalcInitialItem(item);
    setIsNewOrderModalOpen(true);
  };

  const handleOpenNewOrderWithProduct = (product: Product) => {
    const item = {
      process_type: product.process_type,
      description: `[${product.sku || 'PRD'}] ${product.name}`,
      quantity: 1,
      material_id: product.material_id || '',
      equipment_id: product.equipment_id || '',
      unit_cost: product.unit_cost || 0,
      unit_price: product.unit_price || 0,
    };
    setCalcInitialItem(item);
    setIsNewOrderModalOpen(true);
  };

  const handleOpenInCalculator = (product: Product) => {
    setCalculatorInitialProduct(product);
    setActiveTab('calculator');
  };

  const handlePrintA4 = (order: any) => {
    setPrintOrder(order);
    setPrintMode('A4');
  };

  const handlePrintThermal = (order: any) => {
    setPrintOrder(order);
    setPrintMode('THERMAL');
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={
          activeTab === 'order-detail'
            ? (previousTab || 'orders')
            : activeTab === 'client-detail'
            ? 'clients'
            : activeTab
        }
        setActiveTab={(tab) => {
          if (activeTab === 'order-detail') {
            setSelectedOrderId(null);
          }
          if (activeTab === 'client-detail') {
            setSelectedClientId(null);
          }
          setActiveTab(tab);
        }}
        onNewOrder={() => {
          setCalcInitialItem(null);
          setIsNewOrderModalOpen(true);
        }}
        alertsCount={alertsCount}
      />

      {/* Main Viewport Content */}
      <div className="app-main-content">
        <main style={{ minHeight: 'calc(100vh / 0.85)', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div key={activeTab} className="page-transition-wrapper">
            {activeTab === 'order-detail' && selectedOrderId && (
              <OrderDetailPage
                orderId={selectedOrderId}
                onBack={handleBackFromOrderDetail}
                onOrderUpdated={loadGlobalData}
                onPrintA4={handlePrintA4}
                onPrintThermal={handlePrintThermal}
                onSelectClient={handleOpenClient}
              />
            )}

            {activeTab === 'client-detail' && selectedClientId && (
              <ClientDetailPage
                clientId={selectedClientId}
                onBack={handleBackFromClientDetail}
                onSelectOrder={handleOpenOrder}
                onNewOrderForClient={(cid) => {
                  setOrderModalClientId(cid);
                  setCalcInitialItem(null);
                  setIsNewOrderModalOpen(true);
                }}
                onClientUpdated={loadGlobalData}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardPage
                onNavigateTab={setActiveTab}
                onNewOrder={() => {
                  setCalcInitialItem(null);
                  setIsNewOrderModalOpen(true);
                }}
                onSelectOrder={handleOpenOrder}
              />
            )}

            {activeTab === 'kanban' && (
              <div className="page-container">
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Fluxo de Produção do Atelier (Kanban)</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Arraste os pedidos entre as colunas para atualizar as etapas da oficina e disparar baixas de estoque
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total: <strong>{orders.length} pedidos ativos</strong>
                  </span>
                </div>

                <KanbanBoard
                  orders={orders}
                  onStatusChange={handleStatusChange}
                  onSelectOrder={handleOpenOrder}
                />
              </div>
            )}

            {activeTab === 'orders' && (
              <OrdersPage
                orders={orders}
                onSelectOrder={handleOpenOrder}
                onNewOrder={() => {
                  setCalcInitialItem(null);
                  setIsNewOrderModalOpen(true);
                }}
              />
            )}

            {activeTab === 'products' && (
              <ProductsPage
                onGenerateOrderFromProduct={handleOpenNewOrderWithProduct}
                onOpenInCalculator={handleOpenInCalculator}
              />
            )}

            {activeTab === 'calculator' && (
              <CalculatorPage
                onGenerateOrder={handleOpenNewOrderWithItem}
                initialProduct={calculatorInitialProduct}
                onClearInitialProduct={() => setCalculatorInitialProduct(null)}
              />
            )}

            {activeTab === 'stock' && <StockPage />}

            {activeTab === 'equipments' && <EquipmentsPage />}

            {activeTab === 'financial' && <FinancialPage />}

            {activeTab === 'clients' && (
              <ClientsPage
                onSelectOrder={handleOpenOrder}
                onSelectClient={handleOpenClient}
                onNewOrderForClient={(cid) => {
                  setOrderModalClientId(cid);
                  setCalcInitialItem(null);
                  setIsNewOrderModalOpen(true);
                }}
              />
            )}

            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </main>

      {/* Modal New Order */}
      {isNewOrderModalOpen && (
        <OrderModal
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setCalcInitialItem(null);
            setOrderModalClientId(undefined);
          }}
          onOrderCreated={loadGlobalData}
          initialItem={calcInitialItem}
          initialClientId={orderModalClientId}
        />
      )}

      {/* Modal Print Document (A4 or 80mm) */}
      {printOrder && (
        <PrintDocumentModal
          order={printOrder}
          mode={printMode}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* Global Themed Tooltips */}
      <GlobalTooltip />
      </div>
    </div>
  );
}

export default App;
