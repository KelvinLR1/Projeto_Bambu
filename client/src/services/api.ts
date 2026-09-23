const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `Erro na requisição (${res.status})`;
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Clients
  getClients: () => request<any[]>('/clients'),
  getClient: (id: string) => request<any>(`/clients/${id}`),
  createClient: (data: any) => request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request<any>(`/clients/${id}`, { method: 'DELETE' }),

  // Materials & Stock
  getMaterials: () => request<any>('/materials'),
  getStockAlerts: () => request<any[]>('/materials/alerts'),
  createMaterialFdm: (data: any) => request<any>('/materials/fdm', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterialFdm: (id: string, data: any) => request<any>(`/materials/fdm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterialFdm: (id: string) => request<any>(`/materials/fdm/${id}`, { method: 'DELETE' }),

  createMaterialResin: (data: any) => request<any>('/materials/resin', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterialResin: (id: string, data: any) => request<any>(`/materials/resin/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterialResin: (id: string) => request<any>(`/materials/resin/${id}`, { method: 'DELETE' }),

  createMaterialLaser: (data: any) => request<any>('/materials/laser', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterialLaser: (id: string, data: any) => request<any>(`/materials/laser/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterialLaser: (id: string) => request<any>(`/materials/laser/${id}`, { method: 'DELETE' }),

  createMaterialFinishing: (data: any) => request<any>('/materials/finishing', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterialFinishing: (id: string, data: any) => request<any>(`/materials/finishing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterialFinishing: (id: string) => request<any>(`/materials/finishing/${id}`, { method: 'DELETE' }),

  adjustStock: (table: string, id: string, changeAmount: number) =>
    request<any>('/materials/adjust-stock', { method: 'POST', body: JSON.stringify({ table, id, changeAmount }) }),

  // Equipments
  getEquipments: () => request<any[]>('/equipments'),
  getEquipment: (id: string) => request<any>(`/equipments/${id}`),
  createEquipment: (data: any) => request<any>('/equipments', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipment: (id: string, data: any) => request<any>(`/equipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEquipment: (id: string) => request<any>(`/equipments/${id}`, { method: 'DELETE' }),
  registerMaintenance: (id: string, data: any) => request<any>(`/equipments/${id}/maintenance`, { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (params?: { status?: string; clientId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/orders${query ? `?${query}` : ''}`);
  },
  getKanbanOrders: () => request<Record<string, any[]>>('/orders/kanban'),
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  createOrder: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateOrder: (id: string, data: any) => request<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id: string) => request<any>(`/orders/${id}`, { method: 'DELETE' }),

  // Calculators
  calculateFdm: (data: any) => request<any>('/calculator/fdm', { method: 'POST', body: JSON.stringify(data) }),
  calculateResin: (data: any) => request<any>('/calculator/resin', { method: 'POST', body: JSON.stringify(data) }),
  calculateLaser: (data: any) => request<any>('/calculator/laser', { method: 'POST', body: JSON.stringify(data) }),
  calculatePainting: (data: any) => request<any>('/calculator/painting', { method: 'POST', body: JSON.stringify(data) }),

  // Failures & Scrap
  getFailures: () => request<any>('/failures'),
  createFailure: (data: any) => request<any>('/failures', { method: 'POST', body: JSON.stringify(data) }),
  deleteFailure: (id: string) => request<any>(`/failures/${id}`, { method: 'DELETE' }),

  // Financial
  getFinancialSummary: () => request<any>('/financial/summary'),
  getTransactions: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/financial/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (data: any) => request<any>('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => request<any>(`/financial/transactions/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<any>('/settings'),
  updateSettings: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Products Catalog
  getProducts: (params?: { category?: string; process?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // Product Images
  getProductImages: (productId: string) => request<any[]>(`/products/${productId}/images`),
  addProductImages: (productId: string, data: { image_url?: string; images?: any[]; title?: string; is_cover?: boolean }) =>
    request<any>(`/products/${productId}/images`, { method: 'POST', body: JSON.stringify(data) }),
  setProductCoverImage: (productId: string, imageId: string) =>
    request<any>(`/products/${productId}/images/${imageId}/cover`, { method: 'PUT' }),
  updateProductImage: (productId: string, imageId: string, data: { title?: string }) =>
    request<any>(`/products/${productId}/images/${imageId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProductImage: (productId: string, imageId: string) =>
    request<any>(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
  deleteProductImagesBatch: (productId: string, imageIds: string[]) =>
    request<any>(`/products/${productId}/images/delete-batch`, { method: 'POST', body: JSON.stringify({ imageIds }) }),

  // Product Files & Sub-parts
  getProductFiles: (productId: string) => request<any[]>(`/products/${productId}/files`),
  addProductFile: (productId: string, data: any) =>
    request<any>(`/products/${productId}/files`, { method: 'POST', body: JSON.stringify(data) }),
  updateProductFile: (productId: string, fileId: string, data: any) =>
    request<any>(`/products/${productId}/files/${fileId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProductFile: (productId: string, fileId: string) =>
    request<any>(`/products/${productId}/files/${fileId}`, { method: 'DELETE' }),



  // WhatsApp
  generateWhatsAppLink: (phone: string, message: string) =>
    request<any>('/whatsapp/link', { method: 'POST', body: JSON.stringify({ phone, message }) }),
};

export default api;
