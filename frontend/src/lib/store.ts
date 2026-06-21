import { create } from 'zustand';
import type { Customer, CustomerTag, Interaction, Product, PurchaseHistory } from '../types';
import { generateMockData } from './mockDataGenerator';

const initialData = generateMockData();

interface CRMStore {
  customers: Customer[];
  tags: CustomerTag[];
  interactions: Interaction[];
  purchases: PurchaseHistory[];
  products: Product[];
  
  // Actions
  addInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  updateCustomerTags: (customerId: string, tagIds: string[]) => void;
}

export const useCRMStore = create<CRMStore>((set) => ({
  customers: initialData.customers,
  tags: initialData.tags,
  interactions: initialData.interactions,
  purchases: initialData.purchases,
  products: initialData.products,

  addInteraction: (interactionData) => set((state) => {
    const newInteraction: Interaction = {
      ...interactionData,
      id: `i${state.interactions.length + 1}`,
    };
    
    const updatedCustomers = state.customers.map(c => 
      c.id === interactionData.customerId 
        ? { ...c, lastContactedDate: interactionData.contactDate }
        : c
    );

    return {
      interactions: [newInteraction, ...state.interactions],
      customers: updatedCustomers
    };
  }),

  updateCustomerTags: (customerId, tagIds) => set((state) => ({
    customers: state.customers.map(c => 
      c.id === customerId ? { ...c, tags: tagIds } : c
    )
  })),
}));
