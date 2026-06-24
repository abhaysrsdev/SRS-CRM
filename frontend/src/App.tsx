import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/PageLoader';

// Lazy loaded routes for extreme performance optimization (Code Splitting)
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const CustomerLists = lazy(() => import('./pages/CustomerLists').then(module => ({ default: module.CustomerLists })));
const Reminders = lazy(() => import('./pages/Reminders').then(module => ({ default: module.Reminders })));
const InventoryInsights = lazy(() => import('./pages/InventoryInsights').then(module => ({ default: module.InventoryInsights })));
const DataHub = lazy(() => import('./pages/DataHub').then(module => ({ default: module.DataHub })));
const Interactions = lazy(() => import('./pages/Interactions').then(module => ({ default: module.Interactions })));
const MapView = lazy(() => import('./pages/MapView').then(module => ({ default: module.MapView })));
const AddLead = lazy(() => import('./pages/AddLead').then(module => ({ default: module.AddLead })));
const Help = lazy(() => import('./pages/Help').then(module => ({ default: module.Help })));
const SystemGuide = lazy(() => import('./pages/SystemGuide').then(module => ({ default: module.SystemGuide })));
const Forecasting = lazy(() => import('./pages/Forecasting').then(module => ({ default: module.Forecasting })));
const CatalogBuilder = lazy(() => import('./pages/CatalogBuilder').then(module => ({ default: module.CatalogBuilder })));
const TagAdmin = lazy(() => import('./pages/TagAdmin').then(module => ({ default: module.TagAdmin })));
const SalesOrders = lazy(() => import('./pages/SalesOrders').then(module => ({ default: module.SalesOrders })));
const SalesIntelligence = lazy(() => import('./pages/SalesIntelligence').then(module => ({ default: module.SalesIntelligence })));
const ControlCenter = lazy(() => import('./pages/ControlCenter').then(module => ({ default: module.ControlCenter })));
const MasterDataCenter = lazy(() => import('./pages/MasterDataCenter').then(module => ({ default: module.MasterDataCenter })));
const Catalog = lazy(() => import('./pages/Catalog').then(module => ({ default: module.Catalog })));
const CatalogSyncCenter = lazy(() => import('./pages/CatalogSyncCenter').then(module => ({ default: module.CatalogSyncCenter })));

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/crm-lists" element={<Suspense fallback={<PageLoader />}><CustomerLists /></Suspense>} />
        <Route path="/reminders" element={<Suspense fallback={<PageLoader />}><Reminders /></Suspense>} />
        <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><InventoryInsights /></Suspense>} />
        <Route path="/sales-orders" element={<Suspense fallback={<PageLoader />}><SalesOrders /></Suspense>} />
        <Route path="/intelligence" element={<Suspense fallback={<PageLoader />}><SalesIntelligence /></Suspense>} />
        <Route path="/control-center" element={<Suspense fallback={<PageLoader />}><ControlCenter /></Suspense>} />
        <Route path="/master-data" element={<Suspense fallback={<PageLoader />}><MasterDataCenter /></Suspense>} />
        <Route path="/data-hub" element={<Suspense fallback={<PageLoader />}><DataHub /></Suspense>} />

        <Route path="/interactions" element={<Suspense fallback={<PageLoader />}><Interactions /></Suspense>} />
        <Route path="/map" element={<Suspense fallback={<PageLoader />}><MapView /></Suspense>} />
        <Route path="/add-lead" element={<Suspense fallback={<PageLoader />}><AddLead /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={<PageLoader />}><Help /></Suspense>} />
        <Route path="/guide" element={<Suspense fallback={<PageLoader />}><SystemGuide /></Suspense>} />
        <Route path="/forecast" element={<Suspense fallback={<PageLoader />}><Forecasting /></Suspense>} />
        <Route path="/catalog" element={<Suspense fallback={<PageLoader />}><CatalogBuilder /></Suspense>} />
        <Route path="/drive-catalog" element={<Suspense fallback={<PageLoader />}><Catalog /></Suspense>} />
        <Route path="/catalog/sync" element={<Suspense fallback={<PageLoader />}><CatalogSyncCenter /></Suspense>} />
        <Route path="/tags" element={<Suspense fallback={<PageLoader />}><TagAdmin /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
      </Route>
    </Routes>
  );
}

export default App;
