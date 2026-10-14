// In-browser mock backend. Enabled only when VITE_USE_MOCK=true (see main.tsx).
// Intercepts every fetch to VITE_API_BASE_URL and serves in-memory data shaped like the real
// mirai-backend responses, so the admin panel can be explored without a backend or database.
import api from '../services/api';

export const MOCK_CREDENTIALS = { email: 'admin@mira.ai', password: 'admin123' };

type Doc = Record<string, unknown>;
type Body = Record<string, unknown> | undefined;
type Result = { status: number; body: Doc };

const DAY = 86400000;
const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * DAY).toISOString();
let seq = 1000;
const newId = () => `mock${++seq}`;

const adminUser = {
  id: 'admin1',
  _id: 'admin1',
  name: 'Mock Admin',
  fullName: 'Mock Admin',
  email: MOCK_CREDENTIALS.email,
  role: 'superadmin',
  isActive: true,
  lastLoginAt: new Date().toISOString(),
};

const names = ['Aarav Sharma', 'Priya Verma', 'Rohan Gupta', 'Ananya Singh', 'Vikram Rao', 'Sneha Iyer', 'Karan Mehta', 'Isha Patel', 'Arjun Nair', 'Meera Joshi', 'Dev Malhotra', 'Riya Kapoor'];
const toEmail = (n: string) => n.toLowerCase().replace(' ', '.') + '@example.com';
const brief = (i: number) => ({ _id: `u${i + 1}`, id: `u${i + 1}`, name: names[i], email: toEmail(names[i]), phone: '' });

const withIds = (d: Doc, id: string) => ({ ...d, _id: id, id });

