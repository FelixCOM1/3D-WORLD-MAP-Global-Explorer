import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const RIVERS_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson";
const REST_COUNTRIES_MAIN_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca3,ccn3,capital,capitalInfo,region,subregion,continents,population,area";
const REST_COUNTRIES_EXTRA_URL =
  "https://restcountries.com/v3.1/all?fields=cca3,ccn3,languages,currencies,maps,flags";

const RADIUS = 1.75;
const TEXTURE_WIDTH = 4096;
const TEXTURE_HEIGHT = 2048;

const REGION_COLORS = {
  Africa: "#5ca35f",
  Americas: "#73b978",
  Asia: "#4aa078",
  Europe: "#86b86d",
  Oceania: "#5fb6a5",
  Antarctic: "#cfd8df",
};

const NAME_FIXES = {
  "United States of America": "United States",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "Central African Republic",
  "Dominican Rep.": "Dominican Republic",
  "Eq. Guinea": "Equatorial Guinea",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "S. Sudan": "South Sudan",
  "W. Sahara": "Western Sahara",
  "Falkland Is.": "Falkland Islands",
  "Fr. S. Antarctic Lands": "French Southern and Antarctic Lands",
  "Solomon Is.": "Solomon Islands",
  "N. Cyprus": "Northern Cyprus",
};

const MANUAL_COUNTRIES = {
  Kosovo: {
    code: "XKX",
    continent: "Europe",
    region: "Europe",
    subregion: "Balkans",
    capital: "Pristina",
    population: 1760000,
    area: 10887,
    languages: "Albanian, Serbian",
    summary: "Kosovo sits in the central Balkans, with mountain landscapes and Ottoman-era urban heritage.",
    cities: [
      city("Pristina", 42.663, 21.164, "Capital and cultural center"),
      city("Prizren", 42.213, 20.739, "Historic old town below the Sharr Mountains"),
      city("Peja", 42.659, 20.288, "Gateway to Rugova Canyon"),
    ],
  },
  Somaliland: {
    code: "SOL",
    continent: "Africa",
    region: "Africa",
    subregion: "Horn of Africa",
    capital: "Hargeisa",
    population: 5700000,
    area: 176120,
    languages: "Somali, Arabic, English",
    summary: "Somaliland occupies the northern Somali coast, facing the Gulf of Aden.",
    cities: [
      city("Hargeisa", 9.56, 44.065, "Capital and main commercial hub"),
      city("Berbera", 10.439, 45.014, "Historic Red Sea port"),
      city("Burao", 9.524, 45.534, "Important inland market city"),
    ],
  },
  "Northern Cyprus": {
    code: "CYN",
    continent: "Europe",
    region: "Europe",
    subregion: "Cyprus",
    capital: "North Nicosia",
    population: 390000,
    area: 3355,
    languages: "Turkish",
    summary: "Northern Cyprus covers the northern part of the island of Cyprus in the eastern Mediterranean.",
    cities: [
      city("North Nicosia", 35.186, 33.382, "Walled capital district"),
      city("Kyrenia", 35.341, 33.319, "Harbor city below the Kyrenia Mountains"),
      city("Famagusta", 35.125, 33.941, "Medieval port with Venetian walls"),
    ],
  },
};

