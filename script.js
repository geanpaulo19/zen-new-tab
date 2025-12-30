/* =========================
   TIME & DATE FUNCTIONS
========================= */
let lastTimeStr = "";
let userHourPreference = null;

function isSystem24Hour() {
  const testDate = new Date(Date.UTC(2020, 0, 1, 13, 0, 0));
  const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).formatToParts(testDate);
  return !parts.some(p => p.type === "dayPeriod");
}

const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");

// Initialize spans for each character
function initTimeSpans(timeStr) {
  if (!timeEl) return;
  timeEl.textContent = "";
  return timeStr.split("").map(char => {
    const span = document.createElement("span");
    span.textContent = char;
    span.style.display = "inline-block";
    span.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    timeEl.appendChild(span);
    return span;
  });
}

// Animate a digit that changes
function animateDigit(span, newChar) {
  if (!span || span.textContent === newChar) return;
  span.style.transform = "translateY(-15px)";
  span.style.opacity = "0";
  setTimeout(() => {
    span.textContent = newChar;
    span.style.transform = "translateY(0)";
    span.style.opacity = "1";
  }, 300);
}

function updateTimeDigits(force = false) {
  const now = new Date();
  const use24Hour = userHourPreference !== null ? userHourPreference : isSystem24Hour();
  let rawTime = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: !use24Hour
  });

  // Strip AM/PM if using 12-hour format
  if (!use24Hour) {
    rawTime = rawTime.replace(/\s?(AM|PM|am|pm)$/i, "");
  }

  // Reinitialize spans if first run, forced, or length changed (hour rollover)
  if (!timeEl._spans || force || timeEl._spans.length !== rawTime.length) {
    timeEl._spans = initTimeSpans(rawTime);
  } else {
    // Animate only changed digits
    for (let i = 0; i < rawTime.length; i++) {
      animateDigit(timeEl._spans[i], rawTime[i]);
    }
  }

  lastTimeStr = rawTime;

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  }
}

// Load saved preference
const storedHourFormat = localStorage.getItem("hourFormat");
if (storedHourFormat === "24") userHourPreference = true;
if (storedHourFormat === "12") userHourPreference = false;

if (timeEl) {
  timeEl.addEventListener("click", () => {
    userHourPreference = userHourPreference === null ? !isSystem24Hour() : !userHourPreference;
    localStorage.setItem("hourFormat", userHourPreference ? "24" : "12");
    showToast(userHourPreference ? "24-hour format" : "12-hour format");
    updateTimeDigits(true);
  });
}

// Tooltip
(function addTimeTooltip() {
  if (!timeEl) return;
  let tooltip;
  timeEl.addEventListener("mouseenter", () => {
    if (tooltip) return;
    tooltip = document.createElement("div");
    tooltip.textContent = "Click to toggle 12/24 hour format";
    tooltip.style.cssText = `
      position: fixed; padding: 6px 12px; font-size: 0.8rem;
      color: #fff; background: rgba(0,0,0,0.5); border-radius: 999px;
      opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
      z-index: 999; white-space: nowrap;
    `;
    document.body.appendChild(tooltip);
    const rect = timeEl.getBoundingClientRect();
    let top = rect.top - 36;
    if (top < 6) top = rect.bottom + 6;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.transform = "translateX(-50%)";
    requestAnimationFrame(() => tooltip.style.opacity = "1");
  });
  timeEl.addEventListener("mouseleave", () => {
    if (!tooltip) return;
    tooltip.style.opacity = "0";
    setTimeout(() => tooltip?.remove(), 250);
    tooltip = null;
  });
})();

// Initialize and start updates
updateTimeDigits(true);
setInterval(updateTimeDigits, 1000);

/* =========================
   TOAST FUNCTIONS
========================= */
function showToast(message) {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 14px;
      font-size: 0.85rem;
      color: #fff;
      background: rgba(0,0,0,0.6);
      border-radius: 999px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 9999;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toast._hideTimer);

  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
  }, 1400);
}

