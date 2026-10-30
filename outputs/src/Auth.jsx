import { useState } from 'react'
import { supabase } from './lib/supabase'
import { Sparkles } from 'lucide-react'

/** Email/password sign-in and sign-up form. Pass onSignedIn to receive the authenticated user. */
export function Auth({ onSignedIn }) {
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const result = mode === 'sign-up'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (result.data.session) {
        onSignedIn?.(result.data.session.user)
      } else {
        setError('Check your email to confirm your account, then sign in.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const isSignUp = mode === 'sign-up'

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="#home" aria-label="Learnly home">
          <span className="auth-brand-mark"><Sparkles size={18} fill="currentColor" /></span>
          <span>learnly<span className="auth-brand-dot">.</span></span>
        </a>

        <div className="auth-heading">
          <p className="auth-eyebrow">YOUR LEARNING SPACE</p>
          <h1 id="auth-title">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isSignUp ? 'Start making progress, one lesson at a time.' : 'Sign in to pick up where you left off.'}</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
          />

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder={isSignUp ? 'At least 8 characters' : 'Enter your password'}
            minLength={8}
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isSignUp ? 'Already have an account?' : 'New to Learnly?'}{' '}
          <button
            type="button"
            onClick={() => {
              setError('')
              setMode(isSignUp ? 'sign-in' : 'sign-up')
            }}
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  )
}
