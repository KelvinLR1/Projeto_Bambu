import db from './db.js';
import { initSchema } from './schema.js';
import { v4 as uuidv4 } from 'uuid';

export function runSeed() {
  initSchema();

  console.log('Seeding database with realistic Brazilian maker data...');

  // Settings
  const settings = [
    { key: 'atelier_name', value: 'Bambu Maker Studio & Atelier', description: 'Nome fantasia do negócio' },
    { key: 'atelier_phone', value: '+55 (11) 98765-4321', description: 'WhatsApp oficial do atelier' },
    { key: 'atelier_email', value: 'contato@bambustudio.com.br', description: 'E-mail oficial' },
    { key: 'atelier_pix_key', value: '11987654321', description: 'Chave Pix (Telefone)' },
    { key: 'atelier_pix_name', value: 'Bambu Maker Studio Ltda', description: 'Nome do titular da chave Pix' },
    { key: 'kwh_cost', value: '0.92', description: 'Custo da energia elétrica por kWh (R$)' },
    { key: 'cad_rate_hour', value: '60.00', description: 'Valor hora técnica Modelagem/CAD/Fatiamento (R$)' },
    { key: 'print_operator_rate_hour', value: '25.00', description: 'Valor hora operador de máquinas (R$)' },
    { key: 'painter_rate_hour', value: '45.00', description: 'Valor hora artesão/pintor (R$)' },
    { key: 'default_profit_margin', value: '65', description: 'Margem de lucro padrão (%)' },
    { key: 'default_down_payment_percent', value: '50', description: 'Percentual padrão de sinal (%)' },
  ];

  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, description) VALUES (@key, @value, @description)
  `);

  for (const s of settings) {
    insertSetting.run(s);
  }

  // Clear existing data for clean seed if re-run
  db.exec(`
    DELETE FROM financial_transactions;
    DELETE FROM print_failures;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM equipment_maintenances;
    DELETE FROM equipments;
    DELETE FROM materials_finishing;
    DELETE FROM materials_laser;
    DELETE FROM materials_resin;
    DELETE FROM materials_fdm;
    DELETE FROM clients;
  `);

  // Clientes
  const clients = [
    {
      id: uuidv4(),
      name: 'Lucas Gabriel Silveira',
      phone: '5511981234567',
      email: 'lucas.silveira@gmail.com',
      document: '412.589.928-11',
      address: 'Rua Augusta, 1400 - Apto 82, Consolação, São Paulo - SP',
      notes: 'Colecionador de estátuas de anime e miniaturas de RPG. Gosta de acabamento fosco.',
    },
    {
      id: uuidv4(),
      name: 'Mariana Duarte Costa',
      phone: '5511993456789',
      email: 'mariana.costa@arquitetura.com.br',
      document: '325.874.198-44',
      address: 'Av. Brigadeiro Faria Lima, 2000, Itaim Bibi, São Paulo - SP',
      notes: 'Arquiteta, solicita maquetes FDM e cortes a laser em papel kraft para maquetes volumétricas.',
    },
    {
      id: uuidv4(),
      name: 'Dr. Roberto Andrade Filho',
      phone: '5511974561230',
      email: 'roberto.odonto@clinica.com.br',
      document: '189.654.712-05',
      address: 'Alameda Santos, 980 - Jardins, São Paulo - SP',
      notes: 'Dentista / Ortodontista. Impressão de biomodelos e guias cirúrgicos em resina.',
    },
    {
      id: uuidv4(),
      name: 'Beatriz Vasconcelos',
      phone: '5521987650011',
      email: 'bia.vasconcelos@games.com',
      document: '089.441.223-90',
      address: 'Rua Visconde de Pirajá, 350, Ipanema, Rio de Janeiro - RJ',
      notes: 'Cosplayer, pede adereços, espadas e capacetes FDM com pintura automotiva.',
    }
  ];

  const insertClient = db.prepare(`
    INSERT INTO clients (id, name, phone, email, document, address, notes)
    VALUES (@id, @name, @phone, @email, @document, @address, @notes)
  `);
  for (const c of clients) insertClient.run(c);

  // Equipamentos
  const equipX1C = {
    id: uuidv4(),
    name: 'Bambu Lab X1-Carbon Combo (AMS)',
    type: 'FDM',
    power_watts: 180,
    purchase_cost: 11500,
    lifespan_hours: 6000,
    hourly_depreciation: 2.20,
    maintenance_interval_hours: 250,
    total_hours: 432,
    hours_since_last_maint: 32,
    status: 'ATIVO',
    notes: 'Bico endurecido 0.4mm instalado. AMS com 4 cores operante.',
  };

  const equipK1 = {
    id: uuidv4(),
    name: 'Creality K1 Max (CoreXY)',
    type: 'FDM',
    power_watts: 250,
    purchase_cost: 5800,
    lifespan_hours: 5000,
    hourly_depreciation: 1.60,
    maintenance_interval_hours: 200,
    total_hours: 195,
    hours_since_last_maint: 195, // Quase no prazo de manutenção preventiva!
    status: 'ATIVO',
    notes: 'Área grande 300x300x300mm. Alerta de lubrificação de eixos próximo.',
  };

  const equipSaturn = {
    id: uuidv4(),
    name: 'Elegoo Saturn 3 Ultra 12K',
    type: 'RESIN',
    power_watts: 120,
    purchase_cost: 4900,
    lifespan_hours: 4000,
    hourly_depreciation: 1.80,
    maintenance_interval_hours: 150,
    total_hours: 88,
    hours_since_last_maint: 88,
    status: 'ATIVO',
    notes: 'Filme ACF novo instalado. Resolução 12K ideal para miniaturas.',
  };

  const equipLaser = {
    id: uuidv4(),
    name: 'TwoTrees TTS-20 Pro Laser Cutter (20W)',
    type: 'LASER',
    power_watts: 130,
    purchase_cost: 4200,
    lifespan_hours: 4500,
    hourly_depreciation: 1.30,
    maintenance_interval_hours: 100,
    total_hours: 64,
    hours_since_last_maint: 14,
    status: 'ATIVO',
    notes: 'Lente limpa com álcool isopropílico. Bomba de ar Air Assist ativa.',
  };

  const equipAirbrush = {
    id: uuidv4(),
    name: 'Aerógrafo Iwata Eclipse HP-CS 0.35mm',
    type: 'AIRBRUSH',
    power_watts: 45, // compressor mini
    purchase_cost: 1650,
    lifespan_hours: 3000,
    hourly_depreciation: 0.80,
    maintenance_interval_hours: 50,
    total_hours: 42,
    hours_since_last_maint: 12,
    status: 'ATIVO',
    notes: 'Agulha e bico 0.35mm. Compressor com tanque de 3L e filtro de umidade.',
  };

  const insertEquip = db.prepare(`
    INSERT INTO equipments (id, name, type, power_watts, purchase_cost, lifespan_hours, hourly_depreciation, maintenance_interval_hours, total_hours, hours_since_last_maint, status, notes)
    VALUES (@id, @name, @type, @power_watts, @purchase_cost, @lifespan_hours, @hourly_depreciation, @maintenance_interval_hours, @total_hours, @hours_since_last_maint, @status, @notes)
  `);
  [equipX1C, equipK1, equipSaturn, equipLaser, equipAirbrush].forEach(e => insertEquip.run(e));

  // Insumos FDM
  const fdmMaterials = [
    {
      id: uuidv4(),
      name: 'PLA Basic Preto Matte',
      brand: 'Bambu Lab',
      material_type: 'PLA',
      color: 'Preto Matte',
      color_hex: '#1a202c',
      spool_price: 139.90,
      spool_weight_g: 1000,
      density: 1.24,
      temp_print: 215,
      temp_bed: 55,
      stock_weight_g: 1850,
      min_stock_g: 400,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'PLA Silk Prata Metálico',
      brand: 'eSun',
      material_type: 'PLA',
      color: 'Prata Silk',
      color_hex: '#cbd5e0',
      spool_price: 155.00,
      spool_weight_g: 1000,
      density: 1.24,
      temp_print: 220,
      temp_bed: 60,
      stock_weight_g: 220, // ALERTA: ABAIXO DO MÍNIMO!
      min_stock_g: 300,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'PETG Transparente Cristal',
      brand: 'Voolt3D',
      material_type: 'PETG',
      color: 'Transparente',
      color_hex: '#e2e8f0',
      spool_price: 109.00,
      spool_weight_g: 1000,
      density: 1.27,
      temp_print: 240,
      temp_bed: 80,
      stock_weight_g: 940,
      min_stock_g: 250,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'ABS Premium Cinza Titan',
      brand: '3D Fila',
      material_type: 'ABS',
      color: 'Cinza Titan',
      color_hex: '#718096',
      spool_price: 119.90,
      spool_weight_g: 1000,
      density: 1.05,
      temp_print: 250,
      temp_bed: 100,
      stock_weight_g: 780,
      min_stock_g: 300,
      active: 1
    }
  ];

  const insertFdm = db.prepare(`
    INSERT INTO materials_fdm (id, name, brand, material_type, color, color_hex, spool_price, spool_weight_g, density, temp_print, temp_bed, stock_weight_g, min_stock_g, active)
    VALUES (@id, @name, @brand, @material_type, @color, @color_hex, @spool_price, @spool_weight_g, @density, @temp_print, @temp_bed, @stock_weight_g, @min_stock_g, @active)
  `);
  fdmMaterials.forEach(m => insertFdm.run(m));

  // Insumos Resina
  const resinMaterials = [
    {
      id: uuidv4(),
      name: 'Standard 8K Cinza Escultura',
      brand: 'Anycubic',
      resin_type: 'Standard 8K',
      color: 'Cinza Escultura',
      color_hex: '#a0aec0',
      bottle_price: 189.90,
      bottle_volume_ml: 1000,
      wash_cure_cost_per_ml: 0.07,
      stock_volume_ml: 1450,
      min_stock_ml: 400,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'ABS-Like V2 Resistente Preta',
      brand: 'Elegoo',
      resin_type: 'ABS-Like',
      color: 'Preto',
      color_hex: '#2d3748',
      bottle_price: 219.00,
      bottle_volume_ml: 1000,
      wash_cure_cost_per_ml: 0.08,
      stock_volume_ml: 190, // ALERTA: ABAIXO DO MÍNIMO!
      min_stock_ml: 300,
      active: 1
    }
  ];

  const insertResin = db.prepare(`
    INSERT INTO materials_resin (id, name, brand, resin_type, color, color_hex, bottle_price, bottle_volume_ml, wash_cure_cost_per_ml, stock_volume_ml, min_stock_ml, active)
    VALUES (@id, @name, @brand, @resin_type, @color, @color_hex, @bottle_price, @bottle_volume_ml, @wash_cure_cost_per_ml, @stock_volume_ml, @min_stock_ml, @active)
  `);
  resinMaterials.forEach(m => insertResin.run(m));

  // Insumos Laser
  const laserMaterials = [
    {
      id: uuidv4(),
      name: 'Papel Couchê Brilho 300g (A4)',
      paper_type: 'Couchê',
      grammature: 300,
      sheet_price: 1.20,
      toner_cost_per_page: 0.35,
      stock_sheets: 240,
      min_stock_sheets: 50,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Papel Kraft Natural 240g (A4)',
      paper_type: 'Kraft',
      grammature: 240,
      sheet_price: 0.95,
      toner_cost_per_page: 0.30,
      stock_sheets: 180,
      min_stock_sheets: 40,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Vinil Adesivo Branco Fosco (A4)',
      paper_type: 'Adesivo',
      grammature: 180,
      sheet_price: 2.50,
      toner_cost_per_page: 0.45,
      stock_sheets: 45,
      min_stock_sheets: 25,
      active: 1
    }
  ];

  const insertLaser = db.prepare(`
    INSERT INTO materials_laser (id, name, paper_type, grammature, sheet_price, toner_cost_per_page, stock_sheets, min_stock_sheets, active)
    VALUES (@id, @name, @paper_type, @grammature, @sheet_price, @toner_cost_per_page, @stock_sheets, @min_stock_sheets, @active)
  `);
  laserMaterials.forEach(m => insertLaser.run(m));

  // Insumos de Acabamento e Pintura
  const finishingMaterials = [
    {
      id: uuidv4(),
      name: 'Lixa d\'Água Grão 400',
      category: 'Lixa',
      brand: 'Norton / 3M',
      unit_type: 'folha',
      cost_per_unit: 3.50,
      stock_qty: 35,
      min_stock_qty: 10,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Lixa d\'Água Grão 800 (Fino)',
      category: 'Lixa',
      brand: '3M',
      unit_type: 'folha',
      cost_per_unit: 4.20,
      stock_qty: 28,
      min_stock_qty: 10,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Primer Microfiller Cinza PU (Aerógrafo)',
      category: 'Primer',
      brand: 'Vallejo Mecha / Colorgin',
      unit_type: 'ml',
      cost_per_unit: 0.38, // R$ 76 por frasco de 200ml
      stock_qty: 350,
      min_stock_qty: 150,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Verniz Bi-componente PU Fosco Alto Sólidos',
      category: 'Verniz',
      brand: 'Skylack',
      unit_type: 'ml',
      cost_per_unit: 0.16,
      stock_qty: 450,
      min_stock_qty: 200,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Verniz Bi-componente PU Ultra Brilho',
      category: 'Verniz',
      brand: 'Skylack',
      unit_type: 'ml',
      cost_per_unit: 0.18,
      stock_qty: 520,
      min_stock_qty: 200,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Tinta Acrílica Aerografia Preto Puro',
      category: 'Tinta',
      brand: 'Vallejo Mecha Color',
      unit_type: 'ml',
      cost_per_unit: 0.55,
      stock_qty: 120,
      min_stock_qty: 60,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Tinta Acrílica Ouro Envelhecido Metálico',
      category: 'Tinta',
      brand: 'Vallejo Game Air',
      unit_type: 'ml',
      cost_per_unit: 0.65,
      stock_qty: 45, // ALERTA: ABAIXO DO MÍNIMO!
      min_stock_qty: 50,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Massa Rápida de Correção / Poliéster',
      category: 'Massa',
      brand: 'Maxi Rubber',
      unit_type: 'g',
      cost_per_unit: 0.06,
      stock_qty: 850,
      min_stock_qty: 250,
      active: 1
    },
    {
      id: uuidv4(),
      name: 'Diluente / Thinner para Aerógrafo 5000',
      category: 'Solvente',
      brand: 'Anjo',
      unit_type: 'ml',
      cost_per_unit: 0.04,
      stock_qty: 1800,
      min_stock_qty: 500,
      active: 1
    }
  ];

  const insertFinishing = db.prepare(`
    INSERT INTO materials_finishing (id, name, category, brand, unit_type, cost_per_unit, stock_qty, min_stock_qty, active)
    VALUES (@id, @name, @category, @brand, @unit_type, @cost_per_unit, @stock_qty, @min_stock_qty, @active)
  `);
  finishingMaterials.forEach(m => insertFinishing.run(m));

  // Manutenções Anteriores
  const maintenances = [
    {
      id: uuidv4(),
      equipment_id: equipX1C.id,
      type: 'LUBRIFICACAO',
      description: 'Limpeza das barras de carbono com álcool isopropílico e lubrificação do fuso Z.',
      performed_at: '2026-08-20 14:30:00',
      cost: 45.00,
      hours_at_maint: 400,
      next_due_hours: 650
    },
    {
      id: uuidv4(),
      equipment_id: equipSaturn.id,
      type: 'TROCA_PECA',
      description: 'Substituição da película ACF do tanque e nivelamento da mesa 12K.',
      performed_at: '2026-08-10 11:00:00',
      cost: 160.00,
      hours_at_maint: 60,
      next_due_hours: 210
    }
  ];

  const insertMaint = db.prepare(`
    INSERT INTO equipment_maintenances (id, equipment_id, type, description, performed_at, cost, hours_at_maint, next_due_hours)
    VALUES (@id, @equipment_id, @type, @description, @performed_at, @cost, @hours_at_maint, @next_due_hours)
  `);
  maintenances.forEach(m => insertMaint.run(m));

  // Pedidos nos diferentes status do Kanban
  const orders = [
    {
      id: uuidv4(),
      order_number: 'OS-2026-001',
      client_id: clients[0].id, // Lucas
      title: 'Estátua Berserk Guts 1/6 (Resina + Pintura Detalhada)',
      status: 'EM_PINTURA',
      total_cost: 185.40,
      total_price: 580.00,
      margin_percent: 68,
      discount: 0,
      down_payment: 290.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'PIX',
      delivery_date: '2026-09-22',
      notes: 'Pintura sombreada com aerógrafo, detalhes de sangue na espada Dragonslayer e capa com acabamento ultra fosco.',
      created_at: '2026-09-10 10:15:00',
      items: [
        {
          process_type: 'RESIN',
          description: 'Corpo e Base Guts 1/6 em Resina 8K Cinza (340ml, 11h de exposição)',
          quantity: 1,
          material_id: resinMaterials[0].id,
          equipment_id: equipSaturn.id,
          unit_cost: 95.40,
          unit_price: 260.00,
          calc_params: { volume_ml: 340, hours: 11, material_cost: 64.56, wash_cure: 23.80, energy_depr: 7.04 }
        },
        {
          process_type: 'PINTURA',
          description: 'Preparação, Primer PU, Aerografia e Acabamento Manual Nível Master (6h)',
          quantity: 1,
          material_id: null,
          equipment_id: equipAirbrush.id,
          unit_cost: 90.00,
          unit_price: 320.00,
          calc_params: { prep_hours: 2, paint_hours: 4, primer_cost: 15, paint_cost: 30, varnish_cost: 12 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-002',
      client_id: clients[1].id, // Mariana
      title: 'Maquete Edifício Residencial Horizonte 1:100 (FDM + Laser)',
      status: 'EM_IMPRESSAO',
      total_cost: 142.50,
      total_price: 490.00,
      margin_percent: 70,
      discount: 0,
      down_payment: 245.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'PIX',
      delivery_date: '2026-09-20',
      notes: 'Torre fatiada em 3 partes no Bambu X1C. Detalhes de fachadas e marquises em corte laser Kraft 240g.',
      created_at: '2026-09-12 15:30:00',
      items: [
        {
          process_type: 'FDM',
          description: 'Torre Central 1:100 em PLA Matte Preto (620g, 18h)',
          quantity: 1,
          material_id: fdmMaterials[0].id,
          equipment_id: equipX1C.id,
          unit_cost: 112.50,
          unit_price: 380.00,
          calc_params: { weight_g: 620, hours: 18, filament_cost: 86.73, energy_depr: 25.77 }
        },
        {
          process_type: 'LASER',
          description: 'Corte e Gravação Fachada em Kraft 240g (15 pranchas A4)',
          quantity: 1,
          material_id: laserMaterials[1].id,
          equipment_id: equipLaser.id,
          unit_cost: 30.00,
          unit_price: 110.00,
          calc_params: { sheets: 15, sheet_cost: 14.25, laser_time_min: 40 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-003',
      client_id: clients[2].id, // Dr Roberto
      title: 'Kit 4x Biomodelos Odontológicos Maxila/Mandíbula com Guias',
      status: 'PRONTO',
      total_cost: 82.00,
      total_price: 320.00,
      margin_percent: 74,
      discount: 0,
      down_payment: 160.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'PIX',
      delivery_date: '2026-09-16',
      notes: 'Biomodelos para planejamento cirúrgico. Cliente virá retirar às 18:30.',
      created_at: '2026-09-14 09:00:00',
      items: [
        {
          process_type: 'RESIN',
          description: '4 Biomodelos Anatômicos em Resina 8K de Alta Precisão (180ml)',
          quantity: 4,
          material_id: resinMaterials[0].id,
          equipment_id: equipSaturn.id,
          unit_cost: 20.50,
          unit_price: 80.00,
          calc_params: { volume_ml: 180, hours: 5.5 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-004',
      client_id: clients[3].id, // Beatriz
      title: 'Capacete Mandalorian 1:1 Cosplay Completo',
      status: 'EM_PREPARACAO',
      total_cost: 260.00,
      total_price: 950.00,
      margin_percent: 72,
      discount: 50.00,
      down_payment: 450.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'CARTAO_CREDITO',
      delivery_date: '2026-09-28',
      notes: 'Impresso em PLA e colado. Fase atual: aplicação de massa poliéster e lixamento grão 400.',
      created_at: '2026-09-08 14:00:00',
      items: [
        {
          process_type: 'FDM',
          description: 'Capacete Mandalorian em 4 partes PLA (1100g, 36h)',
          quantity: 1,
          material_id: fdmMaterials[0].id,
          equipment_id: equipK1.id,
          unit_cost: 160.00,
          unit_price: 520.00,
          calc_params: { weight_g: 1100, hours: 36 }
        },
        {
          process_type: 'PINTURA',
          description: 'Pós-Processamento, Massa, Primer PU e Pintura Efeito Cromo Beskar',
          quantity: 1,
          material_id: null,
          equipment_id: equipAirbrush.id,
          unit_cost: 100.00,
          unit_price: 430.00,
          calc_params: { prep_hours: 4, paint_hours: 3 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-005',
      client_id: clients[0].id, // Lucas
      title: 'Diorama Cyberpunk Neo-Tokyo com Iluminação LED',
      status: 'SECAGEM_VERNIZ',
      total_cost: 198.00,
      total_price: 680.00,
      margin_percent: 70,
      discount: 0,
      down_payment: 340.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'PIX',
      delivery_date: '2026-09-18',
      notes: 'Pintura finalizada. Em cabine de secagem com Verniz PU bi-componente.',
      created_at: '2026-09-05 11:20:00',
      items: [
        {
          process_type: 'COMBO',
          description: 'Edifícios FDM + Miniaturas Resina + Pintura Fluo & Verniz',
          quantity: 1,
          material_id: null,
          equipment_id: equipX1C.id,
          unit_cost: 198.00,
          unit_price: 680.00,
          calc_params: { fdm_weight: 450, resin_ml: 120, paint_hours: 5 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-006',
      client_id: clients[1].id, // Mariana
      title: 'Conjunto 50x Cartões de Visita em Papel Couchê 300g com Corte Especial',
      status: 'ORCAMENTO',
      total_cost: 38.00,
      total_price: 135.00,
      margin_percent: 71,
      discount: 0,
      down_payment: 0,
      payment_status: 'PENDENTE',
      payment_method: 'PIX',
      delivery_date: '2026-09-25',
      notes: 'Orçamento enviado para aprovação da cliente via WhatsApp.',
      created_at: '2026-09-16 11:45:00',
      items: [
        {
          process_type: 'LASER',
          description: 'Impressão Colorida Laser + Corte de Contorno Vazado',
          quantity: 50,
          material_id: laserMaterials[0].id,
          equipment_id: equipLaser.id,
          unit_cost: 0.76,
          unit_price: 2.70,
          calc_params: { sheets: 6, laser_minutes: 25 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-007',
      client_id: clients[3].id, // Beatriz
      title: 'Espada Buster Sword 1.80m Final Fantasy VII',
      status: 'APROVADO',
      total_cost: 340.00,
      total_price: 1250.00,
      margin_percent: 72,
      discount: 0,
      down_payment: 625.00,
      payment_status: 'SINAL_PAGO',
      payment_method: 'PIX',
      delivery_date: '2026-10-05',
      notes: 'Sinal recebido. Fila de fatiamento pronta para iniciar no Creality K1 Max.',
      created_at: '2026-09-15 16:10:00',
      items: [
        {
          process_type: 'FDM',
          description: 'Lâmina e Guarda em 8 blocos encaixáveis PETG/PLA (2.4kg, 52h)',
          quantity: 1,
          material_id: fdmMaterials[2].id,
          equipment_id: equipK1.id,
          unit_cost: 240.00,
          unit_price: 850.00,
          calc_params: { weight_g: 2400, hours: 52 }
        },
        {
          process_type: 'PINTURA',
          description: 'União com vergalhão de aço, massa plástica, primer e pintura metálica envelhecida',
          quantity: 1,
          material_id: null,
          equipment_id: equipAirbrush.id,
          unit_cost: 100.00,
          unit_price: 400.00,
          calc_params: { prep_hours: 5, paint_hours: 4 }
        }
      ]
    },
    {
      id: uuidv4(),
      order_number: 'OS-2026-008',
      client_id: clients[2].id, // Dr Roberto
      title: 'Guia Cirúrgico Duplo para Implantes Dentários',
      status: 'ENTREGUE',
      total_cost: 45.00,
      total_price: 190.00,
      margin_percent: 76,
      discount: 0,
      down_payment: 190.00,
      payment_status: 'PAGO_TOTAL',
      payment_method: 'PIX',
      delivery_date: '2026-09-11',
      notes: 'Entregue com nota e comprovante via WhatsApp.',
      created_at: '2026-09-08 10:00:00',
      items: [
        {
          process_type: 'RESIN',
          description: 'Guias de precisão 12K pós-curados e esterilizados',
          quantity: 2,
          material_id: resinMaterials[0].id,
          equipment_id: equipSaturn.id,
          unit_cost: 22.50,
          unit_price: 95.00,
          calc_params: { volume_ml: 65, hours: 3 }
        }
      ]
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, client_id, title, status, total_cost, total_price, margin_percent, discount, down_payment, payment_status, payment_method, delivery_date, notes, created_at, updated_at)
    VALUES (@id, @order_number, @client_id, @title, @status, @total_cost, @total_price, @margin_percent, @discount, @down_payment, @payment_status, @payment_method, @delivery_date, @notes, @created_at, @created_at)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, process_type, description, quantity, material_id, equipment_id, unit_cost, unit_price, calc_params_json)
    VALUES (@id, @order_id, @process_type, @description, @quantity, @material_id, @equipment_id, @unit_cost, @unit_price, @calc_params_json)
  `);

  for (const o of orders) {
    const { items, ...orderData } = o;
    insertOrder.run(orderData);
    for (const item of items) {
      insertItem.run({
        id: uuidv4(),
        order_id: o.id,
        process_type: item.process_type,
        description: item.description,
        quantity: item.quantity,
        material_id: item.material_id,
        equipment_id: item.equipment_id,
        unit_cost: item.unit_cost,
        unit_price: item.unit_price,
        calc_params_json: JSON.stringify(item.calc_params)
      });
    }
  }

  // Falhas e Refugos (Histórico para cálculo de perda real)
  const failures = [
    {
      id: uuidv4(),
      order_id: orders[1].id,
      equipment_id: equipK1.id,
      process_type: 'FDM',
      material_name: 'PLA Basic Preto Matte',
      lost_qty: 180,
      lost_hours: 6.5,
      financial_loss: 42.50,
      reason: 'Descolamento da mesa no canto esquerdo (Warping por corrente de ar)',
      date: '2026-09-11 02:40:00'
    },
    {
      id: uuidv4(),
      order_id: null,
      equipment_id: equipSaturn.id,
      process_type: 'RESIN',
      material_name: 'Standard 8K Cinza Escultura',
      lost_qty: 85,
      lost_hours: 3.0,
      financial_loss: 32.00,
      reason: 'Suportes insuficientes na ponta da espada - delaminação da camada',
      date: '2026-09-07 19:15:00'
    }
  ];

  const insertFailure = db.prepare(`
    INSERT INTO print_failures (id, order_id, equipment_id, process_type, material_name, lost_qty, lost_hours, financial_loss, reason, date)
    VALUES (@id, @order_id, @equipment_id, @process_type, @material_name, @lost_qty, @lost_hours, @financial_loss, @reason, @date)
  `);
  failures.forEach(f => insertFailure.run(f));

  // Transações Financeiras (Fluxo de Caixa)
  const transactions = [
    // Entradas (Receitas de pedidos)
    {
      id: uuidv4(),
      order_id: orders[7].id,
      type: 'RECEITA',
      category: 'Venda Pedido',
      amount: 190.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-11 11:20:00',
      notes: 'Pagamento total OS-2026-008 Guia Cirúrgico'
    },
    {
      id: uuidv4(),
      order_id: orders[0].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 290.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-10 10:30:00',
      notes: 'Sinal de 50% OS-2026-001 Estátua Guts Berserk'
    },
    {
      id: uuidv4(),
      order_id: orders[1].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 245.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-12 16:00:00',
      notes: 'Sinal de 50% OS-2026-002 Maquete Residencial'
    },
    {
      id: uuidv4(),
      order_id: orders[2].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 160.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-14 09:30:00',
      notes: 'Sinal de 50% OS-2026-003 Biomodelos Odonto'
    },
    {
      id: uuidv4(),
      order_id: orders[3].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 450.00,
      payment_method: 'CARTAO_CREDITO',
      status: 'PAGO',
      transaction_date: '2026-09-08 14:15:00',
      notes: 'Sinal no cartão OS-2026-004 Capacete Mandalorian'
    },
    {
      id: uuidv4(),
      order_id: orders[4].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 340.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-05 11:40:00',
      notes: 'Sinal de 50% OS-2026-005 Diorama Neo-Tokyo'
    },
    {
      id: uuidv4(),
      order_id: orders[6].id,
      type: 'RECEITA',
      category: 'Sinal Pedido',
      amount: 625.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-15 16:30:00',
      notes: 'Sinal de 50% OS-2026-007 Espada Buster Sword'
    },

    // Saídas (Despesas com insumos, manutenção, custos fixos)
    {
      id: uuidv4(),
      order_id: null,
      type: 'DESPESA',
      category: 'Compra Filamento',
      amount: 430.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-02 14:00:00',
      notes: 'Compra de 3x Spools PLA Bambu Lab + 1x PETG'
    },
    {
      id: uuidv4(),
      order_id: null,
      type: 'DESPESA',
      category: 'Compra Resina',
      amount: 380.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-09-03 10:15:00',
      notes: 'Compra de 2x Garrafas Anycubic Standard 8K'
    },
    {
      id: uuidv4(),
      order_id: null,
      type: 'DESPESA',
      category: 'Compra Tintas',
      amount: 215.00,
      payment_method: 'CARTAO_CREDITO',
      status: 'PAGO',
      transaction_date: '2026-09-04 16:45:00',
      notes: 'Kits tintas Vallejo Mecha e Verniz Bi-componente PU'
    },
    {
      id: uuidv4(),
      order_id: null,
      type: 'DESPESA',
      category: 'Energia Eletrica',
      amount: 345.80,
      payment_method: 'BOLETO',
      status: 'PAGO',
      transaction_date: '2026-09-05 09:00:00',
      notes: 'Conta de luz Enel - Atelier do mês anterior'
    },
    {
      id: uuidv4(),
      order_id: null,
      type: 'DESPESA',
      category: 'Manutencao',
      amount: 160.00,
      payment_method: 'PIX',
      status: 'PAGO',
      transaction_date: '2026-08-10 11:30:00',
      notes: 'Película ACF para Elegoo Saturn 3 Ultra'
    }
  ];

  const insertTx = db.prepare(`
    INSERT INTO financial_transactions (id, order_id, type, category, amount, payment_method, status, transaction_date, notes)
    VALUES (@id, @order_id, @type, @category, @amount, @payment_method, @status, @transaction_date, @notes)
  `);
  transactions.forEach(t => insertTx.run(t));

  // Catálogo de Produtos & Fichas Técnicas
  const products = [
    {
      id: uuidv4(),
      sku: 'PRD-LUA-15',
      name: 'Luminária Lua Litofania 15cm (Base Touch + LED)',
      category: 'Decoração & Iluminação',
      process_type: 'FDM',
      description: 'Luminária esférica impressa com relevo topográfico hiper-detalhado da Lua, bocal para soquete G9 e base em madeira/PLA preto.',
      production_time_hours: 14.5,
      weight_g: 190,
      unit_cost: 32.50,
      unit_price: 129.00,
      margin_percent: 74,
      image_url: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=400&q=80',
    },
    {
      id: uuidv4(),
      sku: 'PRD-GUTS-RES',
      name: 'Estátua Berserk Guts 1/6 (Resina 8K Prime)',
      category: 'Colecionáveis & Miniaturas',
      process_type: 'RESIN',
      description: 'Escultura de colecionador em Resina 8K com altura de 32cm, resolução ultra-fina de 30 micra, curada e lavada em IPA.',
      production_time_hours: 6.0,
      weight_g: 130, // 130ml
      unit_cost: 49.00,
      unit_price: 185.00,
      margin_percent: 73,
      image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80',
    },
    {
      id: uuidv4(),
      sku: 'PRD-GUTS-PNT',
      name: 'Action Figure Guts Berserker (Pintura Artística + Verniz)',
      category: 'Colecionáveis & Miniaturas',
      process_type: 'PINTURA',
      description: 'Pós-processamento completo com lixamento 1000, primer PU, aerografia de sombras, wash acrílico e selagem com verniz fosco bicomponente.',
      production_time_hours: 8.5,
      weight_g: 0,
      unit_cost: 115.00,
      unit_price: 395.00,
      margin_percent: 70,
      image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80',
    },
    {
      id: uuidv4(),
      sku: 'PRD-SUP-TAB',
      name: 'Suporte Articulado Dobrável para Tablet & iPad',
      category: 'Utilidades & Gadgets',
      process_type: 'FDM',
      description: 'Suporte print-in-place ultra resistente em PETG, ângulos ajustáveis de 15° a 75°, com apoios emborrachados anti-derrapantes.',
      production_time_hours: 3.8,
      weight_g: 95,
      unit_cost: 14.20,
      unit_price: 59.90,
      margin_percent: 76,
      image_url: 'https://images.unsplash.com/photo-1586775490184-b79f0621891f?w=400&q=80',
    },
    {
      id: uuidv4(),
      sku: 'PRD-LAS-CART',
      name: 'Kit 50x Cartões Couchê 300g com Corte Especial a Laser',
      category: 'Papelaria & Brindes',
      process_type: 'LASER',
      description: 'Cartões institucionais em couchê premium com impressão colorida digital e bordas vazadas recortadas a laser de alta precisão.',
      production_time_hours: 0.6,
      weight_g: 25,
      unit_cost: 26.50,
      unit_price: 98.00,
      margin_percent: 72,
      image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=400&q=80',
    },
    {
      id: uuidv4(),
      sku: 'PRD-MAND-COS',
      name: 'Capacete Mandalorian 1:1 Cosplay (FDM + Pintura Cromada)',
      category: 'Cosplay & Props',
      process_type: 'COMBO',
      description: 'Tamanho real 1:1, reforçado para uso, lixado até 1500, acabamento com tinta Alclad cromo metálico espelhado e visor fumê flexível.',
      production_time_hours: 28.0,
      weight_g: 820,
      unit_cost: 275.00,
      unit_price: 890.00,
      margin_percent: 69,
      image_url: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&q=80',
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, sku, name, category, process_type, description,
      production_time_hours, weight_g, unit_cost, unit_price, margin_percent, image_url
    ) VALUES (@id, @sku, @name, @category, @process_type, @description, @production_time_hours, @weight_g, @unit_cost, @unit_price, @margin_percent, @image_url)
  `);
  products.forEach(p => insertProduct.run(p));

  // Seed de Fotos de Capa
  const insertProductImage = db.prepare(`
    INSERT INTO product_images (id, product_id, image_url, title, is_cover, display_order)
    VALUES (?, ?, ?, ?, 1, 0)
  `);
  products.forEach(p => {
    if (p.image_url) {
      insertProductImage.run(`img_${uuidv4().replace(/-/g, '').substring(0, 16)}`, p.id, p.image_url, p.name);
    }
  });

  // Seed de Peças/Arquivos Componentes
  const insertProductFile = db.prepare(`
    INSERT INTO product_files (id, product_id, name, filename, file_url, file_size, file_type, image_url, quantity, weight_g, print_time_hours, notes, display_order)
    VALUES (@id, @product_id, @name, @filename, @file_url, @file_size, @file_type, @image_url, @quantity, @weight_g, @print_time_hours, @notes, @display_order)
  `);

  // Sub-peças do Capacete Mandalorian (products[5])
  const mandoParts = [
    {
      id: uuidv4(),
      product_id: products[5].id,
      name: 'Casco Principal / Domo Superior',
      filename: 'mando_helmet_dome_1to1.stl',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 19450000,
      file_type: 'STL',
      image_url: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=400&q=80',
      quantity: 1,
      weight_g: 480,
      print_time_hours: 16.0,
      notes: '3 paredes perimetrais, infill 15% giroide, sem suporte na cúpula. Fatiar no Bambu Studio com perfil 0.20mm Standard.',
      display_order: 1
    },
    {
      id: uuidv4(),
      product_id: products[5].id,
      name: 'Bochechas & Respiradores Frontais',
      filename: 'mando_cheeks_respirator.3mf',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 7120000,
      file_type: '3MF',
      image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
      quantity: 2,
      weight_g: 80,
      print_time_hours: 3.5,
      notes: 'Suportes em árvore finos (tree support), camada 0.16mm para mínimo lixamento. PLA Prata.',
      display_order: 2
    },
    {
      id: uuidv4(),
      product_id: products[5].id,
      name: 'Orelhas & Tampa de Antena Lateral',
      filename: 'mando_ears_antenna_caps.step',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 3450000,
      file_type: 'STEP',
      image_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80',
      quantity: 2,
      weight_g: 50,
      print_time_hours: 1.5,
      notes: '100% infill para resistência mecânica. Rosca métrica M3 embutida.',
      display_order: 3
    },
    {
      id: uuidv4(),
      product_id: products[5].id,
      name: 'Travas e Suporte do Visor Fumê',
      filename: 'mando_visor_mounting_clips.stl',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 1420000,
      file_type: 'STL',
      image_url: 'https://images.unsplash.com/photo-1586775490184-b79f0621891f?w=400&q=80',
      quantity: 4,
      weight_g: 20,
      print_time_hours: 0.5,
      notes: 'Imprimir em PETG Preto para flexibilidade no encaixe por pressão do visor acrílico.',
      display_order: 4
    }
  ];
  mandoParts.forEach(p => insertProductFile.run(p));

  // Sub-peças da Luminária Lua (products[0])
  const moonParts = [
    {
      id: uuidv4(),
      product_id: products[0].id,
      name: 'Globo Lunar Litofania 15cm',
      filename: 'moon_15cm_lithophane_detailed.stl',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 35800000,
      file_type: 'STL',
      image_url: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=400&q=80',
      quantity: 1,
      weight_g: 130,
      print_time_hours: 11.5,
      notes: '100% infill concêntrico, altura 0.12mm High Detail, PLA Branco Puro, bico 0.4mm.',
      display_order: 1
    },
    {
      id: uuidv4(),
      product_id: products[0].id,
      name: 'Base Tripé em Madeira / Encaixe',
      filename: 'moon_tripod_base_wood.3mf',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 4200000,
      file_type: '3MF',
      image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80',
      quantity: 1,
      weight_g: 45,
      print_time_hours: 2.2,
      notes: 'Filamento PLA Wood com acabamento lixado e verniz acetinado.',
      display_order: 2
    },
    {
      id: uuidv4(),
      product_id: products[0].id,
      name: 'Rosca e Soquete LED G9',
      filename: 'led_socket_mount_g9.step',
      file_url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/stl/ascii/slotted_disk.stl',
      file_size: 890000,
      file_type: 'STEP',
      image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80',
      quantity: 1,
      weight_g: 15,
      print_time_hours: 0.8,
      notes: 'PETG resistente a temperatura da lâmpada LED bivolt.',
      display_order: 3
    }
  ];
  moonParts.forEach(p => insertProductFile.run(p));

  console.log('Database seeded successfully with products catalog and component parts!');
}

// Auto-run if executed directly via CLI
runSeed();
