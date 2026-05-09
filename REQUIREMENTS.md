# EVE Health ROI Calculator — Requirements

**Version:** 1.0
**Author:** Product Analyst
**Reviewers:** Tim Fateev (Data), Alex Rivera (Product), Sales Team
**Status:** Locked for Module 4.3 build

---

## 1. Goal

Give a healthcare prospect a personalized estimate of the dollar and time savings they'd get by switching to EVE Platform. They enter five numbers, see four results, and (optionally) share their email for a PDF version.

This is a **lead magnet**, not a contract. The numbers must be:
- **Defensible** — a hospital CFO can challenge any assumption
- **Conservative** — under-promise rather than over-promise
- **Useful** — the prospect actually learns something even if they don't buy

---

## 2. User Flow

A single page with three sections, top to bottom:

1. **Hero** — one sentence value prop, "Calculate your ROI" CTA
2. **Form** — five input fields, one button
3. **Results** — four output metrics + a stacked-bar chart of monthly cost before/after

When the user clicks **Calculate**, the results section appears below the form. No page navigation. No backend. Everything runs in the browser.

After results, an optional email-capture: *"Want this as a PDF for your CFO? Drop your email."* — but the calculator works without it.

---

## 3. Inputs (5 fields)

| # | Field | Type | Range | Default | Help text |
|---|---|---|---|---|---|
| 1 | Support tickets per month | integer | 50 – 50,000 | 500 | "Total inbound support volume across all facilities" |
| 2 | Avg resolution time (hours) | decimal | 1 – 200 | 18 | "How long it takes to close an average ticket" |
| 3 | FTE support analysts | decimal | 1 – 100 | 4 | "Full-time equivalents handling these tickets" |
| 4 | Current monthly tool cost ($) | integer | 0 – 200,000 | 8,500 | "Sum of analytics, ticketing, BI tool subscriptions" |
| 5 | Number of facilities | integer | 1 – 50 | 3 | "Hospitals or clinics covered by the same team" |

**Validation:**
- All fields required
- Numbers only — block alphabetic input on the field itself
- Out-of-range values: snap to range with a warning ("Capped at 50,000")
- Empty fields: highlight in red and prevent submit
- Pre-fill defaults so a prospect can hit Calculate without typing anything (this drives engagement)

---

## 4. Outputs (4 metrics)

| # | Metric | Format | Color |
|---|---|---|---|
| 1 | Estimated time savings | "X hours/month" | green |
| 2 | Estimated cost savings | "$X/month" | green |
| 3 | ROI | "X%" | blue |
| 4 | Payback period | "X months" | blue |

Plus a stacked bar chart: current monthly cost vs. with-EVE monthly cost.

---

## 5. Calculation Formulas (Defensible)

Every assumption listed below is editable in one place in the code (a single `ASSUMPTIONS` constant) so we can update it once when the data team refines the model.

### Assumptions
| Assumption | Value | Why this number |
|---|---|---|
| Time saved per ticket with EVE | **30%** | Customer survey: median reported reduction in active analyst time per ticket (n=42 customers). Conservative — Miguel reports 50%+. |
| Active-labor fraction of resolution time | **10%** | Resolution time is elapsed clock-time (open → close), not labor. Active analyst work is only ~10% of that — the rest is waiting on customer replies, batch reviews, third-party systems. **This correction matters: without it, the calculator implies team productivity gains that exceed total team capacity.** |
| Loaded cost per analyst FTE | **$95,000/year** | $7,917/month. BLS 2025 median for "Healthcare data analyst" + 30% load. |
| EVE Platform monthly cost | **$5,500/month per facility** | Professional tier pricing from `PRODUCT.md` |
| EVE implementation (one-time) | **$15,000** | Mid-range professional services estimate |
| Avoided cost per facility/year | **$25,000** | From customer case studies — reduced reporting overhead, fewer escalations. |

### Formulas

