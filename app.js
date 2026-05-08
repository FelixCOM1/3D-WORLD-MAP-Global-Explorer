import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const RIVERS_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson";
const EARTHQUAKE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
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

const COUNTRY_OVERRIDES = {
  ATA: {
    capital: "McMurdo Station",
    capitalCoords: { lat: -77.846, lon: 166.676 },
    timeZone: "Pacific/Auckland",
    summary:
      "Antarctica is the southern polar continent, with research stations, ice shelves, mountain ranges, and no permanent civilian capital.",
    cities: [
      city("McMurdo Station", -77.846, 166.676, "Largest Antarctic research station"),
      city("Amundsen-Scott South Pole Station", -89.999, 0, "Research base at the geographic South Pole"),
      city("Rothera Research Station", -67.568, -68.126, "Scientific base on Adelaide Island"),
      city("Palmer Station", -64.774, -64.053, "Marine research station near the Antarctic Peninsula"),
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

const CLIMATE_BANDS = [
  { name: "Polar", from: 66, to: 90, color: "rgba(219, 241, 250, 0.42)" },
  { name: "Continental", from: 42, to: 66, color: "rgba(112, 161, 214, 0.25)" },
  { name: "Temperate", from: 23.5, to: 42, color: "rgba(115, 196, 112, 0.26)" },
  { name: "Tropical", from: 0, to: 23.5, color: "rgba(55, 178, 104, 0.29)" },
];

const BIOME_AREAS = {
  type: "FeatureCollection",
  features: [
    terrainPolygon("Amazon Rainforest", [
      [-78, -18],
      [-45, -18],
      [-45, 6],
      [-78, 6],
      [-78, -18],
    ]),
    terrainPolygon("Congo Rainforest", [
      [10, -6],
      [32, -6],
      [32, 6],
      [10, 6],
      [10, -6],
    ]),
    terrainPolygon("Eurasian Steppe", [
      [28, 44],
      [118, 44],
      [118, 54],
      [28, 54],
      [28, 44],
    ]),
    terrainPolygon("North American Taiga", [
      [-165, 50],
      [-55, 50],
      [-55, 67],
      [-165, 67],
      [-165, 50],
    ]),
    terrainPolygon("African Savanna", [
      [-18, -20],
      [42, -20],
      [42, 14],
      [-18, 14],
      [-18, -20],
    ]),
    terrainPolygon("Arctic Tundra", [
      [-180, 66],
      [180, 66],
      [180, 78],
      [-180, 78],
      [-180, 66],
    ]),
  ],
};

const TECTONIC_PLATES = {
  type: "FeatureCollection",
  features: [
    terrainLine("Pacific Ring", [
      [-150, 58],
      [-125, 42],
      [-105, 18],
      [-82, -2],
      [-75, -25],
      [-72, -50],
      [170, -45],
      [145, -6],
      [128, 12],
      [140, 38],
      [160, 55],
      [-170, 58],
    ]),
    terrainLine("Mid-Atlantic Ridge", [
      [-35, 65],
      [-30, 45],
      [-25, 20],
      [-15, 0],
      [-10, -22],
      [-5, -45],
      [5, -60],
    ]),
    terrainLine("Alpine-Himalayan Belt", [
      [-10, 35],
      [18, 38],
      [45, 32],
      [75, 31],
      [103, 28],
    ]),
    terrainLine("East African Rift", [
      [35, 12],
      [38, 2],
      [36, -8],
      [31, -20],
    ]),
  ],
};

const VOLCANO_POINTS = [
  point("Kilauea", 19.421, -155.287, "Shield volcano in Hawaii"),
  point("Mount St. Helens", 46.191, -122.194, "Cascade volcano"),
  point("Popocatepetl", 19.023, -98.622, "Active Mexican stratovolcano"),
  point("Cotopaxi", -0.677, -78.436, "High Andean volcano"),
  point("Etna", 37.751, 14.993, "Active volcano in Sicily"),
  point("Vesuvius", 40.821, 14.426, "Volcano near Naples"),
  point("Kilimanjaro", -3.067, 37.355, "Highest mountain in Africa"),
  point("Merapi", -7.54, 110.446, "Active volcano in Java"),
  point("Fuji", 35.36, 138.727, "Iconic volcano in Japan"),
  point("Ruapehu", -39.281, 175.568, "Active volcano in New Zealand"),
];

const PORT_POINTS = [
  point("Shanghai", 31.23, 121.47, "Major container port"),
  point("Singapore", 1.265, 103.82, "Global transshipment hub"),
  point("Rotterdam", 51.95, 4.14, "Europe's largest port"),
  point("Los Angeles", 33.74, -118.27, "Major Pacific gateway"),
  point("Dubai / Jebel Ali", 25.01, 55.06, "Middle East logistics hub"),
  point("Busan", 35.1, 129.04, "Major Northeast Asian port"),
  point("Santos", -23.96, -46.33, "Brazil's busiest port"),
  point("Durban", -29.88, 31.05, "Indian Ocean port"),
];

const AIRPORT_POINTS = [
  point("Atlanta ATL", 33.64, -84.43, "Major global airport"),
  point("Dubai DXB", 25.25, 55.36, "International hub"),
  point("London Heathrow", 51.47, -0.454, "European hub airport"),
  point("Tokyo Haneda", 35.549, 139.779, "Large Asian airport"),
  point("Singapore Changi", 1.364, 103.991, "Major Southeast Asia hub"),
  point("Paris CDG", 49.009, 2.548, "European hub airport"),
  point("Los Angeles LAX", 33.942, -118.408, "Pacific gateway airport"),
  point("Istanbul IST", 41.262, 28.742, "Europe-Asia air hub"),
];

const SEA_ROUTES = {
  type: "FeatureCollection",
  features: [
    route("North Pacific shipping", [
      [121.47, 31.23],
      [139.7, 35.6],
      [165, 42],
      [-150, 48],
      [-122.3, 37.8],
      [-118.27, 33.74],
    ]),
    route("Suez to Singapore", [
      [31.25, 30],
      [43, 12],
      [58, 12],
      [73, 7],
      [103.82, 1.265],
    ]),
    route("Atlantic container lane", [
      [-74, 40.7],
      [-40, 45],
      [-15, 48],
      [4.14, 51.95],
    ]),
    route("South Atlantic route", [
      [-46.33, -23.96],
      [-20, -25],
      [10, -30],
      [31.05, -29.88],
    ]),
  ],
};

const HURRICANE_ZONES = {
  type: "FeatureCollection",
  features: [
    terrainPolygon("Atlantic hurricanes", [
      [-100, 5],
      [-20, 5],
      [-20, 32],
      [-100, 32],
      [-100, 5],
    ]),
    terrainPolygon("West Pacific typhoons", [
      [105, 0],
      [170, 0],
      [170, 32],
      [105, 32],
      [105, 0],
    ]),
    terrainPolygon("Indian Ocean cyclones", [
      [45, -25],
      [115, -25],
      [115, 20],
      [45, 20],
      [45, -25],
    ]),
    terrainPolygon("South Pacific cyclones", [
      [135, -32],
      [-140, -32],
      [-140, -5],
      [135, -5],
      [135, -32],
    ]),
  ],
};

const OCEAN_CURRENT_ROUTES = [
  route("Gulf Stream", [
    [-82, 25],
    [-70, 35],
    [-50, 43],
    [-25, 50],
    [-10, 55],
  ]),
  route("Kuroshio Current", [
    [121, 22],
    [132, 31],
    [145, 38],
    [162, 42],
  ]),
  route("Agulhas Current", [
    [42, -18],
    [34, -28],
    [20, -36],
  ]),
  route("Antarctic Circumpolar", [
    [-180, -55],
    [-120, -56],
    [-60, -54],
    [0, -56],
    [60, -55],
    [120, -56],
    [180, -55],
  ]),
];

const MILITARY_BASE_POINTS = [
  point("Norfolk Naval Station", 36.95, -76.33, "Major naval base"),
  point("San Diego Naval Base", 32.68, -117.12, "Pacific fleet base"),
  point("Ramstein Air Base", 49.44, 7.6, "Large air base in Europe"),
  point("Pearl Harbor", 21.35, -157.95, "Pacific naval base"),
  point("Portsmouth Naval Base", 50.8, -1.11, "Royal Navy base"),
  point("Yokosuka", 35.29, 139.67, "Major naval base in Japan"),
  point("Toulon", 43.12, 5.93, "Mediterranean naval base"),
  point("Severomorsk", 69.07, 33.42, "Northern fleet base"),
];

const SPACEPORT_POINTS = [
  point("Kennedy Space Center", 28.57, -80.65, "200+ orbital launches"),
  point("Baikonur", 45.92, 63.34, "1500+ orbital launches"),
  point("Kourou", 5.24, -52.77, "300+ orbital launches"),
  point("Jiuquan", 40.96, 100.3, "150+ orbital launches"),
  point("Vostochny", 51.88, 128.33, "Modern Russian spaceport"),
  point("Tanegashima", 30.4, 130.97, "Japanese launch site"),
  point("Sriharikota", 13.72, 80.23, "Indian launch center"),
];

const LAUNCH_ROUTES = {
  type: "FeatureCollection",
  features: SPACEPORT_POINTS.map((site, index) =>
    greatCircleRoute(`${site.name} launch corridor`, [site.lon, site.lat], [normalizeLon(site.lon + 28 + index * 7), site.lat + 10], 24),
  ),
};

const MIGRATION_ROUTES = {
  type: "FeatureCollection",
  features: [
    greatCircleRoute("Latin America to North America", [-99.13, 19.43], [-74.0, 40.71], 48),
    greatCircleRoute("South Asia to Gulf", [77.2, 28.61], [55.27, 25.2], 48),
    greatCircleRoute("North Africa to Europe", [3, 28], [12.5, 41.9], 48),
    greatCircleRoute("Eastern Europe to Western Europe", [30.52, 50.45], [13.4, 52.52], 48),
    greatCircleRoute("Southeast Asia to Australia", [106.84, -6.2], [151.2, -33.86], 48),
  ],
};

const CONSTELLATIONS = [
  {
    name: "Orion",
    stars: [
      [-3.5, 2.1, -7],
      [-2.1, 1.3, -7],
      [-0.7, 0.45, -7],
      [0.8, -0.4, -7],
      [2.4, -1.2, -7],
      [-2.8, -2.2, -7],
      [2.9, 1.6, -7],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [3, 6],
    ],
  },
  {
    name: "Ursa Major",
    stars: [
      [4.8, 3.2, -8],
      [5.5, 2.7, -8],
      [6.1, 2.0, -8],
      [6.8, 1.7, -8],
      [7.4, 2.35, -8],
      [8.2, 2.55, -8],
      [8.9, 2.05, -8],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    name: "Southern Cross",
    stars: [
      [-6.4, -2.8, -7.8],
      [-5.7, -1.6, -7.8],
      [-5.0, -2.9, -7.8],
      [-6.2, -4.1, -7.8],
    ],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
  },
  {
    name: "Cassiopeia",
    stars: [
      [-7.8, 4.2, -9],
      [-7.0, 4.8, -9],
      [-6.1, 4.25, -9],
      [-5.2, 4.85, -9],
      [-4.2, 4.35, -9],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    name: "Cygnus",
    stars: [
      [1.2, 5.0, -8.6],
      [1.8, 4.0, -8.6],
      [2.35, 3.0, -8.6],
      [0.6, 3.4, -8.6],
      [3.65, 3.45, -8.6],
      [2.35, 1.95, -8.6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 5],
      [3, 2],
      [2, 4],
    ],
  },
  {
    name: "Lyra",
    stars: [
      [4.2, 5.5, -8.2],
      [4.75, 4.7, -8.2],
      [5.45, 4.85, -8.2],
      [5.25, 4.05, -8.2],
      [4.55, 3.9, -8.2],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 1],
    ],
  },
  {
    name: "Scorpius",
    stars: [
      [-8.6, -1.0, -8.4],
      [-7.6, -1.55, -8.4],
      [-6.5, -2.0, -8.4],
      [-5.4, -2.75, -8.4],
      [-4.75, -3.75, -8.4],
      [-3.9, -4.55, -8.4],
      [-2.9, -4.2, -8.4],
      [-2.45, -3.35, -8.4],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
    ],
  },
  {
    name: "Taurus",
    stars: [
      [-1.0, 4.2, -7.6],
      [-0.25, 3.45, -7.6],
      [0.7, 3.95, -7.6],
      [1.65, 4.55, -7.6],
      [0.4, 2.85, -7.6],
      [1.25, 2.35, -7.6],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 4],
      [4, 5],
    ],
  },
  {
    name: "Pegasus",
    stars: [
      [6.2, -0.25, -8.8],
      [7.45, -0.2, -8.8],
      [7.55, -1.45, -8.8],
      [6.15, -1.5, -8.8],
      [8.25, -2.2, -8.8],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
    ],
  },
  {
    name: "Andromeda",
    stars: [
      [7.9, 0.85, -8.5],
      [8.75, 1.25, -8.5],
      [9.55, 1.65, -8.5],
      [10.45, 2.15, -8.5],
      [9.25, 0.55, -8.5],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  {
    name: "Canis Major",
    stars: [
      [-0.9, -4.25, -7.2],
      [-0.1, -3.65, -7.2],
      [0.75, -4.2, -7.2],
      [1.55, -5.0, -7.2],
      [-0.55, -5.45, -7.2],
      [0.4, -6.15, -7.2],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 5],
      [2, 5],
    ],
  },
  {
    name: "Aquila",
    stars: [
      [3.1, -2.4, -7.9],
      [3.7, -1.6, -7.9],
      [4.45, -2.35, -7.9],
      [3.85, -3.05, -7.9],
      [4.95, -3.55, -7.9],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
    ],
  },
  {
    name: "Corona Borealis",
    stars: [
      [-4.1, 1.65, -8.9],
      [-3.5, 2.15, -8.9],
      [-2.75, 2.28, -8.9],
      [-2.0, 2.05, -8.9],
      [-1.45, 1.55, -8.9],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
];

const FOOD_HIGHLIGHTS = {
  BRA: ["Feijoada", "Pao de queijo", "Moqueca", "Brigadeiro"],
  USA: ["Barbecue", "Clam chowder", "Apple pie", "Tex-Mex tacos"],
  JPN: ["Sushi", "Ramen", "Okonomiyaki", "Tempura"],
  UKR: ["Borscht", "Varenyky", "Holubtsi", "Kyiv cake"],
  FRA: ["Croissant", "Ratatouille", "Coq au vin", "Creme brulee"],
  ITA: ["Pizza", "Risotto", "Pasta", "Gelato"],
  IND: ["Biryani", "Masala dosa", "Butter chicken", "Chaat"],
  MEX: ["Tacos", "Mole", "Tamales", "Pozole"],
  IDN: ["Nasi goreng", "Satay", "Rendang", "Gado-gado"],
};

const DISASTER_HISTORY = {
  JPN: ["2011 Tohoku earthquake and tsunami", "1995 Kobe earthquake", "1923 Great Kanto earthquake"],
  IDN: ["2004 Indian Ocean tsunami", "2018 Sulawesi earthquake and tsunami", "1883 Krakatoa eruption"],
  USA: ["1906 San Francisco earthquake", "2005 Hurricane Katrina", "2018 Camp Fire"],
  CHL: ["1960 Valdivia earthquake", "2010 Maule earthquake", "2015 Calbuco eruption"],
  TUR: ["2023 Turkey-Syria earthquake", "1999 Izmit earthquake", "1939 Erzincan earthquake"],
  BRA: ["2011 Rio de Janeiro floods", "2024 Rio Grande do Sul floods", "Amazon wildfire seasons"],
};

const COUNTRY_THEME_COLORS = {
  BRA: ["#2fb35f", "#ffd54a"],
  USA: ["#3f69d8", "#ff5868"],
  UKR: ["#2d7ff0", "#ffd44d"],
  JPN: ["#f5f7fb", "#d43d50"],
  FRA: ["#436bff", "#f2555f"],
  ITA: ["#2fb56f", "#f1f4f2"],
  IDN: ["#e53945", "#ffffff"],
  IND: ["#ff9933", "#2f9e44"],
};

const VISA_RULES = {
  USA: { visaFree: ["CAN", "MEX", "GBR", "FRA", "DEU", "ITA", "JPN", "KOR", "AUS", "NZL"], eVisa: ["IND", "TUR", "BRA", "EGY", "KEN"], required: ["CHN", "RUS"] },
  UKR: { visaFree: ["POL", "DEU", "FRA", "ITA", "ESP", "TUR", "BRA", "ARG", "CHL", "GEO"], eVisa: ["IND", "AUS", "EGY", "KEN"], required: ["USA", "CAN", "GBR"] },
  EU: { visaFree: ["USA", "CAN", "GBR", "JPN", "KOR", "BRA", "ARG", "CHL", "MEX", "AUS"], eVisa: ["IND", "TUR", "EGY", "KEN"], required: ["CHN", "RUS"] },
  GBR: { visaFree: ["USA", "CAN", "FRA", "DEU", "ITA", "ESP", "JPN", "AUS", "BRA"], eVisa: ["IND", "TUR", "EGY", "KEN"], required: ["CHN", "RUS"] },
  CAN: { visaFree: ["USA", "MEX", "GBR", "FRA", "DEU", "JPN", "AUS", "BRA"], eVisa: ["IND", "TUR", "EGY", "KEN"], required: ["CHN", "RUS"] },
  AUS: { visaFree: ["NZL", "JPN", "KOR", "GBR", "FRA", "DEU", "USA", "CAN"], eVisa: ["IND", "TUR", "BRA", "EGY"], required: ["CHN", "RUS"] },
  BRA: { visaFree: ["ARG", "CHL", "PER", "COL", "FRA", "DEU", "ITA", "ESP", "GBR"], eVisa: ["IND", "TUR", "EGY"], required: ["USA", "CAN", "AUS", "CHN"] },
  IND: { visaFree: ["NPL", "BTN"], eVisa: ["TUR", "EGY", "KEN", "AUS", "BRA"], required: ["USA", "CAN", "GBR", "FRA", "DEU", "JPN"] },
};

const PASSPORT_LABELS = {
  USA: "United States",
  UKR: "Ukraine",
  EU: "European Union",
  GBR: "United Kingdom",
  CAN: "Canada",
  AUS: "Australia",
  BRA: "Brazil",
  IND: "India",
};

const CURRENCY_HINTS = {
  "united states dollar": { code: "USD", rate: 1 },
  euro: { code: "EUR", rate: 1.08 },
  "ukrainian hryvnia": { code: "UAH", rate: 0.025 },
  "brazilian real": { code: "BRL", rate: 0.19 },
  "indonesian rupiah": { code: "IDR", rate: 0.000061 },
  yen: { code: "JPY", rate: 0.0064 },
  "pound sterling": { code: "GBP", rate: 1.26 },
  "canadian dollar": { code: "CAD", rate: 0.73 },
  "australian dollar": { code: "AUD", rate: 0.66 },
  rupee: { code: "INR", rate: 0.012 },
  "mexican peso": { code: "MXN", rate: 0.059 },
  yuan: { code: "CNY", rate: 0.14 },
  "swiss franc": { code: "CHF", rate: 1.11 },
};

const TARGET_CURRENCY_RATES = {
  USD: 1,
  EUR: 1.08,
  UAH: 0.025,
};

const EU_MEMBERS = new Set([
  "AUT",
  "BEL",
  "BGR",
  "HRV",
  "CYP",
  "CZE",
  "DNK",
  "EST",
  "FIN",
  "FRA",
  "DEU",
  "GRC",
  "HUN",
  "IRL",
  "ITA",
  "LVA",
  "LTU",
  "LUX",
  "MLT",
  "NLD",
  "POL",
  "PRT",
  "ROU",
  "SVK",
  "SVN",
  "ESP",
  "SWE",
]);

const NATO_MEMBERS = new Set([
  "USA",
  "CAN",
  "GBR",
  "FRA",
  "DEU",
  "ITA",
  "ESP",
  "POL",
  "TUR",
  "NOR",
  "DNK",
  "NLD",
  "BEL",
  "PRT",
  "GRC",
  "CZE",
  "HUN",
  "ROU",
  "BGR",
  "SVK",
  "SVN",
  "HRV",
  "ALB",
  "MNE",
  "MKD",
  "FIN",
  "SWE",
]);

const BRICS_MEMBERS = new Set(["BRA", "RUS", "IND", "CHN", "ZAF", "EGY", "ETH", "IRN", "ARE"]);

const NAME_ORIGINS = {
  USA: "America is named after Amerigo Vespucci; the federal country name describes the union of states.",
  BRA: "Brazil comes from pau-brasil, the red brazilwood traded from the Atlantic coast.",
  UKR: "Ukraine is linked to an old Slavic word for frontier or borderland, later becoming a national name.",
  JPN: "Japan comes from Nihon or Nippon, meaning origin of the sun.",
  IDN: "Indonesia combines Indos and nesos, meaning Indian islands.",
  FRA: "France is named after the Franks, a Germanic people who ruled parts of Western Europe.",
  ITA: "Italy comes from Italia, an ancient name first used for southern parts of the peninsula.",
  IND: "India is named from the Indus River through Greek and Persian forms.",
  DEU: "Germany's English name comes from Latin Germania; Deutschland comes from a word for the people.",
  ATA: "Antarctica means opposite the Arctic, from Greek words referring to the far southern polar region.",
};

const FAMOUS_PEOPLE = {
  USA: [
    ["Katherine Johnson", "Mathematician behind early NASA flight calculations"],
    ["Martin Luther King Jr.", "Civil rights leader"],
    ["Thomas Edison", "Inventor and industrial researcher"],
  ],
  BRA: [
    ["Oscar Niemeyer", "Architect of Brasilia landmarks"],
    ["Marta", "Football icon"],
    ["Santos Dumont", "Aviation pioneer"],
  ],
  UKR: [
    ["Sergei Korolev", "Rocket engineer and space program leader"],
    ["Lesya Ukrainka", "Poet and writer"],
    ["Igor Sikorsky", "Aviation designer"],
  ],
  JPN: [
    ["Hayao Miyazaki", "Animation director"],
    ["Marie Kondo", "Author and media personality"],
    ["Shinya Yamanaka", "Nobel-winning stem-cell researcher"],
  ],
  IDN: [
    ["B. J. Habibie", "Engineer and president"],
    ["Raden Ajeng Kartini", "Education and women's rights figure"],
    ["Pramoedya Ananta Toer", "Novelist"],
  ],
  ATA: [
    ["Ernest Shackleton", "Polar explorer"],
    ["Roald Amundsen", "First confirmed expedition to the South Pole"],
    ["Ann Bancroft", "Polar explorer"],
  ],
};

const NATIONAL_SYMBOLS = {
  USA: ["Bald eagle", "Rose", "The Star-Spangled Banner"],
  BRA: ["Rufous-bellied thrush", "Ipe-amarelo tree", "Hino Nacional Brasileiro"],
  UKR: ["Tryzub coat of arms", "Sunflower", "Shche ne vmerla Ukrainy"],
  JPN: ["Chrysanthemum seal", "Cherry blossom", "Kimigayo"],
  IDN: ["Garuda Pancasila", "Jasmine", "Indonesia Raya"],
  FRA: ["Gallic rooster", "Iris", "La Marseillaise"],
  ITA: ["Stella d'Italia", "Strawberry tree", "Il Canto degli Italiani"],
  IND: ["Bengal tiger", "Lotus", "Jana Gana Mana"],
  ATA: ["Antarctic Treaty emblem", "Emperor penguin symbol", "No national anthem"],
};

const LICENSE_PLATE_EXAMPLES = {
  USA: "ABC 1234 / state-based plates",
  BRA: "ABC1D23 Mercosur style",
  UKR: "AA 1234 BB",
  JPN: "Shinagawa 300 A 12-34",
  IDN: "B 1234 XYZ",
  FRA: "AB-123-CD",
  ITA: "AB 123 CD",
  IND: "DL 01 AB 1234",
  ATA: "Research stations use national vehicle systems",
};

const SCIENCE_ACHIEVEMENTS = {
  USA: ["Apollo Moon landings", "Hubble Space Telescope", "GPS satellite system"],
  BRA: ["Embraer aerospace engineering", "Amazon research networks", "Deep offshore energy research"],
  UKR: ["R-7 and Energia rocket engineering heritage", "Antonov heavy aircraft", "Electric welding research"],
  JPN: ["Hayabusa asteroid sample return", "Shinkansen engineering", "Advanced robotics"],
  IDN: ["B. J. Habibie aviation work", "Tropical biodiversity research", "Volcanology monitoring"],
  FRA: ["Ariane rockets", "Pasteur microbiology legacy", "TGV high-speed rail"],
  ITA: ["Galileo's astronomy", "Fermi nuclear physics", "Leonardo engineering notebooks"],
  IND: ["Chandrayaan lunar missions", "Mars Orbiter Mission", "Green Revolution research"],
  ATA: ["Ice-core climate science", "Ozone hole discovery", "South Pole astronomy"],
};

const FAMOUS_INVENTIONS = {
  USA: [["Internet backbone", "ARPANET and computing networks"], ["Airplane industry", "Powered flight development"], ["Electric light systems", "Mass electrical infrastructure"]],
  BRA: [["Wristwatch aviation use", "Associated with Santos Dumont"], ["Flex-fuel cars", "Large ethanol vehicle ecosystem"], ["Bina caller ID", "Brazilian telecom innovation"]],
  UKR: [["Helicopter design", "Sikorsky's aviation legacy"], ["Piezoelectric research", "Early crystal electronics work"], ["Large cargo aircraft", "Antonov engineering"]],
  JPN: [["QR code", "Created by Denso Wave"], ["Walkman", "Portable music culture"], ["Bullet train", "Modern high-speed rail"]],
  IDN: [["Habibie factor", "Aircraft crack propagation theory"], ["Batik technology heritage", "Textile craft and design systems"], ["Volcano early warning systems", "Ring of Fire monitoring"]],
  FRA: [["Braille", "Tactile reading system"], ["Photography", "Daguerreotype process"], ["Pasteurization", "Food safety method"]],
  ITA: [["Radio engineering", "Marconi's wireless work"], ["Battery", "Volta's electric pile"], ["Barometer", "Torricelli's instrument"]],
  IND: [["Zero numeral heritage", "Mathematical notation"], ["USB contributions", "Ajay Bhatt's computing work"], ["Yoga knowledge systems", "Global wellness culture"]],
};

const COUNTRY_ECONOMY_EXTRAS = {
  USA: { wage: "$7.25 federal hourly", salary: "$5,900 monthly", fuel: "$0.95/L", business: 84, tax: "Federal 10-37%, state varies" },
  BRA: { wage: "R$1,412 monthly", salary: "R$3,100 monthly", fuel: "$1.12/L", business: 62, tax: "Income 0-27.5%, VAT-style ICMS varies" },
  UKR: { wage: "UAH 8,000 monthly", salary: "UAH 21,000 monthly", fuel: "$1.35/L", business: 70, tax: "Income 18%, military levy 1.5%" },
  JPN: { wage: "JP¥1,055 hourly avg.", salary: "JP¥330,000 monthly", fuel: "$1.14/L", business: 78, tax: "Income 5-45%, consumption tax 10%" },
  IDN: { wage: "Provincial minimum wage", salary: "Rp5.2M monthly", fuel: "$0.88/L", business: 69, tax: "Income 5-35%, VAT 11%" },
  FRA: { wage: "EUR 1,766 monthly", salary: "EUR 3,300 monthly", fuel: "$1.95/L", business: 76, tax: "Income 0-45%, VAT 20%" },
  ITA: { wage: "Sector contracts", salary: "EUR 2,500 monthly", fuel: "$1.92/L", business: 73, tax: "Income 23-43%, VAT 22%" },
  IND: { wage: "State and sector based", salary: "INR 32,000 monthly", fuel: "$1.20/L", business: 71, tax: "Income 0-30%, GST slabs" },
  DEU: { wage: "EUR 12.41 hourly", salary: "EUR 4,100 monthly", fuel: "$1.86/L", business: 79, tax: "Income 14-45%, VAT 19%" },
  ATA: { wage: "Research contracts", salary: "Station role based", fuel: "Logistics only", business: 0, tax: "No civilian tax system" },
};

const ALPHABET_PREVIEWS = {
  USA: "A B C D E F G H I J K",
  BRA: "A B C D E F G H I J K",
  UKR: "А Б В Г Ґ Д Е Є Ж З И І",
  JPN: "あ い う え お / ア イ ウ エ オ",
  IDN: "A B C D E F G H I J K",
  FRA: "A B C D E F G H I J K",
  ITA: "A B C D E F G H I J K",
  IND: "अ आ इ ई उ ऊ ए ऐ ओ औ",
  CHN: "一 二 三 四 五 六 七 八 九 十",
  KOR: "ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ",
  RUS: "А Б В Г Д Е Ё Ж З И Й К",
  GRC: "Α Β Γ Δ Ε Ζ Η Θ Ι Κ Λ Μ",
};

const NATIONAL_COSTUMES = {
  USA: [["Cowboy wear", "Western frontier icon"], ["Powwow regalia", "Indigenous ceremonial dress"]],
  BRA: [["Baiana dress", "Afro-Brazilian cultural dress"], ["Carnival costume", "Festival performance clothing"]],
  UKR: [["Vyshyvanka", "Embroidered national shirt"], ["Vinok", "Traditional floral headpiece"]],
  JPN: [["Kimono", "Formal robe with obi"], ["Yukata", "Light summer robe"]],
  IDN: [["Batik", "Wax-resist textile heritage"], ["Kebaya", "Traditional blouse and dress set"]],
  FRA: [["Breton costume", "Regional coastal dress"], ["Alsace dress", "Regional folk outfit"]],
  ITA: [["Sardinian costume", "Island folk dress"], ["Venetian carnival", "Historic mask culture"]],
  IND: [["Sari", "Draped traditional garment"], ["Sherwani", "Formal menswear"]],
};

const ENDANGERED_ANIMALS = {
  USA: ["Red wolf", "Hawaiian monk seal", "California condor"],
  BRA: ["Golden lion tamarin", "Hyacinth macaw", "Amazon river dolphin"],
  UKR: ["European mink", "Saker falcon", "Black stork"],
  JPN: ["Iriomote cat", "Amami rabbit", "Japanese crane"],
  IDN: ["Sumatran tiger", "Javan rhino", "Orangutan"],
  FRA: ["European mink", "Pyrenean desman", "Corsican red deer"],
  ITA: ["Marsican brown bear", "Apennine chamois", "Egyptian vulture"],
  IND: ["Bengal tiger", "Asiatic lion", "Ganges river dolphin"],
  ATA: ["Emperor penguin", "Antarctic blue whale", "Wandering albatross"],
};

const COST_OF_LIVING_BY_CITY = {
  USA: [["New York City", "$180/day"], ["Washington, D.C.", "$145/day"], ["Chicago", "$115/day"]],
  BRA: [["Sao Paulo", "$70/day"], ["Rio de Janeiro", "$82/day"], ["Brasilia", "$66/day"]],
  UKR: [["Kyiv", "$55/day"], ["Lviv", "$48/day"], ["Odesa", "$52/day"]],
  JPN: [["Tokyo", "$135/day"], ["Osaka", "$105/day"], ["Kyoto", "$115/day"]],
  IDN: [["Jakarta", "$54/day"], ["Bali", "$78/day"], ["Surabaya", "$42/day"]],
  FRA: [["Paris", "$155/day"], ["Lyon", "$105/day"], ["Marseille", "$98/day"]],
  ITA: [["Rome", "$125/day"], ["Milan", "$140/day"], ["Naples", "$88/day"]],
  IND: [["New Delhi", "$42/day"], ["Mumbai", "$58/day"], ["Bengaluru", "$48/day"]],
};

const CONSTELLATION_EXTRAS = [
  { name: "Orion", stars: [[-6.2, -1.6, -9.8], [-5.45, -1.1, -9.8], [-4.7, -1.55, -9.8], [-5.4, -2.1, -9.8], [-5.0, -2.85, -9.8], [-5.85, -2.88, -9.8]], links: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5]] },
  { name: "Cassiopeia", stars: [[4.2, 3.0, -9.4], [4.82, 3.35, -9.4], [5.42, 3.08, -9.4], [6.05, 3.42, -9.4], [6.72, 3.16, -9.4]], links: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { name: "Cygnus", stars: [[-1.2, 4.1, -10.4], [-0.62, 3.5, -10.4], [-0.02, 2.9, -10.4], [-0.9, 2.82, -10.4], [0.75, 2.72, -10.4], [-0.1, 4.28, -10.4]], links: [[0, 1], [1, 2], [2, 3], [2, 4], [1, 5]] },
  { name: "Scorpius", stars: [[5.2, -3.4, -9.7], [5.72, -3.15, -9.7], [6.1, -2.72, -9.7], [6.38, -2.14, -9.7], [6.76, -1.82, -9.7], [7.2, -2.15, -9.7]], links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { name: "Lyra", stars: [[2.5, 4.2, -8.8], [2.96, 3.86, -8.8], [3.35, 4.08, -8.8], [3.18, 4.58, -8.8], [2.78, 4.72, -8.8]], links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]] },
];

const WIND_JET_ROUTES = {
  type: "FeatureCollection",
  features: [
    route("Northern jet stream", [[-160, 42], [-95, 50], [-35, 44], [30, 48], [105, 42], [160, 46]]),
    route("Southern jet stream", [[-145, -38], [-80, -44], [-20, -36], [55, -42], [130, -35], [175, -39]]),
    route("Tropical trade winds", [[-70, 10], [-20, 4], [35, 12], [90, 7], [145, 13]]),
    route("Polar vortex stream", [[-150, 64], [-90, 70], [-20, 66], [60, 71], [140, 67]]),
  ],
};

const UNIVERSE_LEVELS = [
  { label: "Earth", body: "earth", position: [-0.48, 0.08, 5.85], target: [-0.55, 0, 0], maxDistance: 8.2 },
  { label: "Solar System", body: "solar", position: [0, 6.2, 12.5], target: [0, 0, 0], maxDistance: 22 },
  { label: "Galaxy", body: "solar", position: [0, 18, 34], target: [0, 0, 0], maxDistance: 55 },
  { label: "Universe", body: "solar", position: [0, 34, 72], target: [0, 0, 0], maxDistance: 95 },
];

const ACHIEVEMENT_DEFS = [
  ["first-country", "Country lock", "Select any country"],
  ["space-mode", "Space jump", "Open a planet or solar mode"],
  ["narrator", "Voice online", "Enable AI narrator"],
  ["screenshot", "Scene archived", "Save a PNG angle"],
  ["seismic-filter", "Quake analyst", "Use magnitude filter"],
  ["universe-zoom", "Scale breaker", "Zoom out to universe mode"],
  ["iss-lock", "ISS contact", "Receive live ISS position"],
];

const CINEMATIC_TOUR_STOPS = [
  { type: "body", key: "solar", label: "Solar system overview", position: [0, 6.2, 12.5], target: [0, 0, 0] },
  { type: "body", key: "earth", label: "Earth country layers", position: [-0.35, 0.55, 5.4] },
  { type: "country", key: "BRA", label: "Brazil rainforest and coast" },
  { type: "country", key: "JPN", label: "Japan island arc" },
  { type: "body", key: "moon", label: "Moon mission sites", position: [-0.1, 0.2, 4.8] },
  { type: "body", key: "mars", label: "Mars rover terrain", position: [0.25, 0.12, 4.9] },
  { type: "body", key: "jupiter", label: "Jupiter scale and storms", position: [0.35, 0.22, 5.4] },
];

const COMMAND_STATIC_ACTIONS = [
  { label: "Toggle cinematic tour", type: "mode", run: () => toggleCinematicTour() },
  { label: "Toggle voice narrator", type: "mode", run: () => toggleVoiceNarrator() },
  { label: "Run time travel replay", type: "mode", run: () => toggleTimeReplay() },
  { label: "Save current camera view", type: "tool", run: () => saveCameraView() },
  { label: "Export mini report PDF", type: "tool", run: () => downloadMiniReportPdf() },
  { label: "Download current globe PNG", type: "tool", run: () => downloadGlobeView() },
  { label: "Cycle universe zoom", type: "mode", run: () => cycleUniverseZoom() },
];

const SURFACE_MISSIONS = {
  moon: [
    point("Apollo 11", 0.674, 23.473, "First crewed Moon landing site"),
    point("Apollo 15", 26.132, 3.634, "Hadley-Apennine science landing"),
    point("Chang'e 4", -45.444, 177.599, "Far-side lunar landing"),
    point("Luna 24", 12.75, 62.2, "Sample return site"),
  ],
  mars: [
    point("Perseverance rover", 18.444, 77.451, "Jezero crater rover mission"),
    point("Curiosity rover", -4.589, 137.441, "Gale crater rover mission"),
    point("Viking 1", 22.48, -48.0, "First successful Mars lander"),
    point("Olympus Mons", 18.65, -133.8, "Largest known volcano in the solar system"),
    point("Valles Marineris", -14, -59, "Giant canyon system"),
  ],
};

const HISTORICAL_ERAS = [
  { year: 1492, label: "Age of ocean exploration", color: "rgba(255, 191, 105, 0.36)" },
  { year: 1776, label: "Revolutionary Atlantic era", color: "rgba(88, 211, 223, 0.28)" },
  { year: 1914, label: "Pre-WWI imperial map", color: "rgba(255, 111, 145, 0.25)" },
  { year: 1945, label: "Postwar realignment", color: "rgba(152, 166, 255, 0.28)" },
  { year: 1991, label: "Post-Cold War borders", color: "rgba(157, 247, 109, 0.24)" },
  { year: 2026, label: "Current country borders", color: "rgba(236, 255, 143, 0.16)" },
];

const CELESTIAL_BODIES = {
  solar: {
    name: "Solar System",
    kicker: "3D Model",
    radiusScale: 1,
    atmosphere: 0xffd36a,
    summary:
      "A cinematic model with realistic procedural planets, constellations, satellites, meteor streams, comets, asteroid belts, trails, labels, and clickable planets.",
    stats: [
      ["id", "Mode", "Solar"],
      ["capital", "Objects", "Planets + probes"],
      ["continent", "Sky", "Stars + meteors"],
    ],
    markers: [],
  },
  earth: {
    name: "Earth",
    kicker: "3D World Map",
    radiusScale: 1,
    atmosphere: 0x6ddcf1,
    markers: [],
  },
  mercury: {
    name: "Mercury",
    kicker: "Mercury Explorer",
    radiusScale: 0.88,
    atmosphere: 0xbfc0bc,
    summary: "Explore a stylized Mercury with crater fields, scarps, and sun-blasted basin regions.",
    stats: [
      ["id", "Body", "Mercury"],
      ["capital", "Gravity", "3.70 m/s2"],
      ["continent", "Diameter", "4,879 km"],
    ],
    markers: [
      point("Caloris Basin", 30.5, 162.7, "Huge impact basin"),
      point("Discovery Rupes", -55, -37, "Long cliff-like scarp"),
      point("Hokusai Crater", 58, 16, "Bright ray crater"),
      point("North Polar Ice", 85, 0, "Shadowed polar deposits"),
    ],
  },
  moon: {
    name: "Moon",
    kicker: "Lunar Explorer",
    radiusScale: 0.92,
    atmosphere: 0xbfd4ff,
    summary: "Explore a stylized lunar surface with craters, maria, landing areas, and mountain regions.",
    stats: [
      ["id", "Body", "Moon"],
      ["capital", "Gravity", "1.62 m/s2"],
      ["continent", "Diameter", "3,474 km"],
    ],
    markers: [
      point("Mare Tranquillitatis", 8.5, 31.4, "Apollo 11 landing region"),
      point("Tycho Crater", -43.3, -11.2, "Bright ray crater"),
      point("Copernicus Crater", 9.7, -20.1, "Large lunar impact crater"),
      point("South Pole", -89.9, 0, "Ice-rich exploration target"),
    ],
  },
  venus: {
    name: "Venus",
    kicker: "Venus Explorer",
    radiusScale: 0.98,
    atmosphere: 0xffd08a,
    summary: "Explore a stylized Venus with volcanic plains, highland regions, and dense-atmosphere landmarks.",
    stats: [
      ["id", "Body", "Venus"],
      ["capital", "Gravity", "8.87 m/s2"],
      ["continent", "Diameter", "12,104 km"],
    ],
    markers: [
      point("Maxwell Montes", 65.2, 3.3, "Highest mountain region on Venus"),
      point("Ishtar Terra", 70, 25, "Northern highland continent"),
      point("Aphrodite Terra", -10, 95, "Large equatorial highland"),
      point("Maat Mons", 0.5, 194.6, "Large Venusian volcano"),
    ],
  },
  mars: {
    name: "Mars",
    kicker: "Mars Explorer",
    radiusScale: 0.96,
    atmosphere: 0xff9d66,
    summary: "Explore Mars with volcanoes, canyon systems, dusty plains, and rover-style research zones.",
    stats: [
      ["id", "Body", "Mars"],
      ["capital", "Gravity", "3.71 m/s2"],
      ["continent", "Diameter", "6,779 km"],
    ],
    markers: [
      point("Olympus Mons", 18.65, -133.8, "Largest known volcano"),
      point("Valles Marineris", -14, -59, "Huge canyon system"),
      point("Gale Crater", -5.4, 137.8, "Curiosity rover area"),
      point("Jezero Crater", 18.44, 77.45, "Perseverance rover area"),
    ],
  },
  jupiter: {
    name: "Jupiter",
    kicker: "Gas Giant Explorer",
    radiusScale: 1.08,
    atmosphere: 0xffd39b,
    summary: "Explore a stylized Jupiter with cloud belts, polar storms, and the Great Red Spot.",
    stats: [
      ["id", "Body", "Jupiter"],
      ["capital", "Gravity", "24.79 m/s2"],
      ["continent", "Diameter", "139,820 km"],
    ],
    markers: [
      point("Great Red Spot", -22, -55, "Long-lived giant storm"),
      point("North Temperate Belt", 24, 30, "Fast cloud band"),
      point("Equatorial Zone", 0, 120, "Bright central cloud zone"),
      point("South Polar Region", -70, 10, "Complex polar storms"),
    ],
  },
  saturn: {
    name: "Saturn",
    kicker: "Ringed Planet Explorer",
    radiusScale: 1.04,
    atmosphere: 0xffd79d,
    summary: "Explore a stylized Saturn with cloud bands, polar storms, and ring-system research targets.",
    stats: [
      ["id", "Body", "Saturn"],
      ["capital", "Gravity", "10.44 m/s2"],
      ["continent", "Diameter", "116,460 km"],
    ],
    markers: [
      point("North Polar Hexagon", 78, 0, "Persistent polar cloud pattern"),
      point("Equatorial Belt", 0, 70, "Fast atmospheric band"),
      point("South Polar Vortex", -75, 40, "Polar storm region"),
      point("Ring Plane", 0, -120, "Main ring-system alignment"),
    ],
  },
  uranus: {
    name: "Uranus",
    kicker: "Ice Giant Explorer",
    radiusScale: 1.02,
    atmosphere: 0x98f4ff,
    summary: "Explore a stylized Uranus with tilted-axis labels, pale cloud bands, and ice-giant atmosphere markers.",
    stats: [
      ["id", "Body", "Uranus"],
      ["capital", "Gravity", "8.69 m/s2"],
      ["continent", "Diameter", "50,724 km"],
    ],
    markers: [
      point("Tilted equator", 0, 0, "Extreme axial tilt reference"),
      point("North polar hood", 72, 45, "Bright polar cloud region"),
      point("Ariel orbit zone", -12, 110, "Major moon region"),
    ],
  },
  neptune: {
    name: "Neptune",
    kicker: "Ice Giant Explorer",
    radiusScale: 1.02,
    atmosphere: 0x7aa5ff,
    summary: "Explore a stylized Neptune with storm bands, deep blue atmosphere, and outer solar-system markers.",
    stats: [
      ["id", "Body", "Neptune"],
      ["capital", "Gravity", "11.15 m/s2"],
      ["continent", "Diameter", "49,244 km"],
    ],
    markers: [
      point("Great Dark Spot zone", -22, -60, "Historic storm region"),
      point("Triton orbit zone", 15, 120, "Largest moon reference"),
      point("Supersonic winds", 0, 25, "High-speed atmosphere band"),
    ],
  },
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
  dayNight: document.querySelector("#day-night"),
  satelliteView: document.querySelector("#satellite-view"),
  cinemaMode: document.querySelector("#cinema-mode"),
  tourMode: document.querySelector("#tour-mode"),
  voiceNarrator: document.querySelector("#voice-narrator"),
  downloadCard: document.querySelector("#download-card"),
  downloadPdf: document.querySelector("#download-pdf"),
  downloadView: document.querySelector("#download-view"),
  saveView: document.querySelector("#save-view"),
  commandOpen: document.querySelector("#command-open"),
  gyroToggle: document.querySelector("#gyro-toggle"),
  arcticView: document.querySelector("#arctic-view"),
  antarcticView: document.querySelector("#antarctic-view"),
  scalePlanets: document.querySelector("#scale-planets"),
  universeZoom: document.querySelector("#universe-zoom"),
  bodySelect: document.querySelector("#body-select"),
  yearSlider: document.querySelector("#year-slider"),
  yearLabel: document.querySelector("#year-label"),
  timeReplay: document.querySelector("#time-replay"),
  quakeMag: document.querySelector("#quake-mag"),
  quakeMagValue: document.querySelector("#quake-mag-value"),
  miniMap: document.querySelector("#mini-map"),
  miniMapLabel: document.querySelector("#mini-map-label"),
  issPosition: document.querySelector("#iss-position"),
  issVelocity: document.querySelector("#iss-velocity"),
  compassNeedle: document.querySelector("#compass-needle"),
  scaleValue: document.querySelector("#scale-value"),
  viewStrip: document.querySelector("#view-strip"),
  savedViews: document.querySelector("#saved-views"),
  screenshotGallery: document.querySelector("#screenshot-gallery"),
  shotGalleryList: document.querySelector("#shot-gallery-list"),
  achievementsHud: document.querySelector("#achievements-hud"),
  achievementList: document.querySelector("#achievement-list"),
  commandMenu: document.querySelector("#command-menu"),
  commandInput: document.querySelector("#command-input"),
  commandResults: document.querySelector("#command-results"),
  commandClose: document.querySelector("#command-close"),
  streetDetail: document.querySelector("#street-detail"),
  streetCanvas: document.querySelector("#street-canvas"),
  streetTitle: document.querySelector("#street-title"),
  streetCaption: document.querySelector("#street-caption"),
  shell: document.querySelector(".app-shell"),
  hero: document.querySelector("#country-hero"),
  flag: document.querySelector("#country-flag"),
  flagLabel: document.querySelector("#country-flag-label"),
  favoriteToggle: document.querySelector("#favorite-toggle"),
  favoritesBlock: document.querySelector("#favorites-block"),
  favoritesList: document.querySelector("#favorites-list"),
  weather: document.querySelector("#weather-card"),
  capitalTime: document.querySelector("#time-card"),
  metrics: document.querySelector("#metrics-card"),
  news: document.querySelector("#news-card"),
  passportSelect: document.querySelector("#passport-select"),
  visaStatus: document.querySelector("#visa-status"),
  visaNote: document.querySelector("#visa-note"),
  csvImport: document.querySelector("#csv-import"),
  onboarding: document.querySelector("#onboarding"),
  tourCopy: document.querySelector("#tour-copy"),
  tourNext: document.querySelector("#tour-next"),
  tourSkip: document.querySelector("#tour-skip"),
  layers: document.querySelectorAll("[data-layer]"),
  intro: document.querySelector("#cinematic-intro"),
  introExplore: document.querySelector("#intro-explore"),
  introPrev: document.querySelector("#intro-prev"),
  introNext: document.querySelector("#intro-next"),
  navHome: document.querySelector("#nav-home"),
  navModel: document.querySelector("#nav-model"),
  navObjects: document.querySelector("#nav-objects"),
  navEarth: document.querySelector("#nav-earth"),
  panelClose: document.querySelector("#panel-close"),
  layersToggle: document.querySelector("#layers-toggle"),
  simDate: document.querySelector("#sim-date"),
  simTime: document.querySelector("#sim-time"),
  simPlay: document.querySelector("#sim-play"),
  storyCards: document.querySelectorAll("[data-body-jump]"),
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
let seaRoutesGroup;
let earthquakeGroup;
let volcanoGroup;
let portGroup;
let airportGroup;
let plateGroup;
let baseGroup;
let spaceportGroup;
let launchGroup;
let migrationGroup;
let currentArrowGroup;
let windArrowGroup;
let csvPinsGroup;
let constellationGroup;
let starFieldGroup;
let scalePlanetsGroup;
let solarSystemGroup;
let zoomGridGroup;
let gdpRingGroup;
let coastGlowGroup;
let scanGroup;
let countryExtrusionGroup;
let populationGlowGroup;
let satelliteTrackerGroup;
let auroraGroup;
let meteorShowerGroup;
let debrisFieldGroup;
let sunFlareGroup;
let celestialMarkersGroup;
let flightArcAnimations = [];
let currentAnimations = [];
let windAnimations = [];
let meteorAnimations = [];
let debrisAnimations = [];
let scanStarted = 0;
let animationTarget = null;
let lastPointerEvent = null;
let isPointerOrbiting = false;
let hoverDisabledUntil = 0;
let isNightMode = false;
let isSatelliteMode = false;
let isGyroEnabled = false;
let isScalePlanetsVisible = false;
let isSimulationPaused = false;
let currentBodyKey = "solar";
let historicalYear = 2026;
let lastStreetKey = "";
let weatherRequestId = 0;
let newsRequestId = 0;
let clockTimer = null;
let favoriteKeys = loadFavorites();
let solarSystemObjects = [];
let solarOrbitAnimations = [];
let solarDynamicObjects = [];
let satelliteTrackerAnimations = [];
let issLiveMarker = null;
let issLiveData = null;
let issRefreshTimer = null;
let latestQuakes = [];
let quakeMinMagnitude = 4.5;
let lastSimClockSecond = -1;
let renderLoopStarted = false;
let isCinematicTour = false;
let tourStartedAt = 0;
let lastTourSegment = -1;
let isVoiceNarratorEnabled = false;
let isTimeReplayActive = false;
let timeReplayStarted = 0;
let savedCameraViews = loadSavedCameraViews();
let screenshotGallery = loadScreenshotGallery();
let achievements = loadAchievements();
let commandItems = [];
let commandIndex = 0;
let universeLevelIndex = 1;

const layerState = {
  borders: true,
  rivers: true,
  routes: true,
  flights: true,
  seaRoutes: true,
  ports: true,
  airports: true,
  quakes: true,
  volcanoes: true,
  plates: false,
  climate: false,
  biomes: false,
  measureGrid: false,
  hurricanes: false,
  lights: true,
  sunLighting: true,
  clouds: true,
  winds: true,
  aurora: true,
  meteors: true,
  debris: true,
  population: true,
  constellations: true,
  satelliteTracker: true,
  bases: false,
  spaceports: false,
  launches: false,
  migration: false,
  currents: true,
  streetMap: false,
  csvPins: true,
};

init().catch((error) => {
  console.error(error);
  setStatus("Could not load the globe data. Check the internet connection.", true);
});

async function init() {
  ensureLibraries();
  setupScene();
  setupEvents();
  startRenderLoop();
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
  buildPopulationDensityGlow();
  updateCapitalMarkers();
  renderFavorites();
  renderSavedViews();
  renderScreenshotGallery();
  buildCommandItems();
  buildEarthTexture();
  drawEarthTexture();
  renderCountryList();
  renderAchievements();
  if (currentBodyKey === "solar") {
    renderSolarPanel();
  } else {
    renderPanel(null);
  }
  drawMiniMap();
  loadEarthquakes();
  loadIssPosition();
  issRefreshTimer = window.setInterval(loadIssPosition, 30000);
  setStatus(currentBodyKey === "solar" ? "Solar system model ready" : "Globe ready");
  startRenderLoop();
}

function startRenderLoop() {
  if (renderLoopStarted) return;
  renderLoopStarted = true;
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
    preserveDrawingBuffer: true,
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
  seaRoutesGroup = new THREE.Group();
  globeGroup.add(seaRoutesGroup);
  earthquakeGroup = new THREE.Group();
  globeGroup.add(earthquakeGroup);
  volcanoGroup = new THREE.Group();
  globeGroup.add(volcanoGroup);
  portGroup = new THREE.Group();
  globeGroup.add(portGroup);
  airportGroup = new THREE.Group();
  globeGroup.add(airportGroup);
  plateGroup = new THREE.Group();
  globeGroup.add(plateGroup);
  baseGroup = new THREE.Group();
  globeGroup.add(baseGroup);
  spaceportGroup = new THREE.Group();
  globeGroup.add(spaceportGroup);
  launchGroup = new THREE.Group();
  globeGroup.add(launchGroup);
  migrationGroup = new THREE.Group();
  globeGroup.add(migrationGroup);
  currentArrowGroup = new THREE.Group();
  globeGroup.add(currentArrowGroup);
  windArrowGroup = new THREE.Group();
  globeGroup.add(windArrowGroup);
  csvPinsGroup = new THREE.Group();
  globeGroup.add(csvPinsGroup);
  zoomGridGroup = new THREE.Group();
  globeGroup.add(zoomGridGroup);
  gdpRingGroup = new THREE.Group();
  globeGroup.add(gdpRingGroup);
  coastGlowGroup = new THREE.Group();
  globeGroup.add(coastGlowGroup);
  scanGroup = new THREE.Group();
  globeGroup.add(scanGroup);
  countryExtrusionGroup = new THREE.Group();
  globeGroup.add(countryExtrusionGroup);
  populationGlowGroup = new THREE.Group();
  globeGroup.add(populationGlowGroup);
  satelliteTrackerGroup = new THREE.Group();
  globeGroup.add(satelliteTrackerGroup);
  auroraGroup = new THREE.Group();
  globeGroup.add(auroraGroup);
  debrisFieldGroup = new THREE.Group();
  globeGroup.add(debrisFieldGroup);
  celestialMarkersGroup = new THREE.Group();
  globeGroup.add(celestialMarkersGroup);
  markersGroup = new THREE.Group();
  globeGroup.add(markersGroup);
  constellationGroup = new THREE.Group();
  scene.add(constellationGroup);
  scalePlanetsGroup = new THREE.Group();
  scene.add(scalePlanetsGroup);
  solarSystemGroup = new THREE.Group();
  solarSystemGroup.visible = false;
  scene.add(solarSystemGroup);
  meteorShowerGroup = new THREE.Group();
  scene.add(meteorShowerGroup);
  sunFlareGroup = new THREE.Group();
  scene.add(sunFlareGroup);
  buildMountainLabels();
  buildFlightArcs();
  buildConstellations();
  buildScalePlanets();
  buildSolarSystem();
  buildStaticDataLayers();
  buildSatelliteTrackerLayer();
  buildAuroraLayer();
  buildMeteorShower();
  buildDebrisField();
  buildSunFlare();
  updateLayerVisibility();
  starFieldGroup = makeStars(7200);
  scene.add(starFieldGroup);
  globeGroup.visible = currentBodyKey !== "solar";
  solarSystemGroup.visible = currentBodyKey === "solar";
  controls.target.set(0, 0, 0);
  controls.minDistance = 3.2;
  controls.maxDistance = 22;
  camera.position.set(0, 6.2, 12.5);
  ui.shell.classList.add("is-solar-mode");
  ui.bodySelect.value = currentBodyKey;
  updateNavState();
  setGlobeLayout();
}

function setupEvents() {
  window.addEventListener("resize", resizeRenderer);
  ui.canvas.addEventListener("pointermove", onPointerMove);
  ui.canvas.addEventListener("pointerleave", clearHover);
  ui.canvas.addEventListener("click", onGlobeClick);
  ui.canvas.addEventListener("wheel", () => {
    hoverDisabledUntil = performance.now() + 750;
    ui.tooltip.hidden = true;
  });
  ui.search.addEventListener("input", () => renderCountryList(ui.search.value));
  ui.reset.addEventListener("click", resetView);
  ui.autoRotate.addEventListener("click", toggleAutoRotate);
  ui.dayNight.addEventListener("click", toggleDayNight);
  ui.satelliteView.addEventListener("click", toggleSatelliteView);
  ui.cinemaMode.addEventListener("click", toggleCinemaMode);
  ui.tourMode.addEventListener("click", toggleCinematicTour);
  ui.voiceNarrator.addEventListener("click", toggleVoiceNarrator);
  ui.downloadCard.addEventListener("click", downloadInfoCard);
  ui.downloadPdf.addEventListener("click", downloadMiniReportPdf);
  ui.downloadView.addEventListener("click", downloadGlobeView);
  ui.saveView.addEventListener("click", saveCameraView);
  ui.commandOpen.addEventListener("click", openCommandMenu);
  ui.gyroToggle.addEventListener("click", toggleGyroControl);
  ui.arcticView.addEventListener("click", () => flyToPolarView("arctic"));
  ui.antarcticView.addEventListener("click", () => flyToPolarView("antarctic"));
  ui.scalePlanets.addEventListener("click", toggleScalePlanets);
  ui.universeZoom?.addEventListener("click", cycleUniverseZoom);
  ui.bodySelect.addEventListener("change", () => {
    ui.shell.classList.add("is-exploring");
    switchBody(ui.bodySelect.value);
  });
  ui.passportSelect.addEventListener("change", () => renderVisaStatus(selectedRecord));
  ui.csvImport.addEventListener("change", importCsvPins);
  ui.timeReplay.addEventListener("click", toggleTimeReplay);
  ui.commandInput.addEventListener("input", () => renderCommandResults(ui.commandInput.value));
  ui.commandInput.addEventListener("keydown", onCommandInputKeydown);
  ui.commandClose.addEventListener("click", closeCommandMenu);
  ui.commandMenu.addEventListener("click", (event) => {
    if (event.target === ui.commandMenu) closeCommandMenu();
  });
  ui.details.addEventListener("input", onDetailsInput);
  ui.details.addEventListener("change", onDetailsInput);
  ui.tourNext.addEventListener("click", advanceTour);
  ui.tourSkip.addEventListener("click", closeTour);
  ui.introExplore?.addEventListener("click", () => {
    ui.shell.classList.add("is-exploring");
    switchBody("solar");
  });
  ui.introPrev?.addEventListener("click", () => switchBody("earth"));
  ui.introNext?.addEventListener("click", () => switchBody("solar"));
  ui.navHome?.addEventListener("click", () => {
    ui.shell.classList.remove("is-exploring");
    switchBody("solar");
  });
  ui.navModel?.addEventListener("click", () => {
    ui.shell.classList.add("is-exploring");
    switchBody("earth");
  });
  ui.navObjects?.addEventListener("click", () => {
    ui.shell.classList.add("is-exploring");
    switchBody("solar");
  });
  ui.navEarth?.addEventListener("click", () => {
    ui.shell.classList.add("is-exploring");
    switchBody("earth");
  });
  ui.panelClose?.addEventListener("click", () => {
    if (currentBodyKey === "earth") {
      renderPanel(null);
    } else {
      renderSolarPanel();
    }
  });
  ui.layersToggle?.addEventListener("click", () => {
    ui.shell.classList.toggle("is-layers-closed");
  });
  ui.simPlay?.addEventListener("click", () => {
    isSimulationPaused = !isSimulationPaused;
    ui.simPlay.textContent = isSimulationPaused ? "PAUSED" : "REAL RATE";
    ui.simPlay.classList.toggle("is-paused", isSimulationPaused);
    controls.autoRotate = !isSimulationPaused;
    ui.autoRotate.classList.toggle("is-active", controls.autoRotate);
  });
  ui.storyCards.forEach((button) => {
    button.addEventListener("click", () => {
      ui.shell.classList.add("is-exploring");
      switchBody(button.dataset.bodyJump || "solar");
    });
  });
  controls.addEventListener("start", () => {
    isPointerOrbiting = true;
    hoverDisabledUntil = performance.now() + 450;
  });
  controls.addEventListener("end", () => {
    hoverDisabledUntil = performance.now() + 500;
    window.setTimeout(() => {
      isPointerOrbiting = false;
    }, 250);
  });
  ui.yearSlider.addEventListener("input", () => {
    isTimeReplayActive = false;
    ui.timeReplay.classList.remove("is-active");
    historicalYear = Number(ui.yearSlider.value);
    ui.yearLabel.textContent = String(historicalYear);
    drawEarthTexture();
  });
  ui.favoriteToggle.addEventListener("click", toggleFavorite);
  ui.quakeMag?.addEventListener("input", () => {
    quakeMinMagnitude = Number(ui.quakeMag.value);
    ui.quakeMagValue.textContent = `${quakeMinMagnitude.toFixed(1)}+`;
    renderEarthquakeLayer();
    unlockAchievement("seismic-filter");
  });

  ui.layers.forEach((input) => {
    input.addEventListener("change", () => {
      layerState[input.dataset.layer] = input.checked;
      drawEarthTexture();
      updateLayerVisibility();
      if (input.dataset.layer === "streetMap") updateStreetDetail(selectedRecord);
      if (input.dataset.layer === "clouds" && cloudMesh) cloudMesh.visible = input.checked && currentBodyKey === "earth";
    });
  });

  clockTimer = window.setInterval(updateCapitalClock, 1000);
  document.addEventListener("keydown", onGlobalKeydown);
  setupOnboarding();
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
  const override = COUNTRY_OVERRIDES[cca3] || COUNTRY_OVERRIDES[geometryName] || null;
  const continent = rest?.continents?.[0] || manual?.continent || override?.continent || inferContinent(rest?.region, geometryName);
  const capital = override?.capital || rest?.capital?.[0] || manual?.capital || "";
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
  const capitalCoords = override?.capitalCoords || (rest?.capitalInfo?.latlng
    ? { lat: rest.capitalInfo.latlng[0], lon: rest.capitalInfo.latlng[1] }
    : null);
  const flag = rest?.flags?.svg || rest?.flags?.png || "";
  const flagPng = cca2 ? `https://flagcdn.com/w80/${cca2.toLowerCase()}.png` : rest?.flags?.png || flag;
  const center = window.d3.geoCentroid(feature);
  const climate = getClimateZone(center[1] || 0);
  const biome = getBiomeName(name, center[1] || 0);
  const signals = makeCountrySignals({ name, cca3, population: rest?.population || manual?.population, area: rest?.area || manual?.area, continent });

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
    maps: getCountryMapUrl(name),
    timeZone: override?.timeZone || manual?.timeZone || "",
    climate,
    biome,
    signals,
    summary: override?.summary || COUNTRY_FACTS[cca3] || manual?.summary || "",
    cities: override?.cities || manual?.cities || CITY_HIGHLIGHTS[cca3] || buildFallbackCities(capital, capitalCoords),
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

  if (currentBodyKey !== "earth") {
    drawCelestialTexture(ctx, CELESTIAL_BODIES[currentBodyKey]);
    earthTexture.needsUpdate = true;
    return;
  }

  const ocean = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ocean.addColorStop(0, isSatelliteMode ? "#03213d" : isNightMode ? "#032d63" : "#075ea9");
  ocean.addColorStop(0.48, isSatelliteMode ? "#063b5d" : isNightMode ? "#063e69" : "#1288c4");
  ocean.addColorStop(1, isSatelliteMode ? "#021522" : isNightMode ? "#011c32" : "#03547d");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  drawOceanDepth(ctx);
  if (layerState.currents) drawOceanCurrents(ctx);
  if (layerState.winds) drawWindFlowTexture(ctx);
  drawWaterLevel(ctx, path);
  if (isSatelliteMode) drawSatelliteNoise(ctx);

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

  if (layerState.climate) {
    drawClimateZones(ctx);
  }

  if (layerState.biomes) {
    drawBiomeOverlay(ctx, path);
  }

  if (layerState.hurricanes) {
    drawHurricaneZones(ctx, path);
  }

  drawHistoricalOverlay(ctx);
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

  if (layerState.seaRoutes) {
    ctx.save();
    ctx.strokeStyle = isNightMode ? "rgba(105, 194, 255, 0.72)" : "rgba(135, 218, 255, 0.78)";
    ctx.lineWidth = 2.4;
    ctx.setLineDash([30, 13]);
    ctx.beginPath();
    path(SEA_ROUTES);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  if (layerState.plates) {
    drawPlateBoundaries(ctx, path);
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

  if (layerState.sunLighting) {
    drawRealtimeNightMask(ctx);
  }

  if ((isNightMode || layerState.sunLighting) && layerState.lights) {
    drawNightOverlay(ctx, isNightMode ? 0.34 : 0.06);
  }

  if (layerState.streetMap && selectedRecord) {
    drawStreetFocusPatch(ctx);
  }

  if (selectedRecord) {
    drawSelectedCoastGlow(ctx, path);
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

  if (layerState.measureGrid && camera.position.distanceTo(getGlobeCenter()) < 4.2) {
    drawZoomMeasurementGrid(ctx);
  }

  earthTexture.needsUpdate = true;
  drawMiniMap();
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

function drawWindFlowTexture(ctx) {
  const projection = textureContext.projection;
  ctx.save();
  ctx.strokeStyle = isNightMode ? "rgba(236, 255, 143, 0.16)" : "rgba(255, 245, 170, 0.2)";
  ctx.fillStyle = isNightMode ? "rgba(236, 255, 143, 0.34)" : "rgba(255, 245, 170, 0.38)";
  ctx.lineWidth = 2.1;
  ctx.lineCap = "round";
  WIND_JET_ROUTES.features.forEach((feature) => {
    const coords = feature.geometry.coordinates;
    for (let i = 1; i < coords.length; i += 1) {
      const [x1, y1] = projection(coords[i - 1]);
      const [x2, y2] = projection(coords[i]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 24, x2, y2);
      ctx.stroke();
      if (i % 2 === 1) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 - 14;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - Math.cos(angle - 0.45) * 16, my - Math.sin(angle - 0.45) * 16);
        ctx.lineTo(mx - Math.cos(angle + 0.45) * 16, my - Math.sin(angle + 0.45) * 16);
        ctx.closePath();
        ctx.fill();
      }
    }
  });
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

function drawNightOverlay(ctx, alpha = 0.34) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 8, 18, ${alpha})`;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  drawNightLights(ctx);
  ctx.restore();
}

function drawNightLights(ctx) {
  const projection = textureContext.projection;
  const lightCities = countryRecords
    .flatMap((record) => record.cities.slice(0, 4).map((cityRecord, index) => ({ cityRecord, record, index })))
    .filter(({ cityRecord }) => Number.isFinite(cityRecord.lat) && Number.isFinite(cityRecord.lon));

  lightCities.forEach(({ cityRecord, record, index }) => {
    const [x, y] = projection([cityRecord.lon, cityRecord.lat]);
    const densityHeat = THREE.MathUtils.clamp((record.signals?.density || 30) / 520, 0.2, 1.25);
    const radius = THREE.MathUtils.clamp((index === 0 ? 19 : 12) * densityHeat + (record.population || 0) / 90000000, 10, 32);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, "rgba(255, 244, 177, 0.98)");
    glow.addColorStop(0.32, "rgba(255, 199, 91, 0.48)");
    glow.addColorStop(0.68, "rgba(88, 211, 223, 0.15)");
    glow.addColorStop(1, "rgba(255, 190, 90, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRealtimeNightMask(ctx) {
  const { lon: sunLon } = getRealtimeSunInfo();
  const nightCenter = normalizeLon(sunLon + 180);
  const xCenter = ((nightCenter + 180) / 360) * TEXTURE_WIDTH;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let wrap = -1; wrap <= 1; wrap += 1) {
    const x = xCenter + wrap * TEXTURE_WIDTH;
    const gradient = ctx.createLinearGradient(x - TEXTURE_WIDTH * 0.38, 0, x + TEXTURE_WIDTH * 0.38, 0);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.34, "rgba(42,55,88,0.62)");
    gradient.addColorStop(0.5, "rgba(3,8,20,0.34)");
    gradient.addColorStop(0.66, "rgba(42,55,88,0.62)");
    gradient.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - TEXTURE_WIDTH * 0.42, 0, TEXTURE_WIDTH * 0.84, TEXTURE_HEIGHT);
  }
  ctx.restore();
}

function getTerrainColor(record, feature) {
  if (!record) return REGION_COLORS.World || TERRAIN_COLORS.grass;
  if (isSatelliteMode) {
    if (SNOW_COUNTRIES.has(record.name) || getCountryLatitude(feature) > 66) return "#dbe6e7";
    if (DESERT_COUNTRIES.has(record.name)) return "#b99050";
    if (FOREST_COUNTRIES.has(record.name)) return "#22623f";
    return record.continent === "Europe" || record.continent === "Asia" ? "#577c4e" : "#4e8f54";
  }
  if (SNOW_COUNTRIES.has(record.name) || getCountryLatitude(feature) > 66) return TERRAIN_COLORS.snow;
  if (DESERT_COUNTRIES.has(record.name)) return TERRAIN_COLORS.sand;
  if (FOREST_COUNTRIES.has(record.name)) return TERRAIN_COLORS.forest;
  if (record.continent === "Antarctic") return TERRAIN_COLORS.snow;
  if (record.continent === "Europe") return "#7fad6e";
  if (record.continent === "Asia") return "#5e9f63";
  if (record.continent === "Oceania") return "#58a889";
  return TERRAIN_COLORS.grass;
}

function drawSatelliteNoise(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * TEXTURE_WIDTH;
    const y = Math.random() * TEXTURE_HEIGHT;
    const shade = 30 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgb(${shade}, ${shade + 12}, ${shade + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function drawClimateZones(ctx) {
  const projection = textureContext.projection;
  ctx.save();
  CLIMATE_BANDS.forEach((band) => {
    [
      { from: band.from, to: band.to },
      { from: -band.to, to: -band.from },
    ].forEach((range) => {
      const y1 = projection([0, range.from])[1];
      const y2 = projection([0, range.to])[1];
      ctx.fillStyle = band.color;
      ctx.fillRect(0, Math.min(y1, y2), TEXTURE_WIDTH, Math.abs(y2 - y1));
    });
  });
  ctx.restore();
}

function drawBiomeOverlay(ctx, path) {
  ctx.save();
  ctx.globalAlpha = 0.42;
  const colors = ["#2da769", "#358e5c", "#d5b464", "#8fb36c", "#9bc5a2", "#d8eef0"];
  BIOME_AREAS.features.forEach((feature, index) => {
    ctx.beginPath();
    path(feature);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
  });
  ctx.restore();
}

function drawHurricaneZones(ctx, path) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 111, 145, 0.19)";
  ctx.strokeStyle = "rgba(255, 111, 145, 0.72)";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 12]);
  HURRICANE_ZONES.features.forEach((feature) => {
    ctx.beginPath();
    path(feature);
    ctx.fill();
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.restore();
}

function drawStreetFocusPatch(ctx) {
  const coords = getWeatherCoords(selectedRecord);
  if (!coords) return;
  const projection = textureContext.projection;
  const [x, y] = projection([coords.lon, coords.lat]);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(236, 255, 143, 0.88)";
  ctx.fillStyle = "rgba(88, 211, 223, 0.18)";
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 10]);
  ctx.strokeRect(-95, -95, 190, 190);
  ctx.fillRect(-95, -95, 190, 190);
  ctx.setLineDash([]);
  ctx.fillStyle = "#ecff8f";
  ctx.font = "900 28px Segoe UI, Arial, sans-serif";
  ctx.fillText("Street tile focus", -88, -108);
  ctx.restore();
}

function drawHistoricalOverlay(ctx) {
  if (historicalYear >= 2020) return;
  const era = getHistoricalEra();
  const projection = textureContext.projection;
  ctx.save();
  ctx.fillStyle = era.color;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  ctx.fillStyle = "rgba(255, 246, 202, 0.82)";
  ctx.font = "800 42px Segoe UI, Arial, sans-serif";
  ctx.fillText(`${historicalYear}: ${era.label}`, 80, 98);
  const pulses = [
    [-74, 40, "Atlantic"],
    [31, 30, "Suez"],
    [77, 23, "South Asia"],
    [116, 40, "East Asia"],
    [-58, -15, "Americas"],
  ];
  pulses.forEach(([lon, lat, label], index) => {
    const [x, y] = projection([lon, lat]);
    ctx.strokeStyle = index % 2 ? "rgba(88, 211, 223, 0.65)" : "rgba(255, 191, 105, 0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 42 + index * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff4c8";
    ctx.font = "700 28px Segoe UI, Arial, sans-serif";
    ctx.fillText(label, x + 48, y + 8);
  });
  ctx.restore();
}

function drawPlateBoundaries(ctx, path) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 111, 145, 0.82)";
  ctx.lineWidth = 3.4;
  ctx.shadowColor = "#ff6f91";
  ctx.shadowBlur = 12;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  path(TECTONIC_PLATES);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSelectedCoastGlow(ctx, path) {
  if (!selectedRecord) return;
  ctx.save();
  ctx.beginPath();
  path(selectedRecord.feature);
  ctx.strokeStyle = "rgba(88, 211, 223, 0.95)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "#58d3df";
  ctx.shadowBlur = 20;
  ctx.stroke();
  ctx.restore();
}

function drawZoomMeasurementGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = "rgba(236, 255, 143, 0.22)";
  ctx.lineWidth = 1;
  const projection = textureContext.projection;
  for (let lat = -80; lat <= 80; lat += 5) {
    ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 5) {
      const [x, y] = projection([lon, lat]);
      if (lon === -180) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 5) {
    ctx.beginPath();
    for (let lat = -85; lat <= 85; lat += 5) {
      const [x, y] = projection([lon, lat]);
      if (lat === -85) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(236, 255, 143, 0.78)";
  ctx.font = "800 30px Segoe UI, Arial, sans-serif";
  ctx.fillText("Zoom grid: approx. 500 km spacing", 80, TEXTURE_HEIGHT - 80);
  ctx.restore();
}

function drawCelestialTexture(ctx, body) {
  const key = currentBodyKey;
  const base = {
    solar: ["#fff4a4", "#ffd24f", "#ff8d1d"],
    mercury: ["#514f4b", "#bdb6a8", "#2f2f31"],
    moon: ["#6d737c", "#b6bdc4", "#3c4148"],
    venus: ["#8b6330", "#e5b56a", "#4c351c"],
    mars: ["#6c2c1f", "#c06834", "#351812"],
    jupiter: ["#8b5d3d", "#f0c28b", "#58351f"],
    saturn: ["#806143", "#e8c58d", "#5b422a"],
    uranus: ["#143f4f", "#77e3ef", "#d1fbff"],
    neptune: ["#112f7c", "#245bd8", "#86a9ff"],
  }[key] || ["#075ea9", "#1288c4", "#03547d"];
  paintSolarPlanetTexture(ctx, TEXTURE_WIDTH, TEXTURE_HEIGHT, key, base, key === "jupiter" || key === "saturn" || key === "solar");
}

function getHistoricalEra() {
  return HISTORICAL_ERAS.reduce((best, era) => (Math.abs(era.year - historicalYear) < Math.abs(best.year - historicalYear) ? era : best));
}

function getClimateZone(lat) {
  const absLat = Math.abs(lat);
  if (absLat >= 66) return "Polar";
  if (absLat >= 42) return "Continental";
  if (absLat >= 23.5) return "Temperate / dry";
  return "Tropical";
}

function getBiomeName(name, lat) {
  if (SNOW_COUNTRIES.has(name) || Math.abs(lat) > 66) return "Tundra / ice";
  if (FOREST_COUNTRIES.has(name)) return "Rainforest";
  if (DESERT_COUNTRIES.has(name)) return "Desert";
  if (Math.abs(lat) > 48) return "Taiga / mixed forest";
  if (Math.abs(lat) > 28) return "Steppe / temperate";
  return "Savanna / tropical mix";
}

function makeCountrySignals(record) {
  const seed = getStableNumber(record.cca3 || record.name);
  const population = record.population || 0;
  const area = record.area || 1;
  const gdp = Math.max(18, Math.round((population / 1000000) * (6 + (seed % 30))));
  const gdpPerCapita = Math.max(900, Math.round((gdp * 1000000000) / Math.max(1, population || 15000000)));
  const inflation = ((seed % 85) / 10 + 1.2).toFixed(1);
  const exportPower = ["Low", "Medium", "High", "Very high"][seed % 4];
  const internet = Math.min(98, Math.max(28, Math.round(42 + (seed % 56) + (population > 50000000 ? 4 : 0))));
  const speed = Math.min(220, Math.max(18, Math.round(22 + (seed % 105))));
  const mobile = Math.min(99, Math.max(45, Math.round(54 + (seed % 46))));
  const density = Math.round(population / Math.max(1, area));
  const tourism = Math.max(0.4, Math.round(((seed % 45) + (record.continent === "Europe" ? 18 : 5)) * 10) / 10);
  const happiness = Math.min(8.7, Math.max(3.6, Math.round((3.8 + (seed % 45) / 10) * 10) / 10));
  const freedom = Math.min(96, Math.max(28, 32 + (seed % 64)));
  const safety = Math.min(98, Math.max(26, 35 + ((seed * 7) % 62)));
  const militaryBudget = Math.max(0.3, Math.round(((population / 1000000) * (0.08 + (seed % 18) / 20)) * 10) / 10);
  const army = Math.max(6, Math.round((population / 1000000) * (0.8 + (seed % 8) / 10)));
  const navy = ["Coastal", "Regional", "Blue-water", "Limited"][seed % 4];
  const airForce = Math.max(12, Math.round((population / 1000000) * (1.4 + (seed % 12) / 8)));
  return {
    gdp,
    gdpPerCapita,
    inflation,
    exportPower,
    internet,
    speed,
    mobile,
    density,
    tourism,
    happiness,
    freedom,
    safety,
    militaryBudget,
    army,
    navy,
    airForce,
  };
}

function getCountryLatitude(feature) {
  const centroid = window.d3.geoCentroid(feature);
  return Number.isFinite(centroid[1]) ? Math.abs(centroid[1]) : 0;
}

function renderCountryList(filter = "") {
  if (currentBodyKey !== "earth") {
    ui.list.replaceChildren();
    return;
  }
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
    applyCountryTheme(null);
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
    renderMetrics(null);
    renderNews(null);
    renderVisaStatus(null);
    renderFavorites();
    return;
  }

  ui.panelKicker.textContent = "Country";
  ui.title.textContent = record.name;
  applyCountryTheme(record);
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
  const mapLink = record.maps ? `<a href="${escapeHtml(record.maps)}" target="_blank" rel="noreferrer">Open map</a>` : "";
  const cityCards = record.cities
    .slice(0, 4)
    .map(
      (item) => `
        <article class="city-photo-card">
          <img src="${escapeHtml(getCityPhotoUrl(item, record))}" data-fallback="${escapeHtml(makeCityFallbackImage(item, record))}" alt="${escapeHtml(item.name)} city photo" loading="lazy" onerror="this.onerror=null;this.src=this.dataset.fallback" />
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.note)}</span>
        </article>
      `,
    )
    .join("");
  const foodCards = getFoodItems(record)
    .map(
      (food) => `
        <article class="city-photo-card">
          <img src="${escapeHtml(getFoodPhotoUrl(food, record))}" data-fallback="${escapeHtml(makeFoodFallbackImage(food, record))}" alt="${escapeHtml(food)} food photo" loading="lazy" onerror="this.onerror=null;this.src=this.dataset.fallback" />
          <strong>${escapeHtml(food)}</strong>
          <span>Traditional food from ${escapeHtml(record.name)}</span>
        </article>
      `,
    )
    .join("");
  const disasters = getDisasterHistory(record)
    .map((item) => `<li><strong>${escapeHtml(item.split(" ")[0])}</strong> - ${escapeHtml(item)}</li>`)
    .join("");
  const extendedSections = makeCountryFeatureSections(record);

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
      <li><strong>Climate:</strong> ${escapeHtml(record.climate || "-")}</li>
      <li><strong>Biome:</strong> ${escapeHtml(record.biome || "-")}</li>
    </ul>
    <h3>City photos</h3>
    <div class="city-photo-grid">${cityCards}</div>
    <h3>Traditional food</h3>
    <div class="city-photo-grid">${foodCards}</div>
    <h3>Interesting cities</h3>
    <ul>
      ${record.cities
        .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`)
        .join("")}
    </ul>
    <h3>Disaster history</h3>
    <ul>${disasters}</ul>
    ${extendedSections}
  `;
  renderWeather(record);
  renderCapitalTime(record);
  renderMetrics(record);
  renderNews(record);
  renderVisaStatus(record);
  if (isVoiceNarratorEnabled) speakCurrentSelection();
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=sunrise,sunset&timezone=auto`;
  fetchJsonWithTimeout(url)
    .then((data) => {
      if (requestId !== weatherRequestId) return;
      const current = data.current;
      if (!current) throw new Error("Missing weather");
      record.timeZone = data.timezone || record.timeZone || "";
      updateCapitalClock();
      const description = describeWeather(current.weather_code);
      const sunrise = formatIsoTime(data.daily?.sunrise?.[0], record.timeZone);
      const sunset = formatIsoTime(data.daily?.sunset?.[0], record.timeZone);
      ui.weather.innerHTML = `
        <span>Capital weather</span>
        <strong>${escapeHtml(record.capital || record.name)}: ${Math.round(current.temperature_2m)} C</strong>
        <p>${escapeHtml(description)}. Humidity ${Math.round(current.relative_humidity_2m)}%, wind ${Math.round(current.wind_speed_10m)} km/h.</p>
        <p>Sunrise ${escapeHtml(sunrise)} / sunset ${escapeHtml(sunset)}.</p>
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

function renderMetrics(record) {
  if (!record) {
    ui.metrics.innerHTML = `
      <span>Country signals</span>
      <strong>Select a country</strong>
      <p>GDP ring, internet, climate, and biome signals appear here.</p>
    `;
    return;
  }

  const signals = record.signals;
  ui.metrics.innerHTML = `
    <span>Country signals</span>
    <strong>${escapeHtml(record.climate)} / ${escapeHtml(record.biome)}</strong>
    <div class="metric-grid">
      <div class="metric-pill"><em>GDP demo</em><b>$${escapeHtml(formatNumber(signals.gdp))}B</b></div>
      <div class="metric-pill"><em>GDP per cap</em><b>$${escapeHtml(formatNumber(signals.gdpPerCapita))}</b></div>
      <div class="metric-pill"><em>Inflation</em><b>${escapeHtml(signals.inflation)}%</b></div>
      <div class="metric-pill"><em>Export power</em><b>${escapeHtml(signals.exportPower)}</b></div>
      <div class="metric-pill"><em>Internet</em><b>${escapeHtml(signals.internet)}%</b></div>
      <div class="metric-pill"><em>Mobile cover</em><b>${escapeHtml(signals.mobile)}%</b></div>
      <div class="metric-pill"><em>Speed</em><b>${escapeHtml(signals.speed)} Mbps</b></div>
      <div class="metric-pill"><em>Density</em><b>${escapeHtml(signals.density)} / km2</b></div>
      <div class="metric-pill"><em>Tourism</em><b>${escapeHtml(signals.tourism)}M / year</b></div>
      <div class="metric-pill"><em>Happiness</em><b>${escapeHtml(signals.happiness)} / 10</b></div>
      <div class="metric-pill"><em>Freedom</em><b>${escapeHtml(signals.freedom)}%</b></div>
      <div class="metric-pill"><em>Safety</em><b>${escapeHtml(signals.safety)}%</b></div>
      <div class="metric-pill"><em>Defense budget</em><b>$${escapeHtml(signals.militaryBudget)}B</b></div>
      <div class="metric-pill"><em>Army</em><b>${escapeHtml(signals.army)}k active</b></div>
      <div class="metric-pill"><em>Navy</em><b>${escapeHtml(signals.navy)}</b></div>
      <div class="metric-pill"><em>Air force</em><b>${escapeHtml(signals.airForce)} aircraft</b></div>
    </div>
  `;
}

function renderVisaStatus(record) {
  if (!record) {
    ui.visaStatus.textContent = "Choose a country";
    ui.visaNote.textContent = "Entry estimate appears here after selecting a country.";
    return;
  }
  const passport = ui.passportSelect.value;
  const status = getVisaStatus(passport, record.cca3);
  ui.visaStatus.textContent = status.label;
  ui.visaNote.textContent = `${PASSPORT_LABELS[passport]} passport to ${record.name}: ${status.note}`;
}

function renderNews(record) {
  newsRequestId += 1;
  const requestId = newsRequestId;
  if (!record) {
    ui.news.innerHTML = `
      <span>Latest news</span>
      <strong>Choose a country</strong>
      <p>Recent headlines will load from a public news index.</p>
    `;
    return;
  }

  ui.news.innerHTML = `
    <span>Latest news</span>
    <strong>Loading headlines...</strong>
    <p>Fetching recent stories for ${escapeHtml(record.name)}.</p>
  `;

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(
    `"${record.name}"`,
  )}&mode=ArtList&format=json&maxrecords=4&sort=HybridRel`;
  fetchJsonWithTimeout(url, 7000)
    .then((data) => {
      if (requestId !== newsRequestId) return;
      const articles = Array.isArray(data.articles) ? data.articles.slice(0, 4) : [];
      if (!articles.length) throw new Error("No news");
      ui.news.innerHTML = `
        <span>Latest news</span>
        <strong>${escapeHtml(record.name)} headlines</strong>
        <div class="news-list">
          ${articles
            .map(
              (article) =>
                `<a href="${escapeHtml(article.url)}" target="_blank" rel="noreferrer">${escapeHtml(
                  article.title || "Open story",
                )}</a>`,
            )
            .join("")}
        </div>
      `;
    })
    .catch(() => {
      if (requestId !== newsRequestId) return;
      const fallback = [
        `${record.name} economy and regional updates`,
        `${record.name} travel, culture, and infrastructure`,
        `${record.name} diplomacy and international relations`,
      ];
      ui.news.innerHTML = `
        <span>Latest news</span>
        <strong>News fallback</strong>
        <div class="news-list">
          ${fallback
            .map((title) => `<a href="https://news.google.com/search?q=${encodeURIComponent(record.name)}" target="_blank" rel="noreferrer">${escapeHtml(title)}</a>`)
            .join("")}
        </div>
      `;
    });
}

function updateCapitalClock() {
  if (!selectedRecord || !selectedRecord.timeZone) return;
  ui.capitalTime.innerHTML = `
    <span>Capital time</span>
    <strong>${formatLocalTime(selectedRecord.timeZone)}</strong>
    <p>${escapeHtml(selectedRecord.capital || selectedRecord.name)} local time, ${escapeHtml(selectedRecord.timeZone)}</p>
  `;
}

function updateSimulationClock() {
  if (!ui.simDate || !ui.simTime) return;
  const now = new Date();
  const second = Math.floor(now.getTime() / 1000);
  if (second === lastSimClockSecond) return;
  lastSimClockSecond = second;
  ui.simDate.textContent = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
    .format(now)
    .toUpperCase();
  ui.simTime.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
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

function formatIsoTime(value, timeZone) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || undefined,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function getMoonPhaseInfo(date = new Date()) {
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNewMoon) / 86400000;
  const age = ((days % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = Math.round((1 - Math.cos((age / synodicMonth) * Math.PI * 2)) * 50);
  const phases = [
    [1.84, "New Moon"],
    [5.54, "Waxing crescent"],
    [9.23, "First quarter"],
    [12.92, "Waxing gibbous"],
    [16.61, "Full Moon"],
    [20.3, "Waning gibbous"],
    [23.99, "Last quarter"],
    [27.68, "Waning crescent"],
    [29.54, "New Moon"],
  ];
  return { age, illumination, name: phases.find(([limit]) => age <= limit)?.[1] || "New Moon" };
}

function selectCountry(record, flyTo = false) {
  if (currentBodyKey !== "earth") return;
  ui.shell.classList.add("is-exploring");
  selectedRecord = record;
  hoverRecord = record;
  setStatus(`${record.name} selected`);
  unlockAchievement("first-country");
  renderPanel(record);
  renderCountryList(ui.search.value);
  drawEarthTexture();
  updateCityMarkers(record);
  updateCountryAnalysisLayers(record);
  updateStreetDetail(record);

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
  if (isPointerOrbiting || event.buttons || performance.now() < hoverDisabledUntil) {
    lastPointerEvent = null;
    ui.tooltip.hidden = true;
    return;
  }
  lastPointerEvent = event;
  requestAnimationFrame(() => {
    if (!lastPointerEvent) return;
    if (currentBodyKey === "solar") {
      const solarHit = pickSolarObject(lastPointerEvent);
      if (solarHit) {
        ui.coordinates.textContent = solarHit.name;
        ui.tooltip.hidden = false;
        ui.tooltip.textContent = `Open ${solarHit.name}`;
        ui.tooltip.style.transform = `translate(${lastPointerEvent.clientX + 14}px, ${lastPointerEvent.clientY + 14}px)`;
      } else {
        ui.coordinates.textContent = "Solar system";
        ui.tooltip.hidden = true;
      }
      return;
    }
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
  if (currentBodyKey === "solar") {
    const solarHit = pickSolarObject(event);
    if (solarHit?.bodyKey) {
      ui.shell.classList.add("is-exploring");
      switchBody(solarHit.bodyKey);
    }
    return;
  }
  const result = pickCountry(event);
  if (result?.record) {
    selectCountry(result.record, true);
  }
}

function pickSolarObject(event) {
  if (!solarSystemObjects.length || !solarSystemGroup?.visible) return null;
  const rect = renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -(((event.clientY - rect.top) / rect.height) * 2 - 1),
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(solarSystemObjects, true);
  const hit = hits.find((item) => item.object.userData?.bodyKey || item.object.parent?.userData?.bodyKey);
  if (!hit) return null;
  const source = hit.object.userData?.bodyKey ? hit.object : hit.object.parent;
  return {
    bodyKey: source.userData.bodyKey,
    name: source.userData.name || CELESTIAL_BODIES[source.userData.bodyKey]?.name || "Object",
  };
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
  if (currentBodyKey !== "earth") {
    return {
      record: null,
      lon,
      lat,
      x: event.clientX,
      y: event.clientY,
    };
  }
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
  updateCountryAnalysisLayers(null);
  updateStreetDetail(null);
  flagPinsGroup.clear();
  if (currentBodyKey === "solar") {
    renderSolarPanel();
    setStatus("Solar system model ready");
  } else if (currentBodyKey === "earth") {
    renderPanel(null);
    renderCountryList(ui.search.value);
    setStatus("Globe ready");
  } else {
    renderBodyPanel();
  }
  drawEarthTexture();
  animationTarget = {
    start: camera.position.clone(),
    end: currentBodyKey === "solar" ? new THREE.Vector3(0, 6.2, 12.5) : getGlobeCenter().add(new THREE.Vector3(0.07, 0.08, 5.85)),
    lookAt: getFocusCenter(),
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

function toggleSatelliteView() {
  if (currentBodyKey !== "earth") return;
  isSatelliteMode = !isSatelliteMode;
  ui.satelliteView.classList.toggle("is-active", isSatelliteMode);
  drawEarthTexture();
  setStatus(isSatelliteMode ? "Satellite style enabled" : "Styled globe enabled");
}

function toggleCinemaMode() {
  const enabled = ui.shell.classList.toggle("is-cinematic");
  ui.cinemaMode.classList.toggle("is-active", enabled);
  ui.cinemaMode.textContent = enabled ? "Panels" : "Cinema";
}

function switchBody(bodyKey) {
  currentBodyKey = CELESTIAL_BODIES[bodyKey] ? bodyKey : "earth";
  if (currentBodyKey !== "earth") unlockAchievement("space-mode");
  const body = CELESTIAL_BODIES[currentBodyKey];
  selectedRecord = null;
  hoverRecord = null;
  updateCityMarkers(null);
  updateCountryAnalysisLayers(null);
  updateStreetDetail(null);
  celestialMarkersGroup.clear();
  isSatelliteMode = false;
  ui.satelliteView.classList.remove("is-active");
  ui.bodySelect.value = currentBodyKey;
  ui.shell.classList.toggle("is-celestial", currentBodyKey !== "earth");
  ui.shell.classList.toggle("is-solar-mode", currentBodyKey === "solar");
  updateNavState();
  atmosphereMesh.material.color.setHex(body.atmosphere || 0x6ddcf1);
  earthMesh.scale.setScalar(body.radiusScale || 1);
  globeGroup.visible = currentBodyKey !== "solar";
  solarSystemGroup.visible = currentBodyKey === "solar";
  controls.minDistance = currentBodyKey === "solar" ? 3.2 : currentBodyKey === "earth" ? 2.4 : 2.25;
  controls.maxDistance = currentBodyKey === "solar" ? 22 : currentBodyKey === "earth" ? 8.2 : 7.4;

  if (currentBodyKey === "solar") {
    renderSolarPanel();
    updateLayerVisibility();
    setStatus("Solar system model ready");
    animationTarget = {
      start: camera.position.clone(),
      end: new THREE.Vector3(0, 6.2, 12.5),
      lookAt: new THREE.Vector3(0, 0, 0),
      started: performance.now(),
      duration: 1050,
    };
    controls.target.set(0, 0, 0);
  } else if (currentBodyKey === "earth") {
    cloudMesh.visible = layerState.clouds;
    terminatorLine.visible = layerState.sunLighting;
    capitalMarkersGroup.visible = true;
    mountainLabelsGroup.visible = true;
    renderPanel(null);
    renderCountryList(ui.search.value);
    updateLayerVisibility();
    setStatus("Earth explorer ready");
  } else {
    cloudMesh.visible = false;
    terminatorLine.visible = false;
    capitalMarkersGroup.visible = false;
    mountainLabelsGroup.visible = false;
    renderBodyPanel();
    buildCelestialMarkers(body);
    updateLayerVisibility();
    setStatus(`${body.name} explorer ready`);
    animationTarget = {
      start: camera.position.clone(),
      end: getGlobeCenter().add(new THREE.Vector3(0.2, 0.1, 5.25)),
      lookAt: getGlobeCenter(),
      started: performance.now(),
      duration: 780,
    };
    controls.target.copy(getGlobeCenter());
  }

  drawEarthTexture();
  drawMiniMap();
}

function updateNavState() {
  ui.navModel?.classList.toggle("is-active", currentBodyKey !== "solar");
  ui.navObjects?.classList.toggle("is-active", currentBodyKey === "solar");
  ui.navEarth?.classList.toggle("is-active", currentBodyKey === "earth");
}

function renderSolarPanel() {
  const moonPhase = getMoonPhaseInfo();
  ui.search.value = "";
  ui.panelKicker.textContent = "Solar system";
  ui.title.textContent = "Solar Objects";
  applyCountryTheme(null);
  ui.hero.hidden = true;
  ui.favoriteToggle.hidden = true;
  ui.quickStats.innerHTML = makeStatCards([
    ["id", "Mode", "3D"],
    ["capital", "Objects", "Sun + 8 planets"],
    ["continent", "Layers", "Orbits / labels / trails"],
  ]);
  ui.weather.innerHTML = "";
  ui.capitalTime.innerHTML = "";
  ui.metrics.innerHTML = "";
  ui.news.innerHTML = "";
  ui.details.hidden = false;
  ui.details.innerHTML = `
    <p>Click any planet to open its explorer view. Orbit rings, labels, asteroid points, spacecraft-style trails, and constellation lines stay visible like a space simulator.</p>
    <section class="feature-card">
      <h4>Live universe stack</h4>
      <p>Use Universe to zoom Earth -> Solar System -> Galaxy -> Universe. Stars, meteors, debris trails, and solar flare layers stay active.</p>
      <p><strong>Moon phase now:</strong> ${escapeHtml(moonPhase.name)} (${moonPhase.illumination}% illuminated).</p>
    </section>
    <h3>Objects</h3>
    <ul>
      <li><strong>Sun</strong> - glowing central star with stylized light halo.</li>
      <li><strong>Earth</strong> - switches back to the full country map with weather, news, and layers.</li>
      <li><strong>Moon, Venus, Mars, Jupiter, Saturn</strong> - open surface-marker explorer modes.</li>
      <li><strong>Uranus and Neptune</strong> - shown in the solar scene as outer planet targets.</li>
    </ul>
  `;
  ui.list.replaceChildren();
  if (isVoiceNarratorEnabled) speakCurrentSelection();
}

function renderBodyPanel() {
  const body = CELESTIAL_BODIES[currentBodyKey];
  const moonPhase = currentBodyKey === "moon" ? getMoonPhaseInfo() : null;
  ui.search.value = "";
  ui.panelKicker.textContent = body.kicker || "Celestial body";
  ui.title.textContent = body.name;
  ui.hero.hidden = true;
  ui.favoriteToggle.hidden = true;
  ui.quickStats.innerHTML = makeStatCards(body.stats || [
    ["id", "Body", body.name],
    ["capital", "Mode", "Explore"],
    ["continent", "Surface", "3D"],
  ]);
  ui.weather.innerHTML = `
    <span>Surface mode</span>
    <strong>${escapeHtml(body.name)} selected</strong>
    <p>Rotate, zoom, and inspect the marked regions on this celestial body.</p>
  `;
  ui.capitalTime.innerHTML = `
    <span>Research mode</span>
    <strong>Orbital scan</strong>
    <p>Country data is hidden while another planet or moon is active.</p>
  `;
  ui.metrics.innerHTML = `
    <span>Signals</span>
    <strong>Surface landmarks</strong>
    <p>${escapeHtml(body.markers.map((item) => item.name).join(", "))}</p>
  `;
  ui.news.innerHTML = `
    <span>Explorer note</span>
    <strong>No live country news</strong>
    <p>Switch back to Earth to load country headlines.</p>
  `;
  ui.details.hidden = false;
  const missionCards = makePlanetMissionCards(currentBodyKey);
  ui.details.innerHTML = `
    <p>${escapeHtml(body.summary || "Explore this world with orbit controls and surface markers.")}</p>
    <section class="feature-card">
      <h4>HD surface system</h4>
      <p>Procedural high-detail material with roughness, bump texture, rim light, and live space layers around the selected body.</p>
      ${moonPhase ? `<p><strong>Current Moon phase:</strong> ${escapeHtml(moonPhase.name)} / ${moonPhase.illumination}% illuminated.</p>` : ""}
    </section>
    <h3>Marked regions</h3>
    <ul>
      ${body.markers.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`).join("")}
    </ul>
    ${missionCards}
  `;
  ui.list.replaceChildren();
  if (isVoiceNarratorEnabled) speakCurrentSelection();
}

function downloadInfoCard() {
  const record = selectedRecord;
  const body = CELESTIAL_BODIES[currentBodyKey];
  const title = record?.name || body.name;
  const subtitle = record ? joinCompact([record.capital, record.continent], " / ") : body.kicker;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(0.55, "#102337");
  gradient.addColorStop(1, "#08121b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#58d3df";
  ctx.lineWidth = 6;
  roundRect(ctx, 38, 38, canvas.width - 76, canvas.height - 76, 28);
  ctx.stroke();

  ctx.fillStyle = "#9df76d";
  ctx.font = "900 34px Segoe UI, Arial, sans-serif";
  ctx.fillText(record ? "COUNTRY INFO CARD" : "CELESTIAL INFO CARD", 82, 120);
  ctx.fillStyle = "#eef5ff";
  ctx.font = "900 82px Segoe UI, Arial, sans-serif";
  wrapCanvasText(ctx, title, 82, 220, 760, 86);
  ctx.fillStyle = "#ced8e8";
  ctx.font = "700 34px Segoe UI, Arial, sans-serif";
  ctx.fillText(subtitle || "Explorer mode", 86, 330);

  const lines = record
    ? [
        `Official: ${record.officialName}`,
        `Population: ${formatNumber(record.population)}`,
        `Area: ${record.area ? `${formatNumber(record.area)} km2` : "-"}`,
        `Language: ${record.languages || "-"}`,
        `Currency: ${record.currency || "-"}`,
        `Climate: ${record.climate}`,
        `Biome: ${record.biome}`,
        `Internet: ${record.signals.internet}% / ${record.signals.speed} Mbps`,
      ]
    : (body.stats || []).map(([, label, value]) => `${label}: ${value}`);

  ctx.font = "700 28px Segoe UI, Arial, sans-serif";
  ctx.fillStyle = "#d8e5f7";
  lines.forEach((line, index) => {
    ctx.fillText(line, 90, 405 + index * 38);
  });

  ctx.fillStyle = "rgba(88, 211, 223, 0.18)";
  ctx.beginPath();
  ctx.arc(940, 355, 205, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ecff8f";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(940, 355, 178, 0, Math.PI * 1.65);
  ctx.stroke();
  ctx.fillStyle = "#eef5ff";
  ctx.font = "900 48px Segoe UI, Arial, sans-serif";
  ctx.fillText(record ? record.id : body.name, 840, 365);
  ctx.font = "800 24px Segoe UI, Arial, sans-serif";
  ctx.fillStyle = "#9ba9bd";
  ctx.fillText("Generated by Global Explorer", 90, 660);

  const link = document.createElement("a");
  link.download = `${slugify(title || "explorer-card")}-info-card.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function downloadMiniReportPdf() {
  const record = selectedRecord;
  const body = CELESTIAL_BODIES[currentBodyKey];
  const title = record?.name || body?.name || "Global Explorer";
  const lines = record
    ? [
        `Country: ${record.name}`,
        `Official name: ${record.officialName || record.name}`,
        `Capital: ${record.capital || "-"}`,
        `Region: ${joinCompact([record.region, record.subregion], " / ") || "-"}`,
        `Population: ${formatNumber(record.population)}`,
        `Area: ${record.area ? `${formatNumber(record.area)} km2` : "-"}`,
        `Languages: ${record.languages || "-"}`,
        `Currency: ${record.currency || "-"}`,
        `Climate and biome: ${record.climate} / ${record.biome}`,
        `Internet: ${record.signals.internet}% / ${record.signals.speed} Mbps`,
        `Trip estimate: ${makeTripCost(record).total} USD per day`,
        `Organizations: ${getOrganizationBadges(record).join(", ")}`,
        `Name origin: ${getNameOrigin(record)}`,
        `National symbols: ${getNationalSymbols(record).join(", ")}`,
        `Scientific achievements: ${getScienceAchievements(record).join("; ")}`,
        `Famous inventions: ${getInventions(record).map((item) => item[0]).join(", ")}`,
      ]
    : [
        `Object: ${title}`,
        `Mode: ${body?.kicker || "Celestial explorer"}`,
        body?.summary || "Interactive solar system object.",
        `Markers: ${(body?.markers || []).map((item) => item.name).join(", ")}`,
      ];
  const pdf = makeSimplePdf(`${title} Mini Report`, lines);
  const link = document.createElement("a");
  link.download = `${slugify(title)}-mini-report.pdf`;
  link.href = URL.createObjectURL(pdf);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setStatus("Mini report PDF exported");
}

function downloadGlobeView() {
  renderer.render(scene, camera);
  const link = document.createElement("a");
  const label = selectedRecord?.name || CELESTIAL_BODIES[currentBodyKey].name || "globe";
  link.download = `${slugify(label)}-globe-view.png`;
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
  addScreenshotToGallery(label, makeScreenshotThumbnail());
  setStatus("Current globe view saved as PNG");
  unlockAchievement("screenshot");
}

function toggleGyroControl() {
  if (typeof DeviceOrientationEvent === "undefined") {
    setStatus("Gyroscope is not available on this device", true);
    return;
  }
  const enable = () => {
    isGyroEnabled = !isGyroEnabled;
    ui.gyroToggle.classList.toggle("is-active", isGyroEnabled);
    window[isGyroEnabled ? "addEventListener" : "removeEventListener"]("deviceorientation", onDeviceOrientation);
    setStatus(isGyroEnabled ? "Phone tilt control enabled" : "Phone tilt control disabled");
  };
  if (DeviceOrientationEvent.requestPermission) {
    DeviceOrientationEvent.requestPermission().then((permission) => {
      if (permission === "granted") enable();
      else setStatus("Gyroscope permission was not granted", true);
    });
  } else {
    enable();
  }
}

function onDeviceOrientation(event) {
  if (!isGyroEnabled || !globeGroup) return;
  const gamma = THREE.MathUtils.clamp(event.gamma || 0, -45, 45);
  const beta = THREE.MathUtils.clamp(event.beta || 0, -45, 45);
  globeGroup.rotation.y += gamma * 0.0009;
  globeGroup.rotation.x = THREE.MathUtils.lerp(globeGroup.rotation.x, beta * 0.004, 0.08);
}

function flyToPolarView(type) {
  if (currentBodyKey !== "earth") switchBody("earth");
  const y = type === "arctic" ? 5.1 : -5.1;
  animationTarget = {
    start: camera.position.clone(),
    end: getGlobeCenter().add(new THREE.Vector3(0.02, y, 0.08)),
    started: performance.now(),
    duration: 950,
  };
  controls.autoRotate = false;
  ui.autoRotate.classList.remove("is-active");
  setStatus(type === "arctic" ? "Arctic polar view" : "Antarctic polar view");
}

function toggleScalePlanets() {
  isScalePlanetsVisible = !isScalePlanetsVisible;
  ui.scalePlanets.classList.toggle("is-active", isScalePlanetsVisible);
  updateLayerVisibility();
  setStatus(isScalePlanetsVisible ? "Scale planet comparison enabled" : "Scale planet comparison hidden");
}

function cycleUniverseZoom() {
  universeLevelIndex = (universeLevelIndex + 1) % UNIVERSE_LEVELS.length;
  const level = UNIVERSE_LEVELS[universeLevelIndex];
  ui.shell.classList.add("is-exploring");
  switchBody(level.body);
  const target = new THREE.Vector3(...level.target);
  controls.maxDistance = level.maxDistance;
  controls.target.copy(target);
  animationTarget = {
    start: camera.position.clone(),
    end: new THREE.Vector3(...level.position),
    lookAt: target,
    started: performance.now(),
    duration: 1350,
  };
  ui.universeZoom?.classList.add("is-active");
  window.setTimeout(() => ui.universeZoom?.classList.remove("is-active"), 900);
  setStatus(`Universe zoom: ${level.label}`);
  unlockAchievement("universe-zoom");
}

function toggleCinematicTour() {
  isCinematicTour = !isCinematicTour;
  ui.tourMode.classList.toggle("is-active", isCinematicTour);
  ui.tourMode.textContent = isCinematicTour ? "Stop tour" : "Tour";
  controls.autoRotate = !isCinematicTour;
  ui.autoRotate.classList.toggle("is-active", controls.autoRotate);
  if (isCinematicTour) {
    tourStartedAt = performance.now();
    lastTourSegment = -1;
    ui.shell.classList.add("is-exploring");
    setStatus("Cinematic tour started");
  } else {
    setStatus("Cinematic tour stopped");
  }
}

function updateCinematicTour(now) {
  if (!isCinematicTour || !CINEMATIC_TOUR_STOPS.length) return;
  const segmentMs = 5600;
  const index = Math.floor((now - tourStartedAt) / segmentMs) % CINEMATIC_TOUR_STOPS.length;
  if (index === lastTourSegment) return;
  lastTourSegment = index;
  runCinematicStop(CINEMATIC_TOUR_STOPS[index]);
}

function runCinematicStop(stop) {
  setStatus(stop.label || "Cinematic flyby");
  if (stop.type === "country") {
    const record = getRecordByCca(stop.key);
    if (!record) return;
    if (currentBodyKey !== "earth") switchBody("earth");
    selectCountry(record, true);
    return;
  }

  switchBody(stop.key);
  const target = stop.target ? new THREE.Vector3(...stop.target) : getFocusCenter();
  const end = stop.position
    ? (stop.key === "solar" ? new THREE.Vector3(...stop.position) : getGlobeCenter().add(new THREE.Vector3(...stop.position)))
    : camera.position.clone();
  animationTarget = {
    start: camera.position.clone(),
    end,
    lookAt: target,
    started: performance.now(),
    duration: 1600,
  };
}

function toggleVoiceNarrator() {
  isVoiceNarratorEnabled = !isVoiceNarratorEnabled;
  ui.voiceNarrator.classList.toggle("is-active", isVoiceNarratorEnabled);
  ui.voiceNarrator.textContent = isVoiceNarratorEnabled ? "Mute" : "Voice";
  if (isVoiceNarratorEnabled) {
    unlockAchievement("narrator");
    speakCurrentSelection();
    setStatus("Voice narrator enabled");
  } else {
    window.speechSynthesis?.cancel();
    setStatus("Voice narrator disabled");
  }
}

function speakCurrentSelection() {
  if (!isVoiceNarratorEnabled || !("speechSynthesis" in window)) return;
  const text = makeNarrationText();
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.92;
  utterance.pitch = 0.98;
  window.speechSynthesis.speak(utterance);
}

function makeNarrationText() {
  if (selectedRecord && currentBodyKey === "earth") {
    const record = selectedRecord;
    return `${record.name}. Capital: ${record.capital || "not listed"}. ${record.summary || ""} Population around ${formatNumber(record.population)}. Climate: ${record.climate}. Biome: ${record.biome}.`;
  }
  const body = CELESTIAL_BODIES[currentBodyKey];
  if (!body) return "";
  const markerText = (body.markers || []).slice(0, 3).map((item) => item.name).join(", ");
  return `${body.name}. ${body.summary || "Celestial explorer mode."} Key marked regions include ${markerText}.`;
}

function toggleTimeReplay() {
  isTimeReplayActive = !isTimeReplayActive;
  ui.timeReplay.classList.toggle("is-active", isTimeReplayActive);
  if (isTimeReplayActive) {
    if (currentBodyKey !== "earth") switchBody("earth");
    timeReplayStarted = performance.now();
    setStatus("Time travel replay started");
  } else {
    setStatus("Time travel replay paused");
  }
}

function updateTimeReplay(now) {
  if (!isTimeReplayActive || currentBodyKey !== "earth") return;
  const span = 18000;
  const progress = ((now - timeReplayStarted) % span) / span;
  const nextYear = Math.round(1492 + progress * (2026 - 1492));
  if (nextYear === historicalYear) return;
  historicalYear = nextYear;
  ui.yearSlider.value = String(historicalYear);
  ui.yearLabel.textContent = String(historicalYear);
  drawEarthTexture();
}

function saveCameraView() {
  const label = selectedRecord?.name || CELESTIAL_BODIES[currentBodyKey]?.name || "View";
  const view = {
    id: `${Date.now()}-${Math.round(Math.random() * 999)}`,
    name: `${label} ${savedCameraViews.length + 1}`,
    bodyKey: currentBodyKey,
    selectedCca3: selectedRecord?.cca3 || "",
    camera: camera.position.toArray(),
    target: controls.target.toArray(),
  };
  savedCameraViews = [view, ...savedCameraViews].slice(0, 8);
  localStorage.setItem("airi-saved-camera-views", JSON.stringify(savedCameraViews));
  renderSavedViews();
  setStatus("Camera view saved");
}

function loadSavedCameraViews() {
  try {
    const parsed = JSON.parse(localStorage.getItem("airi-saved-camera-views") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderSavedViews() {
  if (!ui.savedViews || !ui.viewStrip) return;
  ui.viewStrip.hidden = savedCameraViews.length === 0;
  ui.savedViews.replaceChildren(
    ...savedCameraViews.map((view) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "view-chip";
      button.textContent = view.name;
      button.title = "Load saved camera view";
      button.addEventListener("click", () => loadCameraView(view));
      return button;
    }),
  );
}

function loadCameraView(view) {
  if (!view) return;
  switchBody(view.bodyKey || "earth");
  if (view.selectedCca3) {
    const record = getRecordByCca(view.selectedCca3);
    if (record && currentBodyKey === "earth") {
      selectedRecord = record;
      renderPanel(record);
      updateCityMarkers(record);
      updateCountryAnalysisLayers(record);
      drawEarthTexture();
    }
  }
  const end = new THREE.Vector3().fromArray(view.camera || [0, 0, 5]);
  const lookAt = new THREE.Vector3().fromArray(view.target || [0, 0, 0]);
  animationTarget = {
    start: camera.position.clone(),
    end,
    lookAt,
    started: performance.now(),
    duration: 950,
  };
  controls.target.copy(lookAt);
  setStatus(`Loaded view: ${view.name}`);
}

function loadScreenshotGallery() {
  try {
    const parsed = JSON.parse(localStorage.getItem("airi-screenshot-gallery") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadAchievements() {
  try {
    const parsed = JSON.parse(localStorage.getItem("airi-achievements") || "[]");
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveAchievements() {
  localStorage.setItem("airi-achievements", JSON.stringify([...achievements]));
}

function unlockAchievement(id) {
  if (!id || achievements.has(id)) return;
  achievements.add(id);
  saveAchievements();
  renderAchievements();
}

function renderAchievements() {
  if (!ui.achievementList || !ui.achievementsHud) return;
  ui.achievementList.replaceChildren(
    ...ACHIEVEMENT_DEFS.map(([id, label, note]) => {
      const item = document.createElement("span");
      item.className = `achievement-pill${achievements.has(id) ? " is-unlocked" : ""}`;
      item.title = note;
      item.textContent = label;
      return item;
    }),
  );
}

function addScreenshotToGallery(label, dataUrl) {
  const item = {
    id: `${Date.now()}-${Math.round(Math.random() * 999)}`,
    label,
    dataUrl,
  };
  screenshotGallery = [item, ...screenshotGallery].slice(0, 6);
  try {
    localStorage.setItem("airi-screenshot-gallery", JSON.stringify(screenshotGallery));
  } catch {
    screenshotGallery = screenshotGallery.slice(0, 3);
    localStorage.setItem("airi-screenshot-gallery", JSON.stringify(screenshotGallery));
  }
  renderScreenshotGallery();
}

function makeScreenshotThumbnail() {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 210;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#03050a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(renderer.domElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.68);
}

function renderScreenshotGallery() {
  if (!ui.screenshotGallery || !ui.shotGalleryList) return;
  ui.screenshotGallery.hidden = screenshotGallery.length === 0;
  ui.shotGalleryList.replaceChildren(
    ...screenshotGallery.map((shot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shot-thumb";
      button.title = shot.label;
      button.innerHTML = `<img src="${escapeHtml(shot.dataUrl)}" alt="${escapeHtml(shot.label)} screenshot" />`;
      button.addEventListener("click", () => {
        const link = document.createElement("a");
        link.download = `${slugify(shot.label)}-saved-shot.png`;
        link.href = shot.dataUrl;
        link.click();
      });
      return button;
    }),
  );
}

function openCommandMenu() {
  buildCommandItems();
  ui.commandMenu.hidden = false;
  ui.commandInput.value = "";
  commandIndex = 0;
  renderCommandResults("");
  requestAnimationFrame(() => ui.commandInput.focus());
}

function closeCommandMenu() {
  ui.commandMenu.hidden = true;
}

function buildCommandItems() {
  const bodyItems = Object.entries(CELESTIAL_BODIES).map(([key, body]) => ({
    label: body.name,
    type: "planet",
    detail: body.kicker || "Celestial body",
    run: () => switchBody(key),
  }));
  const countryItems = countryRecords.map((record) => ({
    label: record.name,
    type: "country",
    detail: record.capital || record.continent,
    run: () => {
      switchBody("earth");
      selectCountry(record, true);
    },
  }));
  const layerItems = [...ui.layers].map((input) => ({
    label: `Toggle ${input.closest("label")?.textContent?.trim() || input.dataset.layer}`,
    type: "layer",
    detail: input.checked ? "On" : "Off",
    run: () => {
      input.checked = !input.checked;
      layerState[input.dataset.layer] = input.checked;
      drawEarthTexture();
      updateLayerVisibility();
      buildCommandItems();
    },
  }));
  commandItems = [...COMMAND_STATIC_ACTIONS.map((item) => ({ ...item, detail: "Action" })), ...bodyItems, ...countryItems, ...layerItems];
}

function renderCommandResults(query = "") {
  const needle = query.trim().toLowerCase();
  const results = commandItems
    .filter((item) => !needle || `${item.label} ${item.type} ${item.detail || ""}`.toLowerCase().includes(needle))
    .slice(0, 32);
  commandIndex = Math.min(commandIndex, Math.max(0, results.length - 1));
  ui.commandResults.replaceChildren(
    ...results.map((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `command-item${index === commandIndex ? " is-active" : ""}`;
      button.innerHTML = `<strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.type)}</span>`;
      button.addEventListener("click", () => executeCommandItem(item));
      button.dataset.commandIndex = String(index);
      return button;
    }),
  );
  ui.commandResults.dataset.resultCount = String(results.length);
}

function onCommandInputKeydown(event) {
  const buttons = [...ui.commandResults.querySelectorAll(".command-item")];
  if (event.key === "ArrowDown") {
    event.preventDefault();
    commandIndex = Math.min(buttons.length - 1, commandIndex + 1);
    renderCommandResults(ui.commandInput.value);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    commandIndex = Math.max(0, commandIndex - 1);
    renderCommandResults(ui.commandInput.value);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const filtered = commandItems
      .filter((item) => !ui.commandInput.value.trim() || `${item.label} ${item.type} ${item.detail || ""}`.toLowerCase().includes(ui.commandInput.value.trim().toLowerCase()))
      .slice(0, 32);
    executeCommandItem(filtered[commandIndex]);
  } else if (event.key === "Escape") {
    closeCommandMenu();
  }
}

function executeCommandItem(item) {
  if (!item) return;
  closeCommandMenu();
  item.run();
}

function onGlobalKeydown(event) {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "k") {
    event.preventDefault();
    if (ui.commandMenu.hidden) openCommandMenu();
    else closeCommandMenu();
    return;
  }
  if (event.key === "Escape" && !ui.commandMenu.hidden) {
    closeCommandMenu();
  }
}

function updateCompassHud() {
  if (!ui.compassNeedle || !ui.scaleValue) return;
  const target = controls.target || getFocusCenter();
  const direction = camera.position.clone().sub(target);
  const angle = Math.atan2(direction.x, direction.z);
  ui.compassNeedle.style.transform = `rotate(${angle}rad)`;
  const distance = Math.max(1, direction.length());
  const km = currentBodyKey === "earth" ? Math.round(distance * 360) : Math.round(distance * 120000);
  ui.scaleValue.textContent = currentBodyKey === "earth" ? `Scale ${formatNumber(km)} km` : `Scale ${formatNumber(km)} km`;
}

function onDetailsInput(event) {
  if (!event.target.closest?.(".currency-converter")) return;
  updateCurrencyConverter();
}

function updateCurrencyConverter() {
  if (!selectedRecord) return;
  const amount = Number(document.querySelector("#converter-amount")?.value || 0);
  const target = document.querySelector("#converter-target")?.value || "USD";
  const output = document.querySelector("#converter-output");
  const currency = inferCurrency(selectedRecord);
  const targetRate = TARGET_CURRENCY_RATES[target] || 1;
  const usd = amount * currency.rate;
  const converted = usd / targetRate;
  if (output) {
    output.innerHTML = `<strong>${formatNumber(Math.round(converted * 100) / 100)} ${escapeHtml(target)}</strong><span>${escapeHtml(currency.code)} to ${escapeHtml(target)}, demo rate</span>`;
  }
}

function setupOnboarding() {
  if (localStorage.getItem("airi-globe-tour-seen") === "yes") return;
  ui.onboarding.hidden = false;
}

let tourStep = 0;
function advanceTour() {
  const steps = [
    "Use the country list or click the globe to select a country.",
    "Turn layers on and off: quakes, plates, storms, bases, spaceports, and street detail.",
    "Use Shot to save the current globe view, Card to save an info card, and Cinema to hide panels.",
    "Switch to Moon, Venus, Mars, Jupiter, or Saturn from the top selector.",
  ];
  tourStep += 1;
  if (tourStep >= steps.length) {
    closeTour();
    return;
  }
  ui.tourCopy.textContent = steps[tourStep];
  ui.tourNext.textContent = tourStep === steps.length - 1 ? "Done" : "Next";
}

function closeTour() {
  ui.onboarding.hidden = true;
  localStorage.setItem("airi-globe-tour-seen", "yes");
}

function animate(now = performance.now()) {
  requestAnimationFrame(animate);

  updateCinematicTour(now);
  updateTimeReplay(now);

  if (animationTarget) {
    const elapsed = now - animationTarget.started;
    const t = Math.min(elapsed / animationTarget.duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.copy(animationTarget.start).lerp(animationTarget.end, eased);
    camera.lookAt(animationTarget.lookAt || getFocusCenter());
    if (t >= 1) {
      animationTarget = null;
    }
  }

  if (cloudMesh) {
    cloudMesh.rotation.y += 0.00045;
    cloudMesh.rotation.x = Math.sin(now * 0.00008) * 0.015;
  }
  updateTerminatorLine(now);
  updateRealtimeSunLighting();
  animateFlightArcs(now);
  animateOceanCurrentArrows(now);
  animateWindFlow(now);
  animateMeteorShower(now);
  animateDebrisField(now);
  animateSolarSystem(now);
  animateSatelliteTracker(now);
  animateScanLine(now);
  updateSimulationClock();
  updateCompassHud();
  updateZoomGridVisibility();
  if (Math.floor(now / 600) !== Math.floor((now - 16) / 600)) drawMiniMap();
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
  drawMiniMap();
}

function setGlobeLayout() {
  if (!globeGroup || !controls) return;
  if (currentBodyKey === "solar") {
    controls.target.set(0, 0, 0);
    return;
  }
  const isCompact = window.innerWidth <= 980;
  const x = isCompact ? 0 : -0.55;
  globeGroup.position.set(x, 0, 0);
  controls.target.set(x, 0, 0);
}

function getGlobeCenter() {
  return globeGroup ? globeGroup.position.clone() : new THREE.Vector3(0, 0, 0);
}

function getFocusCenter() {
  return currentBodyKey === "solar" ? new THREE.Vector3(0, 0, 0) : getGlobeCenter();
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
  const group = new THREE.Group();
  const makeLayer = (layerCount, size, radiusMin, radiusMax, opacity, bright = false) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(layerCount * 3);
    const colors = new Float32Array(layerCount * 3);
    const palette = bright
      ? [
          new THREE.Color("#fff8de"),
          new THREE.Color("#d7e8ff"),
          new THREE.Color("#ffe1a8"),
        ]
      : [
          new THREE.Color("#8fb8ff"),
          new THREE.Color("#d8e8ff"),
          new THREE.Color("#fff0c8"),
          new THREE.Color("#b6fff1"),
        ];
    for (let i = 0; i < layerCount; i += 1) {
      const radius = THREE.MathUtils.randFloat(radiusMin, radiusMax);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      const color = palette[Math.floor(Math.random() * palette.length)].clone();
      const intensity = bright ? THREE.MathUtils.randFloat(0.78, 1.0) : THREE.MathUtils.randFloat(0.38, 0.88);
      color.multiplyScalar(intensity);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    group.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size,
          transparent: true,
          opacity,
          sizeAttenuation: true,
          vertexColors: true,
          depthWrite: false,
        }),
      ),
    );
  };

  makeLayer(Math.floor(count * 0.72), 0.012, 18, 54, 0.72, false);
  makeLayer(Math.floor(count * 0.22), 0.024, 16, 46, 0.9, false);
  makeLayer(Math.floor(count * 0.06), 0.052, 14, 34, 0.96, true);
  return group;
}

function buildConstellations() {
  constellationGroup.clear();
  [...CONSTELLATIONS, ...CONSTELLATION_EXTRAS].forEach((constellation) => {
    const starVectors = constellation.stars.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    constellation.links.forEach(([from, to]) => {
      constellationGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([starVectors[from], starVectors[to]]),
          new THREE.LineBasicMaterial({
            color: 0x98a6ff,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
          }),
        ),
      );
    });
    starVectors.forEach((position) => {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xf4fbff }),
      );
      star.position.copy(position);
      constellationGroup.add(star);
    });
    const label = makeMapLabelSprite(constellation.name, {
      fill: "rgba(7, 12, 28, 0.62)",
      stroke: "rgba(152,166,255,0.65)",
      text: "#e4e9ff",
    });
    label.position.copy(starVectors[0].clone().add(new THREE.Vector3(0.12, 0.16, 0)));
    label.scale.multiplyScalar(1.35);
    constellationGroup.add(label);
  });
}

function buildScalePlanets() {
  scalePlanetsGroup.clear();
  const entries = [
    { name: "Earth", radius: 0.22, color: 0x58d3df, x: -1.1 },
    { name: "Moon", radius: 0.06, color: 0xb7c2cc, x: -0.74 },
    { name: "Mars", radius: 0.12, color: 0xc76a3c, x: -0.47 },
    { name: "Jupiter", radius: 0.58, color: 0xd59a67, x: 0.1 },
  ];
  entries.forEach((entry) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(entry.radius, 32, 24),
      new THREE.MeshStandardMaterial({ color: entry.color, roughness: 0.72, metalness: 0.02 }),
    );
    sphere.position.set(entry.x, -1.55, 2.15);
    scalePlanetsGroup.add(sphere);
    const label = makeMapLabelSprite(entry.name, {
      fill: "rgba(5,10,18,0.72)",
      stroke: "rgba(236,255,143,0.55)",
      text: "#eef5ff",
    });
    label.position.set(entry.x - 0.05, -1.92, 2.15);
    label.scale.multiplyScalar(0.52);
    scalePlanetsGroup.add(label);
  });
  scalePlanetsGroup.visible = false;
}

function buildSolarSystem() {
  solarSystemGroup.clear();
  solarSystemObjects = [];
  solarOrbitAnimations = [];
  solarDynamicObjects = [];
  solarSystemGroup.rotation.x = -0.18;
  solarSystemGroup.rotation.z = -0.08;

  const sunLight = new THREE.PointLight(0xffd36a, 3.2, 28);
  solarSystemGroup.add(sunLight);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 64, 48),
    new THREE.MeshBasicMaterial({
      map: makeSolarTexture(["#fff4a4", "#ffd24f", "#ff8d1d"], true, "sun"),
    }),
  );
  sun.userData = { bodyKey: "solar", name: "Sun" };
  solarSystemGroup.add(sun);
  solarSystemObjects.push(sun);

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#ffd76b"),
      color: 0xffd36a,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.scale.set(2.4, 2.4, 1);
  solarSystemGroup.add(glow);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.58, 0.64, 128),
    new THREE.MeshBasicMaterial({
      color: 0xffe28f,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  halo.rotation.x = Math.PI / 2;
  solarSystemGroup.add(halo);

  const planets = [
    { key: "mercury", label: "Mercury", orbit: 0.9, radius: 0.055, speed: 0.00072, colors: ["#6a655d", "#d6c8a9", "#403b37"], angle: 0.2 },
    { key: "venus", label: "Venus", orbit: 1.22, radius: 0.11, speed: 0.00056, colors: ["#5c3b1c", "#d49b55", "#f1d08a"], angle: 2.2 },
    { key: "earth", label: "Earth", orbit: 1.58, radius: 0.12, speed: 0.00046, colors: ["#12396d", "#2e7c52", "#d8f0ff"], angle: 4.2 },
    { key: "mars", label: "Mars", orbit: 1.98, radius: 0.086, speed: 0.00036, colors: ["#401612", "#a94a2a", "#e09c63"], angle: 0.9 },
    { key: "jupiter", label: "Jupiter", orbit: 3.02, radius: 0.28, speed: 0.00018, colors: ["#593820", "#c78c55", "#f6d3a3"], angle: 3.1, moons: true },
    { key: "saturn", label: "Saturn", orbit: 4.05, radius: 0.23, speed: 0.00013, colors: ["#6d5737", "#d7bc83", "#f4e0a8"], angle: 5.1, ring: true },
    { key: "uranus", label: "Uranus", orbit: 5.18, radius: 0.17, speed: 0.00009, colors: ["#1c697d", "#72d7e5", "#c4f3ff"], angle: 1.7 },
    { key: "neptune", label: "Neptune", orbit: 6.35, radius: 0.17, speed: 0.00007, colors: ["#14378c", "#285bd6", "#77a4ff"], angle: 4.8 },
  ];

  planets.forEach((planet, index) => {
    solarSystemGroup.add(makeSolarOrbitLine(planet.orbit, index % 2 ? 0xffffff : 0x6de8ff, index % 2 ? 0.32 : 0.44));
    const pivot = new THREE.Group();
    pivot.rotation.y = planet.angle;
    solarSystemGroup.add(pivot);

    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(planet.orbit, 0, 0);
    bodyGroup.userData = { bodyKey: CELESTIAL_BODIES[planet.key] ? planet.key : "solar", name: planet.label };

    const materialOptions = {
      map: makeSolarTexture(planet.colors, planet.key === "jupiter" || planet.key === "saturn", planet.key),
      roughness: planet.key === "earth" ? 0.58 : 0.76,
      metalness: 0.01,
    };
    if (["mercury", "moon", "mars"].includes(planet.key)) {
      materialOptions.bumpMap = makePlanetBumpTexture(planet.key);
      materialOptions.bumpScale = planet.radius * 0.16;
    }
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 64, 48), new THREE.MeshStandardMaterial(materialOptions));
    sphere.userData = bodyGroup.userData;
    bodyGroup.add(sphere);
    solarSystemObjects.push(sphere);

    if (planet.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(planet.radius * 1.42, planet.radius * 2.25, 96),
        new THREE.MeshBasicMaterial({
          color: 0xeed9aa,
          transparent: true,
          opacity: 0.72,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = Math.PI / 2.45;
      ring.rotation.y = 0.25;
      bodyGroup.add(ring);
    }

    if (planet.moons) {
      [0.42, 0.55, 0.68, 0.82].forEach((moonOrbit, moonIndex) => {
        const moonPivot = new THREE.Group();
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.025 - moonIndex * 0.003, 16, 12),
          new THREE.MeshBasicMaterial({ color: 0xbfc6cc }),
        );
        moon.position.set(moonOrbit, 0, 0);
        moonPivot.add(moon);
        bodyGroup.add(moonPivot);
        solarOrbitAnimations.push({ pivot: moonPivot, speed: 0.0016 + moonIndex * 0.00035, spin: moon });
      });
    }

    if (planet.key === "earth") buildPlanetSatelliteSwarm(bodyGroup, planet.radius, "earth");
    if (planet.key === "mars") buildPlanetSatelliteSwarm(bodyGroup, planet.radius, "mars");

    const label = makeMapLabelSprite(planet.label.toUpperCase(), {
      fill: "rgba(0,0,0,0.2)",
      stroke: "rgba(255,255,255,0)",
      text: planet.key === "jupiter" || planet.key === "saturn" ? "#ffe4a8" : "#dfeaff",
    });
    label.position.set(0, planet.radius + 0.22, 0);
    label.scale.multiplyScalar(0.62);
    bodyGroup.add(label);

    pivot.add(bodyGroup);
    solarOrbitAnimations.push({ pivot, speed: planet.speed, spin: sphere, bodyGroup });
  });

  buildAsteroidBelt();
  buildSpacecraftTrails();
  buildMeteorAndCometField();
}

function buildPlanetSatelliteSwarm(bodyGroup, planetRadius, planetKey) {
  const specs =
    planetKey === "earth"
      ? [
          { name: "ISS", orbit: planetRadius * 2.45, speed: 0.0038, tilt: 0.72, twist: 0.2, color: 0xffffff },
          { name: "Hubble", orbit: planetRadius * 2.95, speed: 0.0031, tilt: 1.15, twist: -0.45, color: 0xbfd4ff },
          { name: "Starlink train", orbit: planetRadius * 3.35, speed: 0.0046, tilt: 0.38, twist: 0.9, color: 0x9fe8ff, train: true },
          { name: "GPS ring", orbit: planetRadius * 4.15, speed: 0.0018, tilt: 0.95, twist: -0.2, color: 0x78a7ff },
        ]
      : [
          { name: "MRO", orbit: planetRadius * 2.65, speed: 0.0025, tilt: 0.65, twist: 0.35, color: 0xffc58a },
          { name: "MAVEN", orbit: planetRadius * 3.15, speed: 0.0021, tilt: 1.05, twist: -0.35, color: 0xffe1b4 },
        ];

  specs.forEach((spec, specIndex) => {
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = spec.tilt;
    orbitGroup.rotation.z = spec.twist;
    const orbitLine = makeSolarOrbitLine(spec.orbit, spec.color, 0.28);
    orbitLine.material.opacity = spec.train ? 0.36 : 0.24;
    orbitGroup.add(orbitLine);
    bodyGroup.add(orbitGroup);

    const pivot = new THREE.Group();
    pivot.rotation.x = spec.tilt;
    pivot.rotation.z = spec.twist;
    const satelliteCount = spec.train ? 7 : 1;
    for (let i = 0; i < satelliteCount; i += 1) {
      const sat = makeSatelliteMesh(spec.color);
      const angle = (i / satelliteCount) * Math.PI * 2 + specIndex * 0.55;
      sat.position.set(Math.cos(angle) * spec.orbit, Math.sin(angle) * 0.02, Math.sin(angle) * spec.orbit);
      sat.scale.setScalar(spec.train ? 0.62 : 0.82);
      sat.userData = { bodyKey: "solar", name: spec.name };
      pivot.add(sat);
      solarSystemObjects.push(sat);
    }
    bodyGroup.add(pivot);
    solarOrbitAnimations.push({ pivot, speed: spec.speed });
  });
}

function makeSatelliteMesh(color) {
  const group = new THREE.Group();
  const bus = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.026, 0.026),
    new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.35, metalness: 0.5 }),
  );
  group.add(bus);
  const panelMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.032), panelMaterial);
  leftPanel.position.x = -0.064;
  leftPanel.rotation.y = Math.PI / 2;
  group.add(leftPanel);
  const rightPanel = leftPanel.clone();
  rightPanel.position.x = 0.064;
  group.add(rightPanel);
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 0.085, 8),
    new THREE.MeshBasicMaterial({ color: 0xf5fbff }),
  );
  antenna.rotation.z = Math.PI / 2;
  antenna.position.z = 0.032;
  group.add(antenna);
  return group;
}