/* =========================
   MINI CALENDAR ON DATE HOVER FUNCTIONS
========================= */
(function addDateCalendarTooltip() {
  if (!dateEl) return;
  let tip;

  function generateCalendarHTML(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    let html = `<div style="
                  font-size:0.85rem;
                  text-align:center;
                  margin-bottom:6px;
                  font-weight:500;
                  padding:2px 0;
                ">
                  ${date.toLocaleString(undefined,{month:"short",year:"numeric"})}
                </div>`;

    html += `<div style="
                display:grid;
                grid-template-columns:repeat(7,1fr);
                gap:4px;
                font-size:.75rem;
                text-align:center;
              ">`;

    const weekdays = ["Su","Mo","Tu","We","Th","Fr","Sa"];
    weekdays.forEach(d => html += `<div style="font-weight:bold;color:rgba(255,255,255,0.7);">${d}</div>`);

    for(let i=0;i<firstDay;i++) html += `<div></div>`; // empty slots

    for(let d=1;d<=lastDate;d++){
      const isToday = d===date.getDate();
      html += `<div style="
        padding:4px 0;
        border-radius:4px;
        ${isToday ? "background:rgba(255,255,255,0.15);font-weight:bold;" : ""}
      ">${d}</div>`;
    }

    html += `</div>`;
    return html;
  }

  dateEl.addEventListener("mouseenter", () => {
    if (tip) return;
    tip = document.createElement("div");
    tip.id = "calendar-tip";
    tip.innerHTML = generateCalendarHTML(new Date());
    tip.style.cssText = `
      position: fixed;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      color: #fff;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 0.75rem;
      z-index: 999;
      pointer-events: none;
      opacity: 0;
      min-width: 180px;
      max-width: 260px;
      transition: opacity 0.2s ease;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25);
    `;

    document.body.appendChild(tip);

    const rect = dateEl.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    const padding = 6;
    left = Math.max(padding, Math.min(left, window.innerWidth - tipRect.width - padding));
    tip.style.left = `${left}px`;

    let top = rect.bottom + 4;
    if (top + tipRect.height > window.innerHeight) top = rect.top - tipRect.height - 4;
    tip.style.top = `${top}px`;

    requestAnimationFrame(() => tip.style.opacity = "1");
  });

  dateEl.addEventListener("mouseleave", () => {
    if (!tip) return;
    tip.style.opacity = "0";
    setTimeout(() => tip?.remove(), 200);
    tip = null;
  });
})();

/* =========================
   RANDOM SHORT QUOTE FUNCTIONS
========================= */
async function setRandomQuote() {
  const quoteEl = document.getElementById("mantra");
  if (!quoteEl) return;
  quoteEl.style.opacity = "0";
  quoteEl.style.transition = "opacity 1s ease";

  const MAX_ATTEMPTS = 5;
  let quoteText = "", quoteAuthor = "";
  for (let attempts = 0; attempts < MAX_ATTEMPTS; attempts++) {
    try {
      const res = await fetch("https://quoteslate.vercel.app/api/quotes/random");
      if (!res.ok) continue;
      const data = await res.json();
      if (data.quote && data.quote.length <= 120) {
        quoteText = data.quote;
        quoteAuthor = (data.author || "Unknown").replace(/^[-–—]\s*/, "");
        break;
      }
    } catch {}
  }

  if (!quoteText) {
    quoteText = "Stay inspired today!";
    quoteAuthor = "";
  }

  quoteEl.innerHTML = `
    <div>"${quoteText}"</div>
    <div style="font-size:0.55em; margin-top:3px; opacity:0.7;">${quoteAuthor}</div>
  `;
  requestAnimationFrame(() => quoteEl.style.opacity = "1");
}

window.addEventListener("DOMContentLoaded", setRandomQuote);

/* =========================
   WEATHER FUNCTIONS
========================= */

const WEATHER_TTL = 15 * 60 * 1000;
const HOURLY_HOURS = 6;

const weatherVisuals = {
  0:{day:["☀️","Clear"],night:["🌙","Clear night"]},
  1:{day:["🌤️","Mostly clear"],night:["🌙","Mostly clear night"]},
  2:{day:["⛅","Partly cloudy"],night:["☁️","Partly cloudy night"]},
  3:{day:["☁️","Cloudy"],night:["☁️","Cloudy"]},
  45:{day:["🌫️","Foggy"],night:["🌫️","Foggy"]},
  48:{day:["🌫️","Foggy"],night:["🌫️","Foggy"]},
  51:{day:["🌦️","Light rain"],night:["🌧️","Light rain"]},
  61:{day:["🌧️","Rain"],night:["🌧️","Rain"]},
  71:{day:["❄️","Snow"],night:["❄️","Snow"]},
  80:{day:["🌦️","Rain showers"],night:["🌧️","Rain showers"]},
  95:{day:["⛈️","Thunderstorm"],night:["⛈️","Thunderstorm"]}
};

const SEVERE_CODES = new Set([61, 71, 80, 95]);

