import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';

/**
 * POST /api/mc-deploy
 * Deploys project files directly to Vercel (static, no build step).
 * Then saves the deploy URL to the backend project record.
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

  // Deploy directly to Vercel with no build step
  // This avoids the "vite: command not found" error
  const projectName = projectId
    ? `mc-editor-${projectId.slice(-8)}`
    : `mc-editor-${Date.now()}`;

  // Build file entries (base64 encoded)
  const vercelFiles = Object.entries(files).slice(0, 100).map(([file, content]) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(content)));
      return { file: file.replace(/^\//, ''), data: encoded, encoding: 'base64' };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Add vercel.json for proper routing if multi-page
  const hasSubPages = vercelFiles.some(f => f && f.file.includes('/'));
  if (hasSubPages && !files['vercel.json']) {
    const htmlFiles = vercelFiles.filter(f => f?.file.endsWith('.html') && f.file !== 'index.html');
    const routes = htmlFiles.flatMap(f => {
      const path = f!.file.replace('/index.html', '').replace('.html', '');
      return [
        { src: `/${path}/?`, dest: `/${f!.file}` },
        { src: `/${path}`, dest: `/${f!.file}` },
      ];
    });
    routes.push({ src: '/(.*)', dest: '/$1' });
    const vercelJson = JSON.stringify({ cleanUrls: true, trailingSlash: false, routes });
    vercelFiles.push({
      file: 'vercel.json',
      data: btoa(unescape(encodeURIComponent(vercelJson))),
      encoding: 'base64',
    });
  }

  try {
    // Deploy to Vercel with static config (no build)
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName,
        files: vercelFiles,
        projectSettings: {
          framework: null,
          buildCommand: '',
          outputDirectory: '.',
          installCommand: '',
        },
        target: 'production',
        public: true,
      }),
    });

    if (!deployRes.ok) {
      const errText = await deployRes.text();
      return json({ success: false, error: `Vercel deploy failed: ${errText.slice(0, 200)}` }, 500);
    }

    const dep = await deployRes.json() as { url: string; id: string };
    const deployUrl = `https://${dep.url}`;

    // Save deploy URL to backend project record (if logged in)
    if (projectId && token) {
      await fetch(`${API_URL}/portal/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ files }),
      }).catch(() => {});

      await fetch(`${API_URL}/portal/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: files['index.html']?.match(/<title[^>]*>([^<]+)/)?.[1]?.slice(0, 60) }),
      }).catch(() => {});
    }

    return json({
      success: true,
      data: { deployUrl, vercelProjectId: projectName },
    });
  } catch (err) {
    return json(
      { success: false, error: err instanceof Error ? err.message : 'Deploy failed' },
      500,
    );
  }
}
