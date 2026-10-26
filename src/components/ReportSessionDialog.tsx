import { useState } from 'react';
import { apiReportSession } from '@/lib/api';
import { Session } from '@/types';
import { AlertTriangle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  session: Session;
}

const REASONS = [
  'Teacher did not show up',
  'Learner did not show up',
  'Inappropriate behavior',
  'Session quality was very poor',
  'Technical issues prevented the session',
  'Fraudulent activity',
  'Other',
];

export default function ReportSessionDialog({ session }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Select a reason'); return; }
    if (!details.trim() || details.trim().length < 10) { toast.error('Please provide at least 10 characters of detail'); return; }

    setSubmitting(true);
    try {
      await apiReportSession(session.id, { reason, details: details.trim() });
      setSubmitted(true);
      toast.success('Report submitted. We will review it shortly.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Report Session Issue
          </DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-medium">Report Submitted</p>
            <p className="text-sm text-muted-foreground mt-1">We'll review your report and take appropriate action.</p>
            <Button className="mt-4" variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Please describe what happened in detail…"
                rows={4}
                maxLength={1000}
              />
              <p className="text-[11px] text-muted-foreground">{details.length}/1000</p>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
              <Send className="h-3.5 w-3.5 mr-1" /> {submitting ? 'Submitting…' : 'Submit Report'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
