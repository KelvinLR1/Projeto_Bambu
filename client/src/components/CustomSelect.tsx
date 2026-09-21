import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  color?: string; // optional status color or dot indicator
  icon?: React.ReactNode;
  subtitle?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  variant?: 'default' | 'pill' | 'compact';
  id?: string;
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  className = '',
  style,
  menuStyle,
  variant = 'default',
  id,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keep highlighted index in sync when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) {
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          const opt = options[highlightedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
          }
        }
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled || disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const isPill = variant === 'pill';
  const isCompact = variant === 'compact';

  return (
    <div
      ref={containerRef}
      id={id}
      className={`custom-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: isCompact ? 'auto' : 160,
        userSelect: 'none',
        zIndex: isOpen ? 100 : 'auto',
        ...style,
      }}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={isOpen}
      aria-label={ariaLabel || placeholder}
    >
      {/* Trigger Button */}
      <div
        className={`custom-select-trigger ${isPill ? 'trigger-pill' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: isPill ? '6px 12px' : '8px 12px',
          borderRadius: isPill ? 'var(--radius-full)' : 'var(--radius-md)',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border-card)',
          color: 'var(--text-primary)',
          fontSize: isPill ? '0.84rem' : '0.88rem',
          fontWeight: isPill ? 700 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'var(--shadow-sm)',
          borderColor: isOpen ? 'var(--brand-primary)' : (selectedOption?.color ? selectedOption.color : 'var(--border-card)'),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {/* Status Color Dot or Icon */}
          {selectedOption?.color && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: selectedOption.color,
                boxShadow: `0 0 8px ${selectedOption.color}`,
                flexShrink: 0,
              }}
            />
          )}
          {selectedOption?.icon && <span style={{ flexShrink: 0 }}>{selectedOption.icon}</span>}

          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: selectedOption?.color ? selectedOption.color : 'var(--text-primary)',
            }}
          >
            {selectedOption ? selectedOption.label : <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>}
          </span>
        </div>

        <ChevronDown
          size={15}
          style={{
            color: 'var(--text-secondary)',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Floating Dropdown List (A listagem no padrão do sistema) */}
      {isOpen && (
        <div
          ref={menuRef}
          className="custom-select-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: 'max-content',
            maxWidth: 420,
            zIndex: 9999,
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            maxHeight: 280,
            overflowY: 'auto',
            animation: 'customSelectFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            ...menuStyle,
          }}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = highlightedIndex === index;

            return (
              <div
                key={option.value}
                className={`custom-select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: option.disabled ? 'not-allowed' : 'pointer',
                  opacity: option.disabled ? 0.4 : 1,
                  background: isSelected
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isHighlighted
                    ? 'var(--bg-surface-hover)'
                    : 'transparent',
                  color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.86rem',
                  transition: 'background 0.12s ease, color 0.12s ease',
                  margin: '1px 0',
                }}
                role="option"
                aria-selected={isSelected}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  {option.color ? (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: option.color,
                        boxShadow: `0 0 6px ${option.color}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : option.icon ? (
                    <span style={{ flexShrink: 0 }}>{option.icon}</span>
                  ) : null}

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{option.label}</span>
                    {option.subtitle && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {option.subtitle}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {option.badge && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {option.badge}
                    </span>
                  )}
                  {isSelected && (
                    <Check size={14} style={{ color: 'var(--brand-primary)', strokeWidth: 2.5 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
