# DivorceOS

AI-powered California divorce law assistant with court forms access and legal guidance.

## Features

- **AI Chat with Alex** - Get instant answers about California divorce law
- **Court Forms Library** - Access 50+ official California divorce forms
- **Legal Guidance** - Information on custody, support, property division, and domestic violence
- **User Accounts** - Save chat history and manage your profile

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui components
- React Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/divorceos.git
cd divorceos
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will auto-detect Vite and configure the build settings
4. Your site will be deployed automatically on every push

### Build Settings for Vercel

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── data/          # Static data (forms, etc.)
├── pages/         # Page components
├── services/      # API and business logic
├── App.tsx        # Main app component
└── main.tsx       # Entry point
```

## Environment Variables

Create a `.env.local` (for browser-safe keys) and `.env.server` (for serverless-only secrets) when developing locally. On Vercel, set the same keys in Project → Settings → Environment Variables.

```env
# AI providers
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.1
VITE_KIMI_API_KEY=moonshot-...

# Secure document vault (server-side only)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key
SUPABASE_STORAGE_BUCKET=divorceos-vault

# Intake + mission control (server-side only)
AGENTMAIL_API_KEY=am_...
AGENTMAIL_INBOX_ID=divorceos@agentmail.to
PAPERCLIP_API_URL=http://localhost:3100/api
PAPERCLIP_API_KEY=pc_sk_...
PAPERCLIP_COMPANY_ID=company_...
```

> ⚠️ Never expose the Supabase service-role key to the browser. Keep it in `.env.server` locally and in Vercel’s encrypted serverless env vars so only API routes can access it.

### Syncing the concierge queue

Use the intake sync script to pull new filings from all configured sources (AgentMail, Paperclip mission control, etc.):

```bash
npm run sync:queue -- agentmail paperclip
```

If you omit the trailing arguments, the script will try every source listed in the default array. Each source checks for its required environment variables before running, so you can enable them one at a time.

## License

MIT

## Disclaimer

DivorceOS provides general information about California divorce law. It is not a substitute for legal advice from a qualified attorney. Always consult with a California family law attorney for advice specific to your situation.
