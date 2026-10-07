# SQA Engineer Practical QA & AI Assessment

## 1. Executive Summary

This assessment covers hands-on quality assurance of https://www.saucedemo.com/ — a public
e-commerce demo application. Work performed:

- **Exploration:** all 12 core user journeys (login, product listing, product details,
  sorting, add/remove from cart, cart, checkout, checkout validation, order completion,
  logout, session/navigation behavior) executed against the live application with
  browser-driven Playwright probes across four accounts (`standard_user`, `problem_user`,
  `error_user`, `visual_user`) in multiple fresh sessions.
- **AI-assisted exploratory testing:** 5 structured prompts covering risk-based testing,
  checkout risks, UI/UX/accessibility/responsive risks, blind-spot analysis, and defect
  triage. Every AI suggestion was validated by real execution; suggestions referencing
  features SauceDemo does not have were explicitly rejected (see §4, `AI-USAGE.md`).
- **Defect discovery:** 5 confirmed defects, each reproduced repeatedly (3–4 independent
  sessions), with screenshot evidence. Additional verified observations are listed separately and a
  single unreproduced anomaly is explicitly disclosed rather than reported as a bug.
- **Automation:** one isolated end-to-end Playwright/TypeScript test covering the complete
 purchase flow (login → product → cart → checkout → order confirmation), executed 6 times
 (headless and headed) with 6/6 passes and zero fixed waits.

No defects, screenshots, or test results in this report are assumed or fabricated; every
claim traces to an executed command in this session.

## 2. Application & Environment

| Item | Value |
|---|---|
| Application | https://www.saucedemo.com/ |
| Browser | Chromium 153.0.8010.12 (Playwright-managed) |
| OS | Microsoft Windows 11 Home Single Language |
| Framework | Playwright 1.63.0 + TypeScript 5.9.3, Node.js 20.17.0 |
| Test account | `standard_user` (primary automation) |
| Additional accounts investigated | `problem_user`, `error_user`, `visual_user` (plus login-error probes for `locked_out_user` and invalid credentials) |
| Repository | GitHub-ready local project; no remote repository created as part of this assessment |

## 3. Risk-Based Test Focus

Focus areas were prioritized by business impact × likelihood of failure:

- **Login** — the gateway to every other function; failure blocks 100% of users. Includes
  validation (empty, wrong credentials, unknown user, locked account).
- **Product selection** — the catalog (names, prices, images) drives purchase decisions;
  wrong data here propagates to revenue. Sorting is a common regression point.
- **Cart** — the transaction's working state; add/remove integrity and badge/contents
  consistency must hold before any money-path logic runs.
- **Checkout** — highest-risk flow: multi-field validation, data handling, and price
  arithmetic (subtotal/tax/total) that must reconcile exactly.
- **Order completion** — the conversion step; silent failure here loses the entire order.
  Cross-account testing (standard vs. problem/error/visual users) was chosen as the main
  exploratory axis because the application exposes distinct user profiles whose behavior
  may differ, and session/navigation behavior (reload, back button, logout, deep links)
  because state-leakage bugs are common in SPAs.

## 4. AI-Assisted Exploratory Testing

Five prompts were issued to the OpenCode AI assistant in this session. Full detail is in
`AI-USAGE.md`; summaries below.

### Prompt 1
- **Prompt:** "Act as a senior QA engineer. Analyze SauceDemo as an e-commerce application
  and identify the highest-risk user journeys, business risks, edge cases, and exploratory
  testing questions."
- **Purpose:** Establish risk-based focus.
- **AI output:** Prioritized journeys (login → catalog → cart → checkout → completion);
  flagged price/image consistency, empty-cart checkout, sorting ties, session persistence.
- **Actual validation:** All suggested journeys executed; price-consistency and
  empty-cart checks run across sessions.
- **Accepted:** price consistency → **BUG-003**; empty-cart checkout → **BUG-005**;
  image correctness → **BUG-004**; sorting/session checks → passed.
- **Rejected:** stock-decrement testing, coupon/promo edge cases.
- **Reason:** No backend inventory or promotion engine exists — accepting would mean
  inventing requirements.

### Prompt 2
- **Prompt:** "Analyze the SauceDemo checkout flow and identify validation, functional,
  usability, and data-handling risks that should be explored."
