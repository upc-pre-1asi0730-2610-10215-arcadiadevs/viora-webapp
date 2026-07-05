import express from 'express';
import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS for Vite dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Load mock database
const db = jsonServer.router(join(__dirname, 'db.json'));

// ─── Auth middleware (runs before json-server router) ───

const authRoutes = ['/api/v1/authentication', '/api/v1/auth'];

authRoutes.forEach((authRoute) => app.post(`${authRoute}/sign-in`, (req, res) => {
  const { username, email, password } = req.body;
  const login = username ?? email;
  const user = db.db.get('users').find({ email: login, password }).value();
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const { password: _, ...safe } = user;
  res.status(200).json({ ...safe, token: `mock-jwt-${user.id}` });
}));

authRoutes.forEach((authRoute) => app.post(`${authRoute}/sign-up`, (req, res) => {
  const { username, email, password, fullName, role } = req.body;
  const accountEmail = email ?? username;
  const exists = db.db.get('users').find({ email: accountEmail }).value();
  if (exists) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  const users = db.db.get('users');
  const id = (users.map('id').max() || 0) + 1;
  const newUser = { id, username: username ?? accountEmail, email: accountEmail, password, fullName: fullName || '', role: role || 'ROLE_GROWER' };
  users.push(newUser).write();
  const { password: _, ...safe } = newUser;
  res.status(201).json({ ...safe, token: `mock-jwt-${id}` });
}));

authRoutes.forEach((authRoute) => app.post(`${authRoute}/verify`, (req, res) => {
  const user = db.db.get('users').first().value();
  if (!user) return res.status(404).json({ message: 'No user found.' });
  const { password: _, ...safe } = user;
  res.status(200).json({ ...safe, token: `mock-jwt-${user.id}` });
}));

authRoutes.forEach((authRoute) => app.post(`${authRoute}/resend-verification`, (req, res) => {
  res.status(200).json({ message: 'Verification email sent.' });
}));
// ─── Contract-aware mock handlers (runs before json-server router) ───

const numericId = (value) => Number(value);
const collection = (name) => db.db.get(name);
const findById = (name, id, idKey = 'id') => collection(name).find({ [idKey]: numericId(id) }).value();

app.get('/api/v1/plots', (req, res, next) => {
  if (req.query.view !== 'overview') return next();
  res.json(collection('plots-overview').value());
});

app.get('/api/v1/plots/:id', (req, res, next) => {
  const view = req.query.view;
  if (!view) return next();
  const sources = {
    detail: ['plot-details', 'plotId'],
    monitoring: ['plot-monitoring-summaries', 'plotId'],
    weather: ['plot-weather-forecasts', 'plotId'],
  };
  const source = sources[view];
  if (!source) return next();
  const resource = findById(source[0], req.params.id, source[1]);
  if (!resource) return res.status(404).json({ message: 'Plot view not found.' });
  res.json(resource);
});

app.get('/api/v1/plots/:id/images', (req, res) => {
  const plot = findById('plots', req.params.id);
  const tileUrl = plot?.currentImagery?.tileUrl ?? null;
  if (!tileUrl) return res.status(404).json({ message: 'Image tile not found.' });
  res.json({ tileUrl, zoom: req.query.zoom, x: req.query.x, y: req.query.y });
});

app.get('/api/v1/plots/:id/iot-devices', (req, res) => {
  const plotId = numericId(req.params.id);
  res.json(collection('iot-devices').filter({ plotId }).value());
});

app.patch('/api/v1/dynamic-nutrition-plans/:id', (req, res) => {
  const plans = collection('dynamic-nutrition-plans-active');
  const id = numericId(req.params.id);
  const current = plans.find((plan) => Number(plan.dynamicNutritionPlanId ?? plan.id) === id).value();
  if (!current) return res.status(404).json({ message: 'Dynamic nutrition plan not found.' });
  const updated = {
    ...current,
    ...req.body,
    certificationStatus: req.body.certificationStatus ?? 'CERTIFIED',
    application: req.body.application ?? req.body,
  };
  plans.find((plan) => Number(plan.dynamicNutritionPlanId ?? plan.id) === id).assign(updated).write();
  res.json(updated);
});

