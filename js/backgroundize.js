const fixedBackground = "/img/fixed-background.png";
const webBackground = document.querySelector("#web_bg");
const banner = document.querySelector("#banner");
const bannerMask = document.querySelector("#banner .mask");
let activeDate = "";
let dailyPool = [];

function applyBackground(imagePath) {
  if (!webBackground || !imagePath) return;
  webBackground.setAttribute(
    "style",
    `background-image: url('${imagePath}');` +
      "position: fixed;inset: 0;z-index: -1;" +
      "background-repeat: no-repeat;background-position: center center;" +
      "background-size: cover;image-rendering: auto;"
  );
}

function stableHash(input) {
  let hash = 2166136261;
  for (const character of String(input || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dateInShanghai() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function selectDailyBackground(files) {
  const date = dateInShanghai();
  if (date === activeDate || !Array.isArray(files) || files.length === 0) return;

  const storageKey = `daily-background:${date}`;
  let selected = "";
  try {
    selected = localStorage.getItem(storageKey) || "";
  } catch (_error) {
    selected = "";
  }
  if (!files.includes(selected)) {
    selected = files[stableHash(storageKey) % files.length] || fixedBackground;
    try {
      localStorage.setItem(storageKey, selected);
    } catch (_error) {
      // Private browsing may disable storage; deterministic selection still works.
    }
  }

  activeDate = date;
  applyBackground(selected);
}

const initialBackground = banner?.style.backgroundImage.match(/url\(["']?([^"')]+)/)?.[1]
  || fixedBackground;
applyBackground(initialBackground);
if (banner) banner.style.backgroundImage = "none";
if (bannerMask) bannerMask.style.backgroundColor = "rgba(0,0,0,0)";

fetch("/img/daily-background-pool.json", { cache: "no-cache" })
  .then((response) => {
    if (!response.ok) throw new Error(`background pool ${response.status}`);
    return response.json();
  })
  .then((payload) => {
    dailyPool = Array.isArray(payload.files) ? payload.files : [];
    selectDailyBackground(dailyPool);
    window.setInterval(() => selectDailyBackground(dailyPool), 60 * 1000);
  })
  .catch(() => {
    applyBackground(initialBackground);
  });
