import app from '../hono/hono';
import accountService from '../service/account-service';
import email from '../entity/email';
import orm from '../entity/orm';
import roleService from '../service/role-service';
import userService from '../service/user-service';
import BizError from '../error/biz-error';
import emailUtils from '../utils/email-utils';
import verifyUtils from '../utils/verify-utils';
import { extractVerificationCode } from '../utils/verification-code';
import emailService from '../service/email-service';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';

const apiPath = '/admin/api';
const senderEmail = 'admin@vsvdvv.cc';
const maxSendContentLength = 100_000;

function requestEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function statusCode(error) {
    const code = Number(error?.code);
    return Number.isInteger(code) && code >= 400 && code < 600 ? code : 500;
}

function requireApiKey(c) {
    const expected = c.env.MAIL_API_KEY;
    const provided = c.req.header('X-API-Key') || c.req.query('key');

    if (!expected) throw new BizError('MAIL_API_KEY is not configured', 503);
    if (!provided || provided !== expected) throw new BizError('Invalid API key', 401);
}

async function withApiKey(c, handler) {
    try {
        requireApiKey(c);
        return c.json({ status: 'success', data: await handler() });
    } catch (error) {
        return c.json({ status: 'error', message: error.message }, statusCode(error));
    }
}

async function requestData(c) {
    if (c.req.method === 'GET') return c.req.query();
    try {
        return await c.req.json();
    } catch {
        throw new BizError('Request body must be valid JSON', 400);
    }
}

export function validateSendRequest(params) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
        throw new BizError('Request body must be a JSON object', 400);
    }
    if (Object.keys(params).some(key => !['to', 'subject', 'text', 'html'].includes(key))) {
        throw new BizError('Only to, subject, text, and html are accepted', 400);
    }

    const to = requestEmail(params.to);
    const subject = typeof params.subject === 'string' ? params.subject.trim() : '';
    if ((params.text != null && typeof params.text !== 'string') || (params.html != null && typeof params.html !== 'string')) {
        throw new BizError('Text and HTML content must be strings', 400);
    }
    const text = params.text || '';
    const html = params.html || '';

    if (!verifyUtils.isEmail(to)) throw new BizError('Invalid recipient email', 400);
    if (!subject || subject.length > 255 || /[\r\n]/.test(subject)) {
        throw new BizError('Subject must be 1-255 characters without line breaks', 400);
    }
    if (!text.trim() && !html.trim()) throw new BizError('Text or HTML content is required', 400);
    if (text.length + html.length > maxSendContentLength) {
        throw new BizError(`Text and HTML content must not exceed ${maxSendContentLength} characters combined`, 400);
    }

    return { to, subject, text, html };
}

async function sendEmail(c) {
    const { to, subject, text, html } = validateSendRequest(await requestData(c));
    if (requestEmail(c.env.admin) !== senderEmail) {
        throw new BizError(`Configured admin email must be ${senderEmail}`, 503);
    }

    const [userRow, accountRow] = await Promise.all([
        userService.selectByEmail(c, senderEmail),
        accountService.selectByEmailIncludeDel(c, senderEmail)
    ]);
    if (!userRow || !accountRow || accountRow.isDel !== isDel.NORMAL) {
        throw new BizError(`Sender mailbox ${senderEmail} is not available`, 503);
    }

    const [sent] = await emailService.send(c, {
        accountId: accountRow.accountId,
        name: 'admin',
        sendType: 'new',
        receiveEmail: [to],
        subject,
        text,
        content: html,
        attachments: []
    }, userRow.userId);

    return { from: senderEmail, to, emailId: sent.emailId, messageId: sent.resendEmailId || null };
}

async function createMailbox(c) {
    const params = await requestData(c);
    const emailAddress = requestEmail(params.email);
    const password = typeof params.password === 'string' ? params.password : '';

    if (!verifyUtils.isEmail(emailAddress)) throw new BizError('Invalid email', 400);
    if (password.length < 6) throw new BizError('Password must be at least 6 characters', 400);

    const defaultRole = await roleService.selectDefaultRole(c);
    if (!defaultRole) throw new BizError('Default role is not configured', 500);
    if (!roleService.hasAvailDomainPerm(defaultRole.availDomain || '', emailAddress)) {
        throw new BizError('Email domain is not allowed', 403);
    }

    await userService.add(c, { email: emailAddress, password, type: defaultRole.roleId });

    const [userRow, accountRow] = await Promise.all([
        userService.selectByEmail(c, emailAddress),
        accountService.selectByEmailIncludeDel(c, emailAddress)
    ]);

    return { userId: userRow?.userId, accountId: accountRow?.accountId, email: emailAddress };
}

async function latestMailboxEmail(c) {
    const emailAddress = requestEmail(c.req.query('email'));
    if (!verifyUtils.isEmail(emailAddress)) throw new BizError('Invalid email', 400);

    const row = await orm(c).select().from(email).where(and(
        sql`${email.toEmail} COLLATE NOCASE = ${emailAddress}`,
        eq(email.type, emailConst.type.RECEIVE),
        eq(email.isDel, isDel.NORMAL),
        ne(email.status, emailConst.status.SAVING)
    )).orderBy(desc(email.emailId)).limit(1).get();

    if (!row) return null;
    const body = emailUtils.formatText(row.text || emailUtils.htmlToText(row.content));
    const verificationCode = extractVerificationCode(`${row.subject || ''} ${body}`);

    return {
        subject: row.subject || '',
        from_address: row.sendEmail || '',
        to_address: row.toEmail,
        received_time: row.createTime,
        body,
        verification_code: verificationCode,
        code: verificationCode
    };
}

app.post(`${apiPath}/emails/add`, (c) => withApiKey(c, () => createMailbox(c)));
app.get(`${apiPath}/emails/add`, (c) => withApiKey(c, () => createMailbox(c)));
app.get(`${apiPath}/realtime/latest`, (c) => withApiKey(c, () => latestMailboxEmail(c)));
app.post(`${apiPath}/emails/send`, (c) => withApiKey(c, () => sendEmail(c)));
