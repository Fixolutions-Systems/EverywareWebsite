import { describe, expect, it, vi } from 'vitest';
import { ApiError, joinWaitlist, sendLead } from './publicSiteApi.js';

const reply = (status, body, headers = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers });

const opts = (fetchImpl) => ({ fetchImpl, baseUrl: 'https://api.test/api/public-site/v1' });

describe('publicSiteApi', () => {
  it('posts a trimmed lead and nulls blank contact fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(202, undefined, { 'X-Request-ID': 'r1' }));
    const result = await sendLead(
      { name: '  Asha ', email: ' a@b.in ', phone: '  ', message: ' hi ' },
      opts(fetchImpl),
    );
    expect(result).toEqual({ requestId: 'r1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.test/api/public-site/v1/leads');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ name: 'Asha', email: 'a@b.in', phone: null, message: 'hi' });
  });

  it('uses the waitlist path for joinWaitlist', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply(202));
    await joinWaitlist({ name: 'A', phone: '9', message: 'm' }, opts(fetchImpl));
    expect(fetchImpl.mock.calls[0][0]).toMatch(/\/waitlist$/);
  });

  it('maps a 400 to an ApiError with code and field', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      reply(400, { error: { code: 'invalid_email', message: 'x', field: 'email', requestId: 'r2' } }),
    );
    const err = await sendLead({ name: 'A', email: 'bad', message: 'm' }, opts(fetchImpl)).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: 'invalid_email', field: 'email', requestId: 'r2' });
  });

  it('reads Retry-After on 429', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      reply(429, { error: { code: 'rate_limited', message: 'x', field: null, requestId: 'r3' } }, { 'Retry-After': '120' }),
    );
    const err = await joinWaitlist({ name: 'A', email: 'a@b.in', message: 'm' }, opts(fetchImpl)).catch((e) => e);
    expect(err).toMatchObject({ status: 429, code: 'rate_limited', retryAfter: 120 });
  });

  it('reports a network failure and a non-JSON error body', async () => {
    const down = await sendLead({ name: 'A', message: 'm' }, opts(vi.fn().mockRejectedValue(new TypeError('x')))).catch((e) => e);
    expect(down).toMatchObject({ status: 0, code: 'network_error' });

    const html = new Response('<html>bad gateway</html>', { status: 502 });
    const bad = await sendLead({ name: 'A', message: 'm' }, opts(vi.fn().mockResolvedValue(html))).catch((e) => e);
    expect(bad).toMatchObject({ status: 502, code: 'unknown' });
  });
});
