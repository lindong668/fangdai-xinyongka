/**
 * 5号 房贷站 LendMath（home.saoo.me）—— Cloudflare Workers + Assets
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
    if (url.hostname === 'www.home.saoo.me') {
      return Response.redirect('https://home.saoo.me' + url.pathname + url.search, 301);
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
        'User-agent: Mediapartners-Google\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://home.saoo.me/sitemap.xml\nSitemap: https://home.saoo.me/sitemap-zh.xml\n',
        {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        }
      );
    }

    /* ★ sitemap.xml 硬拦截（D17 重写 —— 不再依赖静态资源）
     *
     * 【为什么改】
     *   旧写法用 env.ASSETS.fetch() 去读 public/sitemap.xml。
     *   对照本站其他两个 SEO 文件：
     *     ads.txt     → Worker 硬编码字符串 → AdSense 抓到「已授权」
     *     robots.txt  → Worker 硬编码字符串 → Google 正常读取
     *     sitemap.xml → 读静态文件          → GSC「无法抓取」
     *   唯一失败项 = 唯一依赖静态文件的项，相关性 100%。
     *
     * 【失效机制】静态文件若未真正部署（404），src.text() 会拿到
     *   404 错误页的 HTML，再被贴上 application/xml 的 Content-Type
     *   吐给 Google —— 标着 XML 的 HTML —— 解析失败 —— 报「无法抓取」。
     *   站点本身能正常访问，所以「手动能打开、爬虫抓不到」并不矛盾。
     *
     * 【修法】照抄 ads.txt 的成功做法：内容直接内联在 Worker 里，
     *   不读 ASSETS、不依赖上传、不受边缘缓存影响。
     *   内联体积 2449 字符，完全可控。
     */

    /* ★ sitemap.xml —— 静态文件优先 + 严格校验 + 内联兜底
     * 旧版把 URL 硬编码在这里，加页面时只改 public/sitemap.xml 忘了改这里，
     * 线上就会一直返回旧的硬编码（4号站已实测踩坑：静态96条，线上返回31条
     * 且含已删除页面）。现在改为优先读静态，以后加页面不用再动这里。 */
    const SITEMAP_FALLBACK = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">
  <url>
    <loc>https://home.saoo.me/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/mortgage/cn/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/mortgage/us/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/mortgage/cn/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/mortgage/us/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/cn-affordability-budget.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/cn-amortization-compare.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/cn-combo-loan.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/cn-lpr-repricing.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/cn-property-taxes.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/credit-card-installment-traps.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/credit-card-usage-tips.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/exchange-rate-basics.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/mortgage-basics.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/mortgage-prepayment.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/remittance-cost-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-15-vs-30-year.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-arm-vs-fixed.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-closing-costs.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-dti-affordability.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-fha-vs-conventional.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-mortgage-payment-breakdown.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-pmi-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/guides/us-refinance-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/cn-affordability-budget.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/cn-amortization-compare.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/cn-combo-loan.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/cn-lpr-repricing.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/cn-property-taxes.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/credit-card-installment-traps.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/credit-card-usage-tips.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/exchange-rate-basics.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/mortgage-basics.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/mortgage-prepayment.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/remittance-cost-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-15-vs-30-year.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-arm-vs-fixed.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-closing-costs.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-dti-affordability.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-fha-vs-conventional.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-mortgage-payment-breakdown.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-pmi-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/guides/us-refinance-guide.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/about.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/contact.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/disclaimer.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/privacy.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/terms.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/about.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/contact.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/disclaimer.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/privacy.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
  <url>
    <loc>https://home.saoo.me/zh/terms.html</loc>
    <lastmod>2026-11-02</lastmod>
  </url>
</urlset>
";

    if (pathname === '/sitemap.xml') {
      let body = SITEMAP_FALLBACK;
      try {
        const r = await env.ASSETS.fetch(new Request(url.origin + '/sitemap.xml', request.clone()));
        if (r.status === 200) {
          const t = (await r.text()).trim();
          if (t.startsWith('<?xml') && t.includes('<urlset')) body = t;
        }
      } catch (e) {}
      return new Response(body, { status: 200, headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=3600' } });
    }

    /* ★ sitemap-zh.xml（中文站站点地图，13 条 /zh/ 页面）
     * 与 sitemap.xml 同样处理：静态优先 + XML 校验，保证 Content-Type 正确。 */
    if (pathname === '/sitemap-zh.xml') {
      try {
        const r2 = await env.ASSETS.fetch(
          new Request(url.origin + '/sitemap-zh.xml', request.clone())
        );
        if (r2.status === 200) {
          const t2 = (await r2.text()).trim();
          if (t2.startsWith('<?xml') && t2.includes('<urlset')) {
            return new Response(t2, {
              status: 200,
              headers: {
                'content-type': 'application/xml; charset=utf-8',
                'cache-control': 'public, max-age=3600',
              },
            });
          }
        }
      } catch (e) {}
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n',
        { status: 200, headers: { 'content-type': 'application/xml; charset=utf-8' } }
      );
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

    // /guides/ 与 /guides/xxx 补 .html（目录索引 + 文章干净 URL）
    if (isNav && pathname.startsWith('/guides')) {
      const clean = pathname.replace(/\/+$/, '');          // /guides/ → /guides
      const probe = await env.ASSETS.fetch(
        new Request(url.origin + clean + '.html', request.clone())
      );
      if (probe.status === 200) {
        return Response.redirect(url.origin + clean + '.html' + url.search, 301);
      }
      // /guides 或 /guides/ → 索引页
      const idx = await env.ASSETS.fetch(
        new Request(url.origin + '/guides/index.html', request.clone())
      );
      if (idx.status === 200) return idx;
    }

    // /zh/ 与 /zh/guides/ → 中文索引页（目录索引兜底）
    if (isNav && (pathname === '/zh' || pathname === '/zh/')) {
      const zhIdx = await env.ASSETS.fetch(
        new Request(url.origin + '/zh/index.html', request.clone())
      );
      if (zhIdx.status === 200) return zhIdx;
    }
    if (isNav && (pathname === '/zh/guides' || pathname === '/zh/guides/')) {
      const zhGuide = await env.ASSETS.fetch(
        new Request(url.origin + '/zh/guides/index.html', request.clone())
      );
      if (zhGuide.status === 200) return zhGuide;
    }
    if (isNav && pathname.startsWith('/zh/guides')) {
      const clean = pathname.replace(/\/+$/, '');
      const probe = await env.ASSETS.fetch(
        new Request(url.origin + clean + '.html', request.clone())
      );
      if (probe.status === 200) {
        return Response.redirect(url.origin + clean + '.html' + url.search, 301);
      }
    }

    /* ★ /mortgage/ 与 /zh/mortgage/ 目录索引兜底
     * sitemap 与 canonical 写的是 /mortgage/us/（目录形式），
     * 但 Workers Assets 不保证对目录路径自动补 index.html，
     * 一旦返回 404，这两个新增国家页就等于白做。
     * 这里显式探测 xxx/index.html，与 /zh/ 的处理保持一致。 */
    if (isNav && pathname.includes('/mortgage')) {
      const clean = pathname.replace(/\/+$/, '');   // /mortgage/us/ → /mortgage/us
      const probe = await env.ASSETS.fetch(
        new Request(url.origin + clean + '/index.html', request.clone())
      );
      if (probe.status === 200) return probe;
      const probe2 = await env.ASSETS.fetch(
        new Request(url.origin + clean + '.html', request.clone())
      );
      if (probe2.status === 200) return probe2;
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
