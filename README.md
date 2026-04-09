# ManasaGPT

An AI-powered city assistant for Datia, helping users discover shops, products, places, and local information through a conversational interface.

## Features

- 🤖 AI Chat Assistant for natural language queries
- 🏪 Shop discovery and information
- 🛍️ Product search and deals
- 🏛️ Places and temples information
- 🌆 City info and guides
- 💰 Sponsored content and monetization
- 🖥️ Admin panel for content management

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Vercel
- **Database:** MongoDB
- **AI:** Groq API (Llama 3.1)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- Groq API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env.local`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start MongoDB locally or use a cloud service like MongoDB Atlas

5. Seed sample data:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) for the chat interface
8. Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel

## API Endpoints

- `POST /api/chat` - Chat with the AI assistant
- `GET /api/shops` - Get all shops
- `POST /api/shops` - Create a new shop
- `PATCH /api/shops/[id]` - Update a shop
- `DELETE /api/shops/[id]` - Delete a shop
- `POST /api/seed` - Seed sample data

## Database Schema

### Shops
- name, category, address, phone, rating, tags, sponsored

### Products
- name, price, shopId, image, category

### Places
- name, type (temple/place), description, timing, location

### Ads
- type, priority, startDate, endDate, content, shopId, productId

### Queries
- userQuery, timestamp, response

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## MVP Scope

- ✅ Chatbot working
- ✅ Basic shops, products, places data
- ✅ Admin panel for shops management
- ✅ AI integration with Groq
- ✅ Dark theme UI

## Future Enhancements

- WhatsApp bot integration
- GPS-based location features
- Reviews and ratings system
- Shop owner login
- Multi-city support
- Advanced analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
# MANASAGPT
