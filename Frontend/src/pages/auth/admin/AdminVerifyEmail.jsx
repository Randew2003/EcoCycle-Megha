import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import API from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const AdminVerifyEmail = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // Get email from localStorage if available
    const registeredEmail = localStorage.getItem('registeredEmail');
    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, []);

  // Timer for resend button
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Concatenate OTP
  const otpValue = otp.join('');

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (otpValue.length !== 6) {
      setErrorMessage('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/admin/verify-email', {
        email,
        otp: otpValue,
      });

      setSuccessMessage('Email verified successfully! Redirecting to dashboard...');
      
      // Store token and user data using context
      if (response.data.token && response.data.user) {
        login(response.data.user, response.data.token);
      }
      
      // Clear stored email
      localStorage.removeItem('registeredEmail');

      // Redirect to admin dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setSuccessMessage('');
    setErrorMessage('');
    setResendLoading(true);

    try {
      await API.post('/admin/resend-otp', { email });
      
      setSuccessMessage('New OTP sent to your email!');
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60); // 60 seconds timer
      
      // Auto-focus first OTP input
      document.getElementById('otp-0')?.focus();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setErrorMessage(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">EcoCycle</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Verify admin email</h1>
            <p className="mt-2 text-sm text-slate-600">Enter the 6-digit OTP sent to your admin email address.</p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <Mail className="mx-auto h-5 w-5 text-emerald-600" />
            <p className="mt-2 text-xs font-medium text-slate-500">Verification code sent to</p>
            <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">{email}</p>
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

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-900">Verification Code</label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 w-10 rounded-2xl border border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify email
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Didn't receive the code?</p>
              <p className="mt-1 text-xs text-slate-600">Request a fresh OTP if the current one is delayed.</p>
            </div>
            <button
              onClick={handleResendOtp}
              disabled={resendLoading || resendTimer > 0}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {resendLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendTimer > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  {resendTimer}s
                </>
              ) : (
                'Resend'
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Check spam if the email does not arrive.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminVerifyEmail;
