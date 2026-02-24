'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 font-medium">You&apos;re subscribed! Check your inbox.</p>
      </div>
    );
  }

  return (
    <div className="bg-xtal-ice/50 rounded-xl p-6 mt-12">
      <h3 className="font-bold text-xtal-navy text-lg mb-1">Get more like this</h3>
      <p className="text-sm text-slate-500 mb-4">AI-powered ecommerce search insights, delivered monthly.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-xtal-navy/20 focus:border-xtal-navy outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-xtal-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-xtal-navy/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Subscribe
        </button>
      </form>
      {status === 'error' && <p className="text-red-500 text-xs mt-2">Something went wrong. Please try again.</p>}
    </div>
  );
}
