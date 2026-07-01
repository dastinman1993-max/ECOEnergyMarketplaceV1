import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Tag, 
  ArrowUpDown, 
  ShoppingBag, 
  ShoppingCart,
  X, 
  Leaf, 
  Share2, 
  AlertCircle,
  HelpCircle,
  Info,
  Plus,
  QrCode
} from 'lucide-react';

import logoImg from './assets/images/eco_logo_final_1782897699183.jpg';

import { CatalogItem, Category, Subcategory, Region, District, TelegramLink, CartItem, Ad } from './types';
import { 
  fetchCategories, 
  fetchSubcategories, 
  fetchRegions, 
  fetchDistricts, 
  fetchTelegramLinks, 
  fetchCatalogItems,
  isSupabaseConfigured
} from './lib/supabase';
import { fetchActiveAds } from './lib/web3';

import EcoAdsBanner from './components/EcoAdsBanner';
import ProductCard from './components/ProductCard';
import LocationPage from './components/LocationPage';
import CartSidebar from './components/CartSidebar';

export default function App() {
  // Navigation & Router state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'location'>('home');
  const [routeParams, setRouteParams] = useState<{ regionSlug: string; districtSlug: string; localitySlug?: string } | null>(null);

  const initialSubcategoryRef = React.useRef<string | null>(null);

  // Core records lists
  const [loading, setLoading] = useState(true);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [allProducts, setAllProducts] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [telegramLinks, setTelegramLinks] = useState<TelegramLink[]>([]);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);

  // Filter selections
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'seller'>('newest');

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Reset pagination to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterSubcategory, filterRegion, filterDistrict, searchQuery, sortBy]);

  // Pre-interaction state (now always true so full catalog filters immediately)
  const [hasInteracted, setHasInteracted] = useState(true);

  // Cart Drawer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Informational Modals State
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // User details from Telegram
  const [telegramUser, setTelegramUser] = useState<{
    id: number;
    username?: string;
    first_name?: string;
    isMock?: boolean;
  }>({
    id: 999999,
    username: 'demo_eco_buyer',
    first_name: 'Гість Платформи',
    isMock: true,
  });

  // Parse and synchronize hash-based URLs
  useEffect(() => {
    function parseHashRoute() {
      const hash = window.location.hash || '';
      if (hash.startsWith('#location/')) {
        const parts = hash.replace('#location/', '').split('/');
        if (parts.length >= 2 && parts[0] && parts[1]) {
          setCurrentRoute('location');
          setRouteParams({
            regionSlug: parts[0],
            districtSlug: parts[1],
            localitySlug: parts[2] || undefined
          });
          return;
        }
      }
      setCurrentRoute('home');
      setRouteParams(null);
    }

    parseHashRoute();
    window.addEventListener('hashchange', parseHashRoute);
    return () => {
      window.removeEventListener('hashchange', parseHashRoute);
    };
  }, []);

  // Telegram environment initializer with dynamic loading to prevent Cross-Origin Script errors in standard iframes
  useEffect(() => {
    const isTelegramContext = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const ua = navigator.userAgent || '';
      return hash.includes('tgWebAppData') || 
             search.includes('tgWebAppData') || 
             hash.includes('tgWebAppVersion') || 
             search.includes('tgWebAppVersion') || 
             /Telegram/i.test(ua) || 
             (window as any).Telegram?.WebApp !== undefined;
    };

    if (isTelegramContext()) {
      const initTg = (tg: any) => {
        if (!tg) return;
        try {
          tg.ready();
          tg.expand();
          if (tg.initDataUnsafe?.user) {
            setTelegramUser({
              id: tg.initDataUnsafe.user.id,
              username: tg.initDataUnsafe.user.username,
              first_name: tg.initDataUnsafe.user.first_name,
              isMock: false,
            });
          }
          // Parse start_param from Telegram deep links
          // Format: cat-{categoryId} and optionally _sub-{subcategoryId}
          const startParam = tg.initDataUnsafe?.start_param;
          if (startParam) {
            const parts = startParam.split('_');
            for (const part of parts) {
              if (part.startsWith('cat-')) {
                setFilterCategory(part.slice(4));
              } else if (part.startsWith('sub-')) {
                const subId = part.slice(4);
                initialSubcategoryRef.current = subId;
                setFilterSubcategory(subId);
              }
            }
          }
        } catch (e) {
          console.warn('Error inside Telegram WebApp initialization:', e);
        }
      };

      if (!(window as any).Telegram?.WebApp) {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = () => {
          const tg = (window as any).Telegram?.WebApp;
          initTg(tg);
        };
        script.onerror = () => {
          console.warn('Telegram WebApp SDK failed to load asynchronously.');
        };
        document.head.appendChild(script);
      } else {
        const tg = (window as any).Telegram?.WebApp;
        initTg(tg);
      }
    }
  }, []);

  // Load baseline directories and products
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      
      const configState = isSupabaseConfigured();
      setDbConfigured(configState);

      try {
        const [
          cats,
          allRegions,
          tgLinks,
          ads,
          productsList,
        ] = await Promise.all([
          fetchCategories(),
          fetchRegions(),
          fetchTelegramLinks(),
          fetchActiveAds(),
          fetchCatalogItems(),
        ]);

        setCategories(cats);
        setRegions(allRegions);
        setTelegramLinks(tgLinks);
        setActiveAds(ads);
        setAllProducts(productsList);

        // Fetch subcategories for first categories loads
        const subs = await fetchSubcategories();
        setSubcategories(subs);

        // Fetch districts
        const dists = await fetchDistricts();
        setDistricts(dists);

      } catch (err) {
        console.error('Failure initializing marketplace data stream:', err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Fetch subcategories Reactively when Category filter updates
  useEffect(() => {
    async function loadCascadedSubs() {
      const selectedCatId = filterCategory === 'all' ? undefined : filterCategory;
      const filteredSubs = await fetchSubcategories(selectedCatId);
      setSubcategories(filteredSubs);
      if (initialSubcategoryRef.current) {
        setFilterSubcategory(initialSubcategoryRef.current);
        initialSubcategoryRef.current = null;
      } else {
        setFilterSubcategory('all'); // Reset subcategory when category changes
      }
    }
    loadCascadedSubs();
  }, [filterCategory]);

  // Fetch districts Reactively when Region filter updates
  useEffect(() => {
    async function loadCascadedDistricts() {
      const selectedRegId = filterRegion === 'all' ? undefined : filterRegion;
      const filteredDists = await fetchDistricts(selectedRegId);
      setDistricts(filteredDists);
      setFilterDistrict('all'); // Reset district when region changes
    }
    loadCascadedDistricts();
  }, [filterRegion]);

  // Handle triggering interaction state to transition from Promotional filter view to complete Catalog
  const triggerInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Cart operations
  const handleAddToCart = (product: CatalogItem) => {
    // Show short alert/vibe feedback
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.item.id === product.id);
      if (existing) {
        return prev.map((i) => (i.item.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { item: product, quantity: 1 }];
    });
    
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item.id === productId) {
            const newQty = i.quantity + delta;
            return { ...i, quantity: newQty };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const navigateToLocation = (regionSlug: string, districtSlug: string, localitySlug?: string) => {
    triggerInteraction();
    if (localitySlug) {
      window.location.hash = `location/${regionSlug}/${districtSlug}/${localitySlug}`;
    } else {
      window.location.hash = `location/${regionSlug}/${districtSlug}`;
    }
  };

  // Calculate displayed catalog items
  const getVisibleProducts = (): { items: CatalogItem[]; totalPages: number; total: number } => {
    let items = [...allProducts];

    // Filter active items of verified sellers only inside Supabase module,
    // but we reinforce verified filter here just in case!
    const verifiedSellersMap = telegramLinks.map((v) => (v.wallet_address || '').toLowerCase());
    items = items.filter((item) => item.active && verifiedSellersMap.includes(item.wallet_address.toLowerCase()));

    // Stage 1: Pre-interaction state checking
    // Show only products belonging to ECO_ADS advertisers initially, unless user acted or no ads are defined
    const advertiserAddresses = activeAds.map((ad) => ad.advertiser.toLowerCase());
    const hasAdvertisersInCatalog = items.some((item) => advertiserAddresses.includes(item.wallet_address.toLowerCase()));

    if (!hasInteracted && advertiserAddresses.length > 0 && hasAdvertisersInCatalog) {
      items = items.filter((item) => advertiserAddresses.includes(item.wallet_address.toLowerCase()));
      // Sort by creation date DESC
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      // Stage 2: User-interacted catalog filtering
      // Text query (now triggers on 1+ characters for instant feedback and checks both name and description)
      if (searchQuery.trim().length >= 1) {
        const q = searchQuery.toLowerCase().trim();
        items = items.filter((item) => 
          item.name.toLowerCase().includes(q) || 
          (item.description && item.description.toLowerCase().includes(q))
        );
      }

      // Category
      if (filterCategory !== 'all') {
        items = items.filter((item) => item.category_id?.toString() === filterCategory.toString());
      }

      // Subcategory
      if (filterSubcategory !== 'all') {
        items = items.filter((item) => item.subcategory_id?.toString() === filterSubcategory.toString());
      }

      // Region
      if (filterRegion !== 'all') {
        items = items.filter((item) => item.region_id?.toString() === filterRegion.toString());
      }

      // District
      if (filterDistrict !== 'all') {
        items = items.filter((item) => item.district_id?.toString() === filterDistrict.toString());
      }

      // Sort processing
      if (sortBy === 'newest') {
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'price_asc') {
        items.sort((a, b) => a.price_uah - b.price_uah);
      } else if (sortBy === 'price_desc') {
        items.sort((a, b) => b.price_uah - a.price_uah);
      } else if (sortBy === 'seller') {
        const sellerNicknames: Record<string, string> = {};
        telegramLinks.forEach((link) => {
          if (link.wallet_address) {
            const username = link.telegram_username || '';
            sellerNicknames[link.wallet_address.toLowerCase()] = username;
            sellerNicknames[link.wallet_address] = username;
          }
        });
        items.sort((a, b) => {
          const nickA = sellerNicknames[a.wallet_address.toLowerCase()] || sellerNicknames[a.wallet_address] || a.wallet_address;
          const nickB = sellerNicknames[b.wallet_address.toLowerCase()] || sellerNicknames[b.wallet_address] || b.wallet_address;
          return nickA.localeCompare(nickB, 'uk');
        });
      }
    }

    const result = items;
    const totalPages = Math.ceil(result.length / PAGE_SIZE);
    const paginated = result.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    return { items: paginated, totalPages, total: result.length };
  };

  const handleAddProductClick = () => {
    const botUrl = 'https://t.me/EcoEnergyMarketplace_bot';
    const tg = (window as any).Telegram?.WebApp;
    if (tg && typeof tg.openTelegramLink === 'function') {
      tg.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const visibleProductsData = getVisibleProducts();
  const displayedProducts = visibleProductsData.items;
  const totalPages = visibleProductsData.totalPages;
  const total = visibleProductsData.total;
  const selectedReg = filterRegion !== 'all' ? regions.find(r => r.id?.toString() === filterRegion?.toString()) : undefined;
  const selectedDist = filterDistrict !== 'all' ? districts.find(d => d.id?.toString() === filterDistrict?.toString()) : undefined;

  return (
    <div id="app-root-shell" className="min-h-screen bg-[#F7F5F0] text-[#2D2D2D] font-sans selection:bg-[#4A7C59]/20 flex flex-col justify-between">
      
      {/* Header banner informing seller of database mode */}
      {!dbConfigured && (
        <div id="mock-data-bar" className="bg-[#E6A817]/10 text-[#E6A817] text-[11px] font-semibold py-2 px-4 border-b border-[#E6A817]/20 flex items-center justify-between text-center max-w-full">
          <div className="flex items-center gap-2 mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Застосунок запущено у демо-режимі (локальні дані). Введіть ваші Supabase Credentials в налаштуваннях для активації живої бази!</span>
          </div>
        </div>
      )}



      {/* Main App Bar / Navigation */}
      <header id="main-navigation-bar" className="sticky top-0 z-40 bg-gradient-to-r from-[#E3DCD0] via-white via-50% to-[#E3DCD0] border-b border-[#E8DFD0] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0">
            <img 
              src={logoImg} 
              alt="EcoMessenger Logo" 
              className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white/80 hover:scale-105 transition-transform" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <h1 className="font-sans font-black text-sm tracking-tight text-[#2D2D2D]">
                EcoMessenger
              </h1>
              <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-gray-400 -mt-1">
                Marketplace
              </p>
            </div>
          </a>

          {/* Terms & Privacy Widget (Centered) */}
          <div className="flex items-center gap-1.5 bg-[#E8DFD0]/30 border border-[#E8DFD0]/60 px-2.5 py-1 rounded-xl text-[10px] sm:text-xs text-[#2D2D2D]/80 shrink-0 font-bold select-none mx-auto sm:mx-0">
            <button
              id="header-terms-btn"
              onClick={() => setIsTermsOpen(true)}
              className="hover:text-[#4A7C59] transition-colors cursor-pointer"
            >
              Умови
            </button>
            <span className="text-[#4A7C59]/30 font-light">|</span>
            <button
              id="header-privacy-btn"
              onClick={() => setIsPrivacyOpen(true)}
              className="hover:text-[#4A7C59] transition-colors cursor-pointer"
            >
              Конфіденційність
            </button>
          </div>

          {/* Actions & Basket floating badge */}
          <div className="flex items-center shrink-0">
            <button
              id="header-cart-toggle"
              onClick={() => setIsCartOpen(true)}
              className={`relative p-3 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-center border ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 text-white border-amber-400 shadow-md shadow-emerald-600/20 scale-105 active:scale-95'
                  : 'bg-white hover:bg-emerald-50 text-[#4A7C59] border-[#4A7C59]/30 hover:border-[#4A7C59] shadow-xs active:scale-95'
              }`}
              title="Переглянути кошик"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[10px] min-w-5 h-5 rounded-full flex items-center justify-center px-1.5 shadow-md border-2 border-white animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Polygon ECO_ADS Ad space */}
      <EcoAdsBanner telegramLinks={telegramLinks} />

      {/* Page Body Router */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentRoute === 'location' && routeParams ? (
            <motion.div
              key={`location-${routeParams.regionSlug}-${routeParams.districtSlug}-${routeParams.localitySlug || ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <LocationPage
                regionSlug={routeParams.regionSlug}
                districtSlug={routeParams.districtSlug}
                localitySlug={routeParams.localitySlug}
                products={allProducts}
                regions={regions}
                districts={districts}
                telegramLinks={telegramLinks}
                onAddToCart={handleAddToCart}
                onBack={() => {
                  window.location.hash = '';
                }}
                onLocationClick={navigateToLocation}
              />
            </motion.div>
          ) : (
            <motion.div
              key="catalog-home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto px-4 py-6"
            >
              {/* Filters Box */}
              <div id="filter-wrapper-card" className="bg-white rounded-2xl border border-[#E8DFD0] p-4 md:p-5 shadow-xs mb-8 space-y-4">
                
                {/* Search query input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Пошук екологічних товарів..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      triggerInteraction();
                    }}
                    className="w-full bg-[#F7F5F0] border border-[#E8DFD0] px-3 py-3.5 pl-10 rounded-xl text-xs text-[#2D2D2D] outline-hidden placeholder:text-gray-400 focus:border-[#4A7C59] focus:bg-white transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      id="clear-search-query-btn"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 px-1.5 py-1 text-gray-400 hover:text-black hover:bg-gray-200 rounded-md transition-colors text-xs"
                      title="Очистити пошук"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Grid selection cascades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Category cascade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#4A7C59]" />
                      Категорія
                    </label>
                    <div className="relative">
                      <select
                        id="filter-category-select"
                        value={filterCategory}
                        onChange={(e) => {
                          setFilterCategory(e.target.value);
                          triggerInteraction();
                        }}
                        className="w-full appearance-none bg-[#F7F5F0] hover:bg-gray-100/50 border border-[#E8DFD0] rounded-xl px-3 py-2.5 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-all cursor-pointer font-medium"
                      >
                        <option value="all">Усі категорії</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name_uk}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subcategory cascade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#4A7C59]/60" />
                      Підкатегорія
                    </label>
                    <div className="relative">
                      <select
                        id="filter-subcategory-select"
                        value={filterSubcategory}
                        disabled={filterCategory === 'all'}
                        onChange={(e) => {
                          setFilterSubcategory(e.target.value);
                          triggerInteraction();
                        }}
                        className="w-full appearance-none bg-[#F7F5F0] hover:bg-gray-100/50 disabled:opacity-50 disabled:cursor-not-allowed border border-[#E8DFD0] rounded-xl px-3 py-2.5 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-all cursor-pointer font-medium"
                      >
                        <option value="all">Усі підкатегорії</option>
                        {subcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name_uk}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Region cascade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#4A7C59]" />
                      Область
                    </label>
                    <div className="relative">
                      <select
                        id="filter-region-select"
                        value={filterRegion}
                        onChange={(e) => {
                          setFilterRegion(e.target.value);
                          triggerInteraction();
                        }}
                        className="w-full appearance-none bg-[#F7F5F0] hover:bg-gray-100/50 border border-[#E8DFD0] rounded-xl px-3 py-2.5 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-all cursor-pointer font-medium"
                      >
                        <option value="all">Вся Україна</option>
                        {regions.map((reg) => (
                          <option key={reg.id} value={reg.id}>
                            {reg.name_uk}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* District cascade */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#4A7C59]/60" />
                      Район
                    </label>
                    <div className="relative">
                      <select
                        id="filter-district-select"
                        value={filterDistrict}
                        disabled={filterRegion === 'all'}
                        onChange={(e) => {
                          setFilterDistrict(e.target.value);
                          triggerInteraction();
                        }}
                        className="w-full appearance-none bg-[#F7F5F0] hover:bg-gray-100/50 disabled:opacity-50 disabled:cursor-not-allowed border border-[#E8DFD0] rounded-xl px-3 py-2.5 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-all cursor-pointer font-medium"
                      >
                        <option value="all">Усі райони</option>
                        {districts.map((dist) => (
                          <option key={dist.id} value={dist.id}>
                            {dist.name_uk}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Sorter block & interactive state stats */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E8DFD0]/60 text-xs">
                  
                  {/* Current Active items query count & QR Helper */}
                  <div className="flex flex-wrap items-center gap-3 text-gray-500 order-2 sm:order-1 self-start sm:self-center font-medium">
                    <div>
                      Показано: <span className="font-bold text-[#4A7C59]">{displayedProducts.length}</span> товарів 
                      {!hasInteracted && activeAds.length > 0 && (
                        <span className="text-[11px] bg-[#E8DFD0]/80 text-[#2D2D2D]/70 px-2 py-0.5 rounded-md ml-2 font-semibold">
                          (Активне промо ECO_ADS)
                        </span>
                      )}
                    </div>

                    {/* QR Code Action or Selection prompt */}
                    <div className="flex items-center">
                      {selectedReg && selectedDist ? (
                        <button
                          id="view-location-qr-btn"
                          onClick={() => navigateToLocation(selectedReg.slug, selectedDist.slug)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A7C59] hover:bg-[#3d664a] text-white text-[11px] font-bold rounded-lg shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                          title={`Показати QR-код для району ${selectedDist.name_uk}`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Переглянути локації</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                          📍 Оберіть область та район щоб знайти локальних виробників
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right sort parameters */}
                  <div className="w-full sm:w-auto flex items-center gap-3 order-1 sm:order-2 self-end sm:self-center justify-between sm:justify-end">
                    
                    {/* Catalog interactions button */}
                    {!hasInteracted && activeAds.length > 0 && (
                      <button
                        id="force-unlock-full-catalog-btn"
                        onClick={() => setHasInteracted(true)}
                        className="text-[11px] font-bold text-[#4A7C59] hover:underline transition-all"
                      >
                        Завантажити весь каталог
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        id="catalog-sort-select"
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as any);
                          triggerInteraction();
                        }}
                        className="appearance-none bg-[#F7F5F0] hover:bg-gray-100/50 border border-[#E8DFD0] rounded-xl px-2.5 py-1.5 text-[11px] text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-all cursor-pointer font-bold"
                      >
                        <option value="newest">Нові спочатку</option>
                        <option value="price_asc">Ціна: від найдешевших</option>
                        <option value="price_desc">Ціна: від найдорожчих</option>
                        <option value="seller">За продавцем (А→Я)</option>
                      </select>
                    </div>
                  </div>

                </div>

              </div>

              {/* Loader indicator while fetching background databases */}
              {loading ? (
                <div id="full-catalog-loading" className="text-center py-24 space-y-4">
                  <div className="w-8 h-8 rounded-full border-4 border-t-[#4A7C59] border-r-transparent border-b-[#4A7C59] border-l-transparent animate-spin mx-auto"></div>
                  <span className="text-xs font-mono font-bold text-[#2D2D2D]/40 block">Встановлення каналу зв’язку з еко-каталогом...</span>
                </div>
              ) : (
                <>
                  {/* Products Grid stage */}
                  {displayedProducts.length === 0 ? (
                    <div id="no-matching-goods-card" className="bg-white rounded-2xl border border-[#E8DFD0] p-12 text-center shadow-xs">
                      <X className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-sans font-bold text-sm text-[#2D2D2D]">Товарів за вашим запитом не знайдено</h3>
                      <p className="text-xs text-[#2D2D2D]/50 max-w-sm mx-auto mt-2 mb-6">
                        Спробуйте змінити критерії пошуку, скинути каскадні фільтри або розпочати пошук у сусідньому районі.
                      </p>
                      
                      <button
                        id="reset-filters-btn"
                        onClick={() => {
                          setFilterCategory('all');
                          setFilterSubcategory('all');
                          setFilterRegion('all');
                          setFilterDistrict('all');
                          setSearchQuery('');
                          setHasInteracted(true); // show all
                        }}
                        className="bg-[#4A7C59] hover:bg-[#3d664a] text-white py-2.5 px-5 rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-[0.98]"
                      >
                        Скинути всі фільтри
                      </button>
                    </div>
                  ) : (
                    <>
                      <div id="catalog-products-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedProducts.map((product) => {
                          // Find matching telegram link seller details
                          const sellerLink = telegramLinks.find(
                            (link) => link.wallet_address.toLowerCase() === product.wallet_address.toLowerCase()
                          );
                          
                          // Lookup Category/Region/District names
                          const rName = regions.find((r) => r.id === product.region_id)?.name_uk || 'Область';
                          const dName = districts.find((d) => d.id === product.district_id)?.name_uk || 'Район';
                          const rSlug = regions.find((r) => r.id === product.region_id)?.slug || 'not-found';
                          const dSlug = districts.find((d) => d.id === product.district_id)?.slug || 'not-found';

                          return (
                            <ProductCard
                              key={product.id}
                              product={product}
                              sellerUsername={sellerLink?.telegram_username || null}
                              regionName={rName}
                              districtName={dName}
                              regionSlug={rSlug}
                              districtSlug={dSlug}
                              onAddToCart={handleAddToCart}
                              onLocationClick={navigateToLocation}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-[#E8DFD0] text-xs font-bold disabled:opacity-40">← Назад</button>
                        <span className="text-xs text-[#2D2D2D]/60">
                          {currentPage} / {totalPages}  ({total} товарів)
                        </span>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-[#E8DFD0] text-xs font-bold disabled:opacity-40">Далі →</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Add Product CTA Button below cards */}
              <div className="mt-12 flex justify-center pb-6">
                <button
                  id="add-item-cta-btn"
                  onClick={handleAddProductClick}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-[#4A7C59] hover:bg-[#3d664a] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer max-w-md text-center justify-center w-full"
                  title="Щоб додати свій товар або послугу напишіть нам"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Щоб додати свій товар або послугу напишіть нам</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer Backing Modal Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <div id="cart-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full max-w-2xl bg-[#F7F5F0] shadow-2xl h-full flex flex-col z-10"
            >
              <CartSidebar
                cart={cart}
                telegramLinks={telegramLinks}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onClose={() => setIsCartOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms of Use Backing Modal Overlay */}
      <AnimatePresence>
        {isTermsOpen && (
          <div id="terms-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full max-w-lg bg-[#F7F5F0] shadow-2xl h-full flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-[#E8DFD0] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  <h3 className="font-sans font-bold text-base text-[#2D2D2D]">Умови використання</h3>
                </div>
                <button
                  id="close-terms-btn"
                  onClick={() => setIsTermsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                <div className="bg-white border border-[#E8DFD0] rounded-2xl p-5 md:p-6 shadow-xs leading-relaxed text-sm text-[#2D2D2D] space-y-4">
                  <p className="font-semibold text-[#4A7C59] text-base border-b border-[#E8DFD0] pb-2">
                    EcoMessenger Marketplace — Інформаційна платформа
                  </p>
                  <p className="font-medium">
                    EcoMessenger є інформаційним маркетплейсом. Усі угоди купівлі-продажу укладаються безпосередньо між покупцем і продавцем у Telegram.
                  </p>
                  <p>
                    Адміністрація платформи не є стороною угоди і не несе відповідальності за якість товарів, умови доставки та оплати. Покупець самостійно оцінює продавця перед покупкою.
                  </p>
                  <p className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 font-medium">
                    ⚠️ Зв'язок з підтримки — лише з питань скарг на продавців або розміщення товарів на платформі.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-[#E8DFD0] bg-white flex justify-end shrink-0">
                <button
                  id="confirm-terms-close-btn"
                  onClick={() => setIsTermsOpen(false)}
                  className="px-5 py-2.5 bg-[#4A7C59] hover:bg-[#3d664a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Зрозуміло
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Backing Modal Overlay */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div id="privacy-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* Sidebar drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full max-w-lg bg-[#F7F5F0] shadow-2xl h-full flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-[#E8DFD0] bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="font-sans font-bold text-base text-[#2D2D2D]">Політика конфіденційності</h3>
                </div>
                <button
                  id="close-privacy-btn"
                  onClick={() => setIsPrivacyOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
                <div className="bg-white border border-[#E8DFD0] rounded-2xl p-5 md:p-6 shadow-xs leading-relaxed text-sm text-[#2D2D2D] space-y-4">
                  <p className="font-semibold text-[#4A7C59] text-base border-b border-[#E8DFD0] pb-2">
                    Захист персональних даних
                  </p>
                  <p className="font-medium">
                    Додаток отримує ваш Telegram username та ID виключно для відображення кнопки зв'язку з продавцем.
                  </p>
                  <p>
                    Ці дані не передаються третім особам і не використовуються в рекламних цілях. Оголошення продавців зберігаються в захищеній базі даних Supabase.
                  </p>
                  <p className="bg-[#4A7C59]/10 border border-[#4A7C59]/20 rounded-xl p-3.5 text-xs text-[#4A7C59] font-medium">
                    ✅ Використовуючи додаток, ви погоджуєтесь з цією політикою.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-[#E8DFD0] bg-white flex justify-end shrink-0">
                <button
                  id="confirm-privacy-close-btn"
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-5 py-2.5 bg-[#4A7C59] hover:bg-[#3d664a] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Погоджуюсь
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Earthy Footer info */}
      <footer id="eco-app-footer" className="bg-white border-t border-[#E8DFD0] py-6 tracking-wide mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="p-1 h-6 w-6 rounded-md bg-[#4A7C59]/10 text-[#4A7C59] flex items-center justify-center font-bold">🌿</span>
              <p className="font-semibold text-gray-500">EcoMessenger Marketplace UKRAINE</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-[#4A7C59]">
              <button
                id="footer-terms-btn"
                onClick={() => setIsTermsOpen(true)}
                className="hover:underline hover:text-[#3d664a] cursor-pointer transition-colors"
              >
                Умови використання
              </button>
              <span className="text-[#E8DFD0]">|</span>
              <button
                id="footer-privacy-btn"
                onClick={() => setIsPrivacyOpen(true)}
                className="hover:underline hover:text-[#3d664a] cursor-pointer transition-colors"
              >
                Політика конфіденційності
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400/80">© 2026. Всі права захищені. Екологічна торгівля на базі Polygon & Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
