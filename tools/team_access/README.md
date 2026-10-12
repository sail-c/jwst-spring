# 团队数据下载门户

采用 Cloudflare Workers 免费方案验证 GitHub 身份。公开网站仍由 GitHub Pages 提供；数据仍保存在需要密码的群晖分享中。QuickConnect 不支持第三方服务，因此本功能无需在群晖安装 Container Manager 或 Web Station。

成员名单保存在私有配置文件中。五个天区的 PSF 下载链接已配置；NIRCam 和 MIRI 的十个图像下载入口共用同一名单，下载链接暂时留空。服务每次访问和下载都会检查固定的 GitHub 账户 ID；用户名改变不会导致失效。GitHub access token 仅用于查明身份，不保存到浏览器会话中。

## 正式服务地址

- 服务：https://jwst-spring-team.jwst-spring-team-access.workers.dev
- COSMOS 下载门户：https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/psf/cosmos/
- EGS 下载门户：https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/psf/egs/
- GOODS-N 下载门户：https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/psf/goods-n/
- GOODS-S 下载门户：https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/psf/goods-s/
- UDS 下载门户：https://jwst-spring-team.jwst-spring-team-access.workers.dev/team/psf/uds/
- GitHub OAuth 回调：https://jwst-spring-team.jwst-spring-team-access.workers.dev/auth/github/callback
- Cloudflare 设置：https://dash.cloudflare.com/198020e17ad71f88cde85f9a3610d26c/workers/services/view/jwst-spring-team/production/settings

## 文件位置

- worker.mjs：GitHub OAuth、会话、成员检查、PSF 和图像下载跳转。
- portal.mjs、portal.css：登录页、私有下载页和无权限提示。
- wrangler.jsonc：Workers 部署配置，仅包含公开服务地址等非敏感设置。
- private/allowed-users.json：本地成员名单。
- private/products.json：本地群晖下载链接。
- private/initial-secrets.json：初始上传到 Workers 的服务端配置。
- .dev.vars：本机测试配置。
- ../../docs/_static/team-access.json：公开网站需要连接的登录服务地址。

private/、.dev.vars、依赖和缓存都被 Git 忽略，不会进入公开网站构建或公开仓库。真实登录需要正式 Workers 地址和 GitHub OAuth 应用；缺少配置时会显示尚不可用。

## 初次部署

需已登录 Cloudflare 免费账户。安装官方 Node.js 后，在本目录运行：

~~~powershell
npm install
npx wrangler login --scopes account:read user:read workers_scripts:write
npx wrangler deploy --secrets-file private/initial-secrets.json
~~~

官方 Wrangler 会自动附加 offline_access，用于保存刷新凭证和维持登录；它不扩大上述三个资源权限，但会延长无需重新登录即可部署的时间。只在你同意此授权后完成登录。

初次部署将获得形如 https://jwst-spring-team.你的子域名.workers.dev 的 HTTPS 地址。保持 Workers Free，登录服务不使用 R2、付费方案或额外数据库。登录未配置完成前服务会显示尚不可用。

1. 将获得的 HTTPS 服务地址填入 wrangler.jsonc 的 vars.PUBLIC_BASE_URL。
2. 在 GitHub 注册下方 OAuth 应用。
3. 在 Cloudflare → Workers & Pages → jwst-spring-team → Settings → Variables and Secrets 中添加 **Secret**：
   - GITHUB_CLIENT_ID：GitHub OAuth 应用的 Client ID。
   - GITHUB_CLIENT_SECRET：该应用的 Client Secret。
4. 用 npx wrangler deploy 发布更新的公开服务地址。已配置的服务器 Secret 不会写入源码。
5. 将网站的 docs/_static/team-access.json 中 portal_base_url 填为正式 Workers HTTPS 地址，构建并发布网站。
6. 用自己的 GitHub 账号验证完整登录与群晖跳转，再用未在名单的账号检查拒绝提示。

服务端的 SESSION_SECRET、ALLOWED_USERS_JSON、PRODUCTS_JSON 已由初次部署文件配置。Secret 不需要发到聊天，也不放进 wrangler.jsonc。初次部署文件的会话密钥仅供这次服务使用，不要提交到 Git。

## 注册 GitHub 登录应用

打开 https://github.com/settings/developers ，选择 OAuth Apps → New OAuth App。

- Application name：JWST-SPRING Team Downloads
- Homepage URL：https://jwst-spring-team.jwst-spring-team-access.workers.dev
- Authorization callback URL：https://jwst-spring-team.jwst-spring-team-access.workers.dev/auth/github/callback
- 不启用回调 URL 通配匹配。

将该应用的 Client ID、Client Secret 填入上述 Workers Secret。登录只请求基本 GitHub 身份，不请求仓库读写权限。

如不方便使用控制台，可在本机 private/oauth-secrets.json 的 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET 中填写凭证，然后在本目录执行：

~~~powershell
npx wrangler deploy --secrets-file private/oauth-secrets.json
~~~

该私有文件被 Git 忽略；上传时保留服务端现有的成员名单、下载链接和会话密钥。

## 添加和移除成员

在仓库根目录 PowerShell 中运行：

