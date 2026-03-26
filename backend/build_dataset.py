import requests
import pandas as pd
import time
import os

CITIES = [
    {"name": "Mumbai",      "lat": 19.07, "lon": 72.87},
    {"name": "Delhi",       "lat": 28.61, "lon": 77.20},
    {"name": "Hyderabad",   "lat": 17.38, "lon": 78.48},
    {"name": "Chennai",     "lat": 13.08, "lon": 80.27},
    {"name": "Bangalore",   "lat": 12.97, "lon": 77.59},
    {"name": "Dubai",       "lat": 25.20, "lon": 55.27},
    {"name": "Riyadh",      "lat": 24.68, "lon": 46.72},
    {"name": "London",      "lat": 51.50, "lon": -0.12},
    {"name": "Berlin",      "lat": 52.52, "lon": 13.40},
    {"name": "Madrid",      "lat": 40.41, "lon": -3.70},
    {"name": "New York",    "lat": 40.71, "lon": -74.00},
    {"name": "Los Angeles", "lat": 34.05, "lon": -118.24},
    {"name": "Singapore",   "lat":  1.35, "lon": 103.81},
    {"name": "Sydney",      "lat": -33.86,"lon": 151.20},
    {"name": "Cairo",       "lat": 30.04, "lon": 31.23},
]

# one year at a time — NASA hourly limit
YEARS = [2022, 2023]

# parameters available hourly under SB community
PARAMETERS = "T2M,RH2M,WD10M,WS10M,ALLSKY_SFC_SW_DWN"


def fetch_city_year(city: dict, year: int) -> pd.DataFrame:
    params = {
        "start":        f"{year}0101",
        "end":          f"{year}1231",
        "latitude":     city["lat"],
        "longitude":    city["lon"],
        "community":    "RE",
        "parameters":   "T2M,RH2M,WD10M,WS10M,ALLSKY_SFC_SW_DWN",
        "format":       "JSON",
        "user":         "solariqproject",
        "header":       "true",
        "time-standard":"LST",
    }

    response = requests.get(
        "https://power.larc.nasa.gov/api/temporal/hourly/point",
        params=params,
        timeout=120
    )

    if response.status_code == 422:
        print(f"    422 error: {response.text[:200]}")
        return None

    response.raise_for_status()
    data = response.json()
    params_data = data["properties"]["parameter"]

    timestamps = list(params_data["T2M"].keys())

    df = pd.DataFrame({
        "Temperature":            list(params_data["T2M"].values()),
        "Humidity":               list(params_data["RH2M"].values()),
        "WindDirection(Degrees)": list(params_data["WD10M"].values()),
        "Speed":                  list(params_data["WS10M"].values()),
        "Radiation":              list(params_data["ALLSKY_SFC_SW_DWN"].values()),
        "City":                   city["name"],
        "Latitude":               city["lat"],
        "Longitude":              city["lon"],
    })

    df["Hour"]   = [int(t[8:10]) for t in timestamps]
    df["Month"]  = [int(t[4:6])  for t in timestamps]
    df["Season"] = df["Month"].map({
        12: 0, 1: 0, 2: 0,
         3: 1, 4: 1, 5: 1,
         6: 2, 7: 2, 8: 2,
         9: 3, 10: 3, 11: 3
    })

    return df


def build_dataset():
    all_dfs = []

    for city in CITIES:
        print(f"\nFetching {city['name']}...")
        city_dfs = []

        for year in YEARS:
            print(f"  Year {year}...")
            try:
                df = fetch_city_year(city, year)
                if df is not None:
                    city_dfs.append(df)
                    print(f"    Got {len(df)} rows")
            except Exception as e:
                print(f"    Failed: {e}")

            time.sleep(2)

        if city_dfs:
            city_combined = pd.concat(city_dfs, ignore_index=True)
            all_dfs.append(city_combined)

    if not all_dfs:
        print("\nNo data collected. Check your internet connection.")
        return None

    combined = pd.concat(all_dfs, ignore_index=True)

    # remove nighttime (radiation = 0) and missing values (-999)
    combined = combined[combined["Radiation"] > 0]
    combined = combined[combined["Radiation"] > -900]
    combined = combined[combined["Temperature"] > -900]
    combined = combined[combined["Humidity"] > -900]

    os.makedirs("data", exist_ok=True)
    combined.to_csv("data/solar_global.csv", index=False)

    print(f"\nDataset built successfully!")
    print(f"Total rows:  {len(combined)}")
    print(f"Cities:      {combined['City'].nunique()}")
    print(f"Columns:     {list(combined.columns)}")
    print(f"Saved to:    data/solar_global.csv")

    return combined


if __name__ == "__main__":
    build_dataset()