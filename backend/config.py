import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    MODEL_PATH    = os.path.join(BASE_DIR, "models", "solar_model.pkl")
    FEATURES_PATH = os.path.join(BASE_DIR, "models", "solar_features.pkl")
    PEAK_SUN_HOURS = 5
    CO2_PER_KWH    = 0.7