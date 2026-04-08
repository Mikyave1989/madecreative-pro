// Minimal Vercel function — no imports — for diagnosing project config
export default function handler(req: Request): Response {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { "content-type": "application/json" },
  });
}
