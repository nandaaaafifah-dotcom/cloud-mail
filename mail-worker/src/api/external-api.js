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
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';

const apiPath = '/admin/api';

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
