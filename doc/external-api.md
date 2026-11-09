# 外部邮箱 API

部署工作流会读取 `MAIL_API_KEY`，并把它保存为 Cloudflare Worker Secret。请在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 新增同名 Secret。

- `POST /admin/api/emails/add` 或 `/api/admin/api/emails/add`
- `GET /admin/api/emails/add?key=...&email=...&password=...`
- `GET /admin/api/realtime/latest?key=...&email=...`

推荐把密钥放在请求头：`X-API-Key: 你的 MAIL_API_KEY`。

创建邮箱 JSON：

```json
{"email":"user@example.com","password":"password123"}
```

获取最新邮件会返回 `subject`、`from_address`、`to_address`、`received_time`、`body`、`verification_code` 和 `code`。没有邮件时 `data` 为 `null`。
