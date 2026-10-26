const API_URL = 'https://teach-trade-production.up.railway.app/api';

function getToken(): string | null {
  return localStorage.getItem('teachtrade_token');
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('teachtrade_token', token);
  else localStorage.removeItem('teachtrade_token');
}

async function request<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 3000));
      return request<T>(path, options, retries - 1);
    }
    throw new Error('Cannot connect to server. The backend may be starting up — please wait a moment and try again.');
  }

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 3000));
      return request<T>(path, options, retries - 1);
    }
    throw new Error('Server is starting up — please try again in a few seconds.');
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 3000));
      return request<T>(path, options, retries - 1);
    }
    throw new Error('Server is starting up — please try again in a few seconds.');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export async function apiLogin(email: string, password: string): Promise<{ token: string; user: any }> {
  const data = await request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function apiRegister(payload: {
  name: string; email: string; password: string; bio: string;
  skillsToTeach: { name: string }[];
  skillsToLearn: { name: string; level: string }[];
}): Promise<{ token: string; user: any }> {
  const data = await request<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  return data;
}

export async function apiGetMe(): Promise<any> {
  return request('/auth/me');
}

export function apiLogout() {
  setToken(null);
}

export function hasToken(): boolean {
  return !!getToken();
}

export async function apiForgotPassword(email: string): Promise<{ message: string; otp?: string }> {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function apiVerifyOtp(email: string, otp: string): Promise<{ message: string }> {
  return request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
}

export async function apiResetPassword(email: string, otp: string, newPassword: string): Promise<any> {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) });
}

// Users
export async function apiGetUsers(): Promise<any[]> {
  return request('/users');
}

export async function apiGetUser(id: string): Promise<any> {
  return request(`/users/${id}`);
}

export async function apiUpdateUser(id: string, data: {
  name?: string; bio?: string; avatar?: string;
  skillsToTeach?: { name: string }[];
  skillsToLearn?: { name: string; level: string }[];
  availability?: { day: string; startTime: string; endTime: string }[];
}): Promise<any> {
  return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// Sessions
export async function apiGetSessions(): Promise<any[]> {
  return request('/sessions');
}

export async function apiGetSession(id: string): Promise<any> {
  return request(`/sessions/${id}`);
}

export async function apiCreateSession(data: {
  teacherId: string; skillName: string; type: string;
  scheduledDate: string; scheduledTime: string; duration: number;
}): Promise<any> {
  return request('/sessions', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateSession(id: string, data: { status?: string; actualDuration?: number }): Promise<any> {
  return request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiJoinSession(id: string): Promise<any> {
  return request(`/sessions/${id}/join`, { method: 'POST' });
}

export async function apiCancelSession(id: string): Promise<any> {
  return request(`/sessions/${id}/cancel`, { method: 'POST' });
}

export async function apiRescheduleSession(id: string, data: { scheduledDate: string; scheduledTime: string }): Promise<any> {
  return request(`/sessions/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiReportSession(id: string, data: { reason: string; details: string }): Promise<any> {
  return request(`/sessions/${id}/report`, { method: 'POST', body: JSON.stringify(data) });
}

export async function apiSubmitFeedback(id: string, feedback: {
  rating: number; clarity: number; patience: number;
  knowledge: number; engagement: number; comment: string;
}): Promise<any> {
  return request(`/sessions/${id}/feedback`, { method: 'POST', body: JSON.stringify(feedback) });
}

// Materials
export async function apiUploadMaterial(sessionId: string, file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await request(`/sessions/${sessionId}/materials`, {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result as string,
          }),
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function apiDeleteMaterial(sessionId: string, materialId: string): Promise<any> {
  return request(`/sessions/${sessionId}/materials/${materialId}`, { method: 'DELETE' });
}

// Notes
export async function apiUpdateNotes(sessionId: string, notes: string): Promise<any> {
  return request(`/sessions/${sessionId}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) });
}

export async function apiUploadNoteFile(sessionId: string, file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await request(`/sessions/${sessionId}/note-files`, {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result as string,
          }),
        });
        resolve(result);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function apiDeleteNoteFile(sessionId: string, fileId: string): Promise<any> {
  return request(`/sessions/${sessionId}/note-files/${fileId}`, { method: 'DELETE' });
}
