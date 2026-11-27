'use client';

import React, { useState, type FormEvent } from 'react';
import { ArrowUpRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/http';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('admin@rktiles.com');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setError('');
    try {
      await login({ email: email.trim(), password });
      onLoginSuccess();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Invalid email or password');
      } else {
        setError(err?.message || 'An unexpected error occurred during sign in');
      }
    }
  };

  return (
    <main className="login-page">
      <div className="login-art">
        <div className="login-brand">
          <span className="brand-mark">RK</span>
          <span>
            RK TILES<span className="brand-sub">SURFACES, REIMAGINED</span>
          </span>
        </div>
        <div className="login-art-copy">
          <span className="eyebrow">THE ADMIN WORKSPACE</span>
          <h1>
            Thoughtful surfaces.
            <br />
            Thoughtful business.
          </h1>
          <p>Your central space to shape the RK Tiles catalogue and dealer experience.</p>
          <div className="art-caption">
            <span className="caption-line" /> Curated for the way you work
          </div>
        </div>
        <div className="login-photo-credit">A quieter kind of luxury</div>
      </div>

      <section className="login-form-wrap">
        <div className="login-mobile-brand">
          <span className="brand-mark">RK</span> RK TILES
        </div>
        <div className="login-form">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p className="muted">Enter your admin credentials to continue.</p>

          <form onSubmit={submit}>
            <label>
              Email address
              <input
                autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn}
                placeholder="admin@rktiles.com"
              />
            </label>

            <label>
              Password
              <span className="password-field">
                <input
                  autoComplete="current-password"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoggingIn}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}

            <button className="primary-button wide" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                'Signing in...'
              ) : (
                <>
                  Sign in <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-hint">
            <ShieldCheck size={15} /> Secure admin access <span>·</span> Demo: admin@rktiles.com /
            Admin@123456
          </div>
        </div>

        <div className="login-footer">
          © 2026 RK Tiles <span>Privacy</span>
          <span>Help</span>
        </div>
      </section>
    </main>
  );
}
