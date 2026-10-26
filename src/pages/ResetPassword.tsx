import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiForgotPassword, apiVerifyOtp, apiResetPassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, KeyRound, Check, Eye, EyeOff, Mail, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one number (0–9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least one special character (!@#$%^&* etc.)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

export default function ResetPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOtp = useCallback(async () => {
    if (!email.trim()) { toast.error('Enter your email'); return; }
    setLoading(true);
    try {
      const res = await apiForgotPassword(email);
      // During dev/testing, OTP is returned in response — show it so the user can use it
      if (res.otp) {
        toast.success(`OTP sent! (Dev mode: ${res.otp})`, { duration: 15000 });
      } else {
        toast.success('OTP sent to your email!');
      }
      setStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      await apiVerifyOtp(email, otpStr);
      toast.success('OTP verified!');
      setVerifiedOtp(otpStr);
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allRulesPass = PASSWORD_RULES.every(r => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPass && passwordsMatch;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!allRulesPass) toast.error('Password does not meet all requirements');
      else if (!passwordsMatch) toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword(email, verifiedOtp, newPassword);
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Password Reset!</h2>
          <p className="text-muted-foreground mb-6">You can now sign in with your new password.</p>
          <Button onClick={() => navigate('/login')} className="gradient-primary text-primary-foreground">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Reset Password</h1>
        </div>

        {/* Step indicator */}
        <p className="text-muted-foreground text-sm mb-2">
          Step {step} of 3 — {step === 1 ? 'Email' : step === 2 ? 'Verify OTP' : 'New Password'}
        </p>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? 'gradient-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Email */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Mail className="h-5 w-5" />
                <p className="text-sm">Enter the email address associated with your account.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  />
                </div>
                <Button onClick={sendOtp} className="w-full gradient-primary text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm">Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong></p>
              </div>
              <div className="space-y-5">
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-lg bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {countdown > 0 ? (
                    <span>Resend OTP in <strong className="text-foreground">{countdown}s</strong></span>
                  ) : (
                    <button onClick={sendOtp} className="text-primary font-medium hover:underline" disabled={loading}>
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={verifyOtp} className="flex-1 gradient-primary text-primary-foreground" disabled={loading || otp.join('').length !== 6}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <Lock className="h-5 w-5" />
                <p className="text-sm">Set a new password for <strong className="text-foreground">{email}</strong></p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  <div className="space-y-1.5 mt-3">
                    {PASSWORD_RULES.map((rule, i) => {
                      const passes = rule.test(newPassword);
                      return (
                        <div key={i} className={`flex items-center gap-2 text-sm transition-colors ${passes ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${passes ? 'bg-emerald-100 text-emerald-600' : 'bg-muted'}`}>
                            {passes && <Check className="h-3 w-3" />}
                          </div>
                          {rule.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button type="submit" className="flex-1 gradient-primary text-primary-foreground" disabled={loading || !canSubmit}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
