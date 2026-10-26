import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions, apiGetUser, apiUpdateUser } from '@/lib/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star, BookOpen, Users, Coins, Trophy, Edit2, Check, X,
  Plus, Trash2, GraduationCap, Sparkles, Calendar, TrendingUp, Mail, Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { Session, User, SkillLevel, AvailabilitySlot } from '@/types';
import { toast } from 'sonner';
import { getSkillCredits, SKILL_CREDIT_MAP } from '@/lib/skillCredits';

const ALL_SKILLS = Object.keys(SKILL_CREDIT_MAP);

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTeachSkills, setEditTeachSkills] = useState<string[]>([]);
  const [editLearnSkills, setEditLearnSkills] = useState<{ name: string; level: SkillLevel }[]>([]);
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [newLearnLevel, setNewLearnLevel] = useState<SkillLevel>('Low');
  const [editAvailability, setEditAvailability] = useState<AvailabilitySlot[]>([]);
  const [newAvailDay, setNewAvailDay] = useState<AvailabilitySlot['day']>('Monday');
  const [newAvailStart, setNewAvailStart] = useState('09:00');
  const [newAvailEnd, setNewAvailEnd] = useState('17:00');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});

  useEffect(() => {
    if (!user) return;
    apiGetSessions().then(data => {
      setSessions(data);
      const otherIds = new Set<string>();
      data.forEach((s: Session) => {
        const otherId = s.teacherId === user.id ? s.learnerId : s.teacherId;
        otherIds.add(otherId);
      });
      Promise.all([...otherIds].map(id => apiGetUser(id).then(u => [id, u] as [string, User]))).then(entries => {
        setUsersCache(Object.fromEntries(entries));
      });
    });
  }, [user]);

  if (!user) return null;

  const startEditing = () => {
    setEditName(user.name);
    setEditBio(user.bio || '');
    setEditTeachSkills(user.skillsToTeach.filter(s => s.name && s.name.trim() !== '').map(s => s.name));
    setEditLearnSkills(user.skillsToLearn.filter(s => s.name && s.name.trim() !== '').map(s => ({ name: s.name, level: s.level })));
    setEditAvailability([...(user.availability || [])]);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await apiUpdateUser(user.id, {
        name: editName.trim(),
        bio: editBio.trim(),
        skillsToTeach: editTeachSkills.map(s => ({ name: s })),
        skillsToLearn: editLearnSkills,
        availability: editAvailability,
      });
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTeachSkill = (name: string) => {
    if (!name) return;
    if (editTeachSkills.some(s => s.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added'); return;
    }
    setEditTeachSkills([...editTeachSkills, name]);
    setNewTeachSkill('');
  };

  const addLearnSkill = (name: string) => {
    if (!name) return;
    if (editLearnSkills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added'); return;
    }
    setEditLearnSkills([...editLearnSkills, { name, level: newLearnLevel }]);
    setNewLearnSkill('');
  };

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalHours = Math.round(completedSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration) / 60, 0) * 10) / 10;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Profile Header */}
          <div className="glass-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="h-20 w-20 rounded-2xl gradient-hero flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shrink-0 shadow-lg">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" maxLength={50} />
                    </div>
                    <div className="space-y-1">
                      <Label>Bio</Label>
                      <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell others about yourself…" rows={3} maxLength={500} />
                      <p className="text-xs text-muted-foreground">{editBio.length}/500</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
                        <Check className="h-4 w-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-display font-bold">{user.name}</h1>
                      <Button variant="ghost" size="icon" onClick={startEditing} className="text-muted-foreground h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm max-w-lg">{user.bio || 'No bio yet — click edit to add one!'}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
                      {memberSince && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {memberSince}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Credits', value: user.credits, icon: Coins, color: 'text-primary' },
              { label: 'Reputation', value: user.reputation.toFixed(1), icon: Star, color: 'text-warning' },
              { label: 'Sessions', value: user.sessionsCompleted, icon: BookOpen, color: 'text-info' },
              { label: 'Connections', value: user.uniqueConnections.length, icon: Users, color: 'text-success' },
              { label: 'Hours', value: totalHours, icon: TrendingUp, color: 'text-accent' },
              { label: 'Badges', value: user.badges.length, icon: Trophy, color: 'text-warning' },
            ].map(stat => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <stat.icon className={`h-4 w-4 mx-auto mb-1.5 ${stat.color}`} />
                <p className="text-xl font-display font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Skills I Teach */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="h-5 w-5 text-primary" /> Skills I Teach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-3">
                      {editTeachSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <span className="flex-1 font-medium text-sm">{skill}</span>
                          <span className="text-xs text-primary">{getSkillCredits(skill)} cr</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setEditTeachSkills(editTeachSkills.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Select value={newTeachSkill} onValueChange={addTeachSkill}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select a skill to add…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_SKILLS.filter(s => !editTeachSkills.some(es => es.toLowerCase() === s.toLowerCase())).map(s => (
                            <SelectItem key={s} value={s}>{s} — {getSkillCredits(s)} credit{getSkillCredits(s) > 1 ? 's' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {user.skillsToTeach.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No teaching skills yet. Click edit to add some!</p>
                      ) : user.skillsToTeach.filter(skill => skill.name && skill.name.trim() !== '').map(skill => (
                        <div key={skill.name} className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{skill.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                <Coins className="h-3 w-3" /> {getSkillCredits(skill.name)} cr/session
                              </span>
                              <span className="flex items-center gap-1 text-sm font-semibold">
                                <Star className="h-3.5 w-3.5 text-warning" /> {skill.avgRating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{skill.sessionsCount} sessions</span>
                            <span>{skill.totalRatings} ratings</span>
                          </div>
                          <Progress value={Math.min(skill.sessionsCount * 10, 100)} className="h-1.5 mt-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills I Want to Learn */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-accent" /> Skills I Want to Learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-3">
                      {editLearnSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <span className="flex-1 font-medium text-sm">{skill.name}</span>
                          <Select value={skill.level} onValueChange={(v) => {
                            const updated = [...editLearnSkills];
                            updated[idx].level = v as SkillLevel;
                            setEditLearnSkills(updated);
                          }}>
                            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setEditLearnSkills(editLearnSkills.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Select value={newLearnSkill} onValueChange={addLearnSkill}>
                          <SelectTrigger className="flex-1 h-9 text-sm">
                            <SelectValue placeholder="Select a skill to add…" />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_SKILLS.filter(s => !editLearnSkills.some(es => es.name.toLowerCase() === s.toLowerCase())).map(s => (
                              <SelectItem key={s} value={s}>{s} — {getSkillCredits(s)} credit{getSkillCredits(s) > 1 ? 's' : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={newLearnLevel} onValueChange={v => setNewLearnLevel(v as SkillLevel)}>
                          <SelectTrigger className="w-24 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.skillsToLearn.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No learning goals yet. Click edit to add some!</p>
                      ) : user.skillsToLearn.filter(skill => skill.name && skill.name.trim() !== '').map(skill => (
                        <Link key={skill.name} to={`/browse?skill=${encodeURIComponent(skill.name)}`}
                          className={`px-4 py-2 rounded-full text-sm font-medium hover:opacity-80 transition-colors ${skill.level === 'Low' ? 'badge-low' : skill.level === 'Medium' ? 'badge-medium' : 'badge-high'}`}>
                          {skill.name} · {skill.level} · {getSkillCredits(skill.name)} cr
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" /> Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-3">
                      {editAvailability.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <span className="text-sm font-medium w-20">{slot.day.slice(0, 3)}</span>
                          <span className="text-sm text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive"
                            onClick={() => setEditAvailability(editAvailability.filter((_, i) => i !== idx))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        <Select value={newAvailDay} onValueChange={v => setNewAvailDay(v as AvailabilitySlot['day'])}>
                          <SelectTrigger className="w-28 h-9 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="time" value={newAvailStart} onChange={e => setNewAvailStart(e.target.value)} className="w-28 h-9 text-xs" />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="time" value={newAvailEnd} onChange={e => setNewAvailEnd(e.target.value)} className="w-28 h-9 text-xs" />
                        <Button size="sm" variant="outline" onClick={() => setEditAvailability([...editAvailability, { day: newAvailDay, startTime: newAvailStart, endTime: newAvailEnd }])}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(!user.availability || user.availability.length === 0) ? (
                        <p className="text-sm text-muted-foreground">No availability set. Click edit to add your schedule!</p>
                      ) : user.availability.map((slot, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {slot.day.slice(0, 3)} {slot.startTime}–{slot.endTime}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right column */}
            <div className="space-y-6">

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-warning" /> Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.slice(0, 5).map(session => {
                        const isTeacher = session.teacherId === user.id;
                        const otherId = isTeacher ? session.learnerId : session.teacherId;
                        const other = usersCache[otherId];
                        return (
                          <Link key={session.id} to={`/session/${session.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{session.skillName}</p>
                              <p className="text-xs text-muted-foreground">{isTeacher ? 'Taught' : 'Learned from'} {other?.name || '…'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {session.status === 'completed' && session.type === 'full' && (
                                <span className={`text-xs font-semibold ${isTeacher ? 'text-success' : 'text-destructive'}`}>
                                  {isTeacher ? '+' : '−'}{session.creditCost || getSkillCredits(session.skillName)} cr
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                session.status === 'completed' ? 'badge-high' :
                                session.status === 'pending-feedback' ? 'badge-medium' : 'bg-muted text-muted-foreground'
                              }`}>{session.status}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
}
