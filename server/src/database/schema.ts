import db from './db.js';

export function initSchema() {
  db.exec(`
    -- Clientes
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      document TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Filamentos FDM
    CREATE TABLE IF NOT EXISTS materials_fdm (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      material_type TEXT NOT NULL,
      color TEXT NOT NULL,
      color_hex TEXT DEFAULT '#4a5568',
      spool_price REAL NOT NULL,
      spool_weight_g REAL NOT NULL DEFAULT 1000,
      density REAL DEFAULT 1.24,
      temp_print INTEGER DEFAULT 215,
      temp_bed INTEGER DEFAULT 60,
      stock_weight_g REAL NOT NULL DEFAULT 1000,
      min_stock_g REAL NOT NULL DEFAULT 250,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Resinas SLA/DLP
    CREATE TABLE IF NOT EXISTS materials_resin (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      resin_type TEXT NOT NULL,
      color TEXT NOT NULL,
      color_hex TEXT DEFAULT '#718096',
      bottle_price REAL NOT NULL,
      bottle_volume_ml REAL NOT NULL DEFAULT 1000,
      wash_cure_cost_per_ml REAL DEFAULT 0.06,
      stock_volume_ml REAL NOT NULL DEFAULT 1000,
      min_stock_ml REAL NOT NULL DEFAULT 300,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Insumos de Impressão Laser / Gráfica
    CREATE TABLE IF NOT EXISTS materials_laser (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      paper_type TEXT NOT NULL,
      grammature INTEGER DEFAULT 250,
      sheet_price REAL NOT NULL,
      toner_cost_per_page REAL DEFAULT 0.25,
      stock_sheets INTEGER NOT NULL DEFAULT 100,
      min_stock_sheets INTEGER NOT NULL DEFAULT 30,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Insumos de Pintura e Acabamento Pós-Processamento
    CREATE TABLE IF NOT EXISTS materials_finishing (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL, -- Lixa, Primer, Tinta, Verniz, Solvente, Massa, Acessório
      brand TEXT,
      unit_type TEXT NOT NULL, -- unidade, ml, g, folha
      cost_per_unit REAL NOT NULL,
      stock_qty REAL NOT NULL,
      min_stock_qty REAL NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Equipamentos e Horômetro
    CREATE TABLE IF NOT EXISTS equipments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- FDM, RESIN, LASER, AIRBRUSH, BOOTH
      power_watts REAL DEFAULT 150,
      purchase_cost REAL DEFAULT 0,
      lifespan_hours REAL DEFAULT 5000,
      hourly_depreciation REAL DEFAULT 2.50,
      maintenance_interval_hours REAL DEFAULT 200,
      total_hours REAL DEFAULT 0,
      hours_since_last_maint REAL DEFAULT 0,
      status TEXT DEFAULT 'ATIVO', -- ATIVO, MANUTENCAO, INATIVO
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Histórico de Manutenções
    CREATE TABLE IF NOT EXISTS equipment_maintenances (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL,
      type TEXT NOT NULL, -- PREVENTIVA, CORRETIVA, LUBRIFICACAO, TROCA_PECA, LIMPEZA
      description TEXT NOT NULL,
      performed_at TEXT DEFAULT (datetime('now', 'localtime')),
      cost REAL DEFAULT 0,
      hours_at_maint REAL DEFAULT 0,
      next_due_hours REAL,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
    );

    -- Pedidos
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ORCAMENTO', 
      -- ORCAMENTO, APROVADO, EM_IMPRESSAO, EM_PREPARACAO, EM_PINTURA, SECAGEM_VERNIZ, PRONTO, ENTREGUE, CANCELADO
      total_cost REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      margin_percent REAL DEFAULT 50,
      discount REAL DEFAULT 0,
      down_payment REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'PENDENTE', -- PENDENTE, SINAL_PAGO, PAGO_TOTAL, REEMBOLSADO
      payment_method TEXT DEFAULT 'PIX', -- PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO
      delivery_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );

    -- Itens do Pedido
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      process_type TEXT NOT NULL, -- FDM, RESIN, LASER, PINTURA, COMBO
      description TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      material_id TEXT,
      equipment_id TEXT,
      unit_cost REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      calc_params_json TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- Falhas e Refugos
    CREATE TABLE IF NOT EXISTS print_failures (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      equipment_id TEXT,
      process_type TEXT NOT NULL,
      material_name TEXT,
      lost_qty REAL NOT NULL,
      lost_hours REAL DEFAULT 0,
      financial_loss REAL NOT NULL,
      reason TEXT NOT NULL,
      date TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL
    );

    -- Catálogo de Produtos e Fichas Técnicas
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Geral', -- Colecionáveis, Decoração, Utilidades, Brindes, Arquitetura
      process_type TEXT NOT NULL DEFAULT 'FDM', -- FDM, RESIN, LASER, PINTURA, COMBO
      description TEXT,
      material_id TEXT,
      equipment_id TEXT,
      production_time_hours REAL DEFAULT 0,
      weight_g REAL DEFAULT 0, -- ou ml se resina
      unit_cost REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      margin_percent REAL DEFAULT 60,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      calc_params_json TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Transações Financeiras (Fluxo de Caixa)
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      type TEXT NOT NULL, -- RECEITA, DESPESA
      category TEXT NOT NULL, -- Pedido, Sinal, Insumos, Manutencao, Custos Fixos, Mão de Obra
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'PIX',
      status TEXT NOT NULL DEFAULT 'PAGO', -- PAGO, PENDENTE
      transaction_date TEXT DEFAULT (datetime('now', 'localtime')),
      due_date TEXT,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    -- Imagens dos Produtos do Catálogo
    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      title TEXT,
      is_cover INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Arquivos e Peças/Componentes que compõem o Modelo 3D
    CREATE TABLE IF NOT EXISTS product_files (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      file_type TEXT,
      image_url TEXT,
      quantity INTEGER DEFAULT 1,
      weight_g REAL DEFAULT 0,
      print_time_hours REAL DEFAULT 0,
      notes TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Configurações Gerais do Atelier
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(transaction_date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON financial_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON product_files(product_id);
  `);

  // Migração segura para colunas de peso e tempo nas sub-peças
  try {
    db.prepare(`ALTER TABLE product_files ADD COLUMN weight_g REAL DEFAULT 0`).run();
  } catch (e) {}
  try {
    db.prepare(`ALTER TABLE product_files ADD COLUMN print_time_hours REAL DEFAULT 0`).run();
  } catch (e) {}

  // Migração automática de imagens existentes na tabela products para product_images
  try {
    const productsWithImages = db.prepare(`
      SELECT p.id, p.image_url, p.name 
      FROM products p 
      WHERE p.image_url IS NOT NULL 
        AND trim(p.image_url) != '' 
        AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
    `).all() as { id: string; image_url: string; name: string }[];

    if (productsWithImages && productsWithImages.length > 0) {
      const insertImg = db.prepare(`
        INSERT INTO product_images (id, product_id, image_url, title, is_cover, display_order)
        VALUES (?, ?, ?, ?, 1, 0)
      `);
      for (const prod of productsWithImages) {
        insertImg.run(`img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, prod.id, prod.image_url, prod.name);
      }
    }
  } catch (err) {
    console.error('Erro na migração de product_images:', err);
  }
}