const db: Record<'users' | 'plans' | 'banners' | 'faq' | 'cms' | 'feedback' | 'support' | 'orders' | 'leads', Doc[]> = {
  leads: names.slice(0, 8).map((name, i) =>
    withIds(
      {
        name,
        email: toEmail(name),
        phone: i % 3 === 2 ? '' : `+91 98${String(76543210 + i * 1111).slice(0, 8)}`,
        subject: ['Partnership enquiry', 'Pricing for a family plan', 'Kundli matching question', 'App not loading', 'Media / press request'][i % 5],
        message: `Hello MIRAI team,\n\nThis is a mock website lead #${i + 1} for local testing. Please get back to me when you can.\n\nThanks,\n${name}`,
        source: 'website',
        page: '/contact',
        referrer: i % 2 ? 'https://www.google.com/' : '',
        status: ['new', 'new', 'contacted', 'qualified', 'converted', 'closed'][i % 6],
        notes: i % 6 === 2 ? 'Called once, follow up next week.' : '',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (mock)',
        createdAt: new Date(now - (i * 7 + 1) * 3600000).toISOString(),
        updatedAt: new Date(now - (i * 7 + 1) * 3600000).toISOString(),
      },
      `l${i + 1}`,
    ),
  ),
  users: names.map((name, i) =>
    withIds(
      {
        fullName: name,
        name,
        email: toEmail(name),
        gender: i % 2 ? 'female' : 'male',
        isProfileComplete: i % 4 !== 3,
        walletBalance: (i * 137) % 900,
        isActive: i % 5 !== 4,
        status: i % 5 !== 4 ? 'Active' : 'Inactive',
        createdAt: daysAgo(i * 2 + 1),
      },
      `u${i + 1}`,
    ),
  ),
  plans: [
    { title: 'Starter Pack', questionCount: 3, price: 99, originalPrice: 149, validityText: 'Valid for 3 days', sortOrder: 1, isActive: true, createdAt: daysAgo(40) },
    { title: 'Value Pack', questionCount: 10, price: 299, originalPrice: 399, validityText: 'Valid for 7 days', sortOrder: 2, isActive: true, createdAt: daysAgo(30) },
    { title: 'Pro Pack', questionCount: 25, price: 649, originalPrice: 649, validityText: 'Valid for 30 days', sortOrder: 3, isActive: false, createdAt: daysAgo(12) },
  ].map((p, i) => withIds(p, `p${i + 1}`)),
  banners: [
    { title: 'Know Your Stars', subtitle: 'Kundli, Panchang & Daily Horoscope', buttonText: 'View Today', imageUrl: 'https://picsum.photos/seed/mira0/800/300', link: 'Horoscope', isActive: true, order: 0 },
    { title: 'Diwali Offer – 50% Off', subtitle: '', buttonText: 'View Today', imageUrl: 'https://picsum.photos/seed/mira1/800/300', link: 'https://example.com/diwali', isActive: true, order: 1 },
    { title: 'New Kundli Report', subtitle: '', buttonText: 'View Today', imageUrl: 'https://picsum.photos/seed/mira2/800/300', link: 'https://example.com/kundli', isActive: true, order: 2 },
    { title: 'Refer & Earn', subtitle: '', buttonText: 'View Today', imageUrl: 'https://picsum.photos/seed/mira3/800/300', link: '', isActive: false, order: 3 },
  ].map((b, i) => withIds(b, `b${i + 1}`)),
  faq: [
    { question: 'How do I ask a question?', answer: 'Open the app, choose a plan and type your question in the chat.', order: 1, isActive: true },
    { question: 'Is my data private?', answer: 'Yes. Your birth details and chats are encrypted and never shared.', order: 2, isActive: true },
    { question: 'How do refunds work?', answer: 'Unused questions can be refunded within 7 days of purchase.', order: 3, isActive: false },
  ].map((f, i) => withIds(f, `f${i + 1}`)),
  cms: [
    { type: 'terms', title: 'Terms & Conditions', content: '<h2>Terms & Conditions</h2><p>These are mock terms for local testing.</p>', isActive: true, updatedAt: daysAgo(5) },
    { type: 'privacy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>This is a mock privacy policy.</p>', isActive: true, updatedAt: daysAgo(9) },
    { type: 'about', title: 'About MIRA AI', content: '<h2>About MIRA AI</h2><p>MIRA AI is an AI astrology assistant.</p>', isActive: true, updatedAt: daysAgo(20) },
  ].map((c, i) => withIds(c, `c${i + 1}`)),
  feedback: names.slice(0, 9).map((_, i) =>
    withIds(
      {
        user: brief(i),
        userId: `u${i + 1}`,
        rating: (i % 5) + 1,
        message: ['Loved the predictions!', 'App is a bit slow sometimes.', 'Very accurate reading.', 'Please add Hindi voice.', 'Great support team.'][i % 5],
        createdAt: daysAgo(i * 3 + 1),
      },
      `fb${i + 1}`,
    ),
  ),
  support: names.slice(0, 7).map((_, i) =>
    withIds(
      {
        ticketNumber: `TKT-${String(i + 1).padStart(6, '0')}`,
        user: brief(i),
        userId: `u${i + 1}`,
        subject: ['Payment deducted but no questions', 'Cannot log in with OTP', 'Wrong birth time saved', 'Refund request', 'App crashes on chat'][i % 5],
        description: 'This is a mock support ticket description for local testing.',
        category: 'other',
        status: ['open', 'in-progress', 'resolved', 'closed'][i % 4],
        priority: ['low', 'medium', 'high', 'urgent'][i % 4],
        adminResponse: '',
        createdAt: daysAgo(i * 2),
      },
      `s${i + 1}`,
    ),
  ),
  orders: names.slice(0, 10).map((name, i) =>
    withIds(
      {
        userId: { id: `u${i + 1}`, _id: `u${i + 1}`, fullName: name, email: toEmail(name) },
        amount: [99, 299, 649][i % 3],
        type: i % 2 ? 'debit' : 'credit',
        purpose: i % 2 ? 'chat' : 'recharge',
        title: i % 2 ? 'Chat message' : 'Wallet Recharge',
        description: 'Mock transaction',
        paymentMethod: ['UPI', 'Card', 'Wallet'][i % 3],
        status: 'success',
        transactionDate: daysAgo(i * 2 + 1),
        createdAt: daysAgo(i * 2 + 1),
        updatedAt: daysAgo(i * 2 + 1),
      },
      `o${i + 1}`,
    ),
  ),
};

