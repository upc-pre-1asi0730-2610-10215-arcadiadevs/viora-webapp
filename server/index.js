import express from 'express';
import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// ─── Chill requirement (plot configuration) ───

app.put('/api/v1/plots/:id/chill-requirement', (req, res) => {
  const plots = collection('plots');
  const id = numericId(req.params.id);
  const plot = plots.find({ id }).value();
  if (!plot) return res.status(404).json({ message: 'Plot not found.' });
  const chillRequirement = { ...req.body };
  plots.find({ id }).assign({ chillRequirement }).write();
  res.json(chillRequirement);
});

app.delete('/api/v1/plots/:id/chill-requirement', (req, res) => {
  const plots = collection('plots');
  const id = numericId(req.params.id);
  const plot = plots.find({ id }).value();
  if (!plot) return res.status(404).json({ message: 'Plot not found.' });
  plots.find({ id }).assign({ chillRequirement: null }).write();
  res.json({ chillRequirement: null });
});

// ─── Nested IoT devices (create/update/delete under a plot) ───

app.post('/api/v1/plots/:plotId/iot-devices', (req, res) => {
  const plotId = numericId(req.params.plotId);
  const devices = collection('iot-devices');
  const id = (devices.map('id').max().value() || 0) + 1;
  const deviceName = req.body.deviceName || req.body.name || `Device ${id}`;
  const status = String(req.body.status || 'active').toLowerCase();
  const device = {
    id,
    plotId,
    name: deviceName,
    deviceName,
    soilMoisture: req.body.soilMoisture ?? 0,
    temperature: req.body.temperature ?? 0,
    leafHumidity: req.body.leafHumidity ?? 0,
    status,
    activationCode: req.body.activationCode || '',
    lastUpdate: new Date().toISOString()
  };
  devices.push(device).write();
  res.status(201).json(device);
});

app.patch('/api/v1/plots/:plotId/iot-devices/:id', (req, res) => {
  const plotId = numericId(req.params.plotId);
  const id = numericId(req.params.id);
  const devices = collection('iot-devices');
  const device = devices.find({ id, plotId }).value();
  if (!device) return res.status(404).json({ message: 'IoT device not found.' });
  const status = req.body.iotDeviceStatus
    ? String(req.body.iotDeviceStatus).toLowerCase()
    : device.status;
  const updated = {
    ...device,
    name: req.body.deviceName || device.name,
    deviceName: req.body.deviceName || device.deviceName,
    status,
    lastUpdate: new Date().toISOString()
  };
  devices.find({ id, plotId }).assign(updated).write();
  res.json(updated);
});

app.delete('/api/v1/plots/:plotId/iot-devices/:id', (req, res) => {
  const plotId = numericId(req.params.plotId);
  const id = numericId(req.params.id);
  const devices = collection('iot-devices');
  const device = devices.find({ id, plotId }).value();
  if (!device) return res.status(404).json({ message: 'IoT device not found.' });
  devices.remove({ id, plotId }).write();
  res.status(204).end();
});

// ─── Agronomic: monitoring summary and statistics series (nested paths) ───

app.get('/api/v1/monitoring-summaries/current', (req, res) => {
  res.json(collection('monitoring-summaries-current').value());
});

app.get('/api/v1/agronomic-statistics/series', (req, res) => {
  let series = collection('agronomic-statistics-series').value();
  const plotId = req.query.plotId != null ? String(req.query.plotId) : null;
  const timeRange = req.query.timeRange != null ? String(req.query.timeRange) : null;
  if (plotId != null) series = series.filter((s) => String(s.plotId) === plotId);
  if (timeRange != null) series = series.filter((s) => s.timeRange === timeRange);
  res.json(series);
});

app.get('/api/v1/dynamic-nutrition-plans/active', (req, res) => {
  const plans = collection('dynamic-nutrition-plans-active').value();
  const plotId = req.query.plotId != null ? numericId(req.query.plotId) : null;
  const plan = plotId != null ? plans.find((p) => p.plotId === plotId) : plans[0];
  if (!plan) return res.status(404).json({ message: 'No active nutrition plan found.' });
  res.json(plan);
});

app.post('/api/v1/dynamic-nutrition-plans', (req, res) => {
  const plans = collection('dynamic-nutrition-plans-active');
  const dynamicNutritionPlanId = (plans.map('dynamicNutritionPlanId').max().value() || 0) + 1;
  const plan = {
    dynamicNutritionPlanId,
    userId: req.query.userId ? numericId(req.query.userId) : 1,
    plotId: req.query.plotId ? numericId(req.query.plotId) : null,
    status: 'RECOMMENDED',
    inputRecommendations: [
      { value: 'Foliar nutrition support', purpose: 'Improve stress response and recovery', dosage: 2, dosageUnit: 'L/ha', status: 'RECOMMENDED' }
    ],
    applicationWindow: { startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) },
    rationale: {
      summary: 'Plan generated from mock climate and NDVI signals.',
      triggeringRiskLevel: 'MODERATE',
      ndviValue: 0.5,
      temperatureAnomaly: 1.5
    },
    generatedDate: new Date().toISOString().slice(0, 10),
    certificationStatus: 'PENDING',
    application: null
  };
  plans.push(plan).write();
  res.status(201).json(plan);
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

app.post('/api/v1/intervention-outcomes', (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body, status: req.body.status ?? 'REPORTED' });
});

