/**
 * 5号 房贷站 CalcHub Pro（k789.cc.cd）—— Cloudflare Workers + Assets
 *
 * ★ 为什么从「纯静态」改成 Workers：
 *   纯静态部署时，Search Console 容易出现「无法抓取 / 类型未知 / 0 个网址」，
 *   问题通常出在 robots.txt / sitemap.xml / ads.txt 三个关键 SEO 文件的
 *   Content-Type 被中间层猜错。
 *
 *   改为 Workers 后，这三个文件由 Worker 层直接返回，
 *   绕过静态资源的 MIME 猜测与任何中间层干扰，
 *   保证 Google 与 AdSense 拿到的永远是正确内容 + 正确 Content-Type。
 *   1号 piccalc.com / 4号 zook.cc.cd 都是这套机制，从未出过 SEO 抓取问题。
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 统一走主域名，避免 www 与非 www 双份索引
    if (url.hostname === 'www.k789.cc.cd') {
      return Response.redirect('https://k789.cc.cd' + url.pathname + url.search, 301);
    }

    const pathname = url.pathname;

    /* ★ ads.txt 硬拦截
     * AdSense 抓取器对 Content-Type 极严格，必须是 text/plain，
     * 一旦被猜成 text/html 就判定「ads.txt 无效」，审核卡住。 */
    if (pathname === '/ads.txt') {
      return new Response(
        'google.com, pub-8915931557404979, DIRECT, f08c47fec0942fa0\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ robots.txt 硬拦截（含 Mediapartners-Google，AdSense 专用爬虫） */
    if (pathname === '/robots.txt') {
      return new Response(
        'User-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://k789.cc.cd/sitemap.xml\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ sitemap.xml 硬拦截
     * Google 要求 application/xml，且内容必须是合法 XML。
     * 这里强制改写 Content-Type 再吐出，确保万无一失。 */
    if (pathname === '/sitemap.xml') {
      const src = await env.ASSETS.fetch(new Request(url.origin + '/sitemap.xml', request));
      const body = await src.text();
      return new Response(body, {
        status: 200,
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }

    /* 无扩展名路径补 .html（如 /about → /about.html），301 转移权重
     *
     * ⚠️ 只对 GET/HEAD 做：new Request(url, request) 会复用原请求 body 流，
     *    之后再 env.ASSETS.fetch(request) 会抛
     *    "Cannot reconstruct a Request with a used body."
     *    补后缀本身是给页面导航用的，POST 没有必要，直接跳过。 */
    const noExt = !/\.[a-zA-Z0-9]+$/.test(pathname);
    const isNav = request.method === 'GET' || request.method === 'HEAD';
    if (isNav && noExt && pathname !== '/' && !pathname.endsWith('/')) {
      const probe = await env.ASSETS.fetch(
        new Request(url.origin + pathname + '.html', request.clone())
      );
      if (probe.status === 200) {
        return Response.redirect(url.origin + pathname + '.html' + url.search, 301);
      }
    }

    const res = await env.ASSETS.fetch(request);

    // 404 兜底
    if (res.status === 404) {
      return new Response(
        '<!doctype html><meta charset="utf-8"><title>页面不存在</title>' +
          '<div style="font-family:system-ui;max-width:560px;margin:15vh auto;text-align:center">' +
          '<h1 style="font-size:22px">页面不存在</h1>' +
          '<p style="color:#64748b">你访问的页面已移动或从未存在。</p>' +
          '<a href="/" style="color:#2563eb">返回首页</a></div>',
        { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    return res;
  },
};
