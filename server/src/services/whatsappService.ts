import db from '../database/db.js';

export interface OrderWhatsAppContext {
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  title: string;
  status: string;
  totalPrice: number;
  downPayment: number;
  remainingBalance: number;
  deliveryDate?: string;
  itemsSummary: string;
  pixKey?: string;
  pixName?: string;
  atelierName?: string;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function cleanPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function getOrderWhatsAppTemplates(ctx: OrderWhatsAppContext) {
  const atelier = ctx.atelierName || 'Bambu Maker Studio & Atelier';
  const remaining = ctx.totalPrice - (ctx.downPayment || 0);

  const templates: Record<string, { label: string; text: string }> = {
    ORCAMENTO: {
      label: 'Orçamento / Proposta Comercial',
      text: `🎨 *${atelier}* - *Orçamento Oficial*\n\n` +
        `Olá, *${ctx.clientName}*! Tudo bem?\n\n` +
        `Preparamos a proposta para o seu projeto:\n` +
        `📋 *Ordem de Serviço:* ${ctx.orderNumber}\n` +
        `🎯 *Projeto:* ${ctx.title}\n` +
        `⚙️ *Detalhes:* ${ctx.itemsSummary}\n` +
        (ctx.deliveryDate ? `📅 *Previsão de Entrega:* ${ctx.deliveryDate}\n` : '') +
        `\n💰 *Investimento Total:* ${formatCurrencyBRL(ctx.totalPrice)}\n` +
        (ctx.downPayment > 0 ? `💵 *Sinal para Início (50%):* ${formatCurrencyBRL(ctx.downPayment)}\n` : '') +
        (ctx.pixKey ? `\n🔑 *Chave Pix para confirmação:*\n${ctx.pixKey} (${ctx.pixName || atelier})\n` : '') +
        `\nQualquer dúvida ou ajuste nos avise por aqui para iniciarmos a produção! 🚀`
    },

    EM_PRODUCAO: {
      label: 'Início de Produção / Em Impressão',
      text: `🖨️ *${atelier}* - *Status de Produção*\n\n` +
        `Olá, *${ctx.clientName}*!\n` +
        `Temos ótimas notícias: o seu pedido *${ctx.orderNumber}* (${ctx.title}) já entrou em produção em nossas máquinas! ⚙️\n\n` +
        `Nossos operadores estão acompanhando o processo camada por camada com controle rigoroso de qualidade.\n\n` +
        `Te manteremos atualizado(a) a cada etapa!`
    },

    EM_PINTURA: {
      label: 'Pós-Processamento e Pintura Artesanal',
      text: `🖌️ *${atelier}* - *Etapa de Pintura e Acabamento*\n\n` +
        `Olá, *${ctx.clientName}*!\n` +
        `Seu pedido *${ctx.orderNumber}* (${ctx.title}) finalizou a etapa de impressão e agora está na bancada do nosso atelier para:\n\n` +
        `✨ Lixamento técnico e primer\n` +
        `🎨 Pintura artesanal / Aerografia detalhada\n` +
        `🛡️ Aplicação de verniz protetor bicomponente\n\n` +
        `Logo mais enviaremos fotos do resultado final!`
    },

    PRONTO: {
      label: 'Pedido Pronto para Retirada / Envio',
      text: `🎉 *${atelier}* - *Seu Pedido Está Pronto!*\n\n` +
        `Olá, *${ctx.clientName}*!\n` +
        `Temos a alegria de informar que o seu pedido *${ctx.orderNumber}* (*${ctx.title}*) foi 100% finalizado com sucesso! 🏆\n\n` +
        `💰 *Valor Total:* ${formatCurrencyBRL(ctx.totalPrice)}\n` +
        (ctx.downPayment > 0 ? `✅ *Sinal Pago:* ${formatCurrencyBRL(ctx.downPayment)}\n` : '') +
        (remaining > 0 ? `💳 *Saldo Restante na Retirada:* ${formatCurrencyBRL(remaining)}\n` : `✅ *Pagamento:* 100% Quitado\n`) +
        (remaining > 0 && ctx.pixKey ? `\n🔑 *Chave Pix:*\n${ctx.pixKey} (${ctx.pixName || atelier})\n` : '') +
        `\n📍 Já pode combinar o horário de retirada ou envio. Ficou incrível!`
    },

    COBRANCA_LEMBRETE: {
      label: 'Lembrete de Pagamento / Chave Pix',
      text: `🔔 *${atelier}* - *Lembrete de Pagamento*\n\n` +
        `Olá, *${ctx.clientName}*!\n` +
        `Passando para lembrar referente à Ordem de Serviço *${ctx.orderNumber}* (${ctx.title}).\n\n` +
        `💰 *Saldo Pendente:* ${formatCurrencyBRL(remaining > 0 ? remaining : ctx.totalPrice)}\n` +
        (ctx.pixKey ? `🔑 *Chave Pix:* ${ctx.pixKey} (${ctx.pixName || atelier})\n` : '') +
        `\nAssim que realizar a transferência, por favor envie o comprovante por aqui. Obrigado pela confiança!`
    }
  };

  return templates;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}
