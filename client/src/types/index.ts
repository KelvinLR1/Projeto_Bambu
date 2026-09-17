export type OrderStatus =
  | 'ORCAMENTO'
  | 'APROVADO'
  | 'EM_IMPRESSAO'
  | 'EM_PREPARACAO'
  | 'EM_PINTURA'
  | 'SECAGEM_VERNIZ'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type ProcessType = 'FDM' | 'RESIN' | 'LASER' | 'PINTURA' | 'COMBO';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
  address?: string;
  notes?: string;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

export interface MaterialFDM {
  id: string;
  name: string;
  brand: string;
  material_type: string;
  color: string;
  color_hex: string;
  spool_price: number;
  spool_weight_g: number;
  density: number;
  temp_print: number;
  temp_bed: number;
  stock_weight_g: number;
  min_stock_g: number;
  active: number;
}

export interface MaterialResin {
  id: string;
  name: string;
  brand: string;
  resin_type: string;
  color: string;
  color_hex: string;
  bottle_price: number;
  bottle_volume_ml: number;
  wash_cure_cost_per_ml: number;
  stock_volume_ml: number;
  min_stock_ml: number;
  active: number;
}

export interface MaterialLaser {
  id: string;
  name: string;
  paper_type: string;
  grammature: number;
  sheet_price: number;
  toner_cost_per_page: number;
  stock_sheets: number;
  min_stock_sheets: number;
  active: number;
}

export interface MaterialFinishing {
  id: string;
  name: string;
  category: string;
  brand?: string;
  unit_type: string;
  cost_per_unit: number;
  stock_qty: number;
  min_stock_qty: number;
  active: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'FDM' | 'RESIN' | 'LASER' | 'AIRBRUSH' | 'BOOTH';
  power_watts: number;
  purchase_cost: number;
  lifespan_hours: number;
  hourly_depreciation: number;
  maintenance_interval_hours: number;
  total_hours: number;
  hours_since_last_maint: number;
  status: 'ATIVO' | 'MANUTENCAO' | 'INATIVO';
  notes?: string;
  remainingHours?: number;
  isDue?: boolean;
  progressPercent?: number;
  maintenances?: EquipmentMaintenance[];
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  type: string;
  description: string;
  performed_at: string;
  cost: number;
  hours_at_maint: number;
  next_due_hours?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  process_type: ProcessType;
  description: string;
  quantity: number;
  material_id?: string;
  equipment_id?: string;
  unit_cost: number;
  unit_price: number;
  material_name?: string;
  equipment_name?: string;
  calc_params?: any;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  title: string;
  status: OrderStatus;
  total_cost: number;
  total_price: number;
  margin_percent: number;
  discount: number;
  down_payment: number;
  payment_status: 'PENDENTE' | 'SINAL_PAGO' | 'PAGO_TOTAL' | 'REEMBOLSADO';
  payment_method: 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO';
  delivery_date?: string;
  notes?: string;
  items_count?: number;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
  whatsapp?: {
    templates: Record<string, { label: string; text: string }>;
    links: Record<string, string>;
  };
}

export interface PrintFailure {
  id: string;
  order_id?: string;
  equipment_id?: string;
  process_type: string;
  material_name?: string;
  lost_qty: number;
  lost_hours: number;
  financial_loss: number;
  reason: string;
  date: string;
  order_number?: string;
  order_title?: string;
  equipment_name?: string;
}

export interface FinancialTransaction {
  id: string;
  order_id?: string;
  type: 'RECEITA' | 'DESPESA';
  category: string;
  amount: number;
  payment_method: string;
  status: 'PAGO' | 'PENDENTE';
  transaction_date: string;
  due_date?: string;
  notes?: string;
  order_number?: string;
  order_title?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  pendingReceivable: number;
  expensesByCategory: { category: string; amount: number; count: number }[];
  processProfitability: {
    process_type: ProcessType;
    total_items: number;
    cost: number;
    revenue: number;
    profit: number;
    margin: number;
  }[];
}

export interface StockAlert {
  id: string;
  type: 'FDM' | 'RESIN' | 'LASER' | 'PINTURA';
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  percentageLeft: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  process_type: ProcessType;
  description?: string;
  material_id?: string;
  equipment_id?: string;
  production_time_hours: number;
  weight_g: number;
  unit_cost: number;
  unit_price: number;
  margin_percent: number;
  image_url?: string;
  active: number;
  calc_params_json?: string;
  created_at: string;
}

