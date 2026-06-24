import { createClient } from '@supabase/supabase-js';
import { CatalogItem, Category, Subcategory, Region, District, TelegramLink } from '../types';
import {
  mockCategories,
  mockSubcategories,
  mockRegions,
  mockDistricts,
  mockTelegramLinks,
  mockCatalogItems,
} from './mockData';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if keys are properly configured and are not default templates
export const isSupabaseConfigured = (): boolean => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (SUPABASE_URL.includes('your-supabase-project') || SUPABASE_ANON_KEY.includes('your-supabase-anon-key')) {
    return false;
  }
  return true;
};

// Lazy initialization of Supabase client to prevent startup crash
let supabaseClient: any = null;
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export async function fetchCategories(): Promise<Category[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.info('Supabase not configured. Using mock categories.');
    return mockCategories.sort((a, b) => a.sort_order - b.sort_order);
  }

  try {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch categories from Supabase, falling back to mock.', err instanceof Error ? err.message : String(err));
    return mockCategories.sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function fetchSubcategories(categoryId?: string): Promise<Subcategory[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.info('Supabase not configured. Using mock subcategories.');
    const subs = mockSubcategories;
    return categoryId ? subs.filter((s) => s.category_id?.toString() === categoryId.toString()) : subs;
  }

  try {
    let query = client.from('subcategories').select('*').order('sort_order', { ascending: true });
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch subcategories from Supabase, falling back to mock.', err instanceof Error ? err.message : String(err));
    const subs = mockSubcategories;
    return categoryId ? subs.filter((s) => s.category_id?.toString() === categoryId.toString()) : subs;
  }
}

export async function fetchRegions(): Promise<Region[]> {
  const client = getSupabaseClient();
  if (!client) {
    return mockRegions.sort((a, b) => a.sort_order - b.sort_order);
  }

  try {
    const { data, error } = await client
      .from('regions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch regions from Supabase, falling back to mock.', err instanceof Error ? err.message : String(err));
    return mockRegions.sort((a, b) => a.sort_order - b.sort_order);
  }
}

export async function fetchDistricts(regionId?: string): Promise<District[]> {
  const client = getSupabaseClient();
  if (!client) {
    const dists = mockDistricts;
    return regionId ? dists.filter((d) => d.region_id?.toString() === regionId.toString()) : dists;
  }

  try {
    let query = client.from('districts').select('*').order('sort_order', { ascending: true });
    if (regionId) {
      query = query.eq('region_id', regionId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch districts from Supabase, falling back to mock.', err instanceof Error ? err.message : String(err));
    const dists = mockDistricts;
    return regionId ? dists.filter((d) => d.region_id?.toString() === regionId.toString()) : dists;
  }
}

export async function fetchTelegramLinks(): Promise<TelegramLink[]> {
  const client = getSupabaseClient();
  if (!client) {
    return mockTelegramLinks;
  }

  try {
    const { data, error } = await client.from('telegram_links').select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Failed to fetch telegram links, falling back.', err instanceof Error ? err.message : String(err));
    return mockTelegramLinks;
  }
}

export interface CatalogFilterOptions {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  regionId?: string;
  districtId?: string;
}

export async function fetchCatalogItems(filters: CatalogFilterOptions = {}): Promise<CatalogItem[]> {
  const client = getSupabaseClient();

  // Get verified sellers to show badge or for reference, but don't block loading products if empty
  const verifiedSellers = await fetchTelegramLinks().catch(() => []);
  const verifiedWallets = verifiedSellers.map((v) => (v.wallet_address || '').toLowerCase());

  if (!client) {
    // Apply filters locally to mock data
    let items = mockCatalogItems.filter((item) => {
      // 1. Must be active
      if (!item.active) return false;

      // 2. Match search query in item name and description (triggers on 1+ chars for responsive search)
      if (filters.query && filters.query.trim().length >= 1) {
        const q = filters.query.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description ? item.description.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesDesc) return false;
      }

      // 3. Category filter
      if (filters.categoryId && item.category_id?.toString() !== filters.categoryId.toString()) return false;

      // 4. Subcategory filter
      if (filters.subcategoryId && item.subcategory_id?.toString() !== filters.subcategoryId.toString()) return false;

      // 5. Region filter
      if (filters.regionId && item.region_id?.toString() !== filters.regionId.toString()) return false;

      // 6. District filter
      if (filters.districtId && item.district_id?.toString() !== filters.districtId.toString()) return false;

      return true;
    });

    return items;
  }

  try {
    // Query table "catalog_items" where active = true
    let query = client
      .from('catalog_items')
      .select('*')
      .eq('active', true);

    // Apply basic conditions to Supabase query
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }
    if (filters.regionId) {
      query = query.eq('region_id', filters.regionId);
    }
    if (filters.districtId) {
      query = query.eq('district_id', filters.districtId);
    }

    const { data: rawItems, error } = await query;
    if (error) throw error;

    let items: CatalogItem[] = rawItems || [];

    // Filter items by query name and description (now triggers on 1+ chars for instant feedback)
    if (filters.query && filters.query.trim().length >= 1) {
      const q = filters.query.toLowerCase().trim();
      items = items.filter((item) => 
        item.name.toLowerCase().includes(q) || 
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return items;
  } catch (err) {
    console.warn('Failed to fetch catalog from Supabase, applying local search filter on mock data.', err instanceof Error ? err.message : String(err));
    // Return mock data with filtering applied as robust fallback
    return fetchCatalogItemsLocalMock(filters);
  }
}

function fetchCatalogItemsLocalMock(filters: CatalogFilterOptions): CatalogItem[] {
  return mockCatalogItems.filter((item) => {
    if (!item.active) return false;
    
    // Support 1+ character search on name and description
    if (filters.query && filters.query.trim().length >= 1) {
      const q = filters.query.toLowerCase().trim();
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesDesc = item.description ? item.description.toLowerCase().includes(q) : false;
      if (!matchesName && !matchesDesc) return false;
    }
    if (filters.categoryId && item.category_id?.toString() !== filters.categoryId.toString()) return false;
    if (filters.subcategoryId && item.subcategory_id?.toString() !== filters.subcategoryId.toString()) return false;
    if (filters.regionId && item.region_id?.toString() !== filters.regionId.toString()) return false;
    if (filters.districtId && item.district_id?.toString() !== filters.districtId.toString()) return false;
    return true;
  });
}