function buildMeteorAndCometField() {
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d8272,
    roughness: 0.92,
    metalness: 0.03,
  });
  for (let i = 0; i < 42; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(2.22, 2.92);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.012, 0.035), 0), rockMaterial.clone());
    rock.position.set(Math.cos(angle) * radius, THREE.MathUtils.randFloatSpread(0.16), Math.sin(angle) * radius);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    rock.userData = { bodyKey: "solar", name: "Meteoroid" };
    solarSystemGroup.add(rock);
    solarSystemObjects.push(rock);
    solarDynamicObjects.push({ object: rock, spin: new THREE.Vector3(Math.random() * 0.01, Math.random() * 0.012, Math.random() * 0.008) });
  }

  const comets = [
    { name: "Comet Atlas", orbit: 5.75, angle: 0.9, color: 0x74f0ff, speed: 0.00016 },
    { name: "Halley path", orbit: 6.95, angle: 3.8, color: 0xbfd4ff, speed: 0.00011 },
  ];
  comets.forEach((comet) => {
    const pivot = new THREE.Group();
    pivot.rotation.y = comet.angle;
    pivot.rotation.x = 0.42;
    const cometGroup = new THREE.Group();
    cometGroup.position.set(comet.orbit, 0.18, 0);
    const nucleus = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.045, 1),
      new THREE.MeshStandardMaterial({ color: 0xdad7c8, roughness: 0.85, emissive: comet.color, emissiveIntensity: 0.08 }),
    );
    nucleus.userData = { bodyKey: "solar", name: comet.name };
    cometGroup.add(nucleus);
    solarSystemObjects.push(nucleus);
    const tail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.02, 0, 0),
        new THREE.Vector3(-0.38, 0.04, -0.08),
        new THREE.Vector3(-0.74, 0.08, -0.18),
      ]),
      new THREE.LineBasicMaterial({
        color: comet.color,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    cometGroup.add(tail);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture("#9eefff"),
        color: comet.color,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    glow.scale.set(0.36, 0.36, 1);
    cometGroup.add(glow);
    const label = makeMapLabelSprite(comet.name, {
      fill: "rgba(0,0,0,0.18)",
      stroke: "rgba(116,240,255,0.24)",
      text: "#dffbff",
    });
    label.position.set(-0.14, 0.22, 0);
    label.scale.multiplyScalar(0.46);
    cometGroup.add(label);
    pivot.add(cometGroup);
    solarSystemGroup.add(pivot);
    solarOrbitAnimations.push({ pivot, speed: comet.speed, spin: nucleus });
  });

  for (let i = 0; i < 20; i += 1) {
    const start = new THREE.Vector3(THREE.MathUtils.randFloat(-6.8, 7.2), THREE.MathUtils.randFloat(1.1, 4.2), THREE.MathUtils.randFloat(-4.4, 3.2));
    const drift = new THREE.Vector3(THREE.MathUtils.randFloat(-1.2, -0.35), THREE.MathUtils.randFloat(-0.34, 0.04), THREE.MathUtils.randFloat(0.18, 0.7));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), drift.clone().multiplyScalar(-0.42)]),
      new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? 0xffc46b : 0xa5eaff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    line.position.copy(start);
    solarSystemGroup.add(line);
    solarDynamicObjects.push({
      object: line,
      start,
      drift,
      phase: Math.random(),
      speed: THREE.MathUtils.randFloat(0.00008, 0.00018),
    });
  }
}

