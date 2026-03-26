import requests
from config import Config

def fetch_weather(lat: float, lon: float) -> dict:
    if not Config.OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not set")

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={Config.OPENWEATHER_API_KEY}&units=metric"
    )

    response = requests.get(url, timeout=10)
    response.raise_for_status()
    data = response.json()

    temp_c     = data["main"]["temp"]
    pressure   = data["main"]["pressure"]
    humidity   = data["main"]["humidity"]
    wind_speed = data["wind"].get("speed", 0.0)
    wind_dir   = data["wind"].get("deg", 0.0)
    unixtime   = data["dt"]

    return {
        "unixtime":              unixtime,
        "temperature":           temp_c * 9/5 + 32,
        "pressure":              pressure * 0.0295299830714,
        "humidity":              humidity,
        "wind_direction_degrees": wind_dir,
        "speed":                 wind_speed * 2.23693629,
    }