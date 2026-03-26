# SolarIQ — Location-Aware Solar Energy Estimation Platform

SolarIQ estimates rooftop solar potential for any location on Earth using 
machine learning, real-time weather data, and a custom-built global dataset 
from the NASA POWER API.

## Live Demo
[Frontend](#) · [Backend API](#)
*(links added after deployment)*

## What it does
- Select any location on an interactive map
- Fetches real-time weather via OpenWeather API
- Predicts solar radiation using a LightGBM model (R² = 0.93)
- Calculates annual energy generation, savings, payback period, CO₂ reduction
- Visualizes results with interactive charts
- Generates a downloadable PDF feasibility report

## Tech Stack

**Frontend:** React (Vite), Recharts, Leaflet  
**Backend:** Python, Flask, REST API  
**ML:** LightGBM, Scikit-learn, Pandas, NumPy  
**Data:** NASA POWER API, OpenWeather API  
**Deployment:** Netlify (frontend), Render (backend)

## ML Model

- Algorithm: LightGBM (leaf-wise gradient boosting)
- Dataset: 135,526 rows across 15 cities, 5 climate zones (built from NASA POWER API)
- Features: Temperature, Humidity, Wind Speed, Wind Direction, Hour, Month, Season, Latitude, Longitude
- Performance: R² = 0.93, MAE = 48.67 W/m²
- Compared against: Linear Regression (R²=0.37), Random Forest (R²=0.928), GradientBoosting (R²=0.893)

## Project Structure
```
solariq/
  backend/
    app.py              # Flask app factory
    config.py           # Centralized configuration
    routes/
      predict.py        # Prediction + PDF report routes
    services/
      weather.py        # OpenWeather API integration
      solar.py          # ML model + calculations
      pdf_report.py     # PDF generation (ReportLab)
    models/             # Trained model files (not in repo)
  frontend/
    src/
      App.jsx           # Main app component
      SolarDashboard.jsx # Recharts visualizations
      MapComponent.jsx  # Leaflet map
      WeatherForm.jsx   # Input form
```

## Setup

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Environment variables:**
```
OPENWEATHER_API_KEY=your_key
```

## Key Design Decisions

- **Service layer architecture** — routes handle HTTP only, business logic lives in services
- **NASA POWER dataset** — built custom global dataset instead of using a single-location Kaggle dataset
- **LightGBM over sklearn GBR** — leaf-wise growth and histogram-based splitting gives better accuracy and speed
- **Feature engineering** — extracted Hour, Month, Season from raw timestamps; added Lat/Lon for location awareness
- **Backend calculations** — all business logic (savings, payback, CO₂) computed server-side, not in React

## Author
Sama Rashmika Reddy — B.Tech Computer Science (AI/ML)