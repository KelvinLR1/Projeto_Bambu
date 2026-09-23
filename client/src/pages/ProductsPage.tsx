import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductImage, ProductFile, ProcessType, MaterialFDM, MaterialResin, Equipment } from '../types';
import { api } from '../services/api';
import { formatCurrency, PROCESS_MAP } from '../utils/formatters';
import { ProductWhatsAppModal } from '../components/ProductWhatsAppModal';
import {
  Search, Plus, Edit3, Trash2, Clock, Weight, Sparkles,
  DollarSign, TrendingUp, X, Package, Zap, Image as ImageIcon,
  Upload, ArrowLeft, Copy, CheckCircle2, Save, RefreshCw, Calculator,
  Star, MessageSquare, CheckSquare, Square, Eye, Link as LinkIcon,
  ChevronLeft, ChevronRight, Download, Check, Layers, File, FileCode,
  FolderOpen, Paperclip, AlertCircle
} from 'lucide-react';

interface ProductsPageProps {
  onGenerateOrderFromProduct?: (product: Product) => void;
  onOpenInCalculator?: (product: Product) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeBadge(type?: string): { bg: string; color: string; border: string } {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'STL':
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    case '3MF':
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    case 'STEP':
    case 'STP':
      return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' };
    case 'OBJ':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    case 'GCODE':
      return { bg: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' };
    case 'DXF':
    case 'SVG':
      return { bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
    default:
      return { bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', border: 'rgba(255, 255, 255, 0.12)' };
  }
}

const EditorSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{title}</div>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: 16 }}>{children}</div>
  </div>
);

const FieldGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
    <label style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onOpenImages: () => void;
  onOpenFiles: () => void;
  onDelete: () => void;
  onOrder?: () => void;
  onCalculate?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onOpenImages, onOpenFiles, onDelete, onOrder, onCalculate }) => {
  const [hovered, setHovered] = useState(false);
  const meta = PROCESS_MAP[product.process_type] || { label: product.process_type, icon: '📦' };
  const imgCount = product.images_count || (product.image_url ? 1 : 0);
  const filesCount = product.files_count || 0;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 16,
        border: hovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
    >
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={36} style={{ opacity: 0.12 }} />
          </div>
        )}

        {/* Process badge */}
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{meta.icon}</span> {meta.label}
        </div>

        {/* Badges row: images count and files count */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6 }}>
          {filesCount > 0 && (
            <div
              onClick={e => {
                e.stopPropagation();
                onOpenFiles();
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
              title="Ver arquivos e peças que compõem o modelo"
            >
              <Layers size={11} color="#3b82f6" />
              <span>{filesCount} {filesCount === 1 ? 'peça' : 'peças'}</span>
            </div>
          )}

          {imgCount > 0 && (
            <div
              onClick={e => {
                e.stopPropagation();
                onOpenImages();
              }}
              style={{
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              title="Ver galeria de fotos e enviar via WhatsApp"
            >
              <ImageIcon size={12} color="#10b981" />
              <span>{imgCount} {imgCount === 1 ? 'foto' : 'fotos'}</span>
            </div>
          )}
        </div>

        {/* Action icons on hover */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenFiles(); }}
            style={{ background: 'rgba(59, 130, 246, 0.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Arquivos e Sub-peças 3D"
          >
            <Layers size={13} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onOpenImages(); }}
            style={{ background: 'rgba(16, 185, 129, 0.85)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Galeria de Imagens e WhatsApp"
          >
            <ImageIcon size={13} />
          </button>
          {onCalculate && (
            <button
              onClick={e => { e.stopPropagation(); onCalculate(); }}
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Simular na Calculadora"
            >
              <Calculator size={13} />
            </button>
          )}
          {onOrder && (
            <button
              onClick={e => { e.stopPropagation(); onOrder(); }}
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Emitir Pedido"
            >
              <Zap size={13} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ background: 'rgba(239,68,68,0.75)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Remover"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
        {product.sku && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 10 }}>{product.sku}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(product.unit_price || 0)}</div>
            {product.margin_percent != null && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.margin_percent}% margem</div>}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={e => { e.stopPropagation(); onOpenFiles(); }}
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Arquivos das peças do modelo"
            >
              <Layers size={12} /> Peças
            </button>
            <button
              onClick={e => { e.stopPropagation(); onOpenImages(); }}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Ver fotos da peça"
            >
              <ImageIcon size={12} /> Fotos
            </button>
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Edit3 size={12} /> Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductsPage: React.FC<ProductsPageProps> = ({ onGenerateOrderFromProduct, onOpenInCalculator }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [] });
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [activeTab, setActiveTab] = useState<'specs' | 'images' | 'files'>('specs');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<string>('ALL');

  // Product images & selection state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitleInput, setUrlTitleInput] = useState('');
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');

  // Product files & sub-parts state
  const [productFiles, setProductFiles] = useState<ProductFile[]>([]);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<ProductFile | null>(null);
  const [savingPart, setSavingPart] = useState(false);
  const [lightboxPartImage, setLightboxPartImage] = useState<{ url: string; title: string } | null>(null);

  // Sub-part modal form state
  const [partFormData, setPartFormData] = useState({
    name: '',
    quantity: 1,
    weight_g: 0,
    print_time_hours: 0,
    notes: '',
    filename: '',
    file_data: '',
    file_size: 0,
    file_type: 'STL',
    image_url: '',
    image_data: '',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Geral', process_type: 'FDM' as ProcessType,
    description: '', material_id: '', equipment_id: '',
    production_time_hours: 2.5, weight_g: 65, unit_cost: 18.5,
    margin_percent: 60, unit_price: 46.25, image_url: '', calc_params_json: '',
  });
  const [timeHours, setTimeHours] = useState(2);
  const [timeMinutes, setTimeMinutes] = useState(30);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const partModelFileInputRef = useRef<HTMLInputElement>(null);
  const partPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
    loadDependencies();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [mats, eqs, sets] = await Promise.all([api.getMaterials(), api.getEquipments(), api.getSettings()]);
      setMaterials(mats);
      setEquipments(eqs);
      setSettings(sets || {});
    } catch (err) {
      console.error(err);
    }
  };

  const loadProductImages = async (productId: string) => {
    try {
      const images = await api.getProductImages(productId);
      setProductImages(images || []);
      setSelectedImageIds(new Set());
    } catch (err) {
      console.error('Erro ao carregar imagens do produto:', err);
    }
  };

  const loadProductFiles = async (productId: string) => {
    try {
      const files = await api.getProductFiles(productId);
      setProductFiles(files || []);
    } catch (err) {
      console.error('Erro ao carregar arquivos das peças:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) &&
      (selectedProcess === 'ALL' || p.process_type === selectedProcess);
  });

  const processFilters = [
    { key: 'ALL', label: 'Todos' },
    { key: 'FDM', label: 'FDM' },
    { key: 'RESIN', label: 'Resina' },
    { key: 'LASER', label: 'Laser' },
  ];

  const handleOpenEditor = async (prod?: Product, initialTab: 'specs' | 'images' | 'files' = 'specs') => {
    setActiveTab(initialTab);
    setSelectedImageIds(new Set());
    setLightboxIndex(null);

    if (prod) {
      setEditingProduct(prod);
      const h = Math.floor(prod.production_time_hours || 0);
      const m = Math.round(((prod.production_time_hours || 0) - h) * 60);
      setTimeHours(h);
      setTimeMinutes(m);
      setFormData({
        name: prod.name,
        sku: prod.sku,
        category: prod.category || 'Geral',
        process_type: prod.process_type,
        description: prod.description || '',
        material_id: prod.material_id || '',
        equipment_id: prod.equipment_id || '',
        production_time_hours: prod.production_time_hours || 0,
        weight_g: prod.weight_g || 0,
        unit_cost: prod.unit_cost || 0,
        margin_percent: prod.margin_percent || 50,
        unit_price: prod.unit_price || 0,
        image_url: prod.image_url || '',
        calc_params_json: prod.calc_params_json || '',
      });
      await Promise.all([
        loadProductImages(prod.id),
        loadProductFiles(prod.id),
      ]);
    } else {
      setEditingProduct(null);
      setTimeHours(2);
      setTimeMinutes(30);
      setProductImages([]);
      setProductFiles([]);
      setFormData({
        name: '',
        sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000),
        category: 'Geral',
        process_type: 'FDM',
        description: '',
        material_id: materials.fdm?.[0]?.id || '',
        equipment_id: equipments.find((e: Equipment) => e.type === 'FDM')?.id || '',
        production_time_hours: 2.5,
        weight_g: 65,
        unit_cost: 18.5,
        margin_percent: 60,
        unit_price: 46.25,
        image_url: '',
        calc_params_json: '',
      });
    }
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Upload single cover image from the specs preview
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Imagem muito grande (limite 10MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setFormData(p => ({ ...p, image_url: dataUrl }));
        if (editingProduct) {
          try {
            await api.addProductImages(editingProduct.id, { image_url: dataUrl, is_cover: true });
            await loadProductImages(editingProduct.id);
            await loadProducts();
          } catch (err) {
            console.error(err);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload multiple images in Images Tab
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const imagesPayload: Array<{ image_url: string; title?: string }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 15 * 1024 * 1024) continue;

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        imagesPayload.push({
          image_url: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      }

      if (imagesPayload.length === 0) {
        alert('Nenhuma imagem válida selecionada.');
        return;
      }

      if (editingProduct) {
        await api.addProductImages(editingProduct.id, { images: imagesPayload });
        await loadProductImages(editingProduct.id);
        await loadProducts();
      } else {
        const newItems: ProductImage[] = imagesPayload.map((p, idx) => ({
          id: `temp_${Date.now()}_${idx}`,
          product_id: '',
          image_url: p.image_url,
          title: p.title,
          is_cover: productImages.length === 0 && idx === 0 ? 1 : 0,
          created_at: new Date().toISOString(),
        }));
        setProductImages(prev => [...prev, ...newItems]);
        if (!formData.image_url && newItems.length > 0) {
          setFormData(prev => ({ ...prev, image_url: newItems[0].image_url }));
        }
      }
      showToast(`${imagesPayload.length} ${imagesPayload.length === 1 ? 'imagem adicionada' : 'imagens adicionadas'} com sucesso!`);
    } catch (err: any) {
      alert('Erro ao carregar imagens: ' + err.message);
    } finally {
      setUploading(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    }
  };

  // Add image by external URL
  const handleAddImageUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      if (editingProduct) {
        await api.addProductImages(editingProduct.id, {
          image_url: urlInput.trim(),
          title: urlTitleInput.trim() || undefined,
        });
        await loadProductImages(editingProduct.id);
        await loadProducts();
      } else {
        const newItem: ProductImage = {
          id: `temp_${Date.now()}`,
          product_id: '',
          image_url: urlInput.trim(),
          title: urlTitleInput.trim() || undefined,
          is_cover: productImages.length === 0 ? 1 : 0,
          created_at: new Date().toISOString(),
        };
        setProductImages(prev => [...prev, newItem]);
        if (!formData.image_url) {
          setFormData(prev => ({ ...prev, image_url: urlInput.trim() }));
        }
      }
      setUrlInput('');
      setUrlTitleInput('');
      setUrlModalOpen(false);
      showToast('Imagem adicionada com sucesso!');
    } catch (err: any) {
      alert('Erro ao adicionar imagem: ' + err.message);
    }
  };

  // Set image as cover
  const handleSetCover = async (img: ProductImage) => {
    try {
      if (editingProduct) {
        await api.setProductCoverImage(editingProduct.id, img.id);
        await loadProductImages(editingProduct.id);
        setFormData(p => ({ ...p, image_url: img.image_url }));
        await loadProducts();
      } else {
        setProductImages(prev =>
          prev.map(item => ({ ...item, is_cover: item.id === img.id ? 1 : 0 }))
        );
        setFormData(p => ({ ...p, image_url: img.image_url }));
      }
      showToast('Foto de capa atualizada!');
    } catch (err: any) {
      alert('Erro ao definir foto de capa: ' + err.message);
    }
  };

  // Delete single image
  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Excluir esta foto do produto?')) return;
    try {
      if (editingProduct) {
        await api.deleteProductImage(editingProduct.id, imageId);
        await loadProductImages(editingProduct.id);
        await loadProducts();
      } else {
        setProductImages(prev => prev.filter(item => item.id !== imageId));
      }
      setSelectedImageIds(prev => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
      showToast('Imagem removida.');
    } catch (err: any) {
      alert('Erro ao excluir imagem: ' + err.message);
    }
  };

  // Batch delete selected images
  const handleDeleteSelected = async () => {
    if (selectedImageIds.size === 0) return;
    if (!window.confirm(`Excluir as ${selectedImageIds.size} fotos selecionadas?`)) return;
    try {
      const ids = Array.from(selectedImageIds);
      if (editingProduct) {
        await api.deleteProductImagesBatch(editingProduct.id, ids);
        await loadProductImages(editingProduct.id);
        await loadProducts();
      } else {
        setProductImages(prev => prev.filter(item => !selectedImageIds.has(item.id)));
      }
      setSelectedImageIds(new Set());
      showToast(`${ids.length} imagens removidas.`);
    } catch (err: any) {
      alert('Erro ao excluir imagens em lote: ' + err.message);
    }
  };

  // Toggle selection
  const handleToggleSelect = (imageId: string) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  };

  // Select all or none
  const handleToggleSelectAll = () => {
    if (selectedImageIds.size === productImages.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(productImages.map(img => img.id)));
    }
  };

  // Save caption/title
  const handleSaveCaption = async (imageId: string) => {
    try {
      if (editingProduct) {
        await api.updateProductImage(editingProduct.id, imageId, { title: editingCaptionText });
        await loadProductImages(editingProduct.id);
      } else {
        setProductImages(prev =>
          prev.map(img => (img.id === imageId ? { ...img, title: editingCaptionText } : img))
        );
      }
      setEditingCaptionId(null);
    } catch (err: any) {
      alert('Erro ao atualizar legenda: ' + err.message);
    }
  };

  // Copy single image to clipboard
  const handleCopyImage = async (imgUrl: string) => {
    try {
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
      if (!ctx) throw new Error();
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async blob => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('✅ Imagem copiada! Cole no WhatsApp com Ctrl+V');
      }, 'image/png');
    } catch (e) {
      showToast('Não foi possível copiar imagem diretamente.');
    }
  };

  // --- SUB-PARTS / PRODUCT FILES LOGIC ---
  const handleOpenAddPartModal = () => {
    setEditingPart(null);
    setPartFormData({
      name: '',
      quantity: 1,
      weight_g: 0,
      print_time_hours: 0,
      notes: '',
      filename: '',
      file_data: '',
      file_size: 0,
      file_type: 'STL',
      image_url: '',
      image_data: '',
    });
    setFileModalOpen(true);
  };

  const handleOpenEditPartModal = (part: ProductFile) => {
    setEditingPart(part);
    setPartFormData({
      name: part.name,
      quantity: part.quantity || 1,
      weight_g: part.weight_g || 0,
      print_time_hours: part.print_time_hours || 0,
      notes: part.notes || '',
      filename: part.filename,
      file_data: '',
      file_size: part.file_size || 0,
      file_type: part.file_type || 'STL',
      image_url: part.image_url || '',
      image_data: '',
    });
    setFileModalOpen(true);
  };

  const handlePartModelFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      alert('Arquivo muito grande (limite 80MB).');
      return;
    }
    const ext = (file.name.split('.').pop() || 'STL').toUpperCase();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPartFormData(p => ({
          ...p,
          filename: file.name,
          file_data: reader.result as string,
          file_size: file.size,
          file_type: ext,
          name: p.name || file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePartPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione uma imagem válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPartFormData(p => ({
          ...p,
          image_data: reader.result as string,
          image_url: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePart = async () => {
    if (!partFormData.name.trim()) {
      alert('Por favor, informe o nome da peça.');
      return;
    }

    if (!editingPart && !partFormData.filename && !partFormData.file_data) {
      alert('Por favor, selecione o arquivo 3D/projeto da peça.');
      return;
    }

    setSavingPart(true);
    try {
      if (editingProduct) {
        if (editingPart) {
          await api.updateProductFile(editingProduct.id, editingPart.id, partFormData);
        } else {
          await api.addProductFile(editingProduct.id, partFormData);
        }
        await loadProductFiles(editingProduct.id);
        await loadProducts();
      } else {
        // Unsaved product
        if (editingPart) {
          setProductFiles(prev =>
            prev.map(p =>
              p.id === editingPart.id
                ? {
                    ...p,
                    name: partFormData.name,
                    quantity: partFormData.quantity,
                    weight_g: partFormData.weight_g,
                    print_time_hours: partFormData.print_time_hours,
                    notes: partFormData.notes,
                    filename: partFormData.filename || p.filename,
                    file_url: partFormData.file_data || p.file_url,
                    file_size: partFormData.file_size || p.file_size,
                    file_type: partFormData.file_type || p.file_type,
                    image_url: partFormData.image_data || partFormData.image_url || p.image_url,
                  }
                : p
            )
          );
        } else {
          const newPart: ProductFile = {
            id: `temp_part_${Date.now()}`,
            product_id: '',
            name: partFormData.name,
            filename: partFormData.filename || 'peca.stl',
            file_url: partFormData.file_data || '',
            file_size: partFormData.file_size,
            file_type: partFormData.file_type,
            image_url: partFormData.image_data || partFormData.image_url,
            quantity: partFormData.quantity,
            weight_g: partFormData.weight_g,
            print_time_hours: partFormData.print_time_hours,
            notes: partFormData.notes,
            created_at: new Date().toISOString(),
          };
          setProductFiles(prev => [...prev, newPart]);
        }
      }
      setFileModalOpen(false);
      showToast(editingPart ? 'Peça atualizada com sucesso!' : 'Nova peça adicionada com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar peça: ' + err.message);
    } finally {
      setSavingPart(false);
    }
  };

  const handleDeletePart = async (partId: string, partName: string) => {
    if (!window.confirm(`Excluir a peça "${partName}" e seu arquivo?`)) return;
    try {
      if (editingProduct) {
        await api.deleteProductFile(editingProduct.id, partId);
        await loadProductFiles(editingProduct.id);
        await loadProducts();
      } else {
        setProductFiles(prev => prev.filter(p => p.id !== partId));
      }
      showToast('Peça removida com sucesso.');
    } catch (err: any) {
      alert('Erro ao remover peça: ' + err.message);
    }
  };

  const handleDownloadPart = (fileUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename || 'arquivo_3d';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTimeChange = (h: number, m: number) => {
    setTimeHours(h);
    setTimeMinutes(m);
    setFormData(p => ({ ...p, production_time_hours: Number((h + m / 60).toFixed(2)) }));
  };

  const handleCostOrMarginChange = (cost: number, margin: number) => {
    setFormData(p => ({ ...p, unit_cost: cost, margin_percent: margin, unit_price: Number((cost * (1 + margin / 100)).toFixed(2)) }));
  };

  const handlePriceChange = (price: number) => {
    const margin = formData.unit_cost > 0 ? Math.round(((price - formData.unit_cost) / formData.unit_cost) * 100) : 50;
    setFormData(p => ({ ...p, unit_price: price, margin_percent: margin }));
  };

  const calculateSuggestedCost = () => {
    let cost = 0;
    const { process_type, material_id, equipment_id, production_time_hours, weight_g } = formData;
    if (process_type === 'FDM') {
      const mat = materials.fdm?.find((m: MaterialFDM) => m.id === material_id);
      cost += mat && mat.spool_weight_g > 0 ? (mat.spool_price / mat.spool_weight_g) * weight_g : (120 / 1000) * weight_g;
    } else if (process_type === 'RESIN') {
      const mat = materials.resin?.find((m: MaterialResin) => m.id === material_id);
      cost += mat && mat.bottle_volume_ml > 0 ? (mat.bottle_price / mat.bottle_volume_ml) * weight_g : (180 / 1000) * weight_g;
    } else {
      cost += weight_g * 0.2;
    }
    const eq = equipments.find(e => e.id === equipment_id);
    if (eq) {
      cost += (eq.hourly_depreciation || 1.5) * production_time_hours;
      cost += ((eq.power_watts || 150) / 1000) * production_time_hours * (Number(settings.kwh_price) || 0.85);
    } else {
      cost += 1.2 * production_time_hours + 0.15 * production_time_hours * 0.85;
    }
    if (cost > 0) handleCostOrMarginChange(Number(cost.toFixed(2)), formData.margin_percent);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Nome do produto é obrigatório.');
      return;
    }
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        const created = await api.createProduct(formData);
        if (productImages.length > 0) {
          await api.addProductImages(created.id, {
            images: productImages.map(img => ({ image_url: img.image_url, title: img.title })),
          });
        }
        if (productFiles.length > 0) {
          for (const part of productFiles) {
            await api.addProductFile(created.id, {
              name: part.name,
              filename: part.filename,
              file_data: part.file_url,
              image_data: part.image_url,
              quantity: part.quantity,
              notes: part.notes,
            });
          }
        }
        setEditingProduct(created);
      }
      await loadProducts();
      showToast('Ficha técnica salva com sucesso!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm('Remover "' + name + '" do catálogo?')) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
      if (viewMode === 'editor' && editingProduct?.id === id) setViewMode('list');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDuplicate = () => {
    setEditingProduct(null);
    setFormData(p => ({ ...p, name: p.name + ' (Cópia)', sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000) }));
    showToast('Peça duplicada como novo rascunho!');
  };

  const getMaterialsForProcess = () => {
    if (formData.process_type === 'FDM') return materials.fdm || [];
    if (formData.process_type === 'RESIN') return materials.resin || [];
    if (formData.process_type === 'LASER') return materials.laser || [];
    return [];
  };

  const getEquipmentsForProcess = () => equipments.filter(e => e.type === formData.process_type);
  const processMeta = PROCESS_MAP[formData.process_type] || { label: formData.process_type, icon: '📦' };
  const profit = (formData.unit_price || 0) - (formData.unit_cost || 0);

  const iSt: React.CSSProperties = { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' as const };
  const iBtnSt: React.CSSProperties = { background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };

  // Lightbox navigation
  const lightboxItem = lightboxIndex !== null ? productImages[lightboxIndex] : null;

  // Total units across all sub-parts
  const totalUnitsToPrint = productFiles.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  if (viewMode === 'editor') {
    return (
      <>
        {toastMessage && (
          <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: 'var(--brand-primary)', color: '#fff', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px var(--brand-primary-glow)', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} /> {toastMessage}
          </div>
        )}

        <div className="page-container">
          {/* Header: breadcrumb + actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Left: back + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                onClick={() => setViewMode('list')}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                title="Voltar ao catálogo"
              >
                <ArrowLeft size={16} />
                <span>Catálogo</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  {editingProduct ? formData.name || 'Editar Peça' : 'Nova Peça'}
                </span>
                {formData.sku && (
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: 5,
                    }}
                  >
                    {formData.sku}
                  </span>
                )}
              </div>
            </div>

            {/* Right: action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {productImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setWhatsappModalOpen(true)}
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#22c55e',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                  title="Enviar fotos e ficha via WhatsApp"
                >
                  <MessageSquare size={15} />
                  <span>Enviar via WhatsApp ({selectedImageIds.size > 0 ? selectedImageIds.size : productImages.length})</span>
                </button>
              )}

              {editingProduct && (
                <>
                  <button onClick={handleDuplicate} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
                    <Copy size={15} />
                    <span>Duplicar</span>
                  </button>
                  {onOpenInCalculator && (
                    <button onClick={() => onOpenInCalculator({ ...editingProduct, ...formData })} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }} title="Abrir na calculadora">
                      <Calculator size={15} color="var(--brand-primary)" />
                      <span>Simular Custos</span>
                    </button>
                  )}
                  {onGenerateOrderFromProduct && (
                    <button onClick={() => onGenerateOrderFromProduct({ ...editingProduct, ...formData })} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
                      <Zap size={15} />
                      <span>Emitir Pedido</span>
                    </button>
                  )}
                  <button onClick={() => handleDelete(editingProduct.id, editingProduct.name)} className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
                    <Trash2 size={15} />
                    <span>Remover</span>
                  </button>
                </>
              )}
              <button onClick={() => handleSave()} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem', fontWeight: 700 }}>
                <Save size={15} />
                <span>Salvar Ficha</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar (3 Tabs) */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 26,
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 2,
            }}
          >
            {/* Tab 1: Specs */}
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                borderBottom: activeTab === 'specs' ? '2px solid var(--brand-primary)' : '2px solid transparent',
                background: activeTab === 'specs' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: activeTab === 'specs' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Package size={16} />
              <span>Ficha Técnica & Custos</span>
            </button>

            {/* Tab 2: Gallery */}
            <button
              type="button"
              onClick={() => setActiveTab('images')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                borderBottom: activeTab === 'images' ? '2px solid var(--brand-primary)' : '2px solid transparent',
                background: activeTab === 'images' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                color: activeTab === 'images' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <ImageIcon size={16} />
              <span>Galeria de Imagens</span>
              <span
                style={{
                  background: activeTab === 'images' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)',
                  color: activeTab === 'images' ? '#fff' : 'var(--text-muted)',
                  padding: '1px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {productImages.length}
              </span>
            </button>

            {/* Tab 3: Files & Sub-parts */}
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: '10px 10px 0 0',
                border: 'none',
                borderBottom: activeTab === 'files' ? '2px solid #3b82f6' : '2px solid transparent',
                background: activeTab === 'files' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: activeTab === 'files' ? '#3b82f6' : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Layers size={16} />
              <span>Peças & Arquivos 3D</span>
              <span
                style={{
                  background: activeTab === 'files' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: activeTab === 'files' ? '#fff' : 'var(--text-muted)',
                  padding: '1px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {productFiles.length}
              </span>
            </button>
          </div>

          {/* TAB 1: Specs & Pricing */}
          {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <EditorSection title="Identificação">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
                    <FieldGroup label="Nome do Produto *">
                      <input className="form-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Luminária Lua Cheia 20cm" style={iSt} />
                    </FieldGroup>
                    <FieldGroup label="SKU">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="form-input mono" value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value }))} style={{ ...iSt, width: 130 }} />
                        <button type="button" onClick={() => setFormData(p => ({ ...p, sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000) }))} style={iBtnSt} title="Gerar novo SKU"><RefreshCw size={14} /></button>
                      </div>
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <FieldGroup label="Categoria">
                      <select className="form-input" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={iSt}>
                        {['Geral','Colecionáveis & Miniaturas','Decoração & Iluminação','Cosplay & Props','Utilidades & Gadgets','Papelaria & Brindes','Arquitetura'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Processo">
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['FDM','RESIN','LASER'] as ProcessType[]).map(pt => {
                          const meta = PROCESS_MAP[pt] || { label: pt, icon: '⚙' };
                          const active = formData.process_type === pt;
                          return (
                            <button key={pt} type="button" onClick={() => setFormData(p => ({ ...p, process_type: pt, material_id: '', equipment_id: '' }))}
                              style={{ flex: 1, padding: '9px 6px', borderRadius: 8, cursor: 'pointer', border: active ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)', background: active ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--bg-surface-elevated)', color: active ? 'var(--brand-primary)' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontSize: '1rem' }}>{meta.icon}</span>{meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Descrição">
                    <textarea className="form-input" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Descrição detalhada do produto..." rows={3} style={{ ...iSt, resize: 'vertical' }} />
                  </FieldGroup>
                </EditorSection>

                <EditorSection title="Especificações de Produção">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <FieldGroup label="Material">
                      <select className="form-input" value={formData.material_id} onChange={e => setFormData(p => ({ ...p, material_id: e.target.value }))} style={iSt}>
                        <option value="">— Selecionar —</option>
                        {getMaterialsForProcess().map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Equipamento">
                      <select className="form-input" value={formData.equipment_id} onChange={e => setFormData(p => ({ ...p, equipment_id: e.target.value }))} style={iSt}>
                        <option value="">— Selecionar —</option>
                        {getEquipmentsForProcess().map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <FieldGroup label="Tempo de Produção">
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input type="number" min="0" max="999" value={timeHours} onChange={e => handleTimeChange(Number(e.target.value), timeMinutes)} style={{ ...iSt, paddingRight: 36 }} className="form-input" />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>h</span>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input type="number" min="0" max="59" value={timeMinutes} onChange={e => handleTimeChange(timeHours, Number(e.target.value))} style={{ ...iSt, paddingRight: 36 }} className="form-input" />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>min</span>
                        </div>
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Peso / Consumo (g)">
                      <div style={{ position: 'relative' }}>
                        <input type="number" min="0" value={formData.weight_g} onChange={e => setFormData(p => ({ ...p, weight_g: Number(e.target.value) }))} className="form-input" style={{ ...iSt, paddingRight: 36 }} />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>g</span>
                      </div>
                    </FieldGroup>
                  </div>
                </EditorSection>

                <EditorSection title="Precificação">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <FieldGroup label="Custo de Produção (R$)">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="number" min="0" step="0.01" value={formData.unit_cost} onChange={e => handleCostOrMarginChange(Number(e.target.value), formData.margin_percent)} className="form-input" style={iSt} />
                        <button type="button" onClick={calculateSuggestedCost} style={iBtnSt} title="Calcular custo automaticamente"><Sparkles size={14} /></button>
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Margem (%)">
                      <div style={{ position: 'relative' }}>
                        <input type="number" min="0" max="500" value={formData.margin_percent} onChange={e => handleCostOrMarginChange(formData.unit_cost, Number(e.target.value))} className="form-input" style={{ ...iSt, paddingRight: 36 }} />
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>%</span>
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Preço de Venda (R$)">
                      <input type="number" min="0" step="0.01" value={formData.unit_price} onChange={e => handlePriceChange(Number(e.target.value))} className="form-input" style={{ ...iSt, color: '#10b981', fontWeight: 700 }} />
                    </FieldGroup>
                  </div>
                  <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {[{ label: 'Custo', value: formatCurrency(formData.unit_cost), color: '#64748b' }, { label: 'Lucro', value: formatCurrency(profit), color: profit >= 0 ? '#10b981' : '#ef4444' }, { label: 'Margem', value: formData.margin_percent + '%', color: 'var(--brand-primary)' }, { label: 'Preço Final', value: formatCurrency(formData.unit_price), color: '#fff' }].map((item, i) => (
                      <div key={i} style={{ flex: 1, padding: '12px 16px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </EditorSection>
              </div>

              {/* Right Column: Cover Preview and Live Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Cover Image Box */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  {formData.image_url ? (
                    <div style={{ position: 'relative' }}>
                      <img src={formData.image_url} alt="Produto" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = ''; setFormData(p => ({ ...p, image_url: '' })); }} />
                      <button onClick={() => setFormData(p => ({ ...p, image_url: '' }))} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={12} color="#f59e0b" fill="#f59e0b" /> Foto de Capa
                      </div>
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', gap: 10 }} onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon size={32} style={{ opacity: 0.3 }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>Adicionar Foto de Capa</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Clique para selecionar do computador</div>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                    <input className="form-input" value={formData.image_url.startsWith('data:') ? '' : formData.image_url} onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} placeholder="URL da imagem..." style={{ ...iSt, flex: 1, fontSize: '0.78rem' }} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={iBtnSt} title="Upload"><Upload size={14} /></button>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverImageUpload} />
                  </div>

                  {/* Buttons to jump to other tabs */}
                  <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('files')}
                      style={{
                        width: '100%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#3b82f6',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <Layers size={14} />
                      <span>Ver Peças & Arquivos 3D ({productFiles.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('images')}
                      style={{
                        width: '100%',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: 'var(--brand-primary)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        cursor: 'pointer',
                      }}
                    >
                      <ImageIcon size={14} />
                      <span>Galeria ({productImages.length} fotos) & WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Summary Card */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{processMeta.icon} {processMeta.label}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{formData.name || 'Nome da Peça'}</div>
                    {formData.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>{formData.sku}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[{ icon: <Clock size={13} />, label: 'Tempo', value: timeHours + 'h ' + timeMinutes + 'min' }, { icon: <Weight size={13} />, label: 'Peso', value: formData.weight_g + 'g' }, { icon: <DollarSign size={13} />, label: 'Custo', value: formatCurrency(formData.unit_cost) }, { icon: <TrendingUp size={13} />, label: 'Margem', value: formData.margin_percent + '%' }].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{row.icon} {row.label}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preço de Venda</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(formData.unit_price)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Images Gallery */}
          {activeTab === 'images' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Toolbar */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                {/* Left: Stats & Multi-select actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {productImages.length} {productImages.length === 1 ? 'Foto Cadastrada' : 'Fotos Cadastradas'}
                  </div>

                  {productImages.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {selectedImageIds.size === productImages.length ? <CheckSquare size={14} color="#10b981" /> : <Square size={14} />}
                        <span>{selectedImageIds.size === productImages.length ? 'Desmarcar Todas' : 'Selecionar Todas'}</span>
                      </button>

                      {selectedImageIds.size > 0 && (
                        <>
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {selectedImageIds.size} selecionada(s)
                          </span>

                          <button
                            type="button"
                            onClick={handleDeleteSelected}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Excluir Selecionadas</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Upload and WhatsApp actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* WhatsApp Action Button */}
                  <button
                    type="button"
                    onClick={() => setWhatsappModalOpen(true)}
                    disabled={productImages.length === 0}
                    style={{
                      background: selectedImageIds.size > 0 ? '#22c55e' : 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: 10,
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: productImages.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: productImages.length === 0 ? 0.5 : 1,
                      boxShadow: selectedImageIds.size > 0 ? '0 4px 18px rgba(34, 197, 94, 0.4)' : 'none',
                    }}
                    title="Enviar imagens selecionadas via WhatsApp"
                  >
                    <MessageSquare size={16} />
                    <span>Enviar Selecionadas via WhatsApp ({selectedImageIds.size > 0 ? selectedImageIds.size : productImages.length})</span>
                  </button>

                  {/* Add URL button */}
                  <button
                    type="button"
                    onClick={() => setUrlModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.84rem', gap: 6 }}
                  >
                    <LinkIcon size={14} />
                    <span>Adicionar Link</span>
                  </button>

                  {/* Multi-upload button */}
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.86rem', fontWeight: 700, gap: 6 }}
                  >
                    <Upload size={15} />
                    <span>{uploading ? 'Carregando...' : 'Adicionar Fotos'}</span>
                  </button>
                  <input
                    ref={multiFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleMultiImageUpload}
                  />
                </div>
              </div>

              {/* URL Modal */}
              {urlModalOpen && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 16,
                    border: '1px solid var(--border-subtle)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Adicionar Imagem por Link Externo
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12 }}>
                    <input
                      className="form-input"
                      placeholder="Cole a URL da imagem (https://...)"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      style={iSt}
                    />
                    <input
                      className="form-input"
                      placeholder="Legenda / Descrição da foto (opcional)"
                      value={urlTitleInput}
                      onChange={e => setUrlTitleInput(e.target.value)}
                      style={iSt}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                      >
                        Salvar Imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlModalOpen(false)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.84rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Images Grid */}
              {productImages.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 18,
                    border: '2px dashed var(--border-subtle)',
                    padding: '80px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                    color: 'var(--text-muted)',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon size={32} style={{ opacity: 0.3 }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Nenhuma imagem nesta peça ainda
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, maxWidth: 400 }}>
                      Faça o upload de fotos do modelo impresso, acabamento, suporte e ângulos para exibir no catálogo e compartilhar com clientes via WhatsApp.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="btn btn-primary"
                    style={{ marginTop: 8, padding: '10px 22px', fontSize: '0.88rem', fontWeight: 700, gap: 8 }}
                  >
                    <Upload size={16} />
                    <span>Selecionar Fotos do Computador</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 20,
                  }}
                >
                  {productImages.map((img, index) => {
                    const isSelected = selectedImageIds.has(img.id);
                    const isCover = Boolean(img.is_cover);

                    return (
                      <div
                        key={img.id}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 14,
                          border: isSelected
                            ? '2px solid var(--brand-primary)'
                            : isCover
                            ? '2px solid rgba(245, 158, 11, 0.4)'
                            : '1px solid rgba(255,255,255,0.08)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          boxShadow: isSelected ? '0 8px 24px var(--brand-primary-glow)' : '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Image Preview Container */}
                        <div
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            background: 'rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                          onClick={() => setLightboxIndex(index)}
                        >
                          <img
                            src={img.image_url}
                            alt={img.title || 'Foto do produto'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />

                          {/* Checkbox for Selection */}
                          <div
                            onClick={e => {
                              e.stopPropagation();
                              handleToggleSelect(img.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: 10,
                              left: 10,
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: isSelected ? 'var(--brand-primary)' : 'rgba(0,0,0,0.65)',
                              backdropFilter: 'blur(6px)',
                              border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              zIndex: 2,
                            }}
                            title={isSelected ? 'Desmarcar' : 'Selecionar para WhatsApp'}
                          >
                            {isSelected ? <Check size={16} /> : null}
                          </div>

                          {/* Cover Badge */}
                          {isCover && (
                            <div
                              style={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                background: '#f59e0b',
                                color: '#000',
                                borderRadius: 6,
                                padding: '3px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                zIndex: 2,
                              }}
                            >
                              <Star size={11} fill="#000" />
                              <span>Capa</span>
                            </div>
                          )}

                          {/* Floating Quick Action Overlay */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              right: 8,
                              display: 'flex',
                              justifyContent: 'center',
                              gap: 6,
                              background: 'rgba(0,0,0,0.7)',
                              backdropFilter: 'blur(8px)',
                              padding: '5px 8px',
                              borderRadius: 8,
                              zIndex: 2,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(img)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#f59e0b', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                                title="Definir como foto de capa principal"
                              >
                                <Star size={12} /> Capa
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyImage(img.image_url)}
                              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                              title="Copiar para colar no WhatsApp Web com Ctrl+V"
                            >
                              <Copy size={12} /> Copiar
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImageIds(new Set([img.id]));
                                setWhatsappModalOpen(true);
                              }}
                              style={{ background: 'rgba(34, 197, 94, 0.3)', border: 'none', color: '#22c55e', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                              title="Enviar esta foto via WhatsApp"
                            >
                              <MessageSquare size={12} /> Whats
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', borderRadius: 6, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                              title="Excluir imagem"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Title / Caption bar */}
                        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {editingCaptionId === img.id ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input
                                autoFocus
                                value={editingCaptionText}
                                onChange={e => setEditingCaptionText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveCaption(img.id);
                                  if (e.key === 'Escape') setEditingCaptionId(null);
                                }}
                                style={{ ...iSt, padding: '4px 8px', fontSize: '0.78rem' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCaption(img.id)}
                                style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingCaptionId(img.id);
                                setEditingCaptionText(img.title || '');
                              }}
                              style={{
                                fontSize: '0.78rem',
                                color: img.title ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontStyle: img.title ? 'normal' : 'italic',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                              title="Clique para editar a legenda"
                            >
                              <span>{img.title || 'Adicionar legenda...'}</span>
                              <Edit3 size={11} style={{ opacity: 0.4 }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Files & Sub-parts */}
          {activeTab === 'files' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Toolbar */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.07)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Peças & Arquivos Componentes do Modelo
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {productFiles.length} {productFiles.length === 1 ? 'arquivo cadastrado' : 'arquivos cadastrados'} • {totalUnitsToPrint} unidades totais para montagem completa
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleOpenAddPartModal}
                    style={{
                      background: '#3b82f6',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '8px 18px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    <Plus size={16} />
                    <span>Adicionar Peça / Arquivo</span>
                  </button>
                </div>
              </div>

              {/* Sub-parts Grid */}
              {productFiles.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    borderRadius: 18,
                    border: '2px dashed var(--border-subtle)',
                    padding: '70px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 14,
                    color: 'var(--text-muted)',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={32} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Nenhuma sub-peça ou arquivo cadastrado
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, maxWidth: 460 }}>
                      Muitos modelos 3D são compostos por diversas peças separadas (ex: cabeça, braço, base, peças de encaixe).
                      Cadastre cada arquivo (STL, 3MF, STEP) com sua respectiva foto ilustrativa, quantidade e instruções.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddPartModal}
                    style={{
                      background: '#3b82f6',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '10px 22px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      marginTop: 8,
                      boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    <Plus size={16} />
                    <span>Cadastrar Primeira Peça</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: 20,
                  }}
                >
                  {productFiles.map(part => {
                    const badge = getFileTypeBadge(part.file_type);

                    return (
                      <div
                        key={part.id}
                        style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 16,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Top section: Photo + Details */}
                        <div style={{ padding: '16px', display: 'flex', gap: 14 }}>
                          {/* Part Photo Thumbnail */}
                          <div
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: 12,
                              overflow: 'hidden',
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              flexShrink: 0,
                              position: 'relative',
                              cursor: part.image_url ? 'pointer' : 'default',
                            }}
                            onClick={() => {
                              if (part.image_url) {
                                setLightboxPartImage({ url: part.image_url, title: part.name });
                              }
                            }}
                          >
                            {part.image_url ? (
                              <>
                                <img
                                  src={part.image_url}
                                  alt={part.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.3)',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                  title="Clique para ampliar"
                                >
                                  <Eye size={20} />
                                </div>
                              </>
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-muted)',
                                  gap: 4,
                                }}
                              >
                                <Layers size={24} style={{ opacity: 0.3 }} />
                                <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>Sem foto</span>
                              </div>
                            )}
                          </div>

                          {/* Info Column */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                                  {part.name}
                                </div>
                                <span
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {part.quantity || 1}x un.
                                </span>
                              </div>

                              {/* File specs */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`,
                                    padding: '1px 6px',
                                    borderRadius: 5,
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.04em',
                                  }}
                                >
                                  {part.file_type || 'ARQUIVO'}
                                </span>

                                {part.weight_g ? (
                                  <span
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.12)',
                                      color: '#10b981',
                                      border: '1px solid rgba(16, 185, 129, 0.25)',
                                      padding: '1px 6px',
                                      borderRadius: 5,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                    }}
                                    title={`Peso: ${part.weight_g}g unitário${part.quantity > 1 ? ` (${(part.weight_g * part.quantity).toFixed(0)}g no conjunto)` : ''}`}
                                  >
                                    ⚖️ {part.weight_g}g{part.quantity > 1 ? ` (${(part.weight_g * part.quantity).toFixed(0)}g)` : ''}
                                  </span>
                                ) : null}

                                {part.print_time_hours ? (
                                  <span
                                    style={{
                                      background: 'rgba(245, 158, 11, 0.12)',
                                      color: '#f59e0b',
                                      border: '1px solid rgba(245, 158, 11, 0.25)',
                                      padding: '1px 6px',
                                      borderRadius: 5,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                    }}
                                    title={`Tempo: ${part.print_time_hours}h unitário${part.quantity > 1 ? ` (${(part.print_time_hours * part.quantity).toFixed(1)}h no conjunto)` : ''}`}
                                  >
                                    ⏱️ {part.print_time_hours}h{part.quantity > 1 ? ` (${(part.print_time_hours * part.quantity).toFixed(1)}h)` : ''}
                                  </span>
                                ) : null}

                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'monospace',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 160,
                                  }}
                                  title={part.filename}
                                >
                                  {part.filename}
                                </span>
                                {part.file_size ? (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                    ({formatBytes(part.file_size)})
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle section: Slicing / Print Notes */}
                        {part.notes && (
                          <div
                            style={{
                              padding: '10px 16px',
                              background: 'rgba(255,255,255,0.02)',
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                              fontSize: '0.78rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                            }}
                          >
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: 6 }}>Instruções:</span>
                            {part.notes}
                          </div>
                        )}

                        {/* Bottom Actions Bar */}
                        <div
                          style={{
                            padding: '10px 16px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.15)',
                          }}
                        >
                          {part.file_url ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadPart(part.file_url, part.filename)}
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                color: '#3b82f6',
                                borderRadius: 7,
                                padding: '5px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                              }}
                              title="Baixar arquivo 3D para o computador"
                            >
                              <Download size={13} />
                              <span>Baixar Arquivo</span>
                            </button>
                          ) : (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sem arquivo local</div>
                          )}

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditPartModal(part)}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--text-secondary)',
                                borderRadius: 7,
                                padding: '5px 10px',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Edit3 size={12} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePart(part.id, part.name)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                borderRadius: 7,
                                padding: '5px 10px',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              title="Remover peça"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: ADICIONAR / EDITAR PEÇA COMPONENTE */}
        {fileModalOpen && (
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
            onClick={() => setFileModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 620,
                maxHeight: '90vh',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      color: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {editingPart ? 'Editar Peça Componente' : 'Nova Peça / Arquivo 3D'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formData.name || 'Produto'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFileModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 8,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Part Name & Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
                  <FieldGroup label="Nome da Peça / Componente *">
                    <input
                      className="form-input"
                      placeholder="Ex: Capacete - Casco Principal"
                      value={partFormData.name}
                      onChange={e => setPartFormData(p => ({ ...p, name: e.target.value }))}
                      style={iSt}
                    />
                  </FieldGroup>

                  <FieldGroup label="Quantidade Necessária">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setPartFormData(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                        style={iBtnSt}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={partFormData.quantity}
                        onChange={e => setPartFormData(p => ({ ...p, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                        style={{ ...iSt, textAlign: 'center', fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={() => setPartFormData(p => ({ ...p, quantity: p.quantity + 1 }))}
                        style={iBtnSt}
                      >
                        +
                      </button>
                    </div>
                  </FieldGroup>
                </div>

                {/* Technical Specs: Weight & Print Time per piece */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FieldGroup label="Peso Unitário da Peça (g ou ml)">
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="form-input"
                        placeholder="Ex: 85"
                        value={partFormData.weight_g || ''}
                        onChange={e => setPartFormData(p => ({ ...p, weight_g: parseFloat(e.target.value) || 0 }))}
                        style={{ ...iSt, paddingRight: 32 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}
                      >
                        g/ml
                      </span>
                    </div>
                  </FieldGroup>

                  <FieldGroup label="Tempo Estimado de Impressão (Horas)">
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        placeholder="Ex: 4.5"
                        value={partFormData.print_time_hours || ''}
                        onChange={e => setPartFormData(p => ({ ...p, print_time_hours: parseFloat(e.target.value) || 0 }))}
                        style={{ ...iSt, paddingRight: 28 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          pointerEvents: 'none',
                        }}
                      >
                        h
                      </span>
                    </div>
                  </FieldGroup>
                </div>

                {/* 3D / Project File Selector */}
                <FieldGroup label="Arquivo 3D / Projeto (STL, 3MF, STEP, OBJ, GCODE...) *">
                  <div
                    onClick={() => partModelFileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border-subtle)',
                      borderRadius: 12,
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      background: partFormData.filename ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileCode size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {partFormData.filename ? (
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {partFormData.filename}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#3b82f6', marginTop: 2 }}>
                            {partFormData.file_type} • {partFormData.file_size ? formatBytes(partFormData.file_size) : 'Arquivo pronto'} (Clique para trocar)
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Clique para selecionar o arquivo 3D
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Formatos suportados: .stl, .3mf, .step, .obj, .gcode, .zip, etc.
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      {partFormData.filename ? 'Trocar' : 'Selecionar'}
                    </button>
                    <input
                      ref={partModelFileInputRef}
                      type="file"
                      accept=".stl,.3mf,.step,.stp,.obj,.gcode,.dxf,.svg,.pdf,.zip,.rar"
                      style={{ display: 'none' }}
                      onChange={handlePartModelFileSelected}
                    />
                  </div>
                </FieldGroup>

                {/* Sub-part Photo / Render */}
                <FieldGroup label="Foto Ilustrativa / Render desta Peça (Opcional)">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div
                      onClick={() => partPhotoInputRef.current?.click()}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      {partFormData.image_url ? (
                        <>
                          <img
                            src={partFormData.image_url}
                            alt="Prévia da peça"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setPartFormData(p => ({ ...p, image_url: '', image_data: '' }));
                            }}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(0,0,0,0.7)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: 18,
                              height: 18,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={11} />
                          </button>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          <ImageIcon size={22} style={{ opacity: 0.3, marginBottom: 2 }} />
                          <div style={{ fontSize: '0.65rem' }}>+ Foto</div>
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <button
                        type="button"
                        onClick={() => partPhotoInputRef.current?.click()}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', gap: 6 }}
                      >
                        <Upload size={14} />
                        <span>{partFormData.image_url ? 'Trocar Foto da Peça' : 'Carregar Foto desta Peça'}</span>
                      </button>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                        Uma imagem desta parte individual ajuda a equipe e o cliente a identificar o componente.
                      </div>
                      <input
                        ref={partPhotoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePartPhotoSelected}
                      />
                    </div>
                  </div>
                </FieldGroup>

                {/* Slicing / Production Notes */}
                <FieldGroup label="Notas de Impressão / Fatiamento">
                  <textarea
                    className="form-input"
                    placeholder="Ex: Altura de camada 0.16mm, infill 20%, suportes em árvore ativados, filamento PLA Prata Beskar."
                    rows={3}
                    value={partFormData.notes}
                    onChange={e => setPartFormData(p => ({ ...p, notes: e.target.value }))}
                    style={{ ...iSt, resize: 'vertical' }}
                  />
                </FieldGroup>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  background: 'rgba(0,0,0,0.1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setFileModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.86rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePart}
                  disabled={savingPart}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '8px 22px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: savingPart ? 'not-allowed' : 'pointer',
                    opacity: savingPart ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Save size={15} />
                  <span>{savingPart ? 'Gravando...' : 'Salvar Peça'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX FOR PART PHOTO */}
        {lightboxPartImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(3, 6, 12, 0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setLightboxPartImage(null)}
          >
            <button
              onClick={() => setLightboxPartImage(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
            <div style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <img
                src={lightboxPartImage.url}
                alt={lightboxPartImage.title}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }}
              />
              <div style={{ marginTop: 12, color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                {lightboxPartImage.title}
              </div>
            </div>
          </div>
        )}

        {/* LIGHTBOX MODAL FOR GALLERY IMAGES */}
        {lightboxIndex !== null && lightboxItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(3, 6, 12, 0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <X size={20} />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex - 1);
                }}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {lightboxIndex < productImages.length - 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex + 1);
                }}
                style={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.title || 'Visualização'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '74vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                }}
              />

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: 'rgba(16, 24, 40, 0.8)',
                  backdropFilter: 'blur(12px)',
                  padding: '8px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>
                  {lightboxItem.title || `Foto ${lightboxIndex + 1} de ${productImages.length}`}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleCopyImage(lightboxItem.image_url)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 6 }}
                  >
                    <Copy size={13} /> Copiar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageIds(new Set([lightboxItem.id]));
                      setWhatsappModalOpen(true);
                      setLightboxIndex(null);
                    }}
                    style={{
                      background: '#22c55e',
                      border: 'none',
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={13} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP SHARING MODAL */}
        {whatsappModalOpen && (
          <ProductWhatsAppModal
            isOpen={whatsappModalOpen}
            onClose={() => setWhatsappModalOpen(false)}
            product={{
              name: formData.name || 'Peça Personalizada',
              sku: formData.sku,
              category: formData.category,
              process_type: formData.process_type,
              unit_price: formData.unit_price,
              description: formData.description,
            }}
            selectedImages={
              selectedImageIds.size > 0
                ? productImages.filter(img => selectedImageIds.has(img.id))
                : productImages
            }
            onRemoveFromSelection={id => {
              setSelectedImageIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }}
          />
        )}
      </>
    );
  }

  // CATALOG LIST VIEW
  return (
    <div className="page-container">
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Catálogo de Peças</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{products.length} peças cadastradas</p>
        </div>
        <button
          onClick={() => handleOpenEditor()}
          style={{
            background: 'var(--brand-primary)',
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '10px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem',
            fontWeight: 700,
            boxShadow: '0 4px 20px var(--brand-primary-glow)',
          }}
        >
          <Plus size={16} /> Nova Peça
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="form-input"
            style={{ ...iSt, paddingLeft: 40 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {processFilters.map(f => {
            const isSel = selectedProcess === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setSelectedProcess(f.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                  background: isSel ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--bg-surface-elevated)',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-muted)',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSel ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isSel ? '0 3px 12px var(--brand-primary-glow)' : 'none',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Package size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <div>Carregando catálogo...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>Nenhuma peça encontrada</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Tente outro filtro ou cadastre uma nova peça</div>
        </div>
      ) : (
        <div key={selectedProcess} className="tab-pane-animated" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => handleOpenEditor(product, 'specs')}
              onOpenImages={() => handleOpenEditor(product, 'images')}
              onOpenFiles={() => handleOpenEditor(product, 'files')}
              onDelete={() => handleDelete(product.id, product.name)}
              onOrder={onGenerateOrderFromProduct ? () => onGenerateOrderFromProduct(product) : undefined}
              onCalculate={onOpenInCalculator ? () => onOpenInCalculator(product) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
