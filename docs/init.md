# Project: EduBank PH - College Budget Planner

## Tech Stack

* **Frontend**: Vite + React + Tailwind CSS (Deploy to Cloudflare Pages)

* **Backend**: Cloudflare Workers (using Hono framework)

* **AI**: Gemini 1.5 Flash via Google AI SDK

* **Icons**: Lucide-React

* **Indentation**: 2 spaces (No tabs!)

## Core Functionality

1. **Course Search**: Implement a search bar for Philippine university courses (e.g., BS Computer Science, BS Nursing). Use Gemini 1.5 Flash for auto-suggestions and to normalize course names.

2. **The Big 4 Matrix**: Generate a side-by-side comparison table for UP Diliman, Ateneo (ADMU), De La Salle (DLSU), and UST.

3. **Smart Grounding**: All API calls to Gemini must use `Google Search` grounding to fetch the LATEST 2024-2025 tuition fees and miscellaneous charges. Do not rely on training data.

4. **Localization**:

   * Currency: Philippine Peso (₱)

   * Timezone: Manila (GMT+0800)

   * Language: English (PH context)

5. **Logic**:

   * Normalize DLSU (Trimestral) into a Semestral view for direct comparison.

   * Account for the "Free Tuition Act" for UP Diliman (Misc fees only).

   * Apply a default 6% annual inflation forecast for years 2-4.

## UI/UX Requirements

* **Theme**: Fintech Professional (Deep Indigo, Cyan, Slate).

* **Mobile First**: The matrix must have a sticky first column (Timeline) for horizontal scrolling on mobile.

* **Dev Inspector**: Include a fixed overlay showing Token Usage (Prompt/Candidate) and the estimated cost in PHP based on current Flash rates (\~₱0.0044/1k tokens).

## Backend (Cloudflare Workers)

* Use Hono for routing.

* Implement an endpoint `POST /api/compare` that takes a `courseName`.

* Secure the Gemini API Key using Cloudflare Secrets (`GENIMNI_API_KEY`).

* Return structured JSON containing:

  * University specific fee breakdowns.

  * Usage metadata for the Dev Inspector.

  * Grounding attributions for data transparency.

## Deployment Instructions

* Configure `wrangler.toml` for the Worker.

* Set up Cloudflare Pages for the React build output.

* Ensure all source code uses 2-space indentation.