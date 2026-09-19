import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  let siteUrl = '';
  try { const url = new URL(env.VITE_SITE_URL); if (url.protocol === 'https:') siteUrl = url.origin; } catch { /* Optional until deployment. */ }
  const allowIndex = env.VITE_ALLOW_INDEXING === 'true' && !!siteUrl;
  const verification = (env.VITE_GOOGLE_SITE_VERIFICATION || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return {
    build: { target: 'es2022', sourcemap: false, rollupOptions: { output: { manualChunks: { animation: ['gsap', 'gsap/ScrollTrigger', 'lenis'] } } } },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true, headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY' } },
    plugins: [{
      name: 'helio-site-metadata',
      transformIndexHtml(html) {
        if (allowIndex) html = html.replace('content="noindex, nofollow"', 'content="index, follow"');
        if (siteUrl) html = html.replace('</head>', `<link rel="canonical" href="${siteUrl}/"/><meta property="og:url" content="${siteUrl}/"/></head>`).replace('content="/images/hero-solar.webp"', `content="${siteUrl}/images/hero-solar.webp"`);
        if (verification) html = html.replace('</head>', `<meta name="google-site-verification" content="${verification}"/></head>`);
        return html;
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: allowIndex ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n' });
        if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>` });
      },
    }],
  };
});
