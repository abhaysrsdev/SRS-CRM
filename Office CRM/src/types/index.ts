export type CustomerSegment = 'Cold Leads' | 'Purchased < 3 Times' | 'Mid Revenue Parties' | 'High Ranking Parties' | 'Lot Parties';
export type ReminderList = 'Red List' | 'Yellow List' | 'Green List';

export interface CustomerTag {
  id: string;
  name: string;
  category: 'Price Range' | 'Colors' | 'Categories' | 'State' | 'Willingness To Buy' | 'Customer Segment';
}

export interface Tag {
  id: string;
  name: string;
  weight: number;
}

export interface Interaction {
  id: string;
  customerId: string;
  contactDate: string;
  narration: string;
  discussionNotes: string;
  followUpDate: string;
  status: 'Completed' | 'Pending';
}

export interface PurchaseHistory {
  id: string;
  customerId: string;
  date: string;
  productName: string;
  category: string;
  quantity: number;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  address: string;
  state: string;
  businessType: string;
  gstNumber: string;
  partyScore: number;
  lastContactedDate: string;
  segment: CustomerSegment;
  tags: string[]; // tag IDs
  purchaseFrequency: number;
  revenueGenerated: number;
  averageOrderValue: number;
}

export interface Product {
  id: string;
  name: string;
  designCode: string;
  imageUrl: string;
  category: 'Bestsellers' | 'Running Products' | 'High Stock' | 'Stuck Stock' | 'Dead Stock' | 'Under 5 Piece';
  color: string;
  priceBucket: string;
  demandScore: number;
  stockQuantity: number;
  tags?: string[];
}

export interface Reminder {
  id: string;
  customerId: string;
  dueDate: string;
  type: ReminderList;
}

export interface Recommendation {
  id?: string;
  customerId: string;
  productId: string;
  matchedTags: string[];
  score: number;
  percentage: number;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  date: string;
  customerName: string;
  gstNumber: string;
  broker: string;
  orderNo: number;
  cityName: string;
  catalog: string;
  vol: string;
  productCode: string;
  packing: string;
  color: string;
  orderPcs: number;
  dispPcs: number;
  balPcs: number;
  rate: number;
  amount: number;
  overDueDays: number;
  dueDays: number;
  salesMan: string;
  createdAt: string;
}