~~~powershell
.\.venv\Scripts\python.exe tools\team_access\manage_members.py list
.\.venv\Scripts\python.exe tools\team_access\manage_members.py add GITHUB_USERNAME
.\.venv\Scripts\python.exe tools\team_access\manage_members.py remove GITHUB_USERNAME
~~~

GITHUB_USERNAME 是实际 GitHub 用户名，不是邮箱。添加命令会查询 GitHub 的固定账户 ID，保存到本地名单。

修改后，将本地名单同步到已部署的 Workers。在 tools/team_access 目录运行：

~~~powershell
Get-Content -Raw private/allowed-users.json | npx wrangler secret put ALLOWED_USERS_JSON
~~~

或者在 Cloudflare 的 Variables and Secrets 中修改 **Secret** ALLOWED_USERS_JSON，内容与 private/allowed-users.json 一致，然后点 Deploy。不要将名单填入公开的 vars。

Secret 更新发布后，后续访问立即按照新名单判断；移除成员后，即使对方保留了原有登录会话，也无法再从门户获取下载入口。已取得的群晖链接依然受群晖分享密码管理。

## 添加其他天区

在本地 private/products.json 加入对应天区的标题和 HTTPS gofile.me 分享链接，然后同步：

~~~powershell
Get-Content -Raw private/products.json | npx wrangler secret put PRODUCTS_JSON
~~~

公开网站已启用 COSMOS、EGS、GOODS-N、GOODS-S 和 UDS 入口。五个天区共用成员白名单，登录一次即可在会话有效期内访问各天区下载页面。配置键和路径分别为 `cosmos`、`egs`、`goods-n`、`goods-s` 和 `uds`，与公开 PSF 页文件名一致。新增其他天区时，需要为相应公开 PSF 页面添加按钮，并扩展 team-access.js 中的天区列表。

## 图像下载链接

NIRCam 和 MIRI 各有 COSMOS、EGS、GOODS-N、GOODS-S、UDS 五个入口。路径为 `/team/imaging/nircam/<field>/` 和 `/team/imaging/miri/<field>/`，其中 `<field>` 与上述五个天区配置键一致。

在 `private/products.json` 中填写 `nircam-cosmos`、`nircam-egs`、`nircam-goods-n`、`nircam-goods-s`、`nircam-uds`，或对应的 `miri-...` 条目中的 `download_url`。这些值初始为 `""`，登录后的下载按钮禁用；直接访问下载接口也不会产生跳转。填入 HTTPS 群晖 gofile.me 分享链接并同步 PRODUCTS_JSON 后，按钮自动启用，无需重建公开网页。

账户名单和登录会话与 PSF 共用。未登录用户需先通过 GitHub 验证，名单外用户看到 Access denied；公开页面只包含登录服务入口，不包含实际群晖分享地址。

## 本地预览与测试

从仓库根目录准备本地配置：

~~~powershell
.\.venv\Scripts\python.exe tools\team_access\prepare_local.py
~~~

已有文件时保留凭证和会话密钥，同时更新成员名单及下载配置。新克隆仓库可先从两个 example.json 复制 private/allowed-users.json 和 private/products.json，再填写自己的成员与分享链接。之后在本目录运行：

~~~powershell
npm test
npx wrangler deploy --dry-run --outdir private/bundle
npx wrangler dev --ip 127.0.0.1 --port 8772
~~~

浏览器打开 http://127.0.0.1:8772/team/psf/cosmos/ 。正式 OAuth 应用应使用正式 Workers 回调地址；如要本机测试真实登录，另注册一个本地测试应用，回调填 http://127.0.0.1:8772/auth/github/callback ，凭证仅放入本机 .dev.vars。

测试模拟 GitHub 的 API 响应，不等于线上端到端验证；实际登录仍需完成上述部署和 OAuth 设置。测试还使用 Wrangler 自带的 Miniflare / workerd，验证正式运行环境中的请求参数和登录流程。GitHub 请求使用 `redirect: "manual"`，并拒绝重定向响应；Workers 不支持 `redirect: "error"`。

## 登录失败排查

登录失败后会回到没有授权码的门户地址，显示 Sign-in unsuccessful 和固定的 Diagnostic 编号。只需报告编号，不要发送回调网址、授权码、Cookie 或密钥。

- `session` / `state`：重新从入口发起登录，使用同一浏览器和一个标签页，允许站点 Cookie。
- `credentials`：核对同一个 GitHub OAuth 应用的 Client ID 和 Client Secret，再同步 Workers Secrets。
- `callback`：核对 OAuth 应用回调地址与本文件列出的地址是否完全一致。
- `code`：授权码已过期或已使用，重新发起登录。
- `email`：在 GitHub 验证主邮箱。
- `token_network` / `profile_network`：服务到 GitHub 的网络请求失败，可重新登录。
- `token_http` / `profile_http` / `token_response` / `profile_response` / `session_create`：由管理员排查对应请求或服务处理。

这些诊断只来自正常登录流程，不记录 GitHub 响应正文、访问令牌或授权参数。


参考：
- https://www.cloudflare.com/products/workers/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://kb.synology.com/en-global/DSM/tutorial/Which_services_support_QuickConnect
