import { Router } from 'express';
import db from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET financial summary and analytics
router.get('/summary', (req, res) => {
  try {
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM financial_transactions 
      WHERE type = 'RECEITA' AND status = 'PAGO'
    `).get() as any;

    const totalExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM financial_transactions 
      WHERE type = 'DESPESA' AND status = 'PAGO'
    `).get() as any;

    const pendingReceivable = db.prepare(`
      SELECT COALESCE(SUM(total_price - COALESCE(down_payment, 0)), 0) as total
      FROM orders
      WHERE status NOT IN ('ENTREGUE', 'CANCELADO') AND payment_status != 'PAGO_TOTAL'
    `).get() as any;

    const netProfit = (totalIncome?.total || 0) - (totalExpense?.total || 0);
    const profitMargin = totalIncome?.total > 0 ? ((netProfit / totalIncome.total) * 100).toFixed(1) : '0';

    // Expenses by category
    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as amount, COUNT(*) as count
      FROM financial_transactions
      WHERE type = 'DESPESA'
      GROUP BY category
      ORDER BY amount DESC
    `).all();

    // Profitability by process (from order_items of completed/delivered orders)
    const processProfitability = db.prepare(`
      SELECT 
        oi.process_type,
        COUNT(*) as total_items,
        COALESCE(SUM(oi.unit_cost * oi.quantity), 0) as cost,
        COALESCE(SUM(oi.unit_price * oi.quantity), 0) as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'CANCELADO'
      GROUP BY oi.process_type
    `).all() as any[];

    const enrichedProcessProfit = processProfitability.map(p => {
      const profit = p.revenue - p.cost;
      const margin = p.revenue > 0 ? Math.round((profit / p.revenue) * 100) : 0;
      return {
        ...p,
        profit,
        margin
      };
    });

    res.json({
      totalIncome: totalIncome.total,
      totalExpense: totalExpense.total,
      netProfit,
      profitMargin: Number(profitMargin),
      pendingReceivable: pendingReceivable.total,
      expensesByCategory,
      processProfitability: enrichedProcessProfit
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET transactions list
router.get('/transactions', (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    let query = `
      SELECT t.*, o.order_number, o.title as order_title
      FROM financial_transactions t
      LEFT JOIN orders o ON o.id = t.order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }
    if (startDate) {
      query += ` AND t.transaction_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND t.transaction_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create transaction
router.post('/transactions', (req, res) => {
  try {
    const { order_id, type, category, amount, payment_method, status, transaction_date, notes } = req.body;
    if (!type || !category || !amount) {
      return res.status(400).json({ error: 'Tipo, Categoria e Valor são obrigatórios' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO financial_transactions (id, order_id, type, category, amount, payment_method, status, transaction_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      order_id || null,
      type,
      category,
      amount,
      payment_method || 'PIX',
      status || 'PAGO',
      transaction_date || new Date().toISOString().replace('T', ' ').substring(0, 19),
      notes || null
    );

    const created = db.prepare(`SELECT * FROM financial_transactions WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE transaction
router.delete('/transactions/:id', (req, res) => {
  try {
    db.prepare(`DELETE FROM financial_transactions WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