- **Purpose:** Focused checkout risk analysis.
- **AI output:** Required-field sequencing; special-char/long-input/SQL-lookalike data
  handling; tax arithmetic; empty-cart checkout; deep links; refresh mid-checkout; plus
  payment-gateway failure and email receipt verification.
- **Actual validation:** Full checkout executed with malicious/long inputs; empty-cart
  checkout run 4×; required-field messages verified in order; totals verified arithmetically.
- **Accepted:** empty-cart finding (**BUG-005**); validation and data-handling tests →
  passed (no XSS execution, no dialogs, totals reconcile).
- **Rejected:** payment gateway failure testing; email receipt verification.
- **Reason:** SauceDemo has no payment gateway step and sends no email — the AI suggestion
  does not map to the application; rejected rather than fabricated into scope.

### Prompt 3
- **Prompt:** "Analyze SauceDemo for UI/UX, accessibility, responsive behavior, and visual
  risks that are worth validating manually."
- **Purpose:** Surface visual/a11y/responsive risks.
- **AI output:** Check aria labels/roles, keyboard reachability, alt text, headings;
  375px/768px layouts for overflow/clipping; cross-account visual comparison of images and
  prices.
- **Actual validation:** DOM-level a11y audit (inputs, `role="alert"` errors, Tab-focus
  trail across product links), viewport geometry checks, cross-account image/price diffing.
- **Accepted:** cross-account visual comparison → **BUG-003** and **BUG-004**; keyboard,
  responsive, and error-announcement checks → passed.
- **Rejected:** full WCAG 2.1 AA conformance audit as a pass/fail claim.
- **Reason:** Conformance requires exhaustive audit coverage; only targeted, manually
  verified checks were performed, and the report claims no more than that.

### Prompt 4
- **Prompt:** "Review the exploratory testing areas for SauceDemo and identify gaps or
  scenarios a QA engineer might overlook."
- **Purpose:** Blind-spot detection.
- **AI output:** Reload persistence, logged-out deep links, back-button-after-logout,
  cart persistence across re-login, HTTP status correctness, console/network monitoring,
  concurrent-user cart conflicts.
- **Actual validation:** All of the first six executed with scripted probes; continuous
  console/network capture in every session (surfaced the JS errors behind **BUG-001**).
- **Accepted:** session/navigation tests → passed (no leakage); route-status check →
  low-impact observation (§5); console monitoring → defect evidence.
- **Rejected:** concurrent multi-user cart conflict testing.
- **Reason:** Cart state is client-side only; there is no shared server resource to
  conflict — the scenario cannot exist here.

### Prompt 5
- **Prompt:** "Review my observed SauceDemo behavior and tell me whether it appears to be a
  genuine defect, an intentional behavior, or something requiring further investigation."
- **Purpose:** Defect triage before reporting (7 observed behaviors submitted).
- **AI output:** Four behaviors → genuine defects; HTTP 404 on SPA routes → likely
  deliberate hosting fallback → observation only; telemetry 401/CORS → placeholder token,
  no user impact → do not report; one failed cart-removal → insufficient evidence, retest;
  empty-cart order → genuine defect.
- **Actual validation:** Each promoted defect re-reproduced 2–4× with screenshots; the
  cart-removal anomaly re-run 3× (all passed); impact analysis for 404/telemetry items.
- **Accepted:** 5 defects promoted to records (**BUG-001…005**); 404, telemetry, and the
  cart anomaly excluded.
- **Rejected:** reporting the single cart-removal failure.
- **Reason:** Occurred once, never reproduced (3/3 subsequent passes) — reporting it would
  breach the no-unconfirmed-defects rule; disclosed as an unreproduced anomaly instead.

## 5. Defect Findings

All defects reproduced in fresh sessions with the live application. Severity/priority use
the assessment's definitions (Critical = system unusable/severe data-security impact;
High = important business flow significantly broken; Medium = important functionality
incorrect with workaround; Low = minor/cosmetic).

---

### BUG-001 — Finish button does not complete the order (error_user)

| Field | Detail |
|---|---|
| **Environment** | https://www.saucedemo.com/ · Chromium 153.0.8010.12 (Playwright 1.63.0) · Windows 11 |
| **Account** | `error_user` |
| **Preconditions** | Logged in; ≥1 item in cart; on Checkout: Overview (step two) with valid customer details entered |

