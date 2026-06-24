import React, { useState } from 'react';
import { Calendar, User, MapPin, ShoppingBag, MessageSquare, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { CatalogItem } from '../types';

interface ProductCardProps {
  key?: string;
  product: CatalogItem;
  sellerUsername: string | null;
  regionName: string;
  districtName: string;
  regionSlug: string;
  districtSlug: string;
  onAddToCart: (item: CatalogItem) => void;
  onLocationClick: (regionSlug: string, districtSlug: string) => void;
}

export default function ProductCard({
  product,
  sellerUsername,
  regionName,
  districtName,
  regionSlug,
  districtSlug,
  onAddToCart,
  onLocationClick,
}: ProductCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Parse refreshed_at date
  const refreshDate = new Date(product.refreshed_at);
  const formattedDate = refreshDate.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calculate day difference to check if older than 12 days
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - refreshDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isStale = diffDays > 12;

  // Placeholder image if none provided
  const imgFallback = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600';

  return (
    <div
      id={`product-card-${product.id}`}
      className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] flex flex-col transition-all duration-300 hover:shadow-[0_4px_16px_rgba(74,124,89,0.12)] group"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#F7F5F0]">
        <img
          src={product.image_url || imgFallback}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Verification Tag */}
        <div className="absolute top-3 left-3 bg-[#4A7C59]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-sm">
          <User className="w-2.5 h-2.5" />
          <span>Перевірений продавець</span>
        </div>

        {/* Localized Location Tag */}
        <button
          id={`location-badge-${product.id}`}
          onClick={() => onLocationClick(regionSlug, districtSlug)}
          className="absolute bottom-3 left-3 bg-[#2D2D2D]/85 hover:bg-[#4A7C59]/95 text-white text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs transition-colors flex items-center gap-1"
          title="Перейти на сторінку локації"
        >
          <MapPin className="w-2.5 h-2.5 text-emerald-400" />
          <span>{districtName || 'Район'}, {regionName.replace(' область', '')}</span>
        </button>
      </div>

      {/* Main product content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header & Price */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-sans font-semibold text-[#2D2D2D] text-sm leading-tight line-clamp-1 group-hover:text-[#4A7C59] transition-colors">
              {product.name}
            </h3>
            <span className="text-md font-bold text-[#4A7C59] shrink-0 font-mono">
              {product.price_uah} ₴
            </span>
          </div>

          {/* Description Section - Collapsible */}
          <div 
            onClick={() => setExpanded(!expanded)}
            className="cursor-pointer text-xs text-[#2D2D2D]/80 leading-relaxed mb-3 relative rounded-lg hover:bg-gray-50 p-1 -m-1 transition-colors group/desc"
          >
            <p className={expanded ? 'text-[#2D2D2D]' : 'line-clamp-2'}>
              {product.description}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[#4A7C59] font-medium mt-1">
              <span>{expanded ? 'Згорнути опис' : 'Читати повністю'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 group-hover/desc:translate-y-0.5 transition-transform" />}
            </div>
          </div>
        </div>

        {/* Footer info & warnings */}
        <div>
          <div className="flex flex-col gap-1.5 border-t border-[#E8DFD0]/60 pt-3 pb-4">
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                Оновлено
              </span>
              <span className={`font-medium ${isStale ? 'text-[#E6A817] flex items-center gap-1 bg-[#E6A817]/10 px-1.5 py-0.5 rounded-sm' : ''}`}>
                {isStale && <AlertTriangle className="w-2.5 h-2.5" />}
                {formattedDate}
              </span>
            </div>

            {/* Seller handler row */}
            <div className="flex justify-between items-center text-[10px] text-gray-500">
              <span>Продавець:</span>
              <span className="font-semibold text-[#4A7C59]">
                {sellerUsername ? `@${sellerUsername}` : 'Верифікований еко-пасічник'}
              </span>
            </div>
          </div>

          {/* Action buttons stage */}
          <div className="grid grid-cols-2 gap-2">
            <a
              id={`contact-seller-${product.id}`}
              href={sellerUsername ? `https://t.me/${sellerUsername}` : 'https://t.me/EcoEnergyMarketplace_bot'}
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-transparent hover:bg-[#E8DFD0]/20 border border-[#4A7C59] text-[#4A7C59] text-xs font-semibold rounded-xl transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Написати</span>
            </a>

            <button
              id={`add-to-cart-${product.id}`}
              onClick={() => onAddToCart(product)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4A7C59] hover:bg-[#3d664a] text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Замовити</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
