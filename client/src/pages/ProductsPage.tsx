import React, { useState, useEffect, useRef } from 'react';
import { Product, ProcessType, MaterialFDM, MaterialResin, Equipment } from '../types';
import { api } from '../services/api';
import { formatCurrency, PROCESS_MAP } from '../utils/formatters';
import {
  Search, Plus, Edit3, Trash2, Clock, Weight, Sparkles,
  DollarSign, TrendingUp, X, Package, Zap, Image as ImageIcon,
  Upload, ArrowLeft, Copy, CheckCircle2, Save, RefreshCw
} from 'lucide-react';

interface ProductsPageProps {
  onGenerateOrderFromProduct?: (product: Product) => void;
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

interface ProductCardProps { product: Product; onEdit: () => void; onDelete: () => void; onOrder?: () => void; }

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onOrder }) => {
  const [hovered, setHovered] = useState(false);
  const meta = PROCESS_MAP[product.process_type] || { label: product.process_type, icon: '📦' };
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: hovered ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', transition: 'all 0.2s ease', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onEdit}>
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'rgba(255,255,255,0.03)' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={36} style={{ opacity: 0.12 }} /></div>
        )}
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: '0.7rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{meta.icon}</span> {meta.label}
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          {onOrder && <button onClick={e => { e.stopPropagation(); onOrder(); }} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Emitir Pedido"><Zap size={13} /></button>}
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'rgba(239,68,68,0.75)', backdropFilter: 'blur(8px)', border: 'none', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Remover"><Trash2 size={13} /></button>
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
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Edit3 size={12} /> Editar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductsPage: React.FC<ProductsPageProps> = ({ onGenerateOrderFromProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<any>({ fdm: [], resin: [], laser: [], finishing: [] });
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<string>('ALL');
  const [formData, setFormData] = useState({
    name: '', sku: '', category: 'Geral', process_type: 'FDM' as ProcessType,
    description: '', material_id: '', equipment_id: '',
    production_time_hours: 2.5, weight_g: 65, unit_cost: 18.5,
    margin_percent: 60, unit_price: 46.25, image_url: '', calc_params_json: '',
  });
  const [timeHours, setTimeHours] = useState(2);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [savedToast, setSavedToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); loadDependencies(); }, []);

  const loadProducts = async () => {
    try { setLoading(true); const data = await api.getProducts(); setProducts(data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadDependencies = async () => {
    try {
      const [mats, eqs, sets] = await Promise.all([api.getMaterials(), api.getEquipments(), api.getSettings()]);
      setMaterials(mats); setEquipments(eqs); setSettings(sets || {});
    } catch (err) { console.error(err); }
  };

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)) &&
      (selectedProcess === 'ALL' || p.process_type === selectedProcess);
  });

  const processFilters = [
    { key: 'ALL', label: 'Todos' }, { key: 'FDM', label: 'FDM' },
    { key: 'RESIN', label: 'Resina' }, { key: 'LASER', label: 'Laser' },
  ];

  const handleOpenEditor = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      const h = Math.floor(prod.production_time_hours || 0);
      const m = Math.round(((prod.production_time_hours || 0) - h) * 60);
      setTimeHours(h); setTimeMinutes(m);
      setFormData({ name: prod.name, sku: prod.sku, category: prod.category || 'Geral',
        process_type: prod.process_type, description: prod.description || '',
        material_id: prod.material_id || '', equipment_id: prod.equipment_id || '',
        production_time_hours: prod.production_time_hours || 0, weight_g: prod.weight_g || 0,
        unit_cost: prod.unit_cost || 0, margin_percent: prod.margin_percent || 50,
        unit_price: prod.unit_price || 0, image_url: prod.image_url || '', calc_params_json: prod.calc_params_json || '' });
    } else {
      setEditingProduct(null); setTimeHours(2); setTimeMinutes(30);
      setFormData({ name: '', sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000),
        category: 'Geral', process_type: 'FDM', description: '',
        material_id: materials.fdm?.[0]?.id || '',
        equipment_id: equipments.find((e: Equipment) => e.type === 'FDM')?.id || '',
        production_time_hours: 2.5, weight_g: 65, unit_cost: 18.5,
        margin_percent: 60, unit_price: 46.25, image_url: '', calc_params_json: '' });
    }
    setViewMode('editor'); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecione uma imagem válida.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Imagem muito grande (limite 5MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setFormData(p => ({ ...p, image_url: reader.result as string })); };
    reader.readAsDataURL(file);
  };

  const handleTimeChange = (h: number, m: number) => {
    setTimeHours(h); setTimeMinutes(m);
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
    } else { cost += weight_g * 0.2; }
    const eq = equipments.find(e => e.id === equipment_id);
    if (eq) { cost += (eq.hourly_depreciation || 1.5) * production_time_hours; cost += ((eq.power_watts || 150) / 1000) * production_time_hours * (Number(settings.kwh_price) || 0.85); }
    else { cost += 1.2 * production_time_hours + 0.15 * production_time_hours * 0.85; }
    if (cost > 0) handleCostOrMarginChange(Number(cost.toFixed(2)), formData.margin_percent);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('Nome do produto é obrigatório.'); return; }
    try {
      if (editingProduct) await api.updateProduct(editingProduct.id, formData);
      else await api.createProduct(formData);
      await loadProducts(); setSavedToast(true); setTimeout(() => setSavedToast(false), 3000);
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm('Remover "' + name + '" do catálogo?')) return;
    try { await api.deleteProduct(id); loadProducts(); if (viewMode === 'editor' && editingProduct?.id === id) setViewMode('list'); }
    catch (err: any) { alert(err.message); }
  };

  const handleDuplicate = () => {
    setEditingProduct(null);
    setFormData(p => ({ ...p, name: p.name + ' (Cópia)', sku: 'PRD-' + Math.floor(1000 + Math.random() * 9000) }));
    setSavedToast(true); setTimeout(() => setSavedToast(false), 3000);
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

  if (viewMode === 'editor') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
        {savedToast && (
          <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: 'var(--brand-primary)', color: '#fff', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px var(--brand-primary-glow)', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle2 size={18} /> Salvo com sucesso!
          </div>
        )}

        <div style={{ position: 'sticky', top: 64, zIndex: 40, background: 'var(--bg-surface)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
              <ArrowLeft size={15} /> Catálogo
            </button>
            <span style={{ color: 'var(--border-subtle)', fontSize: '1.2rem' }}>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{editingProduct ? formData.name || 'Editar Peça' : 'Nova Peça'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {editingProduct && (
              <>
                <button onClick={handleDuplicate} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem' }}>
                  <Copy size={14} /> Duplicar
                </button>
                {onGenerateOrderFromProduct && (
                  <button onClick={() => onGenerateOrderFromProduct({ ...editingProduct, ...formData })} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem' }}>
                    <Zap size={14} /> Emitir Pedido
                  </button>
                )}
                <button onClick={() => handleDelete(editingProduct.id, editingProduct.name)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.83rem' }}>
                  <Trash2 size={14} /> Remover
                </button>
              </>
            )}
            <button onClick={() => handleSave()} style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.88rem', fontWeight: 700 }}>
              <Save size={15} /> Salvar Ficha
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              {formData.image_url ? (
                <div style={{ position: 'relative' }}>
                  <img src={formData.image_url} alt="Produto" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = ''; setFormData(p => ({ ...p, image_url: '' })); }} />
                  <button onClick={() => setFormData(p => ({ ...p, image_url: '' }))} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', gap: 10 }} onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon size={32} style={{ opacity: 0.3 }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>Adicionar Foto</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Clique para selecionar</div>
                  </div>
                </div>
              )}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                <input className="form-input" value={formData.image_url.startsWith('data:') ? '' : formData.image_url} onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} placeholder="URL da imagem..." style={{ ...iSt, flex: 1, fontSize: '0.78rem' }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={iBtnSt} title="Upload"><Upload size={14} /></button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              </div>
            </div>

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
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Catálogo de Peças</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{products.length} peças cadastradas</p>
        </div>
        <button onClick={() => handleOpenEditor()} style={{ background: 'var(--brand-primary)', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 4px 20px var(--brand-primary-glow)' }}>
          <Plus size={16} /> Nova Peça
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou SKU..." className="form-input" style={{ ...iSt, paddingLeft: 40 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {processFilters.map(f => (
            <button key={f.key} onClick={() => setSelectedProcess(f.key)} style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', border: selectedProcess === f.key ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)', background: selectedProcess === f.key ? 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' : 'var(--bg-surface-elevated)', color: selectedProcess === f.key ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
              {f.label}
            </button>
          ))}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onEdit={() => handleOpenEditor(product)} onDelete={() => handleDelete(product.id, product.name)} onOrder={onGenerateOrderFromProduct ? () => onGenerateOrderFromProduct(product) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
};
