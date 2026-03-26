import { useState } from "react";
import MapComponent from "./MapComponent";
import WeatherForm from "./WeatherForm";
import SolarDashboard from "./SolarDashboard";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

function App() {
  const [location, setLocation]       = useState(null);
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  const handleSubmit = async (params) => {
    if (!location) {
      setError("Please click on the map to select a location first.");
      return;
    }

    const { roofArea, efficiency, tariff, systemCost } = params;
    if (!roofArea || !efficiency || !tariff || !systemCost) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors([]);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat:        location.lat,
          lng:        location.lng,
          roofArea:   parseFloat(roofArea),
          efficiency: parseFloat(efficiency),
          tariff:     parseFloat(tariff),
          systemCost: parseFloat(systemCost),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else {
          setError(data.error || "Something went wrong.");
        }
        return;
      }

      setResult({ ...data.result, system_cost: parseFloat(systemCost) });

    } catch (err) {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, location }),
      });

      if (!response.ok) {
        setError("Failed to generate report.");
        return;
      }

      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "solariq_report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Could not download report.");
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>SolarIQ</h1>
        <p className="app-subtitle">
          Click on the map, enter your rooftop details, and estimate
          solar output, savings, and payback period.
        </p>
      </header>

      <main className="app-layout">
        <section className="map-panel card">
          <h2 className="card-title">Select Location</h2>
          <MapComponent onLocationSelect={(latlng) => setLocation(latlng)} />
          {location && (
            <p className="location-text">
              Selected: <span>{location.lat.toFixed(4)}</span>,{" "}
              <span>{location.lng.toFixed(4)}</span>
            </p>
          )}
        </section>

        <section className="side-panel">
          <div className="card">
            <h2 className="card-title">Your Rooftop Details</h2>
            <WeatherForm onSubmit={handleSubmit} />
          </div>

          {loading && (
            <p className="info-text">Fetching weather and calculating...</p>
          )}

          {error && (
            <p className="error-text">Error: {error}</p>
          )}

          {fieldErrors.length > 0 && (
            <div className="card error-card">
              <p className="error-title">Please fix the following:</p>
              <ul>
                {fieldErrors.map((e, i) => (
                  <li key={i} className="error-text">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <>
              <div className="card card-highlight">
                <h2 className="card-title">Results</h2>
                <p className="metric">
                  <span>Instant Radiation</span>
                  <strong>{result.predicted_radiation.toFixed(2)} W/m²</strong>
                </p>
                <p className="metric">
                  <span>Annual Radiation</span>
                  <strong>{result.annual_radiation_kwh_m2.toFixed(2)} kWh/m²/yr</strong>
                </p>
                <p className="metric">
                  <span>Annual Energy</span>
                  <strong>{result.annual_energy_kwh.toFixed(2)} kWh</strong>
                </p>
                <p className="metric">
                  <span>Annual Savings</span>
                  <strong>₹ {result.annual_savings.toFixed(0)}</strong>
                </p>
                <p className="metric">
                  <span>Payback Period</span>
                  <strong>
                    {result.payback_years
                      ? `${result.payback_years.toFixed(1)} years`
                      : "N/A"}
                  </strong>
                </p>
                <p className="metric">
                  <span>CO₂ Saved</span>
                  <strong>{result.co2_saved_kg.toFixed(0)} kg/yr</strong>
                </p>
                <button className="download-btn" onClick={handleDownloadReport}>
                  Download PDF Report
                </button>
              </div>
              <SolarDashboard result={result} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;