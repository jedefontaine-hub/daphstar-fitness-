import Constants from 'expo-constants';

export type MobileClassItem = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  spotsLeft?: number;
  location?: string;
  status?: 'scheduled' | 'cancelled';
};

export type BookingPayload = {
  classId: string;
  customerName: string;
  customerEmail: string;
  retirementVillage?: string;
};

export type MobileBookingItem = {
  id: string;
  classId: string;
  classTitle: string;
  classStartTime: string;
  classEndTime: string;
  classStatus: 'scheduled' | 'cancelled';
  bookingStatus: 'active' | 'cancelled';
  cancelToken: string;
  createdAt: string;
  cancelledAt?: string;
};

function getBaseUrlFromExpoConstants(): string | null {
  try {
    // Classic Expo: debuggerHost contains "192.168.x.y:19000"
    // Newer manifests may vary; try a few known locations.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyC = Constants as any;
    const debuggerHost = anyC.manifest?.debuggerHost || anyC.manifest2?.debuggerHost || anyC.expoGo?.packagerOpts?.hostUri;
    if (typeof debuggerHost === 'string') {
      const host = debuggerHost.split(':')[0];
      if (host && host !== 'localhost') return `http://${host}:3000`;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || getBaseUrlFromExpoConstants() || 'http://localhost:3000';

export async function checkApiHealth(timeoutMs = 6000): Promise<{ ok: boolean; status?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}/api/classes`, {
      method: 'GET',
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function listClasses() {
  const res = await fetch(`${BASE_URL}/api/classes`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data as MobileClassItem[];
  if (Array.isArray(data?.classes)) return data.classes as MobileClassItem[];
  return [];
}

export async function getClass(id: string) {
  const res = await fetch(`${BASE_URL}/api/classes/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch class ${id}`);
  return res.json();
}

export async function bookClass(payload: BookingPayload) {
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = typeof data?.error === 'string' ? data.error : 'booking_failed';
    throw new Error(error);
  }

  return data;
}

export async function listMyBookings(email: string): Promise<MobileBookingItem[]> {
  const normalized = email.trim();
  if (!normalized) return [];

  const params = new URLSearchParams({ email: normalized });
  const res = await fetch(`${BASE_URL}/api/bookings/lookup?${params.toString()}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = typeof data?.error === 'string' ? data.error : 'lookup_failed';
    throw new Error(error);
  }

  if (Array.isArray(data?.bookings)) {
    return data.bookings as MobileBookingItem[];
  }
  return [];
}

export async function cancelMyBooking(cancelToken: string) {
  const res = await fetch(`${BASE_URL}/api/bookings/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancelToken }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = typeof data?.error === 'string' ? data.error : 'cancel_failed';
    throw new Error(error);
  }
  return data;
}
