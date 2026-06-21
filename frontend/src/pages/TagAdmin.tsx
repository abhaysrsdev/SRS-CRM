import { useEffect, useState } from 'react';
import { useTagStore } from '../store/tagStore';
import { useCustomers, useProducts } from '../hooks/useQueries';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Tag as TagIcon, Plus, Trash2, Check } from 'lucide-react';
import { FadeIn } from '../components/ui/motion';
import type { Customer, Product } from '../types';

export function TagAdmin() {
  const { tags, loadTags, createTag, deleteTag, assignTagToCustomer, removeTagFromCustomer, assignTagToProduct, removeTagFromProduct } = useTagStore();
  const { data: customers } = useCustomers();
  const { data: products } = useProducts();

  const [newTagName, setNewTagName] = useState('');
  const [newTagWeight, setNewTagWeight] = useState(1);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag(newTagName.trim(), newTagWeight);
    setNewTagName('');
    setNewTagWeight(1);
  };

  const handleCustomerTag = async (customer: Customer, tagId: string) => {
    const hasTag = customer.tags?.includes(tagId);
    if (hasTag) {
      await removeTagFromCustomer(customer.id, tagId);
    } else {
      await assignTagToCustomer(customer.id, tagId);
    }
  };

  const handleProductTag = async (product: Product, tagId: string) => {
    const hasTag = product.tags?.includes(tagId);
    if (hasTag) {
      await removeTagFromProduct(product.id, tagId);
    } else {
      await assignTagToProduct(product.id, tagId);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-brand-bg p-8 space-y-8">
      <FadeIn>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <TagIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Tag Management</h2>
            <p className="text-slate-500">Create, weight, and assign tags to power the recommendation engine.</p>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tag Creation */}
        <Card className="shadow-soft rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Tag Name (e.g., Wedding)" 
                value={newTagName} 
                onChange={e => setNewTagName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-xl bg-slate-50 text-sm"
              />
              <input 
                type="number" 
                min="1" 
                value={newTagWeight} 
                onChange={e => setNewTagWeight(Number(e.target.value))}
                className="w-20 px-3 py-2 border rounded-xl bg-slate-50 text-sm text-center"
              />
              <button onClick={handleCreateTag} className="bg-brand-primary text-white p-2 rounded-xl hover:bg-brand-secondary transition-colors">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto scrollbar-hide">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between bg-white border p-3 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{tag.name}</p>
                    <p className="text-xs text-slate-400">Weight: {tag.weight}</p>
                  </div>
                  <button onClick={() => deleteTag(tag.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {tags.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No tags created yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Customer Assignment */}
        <Card className="shadow-soft rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg">Assign to Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto scrollbar-hide">
            {customers?.slice(0, 50).map(customer => (
              <div key={customer.id} className="p-4 border-b hover:bg-slate-50 transition-colors">
                <p className="font-bold text-sm text-slate-800 mb-2">{customer.name}</p>
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => {
                    const hasTag = customer.tags?.includes(tag.id);
                    return (
                      <button 
                        key={tag.id} 
                        onClick={() => handleCustomerTag(customer, tag.id)}
                        className={`px-2 py-1 text-[10px] rounded-lg font-bold transition-all border flex items-center gap-1 ${hasTag ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {hasTag && <Check className="h-3 w-3" />} {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Product Assignment */}
        <Card className="shadow-soft rounded-2xl">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg">Assign to Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto scrollbar-hide">
            {products?.slice(0, 50).map(product => (
              <div key={product.id} className="p-4 border-b hover:bg-slate-50 transition-colors">
                <p className="font-bold text-sm text-slate-800 mb-2">{product.name}</p>
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => {
                    const hasTag = product.tags?.includes(tag.id);
                    return (
                      <button 
                        key={tag.id} 
                        onClick={() => handleProductTag(product, tag.id)}
                        className={`px-2 py-1 text-[10px] rounded-lg font-bold transition-all border flex items-center gap-1 ${hasTag ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                      >
                        {hasTag && <Check className="h-3 w-3" />} {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
