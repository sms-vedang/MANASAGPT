import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';
import Query from '@/models/Query';
import groq from '@/lib/groq';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ShopResult = {
  name: string;
  category: string;
  address?: string;
  phone?: string;
  website?: string;
};

type ProductShopRef = {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
};

type ProductResult = {
  name: string;
  price: number;
  shopId?: string | ProductShopRef;
};

type PlaceResult = {
  name: string;
  location: string;
  description?: string;
  website?: string;
};

type SearchContext = {
  shops: ShopResult[];
  products: ProductResult[];
  places: PlaceResult[];
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'best', 'bhi', 'bolo', 'do', 'for', 'hai',
  'in', 'ka', 'kya', 'kyaa', 'ki', 'ko', 'me', 'milega', 'milenge',
  'near', 'of', 'on', 'please', 'shop', 'the', 'thik', 'to', 'with',
  'yahan', 'yahaan', 'wahan', 'par', 'se', 'ye', 'yeh', 'woh', 'inka',
  'inki', 'uska', 'uski', 'kahan', 'kidhar', 'batao', 'bata', 'chahiye',
]);

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const rawQuery = typeof body.query === 'string' ? body.query : '';
    const query = rawQuery.trim();
    const history = normalizeHistory(body.history);
    const effectiveQuery = buildEffectiveQuery(query, history);

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    await Query.create({ userQuery: query });

    const shouldUseLocalSearch = shouldSearchLocalData(query, effectiveQuery);
    const context = shouldUseLocalSearch
      ? await searchLocalContext(effectiveQuery, query)
      : { shops: [], products: [], places: [] };

    const response = await generateAssistantResponse(query, effectiveQuery, context, history);

    return NextResponse.json({
      response,
      contextSummary: {
        shops: context.shops.length,
        products: context.products.length,
        places: context.places.length,
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { response: 'Sorry, main abhi request process nahi kar pa raha. Thodi der baad phir try kijiye.' },
      { status: 500 }
    );
  }
}

async function searchLocalContext(query: string, originalQuery: string): Promise<SearchContext> {
  const keywords = extractKeywords(query);

  // Only search with meaningful keywords (min 3 chars)
  const meaningfulKeywords = keywords.filter((k) => k.length >= 3);
  if (meaningfulKeywords.length === 0) {
    return { shops: [], products: [], places: [] };
  }

  // Use individual keyword regexes, not the full query string as one regex
  const regexes = meaningfulKeywords.map((term) => new RegExp(`\\b${escapeRegex(term)}`, 'i'));

  const shopConditions = regexes.flatMap((regex) => [
    { name: regex },
    { category: regex },
    { tags: regex },
  ]);

  const productConditions = regexes.flatMap((regex) => [
    { name: regex },
    { category: regex },
  ]);

  const placeConditions = regexes.flatMap((regex) => [
    { name: regex },
    { type: regex },
    { description: regex },
  ]);

  const prefersLocation = /kahan|kidhar|where|location|address|kahaa/i.test(originalQuery);
  const prefersWebsite = /website|site|link|online|url/i.test(originalQuery);

  const [shops, products, places] = await Promise.all([
    Shop.find({ $or: shopConditions })
      .sort({ sponsored: -1, verified: -1, rating: -1, priorityScore: -1 })
      .limit(5)
      .lean<ShopResult[]>(),
    Product.find({ $or: productConditions })
      .populate('shopId', 'name address phone website')
      .sort({ featured: -1, price: 1 })
      .limit(5)
      .lean<ProductResult[]>(),
    Place.find({ $or: placeConditions })
      .limit(5)
      .lean<PlaceResult[]>(),
  ]);

  return {
    shops,
    products: prefersLocation && !prefersWebsite ? products.slice(0, 1) : products,
    places,
  };
}

