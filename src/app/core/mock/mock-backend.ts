import seed from './demo-data.json';

type Row = Record<string, unknown> & { id: string };
type Db = Record<string, Row[]>;

export interface MockRequest {
  method: string;
  /** Path after /api, e.g. "engagements/3" or "login". */
  path: string;
  params: Record<string, string>;
  body: unknown;
  token: string | null;
}

export interface MockResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

const STORAGE_KEY = 'engagetrack.demo-db';
const TOKEN_PREFIX = 'demo-token-';
const CODE_PREFIX: Record<string, string> = { Audit: 'AUD', Tax: 'TAX', Consulting: 'CON' };

/**
 * A tiny in-browser stand-in for json-server, used by the deployed demo.
 * Supports the same query params the app sends (filters, q, _sort/_order,
 * _page/_limit with X-Total-Count) plus the custom login and password routes.
 * Data lives in sessionStorage, so changes last until the browser tab closes.
 */
export class MockBackend {
  private db: Db;

  constructor(private readonly storage: Storage | null = safeSessionStorage()) {
    this.db = this.load();
  }

  handle(req: MockRequest): MockResponse {
    const [collection, id] = req.path.split('/');

    if (req.method === 'POST' && collection === 'login') return this.login(req.body);
    if (!req.token?.startsWith(TOKEN_PREFIX)) return error(401, 'Not authenticated.');
    if (req.method === 'POST' && collection === 'change-password') {
      return this.changePassword(req.token.slice(TOKEN_PREFIX.length), req.body);
    }

    const rows = this.db[collection];
    if (!rows) return error(404, 'Not found.');

    switch (req.method) {
      case 'GET':
        return id ? this.getOne(rows, id) : this.list(rows, req.params);
      case 'POST':
        return this.create(collection, rows, req.body as Row);
      case 'PATCH':
      case 'PUT':
        return this.update(rows, id, req.body as Partial<Row>);
      case 'DELETE':
        this.db[collection] = rows.filter((r) => r.id !== id);
        this.save();
        return { status: 200, body: {} };
      default:
        return error(405, 'Method not allowed.');
    }
  }

  private list(rows: Row[], params: Record<string, string>): MockResponse {
    let result = rows.filter((row) =>
      Object.entries(params).every(([key, value]) => key.startsWith('_') || key === 'q' || String(row[key]) === value),
    );

    if (params['q']) {
      const term = params['q'].toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((v) => typeof v === 'string' && v.toLowerCase().includes(term)),
      );
    }

    if (params['_sort']) {
      const key = params['_sort'];
      const dir = params['_order'] === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * dir);
    }

    const total = result.length;
    const limit = Number(params['_limit'] ?? 0);
    if (params['_page'] && limit) {
      const start = (Number(params['_page']) - 1) * limit;
      result = result.slice(start, start + limit);
    } else if (limit) {
      result = result.slice(0, limit);
    }

    return { status: 200, body: result.map(withoutPassword), headers: { 'X-Total-Count': String(total) } };
  }

  private getOne(rows: Row[], id: string): MockResponse {
    const row = rows.find((r) => r.id === id);
    return row ? { status: 200, body: withoutPassword(row) } : error(404, 'Not found.');
  }

  private create(collection: string, rows: Row[], body: Row): MockResponse {
    const nextId = String(Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1);
    const row: Row = { ...body, id: nextId };
    if (collection === 'engagements') row['code'] = this.nextCode(rows, body);
    rows.push(row);
    this.save();
    return { status: 201, body: row };
  }

  private update(rows: Row[], id: string, changes: Partial<Row>): MockResponse {
    const index = rows.findIndex((r) => r.id === id);
    if (index < 0) return error(404, 'Not found.');
    rows[index] = { ...rows[index], ...changes, id };
    this.save();
    return { status: 200, body: withoutPassword(rows[index]) };
  }

  private login(body: unknown): MockResponse {
    const { email, password } = (body ?? {}) as { email?: string; password?: string };
    const user = this.db['users'].find((u) => u['email'] === email);
    if (!user || user['password'] !== password) return error(401, 'Invalid email or password.');
    return { status: 200, body: { token: TOKEN_PREFIX + user.id, user: withoutPassword(user) } };
  }

  private changePassword(userId: string, body: unknown): MockResponse {
    const { currentPassword, newPassword } = (body ?? {}) as Record<string, string>;
    const user = this.db['users'].find((u) => u.id === userId);
    if (!user || user['password'] !== currentPassword) return error(400, 'Current password is incorrect.');
    user['password'] = newPassword;
    this.save();
    return { status: 204, body: null };
  }

  /** Same rule as mock-api/server.js: AUD-2026-038 is one more than the highest used number. */
  private nextCode(rows: Row[], body: Row): string {
    const prefix = `${CODE_PREFIX[String(body['serviceLine'])] ?? 'ENG'}-${String(body['startDate'] ?? '').slice(0, 4)}-`;
    const used = rows
      .map((r) => String(r['code'] ?? ''))
      .filter((code) => code.startsWith(prefix))
      .map((code) => Number(code.slice(prefix.length)) || 0);
    return prefix + String(Math.max(0, ...used) + 1).padStart(3, '0');
  }

  private load(): Db {
    try {
      const saved = this.storage?.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Db;
    } catch {
      // Fall through to a fresh copy of the seed data.
    }
    return structuredClone(seed) as unknown as Db;
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch {
      // Storage full or blocked: changes still apply until the page reloads.
    }
  }
}

function error(status: number, message: string): MockResponse {
  return { status, body: { message } };
}

function withoutPassword(row: Row): Row {
  if (!('password' in row)) return row;
  const { password: _omit, ...rest } = row;
  return rest as Row;
}

function safeSessionStorage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}
