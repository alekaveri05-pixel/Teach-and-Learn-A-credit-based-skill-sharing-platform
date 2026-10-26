import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetSessions } from '@/lib/api';

export function usePendingFeedbackRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Don't redirect if already on a feedback page
    if (location.pathname.includes('/feedback')) return;

    // Prevent duplicate simultaneous checks
    if (checkingRef.current) return;
    checkingRef.current = true;

    apiGetSessions().then(sessions => {
      // Find ANY session where this user still needs to submit feedback
      const pendingSession = sessions.find(s => {
        if (s.status !== 'pending-feedback') return false;
        const isTeacher = s.teacherId === user.id;
        const hasFeedback = isTeacher ? !!s.teacherFeedback : !!s.learnerFeedback;
        return !hasFeedback;
      });

      if (pendingSession) {
        // Force redirect to feedback page — cannot be skipped
        navigate(`/session/${pendingSession.id}/feedback`, { replace: true });
      }
    }).catch(() => {}).finally(() => {
      checkingRef.current = false;
    });

  // Re-run on every route change and on login
  }, [user?.id, location.pathname]);
}
