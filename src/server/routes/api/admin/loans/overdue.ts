import { defineEventHandler, getHeaders, getQuery, createError } from 'h3';
import { allowQueryParams } from '../../../../utils/validate';
import { IS_DEV, MOCK } from '../../../../utils/dev-mock';

export default defineEventHandler(async (event) => {
  const { authorization } = getHeaders(event);
  if (!authorization) throw createError({ statusCode: 401, message: 'Unauthorized' });

  if (IS_DEV) return { data: MOCK.overdueLoans };

  const params = allowQueryParams(getQuery(event), ['page', 'size', 'sort']);

  const res = await fetch(`${process.env['API_URL']}/admin/loans/overdue?${params}`, {
    headers: { Authorization: authorization },
  });

  if (!res.ok) throw createError({ statusCode: res.status, message: await res.text() });
  return res.json();
});
