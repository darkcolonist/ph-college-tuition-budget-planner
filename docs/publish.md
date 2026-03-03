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

### Option A: Local Deployment (Manual)

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

### Option B: Git-Based Deployment (Recommended)

1.  **Get a Cloudflare API Token**:
    - Go to [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
    - Create a token using the "Edit Cloudflare Workers" template.
2.  **Add GitHub Secret**:
    - In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
    - Add a new repository secret named `CLOUDFLARE_API_TOKEN` with your token.
3.  **Automatic Deployment**:
    - The project includes a GitHub Action ([`.github/workflows/deploy-worker.yml`](../.github/workflows/deploy-worker.yml)) that automatically deploys the worker whenever you push changes to the `main` branch under the `worker/` directory.

> [!NOTE]
> You still need to manually set the `GEMINI_API_KEY` secret once using `npx wrangler secret put GEMINI_API_KEY` or through the Cloudflare Dashboard for the worker.

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

The worker is configured to pull the allowed origin from the `ALLOWED_ORIGIN` environment variable. If not set, it defaults to `*` (anywhere).

1.  **Set the Allowed Origin (Optional but Recommended)**:
    ```bash
    npx wrangler secret put ALLOWED_ORIGIN
    ```
    *Paste your frontend URL (e.g., `https://edubank-ph.pages.dev`).*

2.  **Verify Configuration**:
    Your `worker/src/index.ts` automatically handles this logic:
    ```typescript
    origin: c.env.ALLOWED_ORIGIN || '*'
    ```

---

## ✅ Deployment Checklist

- [ ] Worker deployed and URL confirmed.
- [ ] `GEMINI_API_KEY` added as a secret.
- [ ] `VITE_API_URL` set in `.env.production`.
- [ ] CORS allowed for the frontend domain.
- [ ] Pages build successful.
