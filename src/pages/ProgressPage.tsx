import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions, apiGetUsers } from '@/lib/api';
import { Session, User } from '@/types';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame, Target, TrendingUp, Trophy, Medal, Star,
  BookOpen, Users, Zap, Calendar, Crown, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';

// ---------- helpers ----------
function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function weeksAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return { year: d.getFullYear(), week: getWeekNumber(d) };
}

// ---------- challenges ----------
interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: number;
  current: number;
  reward: string;
  type: 'weekly' | 'milestone';
}

// ---------- component ----------
export default function ProgressPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    apiGetSessions().then(setSessions);
    apiGetUsers().then(setAllUsers);
  }, []);

  const completedSessions = useMemo(
    () => sessions.filter(s => s.status === 'completed'),
    [sessions]
  );

  // ---- Skill Progress Bars ----
  const skillProgress = useMemo(() => {
    if (!user) return [];
    return user.skillsToLearn.map(learnSkill => {
      const related = completedSessions.filter(
        s => s.skillName === learnSkill.name && s.learnerId === user.id
      );
      const total = related.length;
      const percent = Math.min(total * 15, 100);
      const stage =
        total === 0 ? 'Not Started' :
        total <= 2 ? 'Beginner' :
        total <= 5 ? 'Intermediate' : 'Advanced';
      return { name: learnSkill.name, level: learnSkill.level, sessions: total, percent, stage };
    });
  }, [user, completedSessions]);

  // ---- Weekly Streak ----
  const streak = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    for (let i = 0; i < 52; i++) {
      const { year, week } = weeksAgo(i);
      const hasSession = completedSessions.some(s => {
        const d = new Date(s.scheduledDate);
        return d.getFullYear() === year && getWeekNumber(d) === week;
      });
      if (hasSession) count++;
      else break;
    }
    return count;
  }, [completedSessions, user]);

  // ---- Learning Stats (last 8 weeks) ----
  const weeklyStats = useMemo(() => {
    const weeks: { label: string; sessions: number; hours: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const { year, week } = weeksAgo(i);
      const weekSessions = completedSessions.filter(s => {
        const d = new Date(s.scheduledDate);
        return d.getFullYear() === year && getWeekNumber(d) === week;
      });
      const hours = weekSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration) / 60, 0);
      weeks.push({ label: `W${week}`, sessions: weekSessions.length, hours: Math.round(hours * 10) / 10 });
    }
    return weeks;
  }, [completedSessions]);

  const totalHours = useMemo(
    () => Math.round(completedSessions.reduce((s, ses) => s + (ses.actualDuration || ses.duration) / 60, 0) * 10) / 10,
    [completedSessions]
  );

  // ---- Weekly Challenges ----
  const thisWeekSessions = useMemo(() => {
    const { year, week } = weeksAgo(0);
    return completedSessions.filter(s => {
      const d = new Date(s.scheduledDate);
      return d.getFullYear() === year && getWeekNumber(d) === week;
    });
  }, [completedSessions]);

  const challenges: Challenge[] = useMemo(() => {
    if (!user) return [];
    const taught = sessions.filter(s => s.teacherId === user.id && s.status === 'completed').length;
    const learned = sessions.filter(s => s.learnerId === user.id && s.status === 'completed').length;
    const feedbackGiven = sessions.filter(s =>
      (s.teacherId === user.id && s.teacherFeedback) || (s.learnerId === user.id && s.learnerFeedback)
    ).length;

    return [
      // Weekly
      { id: 'w1', title: 'Session Sprint', description: 'Complete 3 sessions this week', icon: <Zap className="h-5 w-5" />, target: 3, current: thisWeekSessions.length, reward: '+1 Credit', type: 'weekly' },
      { id: 'w2', title: 'Knowledge Sharer', description: 'Teach 2 sessions this week', icon: <BookOpen className="h-5 w-5" />, target: 2, current: thisWeekSessions.filter(s => s.teacherId === user.id).length, reward: '+1 Credit', type: 'weekly' },
      // Milestones
      { id: 'm1', title: 'First Steps', description: 'Complete your first session', icon: <Star className="h-5 w-5" />, target: 1, current: Math.min(completedSessions.length, 1), reward: '🌟 Badge', type: 'milestone' },
      { id: 'm2', title: 'Dedicated Learner', description: 'Complete 10 sessions as learner', icon: <Target className="h-5 w-5" />, target: 10, current: Math.min(learned, 10), reward: '📚 Badge', type: 'milestone' },
      { id: 'm3', title: 'Master Teacher', description: 'Teach 10 sessions', icon: <Award className="h-5 w-5" />, target: 10, current: Math.min(taught, 10), reward: '🏅 Badge', type: 'milestone' },
      { id: 'm4', title: 'Feedback Champion', description: 'Leave 5 session reviews', icon: <Medal className="h-5 w-5" />, target: 5, current: Math.min(feedbackGiven, 5), reward: '💬 Badge', type: 'milestone' },
      { id: 'm5', title: 'Streak Master', description: 'Maintain a 4-week streak', icon: <Flame className="h-5 w-5" />, target: 4, current: Math.min(streak, 4), reward: '🔥 Badge', type: 'milestone' },
    ];
  }, [user, sessions, completedSessions, thisWeekSessions, streak]);

  // ---- Leaderboard ----
  const leaderboard = useMemo(() => {
    return [...allUsers]
      .sort((a, b) => b.reputation - a.reputation || b.sessionsCompleted - a.sessionsCompleted)
      .slice(0, 10)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [allUsers]);

  if (!user) return null;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  const stageColor = (stage: string) =>
    stage === 'Advanced' ? 'bg-primary text-primary-foreground' :
    stage === 'Intermediate' ? 'bg-accent text-accent-foreground' :
    stage === 'Beginner' ? 'bg-warning text-warning-foreground' :
    'bg-muted text-muted-foreground';

  const myRank = leaderboard.findIndex(u => u.id === user.id) + 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Header */}
          <motion.div variants={item}>
            <h1 className="text-3xl font-display font-bold mb-1">Progress & Challenges 🏆</h1>
            <p className="text-muted-foreground">Track your growth and complete challenges to earn rewards</p>
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 text-center">
              <Flame className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">{streak}</p>
              <p className="text-sm text-muted-foreground">Week Streak</p>
            </div>
            <div className="glass-card p-5 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">{totalHours}</p>
              <p className="text-sm text-muted-foreground">Hours Learned</p>
            </div>
            <div className="glass-card p-5 text-center">
              <BookOpen className="h-6 w-6 text-info mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">{completedSessions.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="glass-card p-5 text-center">
              <Crown className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-3xl font-display font-bold">{myRank || '—'}</p>
              <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Skill Progress */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" /> Skill Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillProgress.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Add skills you want to learn in your profile to track progress here.</p>
                    ) : skillProgress.map(skill => (
                      <div key={skill.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{skill.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{skill.sessions} sessions</span>
                            <Badge className={stageColor(skill.stage)} variant="secondary">{skill.stage}</Badge>
                          </div>
                        </div>
                        <Progress value={skill.percent} className="h-2.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learning Stats Charts */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5 text-primary" /> Learning Stats (Last 8 Weeks)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-3">Sessions per Week</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={weeklyStats}>
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-3">Hours per Week</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={weeklyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                            <Line type="monotone" dataKey="hours" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Weekly Challenges */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-accent" /> Weekly Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {challenges.filter(c => c.type === 'weekly').map(c => {
                      const done = c.current >= c.target;
                      return (
                        <div key={c.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${done ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'}`}>
                          <div className={`p-2.5 rounded-lg ${done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {c.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{c.title}</p>
                              {done && <Badge className="bg-primary text-primary-foreground">✓ Done</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                            <Progress value={(c.current / c.target) * 100} className="h-1.5 mt-2" />
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{c.current}/{c.target}</p>
                            <p className="text-xs text-muted-foreground">{c.reward}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              {/* Streak Card */}
              <motion.div variants={item}>
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-accent/20 to-primary/10 p-6 text-center">
                    <Flame className="h-10 w-10 text-accent mx-auto mb-2" />
                    <p className="text-4xl font-display font-bold">{streak}</p>
                    <p className="text-sm text-muted-foreground">Week Streak</p>
                    <div className="flex justify-center gap-1 mt-3">
                      {Array.from({ length: 8 }, (_, i) => {
                        const { year, week } = weeksAgo(7 - i);
                        const active = completedSessions.some(s => {
                          const d = new Date(s.scheduledDate);
                          return d.getFullYear() === year && getWeekNumber(d) === week;
                        });
                        return (
                          <div key={i} className={`w-6 h-6 rounded-md text-[10px] flex items-center justify-center font-medium ${active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {active ? '🔥' : '·'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Achievement Milestones */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="h-5 w-5 text-warning" /> Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {challenges.filter(c => c.type === 'milestone').map(c => {
                      const done = c.current >= c.target;
                      return (
                        <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg ${done ? 'bg-warning/10' : 'bg-muted/30'}`}>
                          <div className={`p-2 rounded-lg ${done ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>
                            {c.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? '' : 'text-muted-foreground'}`}>{c.title}</p>
                            <p className="text-xs text-muted-foreground">{c.current}/{c.target}</p>
                          </div>
                          {done && <span className="text-lg">{c.reward.split(' ')[0]}</span>}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Leaderboard */}
              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Crown className="h-5 w-5 text-warning" /> Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.map(u => {
                      const isMe = u.id === user.id;
                      return (
                        <div key={u.id} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${isMe ? 'bg-primary/10 ring-1 ring-primary/20' : ''}`}>
                          <span className={`w-6 text-center font-bold ${u.rank <= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {u.rank <= 3 ? ['🥇','🥈','🥉'][u.rank-1] : `#${u.rank}`}
                          </span>
                          <div className="flex-1 min-w-0 truncate">
                            <span className="font-medium">{u.name}</span>
                            {isMe && <span className="text-xs text-primary ml-1">(You)</span>}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Star className="h-3.5 w-3.5 text-warning" />
                            <span className="text-xs font-medium">{u.reputation.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {leaderboard.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
