import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password.');
    }
    setLoading(false);
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div dir="ltr" className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md">
        <div className="flat-card bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-block mx-auto mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-lg shadow-blue-200">
                A
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-800">Welcome to Artavix PM</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Enterprise Project Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="flat-input w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="flat-input w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:shadow-lg transition-all text-sm disabled:opacity-70 shadow-blue-200"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;