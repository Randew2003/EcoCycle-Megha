import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Loader,
  MapPinned,
  Recycle,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 6,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const allRequirementsMet = Object.values(requirements).every(req => req);

  if (!allRequirementsMet) {
    const missingRequirements = [];
    if (!requirements.minLength) missingRequirements.push('at least 6 characters');
    if (!requirements.hasLowercase) missingRequirements.push('a lowercase letter');
    if (!requirements.hasUppercase) missingRequirements.push('an uppercase letter');
    if (!requirements.hasNumber) missingRequirements.push('a number');
    if (!requirements.hasSpecialChar) missingRequirements.push('a special character');

    return {
      isValid: false,
      message: `Password must contain: ${missingRequirements.join(', ')}`,
    };
  }

  return { isValid: true, message: '' };
};

const REGISTER_BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Secure profile',
    description: 'Create a verified account with protected session handling and role access.',
  },
  {
    icon: Recycle,
    title: 'Start recycling',
    description: 'Register and begin scheduling pickups, tracking impact, and managing requests.',
  },
  {
    icon: MapPinned,
    title: 'Complete your profile',
    description: 'Add contact and address details for faster pickup coordination.',
  },
];

const TRUST_POINTS = ['Email verification included', 'Pickup-ready profile setup', 'Responsive onboarding'];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    street: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandAddress, setExpandAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      easing: 'ease-out-cubic',
      offset: 80,
    });
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone) {
      const phoneDigitsOnly = formData.phone.replace(/\D/g, '');
      
      // Phone validation: must be 10 digits and start with 0
      const isValidPhone = /^0\d{9}$/.test(phoneDigitsOnly);
      
      if (phoneDigitsOnly.length === 0) {
        newErrors.phone = 'Phone number is required';
      } else if (phoneDigitsOnly.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      } else if (!isValidPhone) {
        newErrors.phone = 'Phone number must start with 0';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!formData.province.trim()) {
      newErrors.province = 'Province is required';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/users/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        district: formData.district,
        province: formData.province,
        postalCode: formData.postalCode,
      });

      setSuccessMessage('Registration successful! Redirecting to dashboard...');

      // If backend returned token and user, log in and redirect to dashboard
      const { token, user } = response.data || {};
      if (token && user) {
        try {
          login(user, token);

          setTimeout(() => {
            if (user.role === 'RECYCLER') {
              navigate('/recycler/dashboard');
            } else {
              navigate('/user/dashboard');
            }
          }, 1500);
        } catch (err) {
          // fallback: do nothing, keep success message
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Leaf className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">EcoCycle</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-600">Join EcoCycle and start managing recycling activities.</p>
          </div>

          {successMessage && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-slate-900">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                  errors.fullName ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'
                }`}
              />
              {errors.fullName && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.fullName}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                    errors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-900">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0771234567"
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                    errors.phone ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                      errors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'
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

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-slate-900">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white ${
                      errors.confirmPassword ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setExpandAddress(!expandAddress)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                <span>Address details</span>
                <span className={`transition-transform ${expandAddress ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {expandAddress && (
                <div className="mt-4 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Street Address"
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none ${
                      errors.street ? 'border-red-300' : 'border-emerald-100'
                    }`}
                  />
                  {errors.street && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.street}</p>}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none ${
                          errors.city ? 'border-red-300' : 'border-emerald-100'
                        }`}
                      />
                      {errors.city && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.city}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="District"
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none ${
                          errors.district ? 'border-red-300' : 'border-emerald-100'
                        }`}
                      />
                      {errors.district && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.district}</p>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="Province"
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none ${
                          errors.province ? 'border-red-300' : 'border-emerald-100'
                        }`}
                      />
                      {errors.province && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.province}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Postal Code"
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none ${
                          errors.postalCode ? 'border-red-300' : 'border-emerald-100'
                        }`}
                      />
                      {errors.postalCode && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.postalCode}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
