'use client';

import { useState, useEffect } from 'react';
import { 
  getFamiliesAction, 
  createFamilyAction, 
  deleteFamilyAction, 
  getCategoriesAction, 
  createCategoryAction, 
  deleteCategoryAction 
} from '@/app/actions/categories';
import { Settings, Plus, Trash2, FolderPlus, Tag, ArrowRight, Wallet, TrendingUp, ChevronRight, Hash } from 'lucide-react';

export default function ConfigPage() {
  const [families, setFamilies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States pour les formulaires
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyType, setNewFamilyType] = useState<'expense' | 'income'>('expense');
  const [newCatNames, setNewCatNames] = useState<{[key: string]: string}>({});

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
    <div className="space-y-8 pb-32 pt-4 px-1">
      
      <div className="flex flex-col lg:flex-row-reverse gap-12 items-start">
        
        {/* Right Sidebar: Add Family Form */}
        <div className="w-full lg:w-[380px] lg:sticky lg:top-8 space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
           <div className="bg-card rounded-[40px] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
             <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2 text-accent-purple">
                    <FolderPlus size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nouvelle Famille</span>
                </div>
                
                <form onSubmit={handleAddFamily} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#444] uppercase px-1">Nom de la famille</label>
                        <input 
                            type="text" 
                            placeholder="ex: Loisirs, Maison..."
                            value={newFamilyName}
                            onChange={(e) => setNewFamilyName(e.target.value)}
                            className="w-full bg-[#050505] rounded-2xl py-4 px-6 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#2c2c2e]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#444] uppercase px-1">Type de flux</label>
                        <div className="bg-[#050505] p-1.5 rounded-full flex border border-white/5 shadow-inner">
                            <button 
                                type="button"
                                onClick={() => setNewFamilyType('expense')}
                                className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${newFamilyType === 'expense' ? 'bg-white/10 text-white' : 'text-[#8e8e93]'}`}
                            >
                                Dépense
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewFamilyType('income')}
                                className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${newFamilyType === 'income' ? 'bg-white/10 text-white' : 'text-[#8e8e93]'}`}
                            >
                                Revenu
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-accent-purple text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-accent-purple/20"
                    >
                        Créer la famille
                    </button>
                </form>
             </div>
           </div>

           {/* Info Card */}
           <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 space-y-3">
              <h4 className="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                <Settings size={14} className="text-[#8e8e93]" /> Organisation
              </h4>
              <p className="text-[#8e8e93] text-[11px] leading-relaxed">
                Les familles permettent de regrouper tes catégories. Par exemple, "Alimentation" peut contenir "Supermarché" et "Restaurants".
              </p>
           </div>
        </div>

        {/* Main Content: Families & Categories List */}
        <div className="flex-1 space-y-10 w-full animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-end px-2">
                 <div className="space-y-1">
                    <h3 className="text-[#8e8e93] text-[10px] font-black uppercase tracking-[0.2em]">Structure Financière</h3>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Familles & Catégories</h2>
                 </div>
            </div>

            <div className="space-y-8">
                {families.length === 0 ? (
                    <div className="p-12 rounded-[40px] bg-card/30 border border-dashed border-white/10 text-center">
                        <p className="text-[#444] font-bold">Aucune famille créée.</p>
                        <p className="text-[#2c2c2e] text-xs">Utilise le formulaire à droite pour commencer.</p>
                    </div>
                ) : families.map((fam) => (
                    <div key={fam.id} className="bg-card/30 rounded-[40px] border border-white/5 overflow-hidden">
                        {/* Family Header */}
                        <div className="p-6 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${fam.type === 'expense' ? 'bg-accent-purple shadow-[0_0_8px_rgba(140,141,250,0.4)]' : 'bg-accent-green shadow-[0_0_8px_rgba(52,211,153,0.4)]'}`} />
                                <h3 className="text-white text-xl font-bold">{fam.name}</h3>
                                <span className="text-[9px] font-black text-[#8e8e93] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                    {fam.type === 'expense' ? 'Dépense' : 'Revenu'}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleDeleteFamily(fam.id)}
                                className="p-2 text-[#444] hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Categories in this family */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {categories.filter(c => c.family_id === fam.id).map(cat => (
                                    <div key={cat.id} className="flex justify-between items-center p-4 rounded-2xl bg-[#050505]/50 border border-white/5 group">
                                        <div className="flex items-center gap-3">
                                            <Tag size={14} className="text-[#444] group-hover:text-white transition-colors" />
                                            <span className="text-white text-sm font-semibold">{cat.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-[#444] hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Category Form */}
                            <div className="pt-4 flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ajouter une catégorie..."
                                    value={newCatNames[fam.id] || ''}
                                    onChange={(e) => setNewCatNames(prev => ({ ...prev, [fam.id]: e.target.value }))}
                                    className="flex-1 bg-[#050505] rounded-xl py-3 px-5 text-sm text-white border border-white/5 outline-none focus:border-accent-purple/30 transition-all placeholder:text-[#2c2c2e]"
                                />
                                <button 
                                    onClick={() => handleAddCategory(fam.id)}
                                    className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
