import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Download, File, Image, Video, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiUploadMaterial, apiDeleteMaterial } from '@/lib/api';
import { Session, Material } from '@/types';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.gif,.mp4,.webm,.zip,.rar';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx')) return <FileSpreadsheet className="h-4 w-4" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-400" />;
  return <File className="h-4 w-4" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  session: Session;
  isTeacher: boolean;
  onUpdate: (session: Session) => void;
}

export default function SessionMaterials({ session, isTeacher, onUpdate }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast.error('File too large (max 10MB)');
      return;
    }

    setUploading(true);
    try {
      const updated = await apiUploadMaterial(session.id, file);
      onUpdate(updated);
      toast.success(`"${file.name}" uploaded!`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (materialId: string, name: string) => {
    try {
      const updated = await apiDeleteMaterial(session.id, materialId);
      onUpdate(updated);
      toast.success(`"${name}" removed`);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleDownload = (material: Material) => {
    const a = document.createElement('a');
    a.href = material.url;
    a.download = material.name;
    a.click();
  };

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Session Notes & Materials
        </h2>
        {isTeacher && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              size="sm"
              className="gradient-primary text-primary-foreground"
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </>
        )}
      </div>

      {isTeacher && (
        <p className="text-xs text-muted-foreground mb-4">
          Upload PDFs, documents, images, videos, or any learning materials (max 10MB each).
        </p>
      )}

      {session.materials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{isTeacher ? 'No materials uploaded yet. Share notes with your learner!' : 'No materials shared yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {session.materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(m.type)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(m.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(m)}>
                  <Download className="h-4 w-4" />
                </Button>
                {isTeacher && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id, m.name)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
