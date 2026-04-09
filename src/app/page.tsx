'use client';

import Image from 'next/image';
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    void fetchAds();
    void fetchSession();
  }, []);

  const activeAds = useMemo(() => {
    const now = new Date();
    return ads.filter((ad) => {
      const starts = new Date(ad.startDate) <= now;
      const ends = !ad.endDate || new Date(ad.endDate) >= now;
      return starts && ends;
    });
  }, [ads]);

  const bannerAd = activeAds
    .filter((ad) => ad.type === 'banner')
    .sort((a, b) => b.priority - a.priority)[0];

  const sponsoredAds = activeAds
    .filter((ad) => ad.type !== 'banner')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

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

        {bannerAd && (
          <section className="mb-4 overflow-hidden rounded-[28px] border border-white/10 bg-[#132038]">
            <div className="grid items-center gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-blue-200/80">Featured Banner</p>
                <h2 className="text-2xl font-semibold text-white">{bannerAd.content}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  ManasaGPT par highlighted city promotion ab live hai. Admin panel se banner content aur priority update kar sakte ho.
                </p>
              </div>
              {bannerAd.image && (
                bannerAd.image.startsWith('/') ? (
                  <div className="relative h-56 w-full md:h-full">
                    <Image src={bannerAd.image} alt={bannerAd.content} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 40vw" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerAd.image} alt={bannerAd.content} className="h-56 w-full object-cover md:h-full" />
                )
              )}
            </div>
          </section>
        )}

        {sponsoredAds.length > 0 && (
          <section className="mb-4 grid gap-3 md:grid-cols-2">
            {sponsoredAds.map((ad) => (
              <div key={ad._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {ad.type === 'sponsored' ? 'Sponsored Shop' : 'Featured Product'}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{ad.content}</p>
                <p className="mt-1 text-sm text-slate-300">
                  {ad.shopId?.name || ad.productId?.name || 'Promotion active'}
                </p>
              </div>
            ))}
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
          <p className="mx-auto mt-2 w-full max-w-4xl text-xs text-slate-400">
            `Enter` to send, `Shift + Enter` for a new line.
          </p>
        </footer>
      </div>
    </main>
  );
}
