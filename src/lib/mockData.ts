import { CatalogItem, Category, Subcategory, Region, District, TelegramLink } from '../types';

export const mockCategories: Category[] = [
  { id: 'cat-1', slug: 'tea-herbs', name_uk: '🌿 Трави та чаї', sort_order: 1 },
  { id: 'cat-2', slug: 'honey', name_uk: '🍯 Мед та бджільництво', sort_order: 2 },
  { id: 'cat-3', slug: 'cosmetics', name_uk: '🌸 Еко-косметика', sort_order: 3 },
  { id: 'cat-4', slug: 'food', name_uk: '🍞 Натуральні продукти', sort_order: 4 },
];

export const mockSubcategories: Subcategory[] = [
  // Herbs/Tea
  { id: 'sub-1', category_id: 'cat-1', slug: 'herbal-blends', name_uk: 'Трав’яні збори', sort_order: 1 },
  { id: 'sub-2', category_id: 'cat-1', slug: 'monoteas', name_uk: 'Моночаї (Липа, М’ята тощо)', sort_order: 2 },
  // Honey
  { id: 'sub-3', category_id: 'cat-2', slug: 'pure-honey', name_uk: 'Чистий мед', sort_order: 1 },
  { id: 'sub-4', category_id: 'cat-2', slug: 'honey-mixes', name_uk: 'Гороховий та горіховий мед', sort_order: 2 },
  // Cosmetics
  { id: 'sub-5', category_id: 'cat-3', slug: 'soaps', name_uk: 'Натуральне мило', sort_order: 1 },
  { id: 'sub-6', category_id: 'cat-3', slug: 'hydrolats', name_uk: 'Гідролати', sort_order: 2 },
  // Food
  { id: 'sub-7', category_id: 'cat-4', slug: 'bread', name_uk: 'Хліб на заквасці', sort_order: 1 },
  { id: 'sub-8', category_id: 'cat-4', slug: 'dry-fruits', name_uk: 'Сухофрукти та пастила', sort_order: 2 },
];

export const mockRegions: Region[] = [
  { id: 'reg-kyiv', slug: 'kyiv-region', name_uk: 'Київська область', sort_order: 1 },
  { id: 'reg-lviv', slug: 'lviv-region', name_uk: 'Львівська область', sort_order: 2 },
  { id: 'reg-if', slug: 'if-region', name_uk: 'Івано-Франківська область', sort_order: 3 },
  { id: 'reg-poltava', slug: 'poltava-region', name_uk: 'Полтавська область', sort_order: 4 },
];

export const mockDistricts: District[] = [
  // Kyiv region
  { id: 'dist-obukhiv', region_id: 'reg-kyiv', slug: 'obukhiv-district', name_uk: 'Обухівський район', sort_order: 1 },
  { id: 'dist-bila-tserkva', region_id: 'reg-kyiv', slug: 'bila-tserkva-district', name_uk: 'Білоцерківський район', sort_order: 2 },
  // Lviv region
  { id: 'dist-lviv', region_id: 'reg-lviv', slug: 'lviv-district', name_uk: 'Львівський район', sort_order: 1 },
  { id: 'dist-stryi', region_id: 'reg-lviv', slug: 'stryi-district', name_uk: 'Стрийський район', sort_order: 2 },
  // IF region
  { id: 'dist-kosiv', region_id: 'reg-if', slug: 'kosiv-district', name_uk: 'Косівський район', sort_order: 1 },
  { id: 'dist-kolomyia', region_id: 'reg-if', slug: 'kolomyia-district', name_uk: 'Коломийський район', sort_order: 2 },
  // Poltava region
  { id: 'dist-myrhorod', region_id: 'reg-poltava', slug: 'myrhorod-district', name_uk: 'Миргородський район', sort_order: 1 },
  { id: 'dist-poltava', region_id: 'reg-poltava', slug: 'poltava-district', name_uk: 'Полтавський район', sort_order: 2 },
];

export const mockTelegramLinks: TelegramLink[] = [
  { wallet_address: '0x1111111111111111111111111111111111111111', telegram_id: 11111, telegram_username: 'ecobrand_lviv' },
  { wallet_address: '0x2222222222222222222222222222222222222222', telegram_id: 22222, telegram_username: 'carpathian_herbs' }, // Verified by ECO_ADS active ads
  { wallet_address: '0x3456789012345678901234567890123456789012', telegram_id: 34567, telegram_username: 'carpathian_herbs' }, // Match fallback ads
  { wallet_address: '0x9012345678901234567890123456789012345678', telegram_id: 90123, telegram_username: 'chernihiv_honey' }, // Match fallback ads
  { wallet_address: '0x5555555555555555555555555555555555555555', telegram_id: 55555, telegram_username: 'mirgorod_bee' },
];

