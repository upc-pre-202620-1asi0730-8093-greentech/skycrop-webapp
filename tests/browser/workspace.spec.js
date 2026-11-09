import {test, expect} from '@playwright/test';

const pageErrors = new WeakMap();
test.beforeEach(async ({page}) => {
  const errors = []; pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(async ({page}) => { expect(pageErrors.get(page)).toEqual([]); });

/** Every API request is intercepted; these checks never mutate the published mock. */
async function mockWorkspace(page, {plans = [], notifications = []} = {}) {
  const database = Object.fromEntries(['users', 'accounts', 'userProfiles', 'subscriptionPlans', 'subscriptions', 'payments', 'notifications', 'plots', 'plotUsers', 'plotInvitations', 'crops', 'drones', 'flights', 'diagnoses', 'reports', 'anomalies'].map(key => [key, []]));
  database.subscriptionPlans = plans;
  database.notifications = notifications;
  database.plots = [{id: 'plot-1', name: 'Sample plot', location: 'Lima', areaHectares: 5, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z'}];
  const requests = [];
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const [collection, id] = url.pathname.split('/api/v1/')[1].split('/');
    requests.push({collection, method: request.method(), body: request.postDataJSON()});
    if (!database[collection]) return route.fulfill({status: 404, json: {}});
    let status = 200, result;
    if (request.method() === 'GET') {
      result = id ? database[collection].find(item => String(item.id) === id)
        : database[collection].filter(item => [...url.searchParams].every(([key, value]) => String(item[key]) === value));
      if (!result) { status = 404; result = {}; }
    } else if (request.method() === 'POST') {
      result = {...request.postDataJSON(), id: `${collection}-${database[collection].length + 1}`};
      database[collection].push(result); status = 201;
    } else if (request.method() === 'PATCH') {
      const target = database[collection].find(item => String(item.id) === id);
      if (!target) { status = 404; result = {}; }
      else { Object.assign(target, request.postDataJSON()); result = target; }
    } else { status = 405; result = {}; }
    await route.fulfill({status, json: result});
  });
  // Any unexpected external request must fail locally rather than contacting a live collection.
  await page.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/, route => {
    if (route.request().url().includes('/api/v1/')) return route.fallback();
    return route.abort();
  });
  return {database, requests};
}

async function register(page) {
  await page.goto('/register');
  await page.getByLabel('Full name', {exact: true}).fill('Sample Member');
  await page.getByLabel('Email', {exact: true}).fill('member@example.test');
  await page.getByLabel('Password', {exact: true}).fill('sample-password');
  await page.getByLabel('Confirm password', {exact: true}).fill('sample-password');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', {name: 'Welcome, Sample Member'})).toBeVisible();
}

async function logout(page) {
  await page.getByRole('button', {name: 'Sign out'}).click();
  await expect(page).toHaveURL('/login');
}

async function signIn(page, password = 'sample-password') {
  await page.getByLabel('Email', {exact: true}).fill('member@example.test');
  await page.getByLabel('Password', {exact: true}).fill(password);
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
}

async function enterChallenge(page) {
  const codeText = await page.getByText(/Verification code:/).textContent();
  await page.getByLabel('Verification code', {exact: true}).fill(codeText.match(/\d{6}/)[0]);
}

test('registration, reload, routing, profile updates, locale and logout work without browser errors', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const {database} = await mockWorkspace(page);
  await page.goto('/plots/plot-1/crops');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await register(page);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Welcome, Sample Member'})).toBeVisible();
  await page.goto('/profiles');
  await page.getByLabel('Full name').fill('Updated Member');
  await page.getByLabel('Phone (optional)').fill('900000000');
  await page.getByRole('button', {name: 'Save changes'}).click();
  await expect(page.getByText('Changes saved.', {exact: true})).toBeVisible();
  expect(database.users[0].name).toBe('Updated Member');
  expect(JSON.stringify(database.users[0])).not.toContain('sample-password');
  await page.evaluate(async () => { const {default: router} = await import('/src/router.js'); await router.push({name: 'crops', params: {id: 'plot-1'}}); });
  await expect(page).toHaveURL('/plots/plot-1/crops');
  await expect(page.getByRole('heading', {name: 'Registered Crops'})).toBeVisible();
  await page.goto('/settings');
  await page.getByLabel('Email notification preference').check();
  await page.getByRole('button', {name: 'Save changes'}).click();
  await expect(page.getByText('Changes saved.', {exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'ES', exact: true}).click();
  await expect(page.getByRole('heading', {name: 'Configuración', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'EN', exact: true}).click();
  await logout(page);
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(errors).toEqual([]);
});

test('recovery and two-step verification use expiring demo challenges and reject incorrect input', async ({page}) => {
  await mockWorkspace(page); await register(page);
  await page.goto('/settings');
  await page.getByLabel('Two-step verification').check();
  await page.getByRole('button', {name: 'Save changes'}).click();
  await expect(page.getByText('Changes saved.', {exact: true})).toBeVisible();
  await logout(page); await signIn(page);
  await expect(page).toHaveURL(/\/verify-access/);
  const displayed = await page.getByText(/Verification code:/).textContent();
  const invalidCode = displayed.includes('000000') ? '111111' : '000000';
  await page.getByLabel('Verification code').fill(invalidCode);
  await page.getByRole('button', {name: 'Verify code'}).click();
  await expect(page.getByRole('alert')).toContainText('Incorrect code');
  await enterChallenge(page);
  await page.getByRole('button', {name: 'Verify code'}).click();
  await expect(page).toHaveURL('/home');
  await logout(page);
  await page.getByRole('link', {name: 'Recover access'}).click();
  await page.getByLabel('Email', {exact: true}).fill('member@example.test');
  await page.getByRole('button', {name: 'Continue', exact: true}).click();
  await enterChallenge(page);
  await page.getByLabel('Password', {exact: true}).fill('replacement-password');
  await page.getByLabel('Confirm password').fill('replacement-password');
  await page.getByRole('button', {name: 'Verify code'}).click();
  await expect(page).toHaveURL(/\/login\?reset=1/);
  await signIn(page, 'replacement-password'); await enterChallenge(page);
  await page.getByRole('button', {name: 'Verify code'}).click();
  await expect(page).toHaveURL('/home');
});

test('empty catalogues, unavailable plans and failed loads show recoverable states', async ({page}) => {
  await mockWorkspace(page); await register(page);
  await page.goto('/subscriptions');
  await expect(page.getByText('No subscription plans are available yet. Try again later.')).toBeVisible();
  await page.goto('/subscriptions/checkout/missing');
  await expect(page.getByText('The selected plan is unavailable.')).toBeVisible();
  await page.route('**/api/v1/userProfiles*', route => route.fulfill({status: 503, json: {}}));
  await page.goto('/profiles');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Try again'})).toBeVisible();
  await expect(page.getByLabel('Full name')).toHaveCount(0);
  await page.goto('/notifications');
  await expect(page.getByText('No notifications to display.')).toBeVisible();
  await page.goto('/missing-screen');
  await expect(page.getByRole('heading', {name: 'Page not found'})).toBeVisible();
});

test('approved, declined and pending mock payments and cancellation preserve status boundaries', async ({page}) => {
  const {database, requests} = await mockWorkspace(page, {plans: [{id: 'basic', name: 'Basic subscription', price: 30, currency: 'PEN', features: ['Five plots']}]});
  await register(page);
  for (const status of ['DECLINED', 'PENDING', 'APPROVED']) {
    await page.goto('/subscriptions/checkout/basic');
    await page.getByRole('combobox').click();
    await page.getByRole('option', {name: `${status.charAt(0)}${status.slice(1).toLowerCase()}`, exact: true}).click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', {name: 'Record payment'}).click();
    await expect(page).toHaveURL(/\/subscriptions\/payments\//);
    await expect(page.getByRole('heading', {name: new RegExp(status.charAt(0) + status.slice(1).toLowerCase())})).toBeVisible();
    expect(database.payments.at(-1).status).toBe(status);
    expect(database.subscriptions.at(-1).status).toBe(status === 'APPROVED' ? 'ACTIVE' : status === 'DECLINED' ? 'CANCELLED' : 'PENDING');
  }
  await page.goto('/subscriptions');
  await page.getByRole('button', {name: 'Cancel subscription', exact: true}).click();
  await page.getByRole('button', {name: 'Keep subscription'}).click();
  expect(database.subscriptions.at(-1).status).toBe('ACTIVE');
  await page.getByRole('button', {name: 'Cancel subscription', exact: true}).click();
  await page.getByRole('group', {name: 'Cancel subscription'}).getByRole('button', {name: 'Cancel subscription', exact: true}).click();
  await expect(page.getByText('Subscription cancelled.', {exact: true})).toBeVisible();
  expect(database.subscriptions.at(-1).status).toBe('CANCELLED');
  expect(JSON.stringify(requests.filter(item => item.collection === 'payments'))).not.toMatch(/cardNumber|cvv|password/i);
});

test('invitations avoid duplicates and notification actions stay within the application', async ({page}) => {
  const {database} = await mockWorkspace(page, {notifications: [{id: 'n1', userId: 'users-1', title: 'Report ready', message: 'Sample report', reportId: 'report-1', read: false, createdAt: '2026-11-01T00:00:00Z'}, {id: 'n2', userId: 'another-user', title: 'Other account', read: false}]});
  await register(page); await page.goto('/plot-members');
  await page.getByLabel('Email', {exact: true}).fill('guest@example.test');
  await page.getByRole('button', {name: 'Invite a member', exact: true}).click();
  await expect(page.getByText('Invitation recorded.', {exact: true})).toBeVisible();
  await page.getByLabel('Email', {exact: true}).fill('GUEST@example.test');
  await page.getByRole('button', {name: 'Invite a member', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('A pending invitation already exists');
  expect(database.plotInvitations).toHaveLength(1);
  await page.getByRole('button', {name: 'Revoke invitation'}).click();
  await expect(page.getByText('guest@example.test · Cancelled')).toBeVisible();
  await page.goto('/notifications');
  await expect(page.getByRole('heading', {name: 'Report ready'})).toBeVisible();
  await expect(page.getByText('Other account')).toHaveCount(0);
  await expect(page.getByRole('link', {name: 'View details'})).toHaveAttribute('href', '/reports/report-1');
  await page.getByRole('button', {name: 'Mark as read'}).click();
  await expect(page.getByText('Read', {exact: true})).toBeVisible();
  expect(database.notifications[0].read).toBe(true);
  await page.getByRole('button', {name: 'Unread', exact: true}).click();
  await expect(page.getByText('No notifications to display.')).toBeVisible();
});

test('new screens fit the viewport and retain labels across desktop and mobile', async ({page}, testInfo) => {
  await mockWorkspace(page); await register(page);
  for (const path of ['/profiles','/settings','/subscriptions','/notifications','/plot-members']) {
    await page.goto(path);
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, path).toBe(false);
  }
  await page.screenshot({path: testInfo.outputPath('plot-members.png'), fullPage: true});
  await logout(page);
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({width: 320, height: 740});
    await signIn(page);
    await expect(page).toHaveURL('/home');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await logout(page);
  }
  await page.screenshot({path: testInfo.outputPath('login.png'), fullPage: true});
});

test('verification rejects expired demonstration codes and cannot be resumed after reload', async ({page}) => {
  await mockWorkspace(page); await register(page); await logout(page);
  await page.clock.install();
  await page.goto('/recover-access');
  await page.getByLabel('Email', {exact: true}).fill('member@example.test');
  await page.getByRole('button', {name: 'Continue', exact: true}).click();
  await enterChallenge(page);
  await page.getByLabel('Password', {exact: true}).fill('replacement-password');
  await page.getByLabel('Confirm password').fill('replacement-password');
  await page.clock.fastForward(301000);
  await page.getByRole('button', {name: 'Verify code'}).click();
  await expect(page.getByRole('alert')).toContainText('The code has expired');
  await page.reload();
  await expect(page.getByText('No verification is pending.', {exact: false})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Verify code'})).toHaveCount(0);
});