function makeSolarOrbitLine(radius, color, opacity) {
  const points = [];
  for (let i = 0; i <= 240; i += 1) {
    const angle = (i / 240) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
    }),
  );
  return line;
}

function buildAsteroidBelt() {
  const count = 520;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(2.36, 2.72);
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(0.06);
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  solarSystemGroup.add(
    new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xd9d3bf,
        size: 0.012,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
      }),
    ),
  );
}

function buildSpacecraftTrails() {
  const trails = [
    { name: "Voyager 1", color: 0x90eaff, points: [[-0.2, 0.05, 0.1], [2.2, 0.14, -1.2], [4.9, 0.32, -2.3], [7.8, 0.55, -4.2]] },
    { name: "Voyager 2", color: 0xffffff, points: [[0.1, -0.04, -0.2], [-1.7, 0.12, 1.4], [-4.6, 0.22, 2.3], [-7.2, 0.38, 3.8]] },
    { name: "Pioneer 10", color: 0x777777, points: [[0.2, 0.02, 0.1], [1.6, -0.08, 1.1], [3.7, -0.2, 2.8], [6.6, -0.38, 5.1]] },
  ];

  trails.forEach((trail) => {
    const curve = new THREE.CatmullRomCurve3(trail.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
      new THREE.LineBasicMaterial({
        color: trail.color,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
      }),
    );
    solarSystemGroup.add(line);
    const label = makeMapLabelSprite(trail.name, {
      fill: "rgba(0,0,0,0.2)",
      stroke: "rgba(255,255,255,0)",
      text: "#aab0b8",
    });
    label.position.copy(curve.getPoint(0.72));
    label.scale.multiplyScalar(0.48);
    solarSystemGroup.add(label);
  });
}