const CITY_HIGHLIGHTS = {
  ARG: [
    city("Buenos Aires", -34.604, -58.381, "Architecture, tango, and major cultural venues"),
    city("Cordoba", -31.421, -64.188, "Colonial core and university life"),
    city("Mendoza", -32.89, -68.845, "Wine region below the Andes"),
    city("Ushuaia", -54.801, -68.303, "Southern gateway to Tierra del Fuego"),
  ],
  AUS: [
    city("Sydney", -33.868, 151.209, "Harbor, opera house, and coastal neighborhoods"),
    city("Melbourne", -37.814, 144.963, "Arts, food, and laneway culture"),
    city("Canberra", -35.281, 149.13, "Capital and national institutions"),
    city("Perth", -31.952, 115.861, "Indian Ocean city with riverfront parks"),
  ],
  BRA: [
    city("Sao Paulo", -23.55, -46.633, "Largest city and business powerhouse"),
    city("Rio de Janeiro", -22.907, -43.173, "Beaches, mountains, and iconic landmarks"),
    city("Brasilia", -15.793, -47.882, "Modernist planned capital"),
    city("Salvador", -12.977, -38.501, "Afro-Brazilian culture and historic center"),
    city("Manaus", -3.119, -60.021, "Amazon gateway on the Rio Negro"),
  ],
  CAN: [
    city("Toronto", 43.653, -79.383, "Finance, food, and lakefront skyline"),
    city("Montreal", 45.501, -73.567, "Francophone culture and festivals"),
    city("Vancouver", 49.282, -123.121, "Mountain, ocean, and tech hub"),
    city("Ottawa", 45.421, -75.697, "Capital on the Ottawa River"),
  ],
  CHL: [
    city("Santiago", -33.448, -70.669, "Capital in a valley below the Andes"),
    city("Valparaiso", -33.047, -71.612, "Colorful port hills and street art"),
    city("Punta Arenas", -53.163, -70.917, "Gateway to Patagonia and Antarctica"),
  ],
  CHN: [
    city("Beijing", 39.904, 116.407, "Capital with imperial landmarks"),
    city("Shanghai", 31.231, 121.474, "Global finance and river skyline"),
    city("Xi'an", 34.341, 108.94, "Ancient capital and Terracotta Army"),
    city("Chengdu", 30.572, 104.066, "Sichuan cuisine and panda research base"),
  ],
  COL: [
    city("Bogota", 4.711, -74.072, "Andean capital with museums and markets"),
    city("Medellin", 6.244, -75.581, "Mountain city known for urban innovation"),
    city("Cartagena", 10.391, -75.479, "Caribbean old town and fortress walls"),
  ],
  CZE: [
    city("Prague", 50.075, 14.438, "Historic capital on the Vltava"),
    city("Brno", 49.195, 16.607, "Architecture, universities, and cafes"),
    city("Cesky Krumlov", 48.812, 14.317, "UNESCO old town and castle"),
  ],
  DEU: [
    city("Berlin", 52.52, 13.405, "Capital, museums, and contemporary culture"),
    city("Hamburg", 53.551, 9.994, "Port city and canals"),
    city("Munich", 48.135, 11.582, "Bavarian capital near the Alps"),
    city("Cologne", 50.937, 6.96, "Cathedral city on the Rhine"),
  ],
  EGY: [
    city("Cairo", 30.044, 31.236, "Capital near the Nile delta"),
    city("Alexandria", 31.2, 29.918, "Mediterranean port and ancient heritage"),
    city("Luxor", 25.687, 32.639, "Temples and tombs along the Nile"),
    city("Aswan", 24.088, 32.899, "Nubian culture and Nile islands"),
  ],
  ESP: [
    city("Madrid", 40.416, -3.704, "Capital with major museums and plazas"),
    city("Barcelona", 41.387, 2.168, "Modernisme, beaches, and urban design"),
    city("Seville", 37.389, -5.984, "Andalusian architecture and flamenco"),
    city("Valencia", 39.469, -0.376, "Mediterranean city and science district"),
  ],
  FRA: [
    city("Paris", 48.857, 2.352, "Capital, museums, and river boulevards"),
    city("Lyon", 45.764, 4.835, "Food culture and Roman heritage"),
    city("Marseille", 43.296, 5.37, "Mediterranean port and calanques"),
    city("Nice", 43.71, 7.262, "Riviera city with seafront promenades"),
  ],
  GBR: [
    city("London", 51.507, -0.128, "Capital and global cultural center"),
    city("Edinburgh", 55.953, -3.188, "Castle, festivals, and old town"),
    city("Manchester", 53.48, -2.242, "Music, sport, and industrial heritage"),
    city("Belfast", 54.597, -5.93, "Titanic Quarter and coastal access"),
  ],
  GRC: [
    city("Athens", 37.984, 23.728, "Ancient landmarks and modern neighborhoods"),
    city("Thessaloniki", 40.641, 22.944, "Waterfront city with Byzantine heritage"),
    city("Heraklion", 35.339, 25.144, "Crete's largest city near Knossos"),
  ],
  IND: [
    city("New Delhi", 28.613, 77.209, "Capital and political center"),
    city("Mumbai", 19.076, 72.878, "Finance, film, and Arabian Sea waterfront"),
    city("Jaipur", 26.912, 75.787, "Palaces and planned pink city streets"),
    city("Bengaluru", 12.972, 77.594, "Technology hub and garden city"),
  ],
  IDN: [
    city("Jakarta", -6.208, 106.846, "Capital and largest metropolitan area"),
    city("Yogyakarta", -7.795, 110.369, "Javanese culture and temple access"),
    city("Denpasar", -8.65, 115.216, "Bali's urban gateway"),
    city("Surabaya", -7.258, 112.752, "Port city in East Java"),
  ],
  ITA: [
    city("Rome", 41.903, 12.496, "Capital with ancient landmarks"),
    city("Milan", 45.464, 9.19, "Fashion, finance, and design"),
    city("Venice", 45.44, 12.315, "Lagoon city of canals"),
    city("Florence", 43.77, 11.255, "Renaissance art and architecture"),
  ],
  JPN: [
    city("Tokyo", 35.676, 139.65, "Capital and vast urban region"),
    city("Kyoto", 35.011, 135.768, "Temples, gardens, and old districts"),
    city("Osaka", 34.694, 135.502, "Food culture and commerce"),
    city("Sapporo", 43.062, 141.354, "Northern city known for snow festivals"),
  ],
  KEN: [
    city("Nairobi", -1.292, 36.822, "Capital near Nairobi National Park"),
    city("Mombasa", -4.043, 39.668, "Indian Ocean port and old town"),
    city("Kisumu", -0.102, 34.762, "Lake Victoria city"),
  ],
  KOR: [
    city("Seoul", 37.566, 126.978, "Capital, design, and technology"),
    city("Busan", 35.18, 129.076, "Port city with beaches and markets"),
    city("Jeju City", 33.5, 126.531, "Volcanic island gateway"),
  ],
  MEX: [
    city("Mexico City", 19.433, -99.133, "Capital with museums and historic plazas"),
    city("Guadalajara", 20.676, -103.347, "Music, food, and colonial architecture"),
    city("Monterrey", 25.686, -100.316, "Industrial city backed by mountains"),
    city("Merida", 20.967, -89.592, "Yucatan culture and Mayan heritage access"),
  ],
  MAR: [
    city("Rabat", 34.021, -6.842, "Capital on the Atlantic coast"),
    city("Marrakesh", 31.629, -7.981, "Medina, markets, and gardens"),
    city("Casablanca", 33.573, -7.589, "Largest city and business center"),
    city("Fes", 34.018, -5.008, "Historic medina and craft traditions"),
  ],
  NGA: [
    city("Abuja", 9.076, 7.398, "Planned capital in central Nigeria"),
    city("Lagos", 6.524, 3.379, "Megacity, ports, music, and startups"),
    city("Kano", 12.002, 8.592, "Historic northern trade city"),
  ],
  NLD: [
    city("Amsterdam", 52.367, 4.904, "Canals, museums, and cycling culture"),
    city("Rotterdam", 51.924, 4.478, "Port city and modern architecture"),
    city("The Hague", 52.071, 4.3, "Government and international courts"),
  ],
  NOR: [
    city("Oslo", 59.913, 10.752, "Capital by the Oslofjord"),
    city("Bergen", 60.392, 5.322, "Gateway to western fjords"),
    city("Tromso", 69.649, 18.956, "Arctic city and northern lights base"),
  ],
  PER: [
    city("Lima", -12.046, -77.043, "Pacific capital and food scene"),
    city("Cusco", -13.532, -71.967, "Andean city near Machu Picchu"),
    city("Arequipa", -16.409, -71.537, "Volcanic stone architecture"),
  ],
  POL: [
    city("Warsaw", 52.229, 21.012, "Capital on the Vistula"),
    city("Krakow", 50.064, 19.945, "Historic old town and castle"),
    city("Gdansk", 54.352, 18.646, "Baltic port and Hanseatic heritage"),
    city("Wroclaw", 51.107, 17.038, "Island city with bridges and squares"),
  ],
  RUS: [
    city("Moscow", 55.756, 37.617, "Capital and political center"),
    city("Saint Petersburg", 59.934, 30.335, "Imperial architecture and canals"),
    city("Kazan", 55.787, 49.123, "Volga city with Tatar heritage"),
    city("Vladivostok", 43.115, 131.886, "Pacific port at the rail terminus"),
  ],
  SAU: [
    city("Riyadh", 24.713, 46.675, "Capital and fast-growing business center"),
    city("Jeddah", 21.485, 39.192, "Red Sea port and historic old town"),
    city("Mecca", 21.422, 39.826, "Islam's holiest city"),
    city("Medina", 24.524, 39.569, "Historic pilgrimage city"),
  ],
  SWE: [
    city("Stockholm", 59.329, 18.069, "Capital spread across islands"),
    city("Gothenburg", 57.708, 11.974, "West-coast port and design city"),
    city("Malmo", 55.605, 13.003, "Southern city linked to Copenhagen"),
  ],
  THA: [
    city("Bangkok", 13.756, 100.501, "Capital, temples, canals, and markets"),
    city("Chiang Mai", 18.788, 98.986, "Northern culture and mountain access"),
    city("Phuket", 7.88, 98.392, "Island city and beach hub"),
  ],
  TUR: [
    city("Ankara", 39.933, 32.86, "Capital in central Anatolia"),
    city("Istanbul", 41.008, 28.978, "Bosphorus city across two continents"),
    city("Izmir", 38.423, 27.143, "Aegean port and coastal culture"),
    city("Antalya", 36.896, 30.713, "Mediterranean gateway"),
  ],
  UKR: [
    city("Kyiv", 50.45, 30.524, "Capital on the Dnipro River"),
    city("Lviv", 49.839, 24.029, "Historic old town and coffee culture"),
    city("Odesa", 46.482, 30.724, "Black Sea port and boulevards"),
    city("Kharkiv", 49.993, 36.23, "Major university and industrial city"),
  ],
  USA: [
    city("New York City", 40.713, -74.006, "Finance, culture, and skyline"),
    city("Washington, D.C.", 38.907, -77.037, "Capital and national museums"),
    city("Los Angeles", 34.052, -118.244, "Film, beaches, and creative industries"),
    city("Chicago", 41.878, -87.63, "Architecture and Great Lakes waterfront"),
    city("San Francisco", 37.775, -122.419, "Bay city, hills, and technology culture"),
  ],
  VNM: [
    city("Hanoi", 21.028, 105.854, "Capital with old quarter and lakes"),
    city("Ho Chi Minh City", 10.823, 106.63, "Largest city and commercial hub"),
    city("Da Nang", 16.054, 108.202, "Central coast and bridge skyline"),
  ],
  ZAF: [
    city("Cape Town", -33.925, 18.424, "Table Mountain and Atlantic coast"),
    city("Johannesburg", -26.204, 28.047, "Economic hub and arts districts"),
    city("Pretoria", -25.747, 28.229, "Administrative capital"),
    city("Durban", -29.858, 31.021, "Indian Ocean port and beaches"),
  ],
};

