import React, { useState } from 'react';
import { ShoppingCart, Trash2, Map, Truck, Send, CheckCircle2, User, Phone, MapPin, MessageSquare, Plus, Minus, X, AlertCircle } from 'lucide-react';
import { CartItem, CatalogItem, TelegramLink, OrderSubmission } from '../types';

interface CartSidebarProps {
  cart: CartItem[];
  telegramLinks: TelegramLink[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onClose: () => void;
}

interface OrderResponse {
  success: boolean;
  message: string;
  orderId: string;
  sellerUsername: string;
}

export default function CartSidebar({
  cart,
  telegramLinks,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onClose,
}: CartSidebarProps) {
  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'nova_poshta' | 'ukrposhta' | 'pickup'>('nova_poshta');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [comment, setComment] = useState('');
  
  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ordersResults, setOrdersResults] = useState<OrderResponse[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Group items by vendor wallet address
  const groupedItems = cart.reduce((acc, item) => {
    const wallet = item.item.wallet_address.toLowerCase();
    if (!acc[wallet]) {
      acc[wallet] = [];
    }
    acc[wallet].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // Grand total calculation
  const grandTotal = cart.reduce((acc, item) => acc + item.item.price_uah * item.quantity, 0);

  // Get Telegram Username for a given wallet
  const getSellerUsername = (wallet: string): string => {
    const link = telegramLinks.find((l) => l.wallet_address.toLowerCase() === wallet);
    return link && link.telegram_username ? `${link.telegram_username}` : 'Продавець';
  };

  const getSellerId = (wallet: string): number => {
    const link = telegramLinks.find((l) => l.wallet_address.toLowerCase() === wallet);
    return link ? link.telegram_id : 123456; // Fallback seller telegram id
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!recipientName || !phone || !deliveryAddress) {
      setFormError('Будь ласка, заповніть усі необхідні поля форми.');
      return;
    }

    setIsSubmitting(true);
    const results: OrderResponse[] = [];

    // Parse buyer details from Telegram Mini App WebApp context if available
    let telegram_id = 999999;
    let telegram_username = 'guest_buyer';

    const tg = (window as any).Telegram?.WebApp;
    const tgUser = tg?.initDataUnsafe?.user;
    if (tgUser) {
      telegram_id = tgUser.id || 999999;
      telegram_username = tgUser.username
        || `${tgUser.first_name || ''}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`.trim()
        || 'Покупець';
    }

    try {
      // Loop over each seller group and dispatch a separate order post
      for (const [wallet, items] of Object.entries(groupedItems)) {
        const sellerUsername = getSellerUsername(wallet);
        const sellerTelegramId = getSellerId(wallet);
        
        const sellerTotal = items.reduce((acc, current) => acc + current.item.price_uah * current.quantity, 0);

        const orderPayload = {
          buyer: {
            name: recipientName,
            phone,
          },
          seller_telegram_id: sellerTelegramId,
          items: items.map((cartItem) => ({
            product_id: cartItem.item.id,
            product_name: cartItem.item.name,
            quantity: cartItem.quantity,
            price_uah: cartItem.item.price_uah,
            total_uah: cartItem.item.price_uah * cartItem.quantity,
            seller_username: sellerUsername, // Utility for notification text
          })),
          delivery: {
            method: deliveryMethod,
            address: deliveryAddress,
          },
          comment: comment,
          total_uah: sellerTotal,
        };

        if (tg) {
          tg.sendData(JSON.stringify(orderPayload));
          results.push({
            success: true,
            message: `Замовлення надіслано до @${sellerUsername}`,
            orderId: crypto.randomUUID(),
            sellerUsername,
          });
        } else {
          throw new Error('Telegram WebApp недоступний');
        }
      }

      setOrdersResults(results);
      setSubmitted(true);
      onClearCart(); // Wipe cart on success
    } catch (err: any) {
      console.error('Failed split submissions:', err instanceof Error ? err.message : String(err));
      setFormError('Виникла прикра помилка при з’єднанні з сервером. Перевірте з’єднання.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render fully successful submission screen
  if (submitted) {
    return (
      <div id="cart-success-popup" className="bg-white rounded-2xl border border-[#E8DFD0] p-6 max-w-lg mx-auto shadow-md">
        <div className="text-center py-6">
          <div className="inline-flex p-3 bg-emerald-100 rounded-full text-emerald-600 mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="font-sans font-extrabold text-xl text-[#2D2D2D] mb-2">
            Замовлення надіслано!
          </h2>
          <p className="text-xs text-[#2D2D2D]/70 mb-6 max-w-sm mx-auto">
            Ваші замовлення були розділені та успішно надіслані кожному господарю через нашого Telegram-бота. Вони зв’яжуться з вами найближчим часом.
          </p>
        </div>

        {/* List distinct seller messages */}
        <div className="space-y-3 mb-6 bg-[#F7F5F0] p-4 rounded-xl border border-[#E8DFD0]/60 max-h-48 overflow-y-auto">
          {ordersResults.map((ord, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-[#2D2D2D] border-b border-[#E8DFD0]/50 pb-2.5 last:border-0 last:pb-0">
              <span className="text-[#4A7C59]">✓</span>
              <div>
                <span className="font-bold text-[#4A7C59]">@{ord.sellerUsername}:</span>
                <p className="text-[11px] text-[#2D2D2D]/80 mt-0.5">{ord.message} {ord.orderId && `(Код: ${ord.orderId})`}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          id="close-success-btn"
          onClick={onClose}
          className="w-full bg-[#4A7C59] hover:bg-[#3d664a] text-white py-3 px-4 rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          Зрозуміло, повернутись до товарів
        </button>
      </div>
    );
  }

  return (
    <div id="cart-panel-content" className="flex flex-col h-full bg-[#F7F5F0]">
      {/* Drawer Header */}
      <div className="p-4 bg-white border-b border-[#E8DFD0] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#4A7C59]" />
          <h2 className="font-sans font-bold text-sm text-[#2D2D2D]">
            Ваш кошик ({cart.length})
          </h2>
        </div>
        <button
          id="close-cart-drawer"
          onClick={onClose}
          className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
          <div className="p-4 bg-[#E8DFD0]/30 rounded-full text-[#4A7C59]/40 mb-3">
            <ShoppingCart className="w-12 h-12" />
          </div>
          <span className="text-sm font-semibold text-[#2D2D2D]">Кошик порожній</span>
          <p className="text-xs text-[#2D2D2D]/50 max-w-xs mt-1">
            Додайте екологічні свіжі товари з нашого каталогу, щоб підтримати локальних виробників.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 overflow-hidden h-full">
          {/* Scrollable products section */}
          <div className="md:col-span-7 overflow-y-auto p-4 space-y-4 max-h-[40vh] md:max-h-full">
            <div className="flex justify-between items-center pb-2 border-b border-[#E8DFD0]/60">
              <span className="text-[11px] font-mono font-bold text-[#2D2D2D]/60 uppercase tracking-wider">Товари в розрізі продавців</span>
              <button
                id="clear-cart-items-btn"
                onClick={onClearCart}
                className="text-[10px] text-red-500 hover:text-red-700 font-bold transition-colors"
              >
                Очистити кошик
              </button>
            </div>

            {/* List vendors groups */}
            {Object.entries(groupedItems).map(([wallet, items]) => {
              const sellerUser = getSellerUsername(wallet);
              const sellerGroupSubtotal = items.reduce(
                (sum, cartItem) => sum + cartItem.item.price_uah * cartItem.quantity,
                0
              );

              return (
                <div
                  key={wallet}
                  id={`vendor-group-${wallet}`}
                  className="bg-white rounded-xl border border-[#E8DFD0] overflow-hidden shadow-xs"
                >
                  {/* Group header */}
                  <div className="px-4 py-2 bg-[#4A7C59]/10 border-b border-[#E8DFD0] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#4A7C59]">
                      @{sellerUser}
                    </span>
                  </div>

                  {/* Vendor items list */}
                  <div className="divide-y divide-gray-100">
                    {items.map(({ item, quantity }) => (
                      <div key={item.id} className="p-3.5 flex gap-3 items-start">
                        {/* Thumbnail */}
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=200'}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Name and control */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-[#2D2D2D] truncate">
                            {item.name}
                          </h4>
                          <span className="text-[11px] font-bold text-[#4A7C59] block mt-0.5 font-mono">
                            {item.price_uah} ₴
                          </span>

                          <div className="flex items-center gap-2 mt-2">
                            {/* Quantity controls */}
                            <button
                              id={`qty-decrease-${item.id}`}
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 rounded-md hover:bg-[#F7F5F0] border border-[#E8DFD0] text-[#2D2D2D]/70 hover:text-black transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-semibold w-5 text-center text-[#2D2D2D] font-mono">
                              {quantity}
                            </span>
                            <button
                              id={`qty-increase-${item.id}`}
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 rounded-md hover:bg-[#F7F5F0] border border-[#E8DFD0] text-[#2D2D2D]/70 hover:text-black transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>

                            <button
                              id={`cart-delete-${item.id}`}
                              onClick={() => onRemoveItem(item.id)}
                              className="ml-auto inline-flex p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Видалити"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor subtotal */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Підсумок:</span>
                    <span className="font-bold text-[#4A7C59] font-mono">
                      {sellerGroupSubtotal} ₴
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form & Totals Section */}
          <div className="md:col-span-5 bg-white border-t md:border-t-0 md:border-l border-[#E8DFD0] p-4 flex flex-col justify-between overflow-y-auto">
            <form onSubmit={handleSubmitOrder} className="space-y-3.5">
              <span className="text-[11px] font-mono font-bold text-[#2D2D2D]/60 uppercase tracking-wider block border-b border-gray-100 pb-2">
                Дані отримувача замовлення
              </span>

              {/* Input name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#2D2D2D]/80 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#4A7C59]" />
                  ПІБ отримувача *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Олександр Коваленко"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-colors"
                />
              </div>

              {/* Input phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#2D2D2D]/80 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#4A7C59]" />
                  Контактний телефон *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+380 50 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-colors"
                />
              </div>

              {/* Delivery system options */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2D2D2D]/80 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-[#4A7C59]" />
                  Спосіб доставки *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['nova_poshta', 'ukrposhta', 'pickup'] as const).map((method) => {
                    const label = method === 'nova_poshta' ? 'Нова Пошта' : method === 'ukrposhta' ? 'Укрпошта' : 'Самовивіз';
                    const active = deliveryMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setDeliveryMethod(method)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center border transition-all ${
                          active
                            ? 'bg-[#4A7C59]/10 border-[#4A7C59] text-[#4A7C59]'
                            : 'bg-[#F7F5F0] border-[#E8DFD0] text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Office/Address Detail */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#2D2D2D]/80 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4A7C59]" />
                  {deliveryMethod === 'pickup' ? 'Адреса отримання / пункт' : 'Адреса доставки / № Відділення *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    deliveryMethod === 'nova_poshta'
                      ? 'м. Львів, Відділення №5'
                      : deliveryMethod === 'ukrposhta'
                      ? 'м. Стрий, вул. Франка 12, індекс 82400'
                      : 'Домовленість по самовивозу'
                  }
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#E8DFD0] rounded-xl px-3 py-2 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-colors"
                />
              </div>

              {/* Comment field (optional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#2D2D2D]/80 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#4A7C59]" />
                  Коментар (необов'язково)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ваші побажання щодо пакування, тощо..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#E8DFD0] rounded-xl px-3 py-1.5 text-xs text-[#2D2D2D] outline-hidden focus:border-[#4A7C59] transition-colors resize-none"
                />
              </div>

              {/* Total Summary and checkout actions */}
              <div className="border-t border-[#E8DFD0] pt-4 mt-6 space-y-3 shrink-0">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2 text-red-700 text-xs animation-fade">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="leading-relaxed">{formError}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#2D2D2D]/70">Загальна сума:</span>
                  <span className="text-lg font-black text-[#4A7C59] font-mono">{grandTotal} ₴</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#4A7C59] hover:bg-[#3d664a] disabled:bg-gray-400 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Надсилаємо замовлення...' : 'Підтвердити замовлення'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