app.post('/api/v1/intervention-executions', (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body, status: req.body.status ?? 'CERTIFIED', certifiedAt: new Date().toISOString() });
});

// ─── Surveillance: alert timeline and report linking ───

app.get('/api/v1/alerts/:id', (req, res, next) => {
  if (req.query.view !== 'timeline') return next();
  const alert = findById('alerts', req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found.' });
  res.json([
    { id: 1, status: 'Active', note: `${alert.type} reported.`, occurredAt: alert.date },
    { id: 2, status: alert.status, note: `Current status: ${alert.status}.`, occurredAt: alert.date }
  ]);
});

app.put('/api/v1/alerts/:id/report/:reportId', (req, res) => {
  const alerts = collection('alerts');
  const id = numericId(req.params.id);
  const alert = alerts.find({ id }).value();
  if (!alert) return res.status(404).json({ message: 'Alert not found.' });
  const updated = { ...alert, reportId: numericId(req.params.reportId) };
  alerts.find({ id }).assign(updated).write();
  res.json(updated);
});

// ─── Intervention (Expert Assistance): custom lookups ───

app.post('/api/v1/intervention-requests', (req, res) => {
  const requests = collection('intervention-requests');
  const id = (requests.map('id').max().value() || 0) + 1;
  const now = new Date().toISOString();
  const request = {
    id,
    referenceCode: `REQ-${1000 + id}`,
    growerId: req.body.growerId ?? 1,
    plotId: req.body.plotId ?? null,
    specialistId: req.body.specialistId ?? null,
    alertId: req.body.alertId ?? null,
    reason: req.body.reason ?? '',
    message: req.body.message ?? '',
    status: 'PENDING',
    createdAt: now,
    updatedAt: now
  };
  requests.push(request).write();
  res.status(201).json(request);
});

app.get('/api/v1/specialist-dashboard', (req, res) => {
  res.json(collection('specialist-dashboard').value());
});

app.post('/api/v1/intervention-requests/:id/verifications', (req, res) => {
  const request = findById('intervention-requests', req.params.id);
  if (!request) return res.status(404).json({ message: 'Intervention request not found.' });
  collection('intervention-requests')
    .find({ id: numericId(req.params.id) })
    .assign({ status: 'ACCEPTED', updatedAt: new Date().toISOString() })
    .write();
  const dashboard = collection('specialist-dashboard');
  dashboard.assign({
    incomingRequests: dashboard.value().incomingRequests.filter((item) => item.id !== numericId(req.params.id)),
  }).write();
  res.status(200).json({ ...request, status: 'ACCEPTED' });
});

app.post('/api/v1/intervention-requests/:id/declines', (req, res) => {
  const request = findById('intervention-requests', req.params.id);
  if (!request) return res.status(404).json({ message: 'Intervention request not found.' });
  collection('intervention-requests')
    .find({ id: numericId(req.params.id) })
    .assign({ status: 'DECLINED', updatedAt: new Date().toISOString(), declineReason: req.body?.reason ?? '' })
    .write();
  const dashboard = collection('specialist-dashboard');
  dashboard.assign({
    incomingRequests: dashboard.value().incomingRequests.filter((item) => item.id !== numericId(req.params.id)),
  }).write();
  res.status(200).json({ ...request, status: 'DECLINED' });
});

app.get('/api/v1/specialist-candidates', (req, res) => {
  const alertId = req.query.alertId ? numericId(req.query.alertId) : null;
  const limit = req.query.limit ? numericId(req.query.limit) : undefined;
  let candidates = collection('specialist-candidates').value();
  if (alertId != null) candidates = candidates.filter((c) => c.alertId === alertId);
  if (limit != null) candidates = candidates.slice(0, limit);
  res.json(candidates);
});

app.get('/api/v1/service-proposals', (req, res, next) => {
  if (!req.query.requestId) return next();
  const requestId = numericId(req.query.requestId);
  res.json(collection('service-proposals').filter({ interventionRequestId: requestId }).value());
});

app.get('/api/v1/intervention-marketplace', (req, res) => {
  res.json(collection('intervention-marketplace').value());
});

app.post('/api/v1/service-proposals', (req, res) => {
  const proposals = collection('service-proposals');
  const proposal = {
    id: Date.now(),
    interventionRequestId: req.body.interventionRequestId,
    specialistId: req.body.specialistId,
    serviceTitle: req.body.serviceTitle ?? '',
    durationLabel: req.body.durationLabel ?? '',
    scope: req.body.scope ?? [],
    proposedDate: req.body.proposedDate ?? null,
    amount: req.body.amount ?? 0,
    currency: req.body.currency ?? 'PEN',
    proposalDetails: req.body.proposalDetails ?? '',
    createdAt: new Date().toISOString(),
  };
  proposals.push(proposal).write();

  const marketplace = collection('intervention-marketplace');
  const requestId = numericId(req.body.interventionRequestId);
  marketplace.assign({
    cases: marketplace.value().cases.filter((item) => item.id !== requestId),
  }).write();

  res.status(201).json(proposal);
});

app.get('/api/v1/specialists/:id/contact', (req, res) => {
  const specialist = findById('specialists', req.params.id);
  if (!specialist) return res.status(404).json({ message: 'Specialist not found.' });
  res.json({
    specialistId: specialist.id,
    fullName: specialist.fullName,
    phone: specialist.phone,
    email: specialist.email,
    whatsapp: specialist.whatsapp
  });
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
  const userId = req.query.userId ? numericId(req.query.userId) : null;
  const coupons = collection('coupons').value();
  res.json(userId != null ? coupons.filter((c) => c.userId === userId) : coupons);
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

const PLANS = [
  { id: 1, code: 'grower-basic', name: 'Basic', priceCents: 0, currency: 'USD', interval: 'MONTHLY', tagline: 'Start monitoring', features: ['Plot monitoring'], plotLimit: 2, iotLimit: 1 },
  { id: 2, code: 'grower-pro', name: 'Pro', priceCents: 14900, currency: 'USD', interval: 'MONTHLY', tagline: 'Scale operations', features: ['Unlimited plots', 'IoT support'], plotLimit: 20, iotLimit: 10 },
  { id: 3, code: 'specialist-plus', name: 'Specialist Plus', priceCents: 7900, currency: 'PEN', interval: 'MONTHLY', tagline: 'Stay discoverable and manage opportunities', features: [], plotLimit: 0, iotLimit: 0 },
  { id: 4, code: 'specialist-pro', name: 'Specialist Pro', priceCents: 79000, currency: 'PEN', interval: 'ANNUAL', tagline: 'Stronger marketplace positioning and Pro badge', features: [], plotLimit: 0, iotLimit: 0 },
];

app.get('/api/v1/plans', (req, res) => {
  res.json(PLANS);
});

app.get('/api/v1/subscriptions/:userId', (req, res) => {
  const subscription = collection('subscriptions').find({ userId: numericId(req.params.userId) }).value();
  if (!subscription) return res.status(404).json({ message: 'No subscription found for this user.' });
  res.json(subscription);
});

app.patch('/api/v1/subscriptions/:userId', (req, res) => {
  const userId = numericId(req.params.userId);
  const subscriptions = collection('subscriptions');
  const existing = subscriptions.find({ userId }).value();
  const updated = { ...existing, userId, ...req.body };
  if (existing) {
    subscriptions.find({ userId }).assign(updated).write();
  } else {
    subscriptions.push(updated).write();
  }
  res.json(updated);
});

app.get('/api/v1/invoices', (req, res) => {
  const userId = req.query.userId ? numericId(req.query.userId) : null;
  const invoices = collection('invoices').value();
  res.json(userId != null ? invoices.filter((i) => i.userId === userId) : invoices);
});

app.get('/api/v1/payment-methods', (req, res) => {
  const userId = req.query.userId ? numericId(req.query.userId) : null;
  const methods = collection('payment-methods').value();
  res.json(userId != null ? methods.filter((m) => m.userId === userId) : methods);
});

app.post('/api/v1/checkouts', (req, res) => {
  const { userId, planCode, interval } = req.body;
  const plan = PLANS.find((p) => p.code === planCode);
  if (userId && plan) {
    const subscriptions = collection('subscriptions');
    const existing = subscriptions.find({ userId: numericId(userId) }).value();
    const updated = {
      userId: numericId(userId),
      planCode: plan.code,
      planName: plan.name,
      interval: interval || plan.interval,
      priceCents: plan.priceCents,
      currency: plan.currency,
      status: 'ACTIVE',
      currentPeriodEnd: '2026-12-31'
    };
    if (existing) {
      subscriptions.find({ userId: numericId(userId) }).assign(updated).write();
    } else {
      subscriptions.push(updated).write();
    }
  }
  // Mock-only: approves the checkout instantly and points straight back at the
  // dashboard instead of a real MercadoPago redirect round-trip. Revisit once
  // the real gateway contract is defined.
  res.status(201).json({ preferenceId: `mock-${Date.now()}`, checkoutUrl: '/dashboard' });
});
// Mock user endpoints
app.get('/api/v1/users/:id/sessions', (req, res) => {
  const userId = numericId(req.params.id);
  res.json(collection('sessions').filter({ userId }).value());
});

app.delete('/api/v1/users/:id/sessions/:sessionId', (req, res) => {
  const userId = numericId(req.params.id);
  const sessionId = numericId(req.params.sessionId);
  collection('sessions').remove({ id: sessionId, userId }).write();
  res.status(204).end();
});

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