const ok = (data: unknown, message = 'OK', status = 200): Result => ({ status, body: { success: true, statusCode: status, message, data } });
const fail = (status: number, message: string): Result => ({ status, body: { success: false, statusCode: status, message } });

function paginate<T>(list: T[], params: URLSearchParams) {
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 10);
  const total = list.length;
  const totalPages = Math.ceil(total / limit);
  return {
    items: list.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
    totalPages,
    pagination: { page, limit, total, totalPages },
  };
}

/** Generic CRUD; `wrap` puts the item under a key (e.g. `{ banner }`) like the real API. */
function crud(list: Doc[], method: string, id: string | undefined, body: Body, wrap?: string): Result | null {
  const out = (item: Doc, message: string, status = 200) => ok(wrap ? { [wrap]: item } : item, message, status);
  if (!id) {
    if (method === 'POST') {
      const item = withIds({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body }, newId());
      list.push(item);
      return out(item, 'Created', 201);
    }
    return null;
  }
  const idx = list.findIndex((x) => x._id === id);
  if (idx === -1) return fail(404, 'Not found');
  if (method === 'GET') return out(list[idx], 'OK');
  if (method === 'PUT' || method === 'PATCH') {
    list[idx] = { ...list[idx], ...body, updatedAt: new Date().toISOString() };
    return out(list[idx], 'Updated');
  }
  if (method === 'DELETE') {
    list.splice(idx, 1);
    return ok(undefined, 'Deleted');
  }
  return null;
}

function series(days: number, value: (i: number) => number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    return { date: d, value: value(i) };
  });
}

function stats() {
  const total = db.users.length;
  const active = db.users.filter((u) => u.isActive !== false).length;
  const growth = series(30, (i) => (i * 7) % 3);
  const revenue = series(30, (i) => ((i * 13) % 5) * 99);
  const rev30 = revenue.reduce((s, r) => s + r.value, 0);
  return {
    totalUsers: total,
    activeUsers: active,
    profileCompleteUsers: db.users.filter((u) => u.isProfileComplete).length,
    activePercentage: Math.round((active / total) * 10000) / 100,
    inactiveUsers: total - active,
    newUsersToday: 1,
    newUsersLast7Days: 4,
    newUsersLast30Days: growth.reduce((s, g) => s + g.value, 0),
    activeSessions24h: 7,
    dailyActiveUsers: 5,
    monthlyActiveUsers: 10,
    userGrowth: growth.map((g) => ({ date: g.date, count: g.value })),
    revenue: {
      currency: 'INR',
      total: rev30 + 2500,
      today: revenue[29].value,
      last30Days: rev30,
      transactions: 42,
      daily: revenue.map((r) => ({ date: r.date, amount: r.value })),
    },
  };
}