function makeSolarTexture(colors, banded = false, key = "generic") {
  const canvas = document.createElement("canvas");
  canvas.width = key === "sun" ? 1024 : 2048;
  canvas.height = key === "sun" ? 512 : 1024;
  const ctx = canvas.getContext("2d");
  paintSolarPlanetTexture(ctx, canvas.width, canvas.height, key, colors, banded);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 1;
  return texture;
}

function paintSolarPlanetTexture(ctx, width, height, key, colors, banded = false) {
  if (key === "sun" || key === "solar") {
    drawSunTexture(ctx, width, height, colors);
    return;
  }
  if (key === "earth") {
    drawEarthSolarTexture(ctx, width, height);
    return;
  }
  if (key === "jupiter" || key === "saturn") {
    drawGasGiantTexture(ctx, width, height, key, colors);
    return;
  }
  if (key === "uranus" || key === "neptune") {
    drawIceGiantTexture(ctx, width, height, key, colors);
    return;
  }
  if (key === "venus") {
    drawVenusTexture(ctx, width, height, colors);
    return;
  }
  drawRockyPlanetTexture(ctx, width, height, key, colors, banded);
}

function fillPlanetGradient(ctx, width, height, colors) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, index) => gradient.addColorStop(index / Math.max(colors.length - 1, 1), color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function addFineNoise(ctx, width, height, count, alpha = 0.07, warm = false) {
  for (let i = 0; i < count; i += 1) {
    const shade = warm ? 180 + Math.random() * 70 : 170 + Math.random() * 85;
    ctx.fillStyle = `rgba(${shade},${warm ? shade * 0.82 : shade},${warm ? shade * 0.48 : shade + 10},${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.4, 1.4);
  }
}

function drawSunTexture(ctx, width, height, colors) {
  const gradient = ctx.createRadialGradient(width * 0.48, height * 0.5, 8, width * 0.5, height * 0.5, width * 0.72);
  gradient.addColorStop(0, "#fff7bc");
  gradient.addColorStop(0.22, colors[0]);
  gradient.addColorStop(0.52, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 95; i += 1) {
    const y = Math.random() * height;
    const x = Math.random() * width;
    const length = 50 + Math.random() * 170;
    ctx.strokeStyle = `rgba(255, ${150 + Math.random() * 90}, 40, ${0.12 + Math.random() * 0.28})`;
    ctx.lineWidth = 2 + Math.random() * 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + length * 0.25, y - 24, x + length * 0.55, y + 28, x + length, y + Math.random() * 34 - 17);
    ctx.stroke();
  }
  addFineNoise(ctx, width, height, 1800, 0.18, true);
}

function drawEarthSolarTexture(ctx, width, height) {
  const ocean = ctx.createLinearGradient(0, 0, width, height);
  ocean.addColorStop(0, "#0d315e");
  ocean.addColorStop(0.38, "#0b5790");
  ocean.addColorStop(0.72, "#08265a");
  ocean.addColorStop(1, "#031126");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  const landColors = ["#2e774d", "#4e8b4d", "#9a8052", "#6f7e54", "#d1c6a2"];
  for (let i = 0; i < 38; i += 1) {
    const x = Math.random() * width;
    const y = height * 0.2 + Math.random() * height * 0.62;
    const rx = 22 + Math.random() * 78;
    const ry = 10 + Math.random() * 34;
    ctx.fillStyle = landColors[Math.floor(Math.random() * landColors.length)];
    ctx.globalAlpha = 0.5 + Math.random() * 0.32;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 1.2);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(245,250,255,0.92)";
  ctx.fillRect(0, 0, width, height * 0.075);
  ctx.fillRect(0, height * 0.925, width, height * 0.075);
  for (let i = 0; i < 34; i += 1) {
    const y = Math.random() * height;
    const x = Math.random() * width;
    const w = 54 + Math.random() * 150;
    const h = 8 + Math.random() * 24;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, w);
    cloud.addColorStop(0, "rgba(255,255,255,0.34)");
    cloud.addColorStop(0.52, "rgba(255,255,255,0.16)");
    cloud.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cloud;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, h / w);
    ctx.beginPath();
    ctx.arc(0, 0, w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  addFineNoise(ctx, width, height, 950, 0.05);
}

function drawRockyPlanetTexture(ctx, width, height, key, colors, banded) {
  fillPlanetGradient(ctx, width, height, colors);
  const craterCount = key === "moon" || key === "mercury" ? 170 : 80;
  const warm = key === "mars";
  for (let i = 0; i < craterCount; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 3 + Math.random() * (key === "mars" ? 15 : 28);
    drawCrater(ctx, x, y, r, warm);
  }
  if (key === "mars") {
    ctx.fillStyle = "rgba(242, 236, 210, 0.78)";
    ctx.fillRect(0, 0, width, height * 0.07);
    ctx.fillRect(0, height * 0.93, width, height * 0.07);
    for (let i = 0; i < 26; i += 1) {
      ctx.strokeStyle = "rgba(239, 168, 98, 0.18)";
      ctx.lineWidth = 6 + Math.random() * 12;
      ctx.beginPath();
      const y = Math.random() * height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.28, y - 28, width * 0.63, y + 30, width, y + Math.random() * 46 - 23);
      ctx.stroke();
    }
  }
  if (banded) {
    for (let y = 0; y < height; y += 18) {
      ctx.fillStyle = y % 36 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(0, y + Math.sin(y) * 3, width, 7);
    }
  }
  addFineNoise(ctx, width, height, 1200, key === "moon" ? 0.08 : 0.06, warm);
}

function drawCrater(ctx, x, y, r, warm = false) {
  const fill = warm ? "rgba(63, 25, 18, 0.22)" : "rgba(19, 22, 26, 0.25)";
  const rim = warm ? "rgba(255, 201, 142, 0.2)" : "rgba(255, 255, 255, 0.18)";
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
  ctx.fillStyle = warm ? "rgba(255, 190, 120, 0.06)" : "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.22, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawGasGiantTexture(ctx, width, height, key, colors) {
  fillPlanetGradient(ctx, width, height, colors);
  const bandPalette =
    key === "jupiter"
      ? ["rgba(255,235,197,0.34)", "rgba(150,84,43,0.32)", "rgba(244,183,112,0.27)", "rgba(70,38,25,0.2)"]
      : ["rgba(255,234,184,0.28)", "rgba(151,118,78,0.22)", "rgba(245,210,144,0.22)", "rgba(87,65,44,0.14)"];
  for (let y = -20; y < height + 24; y += 14) {
    const bandHeight = 7 + Math.random() * 16;
    ctx.fillStyle = bandPalette[Math.floor(Math.random() * bandPalette.length)];
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + y * 0.08) * 5);
    }
    ctx.lineTo(width, y + bandHeight);
    ctx.lineTo(0, y + bandHeight);
    ctx.closePath();
    ctx.fill();
  }
  if (key === "jupiter") {
    ctx.fillStyle = "rgba(178, 69, 45, 0.82)";
    ctx.beginPath();
    ctx.ellipse(width * 0.62, height * 0.58, width * 0.1, height * 0.08, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,170,0.45)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  addFineNoise(ctx, width, height, 900, 0.08, true);
}

function drawIceGiantTexture(ctx, width, height, key, colors) {
  fillPlanetGradient(ctx, width, height, colors);
  for (let y = 12; y < height; y += 22) {
    ctx.strokeStyle = key === "neptune" ? "rgba(190,220,255,0.18)" : "rgba(230,255,255,0.16)";
    ctx.lineWidth = 2 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(width * 0.28, y - 14, width * 0.62, y + 18, width, y + Math.random() * 22 - 11);
    ctx.stroke();
  }
  if (key === "neptune") {
    ctx.fillStyle = "rgba(12, 30, 103, 0.42)";
    ctx.beginPath();
    ctx.ellipse(width * 0.66, height * 0.48, width * 0.075, height * 0.045, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  addFineNoise(ctx, width, height, 620, 0.045);
}

function drawVenusTexture(ctx, width, height, colors) {
  fillPlanetGradient(ctx, width, height, colors);
  for (let i = 0; i < 58; i += 1) {
    const y = Math.random() * height;
    ctx.strokeStyle = i % 2 ? "rgba(255,224,157,0.22)" : "rgba(111,72,36,0.18)";
    ctx.lineWidth = 8 + Math.random() * 18;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.bezierCurveTo(width * 0.22, y - 44, width * 0.6, y + 38, width + 20, y + Math.random() * 80 - 40);
    ctx.stroke();
  }
  addFineNoise(ctx, width, height, 1100, 0.075, true);
}

function makePlanetBumpTexture(key) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#777";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const count = key === "mars" ? 95 : 180;
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = 3 + Math.random() * (key === "mars" ? 18 : 30);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "#555");
    gradient.addColorStop(0.72, "#737373");
    gradient.addColorStop(1, "#9a9a9a");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGlowTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.22, color);
  gradient.addColorStop(0.48, "rgba(255,190,60,0.35)");
  gradient.addColorStop(1, "rgba(255,190,60,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function animateSolarSystem(now) {
  if (!solarSystemGroup?.visible || isSimulationPaused) return;
  solarSystemGroup.rotation.y += 0.000045;
  solarOrbitAnimations.forEach((item) => {
    if (item.pivot) item.pivot.rotation.y += item.speed * (currentBodyKey === "solar" ? 1 : 0.24);
    if (item.spin) item.spin.rotation.y += item.speed * 4.5;
    if (item.bodyGroup) item.bodyGroup.position.y = Math.sin(now * item.speed + item.pivot.rotation.y) * 0.035;
  });
  solarDynamicObjects.forEach((item) => {
    if (item.spin) {
      item.object.rotation.x += item.spin.x;
      item.object.rotation.y += item.spin.y;
      item.object.rotation.z += item.spin.z;
    }
    if (item.start && item.drift) {
      const t = (now * item.speed + item.phase) % 1;
      item.object.position.copy(item.start).addScaledVector(item.drift, t * 3.4);
      if (item.object.material) item.object.material.opacity = 0.08 + Math.sin(t * Math.PI) * 0.62;
    }
  });
}

function animateSatelliteTracker(now) {
  updateIssMarker();
  if (!satelliteTrackerGroup?.visible || isSimulationPaused) return;
  satelliteTrackerAnimations.forEach((item) => {
    const t = (now * item.speed + item.offset) % 1;
    const next = (t + 0.004) % 1;
    item.object.position.copy(item.curve.getPointAt(t));
    item.object.lookAt(item.curve.getPointAt(next));
  });
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
  const sunDirection = getRealtimeSunInfo().direction;
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

function getRealtimeSunInfo(date = new Date()) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - startOfYear) / 86400000);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const declination = -23.44 * Math.cos((Math.PI * 2 * (day + 10)) / 365);
  const lon = normalizeLon(180 - utcHours * 15);
  return {
    lat: declination,
    lon,
    direction: latLonToVector3(declination, lon, 1).normalize(),
  };
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

function buildStaticDataLayers() {
  buildLineLayer(seaRoutesGroup, SEA_ROUTES, 0x86dfff, 0.48, 1.035);
  buildLineLayer(plateGroup, TECTONIC_PLATES, 0xff6f91, 0.72, 1.045);
  buildLineLayer(launchGroup, LAUNCH_ROUTES, 0xffbf69, 0.72, 1.11);
  buildLineLayer(migrationGroup, MIGRATION_ROUTES, 0x9df76d, 0.58, 1.09);
  addPointGroup(volcanoGroup, VOLCANO_POINTS, 0xff7a38, 0.026, 1.05);
  addPointGroup(portGroup, PORT_POINTS, 0x58d3df, 0.022, 1.055);
  addPointGroup(airportGroup, AIRPORT_POINTS, 0x98a6ff, 0.02, 1.06);
  addPointGroup(baseGroup, MILITARY_BASE_POINTS, 0xff6f91, 0.022, 1.062);
  addPointGroup(spaceportGroup, SPACEPORT_POINTS, 0xffbf69, 0.024, 1.075);
  buildOceanCurrentArrows();
  buildWindFlowLayer();
  buildZoomGrid();
}

function buildPopulationDensityGlow() {
  if (!populationGlowGroup || !countryRecords.length) return;
  populationGlowGroup.clear();
  countryRecords.forEach((record) => {
    const centroid = window.d3.geoCentroid(record.feature);
    const lon = Number.isFinite(centroid[0]) ? centroid[0] : record.cities?.[0]?.lon || 0;
    const lat = Number.isFinite(centroid[1]) ? centroid[1] : record.cities?.[0]?.lat || 0;
    const density = record.signals?.density || 0;
    const heat = THREE.MathUtils.clamp(density / 650, 0.15, 1);
    const color = heat > 0.62 ? "#ffbf69" : heat > 0.32 ? "#ecff8f" : "#58d3df";
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(color),
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.14 + heat * 0.32,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const size = THREE.MathUtils.clamp(0.08 + Math.sqrt(Math.max(1, density)) / 34, 0.12, 0.52);
    sprite.position.copy(latLonToVector3(lat, lon, RADIUS * 1.018));
    sprite.scale.set(size, size, 1);
    sprite.userData = { density, country: record.name };
    populationGlowGroup.add(sprite);
  });
  updateLayerVisibility();
}

function buildSatelliteTrackerLayer() {
  if (!satelliteTrackerGroup) return;
  satelliteTrackerGroup.clear();
  satelliteTrackerAnimations = [];
  const satellites = [
    { name: "ISS", radius: RADIUS * 1.42, tilt: 51.6, yaw: -24, speed: 0.00016, color: 0xffffff },
    { name: "GPS III", radius: RADIUS * 1.78, tilt: 55, yaw: 58, speed: 0.00007, color: 0x98a6ff },
    { name: "Starlink train", radius: RADIUS * 1.34, tilt: 38, yaw: 112, speed: 0.00022, color: 0x58d3df },
    { name: "Weather sat", radius: RADIUS * 1.62, tilt: 98, yaw: -78, speed: 0.0001, color: 0xecff8f },
  ];
  satellites.forEach((sat, index) => {
    const curve = makeOrbitalCurve(sat.radius, sat.tilt, sat.yaw);
    const orbit = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(180)),
      new THREE.LineBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
      }),
    );
    satelliteTrackerGroup.add(orbit);

    const tracker = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.018, 0.018),
      new THREE.MeshBasicMaterial({ color: sat.color, transparent: true, opacity: 0.92 }),
    );
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.006, 0.025),
      new THREE.MeshBasicMaterial({ color: 0x9ba9bd, transparent: true, opacity: 0.76 }),
    );
    panel.position.x = 0.058;
    const panelTwo = panel.clone();
    panelTwo.position.x = -0.058;
    tracker.add(body, panel, panelTwo);
    const label = makeMapLabelSprite(sat.name, {
      fill: "rgba(5,10,18,0.62)",
      stroke: "rgba(255,255,255,0.44)",
      text: "#eef5ff",
    });
    label.scale.multiplyScalar(0.43);
    label.position.set(0.08, 0.05, 0);
    tracker.add(label);
    satelliteTrackerGroup.add(tracker);
    satelliteTrackerAnimations.push({ curve, object: tracker, speed: sat.speed, offset: index / satellites.length });
  });
  issLiveMarker = makeTrackedSatelliteSprite("ISS live", 0x9df76d);
  issLiveMarker.visible = false;
  satelliteTrackerGroup.add(issLiveMarker);
}

function makeTrackedSatelliteSprite(name, color) {
  const tracker = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.024, 0.024),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.96 }),
  );
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.006, 0.032),
    new THREE.MeshBasicMaterial({ color: 0xe8f2ff, transparent: true, opacity: 0.72 }),
  );
  panel.position.x = 0.07;
  const panelTwo = panel.clone();
  panelTwo.position.x = -0.07;
  tracker.add(body, panel, panelTwo);
  const label = makeMapLabelSprite(name, {
    fill: "rgba(5, 10, 18, 0.74)",
    stroke: "rgba(157,247,109,0.72)",
    text: "#ecff8f",
  });
  label.scale.multiplyScalar(0.45);
  label.position.set(0.1, 0.06, 0);
  tracker.add(label);
  return tracker;
}

function makeOrbitalCurve(radius, tilt, yaw) {
  const points = [];
  const euler = new THREE.Euler(THREE.MathUtils.degToRad(tilt), THREE.MathUtils.degToRad(yaw), 0, "XYZ");
  for (let i = 0; i <= 240; i += 1) {
    const t = (i / 240) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius).applyEuler(euler));
  }
  return new THREE.CatmullRomCurve3(points, true);
}

function buildLineLayer(group, featureCollection, color, opacity, radiusScale) {
  group.clear();
  featureCollection.features.forEach((feature) => {
    const points = feature.geometry.coordinates.map(([lon, lat]) => latLonToVector3(lat, lon, RADIUS * radiusScale));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
      }),
    );
    group.add(line);
  });
}

function addPointGroup(group, points, color, size, radiusScale, showLabels = true) {
  group.clear();
  points.forEach((item) => {
    const marker = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 }),
    );
    dot.position.copy(latLonToVector3(item.lat, item.lon, RADIUS * radiusScale));
    marker.add(dot);
    if (showLabels) {
      const label = makeMapLabelSprite(item.name, {
        fill: "rgba(5, 10, 18, 0.72)",
        stroke: color,
        text: "#eef5ff",
      });
      label.position.copy(latLonToVector3(item.lat, item.lon, RADIUS * (radiusScale + 0.07)));
      label.scale.multiplyScalar(0.62);
      marker.add(label);
    }
    group.add(marker);
  });
}

function buildOceanCurrentArrows() {
  currentArrowGroup.clear();
  currentAnimations = [];
  OCEAN_CURRENT_ROUTES.forEach((feature, index) => {
    const points = feature.geometry.coordinates.map(([lon, lat]) => latLonToVector3(lat, lon, RADIUS * 1.08));
    const curve = new THREE.CatmullRomCurve3(points);
    for (let i = 0; i < 6; i += 1) {
      const arrow = makeCurrentArrow();
      currentArrowGroup.add(arrow);
      currentAnimations.push({ curve, arrow, offset: (i / 6 + index * 0.13) % 1 });
    }
  });
}

function makeCurrentArrow() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.035);
  shape.lineTo(0.07, 0);
  shape.lineTo(0, -0.035);
  shape.lineTo(0.018, 0);
  shape.lineTo(0, 0.035);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color: 0x58d3df,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function buildWindFlowLayer() {
  if (!windArrowGroup) return;
  windArrowGroup.clear();
  windAnimations = [];
  WIND_JET_ROUTES.features.forEach((feature, index) => {
    const points = feature.geometry.coordinates.map(([lon, lat]) => latLonToVector3(lat, lon, RADIUS * 1.12));
    const curve = new THREE.CatmullRomCurve3(points);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
      new THREE.LineBasicMaterial({
        color: 0xecff8f,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
      }),
    );
    windArrowGroup.add(line);
    for (let i = 0; i < 5; i += 1) {
      const arrow = makeWindArrow();
      windArrowGroup.add(arrow);
      windAnimations.push({ curve, arrow, offset: (i / 5 + index * 0.17) % 1 });
    }
  });
}

function makeWindArrow() {
  const arrow = makeCurrentArrow();
  arrow.material = new THREE.MeshBasicMaterial({
    color: 0xecff8f,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  arrow.scale.setScalar(0.76);
  return arrow;
}

function buildAuroraLayer() {
  if (!auroraGroup) return;
  auroraGroup.clear();
  [-72, 72].forEach((lat, hemisphereIndex) => {
    for (let i = 0; i < 4; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(RADIUS * (0.24 + i * 0.04), 0.006, 8, 160),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x58d3df : 0x9df76d,
          transparent: true,
          opacity: 0.18 - i * 0.018,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      const normal = latLonToVector3(lat, i * 42 + hemisphereIndex * 16, 1).normalize();
      ring.position.copy(latLonToVector3(lat, i * 42, RADIUS * 1.045));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      ring.scale.set(1.4 + i * 0.1, 0.52 + i * 0.03, 1);
      auroraGroup.add(ring);
    }
  });
}

function buildMeteorShower() {
  if (!meteorShowerGroup) return;
  meteorShowerGroup.clear();
  meteorAnimations = [];
  const materialBase = new THREE.LineBasicMaterial({
    color: 0xffe2a3,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 34; i += 1) {
    const start = new THREE.Vector3(-8 + Math.random() * 18, 6 + Math.random() * 10, -10 - Math.random() * 20);
    const end = start.clone().add(new THREE.Vector3(3 + Math.random() * 4, -4 - Math.random() * 5, 1 + Math.random() * 4));
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.7, -0.48, 0.16)]),
      materialBase.clone(),
    );
    line.position.copy(start);
    meteorShowerGroup.add(line);
    meteorAnimations.push({ object: line, start, end, offset: Math.random(), speed: 0.00006 + Math.random() * 0.00004 });
  }
}

function buildDebrisField() {
  if (!debrisFieldGroup) return;
  debrisFieldGroup.clear();
  debrisAnimations = [];
  const pointsGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i += 1) {
    const lat = -58 + Math.random() * 116;
    const lon = -180 + Math.random() * 360;
    const pointVector = latLonToVector3(lat, lon, RADIUS * (1.31 + Math.random() * 0.46));
    positions[i * 3] = pointVector.x;
    positions[i * 3 + 1] = pointVector.y;
    positions[i * 3 + 2] = pointVector.z;
  }
  pointsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    pointsGeometry,
    new THREE.PointsMaterial({
      color: 0xd8e5f7,
      size: 0.009,
      transparent: true,
      opacity: 0.44,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  debrisFieldGroup.add(points);
  debrisAnimations.push({ object: points, speedX: 0.00012, speedY: 0.00022, speedZ: -0.00008 });
  [
    { radius: RADIUS * 1.38, tilt: 51.6, yaw: -24, color: 0xffffff },
    { radius: RADIUS * 1.52, tilt: 74, yaw: 42, color: 0x98a6ff },
    { radius: RADIUS * 1.68, tilt: 98, yaw: -72, color: 0x58d3df },
  ].forEach((orbit) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(makeOrbitalCurve(orbit.radius, orbit.tilt, orbit.yaw).getPoints(200)),
      new THREE.LineBasicMaterial({
        color: orbit.color,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
      }),
    );
    debrisFieldGroup.add(line);
  });
}

function buildSunFlare() {
  if (!sunFlareGroup) return;
  sunFlareGroup.clear();
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture("#ffd36a"),
      color: 0xffd36a,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sprite.scale.set(7.5, 7.5, 1);
  sunFlareGroup.add(sprite);
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.72 + i * 0.22, 0.74 + i * 0.22, 128),
      new THREE.MeshBasicMaterial({
        color: 0xffbf69,
        transparent: true,
        opacity: 0.18 - i * 0.035,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    sunFlareGroup.add(ring);
  }
}

function loadEarthquakes() {
  fetchJsonWithTimeout(EARTHQUAKE_URL, 9000)
    .then((data) => {
      latestQuakes = (data.features || [])
        .map((feature) => {
          const [lon, lat, depth] = feature.geometry?.coordinates || [];
          const mag = Number(feature.properties?.mag || 0);
          return {
            ...point(
              `M${mag.toFixed(1)}`,
              lat,
              lon,
              feature.properties?.place || `Depth ${Math.round(depth || 0)} km`,
            ),
            mag,
            depth,
          };
        })
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon) && Number.isFinite(item.mag));
      renderEarthquakeLayer();
      updateLayerVisibility();
    })
    .catch(() => {
      latestQuakes = [
        { ...point("M5.1", 38.3, 142.4, "Japan trench sample"), mag: 5.1 },
        { ...point("M4.9", -20.5, -70.2, "Chile trench sample"), mag: 4.9 },
        { ...point("M5.4", -6.1, 154.8, "Solomon arc sample"), mag: 5.4 },
      ];
      renderEarthquakeLayer();
      updateLayerVisibility();
    });
}

function renderEarthquakeLayer() {
  if (!earthquakeGroup) return;
  const quakes = latestQuakes
    .filter((item) => item.mag >= quakeMinMagnitude)
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 90)
    .map((item) =>
      point(
        `M${item.mag.toFixed(1)}`,
        item.lat,
        item.lon,
        item.note || `Magnitude ${item.mag.toFixed(1)}`,
      ),
    );
  addPointGroup(earthquakeGroup, quakes, 0xff6f91, 0.017, 1.07, false);
}

function loadIssPosition() {
  fetchJsonWithTimeout(ISS_URL, 9000)
    .then((data) => {
      const lat = Number(data.latitude);
      const lon = Number(data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Invalid ISS position");
      issLiveData = {
        lat,
        lon,
        velocity: Number(data.velocity),
        altitude: Number(data.altitude),
      };
      updateIssMarker();
      updateIssHud();
      unlockAchievement("iss-lock");
    })
    .catch(() => {
      if (!issLiveData) {
        issLiveData = { lat: 0.18, lon: -42.4, velocity: 27600, altitude: 420 };
      }
      updateIssMarker();
      updateIssHud(true);
    });
}

function updateIssMarker() {
  if (!issLiveMarker || !issLiveData) return;
  issLiveMarker.visible = currentBodyKey === "earth" && layerState.satelliteTracker;
  issLiveMarker.position.copy(latLonToVector3(issLiveData.lat, issLiveData.lon, RADIUS * 1.48));
  issLiveMarker.lookAt(getGlobeCenter());
}

function updateIssHud(isFallback = false) {
  if (!ui.issPosition || !ui.issVelocity || !issLiveData) return;
  ui.issPosition.textContent = `${issLiveData.lat.toFixed(2)}°, ${normalizeLon(issLiveData.lon).toFixed(2)}°`;
  const speed = Number.isFinite(issLiveData.velocity) ? `${formatNumber(Math.round(issLiveData.velocity))} km/h` : "Orbiting";
  const altitude = Number.isFinite(issLiveData.altitude) ? `${Math.round(issLiveData.altitude)} km` : "LEO";
  ui.issVelocity.textContent = `${isFallback ? "Last known" : "Live"} / ${speed} / ${altitude}`;
}

function buildCelestialMarkers(body) {
  celestialMarkersGroup.clear();
  const points = [...(body.markers || []), ...(SURFACE_MISSIONS[currentBodyKey] || [])];
  addPointGroup(celestialMarkersGroup, points, 0xecff8f, 0.026, 1.08);
}

function animateFlightArcs(now) {
  flightArcAnimations.forEach((item) => {
    const t = (now * 0.00009 + item.offset) % 1;
    item.marker.position.copy(item.curve.getPointAt(t));
  });
}

function animateOceanCurrentArrows(now) {
  currentAnimations.forEach((item) => {
    const t = (now * 0.000055 + item.offset) % 1;
    const next = (t + 0.006) % 1;
    const pointA = item.curve.getPointAt(t);
    const pointB = item.curve.getPointAt(next);
    item.arrow.position.copy(pointA);
    item.arrow.lookAt(pointB);
    item.arrow.rotateX(Math.PI / 2);
  });
}

function animateWindFlow(now) {
  windAnimations.forEach((item) => {
    const t = (now * 0.00008 + item.offset) % 1;
    const next = (t + 0.006) % 1;
    const pointA = item.curve.getPointAt(t);
    const pointB = item.curve.getPointAt(next);
    item.arrow.position.copy(pointA);
    item.arrow.lookAt(pointB);
    item.arrow.rotateX(Math.PI / 2);
    item.arrow.material.opacity = 0.36 + Math.sin(now * 0.003 + item.offset * 12) * 0.12;
  });
}

function animateMeteorShower(now) {
  meteorAnimations.forEach((item) => {
    const phase = (now * item.speed + item.offset) % 1;
    item.object.position.copy(item.start).lerp(item.end, phase);
    item.object.material.opacity = 0.14 + (1 - phase) * 0.56;
  });
}

function animateDebrisField(now) {
  debrisAnimations.forEach((item) => {
    item.object.rotation.x += item.speedX;
    item.object.rotation.y += item.speedY;
    item.object.rotation.z += item.speedZ;
  });
}

function updateRealtimeSunLighting() {
  if (!keyLight || !rimLight || !ambientLight) return;
  const sun = getRealtimeSunInfo();
  if (currentBodyKey === "earth" && layerState.sunLighting) {
    const center = getGlobeCenter();
    keyLight.position.copy(center.clone().add(sun.direction.clone().multiplyScalar(8)));
    keyLight.intensity = isNightMode ? 1.45 : 2.55;
    ambientLight.intensity = isNightMode ? 0.9 : 1.32;
    rimLight.intensity = 1.05;
  } else if (currentBodyKey === "solar") {
    keyLight.position.set(0, 2, 1.5);
    keyLight.intensity = 2.9;
    ambientLight.intensity = 1.12;
    rimLight.intensity = 1.4;
  } else {
    keyLight.position.set(4, 3, 6);
    keyLight.intensity = 2.25;
    ambientLight.intensity = 1.26;
    rimLight.intensity = 1.05;
  }
  if (sunFlareGroup) {
    sunFlareGroup.rotation.z += 0.0012;
    sunFlareGroup.visible = layerState.meteors && currentBodyKey === "solar";
  }
}

function updateLayerVisibility() {
  const earthActive = currentBodyKey === "earth";
  const solarActive = currentBodyKey === "solar";
  if (flightArcsGroup) flightArcsGroup.visible = earthActive && layerState.flights;
  if (seaRoutesGroup) seaRoutesGroup.visible = earthActive && layerState.seaRoutes;
  if (earthquakeGroup) earthquakeGroup.visible = earthActive && layerState.quakes;
  if (volcanoGroup) volcanoGroup.visible = earthActive && layerState.volcanoes;
  if (portGroup) portGroup.visible = earthActive && layerState.ports;
  if (airportGroup) airportGroup.visible = earthActive && layerState.airports;
  if (plateGroup) plateGroup.visible = earthActive && layerState.plates;
  if (baseGroup) baseGroup.visible = earthActive && layerState.bases;
  if (spaceportGroup) spaceportGroup.visible = earthActive && layerState.spaceports;
  if (launchGroup) launchGroup.visible = earthActive && layerState.launches;
  if (migrationGroup) migrationGroup.visible = earthActive && layerState.migration;
  if (currentArrowGroup) currentArrowGroup.visible = earthActive && layerState.currents;
  if (windArrowGroup) windArrowGroup.visible = earthActive && layerState.winds;
  if (csvPinsGroup) csvPinsGroup.visible = earthActive && layerState.csvPins;
  if (populationGlowGroup) populationGlowGroup.visible = earthActive && layerState.population;
  if (satelliteTrackerGroup) satelliteTrackerGroup.visible = earthActive && layerState.satelliteTracker;
  if (auroraGroup) auroraGroup.visible = earthActive && layerState.aurora;
  if (meteorShowerGroup) meteorShowerGroup.visible = layerState.meteors;
  if (debrisFieldGroup) debrisFieldGroup.visible = earthActive && layerState.debris;
  if (sunFlareGroup) sunFlareGroup.visible = solarActive && layerState.meteors;
  if (cloudMesh) cloudMesh.visible = earthActive && layerState.clouds;
  if (terminatorLine) terminatorLine.visible = earthActive && layerState.sunLighting;
  if (constellationGroup) constellationGroup.visible = layerState.constellations;
  if (scalePlanetsGroup) scalePlanetsGroup.visible = isScalePlanetsVisible;
  if (solarSystemGroup) solarSystemGroup.visible = solarActive;
  if (zoomGridGroup) zoomGridGroup.visible = earthActive && layerState.measureGrid && camera.position.distanceTo(getGlobeCenter()) < 4.2;
  if (gdpRingGroup) gdpRingGroup.visible = earthActive;
  if (coastGlowGroup) coastGlowGroup.visible = earthActive;
  if (scanGroup) scanGroup.visible = earthActive;
  if (countryExtrusionGroup) countryExtrusionGroup.visible = earthActive;
  if (celestialMarkersGroup) celestialMarkersGroup.visible = !earthActive && !solarActive;
  if (markersGroup) markersGroup.visible = earthActive;
  if (flagPinsGroup) flagPinsGroup.visible = earthActive;
  if (capitalMarkersGroup) capitalMarkersGroup.visible = earthActive;
  updateIssMarker();
}

function updateCountryAnalysisLayers(record) {
  gdpRingGroup.clear();
  coastGlowGroup.clear();
  scanGroup.clear();
  countryExtrusionGroup.clear();
  if (!record) return;

  const centroid = window.d3.geoCentroid(record.feature);
  const lon = Number.isFinite(centroid[0]) ? centroid[0] : 0;
  const lat = Number.isFinite(centroid[1]) ? centroid[1] : 0;
  const center = latLonToVector3(lat, lon, RADIUS * 1.16);
  const normal = center.clone().normalize();

  const extrusionRadius = THREE.MathUtils.clamp(Math.sqrt(record.area || 90000) / 5200, 0.075, 0.24);
  const extrusionHeight = THREE.MathUtils.clamp(0.07 + (record.signals.gdpPerCapita || 1000) / 180000, 0.08, 0.22);
  const extrusion = new THREE.Mesh(
    new THREE.CylinderGeometry(extrusionRadius * 0.72, extrusionRadius, extrusionHeight, 48, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x58d3df,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  extrusion.position.copy(latLonToVector3(lat, lon, RADIUS * 1.06).addScaledVector(normal, extrusionHeight * 0.45));
  extrusion.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  countryExtrusionGroup.add(extrusion);

  const cap = new THREE.Mesh(
    new THREE.CircleGeometry(extrusionRadius * 0.86, 48),
    new THREE.MeshBasicMaterial({
      color: 0x9df76d,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  cap.position.copy(latLonToVector3(lat, lon, RADIUS * 1.06).addScaledVector(normal, extrusionHeight + 0.016));
  cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  countryExtrusionGroup.add(cap);

  const ringSize = THREE.MathUtils.clamp(0.16 + (record.signals.gdp || 20) / 15000, 0.18, 0.42);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(ringSize, 0.006, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffbf69,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
    }),
  );
  ring.position.copy(center);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  gdpRingGroup.add(ring);

  const label = makeMapLabelSprite(`GDP $${formatNumber(record.signals.gdp)}B`, {
    fill: "rgba(31, 18, 8, 0.72)",
    stroke: "rgba(255,191,105,0.82)",
    text: "#ffe4b1",
  });
  label.position.copy(latLonToVector3(lat, lon, RADIUS * 1.38));
  label.scale.multiplyScalar(0.75);
  gdpRingGroup.add(label);

  const scan = new THREE.Mesh(
    new THREE.TorusGeometry(0.24, 0.004, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0x9df76d,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    }),
  );
  scan.userData = { base: center.clone(), normal };
  scan.position.copy(center);
  scan.quaternion.copy(ring.quaternion);
  scanGroup.add(scan);
  scanStarted = performance.now();
}

function animateScanLine(now) {
  const scan = scanGroup?.children?.[0];
  if (!scan) return;
  const t = ((now - scanStarted) % 1800) / 1800;
  const scale = 0.45 + t * 2.15;
  scan.scale.setScalar(scale);
  scan.material.opacity = 0.95 * (1 - t);
}

function buildZoomGrid() {
  zoomGridGroup.clear();
  const material = new THREE.LineBasicMaterial({
    color: 0xecff8f,
    transparent: true,
    opacity: 0.22,
  });
  for (let lat = -80; lat <= 80; lat += 10) {
    const points = [];
    for (let lon = -180; lon <= 180; lon += 5) points.push(latLonToVector3(lat, lon, RADIUS * 1.071));
    zoomGridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  for (let lon = -180; lon <= 180; lon += 10) {
    const points = [];
    for (let lat = -85; lat <= 85; lat += 5) points.push(latLonToVector3(lat, lon, RADIUS * 1.071));
    zoomGridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  zoomGridGroup.visible = false;
}

function updateZoomGridVisibility() {
  if (!zoomGridGroup || currentBodyKey !== "earth") return;
  zoomGridGroup.visible = layerState.measureGrid && camera.position.distanceTo(getGlobeCenter()) < 4.2;
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

function drawMiniMap() {
  if (!ui.miniMap) return;
  const canvas = ui.miniMap;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, currentBodyKey === "earth" ? "#08345c" : "#252936");
  gradient.addColorStop(1, currentBodyKey === "earth" ? "#02131f" : "#0c0f16");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (currentBodyKey === "earth" && countryFeatures.length) {
    const projection = window.d3.geoEquirectangular().fitSize([canvas.width, canvas.height], { type: "Sphere" });
    const path = window.d3.geoPath(projection, ctx);
    ctx.fillStyle = "rgba(121, 185, 115, 0.72)";
    countryFeatures.forEach((feature) => {
      ctx.beginPath();
      path(feature);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(232,255,244,0.24)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    path(countryBorders);
    ctx.stroke();
  } else {
    ctx.fillStyle = currentBodyKey === "mars" ? "#b65b32" : currentBodyKey === "jupiter" ? "#d6a66f" : "#939aa3";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  const look = camera.position.clone().sub(getGlobeCenter()).normalize();
  const coords = vectorToLatLon(look);
  const x = ((coords.lon + 180) / 360) * canvas.width;
  const y = ((90 - coords.lat) / 180) * canvas.height;
  ctx.fillStyle = "#ecff8f";
  ctx.strokeStyle = "rgba(5,10,18,0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (selectedRecord && currentBodyKey === "earth") {
    const centroid = window.d3.geoCentroid(selectedRecord.feature);
    const sx = ((centroid[0] + 180) / 360) * canvas.width;
    const sy = ((90 - centroid[1]) / 180) * canvas.height;
    ctx.strokeStyle = "#58d3df";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ui.miniMapLabel.textContent = currentBodyKey === "earth" ? "2D Earth overview" : `${CELESTIAL_BODIES[currentBodyKey].name} overview`;
}

function updateStreetDetail(record) {
  if (!ui.streetDetail) return;
  if (!layerState.streetMap || !record || currentBodyKey !== "earth") {
    ui.streetDetail.hidden = true;
    lastStreetKey = "";
    return;
  }
  const coords = getWeatherCoords(record);
  if (!coords) {
    ui.streetDetail.hidden = false;
    drawStreetFallback("No street coordinates", "This country has no capital coordinates.");
    return;
  }
  const key = `${record.key}-${coords.lat.toFixed(3)}-${coords.lon.toFixed(3)}`;
  if (key === lastStreetKey) return;
  lastStreetKey = key;
  ui.streetDetail.hidden = false;
  ui.streetTitle.textContent = `${record.capital || record.name} street detail`;
  ui.streetCaption.textContent = "OpenStreetMap roads, settlements, and buildings.";
  drawStreetTiles(coords.lat, coords.lon, record.capital || record.name);
}

function drawStreetTiles(lat, lon, label) {
  const canvas = ui.streetCanvas;
  const ctx = canvas.getContext("2d");
  const zoom = 13;
  const tile = latLonToTile(lat, lon, zoom);
  const size = 256;
  const scale = canvas.width / (size * 3);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111923";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let loaded = 0;
  let failed = 0;
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, (dx + 1) * size * scale, (dy + 1) * size * scale, size * scale, size * scale);
        loaded += 1;
        if (loaded + failed === 9) finishStreetTiles(ctx, label);
      };
      img.onerror = () => {
        failed += 1;
        if (loaded + failed === 9) {
          drawStreetFallback(label, "Street tiles could not load right now.");
        }
      };
      img.src = `https://tile.openstreetmap.org/${zoom}/${tile.x + dx}/${tile.y + dy}.png`;
    }
  }
}

