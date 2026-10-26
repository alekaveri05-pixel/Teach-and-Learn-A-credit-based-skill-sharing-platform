import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Plus, X, Eye, EyeOff, Check } from 'lucide-react';
import { SkillLevel } from '@/types';
import { getSkillCredits } from '@/lib/skillCredits';

const AVAILABLE_SKILLS = [
  'React', 'TypeScript', 'Python', 'Piano', 'Guitar', 'Photography',
  'Watercolor Painting', 'Yoga', 'Meditation', 'Music Theory', 'Cooking',
  'Spanish', 'French', 'Drawing', 'Public Speaking', 'Chess', 'Dance', 'Writing',
  'Web Development', 'Data Science', 'Machine Learning', 'UI/UX Design',
  'Video Editing', 'Digital Marketing', 'Finance', 'Music Production',
];

const VALID_TLDS = ['com','org','net','in','edu','gov','io','co','uk','us','dev','app','info','biz','me'];
const FAKE_PATTERNS = [
  /^test@test\./i, /^abc@abc\./i, /^user@user\./i, /^123@123\./i,
  /^admin@admin\./i, /^demo@demo\./i, /^fake@fake\./i, /^example@example\./i,
  /^asdf@/i, /^qwer@/i, /^zxcv@/i,
];

function isValidEmail(email: string): { valid: boolean; message: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, message: 'Please enter a valid email address.' };
  const parts = email.split('@');
  const domain = parts[1];
  const tld = domain.split('.').pop()?.toLowerCase() || '';
  if (!VALID_TLDS.includes(tld)) return { valid: false, message: `".${tld}" is not a recognized email domain. Please use a real email address.` };
  for (const pattern of FAKE_PATTERNS) {
    if (pattern.test(email)) return { valid: false, message: 'Please enter a real email address.' };
  }
  const localPart = parts[0];
  if (localPart.length < 2) return { valid: false, message: 'Please enter a valid real email address.' };
  if (/^(.)\1+$/.test(localPart)) return { valid: false, message: 'Please enter a real email address.' };
  return { valid: true, message: '' };
}

