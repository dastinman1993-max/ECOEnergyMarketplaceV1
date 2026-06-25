import React, { useEffect, useState } from 'react';
import { Megaphone, ExternalLink, Sparkles } from 'lucide-react';
import { Ad, TelegramLink } from '../types';
import { fetchActiveAds } from '../lib/web3';
import { fetchTelegramLinks } from '../lib/supabase';

interface EcoAdsBannerProps {
  telegramLinks?: TelegramLink[];
}

export default function EcoAdsBanner({ telegramLinks: initialTelegramLinks }: EcoAdsBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [telegramLinks, setTelegramLinks] = useState<TelegramLink[]>(initialTelegramLinks || []);

  useEffect(() => {
    if (initialTelegramLinks && initialTelegramLinks.length > 0) {
      setTelegramLinks(initialTelegramLinks);
    }
  }, [initialTelegramLinks]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [adsData, linksData] = await Promise.all([
          fetchActiveAds(),
          (!initialTelegramLinks || initialTelegramLinks.length === 0)
            ? fetchTelegramLinks().catch(() => [])
            : Promise.resolve(initialTelegramLinks)
        ]);

        if (active) {
          setAds(adsData);
          if (linksData && linksData.length > 0) {
            setTelegramLinks(linksData);
          }
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [initialTelegramLinks]);

  if (loading) {
    return (
      <div id="eco-ads-loading" className="w-full bg-[#E8DFD0]/40 border-b border-[#E8DFD0] py-3 text-center">
        <span className="text-[#2D2D2D]/60 text-xs font-mono animate-pulse">Завантаження рекламної стрічки Polygon...</span>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <div id="eco-ads-container" className="w-full px-4 pt-1.5 pb-0.5 bg-[#FAF9F6]">
      {/* 
        Beautifully highlighted advertisement box ("СВІЖА ПРОПОЗИЦІЯ")
        Featuring a bright, highly noticeable border, soft light background, and refined layout.
      */}
      <div className="max-w-7xl mx-auto border-2 border-amber-500 rounded-xl bg-white p-1.5 sm:p-2 shadow-sm relative overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-center gap-2 mb-1.5 border-b border-amber-200 pb-1">
          <div className="p-1 px-2 h-5 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse mr-1" />
            <span className="text-[10px] uppercase font-sans tracking-wide font-extrabold text-white">СВІЖА ПРОПОЗИЦІЯ</span>
          </div>
        </div>

        {/* Advertisements list */}
        <div className="flex flex-wrap gap-1.5 items-center justify-center">
          {ads.map((ad, idx) => {
            // 1. Try to get username from ad.authorNickname
            let username = ad.authorNickname ? ad.authorNickname.replace(/^@/, '').trim() : '';

            // 2. If not in ad, try to lookup in telegramLinks by advertiser address
            if (!username && ad.advertiser) {
              const matchedLink = telegramLinks.find(
                (link) => link.wallet_address?.toLowerCase() === ad.advertiser.toLowerCase()
              );
              if (matchedLink && matchedLink.telegram_username) {
                username = matchedLink.telegram_username.replace(/^@/, '').trim();
              }
            }

            // 3. Fallback contact link if still no username found
            const contactUrl = username 
              ? `https://t.me/${username}` 
              : 'https://t.me/EcoEnergyMarketplace_bot';

            const displayLabel = username 
              ? `@${username}` 
              : `промо (${ad.advertiser.slice(0, 6)}...${ad.advertiser.slice(-4)})`;

            return (
              <a 
                key={`${ad.advertiser}-${idx}`} 
                id={`ad-row-${idx}`}
                href={contactUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center gap-1.5 border-2 border-amber-600 bg-amber-50/40 hover:bg-amber-100/60 rounded-lg px-2 py-1 text-xs text-[#2D2D2D] hover:text-[#111111] transition-all cursor-pointer shadow-xs active:scale-[0.98] w-fit max-w-full"
              >
                <div className="flex items-center flex-wrap gap-1 leading-tight">
                  <span className="font-extrabold text-[#4A7C59] whitespace-nowrap">{displayLabel}:</span>
                  <span className="break-words font-semibold">{ad.text}</span>
                  <ExternalLink className="w-3 h-3 text-amber-700 shrink-0 ml-0.5 inline-block" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
