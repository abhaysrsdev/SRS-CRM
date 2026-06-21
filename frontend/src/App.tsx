import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { CustomerLists } from './pages/CustomerLists';
import { Reminders } from './pages/Reminders';
import { InventoryInsights } from './pages/InventoryInsights';
import { DataHub } from './pages/DataHub';
import { Interactions } from './pages/Interactions';
import { MapView } from './pages/MapView';
import { AddLead } from './pages/AddLead';
import { Help } from './pages/Help';
import { SystemGuide } from './pages/SystemGuide';
import { Forecasting } from './pages/Forecasting';
import { CatalogBuilder } from './pages/CatalogBuilder';
import { TagAdmin } from './pages/TagAdmin';
import { SalesOrders } from './pages/SalesOrders';
import { SalesIntelligence } from './pages/SalesIntelligence';
import { ControlCenter } from './pages/ControlCenter';
import { MasterDataCenter } from './pages/MasterDataCenter';
import { Catalog } from './pages/Catalog';
import { CatalogSyncCenter } from './pages/CatalogSyncCenter';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/crm-lists" element={<CustomerLists />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/inventory" element={<InventoryInsights />} />
        <Route path="/sales-orders" element={<SalesOrders />} />
        <Route path="/intelligence" element={<SalesIntelligence />} />
        <Route path="/control-center" element={<ControlCenter />} />
        <Route path="/master-data" element={<MasterDataCenter />} />
        <Route path="/data-hub" element={<DataHub />} />

        <Route path="/interactions" element={<Interactions />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/add-lead" element={<AddLead />} />
        <Route path="/help" element={<Help />} />
        <Route path="/guide" element={<SystemGuide />} />
        <Route path="/forecast" element={<Forecasting />} />
        <Route path="/catalog" element={<CatalogBuilder />} />
        <Route path="/drive-catalog" element={<Catalog />} />
        <Route path="/catalog/sync" element={<CatalogSyncCenter />} />
        <Route path="/tags" element={<TagAdmin />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