app.patch('/api/v1/intervention-outcomes/:id', (req, res) => {
  res.json({ id: numericId(req.params.id), ...req.body, status: req.body.status ?? 'CLOSED' });
});
const profileFromUser = (userId, overrides = {}) => {
  const user = findById('users', userId);
  if (!user) return null;
  return {
    id: numericId(userId),
    userId: numericId(userId),
    role: user.role === 'ROLE_SPECIALIST' ? 'SPECIALIST' : 'PRODUCER',
    fullName: user.fullName ?? '',
    email: user.email ?? '',
    phone: '',
    jobTitle: user.role === 'ROLE_SPECIALIST' ? 'Phytosanitary specialist' : 'Olive producer',
    language: 'English',
    location: 'Tacna, Peru',
    specialtyArea: user.role === 'ROLE_SPECIALIST' ? 'Crop health' : '',
    ...overrides,
  };
};

app.get('/api/v1/profiles/:userId', (req, res) => {
  const profile = profileFromUser(req.params.userId);
  if (!profile) return res.status(404).json({ message: 'Profile not found.' });
  res.json(profile);
});

app.put('/api/v1/profiles/:userId', (req, res) => {
  const profile = profileFromUser(req.params.userId, req.body);
  if (!profile) return res.status(404).json({ message: 'Profile not found.' });
  res.json(profile);
});

app.get('/api/v1/referrals/:userId', (req, res) => {
  res.json({ userId: numericId(req.params.userId), code: `VIORA-${req.params.userId}`, rewardPercent: 10 });
});

app.get('/api/v1/coupons', (req, res) => {
  res.json([]);
});

const redeemCoupon = (req, res) => {
  res.status(201).json({
    id: Date.now(),
    userId: numericId(req.body.userId),
    code: req.body.code,
    description: 'Mock redeemed coupon',
    discountPercent: 10,
    validUntil: '2026-12-31',
    conditions: 'Valid for mock checkout only.',
  });
};
app.post('/api/v1/coupon-redemptions', redeemCoupon);
app.post('/api/v1/coupons/redeem', redeemCoupon);

app.get('/api/v1/plans', (req, res) => {
  res.json([
    { id: 1, code: 'BASIC', name: 'Basic', priceCents: 0, currency: 'USD', interval: 'MONTHLY', tagline: 'Start monitoring', features: ['Plot monitoring'], plotLimit: 2, iotLimit: 1 },
    { id: 2, code: 'PRO', name: 'Pro', priceCents: 14900, currency: 'USD', interval: 'MONTHLY', tagline: 'Scale operations', features: ['Unlimited plots', 'IoT support'], plotLimit: 20, iotLimit: 10 },
  ]);
});

app.get('/api/v1/subscriptions/:userId', (req, res) => {
  res.json({ userId: numericId(req.params.userId), planCode: 'PRO', planName: 'Pro', interval: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '2026-12-31', priceCents: 14900, currency: 'USD' });
});

app.patch('/api/v1/subscriptions/:userId', (req, res) => {
  res.json({ userId: numericId(req.params.userId), planCode: 'PRO', planName: 'Pro', interval: 'MONTHLY', status: req.body.status ?? 'ACTIVE', currentPeriodEnd: '2026-12-31', priceCents: 14900, currency: 'USD' });
});

app.get('/api/v1/invoices', (req, res) => {
  res.json([]);
});

app.get('/api/v1/payment-methods', (req, res) => {
  res.json([]);
});

app.post('/api/v1/checkouts', (req, res) => {
  res.status(201).json({ preferenceId: `mock-${Date.now()}`, checkoutUrl: 'https://www.mercadopago.com.pe/checkout/v1/mock' });
});
// Mock user endpoints
app.get('/api/v1/users/:id/sessions', (req, res) => res.json([]));
app.put('/api/v1/users/:id/password', (req, res) => res.json({ message: 'Password updated.' }));
app.patch('/api/v1/users/:id', (req, res) => {
  const user = db.db.get('users').find({ id: Number(req.params.id) }).value();
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ ...user, ...req.body });
});

// ─── json-server handles everything else ───
app.use('/api/v1', db);

app.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}/api/v1`);
});
