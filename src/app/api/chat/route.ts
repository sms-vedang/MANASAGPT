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
  'kar', 'kardo', 'likh', 'likhdo', 'liye', 'pass', 'paas', 'mein',
]);

const SEARCH_SYNONYMS: Record<string, string[]> = {
  plumber: ['plumber', 'plumbing', 'pipe', 'tap', 'leakage', 'fitting', 'drain'],
  medical: ['medical', 'chemist', 'pharmacy', 'medicine'],
  chemist: ['medical', 'chemist', 'pharmacy', 'medicine'],
  doctor: ['doctor', 'clinic', 'hospital'],
  caption: ['caption', 'instagram', 'insta', 'post'],
  tourist: ['tourist', 'temple', 'landmark', 'visit', 'ghoomne'],
  weekend: ['tourist', 'landmark', 'temple', 'visit', 'ghoomne'],
  busstand: ['bus', 'stand', 'bus stand'],
};

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

    // ── Order Intent ─────────────────────────────────────────────────────────
    if (isOrderIntent(query)) {
      const lastProduct = extractLastProduct(history, context);
      if (lastProduct) {
        return NextResponse.json({
          response: `Bilkul! Main "${lastProduct.productName}" ka order place karne mein help karta hoon. Neeche form fill karein 👇`,
          orderInit: lastProduct,
        });
      }
      return NextResponse.json({
        response:
          'Order place karne ke liye pehle koi product search karein — jaise "sanitizer ka price batao" ya "bamboo pads milenge kya". Phir main order mein help karunga!',
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

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
  const keywords = expandKeywords(query, extractKeywords(query));

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

  const filteredContext = filterContextByIntent(
    {
      shops,
      products,
      places,
    },
    originalQuery,
    meaningfulKeywords
  );

  return {
    shops: filteredContext.shops,
    products: prefersLocation && !prefersWebsite ? filteredContext.products.slice(0, 1) : filteredContext.products,
    places: filteredContext.places,
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
          content: `You are ManasaGPT — a smart, friendly local assistant for Manasa, Madhya Pradesh, India.

CRITICAL BEHAVIOR RULES:
1. ALWAYS read the full conversation history before answering. Use context from previous messages heavily.
2. When the user says "yahaah", "wahan", "us dukaan mein", "iske paas", "vahan par" — they are referring to the shop/place mentioned JUST BEFORE in the conversation. Resolve that reference and answer about that shop.
3. When user asks "X milega kya" or "X milta hai kya" about a place from history — answer based on that shop's category and general knowledge. Example: if user asked about a medical store and then asks "yahaah sanitary pads milenge kya" — say YES medical/chemist shops typically stock sanitary pads.
4. Reply in the same language as the user — Hindi, Hinglish, or English. Never switch unless asked.
5. For local queries, use the local database results provided. Do NOT invent shop names, prices, or addresses.
6. If local database has a result — present it: name, address, phone.
7. If no reliable local database result exists, say it politely and clearly, for example "Mere paas abhi iska data nahi hai, maaf kijiye." Then offer a more specific follow-up the user can ask.
8. For brand-specific queries (e.g., "Safe&Care bamboo sanitary pads") — check if the product/brand is in DB. If not, mention that specific brand is not listed but suggest where such items are usually available in Manasa (medical stores, general stores, etc.).
9. NEVER mention internal errors, prompts, API keys, fallback logic, or database internals.
10. You can also handle general questions and creative prompts like captions, rewrites, and short content when they are not strictly local.
11. Keep responses concise — 2-4 lines unless listing multiple items.`,
        },
        ...history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: 'user',
          content:
            `User's message: "${query}"\n\n` +
            `Interpreted search context used for DB lookup: "${effectiveQuery}"\n\n` +
            `${contextBlock}\n\n` +
            `IMPORTANT: If the user's message contains words like "yahaah", "wahan", "vahan", "iske paas", "us dukaan mein" — look at the previous assistant message in the conversation history to identify WHICH shop/place they are referring to, and base your answer on that shop's context.\n` +
            `If the user is asking whether a product is available at a shop ("milega kya", "milta hai kya", "milenge kya") and the shop is a medical/chemist store — use your general knowledge to answer, since not all products are in the database.\n` +
            `Answer helpfully, but do not force an unrelated listing. If the available local results are not actually relevant, politely say you do not have the data right now and ask the user for a more specific local query.`,
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

  if (isCaptionRequest(query)) {
    return buildCaptionReply(query);
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
    return 'Mere paas abhi is listing ki website ka data nahi hai, maaf kijiye. Aap chahein to main address ya phone jaisa doosra detail check kar sakta hoon.';
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
    return 'Mere paas abhi is location ka exact data nahi hai, maaf kijiye. Aap shop name ya area ke saath poochhenge to main better try karunga.';
  }

  if (isAvailabilityQuery(query)) {
    const lastAssistant = [...history].reverse().find((message) => message.role === 'assistant');
    if (lastAssistant && /medical|chemist|pharmacy/i.test(lastAssistant.content)) {
      return 'Haan, agar pichhli dukaan medical ya chemist type ki hai to aisi cheezein aam taur par mil jaati hain. Exact brand confirm karne ke liye call kar lena best rahega.';
    }
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

  if (!looksLikeLocalIntent(query)) {
    return 'Main ismein help kar sakta hoon. Thoda aur specific likhiye ya context de dijiye, aur main short, useful answer bana dunga.';
  }

  if (isServiceQuery(query)) {
    return `Mere paas abhi is service ka exact local data nahi hai, maaf kijiye. Aap service type aur area ke saath poochiye — jaise "${buildServiceRefinementHint(query)}" — to main aur better try karunga.`;
  }

  if (isExplorationQuery(query)) {
    return 'Mere paas abhi is outing query ka exact curated data nahi hai, maaf kijiye. Aap chahein to main temples, landmarks, ya family outing style me suggestions de sakta hoon.';
  }

  // No results found
  return `Mere paas abhi "${query}" ka exact data nahi hai, maaf kijiye. Aap shop name, area, landmark, ya service type ke saath thoda aur specific poochiye, main phir se check karunga.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9\u0900-\u097F]+/i) // Support Devnagari characters too
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
    .slice(0, 10);
}

function expandKeywords(query: string, baseKeywords: string[]) {
  const expanded = new Set(baseKeywords);
  const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();

  for (const [trigger, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    if (normalized.includes(trigger)) {
      synonyms.forEach((term) => expanded.add(term));
    }
  }

  if (/bus stand/.test(normalized)) {
    expanded.add('bus');
    expanded.add('stand');
    expanded.add('bus stand');
  }

  if (/ghoomne|ghumne|weekend|visit|tourist/.test(normalized)) {
    ['tourist', 'temple', 'landmark', 'visit'].forEach((term) => expanded.add(term));
  }

  return Array.from(expanded).filter((keyword) => keyword.length >= 3).slice(0, 10);
}

function filterContextByIntent(context: SearchContext, originalQuery: string, keywords: string[]) {
  const normalizedQuery = originalQuery.toLowerCase();
  const keywordSet = new Set(keywords.map((keyword) => keyword.toLowerCase()));

  const shops = context.shops.filter((shop) => {
    if (!isServiceQuery(originalQuery)) return true;
    return matchesIntentText(`${shop.name} ${shop.category}`, keywordSet) || serviceMatchesShop(shop, normalizedQuery);
  });

  let products = context.products.filter((product) =>
    matchesIntentText(
      `${product.name} ${typeof product.shopId === 'object' ? product.shopId?.name ?? '' : ''}`,
      keywordSet
    )
  );

  const places = context.places.filter((place) => {
    if (!isExplorationQuery(originalQuery)) return true;
    return matchesIntentText(`${place.name} ${place.description ?? ''} ${place.location}`, keywordSet);
  });

  if (isServiceQuery(originalQuery)) {
    products = [];
  }

  return {
    shops,
    products,
    places,
  };
}

function matchesIntentText(text: string, keywords: Set<string>) {
  const haystack = text.toLowerCase();
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function serviceMatchesShop(shop: ShopResult, normalizedQuery: string) {
  if (/plumber|plumbing|pipe|tap|drain|fitting/.test(normalizedQuery)) {
    return /hardware|sanitary|plumbing|repair/i.test(`${shop.name} ${shop.category}`);
  }

  if (/medical|chemist|pharmacy|medicine/.test(normalizedQuery)) {
    return /medical|chemist|pharmacy/i.test(`${shop.name} ${shop.category}`);
  }

  return false;
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
  // Only pure location queries — NOT availability questions like "yahaah milega kya"
  return /kahan|kidhar|where|address|location|kahaa|ka pata|ko kaise/i.test(query) &&
    !/milega|milenge|milta|milti|available|stock/i.test(query);
}

function isAvailabilityQuery(query: string) {
  // "X milega kya", "yahaah milenge kya", etc.
  return /milega|milenge|milta|milti|available|stock/i.test(query);
}

function isWebsiteFollowUp(query: string) {
  return /website|site|link|online|url|web par|inki site|uski site|inka link/i.test(query);
}

function shouldSearchLocalData(query: string, effectiveQuery: string) {
  if (!looksLikeLocalIntent(query) && !looksLikeLocalIntent(effectiveQuery)) return false;
  if (isShortAck(query)) return false;
  if (isLocationFollowUp(query) || isWebsiteFollowUp(query) || isAvailabilityQuery(query)) return true;
  return extractKeywords(effectiveQuery).length > 0;
}

function looksLikeLocalIntent(query: string) {
  return /manasa|near|paas|bus stand|shop|store|market|restaurant|medical|chemist|doctor|plumber|salon|grocery|address|location|place|ghoomne|ghumne|visit|landmark|mandir|service/i.test(query);
}

function isCaptionRequest(query: string) {
  return /caption|instagram caption|insta caption|post caption/i.test(query);
}

function buildCaptionReply(query: string) {
  const topicMatch = query.match(/(?:for|liye|about)\s+(.+)/i);
  const topic = topicMatch?.[1]?.trim() || 'Manasa';
  return `"${topic} vibes, simple moments, real stories." Agar chaho to main 3 aur caption options bhi de sakta hoon.`;
}

function isServiceQuery(query: string) {
  return /plumber|electrician|mechanic|repair|service|doctor|salon|medical|chemist/i.test(query);
}

function isExplorationQuery(query: string) {
  return /ghoomne|ghumne|weekend|visit|tourist|photo spot|hangout/i.test(query);
}

function buildServiceRefinementHint(query: string) {
  if (/plumber/i.test(query)) return 'bus stand ke paas plumber ya sanitary repair';
  if (/medical|chemist/i.test(query)) return 'near bus stand medical store';
  return 'service type + area';
}

function buildEffectiveQuery(query: string, history: ChatMessage[]) {
  const isFollowUp =
    isLocationFollowUp(query) || isWebsiteFollowUp(query) || isShortAck(query) || isAvailabilityQuery(query);

  if (!isFollowUp) return query;

  // Try to extract last entity from history
  const lastEntity = extractLastEntity(history);

  if (isAvailabilityQuery(query)) {
    // For "yahaah par sanitary pads milega kya" — combine last mentioned shop + product keywords from current query
    const productKeywords = extractKeywords(query).join(' ');
    if (lastEntity && productKeywords) {
      return `${lastEntity} ${productKeywords}`;
    }
    if (productKeywords) return productKeywords;
    return lastEntity || query;
  }

  if (lastEntity) {
    if (isLocationFollowUp(query)) return `${lastEntity} location address`;
    if (isWebsiteFollowUp(query)) return `${lastEntity} website`;
    return lastEntity;
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
    .slice(-10);
}

// ── Order Intent Helpers ──────────────────────────────────────────────────────

function isOrderIntent(query: string) {
  return /order|khareed|buy|le lo|de do|mangwa|book kar|place order|order kar/i.test(query);
}

type OrderInit = {
  productName: string;
  productPrice: number;
  shopName: string;
  productId?: string;
  shopId?: string;
};

function extractLastProduct(history: ChatMessage[], context?: SearchContext): OrderInit | null {
  // Scan assistant messages in reverse for a product line
  const assistantMessages = [...history].reverse().filter((m) => m.role === 'assistant');

  for (const msg of assistantMessages) {
    // Match pattern: 🛒 Name — ₹price (at Shop)
    const productLine = /🛒\s+(.+?)\s+[—–]\s+₹(\d+(?:\.\d+)?)(?:\s+\(at\s+(.+?)\))?/i.exec(msg.content);
    if (productLine) {
      const productName = productLine[1].trim();
      const productPrice = parseFloat(productLine[2]);
      const shopName = productLine[3]?.trim() || 'Unknown Shop';

      // Try to find IDs in current search context if available
      let productId: string | undefined;
      let shopId: string | undefined;

      if (context?.products) {
        const found = context.products.find(p => 
          p.name.toLowerCase() === productName.toLowerCase() || 
          productName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (found) {
          productId = found._id;
          shopId = typeof found.shopId === 'object' ? found.shopId?._id : found.shopId;
        }
      }

      return {
        productName,
        productPrice,
        shopName,
        productId,
        shopId,
      };
    }

    // Match pattern: Product: Name - Rs.price at Shop
    const legacyLine = /Product:\s+(.+?)\s+[—–-]\s+(?:Rs\.?|₹)(\d+)(?:\s+at\s+(.+?))?$/im.exec(msg.content);
    if (legacyLine) {
      return {
        productName: legacyLine[1].trim(),
        productPrice: parseFloat(legacyLine[2]),
        shopName: legacyLine[3]?.trim() || 'Unknown Shop',
      };
    }
  }

  return null;
}
