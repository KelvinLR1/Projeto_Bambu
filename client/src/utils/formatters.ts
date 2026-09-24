import confetti from 'canvas-confetti';
import { OrderStatus, ProcessType } from '../types';

export function formatCurrency(value?: number): string {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatHours(hours?: number): string {
  if (!hours || isNaN(hours)) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  ORCAMENTO: { label: 'Orçamento', color: 'var(--status-orcamento)' },
  APROVADO: { label: 'Aprovado', color: 'var(--status-aprovado)' },
  EM_IMPRESSAO: { label: 'Em Impressão', color: 'var(--status-em_impressao)' },
  EM_PREPARACAO: { label: 'Em Preparação', color: 'var(--status-em_preparacao)' },
  EM_PINTURA: { label: 'Em Pintura', color: 'var(--status-em_pintura)' },
  SECAGEM_VERNIZ: { label: 'Secagem / Verniz', color: 'var(--status-secagem_verniz)' },
  PRONTO: { label: 'Pronto', color: 'var(--status-pronto)' },
  ENTREGUE: { label: 'Entregue', color: 'var(--status-entregue)' },
  CANCELADO: { label: 'Cancelado', color: 'var(--status-cancelado)' },
};

export const PROCESS_MAP: Record<ProcessType, { label: string; icon: string }> = {
  FDM: { label: 'FDM Filamento', icon: '🖨️' },
  RESIN: { label: 'Resina 8K/12K', icon: '🧪' },
  LASER: { label: 'Laser / Gráfica', icon: '⚡' },
  PINTURA: { label: 'Pintura & Acabamento', icon: '🎨' },
  ADESIVO: { label: 'Adesivos & Vinil', icon: '🏷️' },
  COMBO: { label: 'Combo Impressão + Pintura', icon: '✨' },
};

export function celebrateSuccess() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
  });
}
