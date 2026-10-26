import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions, apiGetUser } from '@/lib/api';
import { toast } from 'sonner';
import { Session } from '@/types';

export function useSessionNotifications() {
  const { user } = useAuth();
  const notifiedRef = useRef<Set<string>>(new Set());
  const nameCache = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;

    const getOtherName = async (session: Session) => {
      const otherId = session.teacherId === user.id ? session.learnerId : session.teacherId;
      if (nameCache.current[otherId]) return nameCache.current[otherId];
      try {
        const u = await apiGetUser(otherId);
        nameCache.current[otherId] = u.name;
        return u.name;
      } catch {
        return 'your partner';
      }
    };

    const check = async () => {
      let sessions: Session[];
      try {
        sessions = await apiGetSessions();
      } catch {
        return;
      }

      const now = new Date();

      for (const s of sessions.filter(s => s.status === 'scheduled')) {
        const sessionDateTime = new Date(`${s.scheduledDate}T${s.scheduledTime}`);
        const diffMs = sessionDateTime.getTime() - now.getTime();
        const diffMin = diffMs / 60000;

        // 24-hour reminder
        if (diffMin > 0 && diffMin <= 1440 && diffMin > 60 && !notifiedRef.current.has(`${s.id}-24h`)) {
          notifiedRef.current.add(`${s.id}-24h`);
          const name = await getOtherName(s);
          toast.info('Session tomorrow!', {
            description: `${s.skillName} with ${name} at ${s.scheduledTime}`,
            duration: 8000,
          });
        }

        // 1-hour warning
        if (diffMin > 0 && diffMin <= 60 && diffMin > 15 && !notifiedRef.current.has(`${s.id}-1h`)) {
          notifiedRef.current.add(`${s.id}-1h`);
          const name = await getOtherName(s);
          toast.info('Session in ~1 hour', {
            description: `${s.skillName} with ${name} at ${s.scheduledTime}`,
            duration: 8000,
          });
        }

        // 15-minute urgent alert
        if (diffMin > 0 && diffMin <= 15 && diffMin > 5 && !notifiedRef.current.has(`${s.id}-15m`)) {
          notifiedRef.current.add(`${s.id}-15m`);
          const name = await getOtherName(s);
          toast.warning('Session in 15 minutes!', {
            description: `${s.skillName} with ${name}`,
            duration: 10000,
            action: {
              label: 'View session',
              onClick: () => { window.location.href = `/session/${s.id}`; },
            },
          });
        }

        // 5-minute pre-session
        if (diffMin > 0 && diffMin <= 5 && !notifiedRef.current.has(`${s.id}-5m`)) {
          notifiedRef.current.add(`${s.id}-5m`);
          const name = await getOtherName(s);
          toast.warning('Session starting soon!', {
            description: `${s.skillName} with ${name} in ${Math.ceil(diffMin)} min`,
            duration: 12000,
            action: {
              label: 'Go to session',
              onClick: () => { window.location.href = `/session/${s.id}`; },
            },
          });
        }

        // Session time arrived — Join Now
        if (diffMin <= 0 && diffMin > -2 && !notifiedRef.current.has(`${s.id}-now`)) {
          notifiedRef.current.add(`${s.id}-now`);
          const name = await getOtherName(s);
          toast.error('Session is starting NOW!', {
            description: `${s.skillName} with ${name} — join immediately!`,
            duration: 20000,
            action: {
              label: 'Join now',
              onClick: () => { window.location.href = `/session/${s.id}`; },
            },
          });
        }

        // Overdue — past scheduled time by 2+ minutes
        if (diffMin <= -2 && diffMin > -10 && !notifiedRef.current.has(`${s.id}-overdue`)) {
          notifiedRef.current.add(`${s.id}-overdue`);
          const name = await getOtherName(s);
          toast.error('Session overdue!', {
            description: `${s.skillName} with ${name} was scheduled at ${s.scheduledTime}`,
            duration: 20000,
            action: {
              label: 'Join now',
              onClick: () => { window.location.href = `/session/${s.id}`; },
            },
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [user]);
}
