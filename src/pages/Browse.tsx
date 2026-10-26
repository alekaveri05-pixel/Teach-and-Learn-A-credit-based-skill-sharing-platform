import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetUsers } from '@/lib/api';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, BookOpen, Search, Filter, ArrowRight, ArrowUpDown, Clock, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { User, Skill } from '@/types';
import { getSkillCredits } from '@/lib/skillCredits';

type SortOption = 'rating-desc' | 'rating-asc' | 'sessions-desc' | 'reputation-desc' | 'name-asc';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function BrowsePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('skill') || '');
  const [minReputation, setMinReputation] = useState([0]);
  const [sortBy, setSortBy] = useState<SortOption>('rating-desc');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetUsers().then(users => {
      setAllUsers(users);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Collect all unique skill names for quick filter chips
  const allSkillNames = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach(u => u.skillsToTeach.forEach(s => set.add(s.name)));
    return [...set].sort();
  }, [allUsers]);

  const teacherSkills = useMemo(() => {
    const results: { user: User; skill: Skill }[] = [];
    allUsers.forEach(u => {
      if (u.id === user?.id) return;
      u.skillsToTeach.forEach(skill => {
        results.push({ user: u, skill });
      });
    });
    return results;
  }, [allUsers, user]);

  const filtered = useMemo(() => {
    let results = teacherSkills.filter(({ user: u, skill }) => {
      if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (u.reputation < minReputation[0]) return false;
      if (dayFilter !== 'all' && u.availability) {
        const hasDay = u.availability.some(a => a.day === dayFilter);
        if (!hasDay) return false;
      }
      return true;
    });

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc': return b.skill.avgRating - a.skill.avgRating;
        case 'rating-asc': return a.skill.avgRating - b.skill.avgRating;
        case 'sessions-desc': return b.skill.sessionsCount - a.skill.sessionsCount;
        case 'reputation-desc': return b.user.reputation - a.user.reputation;
        case 'name-asc': return a.user.name.localeCompare(b.user.name);
        default: return 0;
      }
    });

    return results;
  }, [teacherSkills, searchQuery, minReputation, sortBy, dayFilter]);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold mb-1">Browse Skills</h1>
          <p className="text-muted-foreground mb-6">Find teachers for the skills you want to learn</p>

          {/* Search + Filter Toggle */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search skills or teachers..." className="pl-10" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
              <Filter className="h-4 w-4" /> Filters
            </button>
          </div>

          {/* Quick Skill Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSearchQuery('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!searchQuery ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              All
            </button>
            {allSkillNames.slice(0, 10).map(name => (
              <button
                key={name}
                onClick={() => setSearchQuery(name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${searchQuery === name ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="glass-card p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Min. Reputation: {minReputation[0].toFixed(1)}</Label>
                <Slider value={minReputation} onValueChange={setMinReputation} max={5} step={0.5} className="mt-3" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Sort By</Label>
                <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating-desc">Highest Rating</SelectItem>
                    <SelectItem value="rating-asc">Lowest Rating</SelectItem>
                    <SelectItem value="sessions-desc">Most Sessions</SelectItem>
                    <SelectItem value="reputation-desc">Best Reputation</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Available On</Label>
                <Select value={dayFilter} onValueChange={setDayFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Day</SelectItem>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {/* Skills I want to learn — quick match section */}
          {user && user.skillsToLearn && user.skillsToLearn.length > 0 && (
            <div className="glass-card p-4 mb-6 border border-primary/20 bg-primary/5">
              <p className="text-sm font-medium mb-2">🎯 Skills you want to learn — click to find teachers:</p>
              <div className="flex flex-wrap gap-2">
                {user.skillsToLearn.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setSearchQuery(s.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${searchQuery === s.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:bg-muted/50'}`}
                  >
                    {s.name} · {s.level}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-4">
            {loading ? 'Loading teachers...' : `${filtered.length} teacher${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ user: teacher, skill }) => {
              const credits = getSkillCredits(skill.name);
              return (
                <motion.div key={`${teacher.id}-${skill.name}`} variants={item}>
                  <Link to={`/teacher/${teacher.id}?skill=${encodeURIComponent(skill.name)}`} className="glass-card-hover block p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{teacher.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 text-warning" /> {teacher.reputation.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display font-semibold text-lg">{skill.name}</h3>
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Coins className="h-3 w-3" /> {credits} credit{credits > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning" /> {skill.avgRating.toFixed(1)} avg</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {skill.sessionsCount} sessions</span>
                    </div>
                    {teacher.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{teacher.bio}</p>
                    )}
                    {teacher.availability && teacher.availability.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teacher.availability.slice(0, 3).map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {a.day.slice(0, 3)} {a.startTime}–{a.endTime}
                          </Badge>
                        ))}
                        {teacher.availability.length > 3 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{teacher.availability.length - 3}</Badge>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center text-primary text-sm font-medium">
                      View & Book <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium">No teachers found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery
                  ? `No one is currently teaching "${searchQuery}". Try a different skill or clear the search.`
                  : 'No teachers available yet. Be the first to add skills in your profile!'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-sm text-primary font-medium hover:underline">
                  Clear search and show all
                </button>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
