import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Lock, Mail, ClipboardList } from 'lucide-react';

const AuthForm = () => {
  const { login, signup, authError, setAuthError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setAuthError('');

    if (!email || !password) {
      setValidationError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && !name) {
      setValidationError('Name is required for registration');
      return;
    }

    if (isLogin) {
      await login(email, password);
    } else {
      await signup(name, email, password, role);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setValidationError('');
    setAuthError('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('Member');
  };

  return (
    <div className="auth-page animate-fade">
      <div className="background-glow glow-top-right"></div>
      <div className="background-glow glow-bottom-left"></div>
      
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div className="stat-icon-wrapper" style={{ width: '56px', height: '56px', borderRadius: '50%' }}>
              <ClipboardList size={28} />
            </div>
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Join the Team'}</h2>
          <p>{isLogin ? 'Sign in to access your dashboard' : 'Create an account to start tracking tasks'}</p>
        </div>

        {(validationError || authError) && (
          <div className="error-banner">
            {validationError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {!isLogin && (
            <div className="form-group animate-slide">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="you@example.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group animate-slide">
              <label>Account Role</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ paddingLeft: '40px', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="Member">Team Member</option>
                  <option value="Admin">Administrator</option>
                </select>
                <Shield size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={toggleMode}>{isLogin ? 'Register here' : 'Sign in here'}</span>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
