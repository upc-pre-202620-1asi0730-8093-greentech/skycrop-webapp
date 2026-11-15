# Workspace views

## Design references

The desktop reference is the SkyCrop Figma file `1nlenowk3dSY0qdNiG6hYD`, page `5:2`:

- Sign in: `85:266`.
- Subscription details and payment: `85:279`.
- Home and navigation: `85:304`.

The report sections 4.1 and 4.4 define the visual guidelines. Existing Vue, PrimeVue,
Pinia and i18n conventions are retained. Roboto is served locally under the SIL
Open Font License in `public/fonts/OFL.txt`. Existing branding is reused.

Profile, preferences, recovery, registration, notification inbox and plot members
extend the existing cards, palette, spacing and responsive navigation because the
reviewed Figma page has no separate designs for these views. Payment retains the
two-column composition but replaces bank fields with a sample outcome selector.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Mock account access |
| `/register` | Sample account registration |
| `/recover-access` | Mock recovery challenge |
| `/verify-access` | Mock recovery or second-factor code |
| `/home` | Identity greeting, plots, recent diagnoses and quick actions |
| `/profiles` (alias `/profile`) | Name and optional contact details |
| `/settings` | Language, email preference and mock second-factor preference |
| `/subscriptions` | Plan catalogue, current subscription and payment history |
| `/subscriptions/checkout/:planId` | Payment demonstration |
| `/subscriptions/payments/:paymentId` | Recorded payment result |
| `/notifications` | Account notification inbox |
| `/plot-members` | Plot selection, members and invitations |
| `/plots/:id/members` | Members for a selected plot |

Existing plot, crop, drone, diagnosis and report routes remain available. The named
`crops` destination now resolves its `id` into the `crop-list` route correctly.
Protected navigation returns to the originally requested local path after sign-in.
Vercel's existing SPA rewrite supports direct links and reloads. Unknown routes
render the existing not-found screen.

## Mock API contract

`CollectionApi` uses the existing `VITE_SKYCROP_API_URL`; no API environment values
are changed. No sample data is automatically inserted. The published collections
were read during investigation and contained no accounts, plans or subscriptions.
Empty catalogues therefore render an empty state rather than a fabricated price.

| Collection | Fields written by the new views |
| --- | --- |
| `users` | `name`, normalized `email`, `passwordDigest`, `createdAt`, optional `twoFactorEnabled` |
| `userProfiles` | `userId`, `phone`, `occupation`, `language`, `emailNotifications` |
| `subscriptions` | `userId`, `planId`, `planName`, `status`, `startedAt`, `expiresAt`, `simulated`, optional `cancelledAt` |
| `payments` | `userId`, `subscriptionId`, `planId`, `amount`, `currency`, `status`, `createdAt`, `simulated` |
| `plotInvitations` | `plotId`, normalized `email`, `role`, `invitedBy`, `status`, `createdAt`, `simulated` |
| `notifications` | Existing records are read; `read` and `readAt` are patched |

Plans must supply `id`, `name`, a numeric `price` (or `monthlyCost`), optional ISO
`currency` (default `PEN`) and a `features` string array. Invalid prices block
checkout. Notifications are filtered by `userId`; related entity IDs determine
local links. Plot membership is read from `plotUsers`. Legacy ownerless plots
remain part of the shared demonstration workspace. Invitations are recorded and
revocable; acceptance and granting permissions require backend integration.

The new profile collection is deliberately separate from the public identity
projection exposed by the session. Only allowlisted fields are submitted.

## Demonstration boundaries

JSON Server exposes public CRUD collections. It cannot authenticate requests,
authorize access, deliver private codes or email, process bank cards, enforce
uniqueness or commit related resources atomically. Route guards and UI account
filtering are navigation conveniences, not security controls.

Only sample identity data and disposable passwords should be entered. Passwords
are never stored as plaintext: the mock identity adapter derives a salted
PBKDF2-SHA256 digest with 210,000 iterations through Web Crypto. Public digests
are still unsuitable as a production identity service. A non-sensitive identity
projection is stored in sessionStorage for eight hours; no token is invented.

Recovery and second-factor codes exist only in application memory, are displayed
on the verification screen, expire after five minutes and allow five
attempts. Reloading discards a pending challenge. Recovery of an unknown account
uses the same visible flow and does not update a user. No email is sent. These
flows must be replaced with server-issued private challenges and real access
tokens when the IAM backend becomes available.

Payments have explicit APPROVED, DECLINED and PENDING demonstration outcomes. No
card number, CVV or bank credential is collected or persisted. A subscription is
first stored as PENDING; only an approved recorded payment can activate it.
Cancellation requires confirmation and changes its status. Partial transport
failures can leave pending resources; JSON Server provides no transactional or
concurrency guarantees. A real payment provider, webhook reconciliation and
idempotency belong in the backend integration.

No automatic push alerts, renewal scheduler, email receipts or hardware failure
events are claimed by these screens. The notification inbox displays records
provided by the mock API; those event integrations remain backend responsibilities.

## Validation

```sh
npm ci
npm run build
```

## Interface copy

Development and demonstration banners are omitted from application views.
Operational feedback, code validity, errors and data-source indicators remain.
Payment controls describe recording a payment status; they do not claim to
process a bank charge. The mock limitations above remain unchanged.
