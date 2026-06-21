import { create } from 'zustand';
import { dbGetAll, dbPut, dbDelete, dbGet } from '../lib/db';
import type { Tag, Customer, Product } from '../types';
import { RecommendationService } from '../lib/recommendationService';

interface TagState {
  tags: Tag[];
  isLoading: boolean;
  loadTags: () => Promise<void>;
  createTag: (name: string, weight: number) => Promise<void>;
  updateTag: (id: string, name: string, weight: number) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  assignTagToCustomer: (customerId: string, tagId: string) => Promise<void>;
  removeTagFromCustomer: (customerId: string, tagId: string) => Promise<void>;
  assignTagToProduct: (productId: string, tagId: string) => Promise<void>;
  removeTagFromProduct: (productId: string, tagId: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,

  loadTags: async () => {
    set({ isLoading: true });
    const tags = await dbGetAll<Tag>('tags');
    set({ tags, isLoading: false });
  },

  createTag: async (name: string, weight: number) => {
    const newTag: Tag = { id: `tag_${Date.now()}`, name, weight };
    await dbPut('tags', newTag);
    get().loadTags();
  },

  updateTag: async (id: string, name: string, weight: number) => {
    const updatedTag: Tag = { id, name, weight };
    await dbPut('tags', updatedTag);
    get().loadTags();
    // Recalculate recommendations because tag weight might have changed
    await RecommendationService.recalculateAll();
  },

  deleteTag: async (id: string) => {
    await dbDelete('tags', id);
    get().loadTags();
    await RecommendationService.recalculateAll();
  },

  assignTagToCustomer: async (customerId: string, tagId: string) => {
    const customer = await dbGet<Customer>('customers', customerId);
    if (!customer) return;
    const currentTags = customer.tags || [];
    if (!currentTags.includes(tagId)) {
      customer.tags = [...currentTags, tagId];
      await dbPut('customers', customer);
      await RecommendationService.generateRecommendations(customerId);
    }
  },

  removeTagFromCustomer: async (customerId: string, tagId: string) => {
    const customer = await dbGet<Customer>('customers', customerId);
    if (!customer) return;
    customer.tags = (customer.tags || []).filter(id => id !== tagId);
    await dbPut('customers', customer);
    await RecommendationService.generateRecommendations(customerId);
  },

  assignTagToProduct: async (productId: string, tagId: string) => {
    const product = await dbGet<Product>('products', productId);
    if (!product) return;
    const currentTags = product.tags || [];
    if (!currentTags.includes(tagId)) {
      product.tags = [...currentTags, tagId];
      await dbPut('products', product);
      await RecommendationService.recalculateAll(); // Affects all customers
    }
  },

  removeTagFromProduct: async (productId: string, tagId: string) => {
    const product = await dbGet<Product>('products', productId);
    if (!product) return;
    product.tags = (product.tags || []).filter(id => id !== tagId);
    await dbPut('products', product);
    await RecommendationService.recalculateAll();
  }
}));
