import joblib
import pandas as pd
from datetime import datetime, timezone
from config import Config

model = None
EXPECTED_FEATURES = None

def load_model():
    global model, EXPECTED_FEATURES
    try:
        model = joblib.load(Config.MODEL_PATH)
        EXPECTED_FEATURES = joblib.load(Config.FEATURES_PATH)
        print("Model and features loaded successfully")
        print("Expected features:", EXPECTED_FEATURES)
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None
        EXPECTED_FEATURES = None

def is_model_loaded() -> bool:
    return model is not None and EXPECTED_FEATURES is not None

def validate_inputs(lat: float, lng: float, roof_area: float,
                    efficiency: float, tariff: float, system_cost: float):
    errors = []
    if not (-90 <= lat <= 90):
        errors.append("Latitude must be between -90 and 90")
    if not (-180 <= lng <= 180):
        errors.append("Longitude must be between -180 and 180")
    if roof_area <= 0:
        errors.append("Roof area must be greater than 0")
    if not (0 < efficiency <= 1):
        errors.append("Efficiency must be between 0 and 1")
    if tariff <= 0:
        errors.append("Tariff must be greater than 0")
    if system_cost <= 0:
        errors.append("System cost must be greater than 0")
    return errors

def build_input_dataframe(weather: dict, lat: float, lng: float) -> pd.DataFrame:
    # get current time features
    now = datetime.now(timezone.utc)
    hour   = now.hour
    month  = now.month
    season = {12:0,1:0,2:0,3:1,4:1,5:1,
               6:2,7:2,8:2,9:3,10:3,11:3}[month]

    input_dict = {
        "Temperature":            float(weather["temperature"]),
        "Humidity":               float(weather["humidity"]),
        "WindDirection(Degrees)": float(weather["wind_direction_degrees"]),
        "Speed":                  float(weather["speed"]),
        "Hour":                   hour,
        "Month":                  month,
        "Season":                 season,
        "Latitude":               lat,
        "Longitude":              lng,
    }

    row = {feat: input_dict[feat] for feat in EXPECTED_FEATURES}
    return pd.DataFrame([row])

def predict_solar(weather: dict, lat: float, lng: float, roof_area: float,
                  efficiency: float, tariff: float, system_cost: float) -> dict:

    input_df = build_input_dataframe(weather, lat, lng)
    radiation = float(model.predict(input_df)[0])
    radiation = max(0.0, radiation)

    annual_radiation = radiation * Config.PEAK_SUN_HOURS * 365 / 1000.0
    annual_energy    = annual_radiation * roof_area * efficiency
    annual_savings   = annual_energy * tariff
    payback_years    = system_cost / annual_savings if annual_savings > 0 else None
    co2_saved        = annual_energy * Config.CO2_PER_KWH

    return {
        "predicted_radiation":     round(radiation, 2),
        "annual_radiation_kwh_m2": round(annual_radiation, 2),
        "annual_energy_kwh":       round(annual_energy, 2),
        "annual_savings":          round(annual_savings, 2),
        "payback_years":           round(payback_years, 2) if payback_years else None,
        "co2_saved_kg":            round(co2_saved, 2),
        "system_cost":             round(system_cost, 2),
    }