const COUNTRY_FACTS = {
  BRA: "Brazil is South America's largest country, spanning the Amazon Basin, Atlantic coast, and major inland highlands.",
  UKR: "Ukraine is one of Europe's largest countries, known for the Dnipro River, Black Sea coast, and historic cities.",
  USA: "The United States stretches from Atlantic to Pacific with major mountain ranges, river systems, and global cities.",
  JPN: "Japan is an island country on the Pacific Ring of Fire, with dense cities, mountains, and strong regional identities.",
  EGY: "Egypt's population and history are closely tied to the Nile, with desert landscapes on both sides of the river valley.",
  AUS: "Australia combines coastal megacities with deserts, tropical north, mountain ranges, and the Great Barrier Reef.",
};

const ROUTE_LINES = {
  type: "FeatureCollection",
  features: [
    route("Pan-American Highway", [
      [-149.9, 61.2],
      [-122.3, 49.2],
      [-118.2, 34.1],
      [-99.1, 19.4],
      [-84.1, 9.9],
      [-74.1, 4.7],
      [-77.0, -12.0],
      [-70.7, -33.4],
      [-68.3, -54.8],
    ]),
    route("Trans-Siberian Corridor", [
      [37.6, 55.8],
      [49.1, 55.8],
      [60.6, 56.8],
      [82.9, 55.0],
      [104.3, 52.3],
      [131.9, 43.1],
    ]),
    route("Silk Road Arc", [
      [28.9, 41.0],
      [35.2, 39.9],
      [44.4, 33.3],
      [51.4, 35.7],
      [69.2, 41.3],
      [87.6, 43.8],
      [108.9, 34.3],
      [116.4, 39.9],
    ]),
    route("Nile Valley Road", [
      [31.2, 30.0],
      [32.6, 25.7],
      [32.9, 24.1],
      [32.5, 15.6],
      [32.6, 0.3],
    ]),
    route("Great Ocean Link", [
      [115.9, -32.0],
      [138.6, -34.9],
      [144.9, -37.8],
      [151.2, -33.9],
      [174.8, -36.9],
    ]),
    route("European North-South", [
      [10.8, 59.9],
      [13.4, 52.5],
      [14.4, 50.1],
      [16.4, 48.2],
      [12.5, 41.9],
      [23.7, 37.9],
    ]),
  ],
};

