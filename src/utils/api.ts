import type { InvitationData, RSVPResponse } from '../types/invitation';

const TOKEN_KEY = 'little_racer_admin_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Guest Public API
export async function fetchPublicInvitation(slug: string): Promise<{
  status: 'published' | 'draft';
  invitation?: InvitationData;
  error?: string;
}> {
  const res = await fetch(`/api/invitation/${slug}`);
  const data = await res.json();
  if (!res.ok) {
    return {
      status: data.status || 'draft',
      error: data.error || 'Failed to load invitation.',
    };
  }
  return data;
}

export async function submitRsvp(
  slug: string,
  payload: {
    guestName: string;
    attending: boolean;
    attendeeCount: number;
    guestNames?: string[];
    email?: string;
    phone?: string;
    message?: string;
    dietaryNotes?: string;
  }
): Promise<{ success: boolean; message: string; rsvp?: RSVPResponse; error?: string; existingRsvpId?: string; editToken?: string }> {
  const res = await fetch(`/api/rsvp/${slug}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      success: false,
      message: data.error || 'Failed to submit RSVP.',
      error: data.error,
      existingRsvpId: data.existingRsvpId,
      editToken: data.editToken,
    };
  }
  return data;
}

export async function updateGuestRsvp(
  slug: string,
  rsvpId: string,
  payload: {
    editToken: string;
    attending: boolean;
    attendeeCount: number;
    guestNames?: string[];
    email?: string;
    phone?: string;
    message?: string;
    dietaryNotes?: string;
  }
): Promise<{ success: boolean; rsvp?: RSVPResponse; error?: string }> {
  const res = await fetch(`/api/rsvp/${slug}/${rsvpId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Failed to update RSVP.' };
  }
  return data;
}

// Admin Auth API
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Invalid credentials' };
  }
  if (data.token) {
    setStoredToken(data.token);
  }
  return { success: true, token: data.token };
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch {}
  clearStoredToken();
}

// Admin Invitation APIs
export async function fetchAdminInvitation(): Promise<{
  draft: InvitationData;
  published: InvitationData | null;
  stats: any;
}> {
  const res = await fetch('/api/admin/invitation', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin invitation details');
  return res.json();
}

export async function saveDraftInvitation(updates: Partial<InvitationData>): Promise<{ success: boolean; draft: InvitationData }> {
  const res = await fetch('/api/admin/invitation/draft', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save draft');
  }
  return res.json();
}

export async function publishInvitation(): Promise<{ success: boolean; published: InvitationData; message: string }> {
  const res = await fetch('/api/admin/invitation/publish', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to publish invitation');
  }
  return res.json();
}

export async function unpublishInvitation(): Promise<{ success: boolean; draft: InvitationData; message: string }> {
  const res = await fetch('/api/admin/invitation/unpublish', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to unpublish invitation');
  }
  return res.json();
}

// Admin File Upload
export async function uploadImageFile(file: File): Promise<{ success: boolean; url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

// Admin RSVP APIs
export async function fetchAdminRsvps(): Promise<{ rsvps: RSVPResponse[]; metrics: any }> {
  const res = await fetch('/api/admin/rsvps', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load RSVP responses');
  return res.json();
}

export async function updateAdminRsvp(id: string, updates: Partial<RSVPResponse>): Promise<RSVPResponse> {
  const res = await fetch(`/api/admin/rsvps/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update RSVP');
  const data = await res.json();
  return data.rsvp;
}

export async function deleteAdminRsvp(id: string): Promise<boolean> {
  const res = await fetch(`/api/admin/rsvps/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete RSVP');
  return true;
}
