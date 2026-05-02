import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const RIVERS_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson";
const REST_COUNTRIES_MAIN_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca3,ccn3,capital,capitalInfo,region,subregion,continents,population,area";
const REST_COUNTRIES_EXTRA_URL =
  "https://restcountries.com/v3.1/all?fields=cca2,cca3,ccn3,languages,currencies,maps,flags,tld,idd";

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

const TERRAIN_COLORS = {
  forest: "#357f4f",
  grass: "#72ad68",
  sand: "#d3ad5d",
  mountain: "#77675b",
  snow: "#e6f0f3",
  tundra: "#9dbb9a",
  selected: "#9ce36d",
  hover: "#b3dd86",
};

const DESERT_COUNTRIES = new Set([
  "Algeria",
  "Chad",
  "Egypt",
  "Libya",
  "Mali",
  "Mauritania",
  "Morocco",
  "Niger",
  "Saudi Arabia",
  "Sudan",
  "Western Sahara",
  "United Arab Emirates",
  "Oman",
  "Qatar",
  "Kuwait",
  "Yemen",
  "Namibia",
  "Botswana",
  "Australia",
  "Mongolia",
]);

const FOREST_COUNTRIES = new Set([
  "Brazil",
  "Colombia",
  "DR Congo",
  "Congo",
  "Gabon",
  "Indonesia",
  "Malaysia",
  "Papua New Guinea",
  "Peru",
  "Suriname",
  "Guyana",
  "Venezuela",
]);

const SNOW_COUNTRIES = new Set(["Antarctica", "Greenland", "Iceland"]);

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

const AIRLINE_ROUTES = {
  type: "FeatureCollection",
  features: [
    greatCircleRoute("New York to London", [-74.006, 40.713], [-0.128, 51.507]),
    greatCircleRoute("London to Dubai", [-0.128, 51.507], [55.27, 25.204]),
    greatCircleRoute("Dubai to Singapore", [55.27, 25.204], [103.82, 1.352]),
    greatCircleRoute("Los Angeles to Tokyo", [-118.244, 34.052], [139.65, 35.676]),
    greatCircleRoute("Paris to Tokyo", [2.352, 48.857], [139.65, 35.676]),
    greatCircleRoute("Sydney to Singapore", [151.209, -33.868], [103.82, 1.352]),
    greatCircleRoute("Sao Paulo to Lisbon", [-46.633, -23.55], [-9.139, 38.722]),
    greatCircleRoute("Johannesburg to Dubai", [28.047, -26.204], [55.27, 25.204]),
    greatCircleRoute("Cairo to Istanbul", [31.236, 30.044], [28.978, 41.008]),
    greatCircleRoute("Delhi to London", [77.209, 28.613], [-0.128, 51.507]),
  ],
};

const TERRAIN_AREAS = {
  type: "FeatureCollection",
  features: [
    terrainPolygon("Sahara Desert", [
      [-17, 15],
      [35, 15],
      [35, 32],
      [-17, 32],
      [-17, 15],
    ]),
    terrainPolygon("Arabian Desert", [
      [35, 12],
      [58, 12],
      [58, 31],
      [35, 31],
      [35, 12],
    ]),
    terrainPolygon("Gobi Desert", [
      [84, 36],
      [116, 36],
      [116, 48],
      [84, 48],
      [84, 36],
    ]),
    terrainPolygon("Australian Outback", [
      [112, -33],
      [145, -33],
      [145, -18],
      [112, -18],
      [112, -33],
    ]),
    terrainPolygon("Kalahari Desert", [
      [16, -28],
      [30, -28],
      [30, -17],
      [16, -17],
      [16, -28],
    ]),
    terrainPolygon("Atacama Desert", [
      [-75, -29],
      [-67, -29],
      [-67, -18],
      [-75, -18],
      [-75, -29],
    ]),
  ],
};