const ui = {
  canvas: document.querySelector("#globe-canvas"),
  status: document.querySelector("#status-line"),
  title: document.querySelector("#country-title"),
  panelKicker: document.querySelector("#panel-kicker"),
  quickStats: document.querySelector("#quick-stats"),
  details: document.querySelector("#country-details"),
  search: document.querySelector("#country-search"),
  list: document.querySelector("#country-list"),
  coordinates: document.querySelector("#coordinates"),
  tooltip: document.querySelector("#map-tooltip"),
  reset: document.querySelector("#reset-view"),
  autoRotate: document.querySelector("#auto-rotate"),
  layers: document.querySelectorAll("[data-layer]"),
};

let renderer;
let scene;
let camera;
let controls;
let globeGroup;
let earthMesh;
let earthTexture;
let textureCanvas;
let textureContext;
let countryFeatures = [];
let countryBorders = null;
let countryRecords = [];
let recordByKey = new Map();
let restByNumeric = new Map();
let selectedRecord = null;
let hoverRecord = null;
let riversGeojson = null;
let markersGroup;
let animationTarget = null;
let lastPointerEvent = null;

const layerState = {
  borders: true,
  rivers: true,
  routes: true,
};

init().catch((error) => {
  console.error(error);
  setStatus("Could not load the globe data. Check the internet connection.", true);
});

