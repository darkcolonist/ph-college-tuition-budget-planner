# Cloudflare KV Configuration Guide

This guide explains how to set up and use **Cloudflare KV (Key-Value storage)** to manage global application state, such as toggling between live AI data and mock data instantly without a code redeploy.

## 1. Create the KV Namespace

### Via Dashboard
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **Workers & Pages** > **KV**.
3. Click **Create namespace**.
4. Name it `EDUBANK_CONFIG`.

### Via Wrangler (CLI)
Run the following command in your terminal:
```bash
npx wrangler kv:namespace create EDUBANK_CONFIG
```
*Take note of the ID returned by this command.*

---

## 2. Bind the Namespace to your Worker

Open `worker/wrangler.toml` and add the binding configuration. Replace `YOUR_ID_HERE` with the ID generated in the previous step.

```toml
[[kv_namespaces]]
binding = "CONFIG_KV"
id = "YOUR_ID_HERE"
```

---

## 3. Local Development

To test KV locally, you don't need to connect to the cloud. Wrangler creates a local version automatically.

1. Add the binding to your `wrangler.toml` (as shown above).
2. Start your dev server: `npm run dev`.
3. You can populate local data using the CLI:
   ```bash
   npx wrangler kv:key put --local --binding=CONFIG_KV "USE_MOCK" "true"
   ```

---

## 4. Implementation Logic

Once bound, you can access the KV inside your Worker's `c.env` (Hono) or `env` (Standard Worker).

### Example: Checking the Switch
```typescript
const isMockMode = await c.env.CONFIG_KV.get("USE_MOCK") === "true";

if (isMockMode) {
  return c.json({ data: mockData, isMock: true });
}
```

---

## 5. Managing the Toggle

The power of KV is that you can change it via the dashboard or CLI, and every user sees the change immediately.

### Toggle ON (Mock mode)
```bash
npx wrangler kv:key put --binding=CONFIG_KV "USE_MOCK" "true"
```

### Toggle OFF (Live AI mode)
```bash
npx wrangler kv:key put --binding=CONFIG_KV "USE_MOCK" "false"
```

> [!TIP]
> Use KV for other global settings too, such as "Maintenance Mode" or "API Rate Limit Thresholds".
