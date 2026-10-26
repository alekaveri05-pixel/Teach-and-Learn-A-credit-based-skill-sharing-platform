import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSession, apiGetUser, apiSubmitFeedback } from '@/lib/api';
import { motion } from 'framer-motion';
import { Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Session, User } from '@/types';

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1 mt-1.5">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5">
            <Star className={`h-7 w-7 transition-colors ${i <= value ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [other, setOther] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [rating, setRating] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [patience, setPatience] = useState(0);
  const [knowledge, setKnowledge] = useState(0);
  const [engagement, setEngagement] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!id) return;
    apiGetSession(id).then(s => {
      setSession(s);
      const isTeacher = user ? s.teacherId === user.id : false;
      const otherId = isTeacher ? s.learnerId : s.teacherId;
      apiGetUser(otherId).then(setOther);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, user]);

  // ── Block browser back button ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'pending-feedback') return;
    // Push an extra history entry so back button is intercepted
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      toast.warning('⚠️ You must submit feedback before leaving!');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session]);

  // ── Block page close / refresh ────────────────────────────────────────────
  useEffect(() => {
    if (!session || session.status !== 'pending-feedback') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You must submit feedback before leaving!';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [session]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!session || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Session not found</p>
    </div>
  );

  const isTeacher = session.teacherId === user.id;
  const alreadySubmitted = isTeacher ? !!session.teacherFeedback : !!session.learnerFeedback;

  // Already submitted — show confirmation, allow going to dashboard
  if (alreadySubmitted || submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-display font-bold mb-2">Feedback Submitted!</h2>
          <p className="text-muted-foreground mb-2">Thank you for your feedback.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Credits will be transferred once the other party also submits their feedback.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full gradient-primary text-primary-foreground" size="lg">
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please provide an overall rating'); return; }
    setSubmitting(true);
    try {
      const updatedSession = await apiSubmitFeedback(session.id, {
        rating, clarity, patience, knowledge, engagement, comment
      });
      // Refresh user data and credits immediately — no page reload needed
      await refreshUser();
      setSubmitted(true);
      if (updatedSession && updatedSession.status === 'completed') {
        toast.success('🎉 Session completed! Credits have been transferred to your account.');
      } else {
        toast.success('Feedback submitted! Credits will transfer once the other party submits theirs.');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Locked header — no navigation links */}
      <header className="border-b border-border/50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg">TeachTrade</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-warning font-medium">
          <Lock className="h-4 w-4" />
          Feedback Required
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass-card p-6">

            {/* Warning banner */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm font-semibold text-warning mb-1">⚠️ Feedback is Mandatory</p>
              <p className="text-xs text-muted-foreground">
                You cannot navigate away until you submit feedback. Credits will only transfer after both parties review.
              </p>
            </div>

            <h1 className="text-2xl font-display font-bold mb-1">Rate Your Session</h1>
            <p className="text-muted-foreground text-sm mb-6">
              <strong>{session.skillName}</strong> with {other?.name}
            </p>

            <div className="space-y-5">
              <StarRating value={rating} onChange={setRating} label="Overall Rating *" />
              <div className="border-t border-border/50 pt-4 space-y-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Detailed Ratings</p>
                <StarRating value={clarity} onChange={setClarity} label="Clarity" />
                <StarRating value={patience} onChange={setPatience} label="Patience" />
                <StarRating value={knowledge} onChange={setKnowledge} label="Knowledge" />
                <StarRating value={engagement} onChange={setEngagement} label="Engagement" />
              </div>

              <div className="space-y-2">
                <Label>Comments (optional)</Label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full gradient-primary text-primary-foreground"
                size="lg"
                disabled={submitting || rating === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback & Unlock Credits'}
              </Button>

              {rating === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Please give an overall rating to submit
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
