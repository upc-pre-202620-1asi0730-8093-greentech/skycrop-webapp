import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EmailAddress} from '../src/iam/domain/model/email-address.js';
import {sessionRedirect, safeReturnPath} from '../src/iam/domain/model/navigation-policy.js';
import {createPasswordDigest, verifyPassword} from '../src/iam/infrastructure/password-digest.js';
import {SubscriptionPlan, renewalDate, isActiveSubscription} from '../src/subscriptions/domain/model/subscription-plan.js';
import {notificationLink} from '../src/notifications/domain/model/notification-link.js';

test('email normalization prevents case and whitespace variants in account and invitation checks', () => {
  assert.equal(new EmailAddress('  Member@Example.test ').value, 'member@example.test');
  assert.throws(() => new EmailAddress('member@'));
  assert.throws(() => new EmailAddress('member @example.test'));
  assert.ok(Object.isFrozen(new EmailAddress('member@example.test')));
});

test('post-login destinations stay inside the application and do not loop through guest views', () => {
  for (const path of ['https://example.test', '//example.test', '/\\example.test', '/login', '/recover-access?x=1', null]) assert.equal(safeReturnPath(path), '/home');
  assert.equal(safeReturnPath('/plots/3/crops?search=corn'), '/plots/3/crops?search=corn');
  assert.deepEqual(sessionRedirect({meta: {}, fullPath: '/reports/3'}, false), {name: 'login', query: {redirect: '/reports/3'}});
  assert.equal(sessionRedirect({meta: {public: true}, fullPath: '/login'}, false), true);
});

test('prototype credentials use independent salts and verify without storing plaintext', async () => {
  const first = await createPasswordDigest('sample-password'), second = await createPasswordDigest('sample-password');
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.digest, second.digest);
  assert.equal(await verifyPassword('sample-password', first), true);
  assert.equal(await verifyPassword('incorrect-password', first), false);
  assert.equal(await verifyPassword('sample-password', {password: 'sample-password'}), false);
});

test('missing or invalid catalogue prices cannot silently produce free checkout', () => {
  for (const price of [null, undefined, '', -1, Infinity, 'invalid']) assert.throws(() => new SubscriptionPlan({id: 1, name: 'Basic', price}));
  const plan = new SubscriptionPlan({id: 1, name: 'Basic', monthlyCost: 30, features: ['Five plots']});
  assert.equal(plan.price, 30);
  assert.equal(plan.currency, 'PEN');
  assert.ok(Object.isFrozen(plan.features));
});

test('renewal clamps month ends and only unexpired active records grant prototype benefits', () => {
  assert.equal(renewalDate('2026-01-31T12:00:00Z'), '2026-02-28T12:00:00.000Z');
  assert.equal(renewalDate('2028-01-31T12:00:00Z'), '2028-02-29T12:00:00.000Z');
  const expiresAt = '2026-12-01T00:00:00Z', now = Date.parse('2026-11-01T00:00:00Z');
  assert.equal(isActiveSubscription({status: 'ACTIVE', expiresAt}, now), true);
  for (const status of ['PENDING', 'CANCELLED', 'DECLINED']) assert.equal(isActiveSubscription({status, expiresAt}, now), false);
  assert.equal(isActiveSubscription({status: 'ACTIVE', expiresAt}, Date.parse(expiresAt)), false);
});

test('notification actions derive local routes rather than trusting resource URLs', () => {
  assert.equal(notificationLink({url: 'https://example.test'}), null);
  assert.equal(notificationLink({diagnosisId: 'a/b'}), '/diagnoses/a%2Fb');
  assert.equal(notificationLink({subscriptionId: 1}), '/subscriptions');
});

test('plot member management distinguishes owners, administrators and read-only members', async () => {
  const {canManagePlotMembers} = await import('../src/plots/domain/model/plot-membership-policy.js');
  const plot = {id: 1, ownerId: 'owner'};
  assert.equal(canManagePlotMembers(plot, [], 'owner'), true);
  assert.equal(canManagePlotMembers(plot, [{plotId: 1, userId: 'member', role: 'VIEWER'}], 'member'), false);
  assert.equal(canManagePlotMembers(plot, [{plotId: 1, userId: 'admin', role: 'ADMIN'}], 'admin'), true);
  assert.equal(canManagePlotMembers(plot, [], 'outsider'), false);
  assert.equal(canManagePlotMembers({id: 2}, [], 'sample-user'), true);
});
