import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { GoogleGenerativeAI } from '@google/generative-ai'

type Bindings = {
  GEMINI_API_KEY: string
  ALLOWED_ORIGIN?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
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

  if (!apiKey) {
    return c.json({ error: 'API key is missing' }, 500)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    // @ts-ignore - Tools might not be in the typings yet depending on version, but supported in runtime
    tools: [{ googleSearch: {} }]
  })

  const prompt = SYSTEM_INSTRUCTION.replace('{courseName}', courseName)

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON if it's wrapped in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)

    // Token usage metadata
    const metadata = {
      promptTokenCount: response.usageMetadata?.promptTokenCount || 0,
      candidatesTokenCount: response.usageMetadata?.candidatesTokenCount || 0,
      totalTokenCount: response.usageMetadata?.totalTokenCount || 0,
      estimatedCostPhp: ((response.usageMetadata?.totalTokenCount || 0) / 1000) * 0.0044
    }

    // Grounding attributions
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata
    const searchEntryPoint = groundingMetadata?.searchEntryPoint as any
    const attributions = searchEntryPoint?.htmlContent || ''

    return c.json({
      data,
      metadata,
      attributions
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get('/api/suggestions', async (c) => {
  const query = c.req.query('q')
  const apiKey = c.env.GEMINI_API_KEY
  if (!query || !apiKey) return c.json([])

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  try {
    const prompt = `Provide 5 popular Philippine university course name suggestions starting with or related to "${query}". Return ONLY a JSON array of strings.`
    const result = await model.generateContent(prompt)
    const text = await result.response.text()
    const jsonMatch = text.match(/\[.*\]/s)
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return c.json(suggestions)
  } catch {
    return c.json([])
  }
})

export default app