function getPasswordRules(password: string) {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function getCreditLabel(credits: number) {
  return credits === 3 ? '💎 3 credits' : credits === 2 ? '⭐ 2 credits' : '✦ 1 credit';
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<{ name: string; level: SkillLevel }[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [newLearnLevel, setNewLearnLevel] = useState<SkillLevel>('Low');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRules = getPasswordRules(password);
  const allPasswordRulesMet = Object.values(passwordRules).every(Boolean);

  const handleEmailBlur = () => {
    if (email) {
      const result = isValidEmail(email);
      setEmailError(result.valid ? '' : result.message);
    }
  };

  const addTeachSkill = () => {
    if (newTeachSkill && !skillsToTeach.includes(newTeachSkill)) {
      setSkillsToTeach([...skillsToTeach, newTeachSkill]);
      setNewTeachSkill('');
    }
  };

  const addLearnSkill = () => {
    if (newLearnSkill && !skillsToLearn.find(s => s.name === newLearnSkill)) {
      setSkillsToLearn([...skillsToLearn, { name: newLearnSkill, level: newLearnLevel }]);
      setNewLearnSkill('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!name || !email || !password) { setError('All fields required'); return; }
      const emailCheck = isValidEmail(email);
      if (!emailCheck.valid) { setEmailError(emailCheck.message); setError(emailCheck.message); return; }
      if (!allPasswordRulesMet) { setError('Password does not meet all requirements below'); return; }
      setError(''); setEmailError('');
      setStep(2);
      return;
    }
    if (skillsToTeach.length === 0) { setError('Add at least one skill to teach'); return; }
    if (skillsToLearn.length === 0) { setError('Add at least one skill to learn'); return; }
    setLoading(true);
    const result = await register({
      name, email, password, bio,
      skillsToTeach: skillsToTeach.map(s => ({ name: s })),
      skillsToLearn,
    });
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error || 'Registration failed');
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-md">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-3xl font-display font-bold text-primary-foreground">TeachTrade</h1>
          </div>
          <h2 className="text-4xl font-display font-bold text-primary-foreground mb-4">Start your journey today.</h2>
          <p className="text-primary-foreground/80 text-lg">Join our community of passionate learners and teachers. Everyone has something valuable to share.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">TeachTrade</h1>
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Create account</h2>
          <p className="text-muted-foreground mb-2">Step {step} of 2 — {step === 1 ? 'Your info' : 'Your skills'}</p>
          <div className="flex gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'gradient-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'gradient-primary' : 'bg-muted'}`} />
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    onBlur={handleEmailBlur}
                    placeholder="you@example.com" required
                    className={emailError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>

                {/* Password with eye icon */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Live password rules checklist */}
                  {password.length > 0 && (
                    <div className="space-y-1 mt-2 p-3 rounded-lg bg-muted/50 text-sm">
                      {[
                        { rule: passwordRules.length,    label: 'At least 8 characters' },
                        { rule: passwordRules.uppercase, label: 'At least one uppercase letter (A–Z)' },
                        { rule: passwordRules.number,    label: 'At least one number (0–9)' },
                        { rule: passwordRules.special,   label: 'At least one special character (!@#$...)' },
                      ].map(({ rule, label }) => (
                        <div key={label} className={`flex items-center gap-2 transition-colors ${rule ? 'text-green-600' : 'text-muted-foreground'}`}>
                          <Check className={`h-3.5 w-3.5 flex-shrink-0 ${rule ? 'opacity-100' : 'opacity-30'}`} />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
                  <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
                </div>
              </>
            ) : (
              <>
                {/* Skills to Teach */}
                <div className="space-y-3">
                  <Label>Skills to Teach</Label>
                  <div className="flex gap-2">
                    <Select value={newTeachSkill} onValueChange={setNewTeachSkill}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select a skill" /></SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_SKILLS.filter(s => !skillsToTeach.includes(s)).map(s => {
                          const credits = getSkillCredits(s);
                          return (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center justify-between w-full gap-6">
                                <span>{s}</span>
                                <span className="text-xs text-muted-foreground">{getCreditLabel(credits)}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={addTeachSkill}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsToTeach.map(s => {
                      const credits = getSkillCredits(s);
                      return (
                        <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                          {s} <span className="text-xs opacity-60">{getCreditLabel(credits)}</span>
                          <button type="button" onClick={() => setSkillsToTeach(skillsToTeach.filter(x => x !== s))}><X className="h-3 w-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Skills to Learn */}
                <div className="space-y-3">
                  <Label>Skills to Learn</Label>
                  <div className="flex gap-2">
                    <Select value={newLearnSkill} onValueChange={setNewLearnSkill}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select a skill" /></SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_SKILLS.filter(s => !skillsToLearn.find(sl => sl.name === s)).map(s => {
                          const credits = getSkillCredits(s);
                          return (
                            <SelectItem key={s} value={s}>
                              <div className="flex items-center justify-between w-full gap-6">
                                <span>{s}</span>
                                <span className="text-xs text-muted-foreground">{getCreditLabel(credits)}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <Select value={newLearnLevel} onValueChange={v => setNewLearnLevel(v as SkillLevel)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={addLearnSkill}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillsToLearn.map(s => {
                      const credits = getSkillCredits(s.name);
                      return (
                        <span key={s.name} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${s.level === 'Low' ? 'badge-low' : s.level === 'Medium' ? 'badge-medium' : 'badge-high'}`}>
                          {s.name} · {s.level} <span className="text-xs opacity-60">{getCreditLabel(credits)}</span>
                          <button type="button" onClick={() => setSkillsToLearn(skillsToLearn.filter(x => x.name !== s.name))}><X className="h-3 w-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              {step === 2 && <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>}
              <Button
                type="submit"
                className="flex-1 gradient-primary text-primary-foreground"
                size="lg"
                disabled={loading || (step === 1 && password.length > 0 && !allPasswordRulesMet)}
              >
                {loading ? 'Please wait...' : step === 1 ? 'Next' : 'Create Account'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
