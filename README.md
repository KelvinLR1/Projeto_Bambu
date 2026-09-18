# Projeto Bambu - Sistema Integrado de Gestão Maker & Atelier

Sistema completo de gestão de pedidos, controle de produção multifuncional (Impressão 3D FDM, Resina 8K/12K, Corte e Impressão a Laser, Pós-Processamento e Pintura Artesanal), controle de estoque inteligente com refugos, manutenção preventiva de máquinas e fluxo de caixa financeiro.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: v18+ (recomendado v20 ou v24)
- **npm**: v9+

### 1. Inicialização Rápida no Windows (Scripts .BAT)
Basta dar um duplo clique ou executar no terminal na raiz:
- **`iniciar.bat`** (ou `start.bat`): Verifica dependências, inicia o servidor e o cliente, e abre automaticamente no navegador ([http://localhost:5173](http://localhost:5173)).
- **`parar.bat`** (ou `stop.bat`): Encerra os serviços do backend e frontend com segurança e libera as portas 3002 e 5173.

---

### 2. Instalação Manual
Na raiz do projeto (`Projeto_Bambu`):
```bash
# Instala as dependências da raiz
npm install

# Instala dependências do backend
cd server && npm install && cd ..

# Instala dependências do frontend
cd client && npm install && cd ..
```

### 3. Popular o Banco de Dados com Dados Realistas (Seed)
O sistema utiliza **SQLite** com modo WAL (Write-Ahead Logging) de alta performance, sem necessidade de instalar servidores externos de banco. Para inicializar as tabelas e dados reais do atelier:
```bash
npm run seed
```

### 4. Rodar em Desenvolvimento via Linha de Comando (Frontend + Backend)
Na raiz do projeto:
```bash
npm run dev
```
- **Frontend SPA (Vite + React):** [http://localhost:5173](http://localhost:5173)
- **Backend API REST (Express):** [http://localhost:3002](http://localhost:3002)
- **Healthcheck da API:** [http://localhost:3002/api/health](http://localhost:3002/api/health)

---

## 🏛️ Arquitetura e Estrutura do Projeto

```
Projeto_Bambu/
├── client/                     # Frontend React (Vite + TypeScript + Vanilla CSS)
│   ├── src/
│   │   ├── components/         # KanbanBoard, Navbar, OrderDetailModal, OrderModal, PrintDocumentModal
│   │   ├── pages/              # OrdersPage, CalculatorPage, StockPage, EquipmentsPage, FinancialPage, ClientsPage, SettingsPage
│   │   ├── services/           # api.ts (cliente HTTP tipado com proxy)
│   │   ├── types/              # index.ts (interfaces de domínio)
│   │   ├── utils/              # formatters.ts (moeda BRL, datas, status e confetti)
│   │   ├── App.tsx             # Orquestrador central e navegação
│   │   └── index.css           # Design System Dark Mode, glassmorphism e regras de impressão @media print
│   ├── vite.config.ts          # Proxy reverso /api -> :3001
│   └── package.json
├── server/                     # Backend Node.js (Express + Better-SQLite3 + TypeScript)
│   ├── src/
│   │   ├── database/           # db.ts (WAL mode), schema.ts (DDL) e seed.ts (dados de exemplo)
│   │   ├── routes/             # clients, materials, equipments, orders, calculator, failures, financial, settings, whatsapp
│   │   ├── services/           # costCalculator.ts, stockService.ts, whatsappService.ts
│   │   └── index.ts            # Servidor Express REST
│   ├── tsconfig.json
│   └── package.json
├── data/                       # Arquivo do banco SQLite persistente (bambu.db)
├── package.json                # Scripts unificados da raiz (dev, build, seed)
└── README.md                   # Este manual
```

---

## 🗄️ Modelagem do Banco de Dados (Schema SQLite)

1. **`clients`**: Id, nome, telefone/WhatsApp, e-mail, CPF/CNPJ, endereço e anotações.
2. **`materials_fdm`**: Carretéis de filamento (PLA, PETG, ABS, TPU), marca, cor, hex, preço de compra, peso (g), densidade, temperaturas e estoque atual com estoque mínimo.
3. **`materials_resin`**: Resinas (Standard 8K, ABS-like, Tough), preço por litro, insumos de lavagem/cura (álcool IPA + desgaste de filme FEP/LCD), estoque em ml e estoque mínimo.
4. **`materials_laser`**: Papéis (Couchê 300g, Kraft, Adesivo vinílico), gramatura, preço da folha, custo de toner/laser por folha e estoque.
5. **`materials_finishing`**: Insumos de acabamento (lixas d'água grãos 400 a 1500, primers PU, tintas acrílicas para aerógrafo, vernizes bi-componentes fosco e brilho, massa rápida e solventes).
6. **`equipments`**: Cadastro de impressoras 3D (Bambu Lab X1C, Creality K1, Elegoo Saturn 3), gravadoras laser e aerógrafos, horômetro acumulado em horas, potência em Watts e taxa de depreciação horária.
7. **`equipment_maintenances`**: Histórico de intervenções preventivas, corretivas e lubrificações com registro de peças e custos.
8. **`orders`**: Ordens de Serviço numeradas sequencialmente (`OS-YYYY-XXX`), cliente, título do projeto, status de produção, valor total, custo de produção, sinal de entrada (50%), status do pagamento e data de entrega.
9. **`order_items`**: Itens por processo (FDM, Resina, Laser, Pintura, Combo), matéria-prima consumida, equipamento e parâmetros de fatiamento.
10. **`print_failures`**: Registro de refugos e falhas de impressão (peso perdido, tempo de máquina perdido, motivo e prejuízo financeiro apurado).
11. **`financial_transactions`**: Fluxo de caixa de entradas (vendas e sinais) e saídas (compras de insumos, manutenção de máquinas, custos fixos e energia).
12. **`settings`**: Configurações flexíveis do atelier (custo do kWh, taxas horárias de modelagem/CAD, operador e artesão pintor, chave Pix e margens).

---

## ⚙️ Funcionalidades em Destaque

### 1. Dashboard Central & Inteligência Analítica (Cockpit Maker)
- **Visão Macro Consolidada**: Faturamento bruto, lucro líquido, margem real acumulada e valores a receber.
- **Linha de Produção & Parque de Máquinas**: Total de pedidos ativos na bancada, impressoras rodando vs. em manutenção preventiva e horímetro gravado.
- **Rentabilidade Comparativa por Tecnologia**: Gráficos de receita, custo e margem comparando FDM, Resina 3D, Laser e Pintura.
- **Alerta de Insumos Críticos & Eficiência**: Taxa de sucesso de fabricação, custo de refugos e atalhos rápidos de navegação.

### 2. Quadro Kanban de Produção
- Visualização em 8 colunas: *Orçamento* ➔ *Aprovado* ➔ *Em Impressão* ➔ *Preparação/Pós* ➔ *Em Pintura* ➔ *Secagem/Verniz* ➔ *Pronto* ➔ *Entregue*.
- Arraste e solte (Drag & Drop) nativo para troca imediata de estágio de oficina.
- Ao entrar em produção ou conclusão, o sistema dispara **baixa automática de estoque** de filamento/resina e soma as horas no **horômetro da máquina**.

### 3. Módulo de Integração WhatsApp
- Geração instantânea de links universais (`https://wa.me/...`) compatíveis com WhatsApp Web e aplicativo mobile.
- Templates contextuais prontos para disparo com 1 clique:
  - **Orçamento Oficial**: Resumo dos itens, valor total, sinal de 50% e chave Pix para aprovação.
  - **Início da Produção**: Aviso de que as máquinas iniciaram a impressão da peça.
  - **Bancada de Pintura & Pós-Processamento**: Notificação de início do acabamento artesanal e verniz.
  - **Pedido Pronto para Retirada**: Aviso de conclusão com saldo restante na entrega.
  - **Lembrete de Cobrança**: Mensagem educada com valor pendente e chave Pix.

### 3. Calculadora Precisa de Custos Maker
- **FDM:** Custo real do filamento por grama + energia (kWh) + depreciação da máquina + horas de fatiamento/CAD + buffer de perda + margem de lucro.
- **Resina:** Volume (ml) + custo de lavagem e cura (álcool IPA + desgaste de FEP/LCD) + energia + depreciação + margem.
- **Laser:** Quantidade de folhas + custo de toner + tempo de gravação laser + acabamentos gráficos + margem.
- **Pintura & Acabamento:** Porte da peça (P, M, G, GG, Complexa) + horas de preparação (lixamento/massa) + horas de aerógrafo/pintura artística + verniz bi-componente + margem.
- Botão **"Transformar em Ordem de Serviço"** transfere todos os cálculos diretamente para o formulário de pedido.

### 4. Emissão de Documentos & Impressão
- **Ordem de Serviço Completa (A4):** Layout profissional com especificações técnicas, dados do cliente, chave Pix e campos de assinatura.
- **Cupom Térmico (80mm):** Formato otimizado para mini-impressoras térmicas de balcão (ESC/POS) com extrato e totalizador.

### 5. Gestão de Refugos e Manutenção Preventiva
- Painel com horômetros em tempo real de cada máquina.
- Barra de alerta visual quando a impressora atinge as horas recomendadas para lubrificação de eixos ou troca de peças.
- Registro de falhas de impressão com análise dos principais motivos de perda e impacto monetário acumulado.

### 6. Fluxo de Caixa e Relatórios de Lucratividade
- Visão de receitas pagas, saídas operacionais, lucro líquido e saldos pendentes de recebimento na entrega.
- Análise de rentabilidade comparativa entre processos (ex: lucratividade da Impressão 3D vs. Pintura Artesanal).