**Steps to reproduce:**
1. Log in as `error_user`, add Sauce Labs Backpack to cart, open cart, click Checkout.
2. Enter first name "Amol", last name "Chimadage", postal code "411001"; click Continue
   (overview opens; totals display correctly).
3. Click the **Finish** button.
4. Wait ≥5 s; observe for navigation or error feedback. Repeat the click.

**Expected result:** Navigate to `checkout-complete.html` and show "Thank you for your order!".

**Actual result:** No navigation, no visible error; the page remains on "Checkout: Overview"
with the Finish button still present. Each click throws an uncaught JS error in the console:
`La.cesetRart is not a function` (minified bundle). Reproduced in 3 sessions / 4 Finish
clicks — 100% consistent. (`standard_user` completes the same flow normally in the same
environment.)

| Field | Detail |
|---|---|
| **Severity** | **High** — the order-completion step (conversion) is completely broken for this user with zero feedback. Not Critical: other accounts complete orders; no data/security impact. |
| **Priority** | **High** — deterministic on every attempt; no workaround to place the order (Cancel only abandons). |
| **Business/user impact** | User supplies all data, reaches the final step, clicks Finish, and silently loses the order. Lost revenue, support tickets, trust damage. |
| **Evidence** | `screenshots/BUG-001-error-user-finish-stuck.png` — page still showing "Checkout: Overview" after clicking Finish. Console error text captured in session logs (quoted above). |
| **Risk reasoning** | Terminal step of the revenue flow; failure is silent (no error message), so users may retry indefinitely. Severity capped at High because the failure is account-scoped, not platform-wide. |

---

### BUG-002 — Checkout blocked for problem_user: Last name field discards input and overwrites First name

| Field | Detail |
|---|---|
| **Environment** | Same as BUG-001 |
| **Account** | `problem_user` |
| **Preconditions** | Logged in; ≥1 item in cart (added from the listing page); on Checkout: Step 1 of your information |

**Steps to reproduce:**
1. Log in as `problem_user`; add Sauce Labs Backpack from the **product listing**
   (listing add works); open cart; click Checkout.
2. Enter "Amol" in **First Name**.
3. Enter "Chimadage" in **Last Name** — then observe both fields.
4. Enter "411001" in **Zip/Postal Code** and click **Continue**.

**Expected result:** Each value stays in its own field; Continue advances to the order overview.

**Actual result:** The Last Name field displays **empty immediately after entry**, while the
typed text appears in the **First Name** field (First Name changes from "Amol" to
"Chimadage"). Continue shows **"Error: Last Name is required"** and stays on step one.
Reproduced across 3 sessions with 7+ attempts — programmatic fill and manual keyboard
typing both lose every character. Checkout cannot be completed.

| Field | Detail |
|---|---|
| **Severity** | **High** — checkout is completely blocked for this user; entered data is also mis-filed into another field. |
| **Priority** | **High** — deterministic; blocks the purchase flow at its first step. |
| **Business/user impact** | No purchase possible for `problem_user`; silent data misplacement misleads the user (their typed name "moves" and vanishes), producing both a functional dead-end and a data-integrity perception problem. |
| **Evidence** | `screenshots/BUG-002-problem-user-checkout-lastname.png` — error banner "Error: Last Name is required" while Last Name is empty and First Name shows the text intended for Last Name. |
| **Risk reasoning** | High (not Critical): site and other accounts remain fully usable; no data loss or security impact — but for the affected user the important business flow is significantly broken with no workaround. |

---

### BUG-003 — Inventory listing shows randomized incorrect prices (visual_user); cart/detail show the correct price

| Field | Detail |
|---|---|
| **Environment** | Same as BUG-001 |
| **Account** | `visual_user` |
| **Preconditions** | Logged in as `visual_user`; viewing the product listing |

**Steps to reproduce:**
1. Log in as `visual_user`; on the inventory listing, note the displayed price of any
   product (e.g., Sauce Labs Bike Light).
2. Add Sauce Labs Bike Light to cart; open the cart; note its price.
3. Alternatively, open the product detail page for the same product and note its price.
4. Log out, log in again, and repeat step 1.

**Expected result:** One consistent catalog price per product across listing, detail, cart,
and overview, stable across sessions.