const MOUNTAIN_RANGES = {
  type: "FeatureCollection",
  features: [
    terrainLine("Andes", [
      [-75, 8],
      [-78, -2],
      [-76, -12],
      [-72, -22],
      [-70, -33],
      [-71, -43],
      [-69, -53],
    ]),
    terrainLine("Rocky Mountains", [
      [-122, 53],
      [-116, 47],
      [-112, 40],
      [-106, 35],
      [-104, 30],
    ]),
    terrainLine("Himalayas", [
      [72, 35],
      [80, 31],
      [88, 28],
      [96, 29],
    ]),
    terrainLine("Alps", [
      [5, 45],
      [9, 46],
      [13, 47],
      [16, 46],
    ]),
    terrainLine("Atlas Mountains", [
      [-10, 30],
      [-4, 32],
      [4, 35],
      [10, 35],
    ]),
    terrainLine("Great Dividing Range", [
      [145, -16],
      [149, -25],
      [150, -33],
      [147, -38],
    ]),
    terrainLine("East African Rift", [
      [36, 12],
      [38, 3],
      [36, -6],
      [34, -14],
    ]),
  ],
};

const MOUNTAIN_LABELS = [
  { name: "Andes", lat: -22, lon: -70 },
  { name: "Himalayas", lat: 30, lon: 84 },
  { name: "Alps", lat: 46, lon: 10 },
  { name: "Rocky Mtns", lat: 43, lon: -112 },
  { name: "Atlas", lat: 32, lon: -5 },
];

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
  dayNight: document.querySelector("#day-night"),
  shell: document.querySelector(".app-shell"),
  hero: document.querySelector("#country-hero"),
  flag: document.querySelector("#country-flag"),
  flagLabel: document.querySelector("#country-flag-label"),
  favoriteToggle: document.querySelector("#favorite-toggle"),
  favoritesBlock: document.querySelector("#favorites-block"),
  favoritesList: document.querySelector("#favorites-list"),
  weather: document.querySelector("#weather-card"),
  capitalTime: document.querySelector("#time-card"),
  layers: document.querySelectorAll("[data-layer]"),
};

let renderer;
let scene;
let camera;
let controls;
let globeGroup;
let earthMesh;
let cloudMesh;
let terminatorLine;
let atmosphereMesh;
let outerGlowMesh;
let ambientLight;
let keyLight;
let rimLight;
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
let capitalMarkersGroup;
let flagPinsGroup;
let mountainLabelsGroup;
let flightArcsGroup;
let flightArcAnimations = [];
let animationTarget = null;
let lastPointerEvent = null;
let isNightMode = false;
let weatherRequestId = 0;
let clockTimer = null;
let favoriteKeys = loadFavorites();

