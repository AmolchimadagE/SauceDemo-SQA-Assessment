# AI Usage Log

All prompts in this assessment were directed to the OpenCode AI assistant (model:
`big-pickle`) within a single working session. No other AI tools were used. AI outputs
below are summarized from that session, and every suggestion was validated against the
live application before being accepted into the report. Acceptance never happened without
hands-on verification.

---

## Prompt 1

**Purpose:** Establish a risk-based test focus for SauceDemo as an e-commerce application.

**Prompt:**
> "Act as a senior QA engineer. Analyze SauceDemo as an e-commerce application and
> identify the highest-risk user journeys, business risks, edge cases, and exploratory
> testing questions."

**AI suggestion:**
- Prioritize: login, catalog accuracy (names/prices/images), add/remove from cart,
  checkout validation, order completion, logout/session behavior.
- Business risks: wrong price shown vs. charged, wrong image vs. product, cart contents
  diverging from checkout totals, checkout reachable with invalid/empty state.
- Exploratory questions: does the price on the listing match cart and overview? Do images
  match their products? Is checkout blocked when the cart is empty? Does sorting handle
  equal prices? Does the session survive reload/logout?
- Suggested also: stock/inventory-decrement testing and coupon/promotion edge cases.

**Validation:** Every listed journey was executed with scripted Playwright probes across
`standard_user`, `problem_user`, `error_user`, and `visual_user` (multiple sessions each).

**Accepted:**
- Price consistency check listing ↔ cart ↔ overview → uncovered **BUG-003**.
- Empty-cart checkout attempt → uncovered **BUG-005**.
- Image correctness per product → uncovered **BUG-004**.
- Sorting verification (A–Z, Z–A, price asc/desc incl. $15.99 tie) → passed.
- Session/reload/logout/back-button checks → passed.

**Rejected:**
- Stock decrement after purchase, coupon/promo code edge cases.

**Reason:** SauceDemo has no backend inventory or promotion engine; cart state is
client-side only. Testing these would mean inventing requirements the application does
not claim to have.

---

## Prompt 2

**Purpose:** Drive a focused risk review of the checkout flow (validation, functional,
usability, data handling).

**Prompt:**
> "Analyze the SauceDemo checkout flow and identify validation, functional, usability,
> and data-handling risks that should be explored."

**AI suggestion:**
- Required-field validation sequencing (first → last → postal) and error message clarity.
- Data handling: special characters, script tags, very long strings, SQL-lookalike input.
- Arithmetic: subtotal + tax = total, 8% tax rounding.
- Flow integrity: empty-cart checkout, deep links between checkout steps, page refresh
  mid-checkout, browser Back after order completion.
- Payment gateway failure scenarios and email receipt verification.

**Validation:** Each applicable item was executed against the live site, including a full
special-character/300-character/SQL-lookalike checkout run and three empty-cart checkout runs.

**Accepted:**
- Empty-cart checkout → **BUG-005** (order completes with 0 items, $0 total).
- Required-field validation on `standard_user` → correct messages, in correct order → passed.
- Special chars / long input → accepted, order completes, no script execution, no dialogs → passed.
- Tax math ($29.99 + $2.40 tax = $32.39; 8% rounding) → passed.
- Deep-link probes → verified behavior; route-guard gap recorded as an observation only
  (no server-side order exists, so impact is limited).

**Rejected:**
- Payment gateway failure testing.
- Email receipt verification.

**Reason:** SauceDemo's checkout ends at a static confirmation page; there is no payment
gateway to fail and no email is dispatched or displayed. These are features the
application does not have — raising them would fabricate scope.

---

## Prompt 3

**Purpose:** Surface UI/UX, accessibility, responsive, and visual risks worth manual
validation.

**Prompt:**
> "Analyze SauceDemo for UI/UX, accessibility, responsive behavior, and visual risks that
> are worth validating manually."

**AI suggestion:**
- Check: aria labels/roles on inputs and error messages, keyboard reachability of product
  links and buttons, alt text on images, missing headings/landmarks.
- Responsive: 375px and 768px viewports, horizontal overflow, text clipping.
- Visual: product image correctness per account, price display consistency, layout
  comparison across the four test accounts.

**Validation:** DOM-level accessibility audit (labels, roles, `role="alert"` on errors,
Tab-focus trail), viewport geometry checks at 375/768px, and cross-account visual/data
comparison with screenshots.

**Accepted:**
- Cross-account visual comparison → **BUG-004** (identical placeholder images) and
  **BUG-003** (randomized prices).
- Keyboard navigation test → product links are `<a role="button">` and Tab-reachable → passed.
- Error messages use `role="alert"`; inputs carry aria-labels → passed.
- Responsive checks: no horizontal scroll, no clipped text at 375px/768px → passed.

**Rejected:**
- Full WCAG 2.1 AA conformance audit (e.g., automated axe-core gate with pass/fail claim).

**Reason:** A conformance claim requires a complete audit across all pages and criteria;
within this time-boxed assessment only targeted, manually verified checks were performed,
and the report claims no more than that.

---

## Prompt 4

**Purpose:** Identify exploratory gaps a QA engineer might overlook.

**Prompt:**
> "Review the exploratory testing areas for SauceDemo and identify gaps or scenarios a QA
> engineer might overlook."