**Actual result:** The listing displays different, incorrect amounts for all six products,
and the values change every session (Bike Light observed at $64.79, $12.42, and $5.14 in
three sessions — true price $9.99). The cart and detail page show the correct $9.99 in the
same session, and checkout totals are calculated from the correct price. Verified in
4 sessions; evidence run shows listing $5.14 vs. cart $9.99 for the same item/session.

| Field | Detail |
|---|---|
| **Severity** | **Medium** — important data displayed incorrectly on the primary browsing page, but the flow completes and charges correctly; workaround = check detail/cart. |
| **Priority** | **High** — every session for this account shows wrong prices on the main catalog; wrong prices directly distort purchase decisions and, in a real shop, create pricing-compliance/trust exposure. |
| **Business/user impact** | Users misjudge affordability (a $9.99 item shown at $64.79 is effectively hidden from buyers; a $49.99 item shown at $2.27 invites disappointment at checkout). Inconsistent pricing erodes trust. |
| **Evidence** | `screenshots/BUG-003-visual-user-listing-prices.png` (listing) and `screenshots/BUG-003-visual-user-cart-correct-price.png` (same session, correct $9.99). |
| **Risk reasoning** | Severity Medium because the transaction itself settles correctly and a workaround exists; priority High because the defect hits the most-visited page on every visit and pricing accuracy is core business data. |

---

### BUG-004 — All six products show the same 404 placeholder image on the listing (problem_user)

| Field | Detail |
|---|---|
| **Environment** | Same as BUG-001 |
| **Account** | `problem_user` |
| **Preconditions** | Logged in as `problem_user`; viewing the inventory listing |

**Steps to reproduce:**
1. Log in as `problem_user`.
2. Observe the product images for all six items on the inventory listing.
3. Inspect the image sources (or compare with `standard_user` in the same environment).
4. Repeat in a new session.

**Expected result:** Each product displays its own product image (baseline: `standard_user`
loads 6 distinct sources such as `sauce-backpack-1200x1500-….jpg`).

**Actual result:** All six `<img>` elements load the identical file
`sl-404-Cq1a9k9X.jpg` — a "404" placeholder graphic (unique source count = 1) — while alt
texts remain product-specific and correct. The product detail page shows the correct image.
Reproduced in 3 sessions.

| Field | Detail |
|---|---|
| **Severity** | **Medium** — product imagery, the primary visual identification in a shop, is unusable for this user; workaround = rely on titles/text. |
| **Priority** | **Medium** — deterministic for the account; browsing degraded but purchase flow unaffected. |
| **Business/user impact** | Customers cannot visually distinguish products; a catalog where every tile shows an error placeholder appears broken, undermines trust, and in real commerce invites mis-selection/returns. |
| **Evidence** | `screenshots/BUG-004-problem-user-placeholder-images.png` — six identical placeholder images; baseline comparison documented in §2/§4. |
| **Risk reasoning** | Medium: commerce functions intact, but the core merchandising layer fails for the affected user; kept below High because purchases can still be completed correctly. |

---

### BUG-005 — Order completes with an empty cart ($0 / 0 items → "Thank you for your order!")

| Field | Detail |
|---|---|
| **Environment** | Same as BUG-001 |
| **Account** | Any — reproduced with `standard_user` |
| **Preconditions** | Logged in; cart empty (no badge, no line items) |

**Steps to reproduce:**
1. Log in; open the cart. The empty cart still displays an enabled **Checkout** button.
2. Click Checkout; enter valid first name, last name, postal code; click Continue.
3. Review the overview: **0 items**, "Item total: $0", "Tax: $0.00", "Total: $0.00".
4. Click **Finish**.

**Expected result:** Checkout should not be allowed with an empty cart (button disabled or
hidden, or validation blocks progression); no order confirmation for zero items.

**Actual result:** Every step proceeds normally, the overview shows $0 totals, and Finish
completes the order: "Thank you for your order! Your order has been dispatched, and will
arrive just as fast as the pony can get there!". Reproduced **4/4 runs**.