async function init() {
  ensureLibraries();
  setupScene();
  setupEvents();
  setStatus("Loading world data...");

  const [worldData, restMainData, restExtraData, riverData] = await Promise.all([
    fetchJson(WORLD_URL),
    fetchJson(REST_COUNTRIES_MAIN_URL).catch(() => []),
    fetchJson(REST_COUNTRIES_EXTRA_URL).catch(() => []),
    fetchJson(RIVERS_URL).catch(() => null),
  ]);

  riversGeojson = riverData;
  const restData = mergeRestCountryData(restMainData, restExtraData);
  buildCountries(worldData, restData);
  buildEarthTexture();
  drawEarthTexture();
  renderCountryList();
  renderPanel(null);
  setStatus("Globe ready");
  animate();
}

function ensureLibraries() {
  if (!window.d3 || !window.topojson) {
    throw new Error("Map libraries failed to load.");
  }
}

function setupScene() {
  renderer = new THREE.WebGLRenderer({
    canvas: ui.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(-0.48, 0.08, 5.85);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.rotateSpeed = 0.48;
  controls.zoomSpeed = 0.75;
  controls.minDistance = 2.4;
  controls.maxDistance = 8.2;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.38;
  controls.target.set(-0.55, 0, 0);

  const ambient = new THREE.AmbientLight(0xaec8ff, 1.55);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 3, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x75f4ff, 1.25);
  rimLight.position.set(-5, 1.5, -2);
  scene.add(rimLight);

  textureCanvas = document.createElement("canvas");
  textureCanvas.width = TEXTURE_WIDTH;
  textureCanvas.height = TEXTURE_HEIGHT;
  textureContext = textureCanvas.getContext("2d", { alpha: false });
  earthTexture = new THREE.CanvasTexture(textureCanvas);
  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  globeGroup = new THREE.Group();
  globeGroup.position.set(-0.55, 0, 0);
  scene.add(globeGroup);

  const earthGeometry = new THREE.SphereGeometry(RADIUS, 128, 96);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.82,
    metalness: 0.02,
  });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  globeGroup.add(earthMesh);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.025, 96, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6ddcf1,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  globeGroup.add(atmosphere);

  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.035, 96, 64),
    new THREE.MeshBasicMaterial({
      color: 0x9df76d,
      transparent: true,
      opacity: 0.065,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  globeGroup.add(outerGlow);

  markersGroup = new THREE.Group();
  globeGroup.add(markersGroup);
  scene.add(makeStars(1600));
  setGlobeLayout();
}

function setupEvents() {
  window.addEventListener("resize", resizeRenderer);
  ui.canvas.addEventListener("pointermove", onPointerMove);
  ui.canvas.addEventListener("pointerleave", clearHover);
  ui.canvas.addEventListener("click", onGlobeClick);
  ui.search.addEventListener("input", () => renderCountryList(ui.search.value));
  ui.reset.addEventListener("click", resetView);
  ui.autoRotate.addEventListener("click", toggleAutoRotate);

  ui.layers.forEach((input) => {
    input.addEventListener("change", () => {
      layerState[input.dataset.layer] = input.checked;
      drawEarthTexture();
    });
  });
}

function buildCountries(worldData, restData) {
  const topoCountries = worldData.objects.countries;
  countryFeatures = window.topojson.feature(worldData, topoCountries).features;
  countryBorders = window.topojson.mesh(worldData, topoCountries, (a, b) => a !== b);

  if (Array.isArray(restData)) {
    restData.forEach((country) => {
      if (country.ccn3) {
        restByNumeric.set(String(country.ccn3).padStart(3, "0"), country);
      }
    });
  }

  countryRecords = countryFeatures
    .map((feature, index) => makeCountryRecord(feature, index))
    .sort((a, b) => a.name.localeCompare(b.name));

  recordByKey = new Map(countryRecords.map((record) => [record.key, record]));
  countryFeatures.forEach((feature) => {
    const record = countryRecords.find((item) => item.feature === feature);
    feature.__recordKey = record?.key;
  });
}

function makeCountryRecord(feature, index) {
  const geometryName = NAME_FIXES[feature.properties?.name] || feature.properties?.name || "Unknown";
  const numeric = feature.id ? String(feature.id).padStart(3, "0") : "";
  const rest = numeric ? restByNumeric.get(numeric) : null;
  const manual = MANUAL_COUNTRIES[geometryName] || null;
  const cca3 = rest?.cca3 || manual?.code || slugify(geometryName).slice(0, 3).toUpperCase();
  const continent = rest?.continents?.[0] || manual?.continent || inferContinent(rest?.region, geometryName);
  const capital = rest?.capital?.[0] || manual?.capital || "";
  const languages = rest?.languages ? Object.values(rest.languages).slice(0, 4).join(", ") : manual?.languages || "";
  const currency = rest?.currencies
    ? Object.values(rest.currencies)
        .map((value) => value.name)
        .slice(0, 2)
        .join(", ")
    : "";
  const name = rest?.name?.common || manual?.name || geometryName;
  const key = numeric || `manual-${slugify(name)}-${index}`;
  const capitalCoords = rest?.capitalInfo?.latlng
    ? { lat: rest.capitalInfo.latlng[0], lon: rest.capitalInfo.latlng[1] }
    : null;

  return {
    key,
    id: numeric || manual?.code || "-",
    name,
    feature,
    numeric,
    cca3,
    capital,
    capitalCoords,
    continent,
    region: rest?.region || manual?.region || continent,
    subregion: rest?.subregion || manual?.subregion || "",
    population: rest?.population || manual?.population || null,
    area: rest?.area || manual?.area || null,
    languages,
    currency,
    flag: rest?.flags?.svg || rest?.flags?.png || "",
    maps: rest?.maps?.googleMaps || "",
    summary: COUNTRY_FACTS[cca3] || manual?.summary || "",
    cities: manual?.cities || CITY_HIGHLIGHTS[cca3] || buildFallbackCities(capital, capitalCoords),
  };
}

function buildEarthTexture() {
  const ctx = textureContext;
  const projection = window.d3
    .geoEquirectangular()
    .translate([TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2])
    .scale(TEXTURE_WIDTH / (2 * Math.PI));
  const path = window.d3.geoPath(projection, ctx);
  textureContext.projection = projection;
  textureContext.mapPath = path;
}

function drawEarthTexture() {
  if (!textureContext.mapPath) return;

  const ctx = textureContext;
  const path = ctx.mapPath;
  ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const ocean = ctx.createLinearGradient(0, 0, 0, TEXTURE_HEIGHT);
  ocean.addColorStop(0, "#005fba");
  ocean.addColorStop(0.46, "#0074b8");
  ocean.addColorStop(1, "#014a7b");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  drawOceanCurrents(ctx);

  ctx.save();
  ctx.strokeStyle = "rgba(181, 230, 255, 0.13)";
  ctx.lineWidth = 0.72;
  ctx.beginPath();
  path(window.d3.geoGraticule10());
  ctx.stroke();
  ctx.restore();

  countryFeatures.forEach((feature) => {
    const record = recordByKey.get(feature.__recordKey);
    const isSelected = selectedRecord?.key === record?.key;
    const isHover = hoverRecord?.key === record?.key;
    ctx.beginPath();
    path(feature);
    ctx.fillStyle = isSelected
      ? "#8fd35f"
      : isHover
        ? "#a0d982"
        : REGION_COLORS[record?.continent] || "#68aa72";
    ctx.globalAlpha = isSelected ? 0.98 : 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (layerState.rivers && riversGeojson) {
    ctx.save();
    ctx.strokeStyle = "rgba(125, 224, 255, 0.78)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    path(riversGeojson);
    ctx.stroke();
    ctx.restore();
  }

  if (layerState.routes) {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 210, 132, 0.78)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    path(ROUTE_LINES);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (layerState.borders && countryBorders) {
    ctx.save();
    ctx.strokeStyle = "rgba(232, 255, 244, 0.44)";
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    path(countryBorders);
    ctx.stroke();
    ctx.restore();
  }

  if (selectedRecord) {
    ctx.save();
    ctx.beginPath();
    path(selectedRecord.feature);
    ctx.strokeStyle = "#ecff8f";
    ctx.lineWidth = 4.4;
    ctx.shadowColor = "#ecff8f";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();
  }

  earthTexture.needsUpdate = true;
}

function drawOceanCurrents(ctx) {
  ctx.save();
  ctx.strokeStyle = "rgba(116, 219, 255, 0.13)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  for (let y = 250; y < TEXTURE_HEIGHT - 210; y += 170) {
    for (let x = 90; x < TEXTURE_WIDTH - 90; x += 390) {
      ctx.beginPath();
      ctx.moveTo(x, y + Math.sin(x * 0.01) * 18);
      ctx.bezierCurveTo(
        x + 70,
        y - 24,
        x + 140,
        y + 34,
        x + 240,
        y + Math.cos(y * 0.01) * 20,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

function renderCountryList(filter = "") {
  const query = filter.trim().toLowerCase();
  const fragment = document.createDocumentFragment();
  const filtered = countryRecords.filter((record) => {
    if (!query) return true;
    return [record.name, record.capital, record.region, record.continent]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  filtered.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `country-row${selectedRecord?.key === record.key ? " is-selected" : ""}`;
    button.dataset.key = record.key;
    button.innerHTML = `<strong>${escapeHtml(record.name)}</strong><span>${escapeHtml(
      record.capital || record.continent || "map",
    )}</span>`;
    button.addEventListener("click", () => selectCountry(record, true));
    fragment.appendChild(button);
  });

  ui.list.replaceChildren(fragment);
}

function renderPanel(record) {
  if (!record) {
    ui.panelKicker.textContent = "Country";
    ui.title.textContent = "Choose a territory";
    ui.quickStats.innerHTML = makeStatCards([
      ["ID", "-"],
      ["Capital", "-"],
      ["Continent", "-"],
    ]);
    ui.details.innerHTML = "<p>Select a country on the globe or from the list.</p>";
    return;
  }

  ui.panelKicker.textContent = "Country";
  ui.title.textContent = record.name;
  ui.quickStats.innerHTML = makeStatCards([
    ["ID", record.id],
    ["Capital", record.capital || "-"],
    ["Continent", record.continent || "-"],
  ]);

  const summary =
    record.summary ||
    `${record.name} is in ${record.subregion || record.region || record.continent}. Population and geography details update from live country data when available.`;
  const mapLink = record.maps ? `<a href="${record.maps}" target="_blank" rel="noreferrer">Open map</a>` : "";

  ui.details.innerHTML = `
    <p>${escapeHtml(summary)}</p>
    <ul>
      <li><strong>Region:</strong> ${escapeHtml(joinCompact([record.region, record.subregion], " / ") || "-")}</li>
      <li><strong>Population:</strong> ${escapeHtml(formatNumber(record.population))}</li>
      <li><strong>Area:</strong> ${escapeHtml(record.area ? `${formatNumber(record.area)} km2` : "-")}</li>
      <li><strong>Languages:</strong> ${escapeHtml(record.languages || "-")}</li>
      <li><strong>Currency:</strong> ${escapeHtml(record.currency || "-")} ${mapLink}</li>
    </ul>
    <h3>Interesting cities</h3>
    <ul>
      ${record.cities
        .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`)
        .join("")}
    </ul>
  `;
}

function makeStatCards(stats) {
  return stats
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "-")}</strong>
        </div>
      `,
    )
    .join("");
}

function selectCountry(record, flyTo = false) {
  selectedRecord = record;
  hoverRecord = record;
  setStatus(`${record.name} selected`);
  renderPanel(record);
  renderCountryList(ui.search.value);
  drawEarthTexture();
  updateCityMarkers(record);

  if (flyTo) {
    flyToCountry(record);
  }
}

function updateCityMarkers(record) {
  markersGroup.clear();
  if (!record?.cities?.length) return;

  record.cities.slice(0, 6).forEach((item) => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lon)) return;

    const marker = new THREE.Group();
    const position = latLonToVector3(item.lat, item.lon, RADIUS * 1.018);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.023, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xecff8f }),
    );
    dot.position.copy(position);
    marker.add(dot);

    const label = makeLabelSprite(item.name);
    label.position.copy(latLonToVector3(item.lat, item.lon, RADIUS * 1.09));
    marker.add(label);
    markersGroup.add(marker);
  });
}

