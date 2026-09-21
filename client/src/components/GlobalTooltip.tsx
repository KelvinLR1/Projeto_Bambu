import React, { useState, useEffect, useRef } from 'react';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'top',
  });

  const timerRef = useRef<number | null>(null);
  const currentTargetRef = useRef<Element | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.('[data-tooltip], [title]');
      if (!target) return;

      // Se tiver title nativo, converte para data-tooltip para desativar o balão nativo feio do navegador
      let text = target.getAttribute('data-tooltip');
      const nativeTitle = target.getAttribute('title');
      if (nativeTitle) {
        text = nativeTitle;
        target.setAttribute('data-tooltip', nativeTitle);
        target.removeAttribute('title');
      }

      if (!text || text.trim() === '') return;

      currentTargetRef.current = target;

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      // Delay agradável para não piscar em movimentos rápidos
      timerRef.current = window.setTimeout(() => {
        if (!currentTargetRef.current || currentTargetRef.current !== target) return;

        const rect = target.getBoundingClientRect();
        const tooltipHeightEstimate = 32;
        const margin = 8;

        // Se estiver muito próximo do topo da janela, inverte para baixo
        const showBelow = rect.top < tooltipHeightEstimate + margin + 10;
        const placement: 'top' | 'bottom' = showBelow ? 'bottom' : 'top';

        const y = showBelow ? rect.bottom + margin : rect.top - margin;
        const x = rect.left + rect.width / 2;

        setTooltip({
          visible: true,
          text,
          x,
          y,
          placement,
        });
      }, 220);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const toElement = e.relatedTarget as Element | null;
      if (currentTargetRef.current && toElement && currentTargetRef.current.contains(toElement)) {
        return; // ainda dentro do mesmo elemento
      }

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      currentTargetRef.current = null;
      setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handleMouseDown = () => {
      // Esconde imediatamente ao clicar
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handleScroll = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      className="custom-system-tooltip"
      role="tooltip"
      style={{
        position: 'fixed',
        top: tooltip.y,
        left: tooltip.x,
        transform: tooltip.placement === 'top' 
          ? 'translate(-50%, -100%)' 
          : 'translate(-50%, 0)',
        zIndex: 999999,
        pointerEvents: 'none',
        background: 'var(--bg-surface-elevated, #131c2e)',
        color: 'var(--text-primary, #f8fafc)',
        border: '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))',
        boxShadow: '0 10px 26px -4px rgba(0, 0, 0, 0.55), 0 0 12px var(--brand-primary-glow, rgba(16, 185, 129, 0.18))',
        borderRadius: 'var(--radius-sm, 8px)',
        padding: '6px 12px',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1.35,
        maxWidth: 320,
        textAlign: 'center',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: tooltip.placement === 'top' ? 'tooltipPopTop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'tooltipPopBottom 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        whiteSpace: 'pre-wrap',
      }}
    >
      {tooltip.text}

      {/* Micro-seta elegante */}
      <div
        style={{
          position: 'absolute',
          [tooltip.placement === 'top' ? 'bottom' : 'top']: -4,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 8,
          height: 8,
          background: 'var(--bg-surface-elevated, #131c2e)',
          borderRight: tooltip.placement === 'top' ? '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))' : 'none',
          borderBottom: tooltip.placement === 'top' ? '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))' : 'none',
          borderLeft: tooltip.placement === 'bottom' ? '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))' : 'none',
          borderTop: tooltip.placement === 'bottom' ? '1px solid var(--border-highlight, rgba(255, 255, 255, 0.16))' : 'none',
        }}
      />
    </div>
  );
};
