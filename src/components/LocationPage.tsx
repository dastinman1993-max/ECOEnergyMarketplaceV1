import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Share2, Check, Clipboard } from 'lucide-react';
import { CatalogItem, Category, Subcategory, Region, District, TelegramLink } from '../types';
import ProductCard from './ProductCard';

export function toSlug(text: string): string {
  if (!text) return '';
  const ukToEn: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
    'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
    'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ь': '', 'ю': 'yu', 'я': 'ya', 'э': 'e', 'ы': 'y', 'ё': 'yo', 'ъ': ''
  };
  const lower = text.toLowerCase();
  let transliterated = '';
  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    transliterated += ukToEn[char] !== undefined ? ukToEn[char] : char;
  }
  return transliterated
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface LocationPageProps {
  regionSlug: string;
  districtSlug: string;
  localitySlug?: string;
  products: CatalogItem[];
  regions: Region[];
  districts: District[];
  telegramLinks: TelegramLink[];
  onAddToCart: (item: CatalogItem) => void;
  onBack: () => void;
  onLocationClick: (regionSlug: string, districtSlug: string, localitySlug?: string) => void;
}

export default function LocationPage({
  regionSlug,
  districtSlug,
  localitySlug,
  products,
  regions,
  districts,
  telegramLinks,
  onAddToCart,
  onBack,
  onLocationClick,
}: LocationPageProps) {
  const [copied, setCopied] = useState(false);

  // Find region & district entities
  const region = regions.find((r) => r.slug === regionSlug);
  const district = districts.find((d) => d.slug === districtSlug && (region ? d.region_id === region.id : true));

  // Get all products matching this region and district
  const allLocationProducts = products.filter(
    (p) => p.region_id === region?.id && p.district_id === district?.id
  );

  // Filter products matching this specific location, additionally filtering by locality if provided
  const locationProducts = localitySlug
    ? allLocationProducts.filter((p) => p.address_detail && toSlug(p.address_detail) === localitySlug)
    : allLocationProducts;

  // Get unique address_details (localities) from products in this district
  const uniqueLocalities = Array.from(
    new Set(
      allLocationProducts
        .map((p) => p.address_detail?.trim())
        .filter((addr): addr is string => !!addr)
    )
  ).sort();

  // Find the original name of the locality if slug is provided
  const selectedLocalityName = localitySlug 
    ? allLocationProducts.find(p => p.address_detail && toSlug(p.address_detail) === localitySlug)?.address_detail 
    : undefined;

  // Generate dynamic sharing URL
  const shareUrl = localitySlug
    ? `${window.location.origin}${window.location.pathname}#location/${regionSlug}/${districtSlug}/${localitySlug}`
    : `${window.location.origin}${window.location.pathname}#location/${regionSlug}/${districtSlug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const regionName = region ? region.name_uk : 'Область';
  const districtName = district ? district.name_uk : 'Район';

  return (
    <div id="location-view-container" className="max-w-7xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        id="back-to-catalog-btn"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-[#4A7C59] hover:text-[#3d664a] font-medium mb-6 bg-white border border-[#E8DFD0] px-3.5 py-2 rounded-xl shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Повернутись до каталогу</span>
      </button>

      {/* Main Grid: Info card and catalog list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* QR & Location Info Block */}
        <div 
          id="location-info-panel"
          className="lg:col-span-4 bg-white rounded-2xl border border-[#E8DFD0] p-6 shadow-sm flex flex-col items-center text-center"
        >
          <div className="p-3 bg-white border border-[#E8DFD0] rounded-2xl mb-4 shadow-xs">
            <QRCodeSVG
              value={shareUrl}
              size={140}
              bgColor="#ffffff"
              fgColor="#4A7C59"
              level="M"
            />
          </div>

          <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400 font-bold mb-1">
            Локальна вітрина
          </p>
          <h2 className="font-sans font-bold text-xl text-[#2D2D2D] mb-1">
            {selectedLocalityName || districtName}
          </h2>
          <p className="text-xs text-[#2D2D2D]/60 font-semibold mb-6">
            {selectedLocalityName ? `${districtName}, ${regionName}` : regionName}
          </p>

          {/* QR Code Canvas */}
          <div className="p-4 bg-[#F7F5F0] rounded-2xl border border-[#E8DFD0] mb-5 flex items-center justify-center">
            <QRCodeSVG
              value={shareUrl}
              size={160}
              bgColor={'#ffffff'}
              fgColor={'#2D2D2D'}
              level={'H'}
              includeMargin={true}
            />
          </div>

          <p className="text-[11px] text-[#2D2D2D]/70 leading-relaxed max-w-xs mb-6">
            Поширюйте цей QR-код на ринках, ярмарках чи дошках оголошень, щоб місцеві покупці швидко знаходили ваші товари!
          </p>

          {/* Link copied field */}
          <div className="w-full flex gap-2">
            <button
              id="copy-location-link"
              onClick={copyToClipboard}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#4A7C59] hover:bg-[#3d664a] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Скопійовано!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4" />
                  <span>Скопіювати посилання</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic products list */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Localities block if localitySlug is not passed */}
          {!localitySlug && uniqueLocalities.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8DFD0] p-5 shadow-xs">
              <h4 className="font-sans font-bold text-sm text-[#2D2D2D] flex items-center gap-2 mb-2">
                <span className="text-base">🏘️</span>
                <span>Населені пункти ({uniqueLocalities.length})</span>
              </h4>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Оберіть населений пункт, щоб переглянути локальні товари та отримати точний QR-код:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {uniqueLocalities.map((locality) => {
                  const slug = toSlug(locality);
                  return (
                    <button
                      key={locality}
                      onClick={() => {
                        window.location.hash = `location/${regionSlug}/${districtSlug}/${slug}`;
                      }}
                      className="px-3.5 py-2.5 bg-[#F7F5F0] hover:bg-[#4A7C59]/10 text-[#2D2D2D] hover:text-[#4A7C59] border border-[#E8DFD0] hover:border-[#4A7C59]/30 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left flex items-center gap-2"
                    >
                      <span>📍</span>
                      <span className="truncate">{locality}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E8DFD0]/60">
            <div>
              <h3 className="font-sans font-semibold text-[#2D2D2D] text-sm">
                {selectedLocalityName ? (
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>Товари в:</span>
                    <span className="text-[#4A7C59] font-bold">{selectedLocalityName}</span>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={() => {
                        window.location.hash = `location/${regionSlug}/${districtSlug}`;
                      }}
                      className="text-xs text-[#4A7C59] hover:underline cursor-pointer"
                    >
                      весь {districtName}
                    </button>
                  </span>
                ) : (
                  `Товари в локації: ${districtName}`
                )}
              </h3>
              <p className="text-xs text-[#2D2D2D]/50 mt-0.5">
                Знайдено: {locationProducts.length} товар{locationProducts.length === 1 ? 'ь' : locationProducts.length >= 2 && locationProducts.length <= 4 ? 'і' : 'ів'}
              </p>
            </div>
            <div className="text-[11px] bg-[#E8DFD0] px-2.5 py-1 text-[#2D2D2D]/80 rounded-md font-medium">
              Крафтовий сертифікат
            </div>
          </div>

          {locationProducts.length === 0 ? (
            <div className="bg-[#F7F5F0] rounded-2xl border-2 border-dashed border-[#E8DFD0] p-12 text-center">
              <span className="text-[#2D2D2D]/40 text-sm block mb-2">Наразі немає активних товарів</span>
              <p className="text-xs text-[#2D2D2D]/40 max-w-md mx-auto">
                Будь ласка, зазирніть пізніше! Ви можете стати першим продавцем цієї локації, зареєструвавши свій гаманець в системі.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locationProducts.map((product) => {
                const seller = telegramLinks.find(
                  (l) => l.wallet_address.toLowerCase() === product.wallet_address.toLowerCase()
                );
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sellerUsername={seller?.telegram_username || null}
                    regionName={regionName}
                    districtName={districtName}
                    regionSlug={regionSlug}
                    districtSlug={districtSlug}
                    onAddToCart={onAddToCart}
                    onLocationClick={onLocationClick}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
