const cities = [
  { name: "Mumbai", region: "Maharashtra, India", latitude: 19.076, longitude: 72.878, icon: "🌦️" },
  { name: "Delhi", region: "Delhi, India", latitude: 28.614, longitude: 77.209, icon: "☀️" },
  { name: "Bengaluru", region: "Karnataka, India", latitude: 12.972, longitude: 77.595, icon: "🌤️" },
  { name: "Hyderabad", region: "Telangana, India", latitude: 17.385, longitude: 78.487, icon: "☀️" },
  { name: "Chennai", region: "Tamil Nadu, India", latitude: 13.083, longitude: 80.270, icon: "🌦️" },
  { name: "Kolkata", region: "West Bengal, India", latitude: 22.572, longitude: 88.364, icon: "🌧️" },
  { name: "Pune", region: "Maharashtra, India", latitude: 18.520, longitude: 73.856, icon: "🌤️" },
  { name: "Ahmedabad", region: "Gujarat, India", latitude: 23.022, longitude: 72.572, icon: "☀️" },
  { name: "Jaipur", region: "Rajasthan, India", latitude: 26.912, longitude: 75.787, icon: "☀️" },
  { name: "Lucknow", region: "Uttar Pradesh, India", latitude: 26.847, longitude: 80.947, icon: "🌤️" },
  { name: "Kochi", region: "Kerala, India", latitude: 9.932, longitude: 76.267, icon: "🌦️" },
  { name: "Bhopal", region: "Madhya Pradesh, India", latitude: 23.259, longitude: 77.413, icon: "🌤️" },
  { name: "Indore", region: "Madhya Pradesh, India", latitude: 22.719, longitude: 75.858, icon: "☀️" },
  { name: "Chandigarh", region: "Chandigarh, India", latitude: 30.734, longitude: 76.779, icon: "🌤️" },
  { name: "Guwahati", region: "Assam, India", latitude: 26.145, longitude: 91.736, icon: "🌧️" },
  { name: "Varanasi", region: "Uttar Pradesh, India", latitude: 25.317, longitude: 82.973, icon: "🌤️" },
  { name: "Surat", region: "Gujarat, India", latitude: 21.170, longitude: 72.831, icon: "☀️" },
  { name: "Nagpur", region: "Maharashtra, India", latitude: 21.146, longitude: 79.088, icon: "☀️" },
  { name: "Amritsar", region: "Punjab, India", latitude: 31.634, longitude: 74.872, icon: "🌤️" },
  { name: "Visakhapatnam", region: "Andhra Pradesh, India", latitude: 17.686, longitude: 83.218, icon: "🌦️" },
  { name: "San Francisco", region: "California, United States", latitude: 37.775, longitude: -122.419, icon: "☁️" },
  { name: "New York", region: "New York, United States", latitude: 40.713, longitude: -74.006, icon: "☀️" },
  { name: "London", region: "England, United Kingdom", latitude: 51.507, longitude: -0.128, icon: "🌦️" },
  { name: "Tokyo", region: "Tokyo, Japan", latitude: 35.676, longitude: 139.650, icon: "🌤️" },
  { name: "Paris", region: "Île-de-France, France", latitude: 48.857, longitude: 2.352, icon: "⛅" },
  { name: "Sydney", region: "New South Wales, Australia", latitude: -33.869, longitude: 151.209, icon: "☀️" }
];

const cityList = document.getElementById("city-list");
const searchForm = document.getElementById("city-search");
const cityInput = document.getElementById("city-input");
const searchMessage = document.getElementById("search-message");
const searchResults = document.getElementById("search-results");
const dataStatus = document.getElementById("data-status");
let matchedLocations = [];
let selectedCity = "Mumbai";
let selectedLocation = cities[0];
let unit = "C";
let messageTimer;
let requestId = 0;

function toDisplay(celsius) {
  return unit === "C" ? Math.round(celsius) : Math.round(celsius * 9 / 5 + 32);
}

function weatherDescription(code) {
  if (code === 0) return ["Clear sky", "☀️"];
  if ([1, 2].includes(code)) return ["Partly cloudy", "⛅"];
  if (code === 3) return ["Overcast", "☁️"];
  if ([45, 48].includes(code)) return ["Foggy", "🌫️"];
  if ([51, 53, 55, 56, 57].includes(code)) return ["Drizzle", "🌦️"];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["Rain", "🌧️"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["Snow", "❄️"];
  if ([95, 96, 99].includes(code)) return ["Thunderstorms", "⛈️"];
  return ["Current conditions", "🌤️"];
}

function renderCities() {
  cityList.innerHTML = cities.map((city) => `
    <button type="button" class="city-button${city.name === selectedCity ? " active" : ""}" data-city="${city.name}" aria-pressed="${city.name === selectedCity}">
      <span class="city-symbol" aria-hidden="true">${city.icon}</span>${city.name}
    </button>
  `).join("");
}

function showMessage(message) {
  searchMessage.textContent = message;
  searchMessage.classList.add("show");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => searchMessage.classList.remove("show"), 3500);
}

function setLoading(isLoading) {
  dataStatus.textContent = isLoading ? "LOADING…" : "LIVE WEATHER";
  dataStatus.classList.toggle("loading", isLoading);
}

