import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Bindings = {
  GEMINI_API_KEY: string
  ALLOWED_ORIGIN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Simple in-memory rate limiter (resets on Worker restart)
// In production, using Cloudflare KV or D1 is more reliable.
const RATE_LIMITS = new Map<string, { count: number, timestamp: number }>()
const MAX_COMPARISONS_PER_HOUR = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-visitor-ip'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
  return corsMiddleware(c, next)
})

/**
 * Normalization logic (System instruction):
 * - DLSU: 3 terms -> 2 sems (Annual total / 2)
 * - UP: Tuition is 0, misc remains.
 * - Inflation: 6% compounding.
 */
const SYSTEM_INSTRUCTION = `
You are an expert in Philippine Higher Education costs for the Academic Year 2024-2025.
Your task is to provide a detailed cost breakdown for the "Big 4" universities: UP Diliman, Ateneo (ADMU), DLSU, and UST.

COURSE: {courseName}

INPUT GUIDELINES:
1. Normalize course names (e.g., "BS CS" -> "Bachelor of Science in Computer Science").
2. Search specifically for 2024-2025 tuition and miscellaneous fees.
3. ACCOUNT FOR FREE TUITION: For UP Diliman, set tuitionFee to 0 (assume covered by RA 10931), but fetch miscellaneous fees.
4. NORMALIZE DLSU: DLSU is trimestral. Provide separate 'originalFees' (per term) and 'normalizedFees' (calculated as (Term_Cost * 3) / 2 to show a semestral view for direct comparison).
5. INFLATION: Apply a 6% annual inflation forecast for years 2-4 based on Year 1 total cost.

RESPONSE FORMAT (STRICT JSON):
{
  "normalizedCourseName": "string",
  "universities": [
    {
      "name": "University of the Philippines Diliman",
      "abbreviation": "UP",
      "year1": {
        "tuitionFee": number,
        "miscFees": number,
        "total": number,
        "isTrimestral": false,
        "notes": "string"
      },
      "projection": [
        { "year": 2, "estimatedTotal": number },
        { "year": 3, "estimatedTotal": number },
        { "year": 4, "estimatedTotal": number }
      ]
    },
    ... similar for ADMU, DLSU, UST
  ],
  "groundingSources": "string summary of links",
  "meta": {
    "calculationBasis": "Semestral (PHP)",
    "inflationRate": "6%"
  }
}
`

app.post('/api/compare', async (c) => {
  const { courseName } = await c.req.json()
  const apiKey = c.env.GEMINI_API_KEY
  
  // Rate Limiting Logic
  const ip = c.req.header('cf-connecting-ip') || 'anon'
  const now = Date.now()
  const record = RATE_LIMITS.get(ip)

  if (record) {
    if (now - record.timestamp < WINDOW_MS) {
      if (record.count >= MAX_COMPARISONS_PER_HOUR) {
        return c.json({ 
          error: 'Rate limit exceeded. Please try again after an hour to save on API usage.',
          isLimit: true 
        }, 429)
      }
      record.count++
    } else {
      RATE_LIMITS.set(ip, { count: 1, timestamp: now })
    }
  } else {
    RATE_LIMITS.set(ip, { count: 1, timestamp: now })
  }

  if (!apiKey) {
    return c.json({ error: 'API key is missing' }, 500)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    tools: [{ googleSearch: {} } as any]
  })

  const prompt = SYSTEM_INSTRUCTION.replace('{courseName}', courseName)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)

    const metadata = {
      promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
      estimatedCostPhp: ((response.usageMetadata?.totalTokenCount || 0) / 1000) * 0.0044
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata
    const searchEntryPoint = groundingMetadata?.searchEntryPoint as any
    const attributions = searchEntryPoint?.htmlContent || ''

    return c.json({
      data,
      metadata,
      attributions
    })
  } catch (err: any) {
    console.error('Gemini Error:', err)
    return c.json({ error: err.message }, 500)
  }
})

export default app

