'use client';

import { useState, useEffect } from 'react';
import { 
  getFamiliesAction, 
  createFamilyAction, 
  deleteFamilyAction, 
  updateFamilyAction,
  getCategoriesAction, 
  createCategoryAction, 
  deleteCategoryAction,
  updateCategoryAction
} from '@/app/actions/categories';
import { Settings, Plus, Trash2, FolderPlus, Tag, ArrowRight, Wallet, TrendingUp, ChevronRight, Hash, Pencil, Check } from 'lucide-react';

export default function ConfigPage() {
  const [families, setFamilies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States pour les formulaires
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyType, setNewFamilyType] = useState<'expense' | 'income'>('expense');
  const [newCatNames, setNewCatNames] = useState<{[key: string]: string}>({});

  // States pour l'édition
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [fams, cats] = await Promise.all([
      getFamiliesAction(),
      getCategoriesAction()
    ]);
    setFamilies(fams);
    setCategories(cats);
    setLoading(false);
  }

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName) return;
    await createFamilyAction(newFamilyName, newFamilyType);
    setNewFamilyName('');
    loadData();
  };

  const handleUpdateFamily = async (id: string) => {
    if (!editingFamilyName) return;
    await updateFamilyAction(id, editingFamilyName);
    setEditingFamilyId(null);
    loadData();
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCategoryName) return;
    await updateCategoryAction(id, editingCategoryName);
    setEditingCategoryId(null);
    loadData();
  };

  const handleAddCategory = async (familyId: string) => {
    const name = newCatNames[familyId];
    if (!name) return;
    await createCategoryAction(name, familyId);
    setNewCatNames(prev => ({ ...prev, [familyId]: '' }));
    loadData();
  };

  const handleDeleteFamily = async (id: string) => {
    if (confirm('Supprimer cette famille supprimera aussi ses catégories. Continuer ?')) {
      await deleteFamilyAction(id);
      loadData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategoryAction(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 pt-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-16 items-start w-full">
        
        {/* Main Content: Families & Categories List */}
        <div className="order-2 xl:order-1 flex-1 space-y-12 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-end px-4">
                 <div className="space-y-2">
                    <h3 className="text-[#8e8e93] text-sm font-black uppercase tracking-[0.3em] opacity-60">Structure Financière</h3>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Familles & Catégories</h2>
                 </div>
            </div>

            <div className="space-y-10">
                {families.length === 0 ? (
                    <div className="p-20 rounded-[48px] bg-card/20 border border-dashed border-white/5 text-center space-y-4">
                        <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto opacity-20">
                            <Hash size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[#8e8e93] text-lg font-bold">Aucune structure définie</p>
                            <p className="text-[#444] text-sm font-medium">Commence par créer une famille de catégories à droite.</p>
                        </div>
                    </div>
                ) : families.map((fam) => (
                    <div key={fam.id} className="bg-card/40 backdrop-blur-md rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
                        {/* Family Header */}
                        <div className="p-8 flex justify-between items-center bg-white/[0.03] border-b border-white/5">
                            <div className="flex items-center gap-6 flex-1">
                                <div className={`w-4 h-4 rounded-full ${fam.type === 'expense' ? 'bg-accent-purple shadow-[0_0_15px_rgba(140,141,250,0.6)]' : 'bg-accent-green shadow-[0_0_15px_rgba(52,211,153,0.6)]'}`} />
                                <div className="space-y-1 flex-1">
                                    {editingFamilyId === fam.id ? (
                                        <div className="flex gap-2">
                                            <input 
                                                autoFocus
                                                value={editingFamilyName}
                                                onChange={(e) => setEditingFamilyName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateFamily(fam.id)}
                                                className="bg-black/40 border border-accent-purple/30 rounded-xl px-4 py-2 text-white text-2xl font-bold w-full outline-none"
                                            />
                                            <button onClick={() => handleUpdateFamily(fam.id)} className="text-accent-green p-2"><Check size={24} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 group/fam">
                                            <h3 className="text-white text-2xl font-bold tracking-tight">{fam.name}</h3>
                                            <button 
                                                onClick={() => {
                                                    setEditingFamilyId(fam.id);
                                                    setEditingFamilyName(fam.name);
                                                }}
                                                className="opacity-0 group-hover/fam:opacity-100 text-[#444] hover:text-white transition-all"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>
                                    )}
                                    <span className="text-[10px] font-black text-[#8e8e93] uppercase tracking-[0.2em] opacity-40">
                                        {fam.type === 'expense' ? 'Flux Sortant' : 'Flux Entrant'}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteFamily(fam.id)}
                                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#444] hover:text-red-400 transition-all border border-white/5 hover:border-red-400/20"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Categories in this family */}
                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categories.filter(c => c.family_id === fam.id).map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-6 rounded-3xl bg-black/40 border border-white/5 group hover:border-white/10 transition-all shadow-inner">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shrink-0">
                                                <Tag size={16} className="text-[#8e8e93] group-hover:text-white" />
                                            </div>
                                            {editingCategoryId === cat.id ? (
                                                <div className="flex gap-2 flex-1">
                                                    <input 
                                                        autoFocus
                                                        value={editingCategoryName}
                                                        onChange={(e) => setEditingCategoryName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat.id)}
                                                        className="bg-black/60 border border-accent-purple/30 rounded-lg px-3 py-1 text-white text-sm font-bold w-full outline-none"
                                                    />
                                                    <button onClick={() => handleUpdateCategory(cat.id)} className="text-accent-green"><Check size={18} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 group/cat">
                                                    <span className="text-white text-base font-bold tracking-tight">{cat.name}</span>
                                                    <button 
                                                        onClick={() => {
                                                            setEditingCategoryId(cat.id);
                                                            setEditingCategoryName(cat.name);
                                                        }}
                                                        className="opacity-0 group-hover/cat:opacity-100 text-[#444] hover:text-white transition-all"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="opacity-0 group-hover:opacity-100 w-10 h-10 rounded-xl bg-red-400/10 text-red-400 flex items-center justify-center transition-all hover:bg-red-400 hover:text-white"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Category Form */}
                            <div className="pt-6 flex gap-4">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-[#444]" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Nouvelle catégorie..."
                                        value={newCatNames[fam.id] || ''}
                                        onChange={(e) => setNewCatNames(prev => ({ ...prev, [fam.id]: e.target.value }))}
                                        className="w-full bg-black/40 rounded-[24px] py-5 pl-14 pr-6 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#2c2c2e] font-medium"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleAddCategory(fam.id)}
                                    className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all border border-white/5 shadow-xl"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Sidebar: Forms & Tools */}
        <div className="order-1 xl:order-2 w-full xl:sticky xl:top-12 space-y-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[48px] p-12 border border-white/5 space-y-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent-purple/10 blur-[100px] rounded-full" />
              
              <div className="space-y-10 relative z-10">
                 <div className="flex items-center gap-4 text-accent-purple">
                    <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 flex items-center justify-center">
                        <FolderPlus size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Architecture</span>
                 </div>
                 
                 <form onSubmit={handleAddFamily} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.1em] px-1 opacity-60">Nom de la famille</label>
                        <input 
                            type="text" 
                            placeholder="ex: Loisirs, Maison..."
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            className="w-full bg-black/40 rounded-[24px] py-5 px-8 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#2c2c2e] font-medium"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-[#8e8e93] uppercase tracking-[0.1em] px-1 opacity-60">Type de flux</label>
                        <div className="bg-black/40 p-2 rounded-[28px] flex border border-white/5 shadow-inner">
                            <button 
                                type="button"
                                onClick={() => setNewFamilyType('expense')}
                                className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.1em] transition-all ${newFamilyType === 'expense' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                            >
                                Dépense
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewFamilyType('income')}
                                className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[0.1em] transition-all ${newFamilyType === 'income' ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-[#8e8e93] hover:text-white'}`}
                            >
                                Revenu
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-accent-purple text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(140,141,250,0.3)] border border-white/10"
                    >
                        Créer la famille
                    </button>
                 </form>
              </div>
           </div>

           {/* Organization Guide */}
           <div className="p-10 rounded-[48px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 flex items-start gap-6 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0">
                 <Settings size={24} className="text-[#8e8e93]" />
              </div>
              <div className="space-y-2">
                 <h4 className="text-white text-sm font-black uppercase tracking-widest">Conseil d'Organisation</h4>
                 <p className="text-[#8e8e93] text-sm leading-relaxed font-medium">
                    Utilise les familles pour une segmentation macro (Besoin vs Envie) et les catégories pour le détail opérationnel.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>


  );
}
