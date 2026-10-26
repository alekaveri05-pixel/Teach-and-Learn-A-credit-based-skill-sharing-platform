import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetUser, apiGetSessions, apiCreateSession } from '@/lib/api';
import { getSkillCredits } from '@/lib/skillCredits';
import { motion } from 'framer-motion';
import { Star, BookOpen, Users, ArrowLeft, Calendar, Clock, Video, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Session, User } from '@/types';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

export default function TeacherProfilePage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const selectedSkill = searchParams.get('skill') || '';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState<User | null>(null);
  const [mySessions, setMySessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'trial' | 'full'>('trial');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('15');
  const [bookingSkill, setBookingSkill] = useState(selectedSkill);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiGetUser(id).then(setTeacher),
      apiGetSessions().then(setMySessions),
    ]).then(() => setLoading(false)).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!teacher || !user) return <div className="min-h-screen flex items-center justify-center"><p>Teacher not found</p></div>;

  // Check if learner already had a trial with this teacher
  const alreadyHadTrial = mySessions.some(s =>
    s.teacherId === teacher.id &&
    s.learnerId === user.id &&
    s.type === 'trial' &&
    s.status !== 'cancelled'
  );

  const pendingFeedback = mySessions.filter(s => {
    if (s.status !== 'pending-feedback') return false;
    const isMyTeacher = s.teacherId === user.id;
    return isMyTeacher ? !s.teacherFeedback : !s.learnerFeedback;
  });

  const skillCreditCost = bookingSkill ? getSkillCredits(bookingSkill) : 1;
  const isOwnProfile = user.id === teacher.id;

  const handleBook = async () => {
    if (pendingFeedback.length > 0) {
      toast.error('Submit feedback for pending sessions before booking a new one');
      return;
    }
    if (!date || !time || !bookingSkill) {
      toast.error('Please fill all fields');
      return;
    }
    if (sessionType === 'full' && user.credits < skillCreditCost) {
      toast.error(`Not enough credits. ${bookingSkill} requires ${skillCreditCost} credit(s)`);
      return;
    }
    setSubmitting(true);
    try {
      const session = await apiCreateSession({
        teacherId: teacher.id,
        skillName: bookingSkill,
        type: sessionType,
        scheduledDate: date,
        scheduledTime: time,
        duration: parseInt(duration),
      });
      setBookingOpen(false);
      toast.success('Session booked!', { description: `${bookingSkill} with ${teacher.name} on ${date} at ${time}` });
      navigate(`/session/${session.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Profile Card */}
          <div className="glass-card p-5">
            {/* Avatar + Name row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground font-display font-bold text-xl shrink-0">
                {teacher.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-display font-bold leading-tight">{teacher.name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">{teacher.bio}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning" /> {teacher.reputation.toFixed(1)} reputation</span>
              <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {teacher.sessionsCompleted} sessions</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {teacher.uniqueConnections.length} connections</span>
            </div>

            {/* Book Session button — full width on mobile */}
            {isOwnProfile ? (
              <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                View My Profile
              </Button>
            ) : (
              <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full gradient-primary text-primary-foreground" size="lg">
                    <Video className="h-4 w-4 mr-2" /> Book Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="font-display">Book with {teacher.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Skill</Label>
                      <Select value={bookingSkill} onValueChange={setBookingSkill}>
                        <SelectTrigger><SelectValue placeholder="Select skill" /></SelectTrigger>
                        <SelectContent>
                          {teacher.skillsToTeach.map(s => (
                            <SelectItem key={s.name} value={s.name}>
                              {s.name} — {getSkillCredits(s.name)} credit{getSkillCredits(s.name) > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Session Type</Label>
                      {alreadyHadTrial && (
                        <div className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
                          ⚠️ You have already used your free trial with this teacher. Only full sessions are available.
                        </div>
                      )}
                      <Select value={alreadyHadTrial ? 'full' : sessionType} onValueChange={v => {
                        setSessionType(v as 'trial' | 'full');
                        if (v === 'trial') setDuration('15');
                        else setDuration('60');
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {!alreadyHadTrial && <SelectItem value="trial">Trial (Free)</SelectItem>}
                          <SelectItem value="full">Full ({skillCreditCost} Credit{skillCreditCost > 1 ? 's' : ''})</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select
                        value={duration}
                        onValueChange={setDuration}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(alreadyHadTrial ? false : sessionType === 'trial') ? (
                            <>
                              <SelectItem value="1">1 minute (test)</SelectItem>
                              <SelectItem value="15">15 minutes</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="1">1 minute (test)</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">60 minutes</SelectItem>
                              <SelectItem value="90">90 minutes</SelectItem>
                              <SelectItem value="120">120 minutes</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {bookingSkill && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                        <p className="font-semibold mb-1">Booking Summary</p>
                        <div className="flex justify-between"><span className="text-muted-foreground">Skill</span><span className="font-medium">{bookingSkill}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{duration} min</span></div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost</span>
                          <span className="font-medium flex items-center gap-1">
                            <Coins className="h-3.5 w-3.5 text-primary" />
                            {sessionType === 'trial' ? 'Free' : `${skillCreditCost} credit${skillCreditCost > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        {sessionType === 'full' && (
                          <>
                            <div className="border-t border-border/50 my-1" />
                            <div className="flex justify-between"><span className="text-muted-foreground">Your balance</span><span className="font-medium">{user.credits} credits</span></div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">After booking</span>
                              <span className={`font-bold ${user.credits >= skillCreditCost ? 'text-success' : 'text-destructive'}`}>
                                {user.credits - skillCreditCost} credits
                              </span>
                            </div>
                            {user.credits < skillCreditCost && (
                              <p className="text-destructive text-xs">⚠ Not enough credits</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleBook}
                      className="w-full gradient-primary text-primary-foreground"
                      size="lg"
                      disabled={submitting || (sessionType === 'full' && user.credits < skillCreditCost)}
                    >
                      {submitting ? 'Booking...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Skills Card */}
          <div className="glass-card p-5">
            <h2 className="text-lg font-display font-semibold mb-3">Skills</h2>
            <div className="space-y-3">
              {teacher.skillsToTeach.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed yet.</p>
              ) : teacher.skillsToTeach.map(skill => {
                const credits = getSkillCredits(skill.name);
                return (
                  <div key={skill.name} className={`p-4 rounded-lg border transition-colors ${skill.name === selectedSkill ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/30'}`}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="font-display font-semibold">{skill.name}</span>
                      <span className="flex items-center gap-1 text-sm font-medium text-primary">
                        <Coins className="h-3.5 w-3.5" /> {credits} credit{credits > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" /> {skill.avgRating.toFixed(1)} rating</span>
                      <span>{skill.sessionsCount} sessions taught</span>
                      <span>{skill.totalRatings} reviews</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
