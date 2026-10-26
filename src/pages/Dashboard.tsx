import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions, apiGetUser } from '@/lib/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Star, Users, BookOpen, AlertTriangle, ArrowRight, Clock, Trophy } from 'lucide-react';
import { getSkillCredits } from '@/lib/skillCredits';
import Navbar from '@/components/Navbar';
import { Session, User } from '@/types';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});

  const loadSessions = async () => {
    if (!user) return;
    const data = await apiGetSessions();
    setSessions(data);
    const otherIds = new Set<string>();
    data.forEach((s: Session) => {
      const otherId = s.teacherId === user.id ? s.learnerId : s.teacherId;
      otherIds.add(otherId);
    });
    Promise.all([...otherIds].map(id => apiGetUser(id).then(u => [id, u] as [string, User]))).then(entries => {
      setUsersCache(Object.fromEntries(entries));
    });
  };

  useEffect(() => {
    loadSessions();
  }, [user]);

  // Auto refresh credits every 10 seconds if there are in-progress or pending-feedback sessions
  useEffect(() => {
    if (!user) return;
    const hasActiveSessions = sessions.some(s =>
      s.status === 'in-progress' || s.status === 'pending-feedback'
    );
    if (!hasActiveSessions) return;
    const interval = setInterval(async () => {
      await refreshUser();
      await loadSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, sessions]);

  if (!user) return null;

  const recentSessions = [...sessions].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 3);

  const pendingFeedback = sessions.filter(s => {
    if (s.status !== 'pending-feedback') return false;
    const isTeacher = s.teacherId === user.id;
    return isTeacher ? !s.teacherFeedback : !s.learnerFeedback;
  });

  const stats = [
    { label: 'Credits', value: user.credits, icon: Coins, color: 'text-primary' },
    { label: 'Reputation', value: user.reputation.toFixed(1), icon: Star, color: 'text-warning' },
    { label: 'Sessions', value: user.sessionsCompleted, icon: BookOpen, color: 'text-info' },
    { label: 'Connections', value: user.uniqueConnections.length, icon: Users, color: 'text-success' },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-1">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-muted-foreground">Here's your learning overview</p>
          </motion.div>

          {/* Suspended warning */}
          {(user as any).suspended && (
            <motion.div variants={item} className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <p className="font-semibold text-destructive text-sm">Your account has been suspended</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account has been suspended due to suspicious activity or repeated violations. You cannot book or participate in sessions until this is reviewed.
                </p>
              </div>
            </motion.div>
          )}

          {/* Flagged warning */}
          {!(user as any).suspended && (user as any).flagged && (
            <motion.div variants={item} className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-orange-700 text-sm">Your account has been flagged for unusual activity</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our system detected suspicious patterns on your account. Please ensure you are using the platform fairly. Continued misuse may result in suspension.
                </p>
                {(user as any).warningCount && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    Warnings received: {(user as any).warningCount}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-3xl font-display font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {pendingFeedback.length > 0 && (
            <motion.div variants={item} className="mb-8 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">You have {pendingFeedback.length} session{pendingFeedback.length > 1 ? 's' : ''} awaiting feedback</p>
                <p className="text-sm text-muted-foreground mt-1">Submit feedback to unlock credit transfers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingFeedback.map(s => (
                    <Link key={s.id} to={`/session/${s.id}/feedback`} className="text-sm text-primary font-medium hover:underline">
                      {s.skillName} session →
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div variants={item} className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold mb-4">Skills I Teach</h2>
                <div className="space-y-3">
                  {user.skillsToTeach.map(skill => (
                    <div key={skill.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{skill.name}</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <Coins className="h-3 w-3" /> {getSkillCredits(skill.name)} credits/session
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning" /> {skill.avgRating.toFixed(1)}</span>
                        <span>{skill.sessionsCount} sessions</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-display font-semibold">Skills I Want to Learn</h2>
                  <Link to="/browse" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                    Browse <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.skillsToLearn.map(skill => (
                    <Link key={skill.name} to={`/browse?skill=${encodeURIComponent(skill.name)}`} className={`px-4 py-2 rounded-full text-sm font-medium hover:opacity-80 transition-colors ${skill.level === 'Low' ? 'badge-low' : skill.level === 'Medium' ? 'badge-medium' : 'badge-high'}`}>
                      {skill.name} · {skill.level} · {getSkillCredits(skill.name)} cr
                    </Link>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold mb-4">Recent Sessions</h2>
                {recentSessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No sessions yet. <Link to="/browse" className="text-primary hover:underline">Browse skills</Link> to get started!</p>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map(session => {
                      const isTeacher = session.teacherId === user.id;
                      const otherId = isTeacher ? session.learnerId : session.teacherId;
                      const other = usersCache[otherId];
                      const credits = session.creditCost || getSkillCredits(session.skillName);
                      return (
                        <Link key={session.id} to={`/session/${session.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{session.skillName}</p>
                            <p className="text-sm text-muted-foreground">
                              {isTeacher ? 'Taught' : 'Learned from'} {other?.name || 'Unknown'} · {session.scheduledDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {session.status === 'completed' && session.type === 'full' && (
                              <span className={`text-xs font-semibold ${isTeacher ? 'text-success' : 'text-destructive'}`}>
                                {isTeacher ? '+' : '−'}{credits} cr
                              </span>
                            )}
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              session.status === 'completed' ? 'badge-high' :
                              session.status === 'pending-feedback' ? 'badge-medium' :
                              session.status === 'in-progress' ? 'badge-low' : 'bg-muted text-muted-foreground'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={item} className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" /> Badges
                </h2>
                {user.badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Complete sessions to earn badges!</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {user.badges.map(badge => (
                      <div key={badge.id} className="text-center p-3 rounded-lg bg-muted/30">
                        <span className="text-2xl">{badge.icon}</span>
                        <p className="text-xs font-medium mt-1">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-display font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link to="/browse" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-primary" /> Find a teacher
                  </Link>
                  <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium">
                    <Users className="h-4 w-4 text-primary" /> Edit profile
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