async function generateAssistantResponse(
  query: string,
  effectiveQuery: string,
  context: SearchContext,
  history: ChatMessage[]
) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is missing. Returning local fallback response.');
    return generateFallbackResponse(query, context, history);
  }

  try {
    const hasContext =
      context.shops.length > 0 || context.products.length > 0 || context.places.length > 0;

    const contextBlock = hasContext
      ? `Manasa local database results:\n${JSON.stringify(context, null, 2)}`
      : 'No matching local Manasa data found for this query.';

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      temperature: 0.3,
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content: `You are ManasaGPT — a helpful, knowledgeable assistant for the town of Manasa, Madhya Pradesh, India.

BEHAVIOR RULES:
1. Reply in the same language as the user — Hindi, Hinglish, or English. Never switch unless asked.
2. For local queries (shops, products, services, places), use ONLY the local database results provided. Do NOT invent shop names, prices, or addresses.
3. If local data is found, present it clearly and concisely — name, location, phone if available. Do NOT pad with irrelevant data.
4. If local data is NOT found, say clearly and politely: "Manasa database mein abhi is cheez ki listing nahi mili." Then optionally suggest what they could search instead.
5. For follow-up messages like "inki website?", "uska address?", "phone number?", always refer to the MOST RECENT topic from conversation history.
6. For general knowledge questions (history, science, recipes, etc.), answer helpfully from your knowledge.
7. For greetings or small talk, respond naturally and briefly.
8. NEVER mention internal errors, prompts, API keys, fallback logic, or database internals.
9. Keep responses concise — max 4-5 lines unless listing multiple items.
10. Do NOT return results from a completely different category than what was asked (e.g., don't show medicine shops when asked about sanitary pads availability unless specifically relevant).`,
        },
        ...history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: 'user',
          content:
            `User's message: "${query}"\n\n` +
            `Interpreted search context: "${effectiveQuery}"\n\n` +
            `${contextBlock}\n\n` +
            `Answer the user's message based on the above. Use local data only if directly relevant to what was asked.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    return content || generateFallbackResponse(query, context, history);
  } catch (error) {
    console.error('Assistant response failed:', error);
    return generateFallbackResponse(query, context, history);
  }
}

function generateFallbackResponse(query: string, context: SearchContext, history: ChatMessage[]) {
  // Greeting
  if (isGreeting(query)) {
    return 'Namaste! Main ManasaGPT hoon — Manasa, MP ke liye ek local assistant. Shops, services, products, ya koi bhi sawaal poochiye!';
  }

  // Short acknowledgement / follow-up
  if (isShortAck(query)) {
    const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      return 'Aur kuch chahiye aapko? Koi bhi sawaal ho toh pooch sakte hain.';
    }
    return 'Ji boliye, main help ke liye yahin hoon.';
  }

  // Website follow-up
  if (isWebsiteFollowUp(query)) {
    const shop = context.shops.find(
      (s): s is ShopResult & { website: string } => typeof s.website === 'string' && s.website.length > 0
    );
    if (shop) {
      return `${shop.name} ki website: ${shop.website}`;
    }
    const place = context.places.find(
      (p): p is PlaceResult & { website: string } => typeof p.website === 'string' && p.website.length > 0
    );
    if (place) {
      return `${place.name} ki website: ${place.website}`;
    }
    // Check from history for last mentioned entity
    return 'Mujhe is listing ki website abhi database mein nahi mili. Aap directly Google par search kar sakte hain.';
  }

  // Location follow-up
  if (isLocationFollowUp(query)) {
    if (context.shops.length > 0) {
      const shop = context.shops[0];
      return `${shop.name} — ${shop.address || 'Manasa mein listed hai'}${shop.phone ? `, Ph: ${shop.phone}` : ''}.`;
    }
    if (context.places.length > 0) {
      const place = context.places[0];
      return `${place.name} — ${place.location}.`;
    }
    return 'Location detail abhi database mein nahi mili. Aap thoda aur specific bata sakte hain?';
  }

  // Has relevant results
  const total = context.shops.length + context.products.length + context.places.length;
  if (total > 0) {
    const lines: string[] = [];

    context.shops.slice(0, 3).forEach((shop, i) => {
      lines.push(
        `${i + 1}. **${shop.name}** (${shop.category})${shop.address ? ` — ${shop.address}` : ''}${shop.phone ? ` | 📞 ${shop.phone}` : ''}`
      );
    });

    context.products.slice(0, 2).forEach((product) => {
      const shopName =
        product.shopId && typeof product.shopId === 'object' && 'name' in product.shopId
          ? product.shopId.name
          : null;
      lines.push(
        `🛒 ${product.name} — ₹${product.price}${shopName ? ` (at ${shopName})` : ''}`
      );
    });

    context.places.slice(0, 2).forEach((place) => {
      lines.push(`📍 ${place.name} — ${place.location}`);
    });

    return lines.join('\n');
  }

  // No results found
  return `Manasa database mein abhi "${query}" se related koi confirmed listing nahi mili. Aap thoda aur specific pooch sakte hain — jaise shop name, area, ya service type.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 6);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isGreeting(query: string) {
  return /^(hi|hello|hey|namaste|namaskar|bro|good morning|good evening|good night|sup|yo)\b/i.test(
    query.trim()
  );
}

