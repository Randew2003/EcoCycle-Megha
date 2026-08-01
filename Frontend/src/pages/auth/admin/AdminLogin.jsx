import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader,
  ShieldCheck,
} from 'lucide-react';
import API from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [accountLocked, setAccountLocked] = useState(false);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setAccountLocked(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/admin/login', {
        email: formData.email,
        password: formData.password,
      });

      const { token, user, message } = response.data;

      // Use context to store token and user data
      login(user, token);

      setSuccessMessage('Login successful! Redirecting to admin dashboard...');

      // Redirect to admin dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if account is locked
      if (errorData?.message?.includes('locked')) {
        setAccountLocked(true);
        setErrorMessage(
          errorData.message || 
          'Your account is temporarily locked. Please try again later or reset your password.'
        );
      } else if (errorData?.message?.includes('verify')) {
        setErrorMessage(
          'Please verify your email first. Redirecting to verification page...'
        );
        setTimeout(() => {
          localStorage.setItem('registeredEmail', formData.email);
          navigate('/admin/verify-email');
        }, 2000);
      } else {
        setErrorMessage(
          errorData?.message || 'Login failed. Please check your credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">EcoCycle</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Admin sign in</h1>
            <p className="mt-2 text-sm text-slate-600">Use your verified admin email and password to continue.</p>
          </div>

          {successMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className={`mb-5 rounded-2xl border p-3 text-sm font-medium ${accountLocked ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-900">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                  errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-900">Password</label>
                <Link
                  to="/admin/forgot-password"
                  className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">
              Need an account?{' '}
              <Link to="/admin/register" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
                Create admin registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
