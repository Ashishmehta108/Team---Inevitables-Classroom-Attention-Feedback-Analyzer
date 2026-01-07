import { apiFetch, loginAnonymous } from '@/lib/api';

describe('api client', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends Authorization header when token provided', async () => {
    const mock = jest.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    await apiFetch('/health', { token: 'abc123' });

    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer abc123'
        })
      })
    );
  });

  it('hits anonymous login endpoint', async () => {
    const mock = jest.spyOn(global, 'fetch' as any).mockResolvedValue(
      new Response(JSON.stringify({ token: 't', anonymousCode: 'STU-123', role: 'STUDENT' }), {
        status: 200
      })
    );

    await loginAnonymous();

    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/anonymous'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