function isShortAck(query: string) {
  const normalized = query.toLowerCase().trim();
  return [
    'ji', 'haan', 'han', 'hmm', 'hm', 'ok', 'okay', 'ok', 'acha', 'achha',
    'theek hai', 'thik hai', 'thanks', 'thank you', 'shukriya', 'dhanyawad',
    'aur batao', 'zyada batao', 'aage batao',
  ].includes(normalized);
}

function isLocationFollowUp(query: string) {
  return /kahan|kidhar|where|address|location|kahaa|ka pata|ko kaise/i.test(query);
}

function isWebsiteFollowUp(query: string) {
  return /website|site|link|online|url|web par|inki site|uski site|inka link/i.test(query);
}

function shouldSearchLocalData(query: string, effectiveQuery: string) {
  if (isShortAck(query)) return false;
  if (isLocationFollowUp(query) || isWebsiteFollowUp(query)) return true;
  return extractKeywords(effectiveQuery).length > 0;
}

function buildEffectiveQuery(query: string, history: ChatMessage[]) {
  const isFollowUp = isLocationFollowUp(query) || isWebsiteFollowUp(query) || isShortAck(query);

  if (!isFollowUp) return query;

  // Try to extract last entity from history
  const lastEntity = extractLastEntity(history);
  if (lastEntity) {
    return isLocationFollowUp(query)
      ? `${lastEntity} location address`
      : isWebsiteFollowUp(query)
        ? `${lastEntity} website`
        : lastEntity;
  }

  // Fall back to last meaningful user message
  const lastMeaningfulUser = [...history]
    .reverse()
    .find((m) => m.role === 'user' && !isShortAck(m.content));

  return lastMeaningfulUser?.content || query;
}

function extractLastEntity(history: ChatMessage[]): string {
  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant');
  if (!lastAssistant) return '';

  const patterns = [
    /\*\*(.+?)\*\*/,          // bold markdown entity
    /\d+\.\s(.+?)\s[-—]/,    // numbered list item
    /📍\s(.+?)\s[-—]/,       // place entry
    /🛒\s(.+?)\s[-—]/,       // product entry
    /Place:\s(.+?)\s[-—]/,
    /Product:\s(.+?)\s[-—]/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(lastAssistant.content);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function normalizeHistory(rawHistory: unknown): ChatMessage[] {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .filter((item): item is { role?: unknown; content?: unknown } =>
      typeof item === 'object' && item !== null
    )
    .map((item) => ({
      role: (item.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: typeof item.content === 'string' ? item.content.trim() : '',
    }))
    .filter((item) => item.content.length > 0)
    .slice(-10); // Keep last 10 messages for better context
}