function finishStreetTiles(ctx, label) {
  const cx = ui.streetCanvas.width / 2;
  const cy = ui.streetCanvas.height / 2;
  ctx.strokeStyle = "#58d3df";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(5,10,18,0.74)";
  roundRect(ctx, 10, ui.streetCanvas.height - 38, ui.streetCanvas.width - 20, 28, 8);
  ctx.fill();
  ctx.fillStyle = "#eef5ff";
  ctx.font = "800 14px Segoe UI, Arial, sans-serif";
  ctx.fillText(label, 20, ui.streetCanvas.height - 19);
}

function drawStreetFallback(title, note) {
  const canvas = ui.streetCanvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111923";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(88,211,223,0.25)";
  ctx.lineWidth = 2;
  for (let i = 20; i < canvas.width; i += 38) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(canvas.width - i / 4, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i * 0.7);
    ctx.stroke();
  }
  ctx.fillStyle = "#eef5ff";
  ctx.font = "900 18px Segoe UI, Arial, sans-serif";
  ctx.fillText(title, 18, 44);
  ctx.fillStyle = "#9ba9bd";
  ctx.font = "700 13px Segoe UI, Arial, sans-serif";
  ctx.fillText(note, 18, 70);
}

function latLonToTile(lat, lon, zoom) {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = THREE.MathUtils.degToRad(lat);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function importCsvPins(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result || ""));
    const pins = rows
      .map((row, index) => {
        const lat = Number(row.lat ?? row.latitude);
        const lon = Number(row.lon ?? row.lng ?? row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        return point(row.name || `CSV pin ${index + 1}`, lat, lon, row.note || row.description || "Imported CSV point");
      })
      .filter(Boolean);
    addPointGroup(csvPinsGroup, pins, 0xecff8f, 0.024, 1.09);
    updateLayerVisibility();
    setStatus(`Imported ${pins.length} CSV pins`);
  };
  reader.readAsText(file);
  event.target.value = "";
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""]));
  });
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function vectorToLatLon(vector) {
  const normal = vector.clone().normalize();
  const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(normal.y, -1, 1)));
  const phi = Math.atan2(normal.z, -normal.x);
  const lon = normalizeLon(THREE.MathUtils.radToDeg(phi) - 180);
  return { lat, lon };
}

function fetchJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`Request failed: ${url}`);
    }
    return response.json();
  });
}

function fetchJsonWithTimeout(url, timeout = 9000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed: ${url}`);
      }
      return response.json();
    })
    .finally(() => window.clearTimeout(timer));
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

function point(name, lat, lon, note) {
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

function getCountryMapUrl(countryName) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(countryName)}`;
}

function getVisaStatus(passport, targetCca3) {
  if (!targetCca3) return { label: "Unknown", note: "No country code in this dataset." };
  if (passport === targetCca3 || (passport === "EU" && ["FRA", "DEU", "ITA", "ESP", "POL", "NLD", "CZE", "SWE"].includes(targetCca3))) {
    return { label: "Domestic / free movement", note: "No tourist visa needed for normal short stays." };
  }
  const rules = VISA_RULES[passport] || {};
  if (rules.visaFree?.includes(targetCca3)) return { label: "Visa-free", note: "Usually no visa for short tourism stays." };
  if (rules.eVisa?.includes(targetCca3)) return { label: "eVisa / ETA", note: "Usually needs an online authorization before travel." };
  if (rules.required?.includes(targetCca3)) return { label: "Visa required", note: "Usually needs a visa before arrival." };
  const seed = getStableNumber(`${passport}-${targetCca3}`);
  return [
    { label: "Visa-free", note: "Estimated as visa-free for many short tourist visits." },
    { label: "eVisa / ETA", note: "Estimated online authorization route." },
    { label: "Visa required", note: "Estimated embassy/consulate visa route." },
  ][seed % 3];
}

