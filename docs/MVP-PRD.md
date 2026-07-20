# Image Background Remover — MVP 需求文档

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 产品名称 | Image Background Remover |
| 仓库 | `image-background-remover` |
| 文档版本 | v1.0 |
| 产品阶段 | MVP |
| 部署平台 | Cloudflare |
| 图像处理服务 | remove.bg API |
| 数据存储 | 不使用持久化存储 |

## 2. 产品概述

Image Background Remover 是一个面向英文用户的在线图片背景移除工具。用户无需注册，上传 JPG、PNG 或 WebP 图片后即可自动移除背景，预览透明结果，更换纯色背景并下载处理后的 PNG。

MVP 的目标是用最短路径验证以下假设：

1. 搜索 `image background remover` 及相关关键词的用户愿意使用一个无需注册的在线工具。
2. “操作简单、结果清晰、无需存储图片”足以促成用户完成下载。
3. 网站能够通过自然搜索或外部渠道持续获得有效的图片处理请求。

## 3. 产品定位

### 3.1 核心价值主张

> Remove image backgrounds online in seconds — no sign-up, no watermark, and no image storage.

### 3.2 目标用户

- 需要制作商品白底图的电商卖家。
- 需要制作头像、简历照或社交媒体素材的个人用户。
- 需要从 Logo、图标或产品图中生成透明 PNG 的设计及运营人员。
- 偶尔需要快速抠图、不愿安装桌面软件的用户。

### 3.3 MVP 差异点

- 无需注册或登录。
- 不添加水印。
- 页面打开后可立即上传。
- 本站不持久化存储用户图片。
- 支持透明、白色、黑色及自定义纯色背景。
- 桌面端和移动端均可使用。

### 3.4 隐私表述边界

图片需要经 Cloudflare Function 转发至 remove.bg API，因此不得使用“图片不会离开设备”或“完全在本地处理”等描述。

允许使用的表述：

> Images are processed securely and are never stored by our website.

隐私政策中必须说明 remove.bg 是第三方图像处理服务。

## 4. MVP 范围

### 4.1 包含范围

- 英文单页网站。
- 点击选择、拖放和粘贴图片。
- JPG、JPEG、PNG、WebP 输入。
- 调用 remove.bg API 自动移除背景。
- 原图和结果图预览。
- 透明棋盘格预览。
- 透明、白色、黑色和自定义颜色背景。
- 下载透明 PNG。
- 下载带纯色背景的 PNG。
- 重新上传和重新处理。
- 响应式移动端布局。
- 基础 SEO、FAQ 和隐私说明。
- Cloudflare Turnstile 和基础请求限流。
- Cloudflare Web Analytics 或同等级无 Cookie 分析工具。

### 4.2 不包含范围

- 用户账号、登录和个人中心。
- 图片历史记录或云端存储。
- 批量处理。
- 手动擦除、恢复、画笔和复杂蒙版编辑。
- AI 场景背景生成。
- 图片裁剪、滤镜、阴影等完整编辑器功能。
- 付费订阅和在线支付。
- 对外开放的开发者 API。
- 多语言页面。
- 原生移动端或桌面端应用。

## 5. 核心用户流程

1. 用户进入首页，首屏立即看到上传区域。
2. 用户点击、拖放或粘贴一张图片。
3. 前端校验格式、文件大小及基础尺寸。
4. 用户通过无感或交互式 Turnstile 校验。
5. 页面显示上传及处理状态。
6. Cloudflare Function 将图片转发给 remove.bg。
7. Function 将结果以流式响应返回浏览器，不写入持久化存储。
8. 页面显示原图和透明背景结果。
9. 用户选择透明或纯色背景。
10. 用户下载 PNG，或选择另一张图片重新处理。

## 6. 功能需求

### FR-01 图片输入

用户可以通过以下方式选择单张图片：

- 点击上传按钮。
- 将图片拖入上传区域。
- 从剪贴板粘贴图片。

约束：

- 支持 `.jpg`、`.jpeg`、`.png`、`.webp`。
- 单个文件最大 12 MB。
- 一次只处理一张图片。
- 前端不得只依赖文件扩展名判断格式。
- 非法文件需要在调用 API 前被拒绝。

验收标准：

- 合法图片被选择后立即显示本地预览。
- 超过限制或格式不支持时显示清晰错误，不发送 API 请求。
- 再次选择图片会释放之前创建的 Blob URL。

### FR-02 背景移除

- 前端将图片发送至本站 `/api/remove-background`。
- 服务端通过 `multipart/form-data` 调用 remove.bg `/v1.0/removebg`。
- remove.bg API Key 只能存放在 Cloudflare Secret 中。
- 默认使用 `size=auto`。
- 成功结果以图片响应直接返回浏览器。
- 请求与响应不得写入 R2、KV、D1 或文件系统。

