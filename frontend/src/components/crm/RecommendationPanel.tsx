import React, { useEffect, useState } from 'react';
import { RecommendationService } from '../../lib/recommendationService';
import type { Recommendation, Product } from '../../types';
import { useProducts } from '../../hooks/useQueries';
import { useTagStore } from '../../store/tagStore';
import { Sparkles, Tag as TagIcon } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../ui/motion';

export function RecommendationPanel({ customerId }: { customerId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const { data: allProducts } = useProducts();
  const { tags } = useTagStore();

  useEffect(() => {
    if (customerId) {
      RecommendationService.getTopRecommendations(customerId, 5).then(setRecommendations);
    }
  }, [customerId, tags]); // Re-run if tags change globally

  if (!recommendations.length) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
        <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No recommendations yet.</p>
        <p className="text-xs">Assign tags to this customer to see AI matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h3 className="font-bold text-slate-800">Top Recommended Matches</h3>
      </div>
      
      <StaggerContainer className="space-y-3">
        {recommendations.map(rec => {
          const product = allProducts?.find(p => p.id === rec.productId);
          if (!product) return null;

          return (
            <StaggerItem key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-sm text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-lg font-black ${rec.percentage >= 80 ? 'text-emerald-600' : rec.percentage >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {rec.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Match Score</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full ${rec.percentage >= 80 ? 'bg-emerald-500' : rec.percentage >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                  style={{ width: `${rec.percentage}%` }}
                />
              </div>

              {/* Matched Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {rec.matchedTags.map(tagId => {
                  const tagDef = tags.find(t => t.id === tagId);
                  return tagDef ? (
                    <span key={tagId} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100">
                      <TagIcon className="h-2.5 w-2.5" />
                      {tagDef.name}
                    </span>
                  ) : null;
                })}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
