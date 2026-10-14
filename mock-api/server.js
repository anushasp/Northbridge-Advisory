// Mock REST API for EngageTrack, built on json-server.
// Adds a fake login endpoint and requires a Bearer token on every other route,
// so the Angular auth interceptor and 401 handling have something real to talk to.
const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ noCors: false });

const FAKE_TOKEN_PREFIX = 'demo-token-';
const LATENCY_MS = 400; // makes loading states visible during development

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use((req, res, next) => setTimeout(next, LATENCY_MS));

server.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = router.db.get('users').find({ email }).value();

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const { password: _omit, ...safeUser } = user;
  res.json({ token: FAKE_TOKEN_PREFIX + user.id, user: safeUser });
});

server.use((req, res, next) => {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ' + FAKE_TOKEN_PREFIX)) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  next();
});

// Mock "change password": checks the current password for the signed-in user.
server.post('/change-password', (req, res) => {
  const userId = req.headers.authorization.replace('Bearer ' + FAKE_TOKEN_PREFIX, '');
  const { currentPassword, newPassword } = req.body ?? {};
  const users = router.db.get('users');
  const user = users.find({ id: userId }).value();

  if (!user || user.password !== currentPassword) {
    return res.status(400).json({ message: 'Current password is incorrect.' });
  }
  users.find({ id: userId }).assign({ password: newPassword }).write();
  res.status(204).end();
});

// The server owns engagement codes (e.g. AUD-2026-038), like a real backend would.
const PREFIX = { Audit: 'AUD', Tax: 'TAX', Consulting: 'CON' };
server.post('/engagements', (req, res, next) => {
  const prefix = `${PREFIX[req.body.serviceLine] ?? 'ENG'}-${String(req.body.startDate ?? '').slice(0, 4)}-`;
  const used = router.db
    .get('engagements')
    .map('code')
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .value();
  req.body.code = prefix + String(Math.max(0, ...used) + 1).padStart(3, '0');
  next();
});

// Never send passwords back from the users collection.
router.render = (req, res) => {
  const strip = (u) => {
    if (u && typeof u === 'object' && 'password' in u) {
      const { password: _omit, ...rest } = u;
      return rest;
    }
    return u;
  };
  const data = res.locals.data;
  res.jsonp(Array.isArray(data) ? data.map(strip) : strip(data));
};

server.use(router);

const PORT = Number(process.env.API_PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`EngageTrack mock API running at http://localhost:${PORT}`);
});
