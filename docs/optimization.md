# Optimization & Rate Limiting

To maintain a sustainable free tier usage of the Gemini API and Cloudflare Workers, we've implemented several optimization strategies.

## 1. Client-Side Course Suggestions
Suggestions are now handled entirely in the browser to eliminate network latency and server costs.
- **Local Data**: We use `client/src/courses.json` containing common Philippine university courses.
- **Logic**: The `Search.jsx` component filters this list locally as the user types.
- **Benefits**: Instant feedback for the user, zero network requests, and zero Gemini token usage for suggestions.

## 2. IP-Based Rate Limiting
The `/api/compare` endpoint is the most "expensive" as it uses AI Search Grounding.
- **Limit**: Currently set to **3 comparisons per hour per visitor**.
- **Implementation**: Uses `cf-connecting-ip` to track usage in an in-memory `Map`.
- **Response**: Returns a `429 Too Many Requests` status with a JSON error when the limit is hit.

## 3. Future Improvement: Cloudflare KV
For persistent rate limiting across Worker restarts and multiple data centers, we can migrate to Cloudflare KV.

### Cloudflare KV Free Tier Limits (Approximate)
- **Reads**: 100,000 per day
- **Writes**: 1,000 per day
- **Delete**: 1,000 per day
- **Storage**: 1 GB

> [!TIP]
> Since we only have 1,000 writes/day on the free tier, we should only write to KV when a comparison is actually performed, not for every suggestion.

### How to Enable KV Persistence:
1. Create the namespace: `npx wrangler kv:namespace create STORAGE`
2. Add the binding to `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "KV_CACHE"
   id = "<YOUR_NAMESPACE_ID>"
   ```
3. Update `worker/src/index.ts` to use `c.env.KV_CACHE.get(ip)` and `c.env.KV_CACHE.put(ip, count)`.
