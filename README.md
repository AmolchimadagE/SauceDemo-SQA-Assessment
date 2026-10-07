# SauceDemo QA & AI Assessment

## Application

https://www.saucedemo.com/

## Tools

- Playwright 1.63.0 (Chromium 153) — exploratory testing, defect reproduction, E2E automation
- TypeScript 5.9.3
- Node.js 20.17.0 / npm 11.3.0
- Git — repository structure prepared for GitHub
- OpenCode (AI assistant) — risk analysis, prompt-driven exploratory guidance, automation review
- Browser devtools capabilities via Playwright (console, network, DOM inspection)

## Prerequisites

- Node.js 20+
- npm 11+

## Installation

```bash
npm install
npx playwright install chromium
```

## Run all tests

```bash
npx playwright test
```

## Run headed

```bash
npx playwright test --headed
```

## Run checkout test

```bash
npx playwright test tests/checkout.spec.ts
```

## View report

```bash
npx playwright show-report
```

## Test Coverage

One isolated end-to-end test (`tests/checkout.spec.ts`) automates the critical purchase journey
for `standard_user`:

1. Login with valid credentials → assert redirect to inventory and 6 products listed
2. Select **Sauce Labs Backpack** → open product detail → assert name and price ($29.99)
3. Add to cart → assert Remove button and cart badge `1`
4. Open cart → assert correct product, price, and quantity in cart
5. Checkout → fill customer details → Continue → assert overview page opens
6. Verify order overview: product line, `Item total: $29.99`, `Tax: $2.40`, `Total: $32.39`
7. Finish → assert completion message ("Thank you for your order!")
8. Return to products → assert cart badge cleared

Selectors prefer `[data-test="..."]` attributes; synchronization uses Playwright auto-waiting
and web-first assertions only (no `waitForTimeout`, no fixed sleeps). Defects found for
`problem_user`, `error_user`, and `visual_user` are documented in `assessment-report.md`
with screenshot evidence, but are intentionally not automated — they are broken behaviors
under investigation, not passing acceptance criteria.

## AI Usage

AI (OpenCode assistant) was used for: risk-based test design, exploratory-testing prompts,
defect-triage reasoning, and review of the Playwright test draft. Every AI suggestion was
validated against the live application before being accepted; several suggestions were
rejected because SauceDemo does not implement the referenced features. Full details,
including rejected suggestions and manual corrections, are in `AI-USAGE.md`.

## Known Limitations

- Automation covers the happy path for `standard_user` only (1 test); negative and
  cross-account scenarios are documented manually, not automated.
- Cross-browser testing (Firefox/WebKit) not performed — Chromium only, per assessment scope.
- No performance, load, or security penetration testing (no backend to exercise).
- Accessibility checks were targeted manual inspections (labels, roles, keyboard, responsive),
  not a full WCAG 2.1 AA conformance audit.
- Defects were re-verified over multiple sessions, but no long-duration or concurrent-session
  testing was performed.
- Findings reflect the application state observed on the assessment date; SauceDemo is a
  public demo that may change without notice.
