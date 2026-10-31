# 5号 · CalcHub 房贷站 — https://home.saoo.me（子域） · Cloudflare Workers · D22

> **一眼识别卡**
> | 项 | 值 |
> |---|---|
> | 站名 | **CalcHub 房贷站** |
> | 域名 | **https://home.saoo.me（子域）** |
> | Worker 名 | `fangdai-xinyong-ka` |
> | 形态 | **Cloudflare Workers + Assets** |
> | 本包版本 | **D22** = D20 + 汇率署名改为可点击链接 + 联系邮箱统一为 yokok8@outlook.com |
> | 生成日期 | 2026-10-27 |
> | 关键特性 | 房贷/信用卡/汇率计算；含 Bing 验证文件 |

---

Cloudflare Workers + Assets 静态站。

## D14 变更（2026-10-24）— 去「专业」自称 + 品类化命名

### 为什么改
原站名自称「专业金融计算」（英文 Financial Calculators，多语种含 Pro / Profi /
Профессиональный / احترافية / มืออาชีพ）。金融理财属 Google 定义的 YMYL 类别，
审核按最高 E-E-A-T 标准评估；在无署名作者、无资质证明的情况下自称「专业」，
属于可被判为 misrepresentation（虚假陈述）的风险点，属可避免项，故移除。

### 改了什么
1. 品牌名 CalcHub Pro → CalcHub（去掉 Pro）
   全站 98 处 → 现在 0 处残留（含 package.json / wrangler.toml / JS 注释）
2. 12 语种副标题：从「专业/Pro」自称改为品类描述
   中文：专业金融计算 → 房贷 · 信用卡分期 · 汇率换算
   英文：Financial Calculators → Mortgage · Credit Card · Currency
   德/日/韩/俄/阿/泰等 10 语同步改（原 Profi、プロ、Профессиональный、
   احترافية、มืออาชีพ 等自称一律移除）
3. title / og:title / twitter:title 补中文长尾词
   房贷计算器 · 信用卡分期利率 · 汇率换算 | CalcHub
4. keywords 重排：中文长尾词前置
5. description / og:description 改中文，含品类词
6. OG 分享图重绘文字：CalcHub Pro → CalcHub，副标题改中文品类词
   方形裁切安全区实测：内容 行118-523 列465-734，安全区 行0-629 列285-915
   → 100% 保留

### 保留未改（正当用法，非自称）
- disclaimer「持牌投资专业人士」「专业汇款公司」—— 指第三方
- remittance 指南「自称权威方」—— 反诈提示，劝人警惕假冒
- 上述改掉反而语义错误

### 部署
无增删 → 覆盖上传（26 文件）
OG 图有变更，微信有缓存，验证分享效果请换新链接

## D15 变更（2026-10-24）— SEO 改为外文（英文）长尾词优先

**背景**：D14 把 title/keywords/description 改成了中文。但本站面向海外，
中文搜索词在国内不展示、实际价值低。用户要求改回外文（英文为主）搜索词，
中文保留少量作为补充（"可有可无，有就锦上添花"）。

**改动**
```
title      Free Mortgage, Credit Card APR & Currency Calculators | CalcHub
           （60 字符，控制在 Google 截断线内）
keywords   英文长尾词优先，共 19 个：
           mortgage calculator / mortgage prepayment calculator /
           early repayment calculator / mortgage affordability calculator /
           credit card installment APR calculator / true APR calculator /
           credit card interest calculator / currency converter /
           exchange rate calculator / remittance cost calculator /
           loan amortization calculator
           + 西/法/德/葡/意 主要语种词
           + 中文 3 个收尾（房贷计算器 / 信用卡分期利率 / 汇率换算）
description 155 字符，英文
OG 副标题   Mortgage · Credit Card APR · Currency（26px，实测左右余量 35/37）
```

**为什么选这些长尾词**
```
"mortgage calculator" 头号词竞争极激烈（Zillow / Bankrate 垄断），
新站应从长尾切入：prepayment / early repayment / affordability /
installment APR 等变体竞争度中低、意图更明确。
"credit card installment APR calculator" 是本工具独特能力（IRR 反解真实年化），
市面同类少，是最有机会的词。
```

**★ 顺带修正：移除"实时"类宣称（与 2号 同类问题）**
本站汇率实为每日中间价（daily mid-market），非实时。以下处原宣称实时/实时价，已修正：
```
index.html      twitter:description "live currency rates" → daily mid-market
guides/index    EN "live currency conversion" → daily mid-market
guides/index    ZH "实时汇率换算" → 每日中间价汇率换算
about.html      EN "Live mid-market rates" → Daily mid-market rates
about.html      ZH "实时中间价" → 每日中间价
remittance 指南 EN/ZH 对照用中间价，统一措辞
```
**保留未改**（正当用法）：
```
fx_note "not real-time bank rates" —— 正确的免责声明（说"不是实时"）
credit-card 指南"实时通知" —— 指银行交易提醒，非本站数据
"where you live" / "live with" —— 英文词义，与实时无关
```