| Field | Detail |
|---|---|
| **Severity** | **Medium** — a core business rule (an order requires ≥1 item) is not enforced; no financial or data harm exists in this demo, and the workaround is simply not to checkout empty. |
| **Priority** | **Medium** — requires the user to attempt checkout with an empty cart, but it exposes a missing guard on a money path. |
| **Business/user impact** | Invalid order confirmations that claim goods "have been dispatched". In a real deployment this yields phantom orders, fulfillment/support confusion, and an abuse vector. |
| **Evidence** | `screenshots/BUG-005-empty-cart-zero-overview.png` (0 items / $0.00 totals) and `screenshots/BUG-005-empty-cart-order-complete.png` (confirmation page). |
| **Risk reasoning** | Medium rather than High: the application is a client-side demo with no server-side order object, so no downstream data is corrupted; severity would be High against a production order system. |

---

### Additional verified observations (not formalized as defects — assessment cap of 5)

These were reproduced and confirmed, but the assessment limits full records to five. They
are disclosed here rather than hidden.

| # | Observation | Evidence base | Why not a full defect record |
|---|---|---|---|
| OBS-1 | `error_user`: product **description is missing** on the detail page — `.inventory_details_desc` never renders; console logs `Error: This component failed to render!` (name, price, image, add-to-cart all render) | 1 deep-dive session with DOM dump + console capture | Comparable impact to BUG-004 (product info loss) but lower than the five raised; disclosed per cap |
| OBS-2 | `problem_user`: **Add to cart from the product detail page has no effect** — click succeeds, no badge/button change after 10 s; listing-page add works normally | 2 sessions (explore3 + focused retest) | Same account already represented by two High/Medium records; workaround (listing add) exists |
| OBS-3 | `error_user`: **Last Name input displays empty** although the value is retained (checkout proceeds); typing throws `Cannot read properties of undefined (reading 'value')` | 2 sessions with action-timestamped pageerror timeline | Checkout still completes; impact is confusing display rather than a blocked flow |
| OBS-4 | All valid sub-routes (`inventory.html`, `cart.html`, `checkout-*.html`) are served with **HTTP 404 status** (body renders correctly; root/index.html → 200) | Status probe across 7 URLs + every page load in all sessions | No user-visible functional impact in normal operation; standard SPA static-host fallback — would be logged as Low for hosting/ops |
| OBS-5 | Logged-in users can **deep-link directly** to `checkout-step-two.html` and `checkout-complete.html` (success page reachable without purchasing) | Direct-goto probes in fresh sessions | No server-side order is created and the demo defines no step-guard contract; recorded as a hardening recommendation |

### Explicitly rejected (not defects)

- **Telemetry 401/CORS errors** (`events.backtrace.io`, `submit.backtrace.io` with
  placeholder token `TOKEN`): instrumentation failure with **zero user-facing impact** —
  no UI element depends on it. Rejected as a defect.
- **Single cart-removal failure** observed once in an early probe: could not be reproduced
  (3/3 clean runs afterwards) — treated as a test-harness race, **not reported**.
- **"problem_user cart is broken"** early hypothesis: **refuted** by retest — listing-page
  add/remove, cart contents, and badge all work correctly for `problem_user`.

## 6. Automation

| Aspect | Detail |
|---|---|
| **Framework** | Playwright 1.63.0 + TypeScript (`@playwright/test`), Chromium project |
| **Test file** | `tests/checkout.spec.ts` — one isolated end-to-end test |
| **Flow** | Login → inventory (6 products) → select Sauce Labs Backpack → product detail (name + $29.99) → add to cart (Remove button + badge 1) → cart (name, price, qty 1) → checkout step 1 (fill 3 fields) → Continue → overview (title, line item, subtotal $29.99, tax $2.40, total $32.39) → Finish → completion ("Thank you for your order!", dispatch text) → Back Home (badge cleared) |
| **Assertions** | Web-first: `toHaveURL` (6 navigation checkpoints), `toBeVisible`, `toHaveText`/`toContainText` (product, price, badge, totals, completion message), `toHaveCount` (products, cart rows, badge absence) |
| **Selectors** | `[data-test="..."]` for all app-specific elements (username, password, login-button, add-to-cart, remove, shopping-cart-link, checkout, firstName/lastName/postalCode, continue, title, inventory-item-name/price, item-quantity, subtotal/tax/total-label, finish, complete-header, complete-text, back-to-products); stable structural classes (`.inventory_item`, `.cart_item`, `.shopping_cart_badge`) only where no data-test exists |
| **Synchronization** | Playwright auto-waiting + web-first assertions only. **No `waitForTimeout`, no fixed sleeps anywhere in the test** |
| **Test isolation** | Fresh browser context per run (default fixtures); no shared state; safe to re-run and parallelize |
| **Configuration** | `playwright.config.ts`: `testDir`, `baseURL`, list+HTML reporters, `trace: on-first-retry`, `screenshot: only-on-failure`, `video: retain-on-failure`, 30 s test timeout, 10 s action timeout, retries: 1, Chromium (Desktop Chrome) |

