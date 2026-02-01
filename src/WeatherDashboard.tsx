import { useEffect, useState } from "react";
import { Clock } from "./Clock"; 

// Szybka poprawka - dodaj na górze WeatherDashboard.tsx
declare global {
  interface OWMForecast {
    list: any[];
  }
}

type OWMCurrent = {
  name: string; // Add city name
  main: {
    temp: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg?: number;
  };
  weather: Array<{ id: number }>;
  dt: number;
};

// interface OWMForecast {
//   list: OWMForecastItem[];
// }

type OWMForecastItem = {
  dt: number;
  main: {
    temp: number;
    pressure: number;
  };
  wind: {
    deg: number;
  };
  weather: Array<{ id: number }>;
};

const API_KEY = "2685669859a3d2e78e0cce765a0ecb41"; 
// Remove hardcoded LAT and LON

function iconFromOWMId(id: number): string {
  if (id >= 200 && id <= 232) return "⛈️";
  if (id >= 300 && id <= 321) return "🌦️";
  if (id >= 500 && id <= 531) return "🌧️";
  if (id >= 600 && id <= 622) return "🌨️";
  if (id >= 700 && id <= 781) return "🌫️";
  if (id === 800) return "☀️";
  if (id === 801) return "🌤️";
  if (id === 802) return "⛅";
  if (id >= 803 && id <= 804) return "☁️";
  return "❓";
}

function windArrowFromDegrees(deg: number): string {
  if (deg >= 337.5 || deg < 22.5) return "⬇️";
  if (deg >= 22.5 && deg < 67.5) return "↙️";
  if (deg >= 67.5 && deg < 112.5) return "⬅️";
  if (deg >= 112.5 && deg < 157.5) return "↖️";
  if (deg >= 157.5 && deg < 202.5) return "⬆️";
  if (deg >= 202.5 && deg < 247.5) return "↗️";
  if (deg >= 247.5 && deg < 292.5) return "➡️";
  return "↘️";
}

function pressureTrendArrow(forecast: { list: OWMForecastItem[] } | null): string {
  if (!forecast || !forecast.list || forecast.list.length < 2) {
    return "⏺️"; // fallback gdy brak danych prognozy
  }
  
  const last = forecast.list[0].main.pressure;
  const prev = forecast.list[1].main.pressure;
  const diff = last - prev;
  
  if (diff > 0.5) return "⬆️";
  if (diff < -0.5) return "⬇️";
  return "⏺️";
}


type HourSlot = {
  time: number;
  temp: number;
  iconId: number;
};

function buildNextHours(forecast: OWMForecastItem[] | null, count = 6): HourSlot[] {
  if (!forecast) return [];
  const now = Date.now() / 1000;
  const slots: HourSlot[] = [];

  for (const item of forecast) {
    if (item.dt >= now || slots.length < 2) {
      slots.push({
        time: item.dt,
        temp: item.main.temp,
        iconId: item.weather[0].id,
      });
      if (slots.length >= count) break;
    }
  }
  return slots;
}

export function WeatherDashboard() {
  const [current, setCurrent] = useState<OWMCurrent | null>(null);
  const [forecast, setForecast] = useState<{ list: OWMForecastItem[] } | null>(null);
  const [error, setError] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null); // Add city state
  const [showCityInput, setShowCityInput] = useState(false);
  const [cityInput, setCityInput] = useState("");

  async function fetchWeather() {
    if (!lat || !lon) return; // Wait for geolocation
    try {
      setError(false);

      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        throw new Error("API error");
      }

      const currentData: OWMCurrent = await currentRes.json();
      const forecastData: { list: OWMForecastItem[] } = await forecastRes.json();

      setCurrent(currentData);
      setForecast(forecastData);
      setCity(currentData.name); // Set city from API
    } catch {
      setError(true);
    }
  }

  async function fetchCoordsFromCity(cityName: string) {
    try {
      setError(false);
      const res = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.length === 0) throw new Error();
      setLat(data[0].lat);
      setLon(data[0].lon);
      setCity(cityName);
    } catch {
      setError(true);
    }
  }

  function getGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLon(position.coords.longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError(true);
          setShowCityInput(true);
        }
      );
    } else {
      setError(true);
      setShowCityInput(true);
    }
  }

  useEffect(() => {
    getGeolocation();
  }, []);

  useEffect(() => {
    if (lat && lon) {
      fetchWeather();
      const id = setInterval(fetchWeather, 10 * 60 * 1000);
      return () => clearInterval(id);
    }
  }, [lat, lon]);

  if (!current) {
    if (showCityInput) {
      return (
        <div className="screen">
          <div>Enter city name:</div>
          <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
          <button onClick={() => { fetchCoordsFromCity(cityInput); setShowCityInput(false); }}>Submit</button>
        </div>
      );
    } else {
      return <div className="screen">⏳</div>;
    }
  }

  const nextHours = buildNextHours(forecast?.list ?? null);
  const pressureIcon = pressureTrendArrow(forecast);
  const pressureNow = current ? Math.round(current.main.pressure) : null;
  const windDeg = current?.wind.deg ?? 0;



  return (
    <div className="screen">
      {error && <div className="status status-error">⚠️</div>}

      {current && (
        <>
          <div>
            <Clock />
          </div>
          <div className="icon-big">
            {iconFromOWMId(current.weather[0].id)}
          </div>
          <div className="temperature">
            {Math.round(current.main.temp)}°C
          </div>
          {city && <div className="city">{city}</div>} {/* Display city */}
          <div className="details-row">
            <div className="detail">
              💨 {Math.round(current.wind.speed * 3.6)} km/h
            </div>
            <div className="detail">
              {windArrowFromDegrees(windDeg)} {Math.round(windDeg)}°
            </div>
            {pressureNow && (
              <div className="detail">
                {pressureIcon} {pressureNow} hPa
              </div>
            )}
            <div className="detail">
              🕒 {new Date(current.dt * 1000).toLocaleTimeString()}
            </div>
          </div>

          {nextHours.length > 0 && (
            <div className="hourly-strip">
              {nextHours.map((h) => (
                <div key={h.time} className="hourly-item">
                  <div className="hourly-time">
                    {new Date(h.time * 1000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="hourly-icon">
                    {iconFromOWMId(h.iconId)}
                  </div>
                  <div className="hourly-temp">
                    {Math.round(h.temp)}°C
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
