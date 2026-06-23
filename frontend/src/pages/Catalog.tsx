/* eslint-disable */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Image as ImageIcon, CheckCircle, RefreshCw, Layers, LayoutGrid, AlertCircle, X, ChevronLeft, ChevronRight, XCircle, Package, Filter, Images, BookOpen, Tag, Copy } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../lib/api';

// ── Client-side image prefetch cache ────────────────────────────────────────
const _prefetchCache = new Map<number, CatalogImage[]>();  // folderId → images
const _prefetchInFlight = new Set<number>();               // currently fetching

const prefetchFolderImages = async (folderId: number) => {
  if (_prefetchCache.has(folderId) || _prefetchInFlight.has(folderId)) return;
  _prefetchInFlight.add(folderId);
  try {
    const res = await fetch(`${API_BASE_URL}/catalog/folders/${folderId}/images`);
    const data: CatalogImage[] = await res.json();
    _prefetchCache.set(folderId, data);
    // Kick off browser-level image preloads for first color's views
    const parsed = parseImagesStatic(data);
    const firstColor = parsed.aiPreviews[0]?.colorName || '';
    const firstKey = Object.keys(parsed.colorViews).find(k => k.toLowerCase() === firstColor.toLowerCase()) || Object.keys(parsed.colorViews)[0];
    const firstViews = firstKey ? parsed.colorViews[firstKey] : [];
    [...parsed.aiPreviews.slice(0, 3).map(p => p.image), ...firstViews.map(v => v.image)].forEach(img => {
      const id = new URLSearchParams(img.image_url.split('?')[1]).get('id');
      if (id) { const l = new Image(); l.src = `/catalog_thumbnails/${id}.webp`; }
    });
  } catch {}
  _prefetchInFlight.delete(folderId);
};

const extractDriveId = (url: string): string | null => {
  try { return new URL(url).searchParams.get('id'); } catch { return null; }
};

interface CatalogFolder {
  id: number;
  folder_name: string;
  drive_folder_id: string;
  image_count: number;
  thumbnail_url: string | null;
  last_sync: string | null;
}

interface CatalogImage {
  id: number;
  folder_id: number;
  image_name: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
}