function makeLabelSprite(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 34;
  const paddingX = 24;
  const paddingY = 16;
  ctx.font = `800 ${fontSize}px Segoe UI, Arial, sans-serif`;
  const width = Math.ceil(ctx.measureText(text).width + paddingX * 2);
  canvas.width = Math.max(180, width);
  canvas.height = 74;

  ctx.font = `800 ${fontSize}px Segoe UI, Arial, sans-serif`;
  ctx.fillStyle = "rgba(5, 10, 18, 0.78)";
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 20);
  ctx.fill();
  ctx.strokeStyle = "rgba(236, 255, 143, 0.75)";
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, canvas.width - 3, canvas.height - 3, 18);
  ctx.stroke();
  ctx.fillStyle = "#f6ffe0";
  ctx.textBaseline = "middle";
  ctx.fillText(text, paddingX, canvas.height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(canvas.width / 680, canvas.height / 680, 1);
  return sprite;
}

function onPointerMove(event) {
  lastPointerEvent = event;
  requestAnimationFrame(() => {
    if (!lastPointerEvent) return;
    const result = pickCountry(lastPointerEvent);
    if (!result) {
      clearHover();
      return;
    }

    const { record, lon, lat, x, y } = result;
    ui.coordinates.textContent = `${formatCoord(lat, "lat")}  ${formatCoord(lon, "lon")}`;

    if (record?.key !== hoverRecord?.key) {
      hoverRecord = record;
      drawEarthTexture();
    }

    if (record) {
      ui.tooltip.hidden = false;
      ui.tooltip.textContent = record.name;
      ui.tooltip.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    } else {
      ui.tooltip.hidden = true;
    }
  });
}

