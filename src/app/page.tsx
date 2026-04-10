'use client';

import Image from 'next/image';
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface SessionUser {
  username: string;
  role: string;
}

interface Ad {
  _id: string;
  type: 'sponsored' | 'featured' | 'banner';
  priority: number;
  startDate: string;
  endDate?: string;
  content: string;
  image?: string;
  shopId?: { _id: string; name: string };
  productId?: { _id: string; name: string };
}

type ApiHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

interface OrderInit {
  productName: string;
  productPrice: number;
  shopName: string;
  productId?: string;
  shopId?: string;
}

const SUGGESTIONS = [
  'Manasa me best medical store kaunsa hai?',
  'Plumber milega kya near bus stand?',
  'Weekend me Manasa ke paas ghoomne kya hai?',
  'Manasa ke liye ek short Instagram caption likh do',
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Main ManasaGPT hoon. Aap mujhse Manasa ke shops, services, products, places, ya general sawaal pooch sakte hain.',
      sender: 'bot',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [orderModal, setOrderModal] = useState<OrderInit | null>(null);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', qty: 1, note: '' });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    void fetchAds();
    void fetchSession();
  }, []);

  const activeAds = useMemo(() => {
    const now = new Date();
    return ads
      .filter((ad) => {
        const starts = new Date(ad.startDate) <= now;
        const ends = !ad.endDate || new Date(ad.endDate) >= now;
        return starts && ends;
      })
      .sort((a, b) => b.priority - a.priority);
  }, [ads]);

  const goToSlide = useCallback(
    (dir: 'left' | 'right') => {
      if (isAnimating || activeAds.length <= 1) return;
      setSlideDir(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setSlideIndex((prev) =>
          dir === 'left'
            ? (prev + 1) % activeAds.length
            : (prev - 1 + activeAds.length) % activeAds.length
        );
        setIsAnimating(false);
      }, 350);
    },
    [isAnimating, activeAds.length]
  );

  useEffect(() => {
    if (activeAds.length <= 1 || isPaused) return;
    autoPlayRef.current = setInterval(() => goToSlide('left'), 4000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [activeAds.length, isPaused, goToSlide]);

  const currentAd = activeAds[slideIndex] ?? null;

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      setUser(data.user ?? null);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const sendMessage = async (preset?: string) => {
    const messageText = (preset ?? input).trim();
    if (!messageText || loading) return;

    const userMessage: Message = { id: Date.now().toString(), text: messageText, sender: 'user' };
    const history: ApiHistoryMessage[] = [...messages, userMessage].map((message) => ({
      role: message.sender === 'bot' ? 'assistant' : 'user',
      content: message.text,
    }));
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messageText, history }),
      });

      const data = await response.json();
      const text = data.response || data.error || 'Sorry, mujhe abhi response generate karne me dikkat aa rahi hai.';

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text, sender: 'bot' },
      ]);

      // If API signals order intent, open order modal
      if (data.orderInit) {
        setOrderModal(data.orderInit as OrderInit);
        setOrderForm({ name: '', phone: '', address: '', qty: 1, note: '' });
        setOrderSuccess(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, kuch technical issue aa gaya. Thodi der baad phir try kijiye.',
          sender: 'bot',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderModal || orderLoading) return;
    const { name, phone, address, qty } = orderForm;
    if (!name.trim() || !phone.trim() || !address.trim()) return;

    setOrderLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: orderModal.productId,
          productName: orderModal.productName,
          productPrice: orderModal.productPrice,
          shopId: orderModal.shopId,
          shopName: orderModal.shopName,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
          quantity: qty,
          note: orderForm.note.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(true);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: `✅ Order placed! "${orderModal.productName}" x${qty} from ${orderModal.shopName}. Total: ₹${(orderModal.productPrice * qty).toFixed(0)}. Shop aapko confirm karega!`,
            sender: 'bot',
          },
        ]);
        setTimeout(() => setOrderModal(null), 2000);
      } else {
        alert(data.error || 'Order failed. Try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#101826] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-6 pt-5 md:px-6">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-200/70">Manasa Assistant</p>
            <h1 className="text-2xl font-semibold">ManasaGPT</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-300 md:block">Local discovery + general assistant</div>
            {user ? (
              <>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 md:inline-flex">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/admin/login"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Admin Login
              </Link>
            )}
          </div>
        </header>

        {activeAds.length > 0 && (
          <section
            className="relative mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#132038] select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slide content */}
            <div
              className="transition-all duration-350 ease-in-out"
              style={{
                opacity: isAnimating ? 0 : 1,
                transform: isAnimating
                  ? `translateX(${slideDir === 'left' ? '-32px' : '32px'})`
                  : 'translateX(0)',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
              }}
            >
              {currentAd && (
                <div className="grid items-center gap-0 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="p-6 pb-10">
                    {/* Type label */}
                    <span
                      className={`inline-block mb-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        currentAd.type === 'banner'
                          ? 'bg-blue-500/20 text-blue-300'
                          : currentAd.type === 'sponsored'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {currentAd.type === 'banner'
                        ? '✦ Featured Banner'
                        : currentAd.type === 'sponsored'
                        ? '★ Sponsored Shop'
                        : '🛒 Featured Product'}
                    </span>

                    <h2 className="text-2xl font-semibold text-white leading-snug">
                      {currentAd.content}
                    </h2>

                    {(currentAd.shopId?.name || currentAd.productId?.name) && (
                      <p className="mt-2 text-sm text-slate-300">
                        {currentAd.shopId?.name || currentAd.productId?.name}
                      </p>
                    )}
                  </div>

                  {/* Image side */}
                  {currentAd.image ? (
                    currentAd.image.startsWith('/') ? (
                      <div className="relative h-52 w-full md:h-48">
                        <Image
                          src={currentAd.image}
                          alt={currentAd.content}
                          fill
                          className="object-cover"
                          priority
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentAd.image}
                        alt={currentAd.content}
                        className="h-52 w-full object-cover md:h-48"
                      />
                    )
                  ) : (
                    /* Placeholder gradient when no image */
                    <div
                      className={`hidden md:flex h-48 w-full items-center justify-center text-5xl ${
                        currentAd.type === 'banner'
                          ? 'bg-gradient-to-br from-blue-600/30 to-indigo-800/20'
                          : currentAd.type === 'sponsored'
                          ? 'bg-gradient-to-br from-amber-600/20 to-orange-800/10'
                          : 'bg-gradient-to-br from-emerald-600/20 to-teal-800/10'
                      }`}
                    >
                      {currentAd.type === 'banner' ? '🏙️' : currentAd.type === 'sponsored' ? '🏪' : '📦'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prev / Next buttons */}
            {activeAds.length > 1 && (
              <>
                <button
                  onClick={() => goToSlide('right')}
                  aria-label="Previous slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur transition hover:bg-white/20 hover:scale-110"
                >
                  ‹
                </button>
                <button
                  onClick={() => goToSlide('left')}
                  aria-label="Next slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white backdrop-blur transition hover:bg-white/20 hover:scale-110"
                >
                  ›
                </button>
              </>
            )}

            {/* Dot indicators */}
            {activeAds.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {activeAds.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isAnimating && i !== slideIndex) {
                        setSlideDir(i > slideIndex ? 'left' : 'right');
                        setIsAnimating(true);
                        setTimeout(() => { setSlideIndex(i); setIsAnimating(false); }, 350);
                      }
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === slideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mb-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => void sendMessage(suggestion)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-400/50 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 overflow-y-auto rounded-[28px] border border-white/10 bg-[#0f1727] px-3 py-4 shadow-2xl shadow-black/20 md:px-5">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-4 text-[15px] leading-7 md:max-w-[75%] ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : 'border border-white/10 bg-white/8 text-slate-100'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-3xl border border-white/10 bg-white/8 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0.12s' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" style={{ animationDelay: '0.24s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </section>

        <footer className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ManasaGPT..."
              rows={1}
              disabled={loading}
              className="max-h-48 min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-[#182235] px-4 py-4 text-white outline-none transition placeholder:text-slate-400 focus:border-blue-400"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              className="h-14 rounded-2xl bg-blue-500 px-6 font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="mx-auto mt-2 w-full max-w-4xl text-center text-[10px] text-slate-400">
            ManasaGPT can make mistakes. Check important info. &nbsp;&bull;&nbsp; `Enter` to send, `Shift + Enter` for a new line.
          </p>
        </footer>
      </div>

      {/* ── Order Modal ──────────────────────────────────────────── */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f1727] p-6 shadow-2xl md:rounded-3xl animate-in slide-in-from-bottom duration-300">
            {orderSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-semibold text-white">Order Placed!</h3>
                <p className="text-sm text-slate-300">Shop aapko soon confirm karega.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">🛒 Place Order
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white">{orderModal.productName}</h3>
                    <p className="text-sm text-slate-400">
                      {orderModal.shopName} &nbsp;&bull;&nbsp; ₹{orderModal.productPrice} / item
                    </p>
                  </div>
                  <button
                    onClick={() => setOrderModal(null)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Quantity pill */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-sm text-slate-300">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderForm((f) => ({ ...f, qty: Math.max(1, f.qty - 1) }))}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15"
                    >-</button>
                    <span className="w-6 text-center font-semibold text-white">{orderForm.qty}</span>
                    <button
                      onClick={() => setOrderForm((f) => ({ ...f, qty: f.qty + 1 }))}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/15"
                    >+</button>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-emerald-400">
                    Total: ₹{(orderModal.productPrice * orderForm.qty).toFixed(0)}
                  </span>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-3">
                  {([
                    { key: 'name', placeholder: 'Aapka naam *', type: 'text' },
                    { key: 'phone', placeholder: 'Phone number *', type: 'tel' },
                    { key: 'address', placeholder: 'Delivery address *', type: 'text' },
                    { key: 'note', placeholder: 'Note (optional)', type: 'text' },
                  ] as const).map(({ key, placeholder, type }) => (
                    <input
                      key={key}
                      type={type}
                      placeholder={placeholder}
                      value={orderForm[key]}
                      onChange={(e) => setOrderForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#182235] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                    />
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={() => void handlePlaceOrder()}
                  disabled={orderLoading || !orderForm.name.trim() || !orderForm.phone.trim() || !orderForm.address.trim()}
                  className="mt-4 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {orderLoading ? 'Placing Order...' : '✔ Confirm Order'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
