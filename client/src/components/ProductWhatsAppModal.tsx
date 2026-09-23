import React, { useState, useEffect } from 'react';
import { Product, ProductImage, Client } from '../types';
import { api } from '../services/api';
import { formatCurrency, PROCESS_MAP } from '../utils/formatters';
import {
  X, MessageSquare, Copy, Check, ExternalLink, Share2,
  Download, User, Phone, Image as ImageIcon, Sparkles, AlertCircle
} from 'lucide-react';

interface ProductWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    sku?: string;
    category?: string;
    process_type: string;
    unit_price: number;
    description?: string;
  };
  selectedImages: ProductImage[];
  onRemoveFromSelection?: (imageId: string) => void;
}

export const ProductWhatsAppModal: React.FC<ProductWhatsAppModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedImages,
  onRemoveFromSelection,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [phoneMode, setPhoneMode] = useState<'client' | 'custom'>('client');
  const [customPhone, setCustomPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [customMessage, setCustomMessage] = useState('');
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      loadClientsAndSettings();
      setActiveImageIndex(0);
      setCopyError('');
    }
  }, [isOpen]);

  const loadClientsAndSettings = async () => {
    try {
      setLoadingClients(true);
      const [clientsData, settingsData] = await Promise.all([
        api.getClients(),
        api.getSettings(),
      ]);
      setClients(clientsData || []);
      setSettings(settingsData || {});
      if (clientsData && clientsData.length > 0 && !selectedClientId) {
        setSelectedClientId(clientsData[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar clientes/configurações:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Generate default message whenever client, product or selection changes
  useEffect(() => {
    const atelierName = settings.atelier_name || 'Bambu Maker Studio & Atelier';
    const selectedClient = clients.find(c => c.id === selectedClientId);
    const clientName = phoneMode === 'client' ? (selectedClient?.name || '') : customName;
    const processMeta = (PROCESS_MAP as Record<string, { label: string; icon: string }>)[product.process_type] || { label: product.process_type, icon: '📦' };

    const greeting = clientName ? `Olá, *${clientName}*! Tudo bem?` : 'Olá! Tudo bem?';
    const countText = selectedImages.length > 1
      ? `${selectedImages.length} fotos do nosso modelo`
      : 'a foto do nosso modelo';

    const msg =
      `🎨 *${atelierName}*\n\n` +
      `${greeting}\n` +
      `Preparei com carinho os detalhes e ${countText}:\n\n` +
      `📦 *Peça:* ${product.name}\n` +
      (product.sku ? `🏷️ *Código:* ${product.sku}\n` : '') +
      `⚙️ *Processo:* ${processMeta.icon} ${processMeta.label}\n` +
      (product.category ? `📁 *Categoria:* ${product.category}\n` : '') +
      `💰 *Valor Unitário:* ${formatCurrency(product.unit_price)}\n` +
      (product.description ? `\n📝 *Descrição:* ${product.description}\n` : '') +
      `\n📸 Seguem as fotos em anexo!\n` +
      `Qualquer dúvida ou personalização que desejar, é só me avisar por aqui. 🚀`;

    setCustomMessage(msg);
  }, [selectedClientId, phoneMode, customName, product, selectedImages.length, settings]);

  if (!isOpen) return null;

  const currentSelectedClient = clients.find(c => c.id === selectedClientId);
  const targetPhone = phoneMode === 'client' ? (currentSelectedClient?.phone || '') : customPhone;

  const getCleanPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('55')) return digits;
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    return digits;
  };

  const handleOpenWhatsApp = () => {
    const clean = getCleanPhone(targetPhone);
    if (!clean) {
      alert('Por favor, selecione um cliente ou digite um número de WhatsApp válido.');
      return;
    }
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${clean}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Convert image URL/base64 to Blob
  const getImageBlob = async (imageUrl: string): Promise<Blob> => {
    if (imageUrl.startsWith('data:')) {
      const res = await fetch(imageUrl);
      return await res.blob();
    }
    // Relative URL (e.g. /uploads/...) or external
    const res = await fetch(imageUrl);
    return await res.blob();
  };

  // Copy current image to clipboard (for pasting with Ctrl+V into WhatsApp Web)
  const handleCopyImageToClipboard = async (imgUrl: string) => {
    try {
      setCopyError('');
      // Canvas fallback to ensure standard image/png for clipboard
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imgUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Não foi possível inicializar canvas');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async pngBlob => {
        if (!pngBlob) throw new Error('Falha ao processar blob');
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': pngBlob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 3000);
        } catch (err: any) {
          console.error(err);
          setCopyError('Área de transferência do navegador bloqueou a cópia direta de imagem.');
        }
      }, 'image/png');
    } catch (err: any) {
      console.error(err);
      setCopyError('Não foi possível copiar imagem. Você pode baixá-la ou abrir a conversa.');
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  // Web Share API (native mobile/desktop share)
  const handleNativeShare = async () => {
    if (!navigator.canShare) {
      alert('Compartilhamento nativo de arquivos não é suportado pelo seu navegador atual. Utilize os botões "Copiar Imagem" e "Abrir no WhatsApp".');
      return;
    }
    try {
      const files: File[] = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        const blob = await getImageBlob(img.image_url);
        const ext = blob.type.split('/')[1] || 'jpg';
        files.push(new File([blob], `foto_${i + 1}.${ext}`, { type: blob.type }));
      }

      if (navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: product.name,
          text: customMessage,
        });
      } else {
        await navigator.share({
          title: product.name,
          text: customMessage,
        });
      }
    } catch (err) {
      console.log('Share cancelado ou não suportado:', err);
    }
  };

  // Download all selected images
  const handleDownloadImage = async (imgUrl: string, index: number) => {
    try {
      const blob = await getImageBlob(imgUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.name.replace(/\s+/g, '_')}_foto_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const activeImage = selectedImages[activeImageIndex] || selectedImages[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(34, 197, 94, 0.25)',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Enviar Fotos via WhatsApp
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {product.name} • {selectedImages.length} {selectedImages.length === 1 ? 'foto selecionada' : 'fotos selecionadas'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: 24,
          }}
        >
          {/* Left Column: Image Previews and Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fotos Selecionadas ({selectedImages.length})
            </div>

            {/* Active Preview */}
            {activeImage ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <img
                  src={activeImage.image_url}
                  alt="Pré-visualização"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {activeImage.title && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '6px 12px',
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(6px)',
                      fontSize: '0.75rem',
                      color: '#fff',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeImage.title}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  aspectRatio: '1',
                  borderRadius: 14,
                  border: '1px dashed var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <ImageIcon size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <span>Nenhuma foto selecionada</span>
              </div>
            )}

            {/* Thumbnails Row */}
            {selectedImages.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  overflowX: 'auto',
                  paddingBottom: 6,
                }}
              >
                {selectedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      position: 'relative',
                      width: 58,
                      height: 58,
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: activeImageIndex === idx ? '2px solid var(--brand-primary)' : '1px solid rgba(255,255,255,0.1)',
                      opacity: activeImageIndex === idx ? 1 : 0.7,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <img
                      src={img.image_url}
                      alt={`Miniatura ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {onRemoveFromSelection && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onRemoveFromSelection(img.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.7)',
                          border: 'none',
                          color: '#fff',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Desmarcar"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions for active image */}
            {activeImage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => handleCopyImageToClipboard(activeImage.image_url)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '9px 12px',
                    fontSize: '0.82rem',
                    gap: 8,
                    background: copiedImage ? 'rgba(34, 197, 94, 0.2)' : undefined,
                    color: copiedImage ? '#22c55e' : undefined,
                    border: copiedImage ? '1px solid #22c55e' : undefined,
                  }}
                >
                  {copiedImage ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedImage ? 'Foto copiada! Cole com Ctrl+V' : 'Copiar Foto para Área de Transferência'}</span>
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleDownloadImage(activeImage.image_url, activeImageIndex)}
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem', gap: 6 }}
                    title="Baixar esta foto"
                  >
                    <Download size={13} />
                    <span>Baixar</span>
                  </button>

                  {typeof navigator !== 'undefined' && (
                    <button
                      onClick={handleNativeShare}
                      className="btn btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.78rem', gap: 6 }}
                      title="Compartilhar via aplicativo nativo"
                    >
                      <Share2 size={13} />
                      <span>Compartilhar</span>
                    </button>
                  )}
                </div>

                {copyError && (
                  <div style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={12} /> {copyError}
                  </div>
                )}

                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.05)',
                    lineHeight: 1.4,
                  }}
                >
                  💡 <strong>Dica Pro:</strong> Copie a foto acima e, ao abrir a conversa no WhatsApp Web, basta apertar <kbd style={{ background: '#1e293b', padding: '1px 5px', borderRadius: 4, color: '#94a3b8' }}>Ctrl+V</kbd> para colar a foto direto com a mensagem!
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recipient & Custom Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Recipient Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Destinatário
                </span>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface-elevated)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPhoneMode('client')}
                    style={{
                      border: 'none',
                      background: phoneMode === 'client' ? 'var(--brand-primary)' : 'transparent',
                      color: phoneMode === 'client' ? '#fff' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cliente Cadastrado
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneMode('custom')}
                    style={{
                      border: 'none',
                      background: phoneMode === 'custom' ? 'var(--brand-primary)' : 'transparent',
                      color: phoneMode === 'custom' ? '#fff' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Outro Número
                  </button>
                </div>
              </div>

              {phoneMode === 'client' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select
                    className="form-input"
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.86rem',
                    }}
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                  {currentSelectedClient && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} color="#10b981" />
                      <span>WhatsApp: <strong>{currentSelectedClient.phone}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nome do Contato</label>
                    <input
                      className="form-input"
                      placeholder="Ex: João"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Número com DDD</label>
                    <input
                      className="form-input"
                      placeholder="Ex: 11987654321"
                      value={customPhone}
                      onChange={e => setCustomPhone(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Message Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mensagem Automática
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedMessage ? '#22c55e' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copiedMessage ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedMessage ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <textarea
                className="form-input"
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                rows={10}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* WhatsApp Send Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.86rem' }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                style={{
                  background: '#22c55e',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 10,
                  padding: '10px 22px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(34, 197, 94, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <MessageSquare size={16} />
                <span>Abrir Conversa no WhatsApp</span>
                <ExternalLink size={14} style={{ opacity: 0.7 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
