import fs from 'fs';
import path from 'path';

const root = process.cwd();
const basePath = '/bubble_bobble';
const port = 3000;

function safePath(urlPath) {
  const withoutBase = urlPath.startsWith(basePath)
    ? urlPath.slice(basePath.length)
    : urlPath;
  const normalized = path.normalize(withoutBase).replace(/^\/+/g, '');
  const resolved = path.resolve(root, normalized || 'index.html');
  if (!resolved.startsWith(root)) {
    return null;
  }
  return resolved;
}

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/') {
      return Response.redirect(`${basePath}/`, 302);
    }

    if (pathname === basePath) {
      pathname = `${basePath}/`;
    }

    const filePath = safePath(pathname);
    if (!filePath) {
      return new Response('Not found', { status: 404 });
    }

    let finalPath = filePath;
    if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
      finalPath = path.join(finalPath, 'index.html');
    }

    if (!fs.existsSync(finalPath)) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(Bun.file(finalPath));
  }
});

console.log(`Dev server running at http://localhost:${port}${basePath}/`);
