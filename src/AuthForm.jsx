import React, { useState, useCallback } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
// import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const initialState = {
  email: '',
  password: '',
  confirmPassword: '',
  confirmationCode: '',
};

// Password validation rules
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/\d/.test(password)) errors.push('One number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
  return errors;
};

export default function AuthForm({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState({});
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [attempts, setAttempts] = useState(0);
  // const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setValidation(prev => ({ ...prev, [name]: '' }));
    
    // Real-time password validation for sign up
    if (name === 'password' && isSignUp) {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  }, [isSignUp]);

  const validate = useCallback(() => {
    const v = {};
    
    // Email validation
    if (!form.email) {
      v.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      v.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      v.password = 'Password is required';
    } else if (isSignUp && passwordErrors.length > 0) {
      v.password = 'Password does not meet requirements';
    }
    
    // Confirm password validation
    if (isSignUp && form.password !== form.confirmPassword) {
      v.confirmPassword = 'Passwords do not match';
    }
    
    // Confirmation code validation
    if (isConfirming && !form.confirmationCode) {
      v.confirmationCode = 'Confirmation code is required';
    }
    
    setValidation(v);
    return Object.keys(v).length === 0;
  }, [form, isSignUp, isConfirming, passwordErrors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    // Rate limiting
    if (attempts >= 5) {
      setError('Too many attempts. Please wait a few minutes before trying again.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isConfirming) {
        await confirmSignUp({ 
          username: form.email, 
          confirmationCode: form.confirmationCode 
        });
        setIsConfirming(false);
        setIsSignUp(false);
        setForm(initialState);
        setError('Email confirmed successfully! Please sign in.');
        setAttempts(0);
      } else if (isSignUp) {
        await signUp({ 
          username: form.email, 
          password: form.password,
          options: {
            userAttributes: {
              email: form.email
            }
          }
        });
        setIsConfirming(true);
        setError('Please check your email for a confirmation code and enter it below.');
      } else {
        await signIn({ 
          username: form.email, 
          password: form.password 
        });
        setAttempts(0);
        if (onAuthSuccess) onAuthSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAttempts(prev => prev + 1);
      
      // User-friendly error messages
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Invalid email or password.';
      } else if (err.name === 'UserNotFoundException') {
        errorMessage = 'User not found. Please check your email or sign up.';
      } else if (err.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists.';
      } else if (err.name === 'CodeMismatchException') {
        errorMessage = 'Invalid confirmation code. Please check your email.';
      } else if (err.name === 'ExpiredCodeException') {
        errorMessage = 'Confirmation code has expired. Please request a new one.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [form, isSignUp, isConfirming, validate, attempts, onAuthSuccess]);

  const handleResendCode = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    try {
      await signUp({ 
        username: form.email, 
        password: form.password,
        options: {
          userAttributes: {
            email: form.email
          }
        }
      });
      setError('New confirmation code sent! Please check your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  }, [form.email, form.password, loading]);

  const handleBackToSignIn = useCallback(() => {
    setIsSignUp(false);
    setIsConfirming(false);
    setForm(initialState);
    setError('');
    setPasswordErrors([]);
    setAttempts(0);
  }, []);

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
              maxLength="6"
            />
            {validation.confirmationCode && (
              <div className="validation-msg">{validation.confirmationCode}</div>
            )}
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm Email'}
          </button>
          <div className="switch-mode">
            <button 
              type="button" 
              onClick={handleResendCode} 
              className="link-btn" 
              disabled={loading}
            >
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
            placeholder="Enter your email address"
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
            placeholder="Enter your password"
          />
          {validation.password && <div className="validation-msg">{validation.password}</div>}
          {isSignUp && passwordErrors.length > 0 && (
            <div className="password-requirements">
              <small>Password must contain:</small>
              <ul>
                {passwordErrors.map((error, index) => (
                  <li key={index} className="requirement-item">• {error}</li>
                ))}
              </ul>
            </div>
          )}
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
              placeholder="Confirm your password"
            />
            {validation.confirmPassword && (
              <div className="validation-msg">{validation.confirmPassword}</div>
            )}
          </div>
        )}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
        <div className="switch-mode">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => { 
                  setIsSignUp(false); 
                  setError(''); 
                  setPasswordErrors([]);
                  setAttempts(0);
                }} 
                className="link-btn"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button 
                type="button" 
                onClick={() => { 
                  setIsSignUp(true); 
                  setError(''); 
                  setPasswordErrors([]);
                  setAttempts(0);
                }} 
                className="link-btn"
              >
                Sign Up
              </button>
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
        {attempts > 0 && attempts < 5 && (
          <div className="attempts-warning">
            Attempts: {attempts}/5
          </div>
        )}
        {renderForm()}
      </form>
    </div>
  );
}