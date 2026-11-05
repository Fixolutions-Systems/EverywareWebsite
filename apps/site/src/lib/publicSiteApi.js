// Client for the Fixolutions Public Site API (server-go/openapi/public-site.v1.yaml).
// Only the two write operations live here. The blog stays on Ghost: the API's
// Post has no tags, authors, images or SEO fields, so it cannot replace it yet.

const DEFAULT_BASE_URL = '/api/public-site/v1';

/** The API origin + path prefix. Set VITE_API_BASE_URL for a cross-origin API. */
export const getBaseUrl = () =>
  (import.meta.env?.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

/** A failed call, carrying the API's stable error code (see shared.yaml Error). */
export class ApiError extends Error {
  constructor({ status, code, field = null, requestId = null, retryAfter = null, message }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.field = field;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

// Messages are ours; the API says clients must not parse its `message`.
const MESSAGES = {
  invalid_name: 'Please enter your name.',
  invalid_message: 'Please enter a message (it may be too long or too short).',
  invalid_email: 'That email address does not look right.',
  invalid_phone: 'That phone number does not look right.',
  rate_limited: 'Too many attempts. Please try again a little later.',
  network_error: 'Could not reach the server. Check your connection and try again.',
};
const FALLBACK_MESSAGE = 'Something went wrong. Please try again, or email admin@everyware.in.';

const clean = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed === '' ? null : trimmed;
};

async function post(path, input, { fetchImpl = globalThis.fetch, baseUrl = getBaseUrl() } = {}) {
  const body = {
    name: (input.name ?? '').trim(),
    message: (input.message ?? '').trim(),
    email: clean(input.email),
    phone: clean(input.phone),
  };

  let response;
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError({ status: 0, code: 'network_error', message: MESSAGES.network_error });
  }

  if (response.status === 202) return { requestId: response.headers.get('X-Request-ID') };

  let error = {};
  try {
    error = (await response.json()).error ?? {};
  } catch {
    // Non-JSON body (e.g. a proxy error page): fall through to the fallback.
  }
  const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
  throw new ApiError({
    status: response.status,
    code: error.code ?? 'unknown',
    field: error.field ?? null,
    requestId: error.requestId ?? response.headers.get('X-Request-ID'),
    retryAfter: Number.isNaN(retryAfter) ? null : retryAfter,
    message: MESSAGES[error.code] ?? FALLBACK_MESSAGE,
  });
}

/** POST /leads: the contact form. 202 on success. */
export const sendLead = (input, options) => post('/leads', input, options);

/** POST /waitlist: join the waitlist. 202 on success. */
export const joinWaitlist = (input, options) => post('/waitlist', input, options);
