import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';
import { deductStockForOrder } from '../services/stockService.js';
import { getOrderWhatsAppTemplates, generateWhatsAppLink } from '../services/whatsappService.js';

const router = Router();

// Helper to generate next OS number
function getNextOrderNumber(): string {
  const currentYear = new Date().getFullYear();
  const lastOrder = db.prepare(`
    SELECT order_number FROM orders 
    WHERE order_number LIKE ? 
    ORDER BY order_number DESC LIMIT 1
  `).get(`OS-${currentYear}-%`) as any;

  if (!lastOrder) {
    return `OS-${currentYear}-001`;
  }

  const parts = lastOrder.order_number.split('-');
  const seq = parseInt(parts[2], 10) + 1;
  return `OS-${currentYear}-${String(seq).padStart(3, '0')}`;
}

// GET all orders with client name & items count
router.get('/', (req, res) => {
  try {
    const { status, clientId, search } = req.query;

    let query = `
      SELECT o.*, c.name as client_name, c.phone as client_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }
    if (clientId) {
      query += ` AND o.client_id = ?`;
      params.push(clientId);
    }
    if (search) {
      query += ` AND (o.order_number LIKE ? OR o.title LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET orders grouped for Kanban board
router.get('/kanban', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, c.name as client_name, c.phone as client_phone,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      ORDER BY o.created_at DESC
    `).all() as any[];

    const columns = {
      ORCAMENTO: [] as any[],
      APROVADO: [] as any[],
      EM_IMPRESSAO: [] as any[],
      EM_PREPARACAO: [] as any[],
      EM_PINTURA: [] as any[],
      SECAGEM_VERNIZ: [] as any[],
      PRONTO: [] as any[],
      ENTREGUE: [] as any[],
      CANCELADO: [] as any[]
    };

    orders.forEach(o => {
      if ((columns as any)[o.status]) {
        (columns as any)[o.status].push(o);
      }
    });

    res.json(columns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET single order with items and client details
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM orders o
      JOIN clients c ON c.id = o.client_id
      WHERE o.id = ?
    `).get(req.params.id) as any;

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const items = db.prepare(`
      SELECT oi.*, 
        CASE 
          WHEN oi.process_type = 'FDM' THEN (SELECT name FROM materials_fdm WHERE id = oi.material_id)
          WHEN oi.process_type = 'RESIN' THEN (SELECT name FROM materials_resin WHERE id = oi.material_id)
          WHEN oi.process_type = 'LASER' THEN (SELECT name FROM materials_laser WHERE id = oi.material_id)
          ELSE 'N/A'
        END as material_name,
        (SELECT name FROM equipments WHERE id = oi.equipment_id) as equipment_name
      FROM order_items oi
      WHERE oi.order_id = ?
    `).all(req.params.id) as any[];

    // Parse calc_params
    const parsedItems = items.map(item => ({
      ...item,
      calc_params: item.calc_params_json ? JSON.parse(item.calc_params_json) : null
    }));

    // WhatsApp contextual templates
    const settings = db.prepare(`SELECT key, value FROM settings`).all() as any[];
    const settingsMap = settings.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {});

    const itemsSummary = parsedItems.map(i => `${i.quantity}x ${i.description}`).join('; ');
    const waContext = {
      orderNumber: order.order_number,
      clientName: order.client_name,
      clientPhone: order.client_phone,
      title: order.title,
      status: order.status,
      totalPrice: order.total_price,
      downPayment: order.down_payment,
      remainingBalance: order.total_price - (order.down_payment || 0),
      deliveryDate: order.delivery_date,
      itemsSummary,
      pixKey: settingsMap['atelier_pix_key'],
      pixName: settingsMap['atelier_pix_name'],
      atelierName: settingsMap['atelier_name']
    };

    const waTemplates = getOrderWhatsAppTemplates(waContext);
    const waLinks: Record<string, string> = {};
    for (const [key, tpl] of Object.entries(waTemplates)) {
      waLinks[key] = generateWhatsAppLink(order.client_phone, tpl.text);
    }

    res.json({
      ...order,
      items: parsedItems,
      whatsapp: {
        templates: waTemplates,
        links: waLinks
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create order
router.post('/', (req, res) => {
  try {
    const {
      client_id,
      title,
      status = 'ORCAMENTO',
      total_cost = 0,
      total_price = 0,
      margin_percent = 50,
      discount = 0,
      down_payment = 0,
      payment_status = 'PENDENTE',
      payment_method = 'PIX',
      delivery_date,
      notes,
      items = [],
      registerPaymentTransaction = false
    } = req.body;

    if (!client_id || !title) {
      return res.status(400).json({ error: 'Cliente e Título do pedido são obrigatórios' });
    }

    const orderId = uuidv4();
    const orderNumber = getNextOrderNumber();

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, order_number, client_id, title, status, total_cost, total_price,
        margin_percent, discount, down_payment, payment_status, payment_method,
        delivery_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, process_type, description, quantity, material_id,
        equipment_id, unit_cost, unit_price, calc_params_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use transaction for atomic consistency
    const runTransaction = db.transaction(() => {
      insertOrder.run(
        orderId, orderNumber, client_id, title, status, total_cost, total_price,
        margin_percent, discount, down_payment, payment_status, payment_method,
        delivery_date || null, notes || null
      );

      for (const item of items) {
        insertItem.run(
          uuidv4(),
          orderId,
          item.process_type,
          item.description,
          item.quantity || 1,
          item.material_id || null,
          item.equipment_id || null,
          item.unit_cost || 0,
          item.unit_price || 0,
          item.calc_params ? JSON.stringify(item.calc_params) : (item.calc_params_json || null)
        );
      }

      // Se foi recebido um sinal na criação do pedido e solicitado registrar
      if (registerPaymentTransaction && down_payment > 0) {
        db.prepare(`
          INSERT INTO financial_transactions (id, order_id, type, category, amount, payment_method, status, notes)
          VALUES (?, ?, 'RECEITA', 'Sinal Pedido', ?, ?, 'PAGO', ?)
        `).run(
          uuidv4(),
          orderId,
          down_payment,
          payment_method || 'PIX',
          `Sinal 50% de entrada - Pedido ${orderNumber} (${title})`
        );
      }

      // Se o pedido já for criado em status de produção ou posterior, realiza baixa
      if (['EM_IMPRESSAO', 'EM_PREPARACAO', 'EM_PINTURA', 'PRONTO', 'ENTREGUE'].includes(status)) {
        deductStockForOrder(orderId);
      }
    });

    runTransaction();

    const created = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update status (Kanban drag and drop or dropdown)
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'ORCAMENTO', 'APROVADO', 'EM_IMPRESSAO', 'EM_PREPARACAO',
      'EM_PINTURA', 'SECAGEM_VERNIZ', 'PRONTO', 'ENTREGUE', 'CANCELADO'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const currentOrder = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id) as any;
    if (!currentOrder) return res.status(404).json({ error: 'Pedido não encontrado' });

    // Atualiza status e updated_at
    db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, req.params.id);

    // Se entrou em impressão vindo de orçamento ou aprovado, dá baixa de estoque
    if (['ORCAMENTO', 'APROVADO'].includes(currentOrder.status) && ['EM_IMPRESSAO', 'EM_PREPARACAO'].includes(status)) {
      deductStockForOrder(req.params.id);
    }

    // Se mudou para ENTREGUE e o pagamento estiver pendente/sinal_pago, oferece ajuste
    if (status === 'ENTREGUE' && currentOrder.payment_status !== 'PAGO_TOTAL') {
      db.prepare(`
        UPDATE orders SET payment_status = 'PAGO_TOTAL' WHERE id = ?
      `).run(req.params.id);

      const remaining = currentOrder.total_price - (currentOrder.down_payment || 0);
      if (remaining > 0) {
        db.prepare(`
          INSERT INTO financial_transactions (id, order_id, type, category, amount, payment_method, status, notes)
          VALUES (?, ?, 'RECEITA', 'Venda Pedido', ?, ?, 'PAGO', ?)
        `).run(
          uuidv4(),
          req.params.id,
          remaining,
          currentOrder.payment_method || 'PIX',
          `Quitação final na entrega - ${currentOrder.order_number}`
        );
      }
    }

    const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update order
router.put('/:id', (req, res) => {
  try {
    const {
      title,
      status,
      total_cost,
      total_price,
      margin_percent,
      discount,
      down_payment,
      payment_status,
      payment_method,
      delivery_date,
      notes
    } = req.body;

    db.prepare(`
      UPDATE orders
      SET title = ?, status = ?, total_cost = ?, total_price = ?,
          margin_percent = ?, discount = ?, down_payment = ?, payment_status = ?,
          payment_method = ?, delivery_date = ?, notes = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      title, status, total_cost, total_price, margin_percent, discount,
      down_payment, payment_status, payment_method, delivery_date || null,
      notes || null, req.params.id
    );

    const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE order
router.delete('/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM orders WHERE id = ?`).run(req.params.id);
    res.json({ success: true, message: 'Pedido excluído com sucesso' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