function getWeatherVisual(code, isDay) {
  const v = weatherVisuals[code];
  if (!v) return { icon:"🌡️", desc:"Weather" };
  const [icon, desc] = isDay ? v.day : v.night;
  return { icon, desc };
}

async function fetchLocationName(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      { headers:{ "User-Agent":"Zen-New-Tab" } }
    );
    const j = await res.json();
    return j.address?.city || j.address?.town || j.address?.village || j.address?.state || "";
  } catch {
    return "";
  }
}

function animateWeatherIcon(iconEl, severe) {
  if (!iconEl) return;

  iconEl.style.display = "inline-block";
  iconEl.style.transformOrigin = "center";

  let anim = "none";
  const icon = iconEl.textContent;

  if (icon.includes("☀️") || icon.includes("🌙"))
    anim = "float-sun 3s ease-in-out infinite alternate";
  else if (icon.includes("☁️") || icon.includes("⛅"))
    anim = "sway-cloud 4s ease-in-out infinite alternate";
  else if (icon.includes("🌧️") || icon.includes("⛈️"))
    anim = severe
      ? "severe-pulse 1.2s ease-in-out infinite"
      : "shake-rain 0.6s ease-in-out infinite alternate";

  setTimeout(() => iconEl.style.animation = anim, 50);
}

/* -------- HOURLY TOOLTIP BUILDER -------- */
function buildHourlyTooltip(hourly, sunrise, sunset) {
  const now = new Date();
  let startIndex = hourly.time.findIndex(t => new Date(t) >= now);
  if (startIndex < 0) startIndex = 0;

  let html = `<div style="font-size:.85rem;opacity:.85;margin-bottom:6px;font-weight:500">Next hours</div>`;
  html += `<div style="display:flex;gap:8px;">`;

  for (let i = startIndex; i < startIndex + HOURLY_HOURS && i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]);
    const isDayHour = t >= sunrise && t < sunset;
    const v = getWeatherVisual(hourly.weathercode[i], isDayHour);
    const temp = Math.round(hourly.temperature_2m[i]);

    html += `
      <div style="
        min-width:50px;
        padding:6px 8px;
        text-align:center;
        background:rgba(255,255,255,0.15);
        border-radius:8px;
        font-size:.85rem;
        font-weight:500;
      ">
        <div>${t.getHours().toString().padStart(2,"0")}:00</div>
        <div style="font-size:1.2rem;">${v.icon}</div>
        <div>${temp}°</div>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* -------- SET WEATHER & TOOLTIP -------- */
function setWeather(el, data, offline = false) {
  if (offline) {
    el.innerHTML = `
      <span id="weather-icon" style="font-size:1.3rem;">📡</span>
      Browser is offline. Unable to retrieve weather data.
    `;
    return;
  }

  const now = new Date();
  const sunrise = new Date(data.sunrise);
  const sunset = new Date(data.sunset);
  const isDayNow = now >= sunrise && now < sunset;

  const mainCode = data.currentWeatherCode ?? data.hourly?.weathercode?.[0] ?? 0;
  const mainVisual = getWeatherVisual(mainCode, isDayNow);

  el.innerHTML = `
    <span id="weather-icon" style="font-size:1.3rem;">${mainVisual.icon}</span>
    ${data.severe ? "⚠️ " : ""}${data.temp ?? "--"}° • ${mainVisual.desc ?? "Weather"}
    ${data.location ? " in " + data.location : ""}
  `;
  animateWeatherIcon(document.getElementById("weather-icon"), data.severe);

  // Tooltip
  if (!el._weatherTooltipAdded) {
    let tip;
    el.addEventListener("mouseenter", () => {
      if (!data.hourly || tip) return;
      tip = document.createElement("div");
      tip.id = "weather-tip";
      tip.innerHTML = buildHourlyTooltip(data.hourly, sunrise, sunset);
      tip.style.cssText = `
        position:fixed;
        background: rgba(0,0,0,0.75);
        backdrop-filter: blur(6px);
        color:#fff;
        padding:10px 14px;
        border-radius:12px;
        font-size:.85rem;
        font-weight:500;
        z-index:999;
        pointer-events:none;
        opacity:0;
        transition:opacity .2s ease;
        white-space: nowrap;
      `;
      const rect = el.getBoundingClientRect();
      tip.style.top = `${rect.bottom + 8}px`;
      tip.style.left = `${rect.left + rect.width / 2}px`;
      tip.style.transform = "translateX(-50%)";
      document.body.appendChild(tip);
      requestAnimationFrame(()=> tip.style.opacity = "1");
    });
    el.addEventListener("mouseleave", () => {
      if (!tip) return;
      tip.style.opacity = "0";
      setTimeout(() => tip?.remove(), 200);
      tip = null;
    });
    el._weatherTooltipAdded = true;
  }
}

/* -------- FETCH WEATHER DATA -------- */
async function renderWeatherData(force=false) {
  const el = document.getElementById("weather");
  if (!el || !navigator.geolocation) return;

  if (!navigator.onLine) {
    setWeather(el, null, true);
    return;
  }

  const cached = JSON.parse(localStorage.getItem("weatherData") || "{}");
  if (!force && cached.data && Date.now() - cached.time < WEATHER_TTL) {
    setWeather(el, cached.data);
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;

    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}&longitude=${longitude}` +
        `&current_weather=true` +
        `&hourly=temperature_2m,weathercode` +
        `&daily=sunrise,sunset` +
        `&timezone=auto`
      );
      const json = await res.json();

      const sunrise = new Date(json.daily.sunrise[0]);
      const sunset  = new Date(json.daily.sunset[0]);

      const w = json.current_weather;
      const visual = getWeatherVisual(w.weathercode, new Date() >= sunrise && new Date() < sunset);
      const severe = SEVERE_CODES.has(w.weathercode);
      const location = await fetchLocationName(latitude, longitude);

      const data = {
        temp: Math.round(w.temperature),
        icon: visual.icon,
        desc: visual.desc,
        location,
        severe,
        hourly: json.hourly,
        sunrise: sunrise.toISOString(),
        sunset: sunset.toISOString(),
        currentWeatherCode: w.weathercode
      };

      localStorage.setItem("weatherData", JSON.stringify({ data, time: Date.now() }));
      setWeather(el, data);

    } catch {
      setWeather(el, null, true);
    }
  });
}