async function loadWeather(location, displayName = location.name, region = location.region) {
  const thisRequest = ++requestId;
  searchResults.hidden = true;
  selectedCity = displayName;
  selectedLocation = location;
  document.getElementById("city-title").textContent = displayName;
  document.getElementById("location-line").textContent = region || "";
  document.getElementById("condition").textContent = "Loading current conditions…";
  setLoading(true);
  renderCities();

  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "5",
    timezone: "auto"
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!response.ok) throw new Error("Weather service unavailable");
    const data = await response.json();
    if (thisRequest !== requestId) return;

    const current = data.current;
    const daily = data.daily;
    if (!current || !daily?.time?.length) throw new Error("Weather data is incomplete");

    const [condition, icon] = weatherDescription(current.weather_code);
    document.getElementById("condition").textContent = condition;
    document.getElementById("temperature").textContent = toDisplay(current.temperature_2m);
    document.getElementById("feels-like").textContent = `${toDisplay(current.apparent_temperature)}°`;
    document.getElementById("high-low").textContent = `H: ${toDisplay(daily.temperature_2m_max[0])}°   L: ${toDisplay(daily.temperature_2m_min[0])}°`;
    document.getElementById("current-date").textContent = `${icon} Live conditions · updated ${new Date(current.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    document.getElementById("detail-feels").textContent = `${toDisplay(current.apparent_temperature)}°`;
    document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
    document.getElementById("wind").textContent = `${Math.round(current.wind_speed_10m)} km/h`;

    const uv = Math.round(current.uv_index ?? 0);
    document.getElementById("uv").innerHTML = `${uv} <small>${uv >= 8 ? "Very high" : uv >= 6 ? "High" : uv >= 3 ? "Moderate" : "Low"}</small>`;
    document.getElementById("feels-description").textContent = current.apparent_temperature >= 30
      ? "Warm in the sunshine"
      : current.apparent_temperature <= 15 ? "A little on the cool side" : "Just about right";

    document.getElementById("forecast-grid").innerHTML = daily.time.map((date, index) => {
      const [dayCondition, dayIcon] = weatherDescription(daily.weather_code[index]);
      const dayName = index === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
      return `<article class="forecast-card" aria-label="${dayName}: ${dayCondition}, high ${toDisplay(daily.temperature_2m_max[index])} degrees, low ${toDisplay(daily.temperature_2m_min[index])} degrees">
        <span class="forecast-day">${dayName}</span><span class="forecast-icon" aria-hidden="true">${dayIcon}</span>
        <span class="forecast-temperatures"><span>${toDisplay(daily.temperature_2m_max[index])}°</span><span class="forecast-low">${toDisplay(daily.temperature_2m_min[index])}°</span></span>
      </article>`;
    }).join("");
    setLoading(false);
  } catch (error) {
    if (thisRequest !== requestId) return;
    dataStatus.textContent = "OFFLINE";
    dataStatus.classList.remove("loading");
    document.getElementById("condition").textContent = "Weather unavailable right now";
    document.getElementById("current-date").textContent = "Check your connection and try again.";
    showMessage("Could not load live weather. Check your connection and try again.");
  }
}

async function searchCity(query) {
  searchResults.hidden = true;
  const known = cities.find((city) => city.name.toLowerCase() === query.toLowerCase());
  if (known) {
    loadWeather(known);
    return;
  }

  const thisRequest = ++requestId;
  setLoading(true);
  try {
    const params = new URLSearchParams({ name: query, count: "5", language: "en", format: "json" });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!response.ok) throw new Error("Location search unavailable");
    const results = (await response.json()).results;
    if (thisRequest !== requestId) return;
    if (!results?.length) {
      setLoading(false);
      showMessage(`No city found for “${query}”. Try another spelling or add the country name.`);
      return;
    }
    if (results.length === 1) {
      const place = results[0];
      loadWeather(place, place.name, [place.admin1, place.country].filter(Boolean).join(", "));
      return;
    }

    matchedLocations = results;
    searchResults.replaceChildren();
    results.forEach((place, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-result";
      option.setAttribute("role", "option");
      option.dataset.resultIndex = index;
      const name = document.createElement("span");
      name.textContent = place.name;
      const detail = document.createElement("small");
      detail.textContent = [place.admin1, place.country].filter(Boolean).join(", ");
      option.append(name, detail);
      searchResults.append(option);
    });
    searchResults.hidden = false;
    setLoading(false);
  } catch (error) {
    if (thisRequest !== requestId) return;
    dataStatus.textContent = "OFFLINE";
    dataStatus.classList.remove("loading");
    showMessage("Could not search for that city. Check your connection and try again.");
  }
}

cityList.addEventListener("click", (event) => {
  const button = event.target.closest(".city-button");
  if (!button) return;
  const city = cities.find((item) => item.name === button.dataset.city);
  if (city) loadWeather(city);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (!query) return;
  cityInput.value = "";
  searchCity(query);
});

searchResults.addEventListener("click", (event) => {
  const option = event.target.closest(".search-result");
  if (!option) return;
  const place = matchedLocations[Number(option.dataset.resultIndex)];
  if (!place) return;
  const region = [place.admin1, place.country].filter(Boolean).join(", ");
  loadWeather(place, place.name, region);
});

document.querySelectorAll(".unit").forEach((button) => {
  button.addEventListener("click", () => {
    unit = button.dataset.unit;
    document.querySelectorAll(".unit").forEach((option) => {
      const isActive = option === button;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });
    loadWeather(selectedLocation, selectedCity, document.getElementById("location-line").textContent);
  });
});

const today = new Date();
document.getElementById("today-label").textContent = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
renderCities();
loadWeather(cities[0]);
