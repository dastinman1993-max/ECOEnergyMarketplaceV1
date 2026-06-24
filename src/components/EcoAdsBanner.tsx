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
    <div id="eco-ads-container" className="w-full px-4 pt-3 pb-1 bg-[#FAF9F6]">
      {/* 
        Beautifully highlighted advertisement box ("СВІЖА ПРОПОЗИЦІЯ")
        Featuring a bright, highly noticeable border, soft light background, and refined layout.
      */}
      <div className="max-w-7xl mx-auto border-2 border-amber-500 rounded-xl bg-white p-3 md:p-4 shadow-sm relative overflow-hidden">
        {/* Left bright indicator strip for visual focus */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
        
        {/* Header bar */}
        <div className="flex items-center gap-2 mb-2 border-b border-amber-100 pb-1.5">
          <div className="p-1 px-2 h-5 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse mr-1" />
            <span className="text-[10px] uppercase font-sans tracking-wide font-extrabold text-white">СВІЖА ПРОПОЗИЦІЯ</span>
          </div>
        </div>

        {/* Advertisements list */}
        <div className="flex flex-col gap-2">
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

            const buttonLabel = username
              ? `Зв'язатися @${username}`
              : `Зв'язатися через бота`;

            return (
              <div 
                key={`${ad.advertiser}-${idx}`} 
                id={`ad-row-${idx}`}
                className="relative bg-amber-50/20 hover:bg-amber-50/40 border border-amber-100 rounded-lg p-2 md:p-3.5 transition-colors flex flex-col justify-between gap-2"
              >
                {/* Ad Content */}
                <div className="text-xs md:text-[13px] text-[#2D2D2D] leading-relaxed pr-1 flex-1">
                  <span className="font-extrabold text-[#4A7C59] mr-1">{displayLabel}:</span>
                  <span className="break-words font-medium">{ad.text}</span>
                </div>

                {/* Contact button inside the frame, aligned at the bottom right */}
                <div className="flex justify-end items-center shrink-0">
                  <a
                    id={`ad-contact-btn-${idx}`}
                    href={contactUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-md shadow-xs hover:shadow-xs transition-all"
                  >
                    <span>{buttonLabel}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/90 ml-0.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
