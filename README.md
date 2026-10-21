# CalcHub Pro 部署说明

## 文件清单
- index.html    —— 主站（房贷 / 信用卡 / 汇率三大功能）
- about.html    —— 关于本站
- privacy.html  —— 隐私政策
- contact.html  —— 联系方式
- ads.txt       —— AdSense 授权文件（需替换成你自己的 ID）

## 部署到 Vercel
1. 把这 5 个文件放到一个 GitHub 仓库根目录
2. 打开 vercel.com → Import Git Repo → 选这个仓库
3. Framework Preset 选 "Other" 或不选，默认即可
4. Deploy → 几秒后获得 *.vercel.app 链接
5. 绑定自定义域名（在 Vercel Dashboard → Settings → Domains）

## 接入 Google AdSense
1. 去 google.com/adsense 注册并提交本站审核
2. 审核通过后拿到你的 ca-pub-xxxxxxxx 和广告单元 ID
3. 在 index.html 里：
   - 取消注释 <head> 里的 adsbygoogle.js 全局脚本，替换 client ID
   - 把每个 .ad-box 占位符换成 <ins class="adsbygoogle"> 单元代码
4. 把 ads.txt 里的示例行换成你 AdSense 后台给出的真实内容
5. 重新部署

## 汇率数据
- 默认使用 open.er-api.com（每日更新，带数据时间）
- 主源失败会自动降级到 Frankfurter（ECB 参考价）
- 显示的是市场中间价，非银行牌价

## 自定义
- 邮箱、站点名等文字在 about.html / contact.html / index.html 里直接改
- 利率默认值、币种列表在 index.html 的对应 input 和 CURRENCIES 数组里改
