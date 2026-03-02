# EduBank PH - College Budget Planner

A professional fintech-inspired budget planner for comparing the "Big 4" university costs in the Philippines.

## Tech Stack
- **Frontend**: Vite + React + Tailwind CSS 4 (Deployed to Cloudflare Pages)
- **Backend**: Cloudflare Workers (Hono framework)
- **AI**: Gemini 1.5 Flash (via Google AI SDK) with Google Search grounding
- **Icons**: Lucide-React

## Features
- **AI Course Search**: Normalizes course names and provides auto-suggestions.
- **The Big 4 Matrix**: Side-by-side comparison for UP Diliman, ADMU, DLSU, and UST.
- **Smart Grounding**: Fetches LATEST 2024-2025 data via real-time search.
- **Forecasting**: Estimates Year 2-4 costs with a 6% annual inflation forecast.
- **Dev Inspector**: Real-time monitoring of token usage and PHP cost.

## Setup Instructions

### 1. Backend (Worker)
```bash
cd worker
npm install
```
Set your `GEMINI_API_KEY` in Cloudflare Secrets:
```bash
npx wrangler secret put GEMINI_API_KEY
```
Run locally:
```bash
npm run dev
```

### 2. Frontend (Client)
```bash
cd client
npm install
npm run dev
```

## Localization
- **Currency**: Philippine Peso (₱)
- **Timezone**: Manila (GMT+0800)
- **Normalization**: DLSU (Trimestral) converted to Semestral equivalent for comparison.
