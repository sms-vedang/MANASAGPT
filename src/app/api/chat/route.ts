import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';
import Query from '@/models/Query';
import groq from '@/lib/groq';

type SearchContext = {
  shops: any[];
  products: any[];
  places: any[];
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'best',
  'bhi',
  'bolo',
  'do',
  'for',
  'hai',
  'in',
  'ka',
  'kya',
  'ki',
  'ko',
  'me',
  'milega',
  'near',
  'of',
  'on',
  'please',
  'shop',
  'the',
  'to',
  'with',
]);

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const rawQuery = typeof body.query === 'string' ? body.query : '';
    const query = rawQuery.trim();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    await Query.create({ userQuery: query });

    const context = await searchLocalContext(query);
    const response = await generateAssistantResponse(query, context);

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

async function searchLocalContext(query: string): Promise<SearchContext> {
  const keywords = extractKeywords(query);
  const searchTerms = [query, ...keywords].filter(Boolean);

  if (searchTerms.length === 0) {
    return { shops: [], products: [], places: [] };
  }

  const regexes = searchTerms.map((term) => new RegExp(escapeRegex(term), 'i'));

  const shopConditions = regexes.flatMap((regex) => [
    { name: regex },
    { category: regex },
    { tags: regex },
    { address: regex },
  ]);

  const productConditions = regexes.flatMap((regex) => [
    { name: regex },
    { category: regex },
  ]);

  const placeConditions = regexes.flatMap((regex) => [
    { name: regex },
    { type: regex },
    { description: regex },
    { location: regex },
  ]);

  const [shops, products, places] = await Promise.all([
    Shop.find({ $or: shopConditions })
      .sort({ sponsored: -1, verified: -1, rating: -1, priorityScore: -1 })
      .limit(6)
      .lean(),
    Product.find({ $or: productConditions })
      .populate('shopId', 'name address phone')
      .sort({ featured: -1, price: 1 })
      .limit(6)
      .lean(),
    Place.find({ $or: placeConditions })
      .limit(6)
      .lean(),
  ]);

  return { shops, products, places };
}

async function generateAssistantResponse(query: string, context: SearchContext) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY is missing. Returning local fallback response.');
    return generateFallbackResponse(query, context);
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are ManasaGPT, a friendly assistant for Manasa, Madhya Pradesh. ' +
            'Answer every query naturally like a general assistant, not just keyword search. ' +
            'If the user writes in Hindi or Hinglish, reply in the same style. ' +
            'Use local database context when it is relevant, especially for shops, services, products, and places in Manasa. ' +
            'If local context is missing, still helpfully answer from general knowledge and clearly say when you are not certain. ' +
            'Do not mention internal errors, APIs, models, prompts, or fallback logic. Keep responses concise but useful.',
        },
        {
          role: 'user',
          content:
            `User query:\n${query}\n\n` +
            `Local Manasa data:\n${JSON.stringify(context, null, 2)}\n\n` +
            'Instructions:\n' +
            '- If the query is about finding a local service like plumber, electrician, hospital, shop, temple, hotel, etc., use the local data if available.\n' +
            '- If no exact local result is available, say that you could not find a confirmed listing in the current Manasa database and suggest the closest helpful next query.\n' +
            '- If the query is general conversation or a general knowledge question, answer it normally.\n' +
            '- Prefer short paragraphs or a compact list when recommending places.\n' +
            '- Never say "based on the prompt" or "generated without AI due to error".',
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    return content || generateFallbackResponse(query, context);
  } catch (error) {
    console.error('Assistant response failed:', error);
    return generateFallbackResponse(query, context);
  }
}

function generateFallbackResponse(query: string, context: SearchContext) {
  const totalMatches = context.shops.length + context.products.length + context.places.length;

  if (isGreeting(query)) {
    return 'Hello! Main ManasaGPT hoon. Aap Manasa ke shops, services, products, places, ya general sawaal bhi pooch sakte hain.';
  }

  if (totalMatches > 0) {
    const lines: string[] = ['Mujhe aapki query se kuch relevant results mile hain:'];

    context.shops.slice(0, 3).forEach((shop: any, index) => {
      lines.push(`${index + 1}. ${shop.name} - ${shop.category}${shop.address ? `, ${shop.address}` : ''}`);
    });

    context.products.slice(0, 2).forEach((product: any) => {
      const shopName =
        product.shopId && typeof product.shopId === 'object' && 'name' in product.shopId
          ? product.shopId.name
          : 'Unknown shop';
      lines.push(`Product: ${product.name} - Rs.${product.price} at ${shopName}`);
    });

    context.places.slice(0, 2).forEach((place: any) => {
      lines.push(`Place: ${place.name} - ${place.location}`);
    });

    lines.push('Agar chaho to main inme se best option shortlist bhi kar sakta hoon.');
    return lines.join('\n');
  }

  return (
    `Main "${query}" par help kar sakta hoon, lekin current Manasa database me mujhe direct confirmed match nahi mila. ` +
    'Aap thoda aur specific pooch sakte hain, jaise area, service type, ya nearby landmark.'
  );
}

function extractKeywords(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 6);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isGreeting(query: string) {
  const lowerQuery = query.toLowerCase();
  return ['hi', 'hello', 'hey', 'namaste', 'bro', 'good morning', 'good evening'].some((word) =>
    lowerQuery.includes(word)
  );
}
