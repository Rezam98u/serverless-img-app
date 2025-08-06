import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const initialState = {
  email: '',
  password: '',
  confirmPassword: '',
  confirmationCode: '',
};

export default function AuthForm({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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
    if (isConfirming && !form.confirmationCode) v.confirmationCode = 'Confirmation code is required';
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    
    try {
      if (isConfirming) {
        // Handle email confirmation
        await confirmSignUp({ username: form.email, confirmationCode: form.confirmationCode });
        setIsConfirming(false);
        setIsSignUp(false);
        setForm(initialState);
        setError('Email confirmed successfully! Please sign in.');
      } else if (isSignUp) {
        // Handle sign up
        await signUp({ username: form.email, password: form.password });
        setIsConfirming(true);
        setError('Please check your email for a confirmation code and enter it below.');
      } else {
        // Handle sign in
        await signIn({ username: form.email, password: form.password });
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await signUp({ username: form.email, password: form.password });
      setError('New confirmation code sent! Please check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setIsSignUp(false);
    setIsConfirming(false);
    setForm(initialState);
    setError('');
  };

  const renderForm = () => {
    if (isConfirming) {
      return (
        <>
          <div className="form-group">
            <label>Confirmation Code</label>
            <input
              type="text"
              name="confirmationCode"
              value={form.confirmationCode}
              onChange={handleChange}
              placeholder="Enter the code from your email"
              disabled={loading}
              className={validation.confirmationCode ? 'invalid' : ''}
              autoComplete="one-time-code"
            />
            {validation.confirmationCode && <div className="validation-msg">{validation.confirmationCode}</div>}
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm Email'}
          </button>
          <div className="switch-mode">
            <button type="button" onClick={handleResendCode} className="link-btn" disabled={loading}>
              Resend Code
            </button>
            <span style={{ margin: '0 0.5rem' }}>•</span>
            <button type="button" onClick={handleBackToSignIn} className="link-btn">
              Back to Sign In
            </button>
          </div>
        </>
      );
    }

    return (
      <>
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
      </>
    );
  };

  const getTitle = () => {
    if (isConfirming) return 'Confirm Email';
    return isSignUp ? 'Sign Up' : 'Sign In';
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{getTitle()}</h2>
        {error && <div className="error-msg">{error}</div>}
        {renderForm()}
      </form>
    </div>
  );
}