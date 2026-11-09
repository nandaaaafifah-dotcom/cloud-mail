<template>
  <el-scrollbar class="doc-scroll">
    <main class="doc-page">
      <header class="doc-heading">
        <div class="title-line">
          <Icon icon="mdi:code-json" width="23" height="23" />
          <h1>{{ $t('externalApiTitle') }}</h1>
        </div>
        <p>{{ $t('externalApiIntro') }}</p>
      </header>

      <section class="key-note" aria-labelledby="key-title">
        <h2 id="key-title">{{ $t('apiKeyTitle') }}</h2>
        <p>{{ $t('apiKeyHelp') }}</p>
        <div class="auth-note">
          {{ $t('apiAuthNote') }}
          <code>X-API-Key: YOUR_MAIL_API_KEY</code>
        </div>
      </section>

      <section class="endpoint" aria-labelledby="create-title">
        <div class="endpoint-heading">
          <div class="methods"><span class="method post">POST</span><span class="method get">GET</span></div>
          <h2 id="create-title">{{ $t('apiCreateTitle') }}</h2>
        </div>
        <code class="path">{{ origin }}/admin/api/emails/add</code>
        <p class="description">{{ $t('apiCreateDesc') }}</p>
        <h3>{{ $t('apiParams') }}</h3>
        <ul class="params">
          <li><code>email</code><span>{{ $t('apiEmailParam') }}</span></li>
          <li><code>password</code><span>{{ $t('apiPasswordParam') }}</span></li>
        </ul>
        <h3>{{ $t('apiRequest') }} · POST JSON</h3>
        <pre><code>{{ createRequest }}</code></pre>
        <h3>{{ $t('apiRequest') }} · cURL</h3>
        <pre><code>{{ createCurl }}</code></pre>
        <h3>{{ $t('apiSuccess') }}</h3>
        <pre><code>{{ createResponse }}</code></pre>
        <h3>{{ $t('apiGetExample') }}</h3>
        <pre><code>{{ createGetExample }}</code></pre>
        <p class="small-note">{{ $t('apiGetWarning') }}</p>
      </section>

      <section class="endpoint" aria-labelledby="latest-title">
        <div class="endpoint-heading">
          <span class="method get">GET</span>
          <h2 id="latest-title">{{ $t('apiLatestTitle') }}</h2>
        </div>
        <code class="path">{{ origin }}/admin/api/realtime/latest?email=user@example.com</code>
        <p class="description">{{ $t('apiLatestDesc') }}</p>
        <h3>{{ $t('apiParams') }}</h3>
        <ul class="params">
          <li><code>email</code><span>{{ $t('apiEmailParam') }}</span></li>
        </ul>
        <h3>{{ $t('apiRequest') }} · cURL</h3>
        <pre><code>{{ latestCurl }}</code></pre>
        <h3>{{ $t('apiSuccess') }}</h3>
        <pre><code>{{ latestResponse }}</code></pre>
        <p class="small-note">{{ $t('apiEmptyResult') }}</p>
      </section>
    </main>
  </el-scrollbar>
</template>

<script setup>
import { Icon } from '@iconify/vue'

const origin = window.location.origin
const createRequest = `{
  "email": "user@example.com",
  "password": "password123"
}`
const createCurl = `curl -X POST "${origin}/admin/api/emails/add" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_MAIL_API_KEY" \\
  -d '{"email":"user@example.com","password":"password123"}'`
const createGetExample = `${origin}/admin/api/emails/add?key=YOUR_MAIL_API_KEY&email=user%40example.com&password=password123`
const createResponse = `{
  "status": "success",
  "data": {
    "userId": 123,
    "accountId": 456,
    "email": "user@example.com"
  }
}`
const latestCurl = `curl "${origin}/admin/api/realtime/latest?email=user@example.com" \\
  -H "X-API-Key: YOUR_MAIL_API_KEY"`
const latestResponse = `{
  "status": "success",
  "data": {
    "subject": "Your verification code",
    "from_address": "no-reply@example.org",
    "to_address": "user@example.com",
    "received_time": "2026-11-09 12:00:00",
    "body": "Your verification code is 839201",
    "verification_code": "839201",
    "code": "839201"
  }
}`
</script>

<style scoped>
.doc-scroll {
  height: 100%;
}

.doc-page {
  width: min(calc(100% - 40px), 1120px);
  margin: 0 auto;
  padding: 24px 0 48px;
  color: var(--el-text-color-primary);
}

.doc-heading {
  padding-bottom: 18px;
}

.title-line,
.endpoint-heading,
.methods {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-line {
  color: var(--el-color-primary);
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  color: var(--el-text-color-primary);
  font-size: 21px;
  font-weight: 650;
}

.doc-heading p,
.description {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  line-height: 1.65;
}

.key-note {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.key-note h2 {
  font-size: 14px;
  margin-bottom: 7px;
}

.key-note p,
.auth-note {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.auth-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 9px;
}

.endpoint {
  padding: 24px 0 28px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.endpoint-heading {
  flex-wrap: wrap;
  gap: 10px;
}

.endpoint-heading h2 {
  font-size: 17px;
  font-weight: 620;
}

.methods {
  gap: 6px;
}

.method {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.post {
  color: #0879b9;
  background: #e5f5ff;
}

.get {
  color: #287744;
  background: #e8f6eb;
}

.path {
  display: block;
  margin-top: 12px;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.endpoint h3 {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 650;
}

.params {
  margin: 0;
  padding: 0;
  list-style: none;
}

.params li {
  display: flex;
  gap: 10px;
  padding: 4px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.params code,
.small-note code,
.auth-note code {
  color: var(--el-color-primary);
}

pre {
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  border-radius: 5px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  tab-size: 2;
}

pre code {
  white-space: pre;
}

.small-note {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.65;
}

@media (max-width: 600px) {
  .doc-page {
    width: calc(100% - 28px);
    padding-top: 18px;
  }

  .endpoint {
    padding-top: 20px;
  }

  pre {
    padding: 12px;
    font-size: 11px;
  }
}
</style>