验收标准：

- 正常图片可以得到透明背景结果。
- API Key 不出现在客户端资源、网络请求或公开仓库中。
- 成功响应包含正确的图片 `Content-Type`。
- 响应包含 `Cache-Control: no-store`。

### FR-03 处理状态

页面至少支持以下状态：

| 状态 | 展示要求 |
| --- | --- |
| Idle | 显示上传区域和示例说明 |
| Selected | 显示原图预览，准备提交 |
| Verifying | 显示安全校验状态 |
| Uploading | 显示上传状态，禁止重复提交 |
| Processing | 告知用户正在移除背景 |
| Completed | 显示结果、背景选项和下载按钮 |
| Error | 显示可理解的错误和重试入口 |

如果无法获得准确进度，不展示虚假的百分比；使用分阶段状态或不确定进度动画。

### FR-04 结果预览

- 同时提供原图和处理结果。
- 透明区域使用棋盘格显示。
- MVP 可采用左右并排、标签切换或滑动对比中的一种。
- 预览需保持图片原始宽高比。
- 图片不得因预览容器发生拉伸变形。

### FR-05 背景选择

用户可以选择：

- Transparent。
- White。
- Black。
- Custom color。

纯色背景在浏览器中通过 Canvas 合成，不重复调用 remove.bg API。

验收标准：

- 切换颜色时预览即时更新。
- 自定义颜色支持标准颜色选择器。
- 切换颜色不会损失原始透明结果。

### FR-06 图片下载

- 透明背景下载为 PNG。
- 纯色背景通过 Canvas 合成后下载为 PNG。
- 下载图片尺寸默认与 remove.bg 返回结果一致。
- 默认文件名为 `{original-name}-no-bg.png`。

验收标准：

- 透明下载保留 Alpha 通道。
- 纯色下载没有透明区域。
- 下载不触发第二次 remove.bg API 请求。

### FR-07 重新处理

- 用户可清除当前结果并选择新图片。
- 清除时释放原图、处理结果及 Canvas 产生的 Blob URL。
- 页面恢复至初始状态。

### FR-08 错误处理

需要覆盖以下错误：

| 场景 | 用户提示 |
| --- | --- |
| 文件格式不支持 | 请选择 JPG、PNG 或 WebP 图片 |
| 文件超过 12 MB | 请选择小于 12 MB 的图片 |
| 文件内容无效 | 无法读取该图片，请更换文件 |
| Turnstile 失败 | 安全验证失败，请重试 |
| remove.bg 无法识别主体 | 未能识别清晰主体，请更换图片 |
| API 额度耗尽 | 服务暂时不可用，请稍后再试 |
| 请求过于频繁 | 请求过于频繁，请稍后再试 |
| 网络超时 | 处理超时，请检查网络后重试 |
| 未知错误 | 处理失败，请重试 |

前端不得直接展示 remove.bg 返回的内部错误、密钥信息或堆栈信息。

## 7. 页面与内容需求

### 7.1 页面结构

首页从上至下包括：

1. Header：Logo/产品名、简单导航。
2. Hero：H1、价值主张、上传区域、隐私提示。
3. Result Workspace：处理状态、对比预览、背景选项、下载按钮。
4. Before/After 示例。
5. How It Works：Upload、Remove、Download 三步。
6. Use Cases：Products、Portraits、Pets、Logos。
7. Benefits：No sign-up、No watermark、No storage、Mobile friendly。
8. FAQ。
9. Footer：Privacy、Terms、Contact。

### 7.2 首屏文案建议

- Title/H1：`Free Image Background Remover`
- Subtitle：`Remove image backgrounds in seconds. No sign-up, no watermark, and no image storage.`
- CTA：`Upload Image`
- Dropzone：`Drop an image here, paste it, or browse`
- File hint：`JPG, PNG or WebP · Max 12 MB`
- Trust note：`Your images are processed securely and are not stored by us.`

### 7.3 法律页面

MVP 上线前必须提供：

- Privacy Policy。
- Terms of Use。
- Contact 邮箱或联系入口。

隐私政策至少说明：

- 图片会发送到 remove.bg 完成处理。
- 本站不主动持久化存储上传图片和结果图片。
- Cloudflare 提供网络和运行时服务。
- 使用的分析工具及收集的信息范围。
- 日志可能包含 IP、请求时间、状态码等基础网络元数据。

## 8. API 需求

### 8.1 接口

```http
POST /api/remove-background
Content-Type: multipart/form-data
```

