import { create } from 'zustand';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'info';
}

interface AppState {
  aiInsights: AIInsight[];
  isInsightsPanelOpen: boolean;
  generateInsights: (customers: any[], products: any[], salesOrders?: any[]) => void;
  toggleInsightsPanel: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  aiInsights: [],
  isInsightsPanelOpen: false,
  
  toggleInsightsPanel: () => set((state) => ({ isInsightsPanelOpen: !state.isInsightsPanelOpen })),
  
  generateInsights: (customers, products, salesOrders?: any[]) => {
    // Generate AI Insights from the loaded ledger data and sales orders
    const insights: AIInsight[] = [];
    
    const deadStock = products.filter(p => p.category === 'Dead Stock');
    if (deadStock.length > 0) {
      insights.push({
        id: '1',
        title: 'Dead Stock Alert',
        description: `You have ${deadStock.length} items classified as dead stock. Recommend pushing these in your next follow-ups.`,
        type: 'warning'
      });
    }

    const coldLeads = customers.filter(c => c.segment === 'Cold Leads');
    if (coldLeads.length > 0) {
      insights.push({
        id: '2',
        title: 'Re-engagement Opportunity',
        description: `${coldLeads.length} parties are currently cold. Send them a WhatsApp broadcast of new arrivals.`,
        type: 'info'
      });
    }

    const highSpenders = customers.filter(c => c.partyScore > 80);
    insights.push({
      id: '3',
      title: 'Top Performers',
      description: `You have ${highSpenders.length} high-ranking parties. Prioritize their follow-ups today!`,
      type: 'success'
    });

    if (salesOrders && salesOrders.length > 0) {
      // 1. Highest performing customer
      const custRev: Record<string, number> = {};
      const cityRev: Record<string, number> = {};
      const salesmanRev: Record<string, number> = {};
      const brokerRev: Record<string, number> = {};
      const prodRev: Record<string, number> = {};
      
      let totalOrderPcs = 0;
      let totalDispPcs = 0;
      let maxOverdueDays = 0;
      let maxOverdueCust = '';
      
      const pendingVals: Record<string, number> = {};

      salesOrders.forEach(o => {
        const amt = o.amount || 0;
        custRev[o.customerName] = (custRev[o.customerName] || 0) + amt;
        if (o.cityName) cityRev[o.cityName] = (cityRev[o.cityName] || 0) + amt;
        if (o.salesMan) salesmanRev[o.salesMan] = (salesmanRev[o.salesMan] || 0) + amt;
        if (o.broker) brokerRev[o.broker] = (brokerRev[o.broker] || 0) + amt;
        if (o.productCode) prodRev[o.productCode] = (prodRev[o.productCode] || 0) + amt;
        
        totalOrderPcs += (o.orderPcs || 0);
        totalDispPcs += (o.dispPcs || 0);
        
        if (o.overDueDays > maxOverdueDays) {
          maxOverdueDays = o.overDueDays;
          maxOverdueCust = o.customerName;
        }
        
        const pendAmt = (o.balPcs || 0) * (o.rate || 0);
        pendingVals[o.customerName] = (pendingVals[o.customerName] || 0) + pendAmt;
      });

      const topCust = Object.entries(custRev).sort((a,b) => b[1] - a[1])[0]?.[0];
      const topCity = Object.entries(cityRev).sort((a,b) => b[1] - a[1])[0]?.[0];
      const topSalesman = Object.entries(salesmanRev).sort((a,b) => b[1] - a[1])[0]?.[0];
      const topBroker = Object.entries(brokerRev).sort((a,b) => b[1] - a[1])[0]?.[0];
      const topProd = Object.entries(prodRev).sort((a,b) => b[1] - a[1])[0]?.[0];
      const highestPendingCust = Object.entries(pendingVals).sort((a,b) => b[1] - a[1])[0]?.[0];

      if (topCust) {
        insights.push({
          id: 'insight_top_cust',
          title: 'Highest Performing Customer',
          description: `Customer "${topCust}" generated maximum revenue of ₹${(custRev[topCust]/100000).toFixed(2)}L.`,
          type: 'success'
        });
      }
      if (topProd) {
        insights.push({
          id: 'insight_top_prod',
          title: 'Max Revenue Product',
          description: `Product SKU "${topProd}" is generating maximum revenue of ₹${(prodRev[topProd]/100000).toFixed(2)}L.`,
          type: 'success'
        });
      }
      if (topCity) {
        insights.push({
          id: 'insight_top_city',
          title: 'Top Performing Territory',
          description: `Territory "${topCity}" leads geographic sales with ₹${(cityRev[topCity]/100000).toFixed(2)}L revenue.`,
          type: 'info'
        });
      }
      if (topSalesman) {
        insights.push({
          id: 'insight_top_salesman',
          title: 'Top Sales Leader',
          description: `Salesperson "${topSalesman}" is the leading performer with ₹${(salesmanRev[topSalesman]/100000).toFixed(2)}L closed volume.`,
          type: 'success'
        });
      }
      if (topBroker) {
        insights.push({
          id: 'insight_top_broker',
          title: 'Highest Performing Broker',
          description: `Broker partner "${topBroker}" facilitated the maximum sales volume of ₹${(brokerRev[topBroker]/100000).toFixed(2)}L.`,
          type: 'info'
        });
      }
      if (maxOverdueCust && maxOverdueDays > 0) {
        insights.push({
          id: 'insight_overdue_cust',
          title: 'Critical Overdue Alert',
          description: `Customer "${maxOverdueCust}" has the longest overdue order aging ${maxOverdueDays} days. Immediate follow-up required.`,
          type: 'warning'
        });
      }
      if (highestPendingCust && pendingVals[highestPendingCust] > 0) {
        insights.push({
          id: 'insight_pending_cust',
          title: 'Highest Outstanding Balances',
          description: `Customer "${highestPendingCust}" has the highest outstanding balance of ₹${(pendingVals[highestPendingCust]/100000).toFixed(2)}L awaiting dispatch/collection.`,
          type: 'warning'
        });
      }
      if (totalOrderPcs > 0) {
        const rate = (totalDispPcs / totalOrderPcs) * 100;
        insights.push({
          id: 'insight_dispatch_rate',
          title: 'Dispatch Efficiency Analysis',
          description: `Your overall order dispatch success rate is at ${rate.toFixed(1)}%. Track balance pieces to optimize order-to-cash lifecycle.`,
          type: rate > 80 ? 'success' : 'warning'
        });
      }
    }

    set({ aiInsights: insights });
  }
}));
