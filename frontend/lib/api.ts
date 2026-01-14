const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://team-inevitables-classroom-attention.onrender.com/api";

type FetchOptions = {
  method?: string;
  token?: string;
  body?: Record<string, unknown> | undefined;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", token, body } = options;
  const res = await fetch(`${DEFAULT_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any)?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: { id: string; role: string; name: string } }>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function loginAnonymous() {
  return apiFetch<{ token: string; anonymousCode: string; role: string }>("/auth/anonymous", {
    method: "POST"
  });
}

export async function loginAnonymousWithCode(code: string) {
  return apiFetch<{ token: string; anonymousCode: string; role: string }>("/auth/anonymous/login", {
    method: "POST",
    body: { code }
  });
}

export async function createClass(token: string, data: { name: string; subject: string }) {
  return apiFetch<{ id: string; name: string; subject: string }>("/classes", {
    method: "POST",
    token,
    body: data
  });
}

export async function listMyClasses(token: string) {
  return apiFetch<Array<{ id: string; name: string; subject: string }>>("/classes/mine", { token });
}

export async function createSession(token: string, data: { classId: string; startsAt?: string }) {
  return apiFetch<{ id: string; classId: string }>(`/sessions`, {
    method: "POST",
    token,
    body: data
  });
}

export async function markAttendance(token: string, sessionId: string) {
  return apiFetch<{ ok: boolean }>(`/attendance/${sessionId}`, { method: "POST", token });
}

export async function getAttendanceCount(token: string, sessionId: string) {
  return apiFetch<{ sessionId: string; count: number }>(`/attendance/${sessionId}/count`, { token });
}

export async function createPoll(
  token: string,
  data: { sessionId: string; question: string; options: string[] }
) {
  return apiFetch<{ id: string; question: string; options: Array<{ id: string; text: string }> }>("/polls", {
    method: "POST",
    token,
    body: data
  });
}

export async function respondPoll(token: string, pollId: string, optionId: string) {
  return apiFetch<{ ok: boolean }>(`/polls/${pollId}/respond`, {
    method: "POST",
    token,
    body: { optionId }
  });
}

export async function getPollResults(
  token: string,
  pollId: string
): Promise<{ poll: { id: string; question: string }; results: Array<{ optionId: string; text: string; count: number }> }> {
  return apiFetch(`/polls/${pollId}/results`, { token });
}

export async function submitFeedback(
  token: string,
  sessionId: string,
  rating: number,
  comment?: string
) {
  return apiFetch<{ ok: boolean }>(`/feedback/${sessionId}`, {
    method: "POST",
    token,
    body: { rating, comment }
  });
}

export async function getFeedbackAggregate(token: string, sessionId: string) {
  return apiFetch<{ sessionId: string; averageRating: number; totalFeedback: number }>(
    `/feedback/session/${sessionId}/aggregate`,
    { token }
  );
}

export async function createDoubt(token: string, sessionId: string, content: string) {
  return apiFetch<{ ok: boolean }>(`/doubts/${sessionId}`, {
    method: "POST",
    token,
    body: { content }
  });
}

export async function listDoubts(
  token: string,
  sessionId: string
): Promise<Array<{ id: string; content: string; createdAt: string; isResolved: boolean }>> {
  return apiFetch(`/doubts/${sessionId}`, { token });
}


// Admin: get anonymous feedback comments for a session
export async function getSessionComments(
  token: string,
  sessionId: string
) {
  return apiFetch<
    Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: string;
    }>
  >(`/feedback/session/${sessionId}/comments`, { token });
}

export async function getTeacherReports(token: string) {
  return apiFetch<
    Array<{
      teacherId: string;
      name: string;
      email: string;
      averageRating: number;
      totalFeedback: number;
      bonusAmount: number | null;
      bonusStatus: string;
    }>
  >("/reports/teachers", { token });
}

export function apiBaseUrl() {
  return DEFAULT_BASE;
}

export { apiFetch };