**GitHub:** no remote repository was created as part of this assessment — the project is
GitHub-ready (structure, `.gitignore`, no secrets committed) but no repository URL is
claimed.

## 7. AI-Assisted Automation Review

**What AI generated:** test structure (login helper + one linear E2E flow), the locator
set, assertion list, and `playwright.config.ts` draft.

**What was correct initially:** navigation assertions via `toHaveURL`/`waitForURL`;
`fill`/`click` auto-waiting; single-test isolation through Playwright fixtures; asserting
the app's displayed totals (verified by hand: 29.99 × 8% = 2.40 → 32.39).

**What was wrong and manually corrected before first execution:**

| Issue found in AI output | Correction | Why |
|---|---|---|
| Assertion `toContainText('your order has been dispatched')` — case mismatch with actual DOM text | → `'order has been dispatched'` | Would have failed on real text ("Your order has been dispatched…") |
| Summary totals located by CSS classes (`.summary_*`) | → `[data-test="subtotal-label"]` / `tax-label` / `total-label` | Live DOM inspection confirmed stable data-test attributes; classes are styling-coupled |
| Cart item name/price via CSS classes | → `[data-test="inventory-item-name"]` / `inventory-item-price` | Same maintainability rationale |
| XPath/text-match locators considered for product selection (`//div[text()=…]`) | → structural `.inventory_item` + `has:` sub-locator with `data-test` where available | XPath couples to DOM shape; breaks on markup changes |
| Login asserted by URL only | → URL + `.inventory_list` visible + item count = 6 | URL alone can change without content rendering — weak assertion |
| Fixed waits (`page.waitForTimeout`) used in an early exploratory draft to let error banners render | → locator-based polling and `expect` web-first assertions; test code contains zero `waitForTimeout` (verified by search) | Playwright auto-waits for actionability; arbitrary sleeps add flake and runtime |
| Missing "correct product in cart" validation | → added name, price, and quantity assertions in cart and overview | Core acceptance criteria of the flow |
| Config draft: video `on`, retries `0` | → `video: retain-on-failure`, `retries: 1` with `trace: on-first-retry` | Trace-on-first-retry requires ≥1 retry; diagnostics on failure only |

## 8. Test Execution

**Commands and actual results (executed in this session):**

| # | Command | Result |
|---|---|---|
| 1 | `npx playwright test` | **1 passed** (test 9.0 s; run 20.2 s) |
| 2 | `npx playwright test --headed` | **1 passed** (test 13.9 s; run 19.7 s) |
| 3 | `npx playwright test tests/checkout.spec.ts --headed` | **1 passed** (test 10.1 s; run 14.9 s) |
| 4 | `npx playwright test` (stability re-run) | **1 passed** (test 9.1 s; run 12.4 s) |
| 5 | `npx playwright test` (stability re-run) | **1 passed** (test 4.4 s; run 8.4 s) |
| 6 | `npx playwright test` (final verification after config cleanup) | **1 passed** (test 9.2 s; run 14.5 s) |

**Totals:** 6 executions · **Passed: 6** · **Failed: 0** · **Skipped: 0**

Primary command: `npx playwright test`
Report: `npx playwright show-report`

Exploratory phase (separate, non-repo probe scripts): 13 scripted exploration files
executed (several re-run), covering 4 accounts and ~30 login sessions; defect evidence
re-verified in a final dedicated capture run (5/5 defects re-confirmed).

## 9. AI-Driven QA Strategy

**1. Where AI adds value across the lifecycle:** requirements/risk analysis (prompt-driven
test charters), exploratory prompt generation and blind-spot review, defect-triage
reasoning, draft test generation, flaky-failure clustering, and regression-suite
summarization — all as a first pass that shortens time-to-first-insight.