function clearHover() {
  lastPointerEvent = null;
  ui.coordinates.textContent = "Space";
  ui.tooltip.hidden = true;
  if (hoverRecord && hoverRecord.key !== selectedRecord?.key) {
    hoverRecord = selectedRecord;
    drawEarthTexture();
  }
}

function onGlobeClick(event) {
  const result = pickCountry(event);
  if (result?.record) {
    selectCountry(result.record, false);
  }
}

function pickCountry(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1),
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(earthMesh, false)[0];
  if (!hit?.uv) return null;

  const lon = normalizeLon(hit.uv.x * 360 - 180);
  const lat = hit.uv.y * 180 - 90;
  const feature = findCountryFeature([lon, lat]);
  const record = feature ? recordByKey.get(feature.__recordKey) : null;

  return {
    record,
    lon,
    lat,
    x: event.clientX,
    y: event.clientY,
  };
}

function findCountryFeature(point) {
  for (const feature of countryFeatures) {
    if (window.d3.geoContains(feature, point)) {
      return feature;
    }
  }
  return null;
}

function flyToCountry(record) {
  const centroid = window.d3.geoCentroid(record.feature);
  const lon = Number.isFinite(centroid[0]) ? centroid[0] : record.cities?.[0]?.lon || 0;
  const lat = Number.isFinite(centroid[1]) ? centroid[1] : record.cities?.[0]?.lat || 0;
  const distance = THREE.MathUtils.clamp(camera.position.clone().sub(globeGroup.position).length(), 3.1, 5.6);
  const end = getGlobeCenter().add(latLonToVector3(lat, lon, distance));
  animationTarget = {
    start: camera.position.clone(),
    end,
    started: performance.now(),
    duration: 1050,
  };
  controls.autoRotate = false;
  ui.autoRotate.classList.remove("is-active");
}

