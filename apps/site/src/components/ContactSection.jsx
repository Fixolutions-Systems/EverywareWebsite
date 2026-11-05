import React, { useState } from 'react';
import { ApiError, joinWaitlist, sendLead } from '../lib/publicSiteApi';

const MODES = {
  waitlist: {
    label: 'Join the waitlist',
    submit: joinWaitlist,
    placeholder: 'Anything we should know? (city, appliances, ...)',
    done: "You're on the list. We'll be in touch soon.",
  },
  lead: {
    label: 'Send an enquiry',
    submit: sendLead,
    placeholder: 'How can we help?',
    done: 'Thanks! We have your message and will reply shortly.',
  },
};

const EMPTY = { name: '', email: '', phone: '', message: '' };

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(8, 27, 30, 0.15)',
  fontFamily: 'inherit',
  fontSize: '0.95rem',
  background: 'var(--canvas-card)',
};

export default function ContactSection() {
  const [mode, setMode] = useState('waitlist');
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState(null);

  const config = MODES[mode];
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (!values.email.trim() && !values.phone.trim()) {
      setStatus('error');
      setError('Please give us an email address or a phone number.');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await config.submit(values);
      setValues(EMPTY);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <section id="contact" style={{ padding: '80px 24px', background: 'var(--canvas-subtle)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Get in touch</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          Join the waitlist for early access, or send us a question.
        </p>

        <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => { setMode(key); setStatus('idle'); setError(null); }}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid var(--brand-cyan)',
                background: mode === key ? 'var(--brand-cyan)' : 'transparent',
                color: mode === key ? '#fff' : 'var(--brand-ink)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {status === 'done' ? (
          <p role="status" style={{ fontWeight: 600, color: 'var(--brand-cyan)' }}>{config.done}</p>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }} noValidate>
            <input style={inputStyle} aria-label="Name" placeholder="Your name" autoComplete="name"
              value={values.name} onChange={set('name')} required maxLength={200} />
            <input style={inputStyle} aria-label="Email" type="email" placeholder="Email" autoComplete="email"
              value={values.email} onChange={set('email')} />
            <input style={inputStyle} aria-label="Phone" type="tel" placeholder="Phone (optional if you gave an email)"
              autoComplete="tel" value={values.phone} onChange={set('phone')} />
            <textarea style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} aria-label="Message"
              placeholder={config.placeholder} value={values.message} onChange={set('message')} required maxLength={2000} />
            {status === 'error' && <p role="alert" style={{ color: 'var(--accent-coral)' }}>{error}</p>}
            <button type="submit" disabled={status === 'sending'} style={{
              padding: '12px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: 'var(--brand-cyan)', color: '#fff', fontWeight: 700, fontSize: '1rem',
            }}>
              {status === 'sending' ? 'Sending...' : config.label}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
