import { useState, useEffect, useRef } from 'react';
import { apiUpdateNotes, apiUploadNoteFile, apiDeleteNoteFile } from '@/lib/api';
import { Session } from '@/types';
import { StickyNote, Save, CheckCircle, Upload, Trash2, FileText, Image, File, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.pptx,.xlsx,.csv';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function fileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4 text-accent" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
  return <File className="h-4 w-4 text-primary" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  session: Session;
  isTeacher: boolean;
  onUpdate: (s: Session) => void;
}

export default function SessionNotes({ session, isTeacher, onUpdate }: Props) {
  const [notes, setNotes] = useState(session.teacherNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNotes(session.teacherNotes || '');
  }, [session.teacherNotes]);

  if (!isTeacher) return null;

  const noteFiles = session.noteFiles || [];

  const saveText = async (text: string) => {
    setSaving(true);
    try {
      const updated = await apiUpdateNotes(session.id, text);
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (val: string) => {
    setNotes(val);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveText(val), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      setUploading(true);
      try {
        const updated = await apiUploadNoteFile(session.id, file);
        onUpdate(updated);
        toast.success(`Uploaded ${file.name}`);
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      const updated = await apiDeleteNoteFile(session.id, fileId);
      onUpdate(updated);
      toast.success(`Deleted ${fileName}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" /> Session Notes
        </h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => saveText(notes)} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Only you (the teacher) can see and edit these notes. Auto-saves as you type.
      </p>

      {/* Text Notes */}
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write session notes, key points, follow-up tasks…"
        className="w-full min-h-[120px] p-3 rounded-lg bg-muted/30 border border-border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-4"
      />

      {/* File Upload Section */}
      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Note Files
          </h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {uploading ? 'Uploading…' : 'Upload File'}
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mb-3">
          PDF, DOCX, TXT, images, PPTX, XLSX, CSV — max 5MB each
        </p>

        {noteFiles.length === 0 ? (
          <div className="text-center py-6 rounded-lg bg-muted/20 border border-dashed border-border">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No note files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {noteFiles.map(file => (
              <div key={file._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                {fileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadFile(file.url, file.name)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(file._id, file.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
