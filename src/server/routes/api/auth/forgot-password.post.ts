import { createError, defineEventHandler, readBody } from 'h3';
import { IS_DEV, MOCK } from '../../../utils/dev-mock';
import { assertEmail } from '../../../utils/validate';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = assertEmail(body?.email);

  if (IS_DEV) return MOCK.forgotPassword(email);

  const res = await fetch(`${process.env['API_URL']}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