请求字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `image_file` | File | 是 | JPG、PNG 或 WebP，最大 12 MB |
| `turnstile_token` | string | 是 | Cloudflare Turnstile Token |

成功响应：

```http
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: no-store
X-Request-ID: <random-id>
```

错误响应：

```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Please upload a valid JPG, PNG, or WebP image.",
    "requestId": "random-id"
  }
}
```

### 8.2 错误码

| HTTP | Code | 说明 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | 请求字段缺失 |
| 400 | `INVALID_IMAGE` | 文件内容或格式无效 |
| 413 | `FILE_TOO_LARGE` | 文件超过 12 MB |
| 403 | `VERIFICATION_FAILED` | Turnstile 校验失败 |
| 422 | `SUBJECT_NOT_FOUND` | 无法识别前景主体 |
| 429 | `RATE_LIMITED` | 请求频率过高 |
| 503 | `CREDITS_EXHAUSTED` | remove.bg 额度不足 |
| 504 | `UPSTREAM_TIMEOUT` | 上游处理超时 |
| 500 | `INTERNAL_ERROR` | 未分类服务端错误 |

## 9. 安全与防滥用

MVP 必须实现：

- 使用 Cloudflare Secret 保存 `REMOVE_BG_API_KEY`。
- 使用 Turnstile 校验公开请求。
- 对 IP 或 Cloudflare 提供的客户端标识进行速率限制。
- 校验请求方法、`Content-Type`、文件大小、MIME 和文件签名。
- 仅接受单个图片文件，不接受远程图片 URL。
- 限制请求来源和 CORS 域名。
- API 响应设置 `Cache-Control: no-store`。
- 不记录图片二进制、Base64、上传文件名或 remove.bg API Key。
- 对客户端隐藏上游响应细节。
- 对 remove.bg `429` 响应遵循 `Retry-After`，但不在一次用户请求中无限重试。

建议的初始限流策略：

- 单 IP：5 次/分钟。
- 单 IP：30 次/天。
- 超限返回 `429`。

正式阈值应根据真实转化率、攻击情况和 remove.bg 额度调整。

## 10. 非功能需求

### 10.1 性能

- 首屏核心内容在普通 4G 网络下尽快可交互。
- 上传前不得下载大型 AI 模型。
- 非首屏示例图片使用懒加载。
- 静态资源由 Cloudflare 边缘缓存。
- 图片处理响应不得被 CDN 或浏览器缓存。
- 处理时长超过 30 秒后视为超时，并允许用户重试。

### 10.2 兼容性

- Chrome、Edge、Firefox、Safari 当前两个主要版本。
- iOS Safari 和 Android Chrome。
- 页面最低适配宽度 320px。

### 10.3 可访问性

- 上传区域支持键盘操作。
- 关键按钮具有可读标签和清晰焦点状态。
- 状态变化通过 `aria-live` 通知辅助技术。
- 文字与背景颜色满足 WCAG AA 基础对比度。
- 不仅依靠颜色表达错误和完成状态。

### 10.4 可观测性

允许记录：

- 随机 Request ID。
- 请求时间、耗时、HTTP 状态码。
- 输入文件大小区间和图片格式。
- remove.bg 上游状态码。

禁止记录：

- 图片内容或 Base64。
- 用户原始文件名。
- API Key、Turnstile Token。
- remove.bg 返回的图片内容。

## 11. SEO 需求

### 11.1 首页元数据

- URL：`/`
- Title：`Free Image Background Remover – Remove Background Online`
- H1：`Free Image Background Remover`
- Meta Description：`Remove image backgrounds online in seconds. No sign-up, no watermark, and no image storage. Download a transparent PNG for free.`
- Canonical：正式生产域名首页。
- Open Graph 和 X/Twitter 分享信息。

### 11.2 技术 SEO

- 重要正文必须出现在构建后的 HTML 中。
- 提供 `sitemap.xml` 和 `robots.txt`。
- 配置 canonical URL。
- 使用语义化 HTML。
- FAQ 可添加符合内容的结构化数据。
- 示例图片提供描述性 `alt` 文本。
- 404 页面和错误状态不得被索引为正常工具页。

### 11.3 目标关键词

主关键词：

- `image background remover`

自然覆盖的相关词：

- `remove background from image`
- `free background remover`
- `background remover online`
- `transparent background maker`
- `remove white background`
- `background remover without signup`

不得为了关键词密度重复堆砌文本。

## 12. 数据分析与成功指标

### 12.1 事件

