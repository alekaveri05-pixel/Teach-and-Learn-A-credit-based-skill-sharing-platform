import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSession, apiGetUser, apiJoinSession, apiUpdateSession, apiCancelSession, apiRescheduleSession } from '@/lib/api';
import { motion } from 'framer-motion';
import { Video, Clock, Calendar, ArrowLeft, Play, Square, MessageSquare, UserCheck, Users, XCircle, CalendarClock, Coins, ExternalLink } from 'lucide-react';
import { getSkillCredits } from '@/lib/skillCredits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import SessionMaterials from '@/components/SessionMaterials';
import { Session, User } from '@/types';

export default function SessionPage() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [other, setOther] = useState<User | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoOpened, setVideoOpened] = useState(false);
  const sessionRef = useRef<Session | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endingRef = useRef(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const bothJoined = session?.teacherJoined && session?.learnerJoined;
  const isTeacher = session && user ? session.teacherId === user.id : false;

  useEffect(() => { sessionRef.current = session; }, [session]);

  // Flash tab title when time is up
  const startTitleFlash = useCallback(() => {
    const original = document.title;
    let toggle = false;
    titleFlashRef.current = setInterval(() => {
      document.title = toggle ? '⏰ TIME UP! Submit Feedback' : original;
      toggle = !toggle;
    }, 1000);
  }, []);

  const stopTitleFlash = useCallback(() => {
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current);
      titleFlashRef.current = null;
    }
    document.title = 'TeachTrade — Skill Exchange Platform';
  }, []);

  // Play beep sound
  const playBeep = useCallback((times = 1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      for (let i = 0; i < times; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.4 + 0.3);
        osc.start(ctx.currentTime + i * 0.4);
        osc.stop(ctx.currentTime + i * 0.4 + 0.3);
      }
    } catch {}
  }, []);

  const autoEndSession = useCallback(async (finalElapsed: number) => {
    if (endingRef.current) return;
    endingRef.current = true;
    const s = sessionRef.current;
    if (!s) return;

    // Alert user even if on Jitsi tab
    playBeep(3);
    startTitleFlash();

    // Browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('⏰ Session Time is Up!', {
        body: 'Please close the video call and submit your feedback.',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }

    try {
      const updated = await apiUpdateSession(s.id, {
        status: 'pending-feedback',
        actualDuration: Math.max(1, Math.floor(finalElapsed / 60)),
      });
      setSession(updated);
      setTimerActive(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      await refreshUser();
      toast.warning('⏰ Session time is up! Please close Jitsi and submit feedback.', { duration: 10000 });
      navigate(`/session/${s.id}/feedback`);
    } catch (err: any) {
      toast.error(err.message);
      endingRef.current = false;
    }
  }, [navigate, refreshUser, playBeep, startTitleFlash]);

  useEffect(() => {
    if (!id) return;
    apiGetSession(id).then(s => {
      setSession(s);
      const otherId = user ? (s.teacherId === user.id ? s.learnerId : s.teacherId) : null;
      if (otherId) apiGetUser(otherId).then(setOther);
      setLoading(false);
      if (s.status === 'in-progress' && s.teacherJoined && s.learnerJoined) {
        setTimerActive(true);
      }
    }).catch(() => setLoading(false));
  }, [id, user]);

  // Poll session
  useEffect(() => {
    if (!id || !session || session.status === 'completed' || session.status === 'pending-feedback' || session.status === 'cancelled') return;
    const interval = setInterval(() => {
      apiGetSession(id).then(s => {
        setSession(s);
        if (s.teacherJoined && s.learnerJoined && s.status === 'in-progress' && !timerActive) {
          setTimerActive(true);
          toast.success('Both joined! Session timer started!');
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [id, session?.status, timerActive]);

  // Timer
  useEffect(() => {
    if (timerActive && !timerRef.current) {
      endingRef.current = false;
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          const durationSecs = (sessionRef.current?.duration || 0) * 60;
          // 1 min warning
          if (durationSecs > 0 && next === durationSecs - 60) {
            playBeep(1);
            toast.warning('⚠️ 1 minute remaining! Please wrap up.', { duration: 8000 });
          }
          if (durationSecs > 0 && next >= durationSecs) {
            autoEndSession(next);
          }
          return next;
        });
      }, 1000);
    }
    if (!timerActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [timerActive, autoEndSession, playBeep]);

  useEffect(() => {
    if (session?.status === 'in-progress' && bothJoined && !timerActive) {
      setTimerActive(true);
    }
  }, [session?.status, bothJoined]);

  // Cleanup title flash on unmount
  useEffect(() => {
    return () => stopTitleFlash();
  }, [stopTitleFlash]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!session || !user) return <div className="min-h-screen flex items-center justify-center"><p>Session not found</p></div>;

  const minDuration = session.duration * 0.5;
  const elapsedMinutes = Math.floor(elapsed / 60);
  const metMinimum = elapsedMinutes >= minDuration;
  const myJoined = isTeacher ? session.teacherJoined : session.learnerJoined;
  const needsFeedback = session.status === 'pending-feedback' && (isTeacher ? !session.teacherFeedback : !session.learnerFeedback);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = () => {
    try {
      const url = new URL(session.meetingLink);
      const roomName = url.pathname.replace(/^\//, '');
      return `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.requireDisplayName=false&userInfo.displayName=${encodeURIComponent(user.name)}`;
    } catch {
      return session.meetingLink;
    }
  };

  const joinSession = async () => {
    // Ask notification permission on user click
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    try {
      const updated = await apiJoinSession(session.id);
      setSession(updated);
      // Open video call in new tab
      window.open(getVideoUrl(), '_blank');
      if (updated.teacherJoined && updated.learnerJoined) {
        setTimerActive(true);
        toast.success('Both joined! Session timer started!');
      } else {
        toast.info('You joined! Waiting for the other party...');
      }
    } catch (err: any) { toast.error(err.message); }
  };

  const endSession = async () => {
    stopTitleFlash();
    if (!metMinimum) toast.warning(`Minimum ${minDuration} minutes required for credit transfer`);
    try {
      const updated = await apiUpdateSession(session.id, { status: 'pending-feedback', actualDuration: elapsedMinutes });
      setSession(updated);
      setTimerActive(false);
      await refreshUser();
      navigate(`/session/${session.id}/feedback`);
    } catch (err: any) { toast.error(err.message); }
  };

  const cancelSession = async () => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      const updated = await apiCancelSession(session.id);
      setSession(updated);
      toast.success('Session cancelled' + (session.type === 'full' ? ' — credit refunded' : ''));
    } catch (err: any) { toast.error(err.message); }
  };

  const rescheduleSession = async () => {
    if (!newDate || !newTime) { toast.error('Please select date and time'); return; }
    try {
      const updated = await apiRescheduleSession(session.id, { scheduledDate: newDate, scheduledTime: newTime });
      setSession(updated);
      setRescheduleOpen(false);
      toast.success('Session rescheduled!');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="glass-card p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    session.status === 'completed' ? 'badge-high' :
                    session.status === 'pending-feedback' ? 'badge-medium' :
                    session.status === 'in-progress' ? 'badge-low' :
                    session.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>{session.status}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${session.type === 'trial' ? 'bg-secondary text-secondary-foreground' : 'gradient-accent text-accent-foreground'}`}>
                    {session.type === 'trial' ? 'Trial' : 'Full Session'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold mb-1">{session.skillName}</h1>
                <p className="text-muted-foreground text-sm">
                  {isTeacher ? 'Teaching' : 'Learning from'} <span className="font-medium text-foreground">{other?.name}</span>
                </p>
              </div>

              {/* Timer — compact, top right */}
              {session.status === 'in-progress' && bothJoined && timerActive && (
                <div className="text-center sm:text-right shrink-0">
                  <p className={`text-2xl font-display font-bold ${metMinimum ? 'text-success' : 'text-foreground'}`}>
                    {formatTime(elapsed)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min: {minDuration}m {metMinimum && '✓'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {session.scheduledDate}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {session.scheduledTime}</span>
              <span className="flex items-center gap-1"><Video className="h-4 w-4" /> {session.duration} min</span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Coins className="h-4 w-4" /> {session.creditCost || getSkillCredits(session.skillName)} credits
              </span>
            </div>

            {session.status === 'scheduled' && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={cancelSession} className="text-destructive hover:text-destructive">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><CalendarClock className="h-3.5 w-3.5 mr-1" /> Reschedule</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Reschedule Session</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>New Date</Label>
                        <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="space-y-2">
                        <Label>New Time</Label>
                        <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                      </div>
                      <Button onClick={rescheduleSession} className="w-full gradient-primary text-primary-foreground">Confirm</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Cancelled */}
          {session.status === 'cancelled' && (
            <div className="glass-card p-6 mb-4 text-center">
              <XCircle className="h-12 w-12 text-destructive/50 mx-auto mb-3" />
              <h2 className="text-xl font-display font-semibold mb-2">Session Cancelled</h2>
              <p className="text-muted-foreground text-sm">{session.type === 'full' ? 'Credit refunded.' : 'Cancelled.'}</p>
            </div>
          )}

          {/* Video Section */}
          {(session.status === 'scheduled' || session.status === 'in-progress') && (
            <div className="glass-card p-4 sm:p-6 mb-4">

              {/* Not joined yet */}
              {!myJoined && (
                <div className="text-center py-8">
                  <Video className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
                  <h2 className="text-lg font-display font-semibold mb-2">Ready to start?</h2>
                  <p className="text-muted-foreground text-sm mb-2">Click Join Session — video call opens in a new tab.</p>
                  <p className="text-xs text-muted-foreground mb-6">Timer starts when <strong>both</strong> teacher and learner join.</p>
                  <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <span className={`flex items-center gap-1.5 font-medium ${session.teacherJoined ? 'text-success' : 'text-muted-foreground'}`}>
                      <UserCheck className="h-4 w-4" /> Teacher {session.teacherJoined ? '✓' : '—'}
                    </span>
                    <span className={`flex items-center gap-1.5 font-medium ${session.learnerJoined ? 'text-success' : 'text-muted-foreground'}`}>
                      <UserCheck className="h-4 w-4" /> Learner {session.learnerJoined ? '✓' : '—'}
                    </span>
                  </div>
                  <Button onClick={joinSession} className="gradient-primary text-primary-foreground" size="lg">
                    <Play className="h-4 w-4 mr-2" /> Join Session
                  </Button>
                </div>
              )}

              {/* Joined, waiting */}
              {myJoined && !bothJoined && (
                <div className="text-center py-8">
                  <Users className="h-14 w-14 text-primary/30 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-lg font-display font-semibold mb-2">
                    Waiting for {isTeacher ? 'learner' : 'teacher'}...
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">Timer starts automatically once both join.</p>
                  <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                    <span className={`flex items-center gap-1.5 font-medium ${session.teacherJoined ? 'text-success' : 'text-muted-foreground'}`}>
                      <UserCheck className="h-4 w-4" /> Teacher {session.teacherJoined ? '✓ Joined' : '— Waiting'}
                    </span>
                    <span className={`flex items-center gap-1.5 font-medium ${session.learnerJoined ? 'text-success' : 'text-muted-foreground'}`}>
                      <UserCheck className="h-4 w-4" /> Learner {session.learnerJoined ? '✓ Joined' : '— Waiting'}
                    </span>
                  </div>
                  <button onClick={() => window.open(getVideoUrl(), '_blank')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition">
                    <ExternalLink className="h-4 w-4" /> Reopen Video Call
                  </button>
                </div>
              )}

              {/* Both joined — session live */}
              {bothJoined && session.status === 'in-progress' && (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-sm font-medium text-success">Session Live — Both Joined</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-5">
                    Your video call is open in another tab. Come back here when done.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button onClick={() => window.open(getVideoUrl(), '_blank')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-medium text-sm">
                      <ExternalLink className="h-4 w-4" /> Reopen Video Call
                    </button>
                    <Button onClick={endSession} variant="destructive" size="sm">
                      <Square className="h-3.5 w-3.5 mr-1" /> End Session
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    When time is up — you'll hear a beep and see a notification. Come back and click End Session.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Materials */}
          <SessionMaterials session={session} isTeacher={isTeacher} onUpdate={setSession} />

          {/* Feedback */}
          {needsFeedback && (
            <div className="glass-card p-4 sm:p-6 text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Session Time is Up!</h2>
              <p className="text-muted-foreground text-sm mb-4">Please close the video call tab and submit your feedback.</p>
              <Button onClick={() => navigate(`/session/${session.id}/feedback`)} className="gradient-primary text-primary-foreground w-full" size="lg">
                <MessageSquare className="h-4 w-4 mr-2" /> Submit Feedback Now
              </Button>
            </div>
          )}

          {/* Completed */}
          {session.status === 'completed' && (
            <div className="glass-card p-4 sm:p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-lg sm:text-xl font-display font-semibold mb-2">Session Complete!</h2>
              <p className="text-muted-foreground text-sm">
                {session.type === 'full' ? 'Credits transferred.' : 'Trial completed.'}
                {session.actualDuration && ` Duration: ${session.actualDuration} minutes.`}
              </p>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
}