```
hours_saved_per_month   = tickets_per_month * avg_resolution_hours * 0.10 * 0.30
                          # active-labor fraction × time saved per active hour

analyst_hourly_cost     = 95_000 / 12 / 160        # 160 hrs/month per FTE
labor_savings_per_month = hours_saved_per_month * analyst_hourly_cost

eve_monthly_cost        = 5_500 * num_facilities
tool_savings_per_month  = max(0, current_tool_cost - eve_monthly_cost)
avoided_cost_per_month  = (25_000 / 12) * num_facilities

cost_savings_per_month  = labor_savings_per_month + tool_savings_per_month + avoided_cost_per_month
annual_savings          = cost_savings_per_month * 12

annual_eve_investment   = (eve_monthly_cost * 12) + 15_000   # year 1 includes implementation
roi_percent             = (annual_savings - annual_eve_investment) / annual_eve_investment * 100

payback_months          = annual_eve_investment / cost_savings_per_month
                          if cost_savings_per_month > 0 else "Not within 5 years"
```

### Edge Cases
- If `cost_savings_per_month <= 0`: show "Contact sales — your scenario benefits from a custom ROI analysis." Don't show negative ROI; that's a sales conversation, not a calculator output.
- If `current_tool_cost < eve_monthly_cost`: tool savings clamps to 0 (we don't claim savings on something the prospect spends less on).
- If `payback_months > 60`: show "5+ years" instead of the exact number.

---

## 6. Visual Design

- **Brand colors** from `health-quiz/CLAUDE.md`:
  - Primary: `#1e40af` (blue)
  - Positive (savings, time saved): `#059669` (green)
  - Pain (current state, costs avoided): `#dc2626` (red)
- **Typography:** System font stack (Tailwind default) — no custom font for v1
- **Layout:** Single-column, max-width 768px, centered
- **Mobile:** Form fields stack full-width, results metric cards stack 2-up

### Results Card Layout
Four metric cards in a 2×2 grid:
```
[ Time Savings  ]   [ Cost Savings  ]
[   240 hrs/mo  ]   [  $19,500/mo   ]

[ ROI           ]   [ Payback       ]
[   215%        ]   [  4.2 months   ]
```

Below the cards: a stacked bar chart showing monthly cost breakdown for current state vs. with-EVE state.

---

## 7. Out of Scope (v1)

- Email capture / PDF generation (Module 4.5 stretch)
- Multi-step wizard UI
- Industry benchmarking ("you're paying 30% more than peers")
- Currency other than USD
- Customer logos / testimonials
- Analytics tracking / GA integration
- Authentication
- Saving results between sessions

**v1 ships when:** A prospect can land on the page, hit Calculate with defaults or their own numbers, and see the four metrics with a chart. That's it.

---

## 8. Success Criteria

The calculator is successful if:
1. **Tim's test:** "Would our sales team actually share this with a prospect?" — yes
2. **Karen's test:** "Would a hospital CFO trust these numbers?" — every assumption is documented and defensible
3. **Alex's test:** "Does this generate leads?" — measured via email captures (Module 4.5)
4. **Defensive check:** A prospect with worst-case-realistic inputs (small facility, low ticket volume) doesn't see a deceptive ROI — the edge case logic in §5 prevents this.

---

## 9. Open Questions for 4.3 Build

1. Should the chart use Chart.js, or render with vanilla SVG? (Chart.js is in the project brief — recommend keeping it.)
2. Where do we put the assumption disclaimers? Recommend an expandable "How this is calculated" panel below the chart.
3. Email capture wording — copy lives with the marketing team but we should stub it.

---

## 10. Build Plan (for Module 4.3)

| Task | Effort |
|---|---|
| Form HTML + Tailwind layout | 30 min |
| Input validation (range, required) | 20 min |
| Calculation engine (the formulas above, in app.js) | 30 min |
| Results card component (the 2×2 grid) | 20 min |
| Stacked-bar chart with Chart.js | 30 min |
| Edge-case handling | 20 min |
| Mobile testing | 20 min |
| **Total** | **~3 hrs** |

---

**Locked. Module 4.3 builds against this document.**
