import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions, apiGetUser } from '@/lib/api';
import { Session } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Clock, MessageSquare, AlertTriangle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'upcoming' | 'feedback' | 'starting' | 'overdue';
  title: string;
  description: string;
  link: string;
  time?: string;
}

export default function NotificationPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      let sessions: Session[];
      try {
        sessions = await apiGetSessions();
      } catch {
        return;
      }

      const now = new Date();
      const notifs: Notification[] = [];

      for (const s of sessions) {
        const otherId = s.teacherId === user.id ? s.learnerId : s.teacherId;
        let otherName = 'your partner';
        try {
          const u = await apiGetUser(otherId);
          otherName = u.name;
        } catch {}

        if (s.status === 'scheduled') {
          const sessionDateTime = new Date(`${s.scheduledDate}T${s.scheduledTime}`);
          const diffMs = sessionDateTime.getTime() - now.getTime();
          const diffMin = diffMs / 60000;

          if (diffMin <= 0 && diffMin > -30) {
            notifs.push({
              id: `${s.id}-now`,
              type: 'starting',
              title: 'Session starting NOW!',
              description: `${s.skillName} with ${otherName}`,
              link: `/session/${s.id}`,
              time: s.scheduledTime,
            });
          } else if (diffMin <= -30) {
            notifs.push({
              id: `${s.id}-overdue`,
              type: 'overdue',
              title: 'Session overdue',
              description: `${s.skillName} with ${otherName} was at ${s.scheduledTime}`,
              link: `/session/${s.id}`,
              time: s.scheduledTime,
            });
          } else if (diffMin > 0 && diffMin <= 1440) {
            const timeLabel = diffMin <= 15 ? `in ${Math.ceil(diffMin)} min` :
              diffMin <= 60 ? 'in ~1 hour' : 'tomorrow';
            notifs.push({
              id: `${s.id}-upcoming`,
              type: 'upcoming',
              title: `Upcoming: ${s.skillName}`,
              description: `With ${otherName} ${timeLabel}`,
              link: `/session/${s.id}`,
              time: `${s.scheduledDate} at ${s.scheduledTime}`,
            });
          }
        }

        if (s.status === 'pending-feedback') {
          const isTeacher = s.teacherId === user.id;
          const needsFeedback = isTeacher ? !s.teacherFeedback : !s.learnerFeedback;
          if (needsFeedback) {
            notifs.push({
              id: `${s.id}-feedback`,
              type: 'feedback',
              title: 'Feedback needed',
              description: `Rate your ${s.skillName} session with ${otherName}`,
              link: `/session/${s.id}/feedback`,
            });
          }
        }
      }

      setNotifications(notifs);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const iconMap = {
    upcoming: <Clock className="h-4 w-4 text-info shrink-0" />,
    feedback: <MessageSquare className="h-4 w-4 text-warning shrink-0" />,
    starting: <Video className="h-4 w-4 text-destructive shrink-0 animate-pulse" />,
    overdue: <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full gradient-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        <div className="p-3 border-b border-border">
          <h3 className="font-display font-semibold text-sm">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications right now</p>
              <p className="text-xs text-muted-foreground mt-1">Book a session to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{iconMap[n.type]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    {n.time && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{n.time}</p>
                    )}
                  </div>
                  {(n.type === 'starting' || n.type === 'overdue') && (
                    <span className="text-xs font-medium text-destructive shrink-0 mt-0.5">Join →</span>
                  )}
                  {n.type === 'feedback' && (
                    <span className="text-xs font-medium text-primary shrink-0 mt-0.5">Rate →</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