const getColorHex = (name: string) => {
  if (!name) return '#cbd5e1';
  const n = name.toLowerCase();
  if (n.includes('teal')) return '#14b8a6';
  if (n.includes('royal blue')) return '#1d4ed8';
  if (n.includes('rama green')) return '#16a34a';
  if (n.includes('powder blue')) return '#bae6fd';
  if (n.includes('sky blue') || n.includes('sky')) return '#38bdf8';
  if (n.includes('blue')) return '#60a5fa';
  if (n.includes('pink')) return '#ec4899';
  if (n.includes('onion')) return '#f472b6';
  if (n.includes('peach')) return '#fb923c';
  if (n.includes('purple')) return '#a855f7';
  if (n.includes('lavender')) return '#c084fc';
  if (n.includes('red')) return '#f87171';
  if (n.includes('pista') || n.includes('mint')) return '#86efac';
  if (n.includes('green')) return '#4ade80';
  if (n.includes('mustard')) return '#ca8a04';
  if (n.includes('yellow')) return '#fbbf24';
  if (n.includes('gold')) return '#f59e0b';
  if (n.includes('white') || n.includes('cream') || n.includes('offwhite')) return '#f8fafc';
  if (n.includes('black')) return '#0f172a';
  if (n.includes('dark grey') || n.includes('dark gray')) return '#4b5563';
  if (n.includes('grey') || n.includes('gray') || n.includes('silver')) return '#94a3b8';
  if (n.includes('wine')) return '#9f1239';
  if (n.includes('maroon') || n.includes('mheroon')) return '#7f1d1d';
  if (n.includes('brown')) return '#92400e';
  const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Parse image structure from drive folder names
// Returns: { ai: {colorName: image}, colors: {colorName: {view: image}}, lc: image[] }
interface ParsedImages {
  aiPreviews: { colorName: string; image: CatalogImage }[];
  colorViews: Record<string, { viewName: string; image: CatalogImage }[]>;
  lookbook: CatalogImage[];
}

const _parseLogic = (images: CatalogImage[]): ParsedImages => {
  const aiPreviews: { colorName: string; image: CatalogImage }[] = [];
  const colorViews: Record<string, { viewName: string; image: CatalogImage }[]> = {};
  const lookbook: CatalogImage[] = [];
  images.forEach(img => {
    const name = img.image_name;
    if (name.includes('/')) {
      const parts = name.split('/');
      const folder = parts[0].trim().toLowerCase();
      const file = parts.slice(1).join('/').trim();
      if (folder === 'ai') aiPreviews.push({ colorName: file, image: img });
      else if (folder === 'lc') lookbook.push(img);
      else {
        if (!colorViews[folder]) colorViews[folder] = [];
        colorViews[folder].push({ viewName: file, image: img });
      }
    } else {
      lookbook.push(img);
    }
  });
  return { aiPreviews, colorViews, lookbook };
};

const parseImages = _parseLogic;
const parseImagesStatic = _parseLogic;

export function Catalog() {
  const [folders, setFolders] = useState<CatalogFolder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Modal & Gallery state
  const [selectedFolder, setSelectedFolder] = useState<CatalogFolder | null>(null);
  const [images, setImages] = useState<CatalogImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [activeColorKey, setActiveColorKey] = useState<string>('');
  const [activeViewIdx, setActiveViewIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'product' | 'lookbook'>('product');

  const [selectedTags, setSelectedTags] = useState<string[]>(['best seller']);
  const [customTagInput, setCustomTagInput] = useState('');

  const suggestionTags = ['trending', 'new arrival', 'clearance', 'premium', 'vip only'];
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFolders(true);
    fetchSyncStatus();
  }, [searchTerm]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.5 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) fetchFolders(false);
  }, [page]);

  const fetchFolders = async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    if (reset) { setPage(1); setFolders([]); }
    try {
      const skip = (currentPage - 1) * 20;
      let url = `${API_BASE_URL}/catalog/folders/?skip=${skip}&limit=20&sort_by=alphabetical`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.length < 20) setHasMore(false);
      else setHasMore(true);
      setFolders(prev => reset ? data : [...prev, ...data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/catalog/sync/status`);
      const data = await res.json();
      setSyncStatus(data);
    } catch (e) {}
  };

  const handleOpenFolder = async (folder: CatalogFolder) => {
    setSelectedFolder(folder);
    setActiveTab('product');
    if (folder.id % 3 === 0) setSelectedTags(['best seller', 'trending']);
    else if (folder.id % 2 === 0) setSelectedTags(['new arrival']);
    else setSelectedTags(['top customer']);

    // Use prefetched data if available (instant), otherwise fetch now
    const cached = _prefetchCache.get(folder.id);
    if (cached) {
      setImages(cached);
      const parsed = parseImages(cached);
      const firstColor = parsed.aiPreviews[0]?.colorName || Object.keys(parsed.colorViews)[0] || '';
      setActiveColorKey(firstColor);
      setActiveViewIdx(0);
      setLoadingImages(false);
    } else {
      setLoadingImages(true);
      try {
        const res = await fetch(`${API_BASE_URL}/catalog/folders/${folder.id}/images`);
        const data: CatalogImage[] = await res.json();
        _prefetchCache.set(folder.id, data);
        setImages(data);
        const parsed = parseImages(data);
        const firstColor = parsed.aiPreviews[0]?.colorName || Object.keys(parsed.colorViews)[0] || '';
        setActiveColorKey(firstColor);
        setActiveViewIdx(0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingImages(false);
      }
    }
  };

  // Prefetch on hover
  const handleCardHover = useCallback((folder: CatalogFolder) => {
    prefetchFolderImages(folder.id);
  }, []);

  const getImageUrl = (url: string, width: number = 800) => {
    if (!url) return '';
    const id = extractDriveId(url);
    if (id) return `/catalog_thumbnails/${id}.webp`;
    return url;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("WhatsApp Share Link Copied!");
    alert("Share text copied for WhatsApp!");
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) setSelectedTags([...selectedTags, tag]);
  };
  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };
  const handleCustomTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTagInput.trim()) { handleAddTag(customTagInput.trim()); setCustomTagInput(''); }
  };

  const parsedImages = React.useMemo(() => parseImages(images), [images]);
  const { aiPreviews, colorViews, lookbook } = parsedImages;

  // Resolve currently displayed image
  const activeColorLower = activeColorKey.toLowerCase();
  // Find the color view key that matches the active color (case-insensitive)
  const matchedColorViewKey = Object.keys(colorViews).find(k => k.toLowerCase() === activeColorLower) || Object.keys(colorViews)[0];
  const viewsForActiveColor = matchedColorViewKey ? colorViews[matchedColorViewKey] : [];
  
  // Find AI preview image for active color
  const aiPreviewForColor = aiPreviews.find(p => p.colorName.toLowerCase() === activeColorLower);
  
  // Current displayed image in product tab
  let currentProductImage: CatalogImage | undefined;
  if (viewsForActiveColor.length > 0) {
    currentProductImage = viewsForActiveColor[Math.min(activeViewIdx, viewsForActiveColor.length - 1)]?.image;
  } else if (aiPreviewForColor) {
    currentProductImage = aiPreviewForColor.image;
  }

  const handleColorSelect = (colorName: string) => {
    setActiveColorKey(colorName);
    setActiveViewIdx(0);
  };

  const handlePrevView = () => {
    if (viewsForActiveColor.length > 0) {
      setActiveViewIdx(i => (i - 1 + viewsForActiveColor.length) % viewsForActiveColor.length);
    }
  };
  const handleNextView = () => {
    if (viewsForActiveColor.length > 0) {
      setActiveViewIdx(i => (i + 1) % viewsForActiveColor.length);
    }
  };

  // For the grid card color dots — use AI previews or color view keys
  const getCardColors = (folder: CatalogFolder) => {
    // Use the already-parsed data if this folder is selected; otherwise return empty (dots shown from image_count)
    return [];
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto pb-16 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl shadow-inner border border-indigo-100">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Product Catalog</h2>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{folders.length} of {syncStatus?.total_folders || 287} designs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
            <Input
              placeholder="Search by design code..."
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-brand-primary h-10 w-full text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl text-xs font-bold border-slate-200 h-10 px-4 bg-white text-slate-600 shadow-sm">
            <Filter className="h-4 w-4 text-slate-500" /> Filters
          </Button>
        </div>
      </div>

      {/* Grid view of folders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {folders.map((folder, index) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            key={folder.id}
            onClick={() => handleOpenFolder(folder)}
            onMouseEnter={() => handleCardHover(folder)}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm cursor-pointer group flex flex-col h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden shrink-0">
              {folder.thumbnail_url ? (
                <img
                  src={getImageUrl(folder.thumbnail_url, 300)}
                  alt={folder.folder_name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Package className="h-10 w-10 mb-2" />
                </div>
              )}
              {folder.image_count > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                  +{folder.image_count}
                </div>
              )}
            </div>

            <div className="p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="font-black text-slate-900 text-sm truncate leading-none">
                    #{folder.folder_name}
                  </h4>
                </div>
                <div className="text-[10px] text-slate-400 font-medium mb-3">
                  SRS-{folder.folder_name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {folder.id % 3 === 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-extrabold rounded-full">best seller</span>}
                  {folder.id % 2 !== 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-extrabold rounded-full">top customer</span>}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Infinite Scroll Loader */}
      <div ref={loaderRef} className="h-12 flex items-center justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <RefreshCw className="h-4 w-4 animate-spin text-brand-primary" />
            Loading catalog...
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="font-black text-slate-900 text-xl leading-none mb-1">
                    #{selectedFolder.folder_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">SRS-{selectedFolder.folder_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tabs */}
                  <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mr-2">
                    <button
                      onClick={() => setActiveTab('product')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'product' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <Images className="h-3.5 w-3.5" /> Product
                    </button>
                    {lookbook.length > 0 && (
                      <button
                        onClick={() => setActiveTab('lookbook')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'lookbook' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Lookbook
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col md:flex-row gap-8 overflow-y-auto">

                {/* Left Side: Large Image with Navigation */}
                <div className="w-full md:w-[45%] shrink-0">
                  <div className="aspect-[4/5] bg-slate-50 rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm">
                    {loadingImages ? (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : activeTab === 'product' && currentProductImage ? (
                      <>
                        <img
                          key={currentProductImage.id}
                          src={getImageUrl(currentProductImage.image_url, 600)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Prev/Next navigation arrows for views */}
                        {viewsForActiveColor.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevView}
                              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-white transition-all"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleNextView}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-white transition-all"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            {/* View indicator dots */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                              {viewsForActiveColor.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setActiveViewIdx(i)}
                                  className={`h-1.5 rounded-full transition-all ${i === activeViewIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : activeTab === 'lookbook' && lookbook.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1 h-full overflow-y-auto p-1">
                        {lookbook.map((img, i) => (
                          <img
                            key={img.id}
                            src={getImageUrl(img.image_url, 600)}
                            alt={img.image_name}
                            className="w-full aspect-square object-cover rounded-lg"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                        No image available
                      </div>
                    )}
                  </div>

                  {/* View thumbnails strip */}
                  {activeTab === 'product' && viewsForActiveColor.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {viewsForActiveColor.map((view, i) => (
                        <button
                          key={view.image.id}
                          onClick={() => setActiveViewIdx(i)}
                          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeViewIdx ? 'border-brand-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={getImageUrl(view.image.image_url, 150)} alt={view.viewName} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side: Details & Actions */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Pricing Table */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 flex gap-8">
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Selling Price</div>
                      <div className="text-sm font-black text-slate-900">—</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MRP</div>
                      <div className="text-sm font-black text-slate-900">—</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GST</div>
                      <div className="text-sm font-black text-slate-900">5%</div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold rounded-full border border-emerald-100">
                      Active
                    </span>
                  </div>

                  {/* Color Selection */}
                  {aiPreviews.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400" /> {aiPreviews.length} {aiPreviews.length === 1 ? 'Color' : 'Colors'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiPreviews.map(({ colorName, image }) => {
                          const isSelected = colorName.toLowerCase() === activeColorKey.toLowerCase();
                          const colorHex = getColorHex(colorName);
                          return (
                            <button
                              key={colorName}
                              onClick={() => handleColorSelect(colorName)}
                              title={colorName}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${
                                isSelected
                                  ? 'border-brand-primary bg-blue-50 text-brand-primary shadow-sm'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`w-3 h-3 rounded-full shadow-sm border ${colorHex === '#f8fafc' ? 'border-slate-300' : 'border-black/10'}`}
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="text-[10px] font-black uppercase tracking-wide">
                                {colorName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* View Buttons (b, f, l, r, up, down) */}
                  {viewsForActiveColor.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs font-black text-slate-900 mb-3">Views</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewsForActiveColor.map((view, i) => {
                          const isSelected = i === activeViewIdx;
                          const label = view.viewName.toLowerCase() === 'b' ? 'Back'
                            : view.viewName.toLowerCase() === 'f' ? 'Front'
                            : view.viewName.toLowerCase() === 'l' ? 'Left'
                            : view.viewName.toLowerCase() === 'r' ? 'Right'
                            : view.viewName.toLowerCase() === 'up' ? 'Up'
                            : view.viewName.toLowerCase() === 'down' ? 'Down'
                            : view.viewName;
                          return (
                            <button
                              key={view.image.id}
                              onClick={() => setActiveViewIdx(i)}
                              className={`flex items-center justify-center px-4 py-1.5 rounded-xl border-2 transition-all text-[10px] font-black uppercase tracking-wide ${
                                isSelected
                                  ? 'border-brand-primary bg-brand-primary text-white shadow-md'
                                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CRM Tags */}
                  <div className="mb-auto">
                    <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-400" /> CRM Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedTags.map(tag => (
                        <div key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-amber-900">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {suggestionTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleAddTag(tag)}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 text-[10px] font-bold rounded-full transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleCustomTagSubmit} className="flex gap-2">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="Add custom tag..."
                        className="h-9 text-xs rounded-xl border-slate-200 flex-1 bg-slate-50"
                      />
                      <Button type="submit" className="h-9 px-4 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-secondary">
                        Add
                      </Button>
                    </form>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2">
                    <Button className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md">
                      Save Tags
                    </Button>
                    <Button
                      onClick={handleCopyLink}
                      className="w-full h-11 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-sm shadow-md shadow-[#10b981]/20 gap-2"
                    >
                      <Copy className="h-4 w-4" /> Copy for WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

