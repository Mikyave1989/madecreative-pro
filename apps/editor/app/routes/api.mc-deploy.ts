import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

/**
 * POST /api/mc-deploy
 * Routes deploy through MadeCreative backend API (which has the Vercel token).
 */
export async function action({ context, request }: ActionFunctionArgs) {
  const { projectId, files, token } = await request.json<{
    projectId: string;
    files: Record<string, string>;
    token: string;
  }>();

  if (!files || Object.keys(files).length === 0) {
    return json({ success: false, error: 'No files to deploy' }, 400);
  }

  const env = (context as any).cloudflare?.env ?? {};
  const API_URL = env.API_URL || env.VITE_API_URL || 'https://api.madecreative.pro';

  try {
    // If no project ID, use the static deploy endpoint directly
    if (!projectId || !token) {
      const res = await fetch(`${API_URL}/public/deploy-static`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      return json(data);
    }

    // Detect project type:
    // - Pure HTML/CSS/JS (no package.json) → forceStatic: true (serve as-is)
    // - React/Vite or Next.js (has package.json) → let API auto-detect and build
    const hasPackageJson = 'package.json' in files;
    const forceStatic = !hasPackageJson;

    // Use the portal deploy endpoint
    const res = await fetch(`${API_URL}/portal/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ files, forceStatic }),
    });

    const data = await res.json();
    return json(data);
  } catch (err) {
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Deploy failed' },
      500,
    );
  }
}
