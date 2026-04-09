import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Shop from '@/models/Shop';
import Product from '@/models/Product';
import Place from '@/models/Place';
import Query from '@/models/Query';
import groq from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const bodyText = await request.text();
    
    let body;
    try {
      // The body is coming as an escaped JSON string
      let cleanText = bodyText;
      
      // Unescape the JSON string
      cleanText = cleanText.replace(/\\"/g, '"'); // Unescape quotes
      cleanText = cleanText.replace(/\\\\/g, '\\'); // Unescape backslashes
      
      body = JSON.parse(cleanText);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Query:', query);

    // Log the query
    await Query.create({ userQuery: query });
    console.log('Query logged');

    // Use AI to classify the query
    const classification = await classifyQuery(query);
    console.log('Classification:', classification);

    let results: any[] = [];

    switch (classification.intent) {
      case 'shop':
        console.log('Searching for shops with category:', classification.category);
        results = await Shop.find({
          $or: [
            { name: { $regex: classification.category, $options: 'i' } },
            { category: { $regex: classification.category, $options: 'i' } },
            { tags: { $in: [classification.category] } }
          ]
        }).sort({ sponsored: -1, rating: -1 }).limit(5);
        console.log('Shop results:', results.length);
        break;
      case 'product':
        console.log('Searching for products');
        results = await Product.find({
          name: { $regex: classification.category, $options: 'i' }
        }).populate('shopId').sort({ price: 1 }).limit(5);
        console.log('Product results:', results.length);
        break;
      case 'place':
        console.log('Searching for places');
        results = await Place.find({
          $or: [
            { name: { $regex: classification.category, $options: 'i' } },
            { type: classification.category }
          ]
        }).limit(5);
        console.log('Place results:', results.length);
        break;
      case 'info':
        console.log('Info query, generating AI response');
        // For city info, use AI to generate response
        const aiResponse = await generateInfoResponse(query);
        return NextResponse.json({ response: aiResponse });
      default:
        console.log('Unknown intent');
        return NextResponse.json({ response: 'Sorry, I couldn\'t understand your query.' });
    }

    // Generate response using AI
    console.log('Generating response with', results.length, 'results');
    const response = await generateResponse(query, results, classification.intent);
    console.log('Response generated');

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function classifyQuery(query: string) {
  // Simple rule-based classification as fallback
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('store') || lowerQuery.includes('shop') || lowerQuery.includes('restaurant') || lowerQuery.includes('salon') || lowerQuery.includes('hotel')) {
    let category = 'general';
    if (lowerQuery.includes('medical') || lowerQuery.includes('pharmacy')) category = 'medical';
    else if (lowerQuery.includes('salon') || lowerQuery.includes('beauty')) category = 'salon';
    else if (lowerQuery.includes('restaurant') || lowerQuery.includes('food')) category = 'restaurant';
    return { intent: 'shop', category };
  }

  if (lowerQuery.includes('product') || lowerQuery.includes('buy') || lowerQuery.includes('price')) {
    return { intent: 'product', category: lowerQuery };
  }

  if (lowerQuery.includes('temple') || lowerQuery.includes('mandir') || lowerQuery.includes('place') || lowerQuery.includes('palace') || lowerQuery.includes('fort')) {
    let category = 'place';
    if (lowerQuery.includes('temple') || lowerQuery.includes('mandir')) category = 'temple';
    return { intent: 'place', category };
  }

  // For info queries, try AI but with simpler prompt
  try {
    const prompt = `Classify this query as "shop", "product", "place", or "info": "${query}". Return only one word.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content?.trim().toLowerCase();
    if (content && ['shop', 'product', 'place', 'info'].includes(content)) {
      return { intent: content, category: query };
    }
  } catch (e) {
    console.error('AI classification failed:', e);
  }

  return { intent: 'info', category: '' };
}

async function generateInfoResponse(query: string) {
  // Temporary mock response
  return `I can help you with information about Datia. You asked: "${query}". This is a placeholder response while we fix the AI integration.`;
}

async function generateResponse(query: string, results: any[], intent: string) {
  // Temporary mock response
  let response = `I found ${results.length} results for your query: "${query}"\n\n`;

  if (results.length > 0) {
    results.forEach((item, index) => {
      response += `${index + 1}. ${item.name}\n`;
      if (intent === 'shop') {
        response += `   📍 ${item.address}\n   📞 ${item.phone}\n`;
      } else if (intent === 'product') {
        response += `   💰 ₹${item.price}\n`;
      } else if (intent === 'place') {
        response += `   📍 ${item.location}\n`;
      }
      response += '\n';
    });
  } else {
    response += 'No specific results found in our database.';
  }

  return response;
}