function resetView() {
  selectedRecord = null;
  hoverRecord = null;
  updateCityMarkers(null);
  renderPanel(null);
  renderCountryList(ui.search.value);
  setStatus("Globe ready");
  drawEarthTexture();
  animationTarget = {
    start: camera.position.clone(),
    end: getGlobeCenter().add(new THREE.Vector3(0.07, 0.08, 5.85)),
    started: performance.now(),
    duration: 900,
  };
}

function toggleAutoRotate() {
  controls.autoRotate = !controls.autoRotate;
  ui.autoRotate.classList.toggle("is-active", controls.autoRotate);
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  if (animationTarget) {
    const elapsed = now - animationTarget.started;
    const t = Math.min(elapsed / animationTarget.duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.copy(animationTarget.start).lerp(animationTarget.end, eased);
    camera.lookAt(globeGroup.position);
    if (t >= 1) {
      animationTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  setGlobeLayout();
}

function setGlobeLayout() {
  if (!globeGroup || !controls) return;
  const isCompact = window.innerWidth <= 980;
  const x = isCompact ? 0 : -0.55;
  globeGroup.position.set(x, 0, 0);
  controls.target.set(x, 0, 0);
}

function getGlobeCenter() {
  return globeGroup ? globeGroup.position.clone() : new THREE.Vector3(0, 0, 0);
}

function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(lon + 180);
  const theta = THREE.MathUtils.degToRad(90 - lat);
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function makeStars(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = THREE.MathUtils.randFloat(14, 42);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xcfe5ff,
      size: 0.018,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    }),
  );
}

function fetchJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return response.json();
  });
}

function mergeRestCountryData(primary, extra) {
  const merged = new Map();
  [primary, extra].forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((country) => {
      const key = country.ccn3 || country.cca3;
      if (!key) return;
      merged.set(key, { ...(merged.get(key) || {}), ...country });
    });
  });
  return [...merged.values()];
}

function city(name, lat, lon, note) {
  return { name, lat, lon, note };
}

function route(name, coordinates) {
  return {
    type: "Feature",
    properties: { name },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function buildFallbackCities(capital, coords) {
  if (!capital) {
    return [city("Main cities", Number.NaN, Number.NaN, "Explore the country's largest urban and cultural centers")];
  }
  return [
    city(
      capital,
      coords?.lat ?? Number.NaN,
      coords?.lon ?? Number.NaN,
      "Capital city and main reference point",
    ),
  ];
}

function inferContinent(region, name) {
  if (name === "Antarctica" || name === "French Southern and Antarctic Lands") return "Antarctic";
  return region || "World";
}

function setStatus(text, isError = false) {
  ui.status.textContent = text;
  ui.status.style.borderColor = isError ? "rgba(255, 111, 145, 0.72)" : "";
  ui.status.style.background = isError ? "rgba(91, 20, 35, 0.52)" : "";
}

function formatNumber(value) {
  if (!value) return "-";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCoord(value, type) {
  const direction = type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(2)} ${direction}`;
}

function normalizeLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function joinCompact(values, separator) {
  return values.filter(Boolean).join(separator);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
