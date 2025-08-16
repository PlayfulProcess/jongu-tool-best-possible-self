# Jongu Tool BPS - Best Possible Self Journaling

A focused implementation of the Best Possible Self journaling exercise, based on research from UC Berkeley's Greater Good Science Center.

Featured as the www.jongu.org tool.

## Features

- 📝 Guided journaling with the Best Possible Self exercise
- 🤖 AI-powered assistant for reflection and insights
- 💾 Secure data storage with privacy controls
- ⏱️ Session timer to track writing time
- 🎯 Focus mode for distraction-free writing
- 📱 Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository
```bash
git clone [your-repo-url]
cd jongu-tool-bps
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `OPENAI_API_KEY`: Your OpenAI API key
- `NEXT_PUBLIC_APP_URL`: Your app URL (for production)

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI**: OpenAI GPT-4 via LangChain
- **Auth**: Supabase Auth (Email only)
- **Deployment**: Vercel

## Privacy & Research

The app includes privacy controls allowing users to:
- Keep entries completely private
- Save entries privately to their account
- Optionally consent to research use of anonymized data

## License

This project is based on research from UC Berkeley's Greater Good Science Center.
