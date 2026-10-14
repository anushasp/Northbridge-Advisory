import { MockBackend, MockRequest } from './mock-backend';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(k: string) { return this.data.get(k) ?? null; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  removeItem(k: string) { this.data.delete(k); }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

describe('MockBackend', () => {
  let api: MockBackend;
  const authed = (r: Partial<MockRequest>): MockRequest => ({
    method: 'GET', path: '', params: {}, body: null, token: 'demo-token-u1', ...r,
  });

  beforeEach(() => (api = new MockBackend(new MemoryStorage())));

  it('rejects requests without a token', () => {
    expect(api.handle(authed({ path: 'engagements', token: null })).status).toBe(401);
  });

  it('rejects a wrong password at login and never returns passwords', () => {
    expect(api.handle(authed({ method: 'POST', path: 'login', token: null, body: { email: 'x', password: 'y' } })).status).toBe(401);
    const team = api.handle(authed({ path: 'users' })).body as object[];
    expect(team.every((u) => !('password' in u))).toBe(true);
  });

  it('pages a filtered list and reports the total in X-Total-Count', () => {
    const res = api.handle(authed({ path: 'engagements', params: { archived: 'false', _page: '2', _limit: '6' } }));
    expect((res.body as unknown[]).length).toBe(6);
    expect(res.headers?.['X-Total-Count']).toBe('24');
  });

  it('filters by field and full-text search', () => {
    const audits = api.handle(authed({ path: 'engagements', params: { serviceLine: 'Audit' } })).body as { serviceLine: string }[];
    expect(audits.length).toBeGreaterThan(0);
    expect(audits.every((e) => e.serviceLine === 'Audit')).toBe(true);

    const acme = api.handle(authed({ path: 'engagements', params: { q: 'acme' } })).body as { client: string }[];
    expect(acme.map((e) => e.client)).toEqual(['Acme Corporation']);
  });

  it('creates engagements with the next id and a server-style code', () => {
    const res = api.handle(authed({ method: 'POST', path: 'engagements', body: { serviceLine: 'Audit', startDate: '2026-11-01' } }));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: '25', code: expect.stringMatching(/^AUD-2026-\d{3}$/) });
  });

  it('merges PATCH changes', () => {
    api.handle(authed({ method: 'PATCH', path: 'engagements/1', body: { status: 'Completed' } }));
    expect(api.handle(authed({ path: 'engagements/1' })).body).toMatchObject({ id: '1', status: 'Completed', client: 'Acme Corporation' });
  });

  it('keeps changes in storage across instances (same browser tab)', () => {
    const storage = new MemoryStorage();
    new MockBackend(storage).handle(authed({ method: 'PATCH', path: 'engagements/2', body: { name: 'Renamed' } }));
    expect(new MockBackend(storage).handle(authed({ path: 'engagements/2' })).body).toMatchObject({ name: 'Renamed' });
  });
});
