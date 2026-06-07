import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OPENWEATHER_API_KEY =
  process.env.OPENWEATHER_API_KEY || "5ce1a56ac2ad0a8e49b5b8f4a48f7580";

// In-memory cache: { lat, lon, time, data, timestamp }
const CACHE = [];
const CACHE_RADIUS_KM = 10; // 10km radius
const CACHE_TIME_WINDOW_SEC = 1800; // +/- 30 minutes

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function findInCache(lat, lon, time) {
  // time is the target simulation time
  for (const entry of CACHE) {
    const dist = getDistanceFromLatLonInKm(lat, lon, entry.lat, entry.lon);
    const timeDiff = Math.abs(entry.time - time);

    if (dist <= CACHE_RADIUS_KM && timeDiff <= CACHE_TIME_WINDOW_SEC) {
      return entry.data;
    }
  }
  return null;
}

app.get("/api/aqi", async (req, res) => {
  const { lat, lon, time } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing lat/lon parameters" });
  }

  if (!OPENWEATHER_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server missing OPENWEATHER_API_KEY" });
  }

  // Determine which API to call based on time
  // time is expected to be a Unix timestamp (seconds)
  const targetTime = time ? parseInt(time) : Math.floor(Date.now() / 1000);

  // Check Cache First
  const cachedData = findInCache(parseFloat(lat), parseFloat(lon), targetTime);
  if (cachedData) {
    console.log(`[CACHE HIT] Lat:${lat} Lon:${lon} Time:${targetTime}`);
    return res.json(cachedData);
  }
  const now = Math.floor(Date.now() / 1000);

  // Time windows
  const ONE_HOUR = 3600;
  const FIVE_DAYS = 5 * 24 * 3600;

  let url = "";
  let mode = "current";

  // If targetTime is close to now, use current
  if (Math.abs(targetTime - now) < ONE_HOUR) {
    mode = "current";
    url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  }
  // If targetTime is in the future (within 5 days), use forecast
  else if (targetTime > now && targetTime < now + FIVE_DAYS) {
    mode = "forecast";
    url = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
  }
  // If targetTime is in the past, use history
  else {
    mode = "history";
    // OpenWeatherMap history requires start/end. We'll ask for a small window around the target time.
    // E.g., [targetTime - 1h, targetTime + 1h] to be safe, or just specific day.
    // It returns hourly data.
    const start = targetTime - ONE_HOUR;
    const end = targetTime + ONE_HOUR;
    url = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OPENWEATHER_API_KEY}`;
  }

  console.log(
    `[${mode.toUpperCase()}] Requesting AQI for time ${new Date(targetTime * 1000).toISOString()}`,
  );

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenWeather API Error: ${response.status} - ${text}`);
    }

    const data = await response.json();

    // For forecast and history, we get a list. We need to find the item closest to targetTime.
    if (mode === "forecast" || mode === "history") {
      if (data.list && data.list.length > 0) {
        // Find closest
        const closest = data.list.reduce((prev, curr) => {
          return Math.abs(curr.dt - targetTime) < Math.abs(prev.dt - targetTime)
            ? curr
            : prev;
        });

        const result = {
          coord: data.coord,
          list: [closest],
          mode: mode,
        };

        // Cache it
        CACHE.push({
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          time: targetTime,
          data: result,
        });
        // Limit cache size casually
        if (CACHE.length > 500) CACHE.shift();

        res.json(result);
      } else {
        res.json({
          list: [],
          mode: mode,
          message: "No data found for this time range",
        });
      }
    } else {
      // Current returns list of 1 usually
      const result = { ...data, mode: mode };
      CACHE.push({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        time: targetTime,
        data: result,
      });
      if (CACHE.length > 500) CACHE.shift();

      res.json(result);
    }
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AQI Backend running on http://localhost:${PORT}`);
});
