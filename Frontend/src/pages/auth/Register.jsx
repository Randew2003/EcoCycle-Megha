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

// Password validation helper function
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_26%),linear-gradient(135deg,#020617_0%,#052e2b_48%,#082f49_100%)]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/10 bg-white/95 shadow-[0_30px_90px_rgba(2,6,23,0.35)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-emerald-700 via-emerald-800 to-cyan-700 p-12 text-white lg:flex">
            <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-6 right-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3" data-aos="fade-down">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-md">
                  <div className="h-7 w-7 rounded-xl bg-linear-to-br from-emerald-200 to-cyan-200" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/80">EcoCycle</p>
                  <h2 className="text-2xl font-semibold">Recycling Platform</h2>
                </div>
              </div>

              <div data-aos="fade-up" data-aos-delay="100">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-emerald-50 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  Create your account with a polished onboarding flow
                </span>
                <h3 className="max-w-xl text-5xl font-semibold leading-tight">
                  Join the platform built for cleaner recycling and easier pickup management.
                </h3>
                <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-50/90">
                  Set up your profile, confirm your email, and start managing e-waste with a smoother registration experience.
                </p>
              </div>

              <div className="mt-10 space-y-5" data-aos="fade-up" data-aos-delay="180">
                {REGISTER_BENEFITS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                        <Icon className="h-5 w-5 text-emerald-100" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">{item.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-emerald-50/85">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8" data-aos="fade-up" data-aos-delay="260">
              <div>
                <div className="text-3xl font-semibold">50K+</div>
                <p className="mt-1 text-sm text-emerald-50/80">Active users</p>
              </div>
              <div>
                <div className="text-3xl font-semibold">5K+</div>
                <p className="mt-1 text-sm text-emerald-50/80">E-waste recycled</p>
              </div>
              <div>
                <div className="text-3xl font-semibold">100%</div>
                <p className="mt-1 text-sm text-emerald-50/80">Responsive</p>
              </div>
            </div>
          </aside>

          <section className="relative bg-white px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
            <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-emerald-100/60 blur-3xl" />
            <div className="absolute bottom-10 left-6 h-24 w-24 rounded-full bg-cyan-100/60 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-xl" data-aos="fade-up">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">Get started</p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">Create your EcoCycle account</h1>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Fill in your details to unlock pickup scheduling, impact tracking, and personalized account access.
                  </p>
                </div>
                <div className="hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-700 shadow-sm sm:flex">
                  <UserRoundPlus className="h-6 w-6" />
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                {TRUST_POINTS.map((point) => (
                  <span
                    key={point}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {point}
                  </span>
                ))}
              </div>

              {successMessage && (
                <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                  <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm">
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.fullName
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                  />
                  {errors.fullName && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.fullName}</p>}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.email
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                    />
                    {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-slate-900">
                      Phone Number <span className="font-normal text-slate-500"></span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="077 123 4567"
                      className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        errors.phone
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                    />
                    {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
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
                        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.password
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
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
                        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                          errors.confirmPassword
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
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
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-100"
                  >
                    <span>
                      Address <span className="font-normal text-slate-400 text-xs">(Required)</span> <span className="text-red-600">*</span>
                    </span>
                    <span className={`transition-transform ${expandAddress ? 'rotate-180' : ''}`}>▼</span>
                  </button>

                  {expandAddress && (
                    <div className="mt-4 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <div>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="Street Address"
                          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 ${
                            errors.street
                              ? 'border-red-300 focus:ring-red-100'
                              : 'border-emerald-100 focus:ring-emerald-100'
                          }`}
                        />
                        {errors.street && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.street}</p>}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="City"
                            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 ${
                              errors.city
                                ? 'border-red-300 focus:ring-red-100'
                                : 'border-emerald-100 focus:ring-emerald-100'
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
                            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 ${
                              errors.district
                                ? 'border-red-300 focus:ring-red-100'
                                : 'border-emerald-100 focus:ring-emerald-100'
                            }`}
                          />
                          {errors.district && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.district}</p>}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <input
                            type="text"
                            name="province"
                            value={formData.province}
                            onChange={handleChange}
                            placeholder="Province"
                            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 ${
                              errors.province
                                ? 'border-red-300 focus:ring-red-100'
                                : 'border-emerald-100 focus:ring-emerald-100'
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
                            className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-4 ${
                              errors.postalCode
                                ? 'border-red-300 focus:ring-red-100'
                                : 'border-emerald-100 focus:ring-emerald-100'
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
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 via-emerald-700 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Already have an account?</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Sign in instead and continue managing your pickups and recycling history.
                    </p>
                    <Link
                      to="/login"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                    >
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Register;
