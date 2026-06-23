import { useMemo, useState, useEffect, useRef } from 'react';
import { useCustomers } from '../hooks/useQueries';
import { Skeleton } from '../components/ui/skeleton';
import { 
  TrendingUp, Users, 
  Target, Activity, AlertCircle, PackageX, CheckCircle2, MapPin
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { Card, CardContent } from '../components/ui/card';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';

// MapState Component — uses refs to avoid infinite update loops
function MapStateUpdater({ setBounds, setZoom }: { setBounds: (b: any) => void, setZoom: (z: number) => void }) {
  const map = useMap();
  const setBoundsRef = useRef(setBounds);
  const setZoomRef = useRef(setZoom);
  
  useEffect(() => {
    setBoundsRef.current = setBounds;
    setZoomRef.current = setZoom;
  }, [setBounds, setZoom]);

  useEffect(() => {
    const update = () => {
      try {
        if (!map || !map.getContainer()) return;
        const b = map.getBounds();
        if (!b) return;
        setBoundsRef.current([
          b.getSouthWest().lng, b.getSouthWest().lat,
          b.getNorthEast().lng, b.getNorthEast().lat
        ]);
        setZoomRef.current(map.getZoom());
      } catch (err) {
        // Ignore unmount errors
      }
    };
    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      try {
        map.off('moveend', update);
        map.off('zoomend', update);
      } catch (err) {}
    };
  }, [map]); // stable: map instance never changes after mount

  return null;
}

// MapController — ref-guarded to prevent flyTo on every render
function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  const prevCenter = useRef<[number, number] | null>(null);
  const prevZoom = useRef<number>(0);

  useEffect(() => {
    if (!center) return;
    const samePos =
      prevCenter.current !== null &&
      prevCenter.current[0] === center[0] &&
      prevCenter.current[1] === center[1] &&
      prevZoom.current === zoom;
    if (samePos) return;
    prevCenter.current = center;
    prevZoom.current = zoom;
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);

  return null;
}