function route(method: string, path: string, params: URLSearchParams, body: Body): Result | null {
  const [, a, b, c, d] = path.split('/'); // e.g. /admin/banners/b1 -> admin, banners, b1

  if (path === '/admin/login' && method === 'POST') {
    if (body?.email === MOCK_CREDENTIALS.email && body?.password === MOCK_CREDENTIALS.password) {
      return ok({ token: 'mock-token', accessToken: 'mock-token', user: adminUser, admin: adminUser }, 'Login successful');
    }
    return fail(400, `Invalid credentials (mock mode: use ${MOCK_CREDENTIALS.email} / ${MOCK_CREDENTIALS.password})`);
  }
  if (path === '/admin/forgot-password' && method === 'POST') return ok(undefined, 'OTP sent (mock OTP: 123456)');
  if (path === '/admin/verify-otp' && method === 'POST') {
    return body?.otp === '123456' ? ok({ verified: true }, 'OTP verified') : fail(400, 'Invalid OTP (mock OTP is 123456)');
  }
  if (path === '/admin/reset-password' && method === 'POST') return ok(undefined, 'Password reset (mock mode does not change it)');
  if (path === '/admin/profile') return ok({ admin: adminUser, user: adminUser });
  if (path === '/admin/dashboard/stats') return ok(stats());

  if (a !== 'admin') return null;

  switch (b) {
    case 'users':
      if (c === 'test-notification' || d === 'test-notification' || c === 'broadcast-notification') {
        return fail(503, 'Push notifications are not configured on the server (mock mode).');
      }
      if (!c && method === 'GET') return ok({ users: db.users, total: db.users.length });
      if (c && (method === 'PATCH' || method === 'PUT') && body) {
        const patch: Doc = { ...body };
        if (typeof body.fullName === 'string') patch.name = body.fullName;
        if (typeof body.isActive === 'boolean') patch.status = body.isActive ? 'Active' : 'Inactive';
        return crud(db.users, method, c, patch, 'user');
      }
      if (c && method === 'DELETE') {
        const r = crud(db.users, method, c, body);
        return r && r.status === 200 ? ok({ deleted: { sessions: 0 } }, 'Deleted') : r;
      }
      return crud(db.users, method, c, body, 'user');
    case 'plans':
      if (!c && method === 'GET') {
        const plans = [...db.plans].sort((x, y) => Number(x.sortOrder ?? 0) - Number(y.sortOrder ?? 0));
        return ok({ plans, total: plans.length, page: 1, totalPages: 1 });
      }
      return crud(db.plans, method, c, body, 'plan');
    case 'banners':
      if (!c && method === 'GET') {
        const banners = [...db.banners].sort((x, y) => Number(x.order) - Number(y.order));
        return ok({ banners, total: banners.length });
      }
      return crud(db.banners, method, c, body, 'banner');
    case 'faq':
      if (!c && method === 'GET') return ok([...db.faq].sort((x, y) => Number(x.order) - Number(y.order)));
      return crud(db.faq, method, c, body);
    case 'cms':
      if (!c && method === 'GET') return ok(db.cms);
      if (!c && method === 'POST') {
        const existing = db.cms.find((x) => x.type === body?.type);
        if (existing) return crud(db.cms, 'PUT', String(existing._id), body);
      }
      return crud(db.cms, method, c, body);
    case 'feedback': {
      const rating = Number(params.get('rating') ?? 0);
      const q = (params.get('search') ?? '').toLowerCase();
      const list = db.feedback.filter(
        (f) =>
          (!rating || f.rating === rating) &&
          (!q || JSON.stringify([(f.user as Doc).name, (f.user as Doc).email, f.message]).toLowerCase().includes(q)),
      );
      const p = paginate(list, params);
      const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      db.feedback.forEach((f) => (distribution[String(f.rating)] += 1));
      const sum = db.feedback.reduce((s, f) => s + Number(f.rating), 0);
      return ok({
        feedback: p.items,
        total: p.total,
        page: p.page,
        limit: p.limit,
        totalPages: p.totalPages,
        pagination: p.pagination,
        stats: { totalRatings: db.feedback.length, averageRating: Math.round((sum / db.feedback.length) * 10) / 10, distribution },
      });
    }
    case 'support': {
      if (c) return crud(db.support, method, c, body);
      const q = (params.get('search') ?? '').toLowerCase();
      const filtered = db.support.filter(
        (t) =>
          (!params.get('status') || t.status === params.get('status')) &&
          (!params.get('priority') || t.priority === params.get('priority')) &&
          (!q || JSON.stringify([(t.user as Doc).name, t.subject, t.description, t.ticketNumber]).toLowerCase().includes(q)),
      );
      const p = paginate(filtered, params);
      const stat: Record<string, number> = { open: 0, 'in-progress': 0, resolved: 0, closed: 0, total: db.support.length };
      db.support.forEach((t) => (stat[String(t.status)] += 1));
      return ok({ tickets: p.items, total: p.total, page: p.page, limit: p.limit, totalPages: p.totalPages, pagination: p.pagination, stats: stat });
    }
    case 'leads': {
      if (c) {
        if (method === 'GET' || method === 'PATCH' || method === 'PUT') {
          const patch = body ? { ...(body.status ? { status: body.status } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}) } : body;
          return crud(db.leads, method, c, patch, 'lead');
        }
        return crud(db.leads, method, c, body);
      }
      const q = (params.get('search') ?? '').toLowerCase();
      const filtered = db.leads.filter(
        (l) =>
          (!params.get('status') || l.status === params.get('status')) &&
          (!q || JSON.stringify([l.name, l.email, l.phone, l.subject]).toLowerCase().includes(q)),
      );
      const p = paginate(filtered, params);
      const stat: Record<string, number> = { new: 0, contacted: 0, qualified: 0, converted: 0, closed: 0, total: db.leads.length };
      db.leads.forEach((l) => (stat[String(l.status)] += 1));
      return ok({ leads: p.items, total: p.total, page: p.page, limit: p.limit, totalPages: p.totalPages, pagination: p.pagination, stats: stat });
    }
    case 'transactions': {
      if (c) {
        const item = db.orders.find((o) => o._id === c);
        return item ? ok({ transaction: item, order: item }) : fail(404, 'Transaction not found');
      }
      const p = paginate(db.orders, params);
      const sumBy = (purpose: string) => db.orders.filter((o) => o.purpose === purpose).reduce((s, o) => s + Number(o.amount), 0);
      return ok({
        orders: p.items,
        total: p.total,
        page: p.page,
        limit: p.limit,
        totalPages: p.totalPages,
        pagination: p.pagination,
        summary: {
          totalRevenue: sumBy('recharge'),
          totalRecharges: db.orders.filter((o) => o.purpose === 'recharge').length,
          totalSpent: sumBy('chat'),
          totalDebits: db.orders.filter((o) => o.type === 'debit').length,
          todayRevenue: 0,
          todayRecharges: 0,
          currencySymbol: '₹',
        },
      });
    }
  }
  return null;
}