function getCityPhotoUrl(cityRecord, countryRecord) {
  const tags = `${cityRecord.name},${countryRecord.name},city,landmark`
    .replace(/[^\w\s,-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `https://loremflickr.com/480/300/${encodeURIComponent(tags)}/all?lock=${getStableNumber(
    `${cityRecord.name}-${countryRecord.cca3}`,
  )}`;
}

function getFoodItems(record) {
  return FOOD_HIGHLIGHTS[record.cca3] || [
    `${record.name} street food`,
    `${record.name} bread`,
    `${record.name} stew`,
    `${record.name} dessert`,
  ];
}

function getFoodPhotoUrl(food, record) {
  const tags = `${food},${record.name},traditional,food`.replace(/[^\w\s,-]/g, "").replace(/\s+/g, "-").slice(0, 80);
  return `https://loremflickr.com/480/300/${encodeURIComponent(tags)}/all?lock=${getStableNumber(`${food}-${record.cca3}`)}`;
}

function getDisasterHistory(record) {
  return (
    DISASTER_HISTORY[record.cca3] || [
      `${record.name} regional flood and storm events`,
      `${record.name} historical earthquake or severe weather records`,
      `${record.name} wildfire, drought, or extreme climate events`,
    ]
  );
}

function makeCountryFeatureSections(record) {
  const badges = getOrganizationBadges(record).map((badge) => `<span class="org-badge">${escapeHtml(badge)}</span>`).join("");
  const people = getFamousPeople(record)
    .map((person) => `<article class="person-card"><strong>${escapeHtml(person[0])}</strong><span>${escapeHtml(person[1])}</span></article>`)
    .join("");
  const symbols = getNationalSymbols(record).map((item) => `<span class="mini-data-chip">${escapeHtml(item)}</span>`).join("");
  const science = getScienceAchievements(record).map((item) => `<span class="mini-data-chip">${escapeHtml(item)}</span>`).join("");
  const inventions = getInventions(record)
    .map((item) => `<article class="invention-card"><strong>${escapeHtml(item[0])}</strong><span>${escapeHtml(item[1])}</span></article>`)
    .join("");
  const currency = inferCurrency(record);
  const trip = makeTripCost(record);
  const economy = getEconomyExtras(record);
  const cityCosts = getCostOfLiving(record);
  const alphabet = getAlphabetPreview(record);
  const costumes = getNationalCostumes(record);
  const animals = getEndangeredAnimals(record);
  const radioUrl = `https://radio.garden/search?q=${encodeURIComponent(record.capital || record.name)}`;
  const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(record.name.replaceAll(" ", "_"))}`;
  return `
    <section class="feature-card">
      <h4>Organizations</h4>
      <div class="badge-row">${badges}</div>
    </section>
    <section class="feature-card">
      <h4>Name origin</h4>
      <p>${escapeHtml(getNameOrigin(record))}</p>
      <a class="detail-action" href="${escapeHtml(wikiUrl)}" target="_blank" rel="noreferrer">Read more</a>
      <a class="detail-action" href="${escapeHtml(radioUrl)}" target="_blank" rel="noreferrer">Open local radio</a>
    </section>
    <section class="feature-card">
      <h4>Currency converter</h4>
      <div class="currency-converter">
        <div class="converter-grid">
          <label>Amount <input id="converter-amount" type="number" min="0" value="100" /></label>
          <label>From <input id="converter-source" type="text" value="${escapeHtml(currency.code)}" readonly /></label>
          <label>To
            <select id="converter-target">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UAH">UAH</option>
            </select>
          </label>
        </div>
        <div class="converter-output" id="converter-output">
          <strong>${formatNumber(Math.round(100 * currency.rate * 100) / 100)} USD</strong>
          <span>${escapeHtml(currency.code)} to USD, demo rate</span>
        </div>
      </div>
    </section>
    <section class="feature-card">
      <h4>Trip cost estimator</h4>
      <div class="trip-grid">
        <div class="trip-cost"><strong>$${trip.food}</strong><span>Food</span></div>
        <div class="trip-cost"><strong>$${trip.hotel}</strong><span>Hotel</span></div>
        <div class="trip-cost"><strong>$${trip.transport}</strong><span>Transport</span></div>
      </div>
      <p>Estimated daily total: <strong>$${trip.total}</strong> per traveler.</p>
    </section>
    <section class="feature-card">
      <h4>Salary, fuel, business</h4>
      <div class="economy-grid">
        <span><b>${escapeHtml(economy.minimumWage)}</b><em>Minimum wage</em></span>
        <span><b>${escapeHtml(economy.averageSalary)}</b><em>Average salary</em></span>
        <span><b>${escapeHtml(economy.fuelPrice)}</b><em>Fuel price</em></span>
        <span><b>${escapeHtml(economy.businessScore)}</b><em>Business ease</em></span>
        <span><b>${escapeHtml(economy.taxSummary)}</b><em>Tax summary</em></span>
      </div>
    </section>
    <section class="feature-card">
      <h4>Cost of living by city</h4>
      <div class="cost-city-grid">
        ${cityCosts.map((item) => `<span><b>${escapeHtml(item[0])}</b><em>${escapeHtml(item[1])}</em></span>`).join("")}
      </div>
    </section>
    <section class="feature-card">
      <h4>Local alphabet preview</h4>
      <p class="alphabet-preview">${escapeHtml(alphabet.script)}</p>
      <p>${escapeHtml(alphabet.note)}</p>
    </section>
    <section class="feature-card">
      <h4>National costume cards</h4>
      <div class="costume-grid">
        ${costumes.map((item) => `<article class="costume-card"><strong>${escapeHtml(item[0])}</strong><span>${escapeHtml(item[1])}</span></article>`).join("")}
      </div>
    </section>
    <section class="feature-card">
      <h4>Endangered animals</h4>
      <div class="mini-card-row">${animals.map((item) => `<span class="mini-data-chip">${escapeHtml(item)}</span>`).join("")}</div>
    </section>
    <section class="feature-card">
      <h4>Famous people</h4>
      <div class="people-grid">${people}</div>
    </section>
    <section class="feature-card">
      <h4>National symbols</h4>
      <div class="mini-card-row">${symbols}</div>
      <p><strong>License plate example:</strong> ${escapeHtml(getLicensePlate(record))}</p>
    </section>
    <section class="feature-card">
      <h4>Scientific achievements</h4>
      <div class="mini-card-row">${science}</div>
    </section>
    <section class="feature-card">
      <h4>Famous inventions</h4>
      <div class="invention-grid">${inventions}</div>
    </section>
  `;
}

function getOrganizationBadges(record) {
  const badges = [];
  if (record.cca3 !== "ATA") badges.push("UN");
  if (EU_MEMBERS.has(record.cca3)) badges.push("EU");
  if (NATO_MEMBERS.has(record.cca3)) badges.push("NATO");
  if (BRICS_MEMBERS.has(record.cca3)) badges.push("BRICS");
  if (!badges.length) badges.push("Regional / treaty links");
  return badges;
}

function getNameOrigin(record) {
  return (
    NAME_ORIGINS[record.cca3] ||
    `${record.name}'s modern English name is connected to local geography, historic peoples, colonial naming, or the country's own endonym.`
  );
}

function getFamousPeople(record) {
  return (
    FAMOUS_PEOPLE[record.cca3] || [
      [`${record.name} artists`, "Cultural figures, writers, musicians, and filmmakers"],
      [`${record.name} scientists`, "Researchers and engineers connected with national universities"],
      [`${record.name} athletes`, "Olympic, football, or regional sport figures"],
    ]
  );
}

function getNationalSymbols(record) {
  return NATIONAL_SYMBOLS[record.cca3] || [`${record.name} flag`, "National coat of arms", "National anthem"];
}

function getLicensePlate(record) {
  return LICENSE_PLATE_EXAMPLES[record.cca3] || `${(record.cca2 || record.cca3 || "XX").slice(0, 2)} 1234 AB`;
}

function getScienceAchievements(record) {
  return (
    SCIENCE_ACHIEVEMENTS[record.cca3] || [
      "National university research",
      "Public health and climate studies",
      "Infrastructure and engineering projects",
    ]
  );
}

function getInventions(record) {
  return (
    FAMOUS_INVENTIONS[record.cca3] || [
      [`${record.name} craft technology`, "Local industrial and cultural design"],
      [`${record.name} agriculture methods`, "Regional farming and food production knowledge"],
      [`${record.name} engineering projects`, "Infrastructure and applied science work"],
    ]
  );
}

function getEconomyExtras(record) {
  const known = COUNTRY_ECONOMY_EXTRAS[record.cca3];
  if (known) {
    return {
      minimumWage: known.wage,
      averageSalary: known.salary,
      fuelPrice: known.fuel,
      businessScore: `${known.business}/100`,
      taxSummary: known.tax,
    };
  }
  const seed = getStableNumber(`${record.cca3}-economy`);
  const incomeFactor = THREE.MathUtils.clamp((record.signals.gdpPerCapita || 9000) / 18000, 0.34, 2.85);
  return {
    minimumWage: `$${Math.round((160 + (seed % 380)) * incomeFactor)}/mo`,
    averageSalary: `$${Math.round((620 + (seed % 1400)) * incomeFactor)}/mo`,
    fuelPrice: `$${(0.72 + (seed % 85) / 100).toFixed(2)}/L`,
    businessScore: `${Math.round(44 + (seed % 46))}/100`,
    taxSummary: `VAT ${(5 + (seed % 18)).toFixed(0)}%, income ${(10 + (seed % 25)).toFixed(0)}%`,
  };
}

function getCostOfLiving(record) {
  if (COST_OF_LIVING_BY_CITY[record.cca3]) return COST_OF_LIVING_BY_CITY[record.cca3];
  const trip = makeTripCost(record);
  return (record.cities?.length ? record.cities : buildFallbackCities(record.capital, getWeatherCoords(record)))
    .slice(0, 3)
    .map((item, index) => [item.name, `$${Math.max(28, trip.total - index * 8)}/day`]);
}

function getAlphabetPreview(record) {
  if (ALPHABET_PREVIEWS[record.cca3]) {
    return {
      script: ALPHABET_PREVIEWS[record.cca3],
      note: `${record.languages?.split(",")[0] || record.name} script preview.`,
    };
  }
  const language = record.languages?.split(",")[0] || "Local language";
  return {
    script: "A B C D E F G H I J K L M N O P",
    note: `${language} writing preview. Some countries use multiple scripts or regional alphabets.`,
  };
}

function getNationalCostumes(record) {
  return (
    NATIONAL_COSTUMES[record.cca3] || [
      [`${record.name} formal wear`, "Traditional ceremonial clothing"],
      [`${record.name} festival dress`, "Regional textile and holiday styles"],
    ]
  );
}

function getEndangeredAnimals(record) {
  return ENDANGERED_ANIMALS[record.cca3] || [`${record.name} rare mammals`, "Endangered birds", "Protected marine species"];
}

function inferCurrency(record) {
  const value = String(record.currency || "").toLowerCase();
  const match = Object.entries(CURRENCY_HINTS).find(([hint]) => value.includes(hint));
  if (match) return match[1];
  return { code: (record.currency || "LOCAL").slice(0, 3).toUpperCase(), rate: Math.max(0.004, ((getStableNumber(record.cca3) % 210) + 20) / 100) };
}

function makeTripCost(record) {
  const seed = getStableNumber(`${record.cca3}-trip`);
  const incomeFactor = THREE.MathUtils.clamp((record.signals.gdpPerCapita || 9000) / 28000, 0.36, 2.2);
  const tourismFactor = record.continent === "Europe" ? 1.18 : record.continent === "Oceania" ? 1.26 : 1;
  const food = Math.round((12 + (seed % 18)) * incomeFactor * tourismFactor);
  const hotel = Math.round((30 + (seed % 65)) * incomeFactor * tourismFactor);
  const transport = Math.round((5 + (seed % 20)) * Math.max(0.55, incomeFactor * 0.72));
  return { food, hotel, transport, total: food + hotel + transport };
}

function makePlanetMissionCards(bodyKey) {
  const missions = SURFACE_MISSIONS[bodyKey] || [];
  if (!missions.length) {
    return `
      <h3>Mission mode</h3>
      <ul>
        <li><strong>Orbital survey</strong> - Use this planet view to inspect atmosphere, rings, and marker zones.</li>
      </ul>
    `;
  }
  return `
    <h3>Surface missions</h3>
    <ul>
      ${missions.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`).join("")}
    </ul>
  `;
}

function getRecordByCca(cca3) {
  return countryRecords.find((record) => record.cca3 === cca3 || record.cca2 === cca3 || record.id === cca3);
}

function makeSimplePdf(title, lines) {
  const safeTitle = pdfEscape(title);
  const contentLines = [
    "BT /F1 26 Tf 50 790 Td (" + safeTitle + ") Tj ET",
    "BT /F1 10 Tf 50 770 Td (Generated by Global Explorer) Tj ET",
    ...lines.slice(0, 26).flatMap((line, index) => wrapPdfLine(line, 86).map((part, lineIndex) => {
      const y = 735 - (index * 24 + lineIndex * 12);
      return `BT /F1 12 Tf 50 ${Math.max(60, y)} Td (${pdfEscape(part)}) Tj ET`;
    })),
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

function wrapPdfLine(value, maxLength) {
  const words = String(value ?? "").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function pdfEscape(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function makeCityFallbackImage(cityRecord, countryRecord) {
  const seed = getStableNumber(`${countryRecord.cca3}-${cityRecord.name}`);
  const hue = seed % 360;
  const hueTwo = (hue + 52) % 360;
  const title = escapeSvg(cityRecord.name);
  const country = escapeSvg(countryRecord.name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
      <defs>
        <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="hsl(${hue} 58% 38%)"/>
          <stop offset="1" stop-color="hsl(${hueTwo} 62% 18%)"/>
        </linearGradient>
      </defs>
      <rect width="480" height="300" fill="url(#sky)"/>
      <circle cx="382" cy="74" r="34" fill="rgba(255,255,255,0.28)"/>
      <path d="M0 222 L58 172 L108 210 L156 138 L216 218 L278 154 L342 216 L412 168 L480 222 L480 300 L0 300 Z" fill="rgba(255,255,255,0.2)"/>
      <path d="M0 238 H54 V196 H96 V226 H136 V182 H178 V238 H218 V204 H262 V238 H310 V188 H354 V238 H402 V214 H480 V300 H0 Z" fill="rgba(7,13,28,0.62)"/>
      <text x="24" y="248" fill="#f7fbff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${title}</text>
      <text x="24" y="276" fill="#d8e5f7" font-family="Arial, sans-serif" font-size="18">${country}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg).replaceAll("'", "%27")}`;
}

function makeFoodFallbackImage(food, countryRecord) {
  const seed = getStableNumber(`${countryRecord.cca3}-${food}`);
  const hue = 20 + (seed % 60);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
      <rect width="480" height="300" fill="hsl(${hue} 55% 24%)"/>
      <circle cx="240" cy="150" r="98" fill="hsl(${hue + 28} 62% 58%)"/>
      <circle cx="240" cy="150" r="70" fill="rgba(255,255,255,0.28)"/>
      <path d="M122 224 C184 188 304 188 360 224" stroke="rgba(255,255,255,0.38)" stroke-width="22" fill="none" stroke-linecap="round"/>
      <text x="32" y="258" fill="#fff7e8" font-family="Arial, sans-serif" font-size="30" font-weight="700">${escapeSvg(food)}</text>
      <text x="32" y="284" fill="#ffe4b1" font-family="Arial, sans-serif" font-size="17">${escapeSvg(countryRecord.name)}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg).replaceAll("'", "%27")}`;
}

function applyCountryTheme(record) {
  const panel = document.querySelector(".country-panel");
  if (!panel) return;
  if (!record) {
    panel.classList.remove("is-themed");
    panel.style.removeProperty("--panel-accent-a");
    panel.style.removeProperty("--panel-accent-b");
    return;
  }
  const colors = COUNTRY_THEME_COLORS[record.cca3] || makeThemeColors(record);
  panel.classList.add("is-themed");
  panel.style.setProperty("--panel-accent-a", colors[0]);
  panel.style.setProperty("--panel-accent-b", colors[1]);
}

function makeThemeColors(record) {
  const hue = getStableNumber(record.cca3 || record.name) % 360;
  return [`hsl(${hue} 72% 56%)`, `hsl(${(hue + 78) % 360} 72% 62%)`];
}

function getStableNumber(value) {
  return Array.from(String(value)).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 100000, 7);
}

function escapeSvg(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, currentY);
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
