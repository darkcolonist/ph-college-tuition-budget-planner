# Publishing Guide: EduBank PH

This document provides a step-by-step guide to hosting the EduBank PH project on Cloudflare.

## 🚀 Overview

The project is split into:
1.  **Backend**: Cloudflare Worker (Hono + Gemini AI)
2.  **Frontend**: Cloudflare Pages (Vite + React)

---

## 🛠 Prerequisites

-   [Cloudflare Account](https://dash.cloudflare.com/sign-up)
-   [Gemini API Key](https://aistudio.google.com/app/apikey)
-   Node.js (LTS) installed

---

## 📦 Step 1: Deploy the Backend (Worker)

The worker handles the AI logic and university data comparison.

1.  **Login to Wrangler**:
    ```bash
    cd worker
    npx wrangler login
    ```

2.  **Deploy the Worker**:
    ```bash
    npx wrangler deploy
    ```
    *Note: Take note of the deployed URL (e.g., `https://edubank-ph-worker.<user>.workers.dev`).*

3.  **Add your Gemini API Key**:
    ```bash
    npx wrangler secret put GEMINI_API_KEY
    ```
    *Paste your API key when prompted.*

---

## 🎨 Step 2: Configure the Frontend for Production

Update the frontend to point to your live worker instead of `localhost`.

1.  **Create Production Env**:
    In `client/`, create a `.env.production` file:
    ```env
    VITE_API_URL=https://edubank-ph-worker.<your-subdomain>.workers.dev
    ```

2.  **Ensure Environment Logic**:
    Your `App.jsx` and `Search.jsx` should use `import.meta.env.VITE_API_URL || ''`.

---

## 📄 Step 3: Deploy the Frontend (Pages)

### Option A: Direct Upload (Manual)

1.  **Build the project**:
    ```bash
    cd client
    npm run build
    ```

2.  **Deploy to Pages**:
    ```bash
    npx wrangler pages deploy dist
    ```
    *Follow the prompts to create a new project named `edubank-ph`.*

### Option B: Git-Based Deployment (Recommended)

1.  Connect your GitHub repository to Cloudflare Pages.
2.  **Build Command**: `npm run build`
3.  **Build Output Directory**: `dist`
4.  **Root Directory**: `client`

---

## 🔒 Step 4: Final Security Check (CORS)

Ensure your `worker/src/index.ts` allows requests from your Pages domain.

```typescript
import { cors } from 'hono/cors'

app.use('/api/*', cors({
  origin: ['https://edubank-ph.pages.dev'], // or your custom domain
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}))
```

---

## ✅ Deployment Checklist

- [ ] Worker deployed and URL confirmed.
- [ ] `GEMINI_API_KEY` added as a secret.
- [ ] `VITE_API_URL` set in `.env.production`.
- [ ] CORS allowed for the frontend domain.
- [ ] Pages build successful.