/* =========================
   FORCE REFRESH & NETWORK
========================= */
window.forceWeatherRefresh = () => {
  localStorage.removeItem("weatherData");
  renderWeatherData(true);
  console.log("[Weather] Forced refresh");
};
window.addEventListener("online", () => renderWeatherData(true));

/* =========================
   ANIMATIONS
========================= */
const style = document.createElement("style");
style.textContent = `
@keyframes float-sun {0%{transform:translateY(0);}100%{transform:translateY(-4px);}}
@keyframes sway-cloud {0%{transform:translateX(0);}100%{transform:translateX(3px);}}
@keyframes shake-rain {0%{transform:translateX(0);}100%{transform:translateX(2px);}}
@keyframes severe-pulse {0%{transform:scale(1);}100%{transform:scale(1.08);}}
`;
document.head.appendChild(style);

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  if ("requestIdleCallback" in window) requestIdleCallback(renderWeatherData);
  else setTimeout(renderWeatherData, 1000);
});

/* =========================
   BACKGROUND FUNCTIONS
========================= */
const VERCEL_UNSPLASH_URL = "https://nextjs-three-coral-93.vercel.app/api/unsplash";

async function fetchRandomBackground() {
  try {
    const res = await fetch(VERCEL_UNSPLASH_URL);
    const d = await res.json();
    return { url: d.urls?.raw ? d.urls.raw+"&w=1440&q=75&fm=jpg&fit=max" : "", author: d.user?.name || "" };
  } catch { return { url:"", author:"" }; }
}