**修了一个自己引入的 bug**：正则替换时 group(0) 未含 `<meta ` 前缀，
导致生成 `<meta <meta ...>>` 嵌套畸形标签（description 与 og:description 两处）。
已修复并加全站畸形标签扫描，现为 0 处。

**验证**
```
畸形标签        0 ✅
内链            17 个，缺失 0 ✅
我方"实时"宣称   0 ✅（正确免责 10 条保留）
CalcHub Pro 残留 0 ✅（README 文档中的历史记录除外）
标签平衡         disclaimer <p> 24/25 为 D14 之前既有状态，非本次引入
OG 方形裁切      左右余量 35/37，100% 保留 ✅
```

部署：无增删 → 覆盖上传

## D16 变更（2026-10-24）— 修复 Workers Builds 预览构建红叉

**现象**
GitHub 仓库 lindong668/fangdai-xinyongka 提交旁出现红叉：
`Workers Builds: fangdai-xinyong-ka`
但生产部署 Success，站点 home.saoo.me 访问正常。

**根因（CF 构建日志原文）**
```
Executing user deploy command: npx wrangler preview
✘ [ERROR] Your Wrangler configuration is missing a `previews` block
  to run this command. Add the following to your configuration file:

  [previews]

  To create or update a Preview with `npx wrangler preview`, your Wrangler
  configuration must include a `previews` block. The block can be empty.
  Assets, compatibility settings, migrations, and placement stay at the
  top level and do not need to be added to `previews`.
```

**已排除的其他可能**
- Worker 名字不匹配：CF 控制台项目名 `fangdai-xinyong-ka`
  与 wrangler.toml 的 name 完全一致 ✅ 排除
- 缺 account_id / main：均已正确配置 ✅ 排除
- 超长行 / 包体积：全包最长行仅 477 字符 ✅ 排除

**修复**
在 wrangler.toml 末尾新增空的 `[previews]` 块。
本站 src/index.js 仅引用 env.ASSETS，无任何环境变量，
故按 CF 官方说明留空块即可，无需配置 previews.vars。

**校验**
```
TOML 解析：顶层键 name/account_id/compatibility_date/main/routes/
           assets/observability/previews，previews = {} ✅
其余配置一字未动，26 个其他文件未改动
```

**部署**：无增删 → 覆盖上传（27 文件），实际只需替换 wrangler.toml。

**替代方案**：CF 控制台 → Workers & Pages → fangdai-xinyong-ka
→ Settings → Build → 关闭 Preview Builds，预览构建不再触发，红叉同样消失。

**备注**：同为 wrangler 4.152.0 的 beta 版 `wrangler preview`，
对 2号（有 12 个 vars）的报错要求写全 previews.vars，
对本站（无 vars）仅要求块存在即可为空——提示随项目配置而异。
2号 已按更严格的版本处理（含 12 个变量），兼容性更优。


## D19 换域：home.saoo.me（2026-10-25）

**为什么换域**：
```
原 658.ccwu.cc 所在的 .cc 后缀风险极高：
  · alphaMountain 2026-05：.cc 风险域名占比 69.2%（全网第 6）
  · Interisle 2025：.cc 人均钓鱼分 113（.com=30），worst-10，超 10% 域名涉网络犯罪
→ .cc 被长期当作"廉价 .com 替代品"滥用，整体信誉拖累抓取优先级。
→ 且 ccwu.cc 父域失联（ss99 / 658 两个子域同时出问题，换 us.ci 立刻恢复）。
→ 结论：彻底离开 .cc。
```

**本次改动**：
```
658.ccwu.cc → home.saoo.me
19 个文件、138 处替换：
  · wrangler.toml：routes pattern + zone_name（★ zone_name 必须是根域 saoo.me）
  · public/sitemap.xml：13 处 URL
  · public/robots.txt：Sitemap 行
  · src/index.js：17 处（canonical / 安全头 / 路由）
  · 全部 HTML 内链与 canonical
★ ads.txt 的 pub ID 不变（pub-8915931557404979 / f08c47fec0942fa0）
```

**部署前提**（★ 顺序不能错）：
```
① saoo.me 必须已托管到 CF（改 NS → 等生效）
② saoo.me 的 Universal SSL 证书状态为「有效」
③ 再部署本包
```

**部署后验证**：
```
https://home.saoo.me/           → 200
https://home.saoo.me/ads.txt    → 200，显示 pub 行
https://home.saoo.me/sitemap.xml → 200，13 条 URL 全为 home.saoo.me
```

**注意**：
```
沿用 D6 定案：绑 routes 而非「自定义域」，
因为自定义域走企业版证书服务，遇 PSL 后缀会报"通配符证书不覆盖"。
★ 子域 home.saoo.me 不需单独加 DNS 记录，routes 模式下 CF 自动处理。
```