export const mockCatalogItems: CatalogItem[] = [
  {
    id: 'item-1',
    wallet_address: '0x3456789012345678901234567890123456789012', // Match fallback ad (verified by ECO_ADS)
    name: 'Гідролат Меліси лікарської',
    description: 'Натуральний тонік для обличчя, дистильований парою зі свіжого листя меліси. Має заспокійливий ефект, вирівнює тон шкіри та дарує приємний свіжий аромат лимону і трав. Підходить для всіх типів шкіри.',
    price_uah: 150,
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-3',
    subcategory_id: 'sub-6',
    region_id: 'reg-if',
    district_id: 'dist-kosiv',
    address_detail: 'с. Яворів, вул. Зелена 14',
    allow_group_order: false,
    active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 2 * 86400000).toISOString(), // Fresh
  },
  {
    id: 'item-2',
    wallet_address: '0x9012345678901234567890123456789012345678', // Match fallback ad (verified by ECO_ADS)
    name: 'Мед гречаний «Карпатські Схили»',
    description: 'Густий ароматний гречаний мед темного кольору з характерним терпкуватим смаком. Зібраний на диких екологічно чистих полях. Багатий на залізо та мікроелементи.',
    price_uah: 220,
    image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-2',
    subcategory_id: 'sub-3',
    region_id: 'reg-lviv',
    district_id: 'dist-stryi',
    address_detail: 'Пасіка біля заповідника',
    allow_group_order: true,
    active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 15 * 86400000).toISOString(), // Expired (refreshed_at older than 12 days!)
  },
  {
    id: 'item-3',
    wallet_address: '0x1111111111111111111111111111111111111111', // Verified seller
    name: 'Трав’яний чай «Сила Карпат»',
    description: 'Цілющий збір з екологічного високогір’я Карпат. Склад: чебрець, материнка, м’ята перцева, суцвіття липи, лист брусниці, плоди шипшини. Зміцнює імунітет, заспокоює нервову систему.',
    price_uah: 95,
    image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-1',
    subcategory_id: 'sub-1',
    region_id: 'reg-if',
    district_id: 'dist-kosiv',
    address_detail: 'смт. Верховина',
    allow_group_order: true,
    active: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 3 * 86400000).toISOString(), // Fresh
  },
  {
    id: 'item-4',
    wallet_address: '0x1111111111111111111111111111111111111111', // Verified seller
    name: 'Натуральне мило «Лавандовий Подих»',
    description: 'Виготовлене холодним способом виключно на оливковій, кокосовій та касторовій оліях. Містить натуральні квіти й ефірну олію лаванди. Дбайливо очищує, не сушить шкіру.',
    price_uah: 80,
    image_url: 'https://images.unsplash.com/photo-1607006342411-1a90e3cd29d2?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-3',
    subcategory_id: 'sub-5',
    region_id: 'reg-lviv',
    district_id: 'dist-lviv',
    address_detail: 'м. Львів, вул. Зелена 45',
    allow_group_order: false,
    active: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 5 * 86400000).toISOString(), // Fresh
  },
  {
    id: 'item-5',
    wallet_address: '0x5555555555555555555555555555555555555555', // Verified seller
    name: 'Бездріжджовий хліб на житній заквасці',
    description: 'Житньо-пшеничний хліб, випечений у глиняній печі за традиційним домашнім рецептом. Хрустка скоринка і пористий м’якуш. Без штучних поліпшувачів та консервантів.',
    price_uah: 65,
    image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-4',
    subcategory_id: 'sub-7',
    region_id: 'reg-poltava',
    district_id: 'dist-myrhorod',
    address_detail: 'с. Великі Сорочинці',
    allow_group_order: false,
    active: true,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 1 * 86400000).toISOString(), // Fresh
  },
  {
    id: 'item-6',
    wallet_address: '0x3456789012345678901234567890123456789012', // Verified seller
    name: 'Сушена суниця лісова (крафт-пакет)',
    description: 'Справжня дика суниця, зібрана в екологічних хвойних лісах та висушена за делікатної температури для збереження всіх корисних вітамінів і смакових відтінків.',
    price_uah: 180,
    image_url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=500',
    category_id: 'cat-4',
    subcategory_id: 'sub-8',
    region_id: 'reg-if',
    district_id: 'dist-kolomyia',
    address_detail: 'м. Коломия',
    allow_group_order: false,
    active: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    refreshed_at: new Date(Date.now() - 14 * 86400000).toISOString(), // Expired (refreshed_at older than 12 days!)
  }
];