const layerState = {
  borders: true,
  rivers: true,
  routes: true,
  flights: true,
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
  updateCapitalMarkers();
  renderFavorites();
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

  ambientLight = new THREE.AmbientLight(0xaec8ff, 1.55);
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 3, 6);
  scene.add(keyLight);

  rimLight = new THREE.DirectionalLight(0x75f4ff, 1.25);
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

  cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.028, 96, 64),
    new THREE.MeshBasicMaterial({
      map: makeCloudTexture(),
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.NormalBlending,
    }),
  );
  globeGroup.add(cloudMesh);

  terminatorLine = makeTerminatorLine();
  globeGroup.add(terminatorLine);

  atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.025, 96, 64),
    new THREE.MeshBasicMaterial({
      color: 0x6ddcf1,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  globeGroup.add(atmosphereMesh);

  outerGlowMesh = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.055, 96, 64),
    new THREE.MeshBasicMaterial({
      color: 0x9df76d,
      transparent: true,
      opacity: 0.105,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  globeGroup.add(outerGlowMesh);

  capitalMarkersGroup = new THREE.Group();
  globeGroup.add(capitalMarkersGroup);
  flagPinsGroup = new THREE.Group();
  globeGroup.add(flagPinsGroup);
  mountainLabelsGroup = new THREE.Group();
  globeGroup.add(mountainLabelsGroup);
  flightArcsGroup = new THREE.Group();
  globeGroup.add(flightArcsGroup);
  markersGroup = new THREE.Group();
  globeGroup.add(markersGroup);
  buildMountainLabels();
  buildFlightArcs();
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
  ui.dayNight.addEventListener("click", toggleDayNight);
  ui.favoriteToggle.addEventListener("click", toggleFavorite);

  ui.layers.forEach((input) => {
    input.addEventListener("change", () => {
      layerState[input.dataset.layer] = input.checked;
      drawEarthTexture();
      updateLayerVisibility();
    });
  });

  clockTimer = window.setInterval(updateCapitalClock, 1000);
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
  const cca2 = rest?.cca2 || "";
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
  const officialName = rest?.name?.official || name;
  const key = numeric || `manual-${slugify(name)}-${index}`;
  const capitalCoords = rest?.capitalInfo?.latlng
    ? { lat: rest.capitalInfo.latlng[0], lon: rest.capitalInfo.latlng[1] }
    : null;
  const flag = rest?.flags?.svg || rest?.flags?.png || "";
  const flagPng = cca2 ? `https://flagcdn.com/w80/${cca2.toLowerCase()}.png` : rest?.flags?.png || flag;

  return {
    key,
    id: numeric || manual?.code || "-",
    name,
    feature,
    numeric,
    cca2,
    cca3,
    capital,
    capitalCoords,
    officialName,
    continent,
    region: rest?.region || manual?.region || continent,
    subregion: rest?.subregion || manual?.subregion || "",
    population: rest?.population || manual?.population || null,
    area: rest?.area || manual?.area || null,
    languages,
    currency,
    domain: rest?.tld?.join(", ") || "",
    callingCode: formatCallingCode(rest?.idd),
    flag,
    flagPng,
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

  const ocean = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ocean.addColorStop(0, isNightMode ? "#032d63" : "#075ea9");
  ocean.addColorStop(0.48, isNightMode ? "#063e69" : "#1288c4");
  ocean.addColorStop(1, isNightMode ? "#011c32" : "#03547d");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  drawOceanDepth(ctx);
  drawOceanCurrents(ctx);
  drawWaterLevel(ctx, path);

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
      ? TERRAIN_COLORS.selected
      : isHover
        ? TERRAIN_COLORS.hover
        : getTerrainColor(record, feature);
    ctx.globalAlpha = isSelected ? 0.98 : 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  drawTerrainDetails(ctx, path);

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

  if (layerState.flights) {
    ctx.save();
    ctx.strokeStyle = isNightMode ? "rgba(99, 239, 255, 0.9)" : "rgba(78, 241, 255, 0.74)";
    ctx.lineWidth = 2.15;
    ctx.shadowColor = "#56eeff";
    ctx.shadowBlur = 10;
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    path(AIRLINE_ROUTES);
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

  if (isNightMode) {
    drawNightOverlay(ctx);
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
  ctx.strokeStyle = isNightMode ? "rgba(104, 236, 255, 0.18)" : "rgba(116, 219, 255, 0.18)";
  ctx.lineWidth = 1.65;
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

function drawOceanDepth(ctx) {
  ctx.save();
  for (let i = 0; i < 9; i += 1) {
    const y = 170 + i * 210;
    const alpha = isNightMode ? 0.055 : 0.075;
    ctx.strokeStyle = `rgba(5, 33, 64, ${alpha})`;
    ctx.lineWidth = 12 - i * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= TEXTURE_WIDTH; x += 90) {
      ctx.lineTo(x, y + Math.sin(x * 0.006 + i) * 28 + Math.cos(x * 0.002 + i * 2) * 18);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = isNightMode ? "rgba(92, 202, 230, 0.14)" : "rgba(172, 242, 255, 0.2)";
  ctx.lineWidth = 1;
  for (let y = 90; y < TEXTURE_HEIGHT; y += 115) {
    ctx.beginPath();
    for (let x = 0; x <= TEXTURE_WIDTH; x += 42) {
      const waveY = y + Math.sin(x * 0.014 + y * 0.02) * 9;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterLevel(ctx, path) {
  ctx.save();
  ctx.strokeStyle = isNightMode ? "rgba(90, 217, 255, 0.18)" : "rgba(128, 244, 255, 0.25)";
  ctx.lineWidth = 8;
  countryFeatures.forEach((feature) => {
    ctx.beginPath();
    path(feature);
    ctx.stroke();
  });
  ctx.restore();
}

function drawTerrainDetails(ctx, path) {
  ctx.save();
  ctx.globalAlpha = 0.44;
  ctx.fillStyle = isNightMode ? "#a77c38" : "#d8b35f";
  ctx.beginPath();
  path(TERRAIN_AREAS);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = isNightMode ? "rgba(161, 134, 110, 0.9)" : "rgba(98, 78, 62, 0.72)";
  ctx.lineWidth = 5.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  path(MOUNTAIN_RANGES);
  ctx.stroke();
  ctx.strokeStyle = "rgba(244, 250, 255, 0.68)";
  ctx.lineWidth = 1.55;
  ctx.beginPath();
  path(MOUNTAIN_RANGES);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = isNightMode ? "rgba(214, 235, 242, 0.72)" : "rgba(239, 249, 252, 0.62)";
  countryFeatures.forEach((feature) => {
    const record = recordByKey.get(feature.__recordKey);
    if (record && (SNOW_COUNTRIES.has(record.name) || getCountryLatitude(feature) > 62)) {
      ctx.beginPath();
      path(feature);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawNightOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 8, 18, 0.34)";
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  drawNightLights(ctx);
  ctx.restore();
}

function drawNightLights(ctx) {
  const projection = textureContext.projection;
  const lightCities = countryRecords
    .flatMap((record) => record.cities.slice(0, 2))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  lightCities.forEach((item) => {
    const [x, y] = projection([item.lon, item.lat]);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 13);
    glow.addColorStop(0, "rgba(255, 238, 151, 0.95)");
    glow.addColorStop(0.42, "rgba(255, 190, 90, 0.32)");
    glow.addColorStop(1, "rgba(255, 190, 90, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getTerrainColor(record, feature) {
  if (!record) return REGION_COLORS.World || TERRAIN_COLORS.grass;
  if (SNOW_COUNTRIES.has(record.name) || getCountryLatitude(feature) > 66) return TERRAIN_COLORS.snow;
  if (DESERT_COUNTRIES.has(record.name)) return TERRAIN_COLORS.sand;
  if (FOREST_COUNTRIES.has(record.name)) return TERRAIN_COLORS.forest;
  if (record.continent === "Antarctic") return TERRAIN_COLORS.snow;
  if (record.continent === "Europe") return "#7fad6e";
  if (record.continent === "Asia") return "#5e9f63";
  if (record.continent === "Oceania") return "#58a889";
  return TERRAIN_COLORS.grass;
}

function getCountryLatitude(feature) {
  const centroid = window.d3.geoCentroid(feature);
  return Number.isFinite(centroid[1]) ? Math.abs(centroid[1]) : 0;
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
    ui.hero.hidden = true;
    ui.flag.removeAttribute("src");
    ui.flag.alt = "";
    ui.favoriteToggle.hidden = true;
    ui.favoriteToggle.classList.remove("is-saved");
    ui.favoriteToggle.setAttribute("aria-pressed", "false");
    ui.quickStats.innerHTML = makeStatCards([
      ["id", "ID", "-"],
      ["capital", "Capital", "-"],
      ["continent", "Continent", "-"],
    ]);
    ui.details.hidden = true;
    ui.details.innerHTML = "";
    renderWeather(null);
    renderCapitalTime(null);
    renderFavorites();
    return;
  }

  ui.panelKicker.textContent = "Country";
  ui.title.textContent = record.name;
  ui.details.hidden = false;
  ui.hero.hidden = !record.flag;
  ui.favoriteToggle.hidden = false;
  updateFavoriteButton(record);
  if (record.flag) {
    ui.flag.src = record.flag;
    ui.flag.alt = `${record.name} flag`;
    ui.flagLabel.textContent = record.name;
  } else {
    ui.flag.removeAttribute("src");
    ui.flag.alt = "";
    ui.flagLabel.textContent = "-";
  }
  ui.quickStats.innerHTML = makeStatCards([
    ["id", "ID", record.id],
    ["capital", "Capital", record.capital || "-"],
    ["continent", "Continent", record.continent || "-"],
  ]);

  const summary =
    record.summary ||
    `${record.name} is in ${record.subregion || record.region || record.continent}. Population and geography details update from live country data when available.`;
  const mapLink = record.maps ? `<a href="${record.maps}" target="_blank" rel="noreferrer">Open map</a>` : "";
  const cityCards = record.cities
    .slice(0, 4)
    .map(
      (item) => `
        <article class="city-photo-card">
          <img src="${escapeHtml(getCityPhotoUrl(item, record))}" alt="${escapeHtml(item.name)} city photo" loading="lazy" onerror="this.closest('.city-photo-card').classList.add('is-photo-missing')" />
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </article>
      `,
    )
    .join("");

  ui.details.innerHTML = `
    <p>${escapeHtml(summary)}</p>
    <ul>
      <li><strong>Official name:</strong> ${escapeHtml(record.officialName || record.name)}</li>
      <li><strong>Region:</strong> ${escapeHtml(joinCompact([record.region, record.subregion], " / ") || "-")}</li>
      <li><strong>Population:</strong> ${escapeHtml(formatNumber(record.population))}</li>
      <li><strong>Area:</strong> ${escapeHtml(record.area ? `${formatNumber(record.area)} km2` : "-")}</li>
      <li><strong>Official language:</strong> ${escapeHtml(record.languages || "-")}</li>
      <li><strong>Currency:</strong> ${escapeHtml(record.currency || "-")} ${mapLink}</li>
      <li><strong>Internet domain:</strong> ${escapeHtml(record.domain || "-")}</li>
      <li><strong>Calling code:</strong> ${escapeHtml(record.callingCode || "-")}</li>
    </ul>
    <h3>City photos</h3>
    <div class="city-photo-grid">${cityCards}</div>
    <h3>Interesting cities</h3>
    <ul>
      ${record.cities
        .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`)
        .join("")}
    </ul>
  `;
  renderWeather(record);
  renderCapitalTime(record);
}

function makeStatCards(stats) {
  return stats
    .map(
      ([icon, label, value]) => `
        <div class="stat-card">
          <span><i class="stat-icon ${escapeHtml(icon)}">${escapeHtml(label.charAt(0))}</i>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || "-")}</strong>
        </div>
      `,
    )
    .join("");
}

function renderWeather(record) {
  weatherRequestId += 1;
  const requestId = weatherRequestId;
  if (!record) {
    ui.weather.innerHTML = `
      <span>Capital weather</span>
      <strong>Choose a country</strong>
      <p>Live weather appears here when the capital has coordinates.</p>
    `;
    return;
  }

  const coords = getWeatherCoords(record);
  if (!coords) {
    ui.weather.innerHTML = `
      <span>Capital weather</span>
      <strong>No coordinates</strong>
      <p>${escapeHtml(record.capital || record.name)} does not have capital coordinates in this dataset.</p>
    `;
    return;
  }

  ui.weather.innerHTML = `
    <span>Capital weather</span>
    <strong>Loading ${escapeHtml(record.capital || record.name)}...</strong>
    <p>Fetching live weather from Open-Meteo.</p>
  `;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
  fetchJson(url)
    .then((data) => {
      if (requestId !== weatherRequestId) return;
      const current = data.current;
      if (!current) throw new Error("Missing weather");
      record.timeZone = data.timezone || record.timeZone || "";
      updateCapitalClock();
      const description = describeWeather(current.weather_code);
      ui.weather.innerHTML = `
        <span>Capital weather</span>
        <strong>${escapeHtml(record.capital || record.name)}: ${Math.round(current.temperature_2m)} C</strong>
        <p>${escapeHtml(description)}. Humidity ${Math.round(current.relative_humidity_2m)}%, wind ${Math.round(current.wind_speed_10m)} km/h.</p>
      `;
    })
    .catch(() => {
      if (requestId !== weatherRequestId) return;
      ui.weather.innerHTML = `
        <span>Capital weather</span>
        <strong>Weather unavailable</strong>
        <p>Open-Meteo did not return live weather for this capital right now.</p>
      `;
    });
}

function getWeatherCoords(record) {
  if (record.capitalCoords) return record.capitalCoords;
  const city = record.cities.find((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
  return city ? { lat: city.lat, lon: city.lon } : null;
}

function renderCapitalTime(record) {
  if (!record) {
    ui.capitalTime.innerHTML = `
      <span>Capital time</span>
      <strong>-</strong>
      <p>Select a country to show the local time.</p>
    `;
    return;
  }

  ui.capitalTime.innerHTML = `
    <span>Capital time</span>
    <strong>${record.timeZone ? formatLocalTime(record.timeZone) : "Loading..."}</strong>
    <p>${escapeHtml(record.timeZone || "Timezone is loading from the weather service.")}</p>
  `;
}

function updateCapitalClock() {
  if (!selectedRecord || !selectedRecord.timeZone) return;
  ui.capitalTime.innerHTML = `
    <span>Capital time</span>
    <strong>${formatLocalTime(selectedRecord.timeZone)}</strong>
    <p>${escapeHtml(selectedRecord.capital || selectedRecord.name)} local time, ${escapeHtml(selectedRecord.timeZone)}</p>
  `;
}

function formatLocalTime(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).format(new Date());
  } catch {
    return "-";
  }
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

function toggleFavorite() {
  if (!selectedRecord) return;
  if (favoriteKeys.has(selectedRecord.key)) {
    favoriteKeys.delete(selectedRecord.key);
  } else {
    favoriteKeys.add(selectedRecord.key);
  }
  saveFavorites();
  updateFavoriteButton(selectedRecord);
  renderFavorites();
}

function updateFavoriteButton(record) {
  const saved = favoriteKeys.has(record.key);
  ui.favoriteToggle.textContent = saved ? "Saved" : "Save";
  ui.favoriteToggle.classList.toggle("is-saved", saved);
  ui.favoriteToggle.setAttribute("aria-pressed", String(saved));
}

function renderFavorites() {
  const records = [...favoriteKeys].map((key) => recordByKey.get(key)).filter(Boolean);
  ui.favoritesBlock.hidden = records.length === 0;
  ui.favoritesList.replaceChildren(
    ...records.map((record) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "favorite-chip";
      button.textContent = record.name;
      button.addEventListener("click", () => selectCountry(record, true));
      return button;
    }),
  );
}

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem("airi-globe-favorites") || "[]"));
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  localStorage.setItem("airi-globe-favorites", JSON.stringify([...favoriteKeys]));
}

function updateCapitalMarkers() {
  capitalMarkersGroup.clear();
  const dotGeometry = new THREE.SphereGeometry(0.012, 10, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({
    color: 0x67ecff,
    transparent: true,
    opacity: 0.78,
  });

  countryRecords.forEach((record) => {
    const coords = getWeatherCoords(record);
    if (!coords) return;
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(latLonToVector3(coords.lat, coords.lon, RADIUS * 1.012));
    capitalMarkersGroup.add(dot);
  });
}

function updateCityMarkers(record) {
  markersGroup.clear();
  flagPinsGroup.clear();
  if (!record?.cities?.length) return;

  const capitalCoords = getWeatherCoords(record);
  if (capitalCoords && record.flagPng) {
    addFlagPin(record, capitalCoords);
  }

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

function addFlagPin(record, coords) {
  const pin = new THREE.Group();
  const base = latLonToVector3(coords.lat, coords.lon, RADIUS * 1.02);
  const top = latLonToVector3(coords.lat, coords.lon, RADIUS * 1.24);
  const pole = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([base, top]),
    new THREE.LineBasicMaterial({
      color: 0xf6ffe0,
      transparent: true,
      opacity: 0.72,
    }),
  );
  pin.add(pole);

  const texture = new THREE.TextureLoader().load(record.flagPng);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.position.copy(latLonToVector3(coords.lat, coords.lon, RADIUS * 1.29));
  sprite.scale.set(0.22, 0.14, 1);
  pin.add(sprite);
  flagPinsGroup.add(pin);
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
  sprite.scale.set(canvas.width / 860, canvas.height / 860, 1);
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
    selectCountry(result.record, true);
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
  flagPinsGroup.clear();
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

function toggleDayNight() {
  isNightMode = !isNightMode;
  ui.shell.classList.toggle("is-night", isNightMode);
  ui.dayNight.classList.toggle("is-active", isNightMode);
  ui.dayNight.textContent = isNightMode ? "Day" : "Night";
  ambientLight.intensity = isNightMode ? 0.62 : 1.55;
  keyLight.intensity = isNightMode ? 1.05 : 2.4;
  rimLight.intensity = isNightMode ? 2.15 : 1.25;
  atmosphereMesh.material.opacity = isNightMode ? 0.34 : 0.22;
  outerGlowMesh.material.opacity = isNightMode ? 0.18 : 0.105;
  cloudMesh.material.opacity = isNightMode ? 0.16 : 0.24;
  earthMesh.material.roughness = isNightMode ? 0.92 : 0.82;
  drawEarthTexture();
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

  if (cloudMesh) {
    cloudMesh.rotation.y += 0.00045;
    cloudMesh.rotation.x = Math.sin(now * 0.00008) * 0.015;
  }
  updateTerminatorLine(now);
  animateFlightArcs(now);
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

function makeCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 170; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const width = 80 + Math.random() * 220;
    const height = 18 + Math.random() * 55;
    const alpha = 0.08 + Math.random() * 0.18;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, width);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.45, `rgba(255,255,255,${alpha * 0.55})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.35);
    ctx.scale(1, height / width);
    ctx.beginPath();
    ctx.arc(0, 0, width, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function makeTerminatorLine() {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.LineBasicMaterial({
    color: 0xffe7a3,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.LineLoop(geometry, material);
  updateTerminatorLine(performance.now(), line);
  return line;
}

function updateTerminatorLine(now, line = terminatorLine) {
  if (!line) return;
  const sunLon = ((now * 0.0015) % (Math.PI * 2)) - Math.PI;
  const sunLat = THREE.MathUtils.degToRad(8 * Math.sin(now * 0.00008));
  const sunDirection = new THREE.Vector3(
    Math.cos(sunLat) * Math.cos(sunLon),
    Math.sin(sunLat),
    Math.cos(sunLat) * Math.sin(sunLon),
  ).normalize();
  const basisA = new THREE.Vector3(0, 1, 0).cross(sunDirection);
  if (basisA.lengthSq() < 0.0001) basisA.set(1, 0, 0);
  basisA.normalize();
  const basisB = sunDirection.clone().cross(basisA).normalize();
  const points = [];
  for (let i = 0; i < 160; i += 1) {
    const angle = (i / 160) * Math.PI * 2;
    points.push(
      basisA
        .clone()
        .multiplyScalar(Math.cos(angle))
        .add(basisB.clone().multiplyScalar(Math.sin(angle)))
        .multiplyScalar(RADIUS * 1.064),
    );
  }
  line.geometry.setFromPoints(points);
}

function buildMountainLabels() {
  mountainLabelsGroup.clear();
  MOUNTAIN_LABELS.forEach((label) => {
    const sprite = makeMapLabelSprite(label.name, {
      fill: "rgba(24, 20, 16, 0.72)",
      stroke: "rgba(255, 225, 160, 0.72)",
      text: "#ffe6b0",
    });
    sprite.position.copy(latLonToVector3(label.lat, label.lon, RADIUS * 1.075));
    mountainLabelsGroup.add(sprite);
  });
}

function buildFlightArcs() {
  flightArcsGroup.clear();
  flightArcAnimations = [];
  AIRLINE_ROUTES.features.forEach((feature, index) => {
    const points = feature.geometry.coordinates.map(([lon, lat], pointIndex, list) => {
      const t = pointIndex / Math.max(1, list.length - 1);
      const lift = Math.sin(Math.PI * t) * 0.16;
      return latLonToVector3(lat, lon, RADIUS * (1.035 + lift));
    });
    const curve = new THREE.CatmullRomCurve3(points);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(96)),
      new THREE.LineBasicMaterial({
        color: 0x5df4ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      }),
    );
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.017, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4a8 }),
    );
    flightArcsGroup.add(line, marker);
    flightArcAnimations.push({ curve, marker, offset: index / AIRLINE_ROUTES.features.length });
  });
  updateLayerVisibility();
}

function animateFlightArcs(now) {
  flightArcAnimations.forEach((item) => {
    const t = (now * 0.00009 + item.offset) % 1;
    item.marker.position.copy(item.curve.getPointAt(t));
  });
}

function updateLayerVisibility() {
  if (flightArcsGroup) flightArcsGroup.visible = layerState.flights;
}

function makeMapLabelSprite(text, options = {}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 30;
  const paddingX = 22;
  ctx.font = `900 ${fontSize}px Segoe UI, Arial, sans-serif`;
  const width = Math.ceil(ctx.measureText(text).width + paddingX * 2);
  canvas.width = Math.max(150, width);
  canvas.height = 62;

  ctx.font = `900 ${fontSize}px Segoe UI, Arial, sans-serif`;
  ctx.fillStyle = options.fill || "rgba(5, 10, 18, 0.78)";
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 18);
  ctx.fill();
  ctx.strokeStyle = options.stroke || "rgba(236, 255, 143, 0.75)";
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, canvas.width - 3, canvas.height - 3, 16);
  ctx.stroke();
  ctx.fillStyle = options.text || "#f6ffe0";
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
  sprite.scale.set(canvas.width / 940, canvas.height / 940, 1);
  return sprite;
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

function greatCircleRoute(name, from, to, steps = 64) {
  const interpolator = window.d3 ? window.d3.geoInterpolate(from, to) : null;
  const coordinates = interpolator
    ? Array.from({ length: steps + 1 }, (_, index) => interpolator(index / steps))
    : [from, to];
  return {
    type: "Feature",
    properties: { name, from, to },
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function terrainLine(name, coordinates) {
  return route(name, coordinates);
}

function terrainPolygon(name, coordinates) {
  return {
    type: "Feature",
    properties: { name },
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
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

function formatCallingCode(idd) {
  if (!idd?.root) return "";
  const suffix = Array.isArray(idd.suffixes) && idd.suffixes.length ? idd.suffixes[0] : "";
  return `${idd.root}${suffix}`;
}

function getCityPhotoUrl(cityRecord, countryRecord) {
  const query = encodeURIComponent(`${cityRecord.name} ${countryRecord.name} city landmark`);
  return `https://source.unsplash.com/featured/480x300/?${query}`;
}

function formatCoord(value, type) {
  const direction = type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(2)} ${direction}`;
}

function describeWeather(code) {
  const weather = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  };
  return weather[code] || "Changing weather";
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