export function installMockApi() {
  const base = new URL(String(import.meta.env.VITE_API_BASE_URL || '/api/v1'), window.location.origin).href.replace(/\/$/, '');
  const realFetch = window.fetch.bind(window);

  // Route axios through fetch too, so one interceptor covers axios and RTK Query.
  api.defaults.adapter = 'fetch';

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    if (!req.url.startsWith(base)) return realFetch(input, init);

    const url = new URL(req.url);
    const path = url.pathname.slice(new URL(base).pathname.length) || '/';

    let result: Result | null;
    if (path === '/media/upload' && req.method === 'POST') {
      // Keep uploads in the browser: object URLs work for previews during the session.
      const form = await req.formData();
      const files = form.getAll('images').filter((f): f is File => f instanceof File);
      const stored = files.map((f) => { const u = URL.createObjectURL(f); return { url: u, path: u, key: f.name, originalName: f.name, mimeType: f.type, size: f.size, storage: 'mock' }; });
      result = files.length
        ? ok({ urls: stored.map((s) => s.url), paths: stored.map((s) => s.path), files: stored }, 'Uploaded', 201)
        : fail(400, 'No files uploaded (field "images")');
    } else {
      const text = await req.text();
      let body: Body;
      try {
        body = text ? (JSON.parse(text) as Body) : undefined;
      } catch {
        body = undefined;
      }
      result = route(req.method, path, url.searchParams, body);
    }
    result ??= fail(404, `Mock route not found: ${req.method} ${path}`);
    console.info(`[mock] ${req.method} ${path} → ${result.status}`);
    await new Promise((r) => setTimeout(r, 200)); // simulate network latency
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  console.info(`[mock] Mock API enabled. Login: ${MOCK_CREDENTIALS.email} / ${MOCK_CREDENTIALS.password}`);
}
