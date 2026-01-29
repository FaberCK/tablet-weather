
import { useEffect, useState } from "react";
import { Clock } from "./Clock"; 

// Szybka poprawka - dodaj na górze WeatherDashboard.tsx
declare global {
  interface OWMForecast {
    list: any[];
  }
}

type OWMCurrent = {
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
const LAT = 52.17;
const LON = 21.06;

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

  async function fetchWeather() {
    try {
      setError(false);

      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`),
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        throw new Error("API error");
      }

      const currentData: OWMCurrent = await currentRes.json();
      const forecastData: { list: OWMForecastItem[] } = await forecastRes.json();

      setCurrent(currentData);
      setForecast(forecastData);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000); // co 10 min (prognoza co 3h)
    return () => clearInterval(id);
  }, []);

  if (!current && !error) {
    return <div className="screen">⏳</div>;
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