| 事件 | 触发时机 |
| --- | --- |
| `upload_started` | 用户提交合法图片 |
| `processing_succeeded` | 成功取得 remove.bg 结果 |
| `processing_failed` | 处理失败，附标准错误码 |
| `background_changed` | 用户选择背景类型，不记录具体自定义颜色 |
| `download_clicked` | 用户发起下载 |
| `new_image_clicked` | 用户开始处理另一张图片 |

不得将图片、文件名、Token 或个人数据放入分析事件。

### 12.2 MVP 核心漏斗

```text
首页访问
  → 合法图片上传
  → 处理成功
  → 下载结果
```

### 12.3 初始成功指标

上线后首个有效观察周期建议至少收集 500 次非机器人首页访问，并关注：

- 访问到上传转化率 ≥ 15%。
- 上传到处理成功率 ≥ 90%。
- 处理成功到下载转化率 ≥ 60%。
- 非用户文件问题导致的处理失败率 ≤ 5%。
- API P95 总耗时 ≤ 15 秒。
- 移动端无阻断性布局或交互问题。

上述数值是 MVP 初始判断线，不作为长期承诺，应根据流量来源校准。

## 13. 技术方案约束

建议实现：

- React + TypeScript + Vite。
- Tailwind CSS。
- Cloudflare Workers Static Assets。
- Cloudflare Worker API Route。
- Cloudflare Turnstile。
- remove.bg API。
- 前端 Canvas 完成纯色背景合成。

环境变量与 Secret：

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `REMOVE_BG_API_KEY` | Secret | remove.bg 身份验证 |
| `TURNSTILE_SECRET_KEY` | Secret | 服务端校验 Turnstile |
| `VITE_TURNSTILE_SITE_KEY` | Public env | 前端加载 Turnstile |
| `ALLOWED_ORIGIN` | Env | CORS 与来源校验 |

仓库必须忽略：

- `.dev.vars`
- `.dev.vars.*`
- `.env`
- `.env.*`

可提交不含真实密钥的 `.dev.vars.example` 或 `.env.example`。

## 14. 发布验收清单

### 功能

- [ ] 点击、拖放和粘贴均可选择图片。
- [ ] JPG、PNG、WebP 可以正常处理。
- [ ] 非图片和超过 12 MB 的文件在前端及服务端均被拒绝。
- [ ] 透明结果正确显示和下载。
- [ ] 白色、黑色和自定义背景可显示和下载。
- [ ] 更换背景不会产生额外 remove.bg 请求。
- [ ] 失败后可以重试或选择新图片。

### 安全与隐私

- [ ] Git 仓库和前端构建产物中没有 remove.bg API Key。
- [ ] Turnstile 已在生产环境启用。
- [ ] 限流规则已启用并验证。
- [ ] API 和图片响应包含 `Cache-Control: no-store`。
- [ ] 日志不包含图片、文件名、Token 或密钥。
- [ ] Privacy Policy 正确披露 remove.bg 和 Cloudflare。

### 体验与兼容性

- [ ] 手机和桌面布局均可用。
- [ ] 主流浏览器通过手动测试。
- [ ] 上传和下载按钮支持键盘操作。
- [ ] 处理状态和错误信息清晰。
- [ ] 不显示无法验证的虚假进度百分比。

### SEO 与运营

- [ ] Title、Description、H1 和 canonical 正确。
- [ ] `robots.txt` 与 `sitemap.xml` 可访问。
- [ ] Open Graph 信息正确。
- [ ] 分析事件不包含个人或图片数据。
- [ ] remove.bg 账户已有足够额度并配置额度告警。
- [ ] 正式域名、Cloudflare Secret 和生产环境变量均已配置。

## 15. 开发里程碑

### M1：基础界面

- 建立项目脚手架和 Cloudflare 配置。
- 完成响应式首页、上传区和本地预览。
- 完成静态 SEO 内容和基础法律页面。

### M2：核心处理链路

- 完成 Worker API。
- 接入 remove.bg。
- 完成状态管理、结果预览和错误映射。
- 完成透明 PNG 下载。

### M3：编辑与防护

- 完成纯色背景预览及 Canvas 下载。
- 接入 Turnstile 和限流。
- 完成安全、隐私和日志检查。

### M4：测试与上线

- 完成跨浏览器、移动端和异常场景测试。
- 配置 Cloudflare 生产环境。
- 配置域名、SEO、分析和监控。
- 按发布验收清单完成上线检查。

## 16. MVP 完成定义

当真实用户能够在生产域名上无需注册地上传一张合法图片，经安全校验和 remove.bg 处理后预览并下载透明或纯色背景 PNG，且整个过程中本站不持久化图片、密钥未暴露、基础防滥用和错误处理有效时，MVP 视为完成。