**AI suggestion:**
- Refresh/reload persistence on inventory, cart, and checkout pages.
- Deep-linking to protected pages while logged out and between checkout steps.
- Browser Back after logout (session leakage), direct URL access after logout.
- Cart persistence across logout → login.
- HTTP status correctness of served routes; console/network error monitoring.
- Concurrent multi-user cart conflicts.

**Validation:** Executed reload tests on three pages, logged-out deep-link tests,
Back-button-after-logout test, cart persistence test, and continuous console/network
capture during every exploratory session.

**Accepted:**
- All session/navigation tests → passed (no session leakage; cart persists across
  re-login, which is normal e-commerce behavior).
- Route status check → all sub-pages return HTTP 404 while rendering correctly → recorded
  as a low-impact observation (see report §5).
- Console/network monitoring → surfaced the JS errors behind **BUG-001** and the render
  failure noted in report §5 observations.

**Rejected:**
- Concurrent multi-user cart conflict testing.

**Reason:** Cart and session state are client-side (cookie `session-username`); there is no
shared server cart to conflict. The scenario does not exist in this application.

---

## Prompt 5

**Purpose:** Triage observed behavior into genuine defect / intended behavior / needs more
evidence before reporting.

**Prompt:**
> "Review my observed SauceDemo behavior and tell me whether it appears to be a genuine
> defect, an intentional behavior, or something requiring further investigation. Explain
> your reasoning." (Findings submitted: problem_user checkout field behavior; error_user
> Finish button no-op; visual_user randomized listing prices; 404 status on valid routes;
> telemetry 401/CORS errors; a single failed cart-removal attempt; empty-cart order completion.)

**AI suggestion (triage):**
- problem_user field wiring, error_user Finish, visual_user prices, empty-cart order →
  genuine defects; reproduce repeatedly, capture evidence, then report.
- HTTP 404 on SPA routes → likely deliberate static-host fallback; no user-visible impact
  → observation, not a headline defect.
- backtrace.io 401/CORS → placeholder telemetry token; zero user impact → do not report
  as a defect.
- Single cart-removal failure → insufficient evidence; retest before any claim.

**Validation:** Each triage decision was re-tested: defects re-reproduced 2–3 times in
fresh sessions (with screenshots); the 404/telemetry items were analyzed for user impact;
the cart-removal anomaly was re-run 3 additional times.

**Accepted:**
- 4 defects promoted to full defect records + empty-cart order (**BUG-005**) → all
  re-verified, evidence captured.
- 404 status, telemetry 401, and the cart-removal anomaly → not reported as defects.

**Rejected:**
- Reporting the single cart-removal failure as a defect.

**Reason:** It occurred once in one probe run and could not be reproduced (3/3 subsequent
runs passed). Reporting it would violate the "no unconfirmed defects" rule; it is recorded
here as an unreproduced anomaly instead.

---

## AI Involvement in Playwright Development

**What AI did:**
- Proposed the test structure (login helper + one linear E2E flow with staged comments).
- Drafted `tests/checkout.spec.ts`, configuration choices, and assertion set.
- Ran a critical review pass over its own draft before execution.

**Review findings and manual corrections (all applied before the first run):**

| # | AI draft / typical AI pattern | Review finding | Correction | Why |
|---|---|---|---|---|
| 1 | `toContainText('your order has been dispatched')` | Case mismatch vs. actual text ("Your order has been dispatched…") — would fail | Changed to `'order has been dispatched'` | Assertions must match verified DOM text exactly |
| 2 | Summary totals via `.summary_subtotal_label` classes | Live DOM inspection showed stable `data-test` attributes exist | Switched to `[data-test="subtotal-label"]`, `[data-test="tax-label"]`, `[data-test="total-label"]` | `data-test` is the app's contract for automation; classes are styling-coupled |
| 3 | Cart row name/price via `.inventory_item_name` / `.inventory_item_price` classes | `data-test` equivalents confirmed present on cart rows | Switched to `[data-test="inventory-item-name"]` / `[data-test="inventory-item-price"]` | Same maintainability rationale as #2 |
| 4 | Fixed waits (`page.waitForTimeout(300)`) in an early exploratory draft to let error banners render | Unnecessary and flaky — arbitrary timing | Replaced with locator-based waiting (`waitFor` polling, `expect` web-first assertions, explicit element waits). Final test contains **zero** `waitForTimeout` (verified by search) | Playwright auto-waits for actionability; web-first assertions synchronize reliably |
| 5 | XPath/text locators (`//div[text()='Sauce Labs Backpack']`) | Brittle against DOM changes | Structural locator with `has:` sub-locator + `data-test` where available | XPath couples to DOM shape; `data-test` is stable |
| 6 | Assert only URL after login | Weak — URL can change without content rendering | Added `.inventory_list` visibility + item count = 6 | Meaningful assertion of actual page state |
| 7 | No cart-content assertions beyond item count | Missing validation of "correct product in cart" | Added product name, price ($29.99), and quantity (1) assertions | Core acceptance criteria of the flow |
| 8 | Config: video `on`, retries `0` | Trace-on-first-retry requires retries ≥ 1; constant video storage is wasteful | `retries: 1`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` | Diagnostics on failure only; matches assessment config requirements |

**What AI got right (kept as-is):**
- `waitForURL` + `toHaveURL` for navigation assertions, `fill`/`click` auto-waiting.
- Isolation: one fresh browser context per test (Playwright default fixtures) — no shared
  state between runs.
- Tax/total assertions taken from the app's verified displayed values after manual
  arithmetic confirmation (29.99 × 8% = 2.40 → total 32.39), not computed floats.
