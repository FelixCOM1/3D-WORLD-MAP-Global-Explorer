import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const RIVERS_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson";
const EARTHQUAKE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";
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

const HISTORICAL_ERAS = [
  { year: 1492, label: "Age of ocean exploration", color: "rgba(255, 191, 105, 0.36)" },
  { year: 1776, label: "Revolutionary Atlantic era", color: "rgba(88, 211, 223, 0.28)" },
  { year: 1914, label: "Pre-WWI imperial map", color: "rgba(255, 111, 145, 0.25)" },
  { year: 1945, label: "Postwar realignment", color: "rgba(152, 166, 255, 0.28)" },
  { year: 1991, label: "Post-Cold War borders", color: "rgba(157, 247, 109, 0.24)" },
  { year: 2026, label: "Current country borders", color: "rgba(236, 255, 143, 0.16)" },
];

const CELESTIAL_BODIES = {
  earth: {
    name: "Earth",
    kicker: "3D World Map",
    radiusScale: 1,
    atmosphere: 0x6ddcf1,
    markers: [],
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
  downloadCard: document.querySelector("#download-card"),
  bodySelect: document.querySelector("#body-select"),
  yearSlider: document.querySelector("#year-slider"),
  yearLabel: document.querySelector("#year-label"),
  miniMap: document.querySelector("#mini-map"),
  miniMapLabel: document.querySelector("#mini-map-label"),
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
let seaRoutesGroup;
let earthquakeGroup;
let volcanoGroup;
let portGroup;
let airportGroup;
let plateGroup;
let zoomGridGroup;
let gdpRingGroup;
let coastGlowGroup;
let scanGroup;
let celestialMarkersGroup;
let flightArcAnimations = [];
let scanStarted = 0;
let animationTarget = null;
let lastPointerEvent = null;
let isNightMode = false;
let isSatelliteMode = false;
let currentBodyKey = "earth";
let historicalYear = 2026;
let weatherRequestId = 0;
let newsRequestId = 0;
let clockTimer = null;
let favoriteKeys = loadFavorites();

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
  drawMiniMap();
  loadEarthquakes();
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
  zoomGridGroup = new THREE.Group();
  globeGroup.add(zoomGridGroup);
  gdpRingGroup = new THREE.Group();
  globeGroup.add(gdpRingGroup);
  coastGlowGroup = new THREE.Group();
  globeGroup.add(coastGlowGroup);
  scanGroup = new THREE.Group();
  globeGroup.add(scanGroup);
  celestialMarkersGroup = new THREE.Group();
  globeGroup.add(celestialMarkersGroup);
  markersGroup = new THREE.Group();
  globeGroup.add(markersGroup);
  buildMountainLabels();
  buildFlightArcs();
  buildStaticDataLayers();
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
  ui.satelliteView.addEventListener("click", toggleSatelliteView);
  ui.cinemaMode.addEventListener("click", toggleCinemaMode);
  ui.downloadCard.addEventListener("click", downloadInfoCard);
  ui.bodySelect.addEventListener("change", () => switchBody(ui.bodySelect.value));
  ui.yearSlider.addEventListener("input", () => {
    historicalYear = Number(ui.yearSlider.value);
    ui.yearLabel.textContent = String(historicalYear);
    drawEarthTexture();
  });
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
  drawOceanCurrents(ctx);
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

  if (isNightMode) {
    drawNightOverlay(ctx);
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
    moon: ["#6d737c", "#b6bdc4", "#3c4148"],
    venus: ["#8b6330", "#e5b56a", "#4c351c"],
    mars: ["#6c2c1f", "#c06834", "#351812"],
    jupiter: ["#8b5d3d", "#f0c28b", "#58351f"],
    saturn: ["#806143", "#e8c58d", "#5b422a"],
  }[key] || ["#075ea9", "#1288c4", "#03547d"];
  const gradient = ctx.createLinearGradient(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  gradient.addColorStop(0, base[0]);
  gradient.addColorStop(0.5, base[1]);
  gradient.addColorStop(1, base[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  if (key === "jupiter" || key === "saturn") {
    for (let y = 80; y < TEXTURE_HEIGHT; y += 120) {
      ctx.fillStyle = y % 240 === 80 ? "rgba(255, 235, 186, 0.24)" : "rgba(87, 43, 22, 0.25)";
      ctx.fillRect(0, y, TEXTURE_WIDTH, 58 + Math.sin(y) * 18);
    }
    if (key === "jupiter") {
      const spot = textureContext.projection([-55, -22]);
      ctx.fillStyle = "rgba(178, 58, 42, 0.78)";
      ctx.beginPath();
      ctx.ellipse(spot[0], spot[1], 170, 72, -0.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "rgba(255, 236, 190, 0.82)";
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.ellipse(TEXTURE_WIDTH / 2, TEXTURE_HEIGHT / 2, 900, 120, -0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 170; i += 1) {
      const x = Math.random() * TEXTURE_WIDTH;
      const y = Math.random() * TEXTURE_HEIGHT;
      const r = 7 + Math.random() * (key === "moon" ? 42 : 24);
      ctx.fillStyle = key === "moon" ? "rgba(30, 34, 40, 0.22)" : "rgba(52, 22, 12, 0.22)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "900 52px Segoe UI, Arial, sans-serif";
  ctx.fillText(body.name, 90, 110);
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
  return { gdp, gdpPerCapita, inflation, exportPower, internet, speed, mobile, density };
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
    <h3>Interesting cities</h3>
    <ul>
      ${record.cities
        .map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`)
        .join("")}
    </ul>
  `;
  renderWeather(record);
  renderCapitalTime(record);
  renderMetrics(record);
  renderNews(record);
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
  fetchJsonWithTimeout(url)
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
    </div>
  `;
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
  if (currentBodyKey !== "earth") return;
  selectedRecord = record;
  hoverRecord = record;
  setStatus(`${record.name} selected`);
  renderPanel(record);
  renderCountryList(ui.search.value);
  drawEarthTexture();
  updateCityMarkers(record);
  updateCountryAnalysisLayers(record);

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
  flagPinsGroup.clear();
  if (currentBodyKey === "earth") {
    renderPanel(null);
    renderCountryList(ui.search.value);
    setStatus("Globe ready");
  } else {
    renderBodyPanel();
  }
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
  const body = CELESTIAL_BODIES[currentBodyKey];
  selectedRecord = null;
  hoverRecord = null;
  updateCityMarkers(null);
  updateCountryAnalysisLayers(null);
  celestialMarkersGroup.clear();
  isSatelliteMode = false;
  ui.satelliteView.classList.remove("is-active");
  ui.shell.classList.toggle("is-celestial", currentBodyKey !== "earth");
  atmosphereMesh.material.color.setHex(body.atmosphere || 0x6ddcf1);
  earthMesh.scale.setScalar(body.radiusScale || 1);
  controls.minDistance = currentBodyKey === "earth" ? 2.4 : 2.25;
  controls.maxDistance = currentBodyKey === "earth" ? 8.2 : 7.4;

  if (currentBodyKey === "earth") {
    cloudMesh.visible = true;
    terminatorLine.visible = true;
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
  }

  drawEarthTexture();
  drawMiniMap();
}

function renderBodyPanel() {
  const body = CELESTIAL_BODIES[currentBodyKey];
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
  ui.details.innerHTML = `
    <p>${escapeHtml(body.summary || "Explore this world with orbit controls and surface markers.")}</p>
    <h3>Marked regions</h3>
    <ul>
      ${body.markers.map((item) => `<li><strong>${escapeHtml(item.name)}</strong> - ${escapeHtml(item.note)}</li>`).join("")}
    </ul>
  `;
  ui.list.replaceChildren();
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
  animateScanLine(now);
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

function buildStaticDataLayers() {
  buildLineLayer(seaRoutesGroup, SEA_ROUTES, 0x86dfff, 0.48, 1.035);
  buildLineLayer(plateGroup, TECTONIC_PLATES, 0xff6f91, 0.72, 1.045);
  addPointGroup(volcanoGroup, VOLCANO_POINTS, 0xff7a38, 0.026, 1.05);
  addPointGroup(portGroup, PORT_POINTS, 0x58d3df, 0.022, 1.055);
  addPointGroup(airportGroup, AIRPORT_POINTS, 0x98a6ff, 0.02, 1.06);
  buildZoomGrid();
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

function loadEarthquakes() {
  fetchJsonWithTimeout(EARTHQUAKE_URL, 9000)
    .then((data) => {
      const quakes = (data.features || [])
        .slice(0, 80)
        .map((feature) => {
          const [lon, lat, depth] = feature.geometry?.coordinates || [];
          return point(
            `M${(feature.properties?.mag || 0).toFixed(1)}`,
            lat,
            lon,
            feature.properties?.place || `Depth ${Math.round(depth || 0)} km`,
          );
        })
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));
      addPointGroup(earthquakeGroup, quakes, 0xff6f91, 0.017, 1.07, false);
      updateLayerVisibility();
    })
    .catch(() => {
      addPointGroup(
        earthquakeGroup,
        [
          point("M5.1", 38.3, 142.4, "Japan trench sample"),
          point("M4.9", -20.5, -70.2, "Chile trench sample"),
          point("M5.4", -6.1, 154.8, "Solomon arc sample"),
        ],
        0xff6f91,
        0.017,
        1.07,
        false,
      );
      updateLayerVisibility();
    });
}

function buildCelestialMarkers(body) {
  celestialMarkersGroup.clear();
  addPointGroup(celestialMarkersGroup, body.markers || [], 0xecff8f, 0.026, 1.08);
}

function animateFlightArcs(now) {
  flightArcAnimations.forEach((item) => {
    const t = (now * 0.00009 + item.offset) % 1;
    item.marker.position.copy(item.curve.getPointAt(t));
  });
}

function updateLayerVisibility() {
  const earthActive = currentBodyKey === "earth";
  if (flightArcsGroup) flightArcsGroup.visible = earthActive && layerState.flights;
  if (seaRoutesGroup) seaRoutesGroup.visible = earthActive && layerState.seaRoutes;
  if (earthquakeGroup) earthquakeGroup.visible = earthActive && layerState.quakes;
  if (volcanoGroup) volcanoGroup.visible = earthActive && layerState.volcanoes;
  if (portGroup) portGroup.visible = earthActive && layerState.ports;
  if (airportGroup) airportGroup.visible = earthActive && layerState.airports;
  if (plateGroup) plateGroup.visible = earthActive && layerState.plates;
  if (zoomGridGroup) zoomGridGroup.visible = earthActive && layerState.measureGrid && camera.position.distanceTo(getGlobeCenter()) < 4.2;
  if (gdpRingGroup) gdpRingGroup.visible = earthActive;
  if (coastGlowGroup) coastGlowGroup.visible = earthActive;
  if (scanGroup) scanGroup.visible = earthActive;
  if (celestialMarkersGroup) celestialMarkersGroup.visible = !earthActive;
  if (markersGroup) markersGroup.visible = earthActive;
  if (flagPinsGroup) flagPinsGroup.visible = earthActive;
  if (capitalMarkersGroup) capitalMarkersGroup.visible = earthActive;
}

function updateCountryAnalysisLayers(record) {
  gdpRingGroup.clear();
  coastGlowGroup.clear();
  scanGroup.clear();
  if (!record) return;

  const centroid = window.d3.geoCentroid(record.feature);
  const lon = Number.isFinite(centroid[0]) ? centroid[0] : 0;
  const lat = Number.isFinite(centroid[1]) ? centroid[1] : 0;
  const center = latLonToVector3(lat, lon, RADIUS * 1.16);
  const normal = center.clone().sub(globeGroup.position).normalize();

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

function getCityPhotoUrl(cityRecord, countryRecord) {
  const tags = `${cityRecord.name},${countryRecord.name},city,landmark`
    .replace(/[^\w\s,-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `https://loremflickr.com/480/300/${encodeURIComponent(tags)}/all?lock=${getStableNumber(
    `${cityRecord.name}-${countryRecord.cca3}`,
  )}`;
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
