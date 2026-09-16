import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { OrdersPage } from './pages/OrdersPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { StockPage } from './pages/StockPage';
import { EquipmentsPage } from './pages/EquipmentsPage';
import { FinancialPage } from './pages/FinancialPage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';

import { OrderModal } from './components/OrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { PrintDocumentModal } from './components/PrintDocumentModal';

import { Order, OrderStatus } from './types';
import { api } from './services/api';
import { celebrateSuccess } from './utils/formatters';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('kanban');
  const [orders, setOrders] = useState<Order[]>([]);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [calcInitialItem, setCalcInitialItem] = useState<any | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  const handleOpenOrder = (order: Order) => {
    setSelectedOrderId(order.id);
  };

  const handleOpenNewOrderWithItem = (item: any) => {
    setCalcInitialItem(item);
    setIsNewOrderModalOpen(true);
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
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={() => {
          setCalcInitialItem(null);
          setIsNewOrderModalOpen(true);
        }}
        alertsCount={alertsCount}
      />

      {/* Main Tab Views */}
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        {activeTab === 'kanban' && (
          <div style={{ maxWidth: 1900, margin: '0 auto', padding: '24px' }}>
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

        {activeTab === 'calculator' && (
          <CalculatorPage onGenerateOrder={handleOpenNewOrderWithItem} />
        )}

        {activeTab === 'stock' && <StockPage />}

        {activeTab === 'equipments' && <EquipmentsPage />}

        {activeTab === 'financial' && <FinancialPage />}

        {activeTab === 'clients' && <ClientsPage />}

        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Modal New Order */}
      {isNewOrderModalOpen && (
        <OrderModal
          onClose={() => {
            setIsNewOrderModalOpen(false);
            setCalcInitialItem(null);
          }}
          onOrderCreated={loadGlobalData}
          initialItem={calcInitialItem}
        />
      )}

      {/* Modal Order Details & WhatsApp */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={loadGlobalData}
          onPrintA4={handlePrintA4}
          onPrintThermal={handlePrintThermal}
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
    </div>
  );
}

export default App;
