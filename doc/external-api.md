# Cloud Mail 外部 API 文档

通过这些接口创建邮箱账户，并查询该邮箱收到的最新邮件和验证码。

## 基本信息

- 线上 API 地址：`https://vsvdvv.cc`
- 请求与响应格式：JSON
- API 密钥：在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中配置 `MAIL_API_KEY`。部署工作流会把它写入 Cloudflare Worker Secret。
- 文档页：登录管理员账号后，在左侧 **管理 → API 接口** 查看。

所有接口都需要 API 密钥。推荐通过请求头传入：

```http
X-API-Key: YOUR_MAIL_API_KEY
```

也支持 URL 参数 `key`，但 URL 可能被浏览器、代理或访问日志记录，因此建议使用请求头。请勿把真实密钥提交到代码仓库。

## 创建邮箱账户

`POST /admin/api/emails/add`

创建用户及其邮箱账户。`email` 必须是完整邮箱地址；域名必须在系统默认角色允许的域名列表中。如果默认角色没有配置允许域名，则不限制域名。

请求头：

```http
Content-Type: application/json
X-API-Key: YOUR_MAIL_API_KEY
```

请求体：

```json
{
  "email": "user@vsvdvv.cc",
  "password": "password123"
}
```

`password` 至少 6 个字符。

cURL 示例：

```bash
curl -X POST "https://vsvdvv.cc/admin/api/emails/add" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MAIL_API_KEY" \
  -d '{"email":"user@vsvdvv.cc","password":"password123"}'
```

成功响应示例：

```json
{
  "status": "success",
  "data": {
    "userId": 123,
    "accountId": 456,
    "email": "user@vsvdvv.cc"
  }
}
```

### GET 兼容方式

支持 `GET /admin/api/emails/add?key=...&email=...&password=...`。此方式会把密钥和密码放在 URL 中，不建议用于正式调用；请优先使用上面的 POST 请求。

## 获取最新邮件和验证码

`GET /admin/api/realtime/latest?email=user%40vsvdvv.cc`

`email` 必须是完整邮箱地址。接口按收件地址精确匹配（不区分大小写），返回该地址最新收到的一封邮件；只传域名不能查询该域下的所有邮箱。

cURL 示例：

```bash
curl "https://vsvdvv.cc/admin/api/realtime/latest?email=user%40vsvdvv.cc" \
  -H "X-API-Key: YOUR_MAIL_API_KEY"
```

成功响应示例：

```json
{
  "status": "success",
  "data": {
    "subject": "Your verification code",
    "from_address": "no-reply@example.org",
    "to_address": "user@vsvdvv.cc",
    "received_time": "2026-11-09 12:00:00",
    "body": "Your verification code is 839201",
    "verification_code": "839201",
    "code": "839201"
  }
}
```

- 没有收到邮件时，`data` 为 `null`。
- 邮件中未识别到验证码时，`verification_code` 和 `code` 为 `null`。
- `verification_code` 与 `code` 表示同一个验证码。

## 使用管理员邮箱发送邮件

`POST /admin/api/emails/send`

固定使用 `admin@vsvdvv.cc` 作为发件地址，不接受请求指定 `from`。需要已启用系统邮件发送，并为 `vsvdvv.cc` 配置有效的 Resend Token。

请求头：

```http
Content-Type: application/json
X-API-Key: YOUR_MAIL_API_KEY
```

请求体中 `to` 为单个收件人，`subject` 为 1–255 个字符且不含换行；`text` 和 `html` 至少提供一项，两者合计最多 100000 个字符。

```json
{
  "to": "recipient@example.com",
  "subject": "Your verification code",
  "text": "Your verification code is 839201",
  "html": "<p>Your verification code is <strong>839201</strong></p>"
}
```

cURL 示例：

```bash
curl -X POST "https://vsvdvv.cc/admin/api/emails/send" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_MAIL_API_KEY" \
  -d '{"to":"recipient@example.com","subject":"Your verification code","text":"Your verification code is 839201"}'
```

成功响应：

```json
{
  "status": "success",
  "data": {
    "from": "admin@vsvdvv.cc",
    "to": "recipient@example.com",
    "emailId": 789,
    "messageId": "resend-message-id"
  }
}
```

`emailId` 是系统邮件记录 ID；站内收件时 `messageId` 为 `null`，通过 Resend 发送时为 Resend 返回的消息 ID。

## 错误响应

```json
{
  "status": "error",
  "message": "Invalid API key"
}
```

常见 HTTP 状态码：

| 状态码 | 含义 |
| --- | --- |
| `400` | 邮箱格式错误、密码长度不足或请求 JSON 无效 |
| `401` | API 密钥无效 |
| `403` | 默认角色不允许使用该邮箱域名 |
| `500` | 默认角色未配置或服务器处理失败 |
| `503` | Cloudflare Worker 未配置 `MAIL_API_KEY` |

## 安全建议

- 把密钥放在 `X-API-Key` 请求头中，不要放在 URL 中。
- 优先使用 POST 创建邮箱，避免密码进入 URL、浏览器历史或访问日志。
- 不要把真实 API 密钥写进代码、截图、公开文档或提交记录。
