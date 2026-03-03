import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Bindings = {
  GEMINI_API_KEY: string
  ALLOWED_ORIGINS?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Simple in-memory rate limiter (resets on Worker restart)
// In production, using Cloudflare KV or D1 is more reliable.
const RATE_LIMITS = new Map<string, { count: number, timestamp: number }>()
const MAX_COMPARISONS_PER_HOUR = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

app.use('*', async (c, next) => {
  const originHeader = c.env.ALLOWED_ORIGINS || '*'
  
  const corsMiddleware = cors({
    origin: (origin) => {
      const allowed = originHeader.split(',').map(s => s.trim())
      if (allowed.includes('*') || allowed.includes(origin)) {
        return origin
      }
      return null
    },
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
You are a Philippine Education Cost API. Return ONLY raw JSON. No markdown blocks, no intro, no outro.
COURSE: {courseName}

STRICT CONSTRAINTS:
1. Normalize course names (e.g., "BS CS" -> "Bachelor of Science in Computer Science").
2. For UP Diliman: tuitionFee = 0.
3. For DLSU: Normalize (Term_Cost * 3) / 2 for semestral view.
4. Inflation: 6% compounding for years 2-4.
5. NO NOTES, NO EXPLANATIONS, NO GROUNDING SOURCE LINKS IN JSON.

JSON STRUCTURE:
{
  "normalizedCourseName": "string",
  "universities": [
    {
      "name": "string",
      "abbreviation": "UP|ADMU|DLSU|UST",
      "year1": { "tuitionFee": number, "miscFees": number, "total": number },
      "projection": [
        { "year": 2, "estimatedTotal": number },
        { "year": 3, "estimatedTotal": number },
        { "year": 4, "estimatedTotal": number }
      ]
    }
  ],
  "meta": { "calculationBasis": "Semestral (PHP)", "inflationRate": "6%" }
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
    tools: [{ googleSearch: {} as any}],
    generationConfig: {
      maxOutputTokens: 2048,
    }
  })

  const prompt = SYSTEM_INSTRUCTION.replace('{courseName}', courseName)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('--- RAW GEMINI RESPONSE ---')
    console.log(text)
    console.log('---------------------------')

    let data;
    try {
      // Clean markdown block markers if present
      const cleanText = text.replace(/```json|```/g, '').trim()
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanText)
    } catch (parseErr) {
      console.error('Final Parse Failed:', parseErr)
      return c.json({ error: 'Failed to parse AI response', raw: text }, 500)
    }

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

