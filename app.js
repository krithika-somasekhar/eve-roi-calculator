// EVE Health ROI Calculator
// Implements the formulas locked in REQUIREMENTS.md §5.
// All assumptions live in ASSUMPTIONS so the data team can tune in one place.

const ASSUMPTIONS = {
  TIME_SAVED_PCT: 0.30,                  // 30% reduction in active labor per ticket
  ACTIVE_LABOR_PCT: 0.10,                // ~10% of resolution-clock-time is active analyst work
                                         // (the rest is waiting on customer replies, batch reviews, etc.)
  LOADED_ANALYST_COST_PER_YEAR: 95_000,  // BLS 2025 + 30% benefits load
  HOURS_PER_MONTH_PER_FTE: 160,
  EVE_MONTHLY_COST_PER_FACILITY: 5_500,  // Professional tier
  EVE_IMPLEMENTATION_COST: 15_000,       // one-time, year 1 only
  AVOIDED_COST_PER_FACILITY_PER_YEAR: 25_000,
  MAX_PAYBACK_MONTHS: 60,                // anything beyond shows "5+ years"
};

const fmt = {
  int: (n) => Math.round(n).toLocaleString("en-US"),
  money: (n) => "$" + Math.round(n).toLocaleString("en-US"),
  percent: (n) => Math.round(n).toLocaleString("en-US") + "%",
};

function readForm() {
  const get = (id) => parseFloat(document.getElementById(id).value);
  return {
    tickets: get("tickets"),
    hours: get("hours"),
    ftes: get("ftes"),
    toolcost: get("toolcost"),
    facilities: get("facilities"),
  };
}

function validate(input) {
  const errors = [];
  if (!Number.isFinite(input.tickets) || input.tickets < 50 || input.tickets > 50_000)
    errors.push("Tickets per month must be between 50 and 50,000.");
  if (!Number.isFinite(input.hours) || input.hours < 1 || input.hours > 200)
    errors.push("Avg resolution time must be between 1 and 200 hours.");
  if (!Number.isFinite(input.ftes) || input.ftes < 1 || input.ftes > 100)
    errors.push("FTEs must be between 1 and 100.");
  if (!Number.isFinite(input.toolcost) || input.toolcost < 0 || input.toolcost > 200_000)
    errors.push("Tool cost must be between $0 and $200,000.");
  if (!Number.isFinite(input.facilities) || input.facilities < 1 || input.facilities > 50)
    errors.push("Facilities must be between 1 and 50.");
  return errors;
}

function calculate(input) {
  const A = ASSUMPTIONS;

  // Hours saved per month = tickets × (resolution time × active-labor fraction) × time saved %
  // Resolution time is elapsed clock-time, not labor; we credit only the active portion.
  const hoursSavedPerMonth =
    input.tickets * input.hours * A.ACTIVE_LABOR_PCT * A.TIME_SAVED_PCT;

  const analystHourlyCost =
    A.LOADED_ANALYST_COST_PER_YEAR / 12 / A.HOURS_PER_MONTH_PER_FTE;
  const laborSavingsPerMonth = hoursSavedPerMonth * analystHourlyCost;

  const eveMonthlyCost = A.EVE_MONTHLY_COST_PER_FACILITY * input.facilities;
  const toolSavingsPerMonth = Math.max(0, input.toolcost - eveMonthlyCost);
  const avoidedCostPerMonth =
    (A.AVOIDED_COST_PER_FACILITY_PER_YEAR / 12) * input.facilities;

  const costSavingsPerMonth =
    laborSavingsPerMonth + toolSavingsPerMonth + avoidedCostPerMonth;
  const annualSavings = costSavingsPerMonth * 12;

  const annualEveInvestment =
    eveMonthlyCost * 12 + A.EVE_IMPLEMENTATION_COST;
  const roiPercent =
    ((annualSavings - annualEveInvestment) / annualEveInvestment) * 100;

  const paybackMonths =
    costSavingsPerMonth > 0 ? annualEveInvestment / costSavingsPerMonth : Infinity;

  return {
    hoursSavedPerMonth,
    laborSavingsPerMonth,
    eveMonthlyCost,
    toolSavingsPerMonth,
    avoidedCostPerMonth,
    costSavingsPerMonth,
    annualSavings,
    annualEveInvestment,
    roiPercent,
    paybackMonths,
    currentMonthlyCost: input.toolcost,
  };
}

let chart = null;
function renderChart(input, result) {
  const ctx = document.getElementById("cost-chart").getContext("2d");
  if (chart) chart.destroy();

  // Current state stack: just the current tool cost (single bar)
  // With EVE stack: EVE platform cost (the spend) - we want it visually < current cost when savings exist
  // To make the comparison meaningful, also show "EVE cost + remaining tool cost" if EVE doesn't fully replace tools
  const currentState = input.toolcost;
  const withEve = result.eveMonthlyCost;

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Current state", "With EVE"],
      datasets: [
        {
          label: "Monthly cost",
          data: [currentState, withEve],
          backgroundColor: ["#dc2626", "#1e40af"],
          borderRadius: 6,
          maxBarThickness: 90,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => fmt.money(ctx.parsed.y) + " / month",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => fmt.money(v) },
          title: { display: true, text: "$ / month" },
        },
      },
    },
  });
}

function showResults(input, result) {
  const resultsSection = document.getElementById("results");
  const metricsGrid = document.getElementById("metrics-grid");
  const chartWrap = document.getElementById("chart-wrap");
  const salesPanel = document.getElementById("sales-conversation");

  resultsSection.classList.remove("hidden");

  // Edge case: any of these conditions means the calculator would show
  // an embarrassing number — bounce the user to a sales conversation instead.
  //   1. Monthly savings are zero/negative
  //   2. Year-1 ROI is negative (annual savings < annual EVE investment)
  //   3. Payback exceeds the displayable ceiling
  const isLossScenario =
    result.costSavingsPerMonth <= 0 ||
    result.roiPercent < 0 ||
    result.paybackMonths > ASSUMPTIONS.MAX_PAYBACK_MONTHS;

  if (isLossScenario) {
    salesPanel.classList.remove("hidden");
    metricsGrid.classList.add("hidden");
    chartWrap.classList.add("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  salesPanel.classList.add("hidden");
  metricsGrid.classList.remove("hidden");
  chartWrap.classList.remove("hidden");

  document.getElementById("metric-hours").textContent = fmt.int(result.hoursSavedPerMonth);
  document.getElementById("metric-savings").textContent = fmt.money(result.costSavingsPerMonth);
  document.getElementById("metric-roi").textContent = fmt.percent(result.roiPercent);

  const paybackEl = document.getElementById("metric-payback");
  if (result.paybackMonths > ASSUMPTIONS.MAX_PAYBACK_MONTHS) {
    paybackEl.textContent = "5+ years";
  } else {
    paybackEl.textContent = result.paybackMonths.toFixed(1) + " mo";
  }

  renderChart(input, result);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function init() {
  const form = document.getElementById("roi-form");
  const errorBox = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.textContent = "";

    const input = readForm();
    const errors = validate(input);
    if (errors.length) {
      errorBox.textContent = errors[0];
      return;
    }

    const result = calculate(input);
    showResults(input, result);
  });
}

document.addEventListener("DOMContentLoaded", init);