**2. Where human review is mandatory:** deciding what is a defect versus intended
behavior, confirming severity/priority against business context, verifying evidence, and
approving anything that gates a release. This assessment demonstrated the need: AI-style
suggestions included payment/email testing for a site with neither, and several observed
behaviors (404 statuses, telemetry errors) required human judgment to avoid false positives.

**3. How AI-generated tests are reviewed:** before acceptance, every test is checked for
(a) correct, stable selectors (`data-test` over XPath), (b) meaningful assertions beyond
URLs, (c) absence of fixed sleeps, (d) correct expected values validated against the app,
(e) isolation/re-runnability, and (f) an actual green run — AI code is treated as a
draft, never as evidence.

**4. AI support for defect analysis:** cluster console errors with reproduction steps,
propose likely root causes, draft reproducible defect records — with the rule that every
field (expected/actual/steps) must trace to a real execution.

**5. AI support for coverage analysis:** map requirements/user journeys to existing tests,
identify untested paths (e.g., cross-account flows), and suggest risk-ranked additions —
reviewed by a human to remove duplicates and impossible scenarios.

**6. AI support for regression optimization:** rank tests by historical failure
probability and change impact, prune redundant cases, and keep a minimal high-signal gate.

**7. AI in CI/CD quality gates:** AI summarization of failures, automatic first-pass
triage (flake vs. real regression), and risk-based test selection — with a human
approving any gate that can block a release.

**8. Risks of AI-driven testing:** plausible-sounding fabrication (invented defects,
fake results, features that do not exist), shared blind spots across models, overfitting
tests to AI-visible DOM details, and erosion of tester skill if trust is outsourced.

**9. Practical mitigation:** execute everything against the real system; require
reproduction counts and evidence for defects; reject suggestions that reference absent
features; keep humans as the arbiter of severity and release decisions; log all AI prompts
and accepted/rejected suggestions (as in `AI-USAGE.md`) for auditability; review AI tests
with the checklist in §7.

## 10. Tools Used

- Playwright 1.63.0 (Chromium) — exploration, reproduction, automation, screenshots
- TypeScript 5.9.3 · Node.js 20.17.0 · npm 11.3.0
- Git (repository prepared for GitHub; no remote created)
- OpenCode AI assistant (`big-pickle`) — prompts documented in `AI-USAGE.md`
- Browser inspection via Playwright (console, network, DOM/geometry evaluation)

Not used (not claimed): Jira/defect tracker, Postman, axe-core, CI/CD pipelines,
cross-browser cloud grids.

## 11. Limitations

- **Automation scope:** one happy-path E2E test (`standard_user`). Negative paths, the
  three defective accounts, and edge cases (empty cart, special characters) are documented
  manually, not automated — automating broken flows would encode defects as expectations.
- **Browsers:** Chromium only; Firefox/WebKit not executed.
- **Non-functional:** no performance/load testing (no backend), no security testing beyond
  basic input-handling observation, no full WCAG conformance audit (targeted checks only).
- **Time/session:** findings reflect behavior observed during this assessment window;
  no long-duration, concurrency, or network-condition testing.
- **Evidence:** screenshots document state at capture time; console/pageerror text is
  quoted in the report because console output cannot be captured in a page screenshot.
- **Unreproduced anomaly:** one cart-removal timeout occurred in an early probe and did
  not recur (3/3 passes); it is disclosed here and deliberately not filed as a defect.
- The application is a public demo that may change without notice.

## 12. Conclusion

The assessment combined risk-based manual/exploratory testing, prompt-driven AI
assistance with disciplined validation, and one robust automated E2E test. Five defects
were confirmed — two High (order completion silently failing for `error_user`; checkout
hard-blocked by a broken Last Name field for `problem_user`), three Medium (randomized
wrong listing prices for `visual_user`; identical placeholder images for `problem_user`;
empty-cart orders completing with a $0 confirmation) — each reproduced repeatedly with
screenshot evidence, plus five lesser verified observations and three explicitly rejected
"findings" that failed the confirmation or relevance bar. The critical judgment demonstrated
was as much about what was **not** reported (unreproduced anomaly, no-impact telemetry
errors, features SauceDemo does not have) as what was. The Playwright test passed 6/6
runs headless and headed with stable, data-test-based selectors and no fixed waits,
making the project ready for GitHub submission.