function setBackground(url, author) {
  let bg = document.getElementById("bg-fade");
  if (!bg) {
    bg = document.createElement("div");
    bg.id = "bg-fade";
    bg.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background-size:cover;background-position:center;opacity:0;transition:opacity 1s ease;z-index:-1;`;
    document.body.appendChild(bg);
  }
  bg.style.backgroundImage = url ? `url(${url})` : "";
  requestAnimationFrame(() => bg.style.opacity = "1");

  const oldCredit = document.getElementById("unsplash-credit"); oldCredit?.remove();
  if (author) {
    const credit = document.createElement("div");
    credit.id = "unsplash-credit";
    credit.textContent = "©";
    credit.style.cssText = `position:fixed;bottom:12px;right:12px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;color:rgba(255,255,255,0.6);background:rgba(0,0,0,0.15);border-radius:50%;z-index:10;cursor:default;transition: background 0.2s, color 0.2s;`;
    let tooltip;
    credit.addEventListener("mouseenter", () => {
      credit.style.background="rgba(0,0,0,0.3)";
      credit.style.color="rgba(255,255,255,0.9)";
      tooltip = document.createElement("div");
      tooltip.textContent = `Photo by ${author} on Unsplash`;
      tooltip.style.cssText=`position:fixed;bottom:40px;right:12px;padding:4px 8px;font-size:0.75rem;color:#fff;background:rgba(0,0,0,0.7);border-radius:999px;opacity:0;pointer-events:none;transition: opacity 0.2s ease;z-index:11;white-space:nowrap;`;
      document.body.appendChild(tooltip);
      requestAnimationFrame(()=>tooltip.style.opacity="1");
    });
    credit.addEventListener("mouseleave", ()=>{
      credit.style.background="rgba(0,0,0,0.15)";
      credit.style.color="rgba(255,255,255,0.6)";
      if(tooltip){tooltip.style.opacity="0"; setTimeout(()=>tooltip?.remove(),200); tooltip=null;}
    });
    document.body.appendChild(credit);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const today = new Date().toISOString().slice(0,10);
  const bgCache = JSON.parse(localStorage.getItem("bgCache") || "{}");
  if (bgCache?.date === today && bgCache?.url) setBackground(bgCache.url, bgCache.author);
  else {
    const result = await fetchRandomBackground();
    setBackground(result.url, result.author);
    localStorage.setItem("bgCache", JSON.stringify({...result,date:today}));
  }
});

/* =========================
   COLOR SCHEME + SHORTCUTS
========================= */
function applyColorScheme() {
  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.style.color = darkMode ? "#f0f0f0" : "#111";
  document.body.style.backgroundColor = darkMode ? "#111" : "#f0f0f0";
}
applyColorScheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyColorScheme);

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "t") document.getElementById("time")?.click();
  if (key === "m") document.getElementById("mantra")?.classList.toggle("hidden");
  if (key === "w") document.getElementById("weather")?.classList.toggle("hidden");
  if (key === "p" && typeof toggleParticles==="function") toggleParticles();
});

/* =========================
   PARTICLES FUNCTIONS
========================= */
let particlesEnabled = localStorage.getItem("particlesEnabled") !== "false";
let particleContainer = null;

function initParticles() {
  if (!particlesEnabled || particleContainer) return;
  particleContainer = document.createElement("div");
  particleContainer.id="particle-container";
  particleContainer.style.cssText="position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0;";
  document.body.appendChild(particleContainer);
  for(let i=0;i<16;i++){
    const size=4+Math.random()*2;
    const opacity=0.3+Math.random()*0.2;
    const p=document.createElement("div");
    p.style.cssText=`position:absolute;width:${size}px;height:${size}px;background:rgba(255,255,255,${opacity});border-radius:50%;top:${Math.random()*100}%;left:${Math.random()*100}%;animation:float-particle ${30+Math.random()*20}s linear infinite;`;
    particleContainer.appendChild(p);
  }
}

function removeParticles(){ particleContainer?.remove(); particleContainer=null; }
function toggleParticles(){ particlesEnabled=!particlesEnabled; localStorage.setItem("particlesEnabled", particlesEnabled); particlesEnabled?initParticles():removeParticles(); }

if(!document.getElementById("particle-style")){
  const style=document.createElement("style");
  style.id="particle-style";
  style.textContent=`@keyframes float-particle{from{transform:translateY(0);opacity:0.4;}to{transform:translateY(-120vh);opacity:0;}}`;
  document.head.appendChild(style);
}

function createParticleToggle(){
  if(document.getElementById("particle-toggle"))return;
  const info=document.getElementById("privacy-btn");
  if(!info)return;
  const btn=document.createElement("button");
  btn.id="particle-toggle";
  btn.textContent="✦";
  btn.title="Toggle particles";
  btn.style.cssText="position:fixed;bottom:12px;left:44px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(0,0,0,0.15);color:rgba(255,255,255,0.6);font-size:0.8rem;cursor:pointer;z-index:10;transition: background 0.2s, color 0.2s;";
  btn.onmouseenter=()=>{btn.style.background="rgba(0,0,0,0.3)"; btn.style.color="rgba(255,255,255,0.9)";};
  btn.onmouseleave=()=>{btn.style.background="rgba(0,0,0,0.15)"; btn.style.color="rgba(255,255,255,0.6)";};
  btn.onclick=toggleParticles;
  document.body.appendChild(btn);
}

window.addEventListener("DOMContentLoaded", ()=>{
  initParticles();
  createParticleToggle();
});