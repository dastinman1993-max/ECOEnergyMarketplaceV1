import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { Ad } from '../types';

const DEFAULT_RPC_URLS = [
  'https://polygon.gateway.tenderly.co',
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.drpc.org',
];

const customRpc = (import.meta as any).env?.VITE_POLYGON_RPC_URL;
const RPC_URLS = customRpc ? [customRpc, ...DEFAULT_RPC_URLS] : DEFAULT_RPC_URLS;

const abi = [
  {
    name: 'getActiveAds',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'ads',
        type: 'tuple[]',
        components: [
          { name: 'advertiser', type: 'address' },
          { name: 'text', type: 'string' },
          { name: 'authorNickname', type: 'string' },
          { name: 'placedAt', type: 'uint256' },
          { name: 'occupied', type: 'bool' },
        ],
      },
    ],
  },
] as const;

const ecoAdsAddress = '0xd1e7F07A7760aeb05285E8Fceb6e0033D12C5F6B';

// Fallback high-quality static ads for the marketplace
export const fallbackAds: Ad[] = [
  {
    advertiser: '0x3456789012345678901234567890123456789012',
    text: '🌿 Лише натуральна косметика ручної роботи з екологічно чистих Карпат! Гідролати, мило, олії.',
    authorNickname: 'carpathian_herbs',
    placedAt: BigInt(Math.floor(Date.now() / 1000) - 3600),
    occupied: true,
  },
  {
    advertiser: '0x9012345678901234567890123456789012345678',
    text: '🍯 Натуральний свіжий мед прямо з пасіки в Чернігівській області. Спробуйте справжню якість!',
    authorNickname: 'chernihiv_honey',
    placedAt: BigInt(Math.floor(Date.now() / 1000) - 7200),
    occupied: true,
  }
];

export async function fetchActiveAds(): Promise<Ad[]> {
  let lastError: any = null;

  for (const rpcUrl of RPC_URLS) {
    try {
      const client = createPublicClient({
        chain: polygon,
        transport: http(rpcUrl),
      });

      const data = await client.readContract({
        address: ecoAdsAddress,
        abi,
        functionName: 'getActiveAds',
      } as any) as any[];

      if (!data || data.length === 0) {
        return fallbackAds;
      }

      // Filter occupied ads and format them cleanly
      const activeAds: Ad[] = data
        .map((ad: any) => {
          let timestamp: bigint;
          try {
            if (typeof ad.placedAt === 'bigint') {
              timestamp = ad.placedAt;
            } else {
              timestamp = BigInt(Math.floor(Number(ad.placedAt || 0)));
            }
          } catch {
            timestamp = BigInt(0);
          }
          return {
            advertiser: ad.advertiser,
            text: ad.text,
            authorNickname: ad.authorNickname,
            placedAt: timestamp,
            occupied: ad.occupied,
          };
        })
        .filter((ad) => ad.occupied)
        .sort((a, b) => Number(b.placedAt - a.placedAt));

      return activeAds.length > 0 ? activeAds : fallbackAds;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to fetch ads from RPC: ${rpcUrl}. Trying next.`, error instanceof Error ? error.message : String(error));
    }
  }

  console.error('ADS CONTRACT ERROR (All RPCs failed):', lastError);
  return fallbackAds;
}
