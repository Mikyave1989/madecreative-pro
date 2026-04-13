import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

/**
 * POST /api/mc-deploy
 * Deploys the current project files via our backend API.
 * The backend handles Vercel deployment + custom domain setup.
 */
export async function action({ request }: ActionFunctionArgs) {
  const { projectId, files, token } = await request.json<{
    projectId: string;
    files: Record<string, string>;
    token: string;
  }>();

  if (!projectId || !files || !token) {
    return json({ success: false, error: 'Missing projectId, files, or token' }, 400);
  }

  const API_URL = process.env.VITE_API_URL || 'https://api.madecreative.pro';

  try {
    const res = await fetch(`${API_URL}/portal/projects/${projectId}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ files }),
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
