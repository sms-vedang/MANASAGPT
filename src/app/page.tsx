'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
    } catch (error) {
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
          <div className="hidden text-sm text-slate-300 md:block">
            Local discovery + general assistant
          </div>
        </header>

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
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
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
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                      style={{ animationDelay: '0.12s' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                      style={{ animationDelay: '0.24s' }}
                    />
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
