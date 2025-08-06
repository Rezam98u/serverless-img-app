import React, { useState } from 'react';
import { signIn, signUp } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const initialState = {
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AuthForm({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setValidation({ ...validation, [e.target.name]: '' });
  };

  const validate = () => {
    const v = {};
    if (!form.email) v.email = 'Email is required';
    if (!form.password) v.password = 'Password is required';
    if (isSignUp && form.password !== form.confirmPassword) v.confirmPassword = 'Passwords do not match';
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUp({ username: form.email, password: form.password });
        setIsSignUp(false);
        setForm(initialState);
        setError('Sign up successful! Please sign in.');
      } else {
        await signIn({ username: form.email, password: form.password });
        if (onAuthSuccess) onAuthSuccess();
        // navigate('/'); // Navigation is now handled by App.js
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="username"
            disabled={loading}
            className={validation.email ? 'invalid' : ''}
          />
          {validation.email && <div className="validation-msg">{validation.email}</div>}
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            disabled={loading}
            className={validation.password ? 'invalid' : ''}
          />
          {validation.password && <div className="validation-msg">{validation.password}</div>}
        </div>
        {isSignUp && (
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
              className={validation.confirmPassword ? 'invalid' : ''}
            />
            {validation.confirmPassword && <div className="validation-msg">{validation.confirmPassword}</div>}
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
        <div className="switch-mode">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => { setIsSignUp(false); setError(''); }} className="link-btn">Sign In</button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => { setIsSignUp(true); setError(''); }} className="link-btn">Sign Up</button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}