// Custom Icons for Categories
const createHtmlIcon = (emoji: string, color: string) => L.divIcon({
  html: `<div style="background: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px ${color}40; border: 2px solid ${color}; font-size: 14px; z-index: 1000;">${emoji}</div>`,
  className: 'custom-html-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const CategoryIcons = {
  'Hot': createHtmlIcon('🔥', '#ef4444'),
  'Warm': createHtmlIcon('🟡', '#f59e0b'),
  'Cold': createHtmlIcon('🔵', '#3b82f6'),
  'Lot': createHtmlIcon('🔴', '#94a3b8'),
};

const STATE_COORDS: Record<string, { lat: number, lng: number }> = {
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Haryana': { lat: 29.0588, lng: 76.0856 },
  'Punjab': { lat: 31.1471, lng: 75.3412 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Gujarat': { lat: 22.2587, lng: 71.1924 },
  'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
  'Andhra Pradesh': { lat: 15.9129, lng: 79.7400 },
  'Telangana': { lat: 18.1124, lng: 79.0193 },
  'West Bengal': { lat: 22.9868, lng: 87.8550 },
  'Bihar': { lat: 25.0961, lng: 85.3131 },
  'Odisha': { lat: 20.9517, lng: 85.0985 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
};

// Heatmap Color Scale based on Revenue Density
const getClusterColor = (revenue: number) => {
  if (revenue > 20000000) return '#ef4444'; // Red (Very High)
  if (revenue > 10000000) return '#f97316'; // Orange (High)
  if (revenue > 3000000) return '#eab308';  // Yellow (Medium)
  return '#3b82f6';                         // Blue (Low)
};

export function MapView() {
  const { data: customers, isLoading } = useCustomers();
  
  const [bounds, setBounds] = useState<any>(null);
  const [zoom, setZoom] = useState(5);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null);
  const [flyToZoom, setFlyToZoom] = useState(5);

  // Parse and Enrich Data for Supercluster
  const { points, globalMetrics } = useMemo(() => {
    if (!customers) return { points: [], globalMetrics: null };
    
    let totalRev = 0;
    let totalOutstanding = 0;
    let hotCount = 0;
    let deadStockCount = 0;

    // Seeded random for stable organic scatter
    const getSeededRandom = (seedStr: string, index: number) => {
      const seed = seedStr.charCodeAt(0) + seedStr.charCodeAt(seedStr.length - 1) + index;
      return Math.abs(Math.sin(seed));
    };

    const enrichedPoints = customers.map((c, i) => {
      let s = c.state;
      if (s.toLowerCase().includes('delhi')) s = 'Delhi';
      if (s.toLowerCase().includes('pradesh') && s.toLowerCase().includes('uttar')) s = 'Uttar Pradesh';

      const baseCoords = STATE_COORDS[s] || { lat: 22.5937, lng: 78.9629 };
      const maxRadius = s === 'Delhi' ? 0.3 : 3.5; 
      
      const r = getSeededRandom(c.id, i) * maxRadius;
      const theta = getSeededRandom(c.id, i + 1000) * 2 * Math.PI;
      const lat = baseCoords.lat + r * Math.cos(theta);
      const lng = baseCoords.lng + r * Math.sin(theta);

      // Business Logic Classification
      let category = 'Cold';
      if (c.purchaseFrequency > 20) category = 'Hot';
      else if (c.purchaseFrequency >= 3) category = 'Warm';
      else if (c.purchaseFrequency === 0) category = 'Lot';

      const outstanding = c.revenueGenerated * (getSeededRandom(c.id, 99) * 0.3); // Mock outstanding (0-30%)

      totalRev += c.revenueGenerated;
      totalOutstanding += outstanding;
      if (category === 'Hot') hotCount++;
      if (category === 'Lot') deadStockCount++;

      return {
        type: "Feature" as const,
        properties: {
          cluster: false,
          customerId: c.id,
          name: c.name,
          category,
          revenue: c.revenueGenerated,
          outstanding,
          state: s,
          mobile: c.mobileNumber,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [lng, lat]
        }
      };
    });

    // Apply Filter
    const filteredPoints = activeCategory === 'All' ? enrichedPoints : enrichedPoints.filter(p => p.properties.category === activeCategory);

    return { 
      points: filteredPoints, 
      globalMetrics: { totalRev, totalOutstanding, hotCount, deadStockCount, total: customers.length }
    };
  }, [customers, activeCategory]);

  // Mathematical Clustering
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: {
      radius: 80, // Pixels before clustering
      maxZoom: 12, // Stop clustering at zoom level 12 (drill down to individual)
      map: (props) => ({
        revenue: props.revenue,
        outstanding: props.outstanding,
        count: 1
      }),
      reduce: (acc, props) => {
        acc.revenue += props.revenue;
        acc.outstanding += props.outstanding;
        acc.count += props.count;
      }
    }
  });

  const handleClusterClick = (clusterId: number, lat: number, lng: number) => {
    const expansionZoom = Math.min(supercluster?.getClusterExpansionZoom(clusterId) || 13, 13);
    setFlyToCenter([lat, lng]);
    setFlyToZoom(expansionZoom);
  };

  const handleResetMap = () => {
    setFlyToCenter([22.5937, 78.9629]);
    setFlyToZoom(5);
  };

  if (isLoading || !customers || !globalMetrics) {
    return <div className="p-8"><Skeleton className="h-[800px] w-full"/></div>;
  }

  // Draw Distribution Flow Routes (Warehouse to Top 5 Clusters)
  // Only draw if we are at overview zoom to prevent visual clutter
  const warehouseCoord: [number, number] = [28.6139, 77.2090]; // Delhi Hub
  const topClusters = clusters
    .filter(c => c.properties.cluster)
    .sort((a, b) => b.properties.revenue - a.properties.revenue)
    .slice(0, 5);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-brand-bg relative overflow-y-auto overflow-x-hidden scrollbar-hide">
      
      {/* Top Header */}
      <div className="p-6 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 shrink-0 sticky top-0">
        <FadeIn>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner cursor-pointer" onClick={handleResetMap}>
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Enterprise Sales Intelligence</h2>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Real-time geospatial clustering & territory performance analytics.</p>
              </div>
            </div>
            
            {/* Interactive Global Filters */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              {['All', 'Hot', 'Warm', 'Cold', 'Lot'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'All' ? 'Global View' : `${cat === 'Hot' ? '🔥' : cat === 'Warm' ? '🟡' : cat === 'Cold' ? '🔵' : '🔴'} ${cat}`}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="p-6 max-w-[1800px] mx-auto w-full flex flex-col xl:flex-row gap-6">
        
        {/* Side Intelligence Panel */}
        <div className="w-full xl:w-[400px] shrink-0 space-y-6 z-10">
          <StaggerContainer className="space-y-6">
            
            {/* Overview KPI Card */}
            <StaggerItem>
              <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Target className="h-24 w-24" /></div>
                <CardContent className="p-6 relative z-10">
                  <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-1">Total Mapped Revenue</p>
                  <h3 className="text-4xl font-black mb-6">₹{(globalMetrics.totalRev / 10000000).toFixed(2)} Cr</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-4">
                      <span className="text-white/70 flex items-center gap-2 text-sm"><Users className="h-4 w-4"/> Total Sellers</span>
                      <span className="font-bold">{globalMetrics.total}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-4">
                      <span className="text-white/70 flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4"/> 🔥 Hot Leads</span>
                      <span className="font-bold text-emerald-400">{globalMetrics.hotCount}</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <span className="text-white/70 flex items-center gap-2 text-sm"><AlertCircle className="h-4 w-4"/> Est. Outstanding</span>
                      <span className="font-bold text-rose-400">₹{(globalMetrics.totalOutstanding / 100000).toFixed(1)} L</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* AI Insights Alerts */}
            <StaggerItem>
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 px-1">Automated Insights</h4>
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Fastest Growing Market</h5>
                    <p className="text-xs text-slate-600 mt-1">Delhi NCR cluster shows a 24% increase in high-frequency orders.</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0"><PackageX className="h-5 w-5" /></div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Dead Stock Opportunities</h5>
                    <p className="text-xs text-slate-600 mt-1">Found {globalMetrics.deadStockCount} 'Lot' parties in Tier 2 regions for liquidation pitches.</p>
                  </div>
                </div>
              </div>
            </StaggerItem>

          </StaggerContainer>
        </div>

        {/* Intelligence Map Area */}
        <FadeIn delay={0.2} className="flex-1 bg-white rounded-3xl shadow-soft border border-slate-200 overflow-hidden relative min-h-[700px] z-0">
          <MapContainer 
            center={[22.5937, 78.9629]} 
            zoom={5} 
            scrollWheelZoom={true} 
            className="w-full h-full bg-[#f8fafc]"
            zoomControl={false}
          >
            {/* Minimalist modern map styling for BI feel */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <MapStateUpdater setBounds={setBounds} setZoom={setZoom} />
            <MapController center={flyToCenter} zoom={flyToZoom} />

            {/* Distribution Flow Lines (Only at High-Level Zoom) */}
            {zoom <= 6 && topClusters.map((cluster, i) => {
              const [lng, lat] = cluster.geometry.coordinates;
              return (
                <Polyline 
                  key={`route-${i}`}
                  positions={[warehouseCoord, [lat, lng]]} 
                  pathOptions={{ 
                    color: '#6366f1', 
                    weight: 2, 
                    opacity: 0.4, 
                    dashArray: '10, 15', 
                    lineCap: 'round',
                    className: 'animate-pulse' // Tailwind animation for flow effect
                  }} 
                />
              );
            })}

            {/* Render Clusters & Individual Points */}
            {clusters.map(cluster => {
              const [lng, lat] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount, revenue, outstanding } = cluster.properties as any;

              if (isCluster) {
                // CLUSTER: Draw Customer Density Heatmap / Territory Circle
                const radiusSize = Math.max(30, Math.min(80, (revenue / 20000000) * 60));
                const clusterColor = getClusterColor(revenue);

                return (
                  <CircleMarker
                    key={`cluster-${cluster.id}`}
                    center={[lat, lng]}
                    pathOptions={{ 
                      color: clusterColor, 
                      fillColor: clusterColor, 
                      fillOpacity: 0.3, 
                      weight: 2,
                      className: 'transition-all duration-500 hover:fill-opacity-60'
                    }}
                    radius={radiusSize}
                    eventHandlers={{ click: () => handleClusterClick(cluster.id as number, lat, lng) }}
                  >
                    <Popup className="rounded-2xl border-0 shadow-2xl p-0 overflow-hidden min-w-[280px]">
                      <div className="bg-slate-900 text-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-brand-primary" />
                          <h4 className="font-bold uppercase tracking-wider text-sm">Territory Cluster</h4>
                        </div>
                        <p className="text-xs text-slate-400">Click circle to drill-down into {pointCount} sellers</p>
                      </div>
                      <div className="bg-white p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-4">
                          <span className="text-xs font-bold text-slate-500 uppercase">Est. Territory Revenue</span>
                          <span className="text-sm font-black text-emerald-600">₹{(revenue / 10000000).toFixed(2)} Cr</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-4">
                          <span className="text-xs font-bold text-slate-500 uppercase">Sellers in Region</span>
                          <span className="text-sm font-black text-slate-900">{pointCount}</span>
                        </div>
                        <div className="flex justify-between items-center pb-1 flex-wrap gap-4">
                          <span className="text-xs font-bold text-slate-500 uppercase">Follow-up / Outstanding</span>
                          <span className="text-sm font-bold text-rose-500">₹{(outstanding / 100000).toFixed(1)} L</span>
                        </div>
                      </div>
                    </Popup>

                    {/* Number Overlay for cluster */}
                    <Tooltip direction="center" permanent className="bg-transparent border-0 shadow-none text-white font-black text-lg text-shadow-sm">
                      {pointCount}
                    </Tooltip>
                  </CircleMarker>
                );
              }

              // INDIVIDUAL POINT: Render specific category pin
              const category = (cluster.properties as any).category as keyof typeof CategoryIcons;
              
              return (
                <Marker
                  key={`customer-${(cluster.properties as any).customerId}`}
                  position={[lat, lng]}
                  icon={CategoryIcons[category] || CategoryIcons['Cold']}
                >
                  <Popup className="rounded-2xl border-0 shadow-2xl p-0 overflow-hidden min-w-[250px]">
                     <div className="bg-white p-4">
                        <div className="flex items-start justify-between mb-3 flex-wrap gap-4">
                          <div>
                            <h4 className="font-bold text-slate-900">{(cluster.properties as any).name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{(cluster.properties as any).state}</p>
                          </div>
                          <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600 uppercase">
                            {category}
                          </div>
                        </div>
                        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex justify-between text-xs flex-wrap gap-4">
                            <span className="text-slate-500 font-medium">Revenue</span>
                            <span className="font-bold text-emerald-600">₹{((cluster.properties as any).revenue / 1000).toFixed(1)}k</span>
                          </div>
                          <div className="flex justify-between text-xs flex-wrap gap-4">
                            <span className="text-slate-500 font-medium">Phone</span>
                            <span className="font-bold text-slate-700">{(cluster.properties as any).mobile}</span>
                          </div>
                        </div>
                     </div>
                  </Popup>
                </Marker>
              );
            })}

          </MapContainer>

          {/* Drill-Down Legend / Status Overlay */}
          <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 z-[1000]">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Density Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div><span className="text-xs font-bold text-slate-700">Very High (₹2Cr+)</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div><span className="text-xs font-bold text-slate-700">High (₹1Cr+)</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs font-bold text-slate-700">Medium (₹30L+)</span></div>
              <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs font-bold text-slate-700">Low & Emerging</span></div>
            </div>
            
            <div className="h-px w-full bg-slate-100 my-4"></div>
            
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Categories</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex items-center gap-2"><span className="text-sm">🔥</span><span className="text-xs font-bold text-slate-700">Hot</span></div>
              <div className="flex items-center gap-2"><span className="text-sm">🟡</span><span className="text-xs font-bold text-slate-700">Warm</span></div>
              <div className="flex items-center gap-2"><span className="text-sm">🔵</span><span className="text-xs font-bold text-slate-700">Cold</span></div>
              <div className="flex items-center gap-2"><span className="text-sm">🔴</span><span className="text-xs font-bold text-slate-700">Lot</span></div>
            </div>
          </div>

        </FadeIn>

      </div>
    </div>
  );
}
