import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
  ResponsiveContainer
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                 "Jul","Aug","Sep","Oct","Nov","Dec"];

const MONTH_MULTIPLIERS = [0.75,0.80,0.90,0.95,1.05,1.15,
                            1.20,1.18,1.08,0.95,0.82,0.72];

function buildMonthlyData(annualEnergyKwh) {
  const avgMonthly = annualEnergyKwh / 12;
  return MONTHS.map((month, i) => ({
    month,
    energy: parseFloat((avgMonthly * MONTH_MULTIPLIERS[i]).toFixed(1)),
  }));
}

function buildSavingsData(annualSavings, systemCost, years = 10) {
  let cumulative = 0;
  return Array.from({ length: years }, (_, i) => {
    cumulative += annualSavings;
    return {
      year:       `Year ${i + 1}`,
      savings:    parseFloat(cumulative.toFixed(0)),
      systemCost: parseFloat(systemCost),
    };
  });
}

function buildCo2Data(co2SavedKg) {
  return [
    { label: "Your solar savings",   kg: parseFloat(co2SavedKg.toFixed(0)) },
    { label: "Average car (annual)", kg: 2000 },
  ];
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#333333",
};

const itemStyle = { color: "#333333" };

export default function SolarDashboard({ result }) {
  if (!result) return null;

  const systemCost  = parseFloat(result.system_cost) || 0;
  const monthlyData = buildMonthlyData(result.annual_energy_kwh);
  const savingsData = buildSavingsData(result.annual_savings, systemCost);
  const co2Data     = buildCo2Data(result.co2_saved_kg);

  const paybackLabel = result.payback_years
    ? `Year ${Math.ceil(result.payback_years)}`
    : null;

  return (
    <div className="dashboard">

      <div className="card" style={{ overflow: "visible" }}>
        <h2 className="card-title">Monthly energy generation</h2>
        <p className="chart-subtitle">
          Estimated kWh generated per month based on seasonal patterns
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={monthlyData}
            margin={{ top: 8, right: 40, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" kWh" width={65} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={itemStyle}
              formatter={(v) => [`${v} kWh`, "Energy"]}
              isAnimationActive={false}
            />
            <Bar dataKey="energy" fill="#1D9E75" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ overflow: "visible" }}>
        <h2 className="card-title">10-year cumulative savings</h2>
        <p className="chart-subtitle">
          When the green line crosses the red line — that's your payback point
        </p>
        {systemCost === 0 ? (
          <p className="chart-subtitle" style={{ color: "#E24B4A" }}>
            System cost not provided — cannot draw payback line
          </p>
        ) : null}
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={savingsData}
            margin={{ top: 8, right: 40, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              width={70}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={itemStyle}
              formatter={(v, name) => [
                `₹${Number(v).toLocaleString("en-IN")}`,
                name === "savings" ? "Cumulative savings" : "System cost",
              ]}
              isAnimationActive={false}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {paybackLabel && (
              <ReferenceLine
                x={paybackLabel}
                stroke="#E24B4A"
                strokeDasharray="4 4"
                label={{ value: "Payback", fontSize: 11, fill: "#E24B4A" }}
              />
            )}
            <Line
              type="monotone" dataKey="savings"
              stroke="#1D9E75" strokeWidth={2}
              dot={false} name="savings"
            />
            <Line
              type="monotone" dataKey="systemCost"
              stroke="#E24B4A" strokeWidth={2}
              strokeDasharray="5 5" dot={false} name="systemCost"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ overflow: "visible" }}>
        <h2 className="card-title">CO₂ impact</h2>
        <p className="chart-subtitle">
          Your annual CO₂ savings vs an average car's yearly emissions (kg)
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={co2Data}
            layout="vertical"
            margin={{ top: 8, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis type="number" tick={{ fontSize: 11 }} unit=" kg" />
            <YAxis
              type="category" dataKey="label"
              tick={{ fontSize: 11 }} width={145}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={itemStyle}
              formatter={(v) => [`${Number(v).toLocaleString("en-IN")} kg`, "CO₂"]}
              isAnimationActive={false}
            />
            <Bar dataKey="kg" fill="#378ADD" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}