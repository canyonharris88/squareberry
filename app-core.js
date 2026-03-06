/* ===== SquareBerry App — Main JavaScript ===== */

// ==================== SECURITY UTILITIES ====================

/**
 * Escape HTML to prevent XSS in template literals
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return s.replace(/[&<>"']/g, c => map[c]);
}

/**
 * Sanitize user input — strip tags and limit length
 */
function sanitizeInput(str, maxLen = 500) {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}


// ==================== DATA ====================

const PARCELS = [
  {
    id: 1,
    address: "10250 Silver Lake Rd, Green Oak Twp",
    apn: "4711-12-200-035",
    acreage: 40,
    owner: "Robert & Linda Thompson",
    ownerAddress: "10250 Silver Lake Rd, Brighton, MI 48116",
    landValue: 320000,
    improvementValue: 0,
    totalValue: 320000,
    askingPrice: 380000,
    lastSaleDate: "08/15/2019",
    lastSalePrice: 285000,
    zoning: "R-1",
    zoningFull: "R-1 Single Family Residential",
    township: "Green Oak",
    county: "Livingston",
    schoolDistrict: "Brighton Area Schools",
    minLotSize: "1.5 acres",
    minFrontage: "200 ft",
    maxHeight: "35 ft",
    frontSetback: "50 ft",
    sideSetback: "20 ft",
    rearSetback: "50 ft",
    maxCoverage: "25%",
    permittedUses: ["Single-family dwellings", "Home occupations", "Agricultural uses", "Parks & recreation"],
    conditionalUses: ["Churches", "Schools", "Public utility buildings", "Bed & breakfast"],
    suitableForDev: true,
    lotYield: 12,
    avgConstructionCost: 35000,
    avgFinishedLotPrice: 95000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "None detected",
    wetlandsAcres: 0,
    topography: "Generally flat with gentle roll",
    soilType: "Spinks-Boyer sandy loam",
    coords: [-83.755, 42.510],
    polygon: [[-83.762, 42.514], [-83.748, 42.514], [-83.748, 42.506], [-83.762, 42.506], [-83.762, 42.514]],
    pipeline: "researching",
    pipelineDays: 12,
    estimatedBuildCost: 385000,
    estimatedHomeValue: 575000,
    comparableHomeSales: [540000, 585000, 610000]
  },
  {
    id: 2,
    address: "3890 Crooked Lake Rd, Genoa Twp",
    apn: "4711-08-300-018",
    acreage: 20,
    owner: "Genoa Land Holdings LLC",
    ownerAddress: "PO Box 445, Howell, MI 48844",
    landValue: 180000,
    improvementValue: 0,
    totalValue: 180000,
    askingPrice: 220000,
    lastSaleDate: "03/22/2021",
    lastSalePrice: 210000,
    zoning: "R-2",
    zoningFull: "R-2 Two-Family Residential",
    township: "Genoa",
    county: "Livingston",
    schoolDistrict: "Howell Public Schools",
    minLotSize: "0.75 acres",
    minFrontage: "150 ft",
    maxHeight: "35 ft",
    frontSetback: "40 ft",
    sideSetback: "15 ft",
    rearSetback: "40 ft",
    maxCoverage: "30%",
    permittedUses: ["Single-family dwellings", "Two-family dwellings", "Home occupations", "Parks"],
    conditionalUses: ["Multi-family (up to 4 units)", "Day care centers", "Community buildings"],
    suitableForDev: true,
    lotYield: 16,
    avgConstructionCost: 32000,
    avgFinishedLotPrice: 82000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "Wetlands present",
    wetlandsAcres: 2.3,
    topography: "Moderate slope (5-8%)",
    soilType: "Miami-Conover loam",
    coords: [-83.720, 42.555],
    polygon: [[-83.727, 42.559], [-83.713, 42.559], [-83.713, 42.551], [-83.727, 42.551], [-83.727, 42.559]],
    pipeline: "lead",
    pipelineDays: 3,
    estimatedBuildCost: 340000,
    estimatedHomeValue: 485000,
    comparableHomeSales: [465000, 490000, 510000]
  },
  {
    id: 3,
    address: "7650 Hamburg Rd, Hamburg Twp",
    apn: "4711-15-100-022",
    acreage: 15,
    owner: "Patricia Nowak Trust",
    ownerAddress: "7650 Hamburg Rd, Hamburg, MI 48139",
    landValue: 145000,
    improvementValue: 45000,
    totalValue: 190000,
    askingPrice: 225000,
    lastSaleDate: "11/05/2017",
    lastSalePrice: 160000,
    zoning: "R-1",
    zoningFull: "R-1 Single Family Residential",
    township: "Hamburg",
    county: "Livingston",
    schoolDistrict: "Pinckney Community Schools",
    minLotSize: "1.0 acres",
    minFrontage: "165 ft",
    maxHeight: "35 ft",
    frontSetback: "45 ft",
    sideSetback: "15 ft",
    rearSetback: "45 ft",
    maxCoverage: "25%",
    permittedUses: ["Single-family dwellings", "Home occupations", "Agricultural uses"],
    conditionalUses: ["Churches", "Public buildings", "Private clubs"],
    suitableForDev: true,
    lotYield: 8,
    avgConstructionCost: 42000,
    avgFinishedLotPrice: 78000,
    floodZone: "Zone AE",
    floodRisk: "High Risk",
    wetlands: "Wetlands present",
    wetlandsAcres: 1.8,
    topography: "Moderate slope near creek (8-12%)",
    soilType: "Blount-Pewamo clay loam",
    coords: [-83.810, 42.450],
    polygon: [[-83.816, 42.454], [-83.804, 42.454], [-83.804, 42.446], [-83.816, 42.446], [-83.816, 42.454]],
    pipeline: null,
    pipelineDays: 0,
    estimatedBuildCost: 410000,
    estimatedHomeValue: 520000,
    comparableHomeSales: [495000, 530000, 545000]
  },
  {
    id: 4,
    address: "2100 Coon Lake Rd, Marion Twp",
    apn: "4711-20-400-009",
    acreage: 60,
    owner: "Livingston Farms Inc",
    ownerAddress: "2100 Coon Lake Rd, Howell, MI 48843",
    landValue: 420000,
    improvementValue: 85000,
    totalValue: 505000,
    askingPrice: 695000,
    lastSaleDate: "06/10/2016",
    lastSalePrice: 380000,
    zoning: "AG",
    zoningFull: "AG Agricultural",
    township: "Marion",
    county: "Livingston",
    schoolDistrict: "Howell Public Schools",
    minLotSize: "5.0 acres",
    minFrontage: "330 ft",
    maxHeight: "35 ft",
    frontSetback: "60 ft",
    sideSetback: "25 ft",
    rearSetback: "50 ft",
    maxCoverage: "15%",
    permittedUses: ["Agricultural operations", "Single-family dwellings", "Farm stands"],
    conditionalUses: ["PUD development", "Agri-tourism", "Mining & extraction"],
    suitableForDev: false,
    lotYield: 6,
    avgConstructionCost: 55000,
    avgFinishedLotPrice: 95000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "None detected",
    wetlandsAcres: 0,
    topography: "Generally flat",
    soilType: "Capac-Brookston loam",
    coords: [-83.885, 42.578],
    polygon: [[-83.898, 42.586], [-83.872, 42.586], [-83.872, 42.570], [-83.898, 42.570], [-83.898, 42.586]],
    pipeline: "due-diligence",
    pipelineDays: 28,
    estimatedBuildCost: 450000,
    estimatedHomeValue: 620000,
    comparableHomeSales: [590000, 635000, 660000]
  },
  {
    id: 5,
    address: "3200 Resort Pike Rd, near Petoskey",
    apn: "0115-028-001-00",
    acreage: 80,
    owner: "Northern Michigan Land Co",
    ownerAddress: "411 E Mitchell St, Petoskey, MI 49770",
    landValue: 640000,
    improvementValue: 0,
    totalValue: 640000,
    askingPrice: 880000,
    lastSaleDate: "09/28/2020",
    lastSalePrice: 550000,
    zoning: "R-1",
    zoningFull: "R-1 Single Family Residential",
    township: "Resort",
    county: "Emmet",
    schoolDistrict: "Petoskey Public Schools",
    minLotSize: "2.0 acres",
    minFrontage: "200 ft",
    maxHeight: "35 ft",
    frontSetback: "50 ft",
    sideSetback: "20 ft",
    rearSetback: "50 ft",
    maxCoverage: "20%",
    permittedUses: ["Single-family dwellings", "Home occupations", "Agricultural uses"],
    conditionalUses: ["Vacation rentals", "Golf courses", "Public utilities"],
    suitableForDev: true,
    lotYield: 20,
    avgConstructionCost: 52000,
    avgFinishedLotPrice: 110000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "Wetlands present",
    wetlandsAcres: 5.2,
    topography: "Rolling terrain with scenic views",
    soilType: "Emmet-Leelanau sandy loam",
    coords: [-84.945, 45.385],
    polygon: [[-84.960, 45.395], [-84.930, 45.395], [-84.930, 45.375], [-84.960, 45.375], [-84.960, 45.395]],
    pipeline: null,
    pipelineDays: 0,
    estimatedBuildCost: 520000,
    estimatedHomeValue: 780000,
    comparableHomeSales: [735000, 790000, 825000]
  },
  {
    id: 6,
    address: "8800 Supply Rd, near Traverse City",
    apn: "2801-014-030-00",
    acreage: 35,
    owner: "Grand Traverse Holdings LLC",
    ownerAddress: "225 E Front St, Traverse City, MI 49684",
    landValue: 280000,
    improvementValue: 0,
    totalValue: 280000,
    askingPrice: 395000,
    lastSaleDate: "01/14/2022",
    lastSalePrice: 340000,
    zoning: "PUD",
    zoningFull: "PUD Planned Unit Development",
    township: "Garfield",
    county: "Grand Traverse",
    schoolDistrict: "Traverse City Area Public Schools",
    minLotSize: "Per plan approval",
    minFrontage: "Per plan approval",
    maxHeight: "40 ft",
    frontSetback: "30 ft",
    sideSetback: "10 ft",
    rearSetback: "30 ft",
    maxCoverage: "40%",
    permittedUses: ["Mixed residential (per plan)", "Common open space", "Community facilities"],
    conditionalUses: ["Commercial (per plan)", "Multi-family", "Assisted living"],
    suitableForDev: true,
    lotYield: 28,
    avgConstructionCost: 48000,
    avgFinishedLotPrice: 92000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "None detected",
    wetlandsAcres: 0,
    topography: "Gentle slope (2-5%)",
    soilType: "Kalkaska-Rubicon sand",
    coords: [-85.595, 44.765],
    polygon: [[-85.605, 44.772], [-85.585, 44.772], [-85.585, 44.758], [-85.605, 44.758], [-85.605, 44.772]],
    pipeline: null,
    pipelineDays: 0,
    estimatedBuildCost: 390000,
    estimatedHomeValue: 560000,
    comparableHomeSales: [530000, 570000, 595000]
  },
  {
    id: 7,
    address: "5500 Hartland Rd, Hartland Twp",
    apn: "4711-05-200-041",
    acreage: 25,
    owner: "James & Diane Kowalski",
    ownerAddress: "5500 Hartland Rd, Hartland, MI 48353",
    landValue: 215000,
    improvementValue: 55000,
    totalValue: 270000,
    askingPrice: 280000,
    lastSaleDate: "04/03/2018",
    lastSalePrice: 230000,
    zoning: "R-2",
    zoningFull: "R-2 Two-Family Residential",
    township: "Hartland",
    county: "Livingston",
    schoolDistrict: "Hartland Consolidated Schools",
    minLotSize: "0.75 acres",
    minFrontage: "150 ft",
    maxHeight: "35 ft",
    frontSetback: "40 ft",
    sideSetback: "15 ft",
    rearSetback: "40 ft",
    maxCoverage: "30%",
    permittedUses: ["Single-family dwellings", "Two-family dwellings", "Home occupations"],
    conditionalUses: ["Multi-family (up to 4)", "Child care facilities", "Religious institutions"],
    suitableForDev: true,
    lotYield: 18,
    avgConstructionCost: 32000,
    avgFinishedLotPrice: 88000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "None detected",
    wetlandsAcres: 0,
    topography: "Generally flat",
    soilType: "Boyer-Oshtemo sandy loam",
    coords: [-83.754, 42.635],
    polygon: [[-83.762, 42.640], [-83.746, 42.640], [-83.746, 42.630], [-83.762, 42.630], [-83.762, 42.640]],
    pipeline: "under-contract",
    pipelineDays: 7,
    estimatedBuildCost: 350000,
    estimatedHomeValue: 495000,
    comparableHomeSales: [475000, 500000, 520000]
  },
  {
    id: 8,
    address: "1200 Kensington Rd, Brighton Twp",
    apn: "4711-03-100-055",
    acreage: 10,
    owner: "Brighton Development Group",
    ownerAddress: "301 W Main St, Brighton, MI 48116",
    landValue: 160000,
    improvementValue: 0,
    totalValue: 160000,
    askingPrice: 145000,
    lastSaleDate: "07/20/2023",
    lastSalePrice: 175000,
    zoning: "R-1",
    zoningFull: "R-1 Single Family Residential",
    township: "Brighton",
    county: "Livingston",
    schoolDistrict: "Brighton Area Schools",
    minLotSize: "1.0 acres",
    minFrontage: "165 ft",
    maxHeight: "35 ft",
    frontSetback: "45 ft",
    sideSetback: "15 ft",
    rearSetback: "45 ft",
    maxCoverage: "25%",
    permittedUses: ["Single-family dwellings", "Home occupations", "Parks"],
    conditionalUses: ["Churches", "Public utilities", "Schools"],
    suitableForDev: true,
    lotYield: 6,
    avgConstructionCost: 35000,
    avgFinishedLotPrice: 82000,
    floodZone: "Zone X",
    floodRisk: "Minimal Risk",
    wetlands: "None detected",
    wetlandsAcres: 0,
    topography: "Generally flat",
    soilType: "Fox sandy loam",
    coords: [-83.782, 42.537],
    polygon: [[-83.788, 42.541], [-83.776, 42.541], [-83.776, 42.533], [-83.788, 42.533], [-83.788, 42.541]],
    pipeline: null,
    pipelineDays: 0,
    estimatedBuildCost: 365000,
    estimatedHomeValue: 510000,
    comparableHomeSales: [485000, 515000, 535000]
  }
];

const PIPELINE_STAGES = [
  { id: "new_lead", label: "New Lead" },
  { id: "lead", label: "Lead" },
  { id: "researching", label: "Researching" },
  { id: "under-contract", label: "Under Contract" },
  { id: "due-diligence", label: "Due Diligence" },
  { id: "closed", label: "Closed" }
];

// ==================== PIPELINE API ====================

const API_BASE = '';
let apiLeads = [];
let archivedLeads = []; // Archived leads (both API and sample)
let archivedParcels = []; // Archived parcel IDs
let showArchived = false;

async function fetchApiLeads() {
  try {
    const res = await fetch(`${API_BASE}/api/leads`);
    if (res.ok) {
      apiLeads = await res.json();
    }
  } catch (e) {
    console.log('Pipeline API not available, using sample data');
    apiLeads = [];
  }
}

async function updateLeadStageApi(leadId, newStage) {
  try {
    await fetch(`${API_BASE}/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
  } catch (e) {
    console.log('Could not update lead stage via API');
  }
}

async function updateLeadApi(leadId, updates) {
  try {
    const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.log('Could not update lead via API');
  }
  return null;
}

let apiAlerts = [];

async function fetchApiAlerts() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts`);
    if (res.ok) {
      apiAlerts = await res.json();
    }
  } catch (e) {
    console.log('Alerts API not available');
    apiAlerts = [];
  }
}

let apiReports = [];

async function fetchApiReports() {
  try {
    const res = await fetch(`${API_BASE}/api/reports`);
    if (res.ok) {
      apiReports = await res.json();
    }
  } catch (e) {
    console.log('Reports API not available');
    apiReports = [];
  }
}


// ==================== STATE ====================

let map = null;
let currentTheme = 'light';
let selectedParcelId = null;
let currentTab = 'overview';
let sidebarCollapsed = false;
let currentView = 'map';
let searchResults = [];
let showNewAlertForm = false;

// Pipeline filter/search/sort/bulk state
let pipelineSearch = '';
let pipelineCountyFilter = '';
let pipelineSort = 'created_at';
let pipelineSortOrder = 'desc';
let pipelineBulkSelected = new Set();
let pipelineBulkMode = false;

// Feasibility state
let feasibilityState = {
  margin: 25,
  lotYield: 12,
  constructionCost: 45000,
  finishedLotPrice: 85000,
  mode: 'subdivision'
};

// Lead detail modal state
let openLeadDetailId = null;
let openLeadDetailType = null; // 'api' or 'parcel'

// Default settings (used as fallback before API load)
const DEFAULT_SETTINGS = {
  targetAreas: 'Livingston County, Washtenaw County',
  minAcreage: 5,
  maxAcreage: 100,
  minPrice: 0,
  maxPrice: 1000000,
  zoningTypes: ['R-1', 'R-2', 'PUD', 'AG'],
  defaultMargin: 25,
  contingencyPct: 12,
  holdingCostRate: 7,
  holdingPeriodMonths: 18,
  dailyLeadsCount: 5,
  deliveryTime: '05:00',
  emailAddress: 'canyonharris@gmail.com',
  notificationFrequency: 'hourly',
  emailAlertsOn: true,
  dailyBriefingOn: true,
  fullName: 'Canyon Harris',
  company: 'Mitch Harris Building Company',
  role: 'Developer'
};

let appSettings = { ...DEFAULT_SETTINGS };

async function loadSettingsFromApi() {
  try {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (res.ok) {
      const saved = await res.json();
      // Merge saved settings over defaults (API may have partial keys)
      appSettings = { ...DEFAULT_SETTINGS, ...saved };
    }
  } catch (e) {
    console.log('Settings API not available, using defaults');
  }
}

async function saveSettingsToApi(settingsObj) {
  try {
    await fetch(`${API_BASE}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settingsObj })
    });
  } catch (e) {
    console.log('Could not save settings to API');
  }
}


// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initRouter();
  initSidebar();

  // Wait for Mapbox token from server config before initializing map
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    window.MAPBOX_TOKEN = cfg.mapbox_token || '';
  } catch (e) {
    window.MAPBOX_TOKEN = window.MAPBOX_TOKEN || '';
  }

  initMap();
  initLayerToggles();
  initSearch();
  // Fetch all data from API in parallel
  await Promise.all([
    fetchApiLeads(),
    fetchApiAlerts(),
    fetchApiReports(),
    loadSettingsFromApi()
  ]);
  renderPipeline();
  renderAlerts();
  renderReports();
  renderSettings();
  renderMapStats();
  lucide.createIcons();
});


// ==================== THEME ====================

function initTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const forceTheme = urlParams.get('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  currentTheme = forceTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    updateMapStyle();
  });
}

function updateThemeIcon() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  btn.innerHTML = currentTheme === 'dark'
    ? '<i data-lucide="sun" width="18" height="18"></i>'
    : '<i data-lucide="moon" width="18" height="18"></i>';
  lucide.createIcons({ nodes: [btn] });
}


// ==================== ROUTER ====================

function initRouter() {
  const hash = window.location.hash.slice(1) || 'map';
  switchView(hash);

  window.addEventListener('hashchange', () => {
    const h = window.location.hash.slice(1) || 'map';
    switchView(h);
  });
}

function switchView(view) {
  currentView = view;

  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  document.querySelectorAll('.view-content').forEach(el => {
    el.classList.toggle('active', el.id === `view-${view}`);
  });

  const lt = document.getElementById('layerToggles');
  if (lt) lt.style.display = view === 'map' ? 'flex' : 'none';

  const stats = document.getElementById('mapStats');
  if (stats) stats.style.display = view === 'map' ? 'flex' : 'none';

  if (view === 'map' && map) {
    setTimeout(() => map.resize(), 50);
  }
}


// ==================== SIDEBAR ====================

function initSidebar() {
  const btn = document.getElementById('sidebarCollapseBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      sidebarCollapsed = !sidebarCollapsed;
      document.querySelector('.app-shell').classList.toggle('sidebar-collapsed', sidebarCollapsed);
      if (map) setTimeout(() => map.resize(), 350);
      const icon = btn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', sidebarCollapsed ? 'panel-right-close' : 'panel-left-close');
        lucide.createIcons({ nodes: [btn] });
      }
    });
  }
}


// ==================== SEARCH ====================

function initSearch() {
  const input = document.getElementById('searchInput');
  const container = document.getElementById('searchResults');
  if (!input || !container) return;

  input.addEventListener('input', (e) => {
    const query = sanitizeInput(e.target.value.toLowerCase(), 200);
    if (query.length < 2) {
      container.classList.remove('visible');
      return;
    }

    searchResults = PARCELS.filter(p =>
      p.address.toLowerCase().includes(query) ||
      p.apn.toLowerCase().includes(query) ||
      p.owner.toLowerCase().includes(query) ||
      p.county.toLowerCase().includes(query) ||
      p.township.toLowerCase().includes(query)
    );

    if (searchResults.length > 0) {
      container.innerHTML = searchResults.map(p => `
        <button class="search-result-item" onclick="selectParcelFromSearch(${parseInt(p.id)})">
          <div class="search-result-address">${highlightMatch(escapeHtml(p.address), query)}</div>
          <div class="search-result-meta">${escapeHtml(String(p.acreage))} acres · ${escapeHtml(p.county)} County · ${escapeHtml(p.zoning)}</div>
        </button>
      `).join('');
      container.classList.add('visible');
    } else {
      container.innerHTML = '<div class="search-result-empty">No parcels found</div>';
      container.classList.add('visible');
    }
  });

  input.addEventListener('focus', () => {
    if (input.value.length >= 2) container.classList.add('visible');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar') && !e.target.closest('.search-results')) {
      container.classList.remove('visible');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      container.classList.remove('visible');
      input.blur();
    }
  });

  // Global `/` keyboard shortcut to focus search (capture phase to beat canvas/mapbox)
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      e.stopPropagation();
      input.focus();
    }
  }, true);
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
}

function selectParcelFromSearch(id) {
  const input = document.getElementById('searchInput');
  const container = document.getElementById('searchResults');
  if (input) input.value = '';
  if (container) container.classList.remove('visible');

  if (currentView !== 'map') {
    window.location.hash = '#map';
  }

  selectParcel(id);
}


// ==================== MAP ====================

function initMap() {
  mapboxgl.accessToken = window.MAPBOX_TOKEN || '';

  const container = document.getElementById('map');
  container.innerHTML = '<div class="map-loading"><div class="map-loading-text">Loading map...</div><div class="map-loading-spinner"></div></div>';

  try {
    map = new mapboxgl.Map({
      container: 'map',
      style: `mapbox://styles/mapbox/${currentTheme === 'dark' ? 'dark-v11' : 'light-v11'}`,
      center: [-84.0, 42.7],
      zoom: 7.5,
      attributionControl: true,
      failIfMajorPerformanceCaveat: false
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      addParcelLayer();
      lucide.createIcons();
    });

    map.on('error', (e) => {
      console.warn('Map error:', e);
    });
  } catch(e) {
    container.innerHTML = '<div class="map-loading"><div class="map-loading-text">Map could not be loaded. Check your connection.</div></div>';
  }
}

function updateMapStyle() {
  if (!map) return;
  const satActive = document.querySelector('.layer-toggle[data-layer="satellite"]')?.classList.contains('active');
  let style = satActive
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : `mapbox://styles/mapbox/${currentTheme === 'dark' ? 'dark-v11' : 'light-v11'}`;

  map.setStyle(style);
  map.once('style.load', () => addParcelLayer());
}

function addParcelLayer() {
  const geojson = {
    type: 'FeatureCollection',
    features: PARCELS.map(p => ({
      type: 'Feature',
      properties: { id: p.id, address: p.address, acreage: p.acreage, zoning: p.zoning, askingPrice: p.askingPrice, pipeline: p.pipeline || '' },
      geometry: {
        type: 'Polygon',
        coordinates: [p.polygon]
      }
    }))
  };

  // Clean up existing layers
  ['parcel-fill', 'parcel-border', 'parcel-border-hover', 'parcel-border-selected', 'parcel-points', 'parcel-cluster-circles', 'parcel-cluster-count'].forEach(l => {
    if (map.getLayer(l)) map.removeLayer(l);
  });
  if (map.getSource('parcels')) map.removeSource('parcels');
  if (map.getSource('parcel-points')) map.removeSource('parcel-points');

  map.addSource('parcels', { type: 'geojson', data: geojson, generateId: true, promoteId: 'id' });

  // Point source for clustering
  const pointGeojson = {
    type: 'FeatureCollection',
    features: PARCELS.map(p => ({
      type: 'Feature',
      properties: { id: p.id, address: p.address, acreage: p.acreage },
      geometry: { type: 'Point', coordinates: p.coords }
    }))
  };
  map.addSource('parcel-points', {
    type: 'geojson',
    data: pointGeojson,
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 50
  });

  // Cluster circles
  map.addLayer({
    id: 'parcel-cluster-circles',
    type: 'circle',
    source: 'parcel-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': currentTheme === 'dark' ? '#D64848' : '#C03030',
      'circle-radius': ['step', ['get', 'point_count'], 18, 4, 24, 8, 30],
      'circle-opacity': 0.85,
      'circle-stroke-width': 2,
      'circle-stroke-color': currentTheme === 'dark' ? '#1E1E1E' : '#FFFFFF'
    }
  });

  // Cluster count text
  map.addLayer({
    id: 'parcel-cluster-count',
    type: 'symbol',
    source: 'parcel-points',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 13
    },
    paint: {
      'text-color': '#FFFFFF'
    }
  });

  // Parcel fill — improved with semi-transparent fill based on pipeline status
  map.addLayer({
    id: 'parcel-fill',
    type: 'fill',
    source: 'parcels',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'id'], selectedParcelId || -1],
        currentTheme === 'dark' ? 'rgba(214,72,72,0.2)' : 'rgba(192,48,48,0.12)',
        ['!=', ['get', 'pipeline'], ''],
        currentTheme === 'dark' ? 'rgba(77,168,99,0.1)' : 'rgba(43,94,58,0.08)',
        currentTheme === 'dark' ? 'rgba(214,72,72,0.06)' : 'rgba(192,48,48,0.05)'
      ],
      'fill-opacity': 1
    }
  });

  // Parcel border — improved with thicker strokes
  map.addLayer({
    id: 'parcel-border',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': [
        'case',
        ['!=', ['get', 'pipeline'], ''],
        currentTheme === 'dark' ? '#4DA863' : '#2B5E3A',
        currentTheme === 'dark' ? '#D64848' : '#C03030'
      ],
      'line-width': 2,
      'line-opacity': 0.7
    }
  });

  map.addLayer({
    id: 'parcel-border-hover',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': currentTheme === 'dark' ? '#E0B84D' : '#D4A843',
      'line-width': 3,
      'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0]
    }
  });

  map.addLayer({
    id: 'parcel-border-selected',
    type: 'line',
    source: 'parcels',
    paint: {
      'line-color': currentTheme === 'dark' ? '#D64848' : '#C03030',
      'line-width': 3.5,
      'line-opacity': ['case', ['==', ['get', 'id'], selectedParcelId || -1], 1, 0]
    }
  });

  // Improved tooltip
  const tooltip = createTooltip();
  let hoveredId = null;

  map.on('mousemove', 'parcel-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    if (e.features.length > 0) {
      if (hoveredId !== null) map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: false });
      const feat = e.features[0];
      hoveredId = feat.id;
      map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: true });

      const props = feat.properties;
      const parcel = PARCELS.find(p => p.id === props.id);
      const pipelineLabel = parcel && parcel.pipeline ? PIPELINE_STAGES.find(s => s.id === parcel.pipeline)?.label || '' : '';

      tooltip.innerHTML = `
        <div class="parcel-tooltip-address">${escapeHtml(props.address)}</div>
        <div class="parcel-tooltip-acreage">${escapeHtml(String(props.acreage))} acres · ${escapeHtml(props.zoning)} · ${fmt(props.askingPrice)}</div>
        ${pipelineLabel ? `<div class="parcel-tooltip-pipeline">${escapeHtml(pipelineLabel)}</div>` : ''}
      `;
      tooltip.classList.add('visible');

      tooltip.style.left = (e.point.x) + 'px';
      tooltip.style.top = (e.point.y - 12) + 'px';
    }
  });

  map.on('mouseleave', 'parcel-fill', () => {
    map.getCanvas().style.cursor = '';
    if (hoveredId !== null) map.setFeatureState({ source: 'parcels', id: hoveredId }, { hover: false });
    hoveredId = null;
    tooltip.classList.remove('visible');
  });

  map.on('click', 'parcel-fill', (e) => {
    if (e.features.length > 0) {
      const pid = e.features[0].properties.id;
      selectParcel(pid);
    }
  });

  // Click on clusters to zoom in
  map.on('click', 'parcel-cluster-circles', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['parcel-cluster-circles'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('parcel-points').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
    });
  });

  map.on('mouseenter', 'parcel-cluster-circles', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'parcel-cluster-circles', () => {
    map.getCanvas().style.cursor = '';
  });
}

function createTooltip() {
  let tt = document.querySelector('.parcel-tooltip');
  if (tt) return tt;
  tt = document.createElement('div');
  tt.className = 'parcel-tooltip';
  tt.innerHTML = '<div class="parcel-tooltip-address"></div><div class="parcel-tooltip-acreage"></div>';
  document.getElementById('view-map').appendChild(tt);
  return tt;
}

// Fit to all parcels button
function fitToParcels() {
  if (!map) return;
  const bounds = new mapboxgl.LngLatBounds();
  PARCELS.forEach(p => {
    p.polygon.forEach(coord => bounds.extend(coord));
  });
  map.fitBounds(bounds, { padding: 60, duration: 1000 });
}


// ==================== MAP STATS ====================

function renderMapStats() {
  const container = document.getElementById('mapStats');
  if (!container) return;

  const totalAcres = PARCELS.reduce((s, p) => s + p.acreage, 0);
  const totalValue = PARCELS.reduce((s, p) => s + p.askingPrice, 0);
  const inPipeline = PARCELS.filter(p => p.pipeline !== null).length;

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${PARCELS.length}</div>
      <div class="stat-label">Parcels</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalAcres.toLocaleString()}</div>
      <div class="stat-label">Total Acres</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${fmtCompact(totalValue)}</div>
      <div class="stat-label">Total Value</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${inPipeline}</div>
      <div class="stat-label">In Pipeline</div>
    </div>
    <button class="stat-card stat-card--btn" onclick="fitToParcels()" title="Fit map to all parcels">
      <i data-lucide="maximize-2" width="14" height="14"></i>
      <div class="stat-label">Fit All</div>
    </button>
  `;
  lucide.createIcons({ nodes: [container] });
}


// ==================== ANALYSIS PANEL ====================

function selectParcel(id) {
  const parcel = PARCELS.find(p => p.id === id);
  if (!parcel) return;

  selectedParcelId = id;
  currentTab = 'overview';

  // Update parcel layer highlighting
  if (map && map.getLayer('parcel-border-selected')) {
    map.setPaintProperty('parcel-border-selected', 'line-opacity',
      ['case', ['==', ['get', 'id'], id], 1, 0]);
    map.setPaintProperty('parcel-fill', 'fill-color',
      ['case', ['==', ['get', 'id'], id],
        currentTheme === 'dark' ? 'rgba(214,72,72,0.2)' : 'rgba(192,48,48,0.12)',
        ['!=', ['get', 'pipeline'], ''],
        currentTheme === 'dark' ? 'rgba(77,168,99,0.1)' : 'rgba(43,94,58,0.08)',
        currentTheme === 'dark' ? 'rgba(214,72,72,0.06)' : 'rgba(192,48,48,0.05)']);
  }

  // Update header
  document.getElementById('panelAddress').textContent = parcel.address;
  document.getElementById('panelAPN').textContent = `APN: ${parcel.apn}`;
  document.getElementById('panelAcreage').textContent = `${parcel.acreage} acres`;
  document.getElementById('panelZoning').textContent = parcel.zoning;

  const priceBadge = document.getElementById('panelPrice');
  if (priceBadge) priceBadge.textContent = fmt(parcel.askingPrice);

  const pipelineBadge = document.getElementById('panelPipeline');
  if (pipelineBadge) {
    if (parcel.pipeline) {
      const stage = PIPELINE_STAGES.find(s => s.id === parcel.pipeline);
      pipelineBadge.textContent = stage ? stage.label : '';
      pipelineBadge.style.display = 'inline-flex';
    } else {
      pipelineBadge.style.display = 'none';
    }
  }

  const addPipelineBtn = document.getElementById('addToPipelineBtn');
  if (addPipelineBtn) {
    addPipelineBtn.style.display = parcel.pipeline ? 'none' : 'inline-flex';
  }

  // Reset feasibility state — apply settings defaults
  feasibilityState = {
    margin: appSettings.defaultMargin || 25,
    lotYield: parcel.lotYield,
    constructionCost: parcel.avgConstructionCost,
    finishedLotPrice: parcel.avgFinishedLotPrice,
    mode: 'subdivision'
  };

  // Update tabs — include AI Chat tab
  document.querySelectorAll('.analysis-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'overview');
  });

  renderTabContent(parcel, 'overview');

  const panel = document.getElementById('analysisPanel');
  panel.classList.add('open');

  document.getElementById('closePanelBtn').onclick = () => {
    panel.classList.remove('open');
    selectedParcelId = null;
    if (map && map.getLayer('parcel-border-selected')) {
      map.setPaintProperty('parcel-border-selected', 'line-opacity', 0);
      map.setPaintProperty('parcel-fill', 'fill-color',
        ['case',
          ['!=', ['get', 'pipeline'], ''],
          currentTheme === 'dark' ? 'rgba(77,168,99,0.1)' : 'rgba(43,94,58,0.08)',
          currentTheme === 'dark' ? 'rgba(214,72,72,0.06)' : 'rgba(192,48,48,0.05)']);
    }
  };

  document.querySelectorAll('.analysis-tab').forEach(tab => {
    tab.onclick = () => {
      currentTab = tab.dataset.tab;
      document.querySelectorAll('.analysis-tab').forEach(t => t.classList.toggle('active', t === tab));
      renderTabContent(parcel, currentTab);
    };
  });

  if (map) {
    map.flyTo({ center: parcel.coords, zoom: 13, duration: 1200 });
  }

  lucide.createIcons();
}

function renderTabContent(parcel, tab) {
  const container = document.getElementById('analysisTabContent');
  switch (tab) {
    case 'overview': container.innerHTML = renderOverview(parcel); break;
    case 'zoning': container.innerHTML = renderZoning(parcel); break;
    case 'feasibility': container.innerHTML = renderFeasibility(parcel); initFeasibilityListeners(parcel); break;
    case 'environment': container.innerHTML = renderEnvironment(parcel); break;
    case 'ai-chat': container.innerHTML = renderAIChat(parcel); initAIChatListeners(parcel); break;
  }
  lucide.createIcons({ nodes: [container] });
}

function renderOverview(p) {
  const pricePerAcre = Math.round(p.askingPrice / p.acreage);
  const appreciation = p.lastSalePrice > 0 ? Math.round(((p.askingPrice - p.lastSalePrice) / p.lastSalePrice) * 100) : null;

  return `
    <div class="section-heading">Quick Snapshot</div>
    <div class="quick-snapshot">
      <div class="snapshot-item">
        <span class="snapshot-value">${fmt(p.askingPrice)}</span>
        <span class="snapshot-label">Asking Price</span>
      </div>
      <div class="snapshot-item">
        <span class="snapshot-value">${fmt(pricePerAcre)}</span>
        <span class="snapshot-label">Per Acre</span>
      </div>
      <div class="snapshot-item">
        <span class="snapshot-value">${p.lotYield}</span>
        <span class="snapshot-label">Est. Lot Yield</span>
      </div>
      ${appreciation !== null ? `<div class="snapshot-item">
        <span class="snapshot-value ${appreciation > 0 ? 'positive' : 'negative'}">${appreciation > 0 ? '+' : ''}${appreciation}%</span>
        <span class="snapshot-label">Since Last Sale</span>
      </div>` : ''}
    </div>
    <div class="section-gap"></div>
    <div class="section-heading">Owner Information</div>
    <div class="info-list">
      <div class="info-row"><span class="info-label">Owner</span><span class="info-value">${escapeHtml(p.owner)}</span></div>
      <div class="info-row"><span class="info-label">Mailing Address</span><span class="info-value">${escapeHtml(p.ownerAddress)}</span></div>
    </div>
    <div class="section-gap"></div>
    <div class="section-heading">Property Details</div>
    <div class="info-list">
      <div class="info-row"><span class="info-label">Acreage</span><span class="info-value">${p.acreage} acres</span></div>
      <div class="info-row"><span class="info-label">Land Value</span><span class="info-value">${fmt(p.landValue)}</span></div>
      <div class="info-row"><span class="info-label">Improvement Value</span><span class="info-value">${fmt(p.improvementValue)}</span></div>
      <div class="info-row"><span class="info-label">Total Assessed Value</span><span class="info-value">${fmt(p.totalValue)}</span></div>
      <div class="info-row"><span class="info-label">Last Sale Date</span><span class="info-value">${escapeHtml(p.lastSaleDate)}</span></div>
      <div class="info-row"><span class="info-label">Last Sale Price</span><span class="info-value">${fmt(p.lastSalePrice)}</span></div>
    </div>
    <div class="section-gap"></div>
    <div class="section-heading">Location</div>
    <div class="info-list">
      <div class="info-row"><span class="info-label">Township</span><span class="info-value">${escapeHtml(p.township)}</span></div>
      <div class="info-row"><span class="info-label">County</span><span class="info-value">${escapeHtml(p.county)}</span></div>
      <div class="info-row"><span class="info-label">School District</span><span class="info-value">${escapeHtml(p.schoolDistrict)}</span></div>
    </div>
  `;
}

function renderZoning(p) {
  const permHtml = p.permittedUses.map(u => `<li class="use-item"><svg class="use-icon use-icon-green" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>${escapeHtml(u)}</li>`).join('');
  const condHtml = p.conditionalUses.map(u => `<li class="use-item"><svg class="use-icon use-icon-yellow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>${escapeHtml(u)}</li>`).join('');

  return `
    <div class="section-heading">${escapeHtml(p.zoningFull)}</div>
    <div class="section-gap" style="margin-top: var(--space-3);"></div>
    <div class="section-heading" style="font-size: 12px; color: var(--color-text-muted); font-family: var(--font-body);">PERMITTED USES</div>
    <ul class="use-list">${permHtml}</ul>
    <div class="section-gap"></div>
    <div class="section-heading" style="font-size: 12px; color: var(--color-text-muted); font-family: var(--font-body);">CONDITIONAL USES</div>
    <ul class="use-list">${condHtml}</ul>
    <div class="section-gap"></div>
    <div class="section-heading">Key Standards</div>
    <div class="info-list">
      <div class="info-row"><span class="info-label">Min Lot Size</span><span class="info-value">${escapeHtml(p.minLotSize)}</span></div>
      <div class="info-row"><span class="info-label">Min Frontage</span><span class="info-value">${escapeHtml(p.minFrontage)}</span></div>
      <div class="info-row"><span class="info-label">Max Height</span><span class="info-value">${escapeHtml(p.maxHeight)}</span></div>
      <div class="info-row"><span class="info-label">Front Setback</span><span class="info-value">${escapeHtml(p.frontSetback)}</span></div>
      <div class="info-row"><span class="info-label">Side Setback</span><span class="info-value">${escapeHtml(p.sideSetback)}</span></div>
      <div class="info-row"><span class="info-label">Rear Setback</span><span class="info-value">${escapeHtml(p.rearSetback)}</span></div>
      <div class="info-row"><span class="info-label">Max Lot Coverage</span><span class="info-value">${escapeHtml(p.maxCoverage)}</span></div>
    </div>
    <div class="status-banner ${p.suitableForDev ? 'suitable' : 'restrictions'}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.suitableForDev ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>'}</svg>
      ${p.suitableForDev ? 'Suitable for Development' : 'Restrictions Apply — Review Zoning'}
    </div>
  `;
}

function renderFeasibility(p) {
  const m = feasibilityState;
  const isSubdivision = m.mode === 'subdivision';

  const modeToggle = `
    <div class="mode-toggle-section">
      <button class="mode-toggle-btn ${isSubdivision ? 'active' : ''}" onclick="switchFeasibilityMode('subdivision')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        Subdivision
      </button>
      <button class="mode-toggle-btn ${!isSubdivision ? 'active' : ''}" onclick="switchFeasibilityMode('single-home')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Single Home
      </button>
    </div>
  `;

  if (isSubdivision) {
    return modeToggle + renderSubdivisionFeasibility(p, m);
  } else {
    return modeToggle + renderSingleHomeFeasibility(p, m);
  }
}

function renderSubdivisionFeasibility(p, m) {
  const calc = calculateFeasibility(p, m);

  let sliderColor;
  if (m.margin <= 15) sliderColor = 'var(--color-success)';
  else if (m.margin <= 30) sliderColor = 'var(--color-gold)';
  else if (m.margin <= 50) sliderColor = 'var(--color-warning)';
  else sliderColor = 'var(--color-primary)';

  const pct = ((m.margin - 1) / 99) * 100;

  const sensMargins = generateSensitivityMargins(m.margin);
  const sensRows = sensMargins.map(mg => {
    const c = calculateFeasibility(p, { ...m, margin: mg });
    const isCurrent = mg === m.margin;
    return `<tr class="${isCurrent ? 'current' : ''}">
      <td>${mg}%</td>
      <td>${fmt(Math.round(c.requiredPerLot))}</td>
      <td class="verdict-cell" style="color: var(--color-${c.verdict === 'FEASIBLE' ? 'success' : c.verdict === 'STRETCH' ? 'warning' : 'error'});">${c.verdict}</td>
    </tr>`;
  }).join('');

  return `
    <div class="profit-slider-section">
      <div class="profit-slider-header">
        <span class="profit-slider-label">Target Gross Profit</span>
        <span class="profit-slider-value" id="marginDisplay">${m.margin}%</span>
      </div>
      <input type="range" class="profit-slider" id="marginSlider" min="1" max="100" step="1" value="${m.margin}"
        style="background: linear-gradient(to right, ${sliderColor} ${pct}%, var(--color-surface-offset) ${pct}%);">
      <div class="slider-range-labels">
        <span>1%</span>
        <span>100%</span>
      </div>
    </div>

    <div class="section-heading">Development Assumptions</div>
    <div class="assumption-grid">
      <div class="assumption-field">
        <label>Estimated Lot Yield</label>
        <input type="number" class="assumption-input" id="inputLotYield" value="${m.lotYield}">
      </div>
      <div class="assumption-field">
        <label>Avg Construction Cost / Lot</label>
        <input type="text" class="assumption-input" id="inputConstructionCost" value="${fmtInput(m.constructionCost)}">
      </div>
      <div class="assumption-field">
        <label>Avg Finished Lot Price (from comps)</label>
        <input type="text" class="assumption-input" id="inputFinishedLotPrice" value="${fmtInput(m.finishedLotPrice)}">
      </div>
    </div>

    <div class="section-heading">Financial Breakdown</div>
    <div class="breakdown-section" id="breakdownSection">
      ${renderBreakdown(p, calc)}
    </div>

    <div class="verdict-box ${calc.verdict.toLowerCase()}" id="verdictBox">
      <div class="verdict-label ${calc.verdict.toLowerCase()}">
        ${calc.verdict === 'FEASIBLE' ? '&#10003;' : calc.verdict === 'STRETCH' ? '&#9888;' : '&#10005;'}
        ${calc.verdict}
      </div>
      <div class="verdict-detail" id="verdictDetail">${calc.verdictDetail}</div>
    </div>

    <div class="section-heading">Sensitivity Analysis</div>
    <table class="sensitivity-table" id="sensitivityTable">
      <thead><tr><th>Margin</th><th>Required/Lot</th><th>Verdict</th></tr></thead>
      <tbody>${sensRows}</tbody>
    </table>
  `;
}

function renderSingleHomeFeasibility(p, m) {
  const landCost = p.askingPrice;
  const buildCost = p.estimatedBuildCost || 400000;
  const homeValue = p.estimatedHomeValue || 550000;
  const comps = p.comparableHomeSales || [];

  const totalInvestment = landCost + buildCost;
  const softCosts = totalInvestment * 0.08;
  const holdingCosts = (totalInvestment + softCosts) * 0.07 * 0.75;
  const totalAllIn = totalInvestment + softCosts + holdingCosts;
  const grossProfit = homeValue - totalAllIn;
  const grossMargin = Math.round((grossProfit / homeValue) * 100);
  const compsAvg = comps.length > 0 ? Math.round(comps.reduce((a, b) => a + b, 0) / comps.length) : homeValue;

  let verdict, verdictClass;
  if (grossMargin >= m.margin) {
    verdict = 'MEETS TARGET';
    verdictClass = 'feasible';
  } else if (grossMargin >= m.margin - 10) {
    verdict = 'CLOSE TO TARGET';
    verdictClass = 'stretch';
  } else {
    verdict = 'BELOW TARGET';
    verdictClass = 'unlikely';
  }

  return `
    <div class="profit-slider-section">
      <div class="profit-slider-header">
        <span class="profit-slider-label">Target Gross Profit</span>
        <span class="profit-slider-value">${m.margin}%</span>
      </div>
      <div class="single-home-result">
        <span class="single-home-actual ${grossMargin >= m.margin ? 'positive' : 'negative'}">Actual: ${grossMargin}%</span>
      </div>
    </div>

    <div class="section-heading">Build Assumptions</div>
    <div class="info-list">
      <div class="info-row"><span class="info-label">Land Cost (Asking)</span><span class="info-value">${fmt(landCost)}</span></div>
      <div class="info-row"><span class="info-label">Estimated Build Cost</span><span class="info-value">${fmt(buildCost)}</span></div>
      <div class="info-row"><span class="info-label">Soft Costs (8%)</span><span class="info-value">${fmt(Math.round(softCosts))}</span></div>
      <div class="info-row"><span class="info-label">Holding Costs (7%, 9mo)</span><span class="info-value">${fmt(Math.round(holdingCosts))}</span></div>
    </div>
    <div class="section-gap"></div>

    <div class="section-heading">Financial Breakdown</div>
    <div class="breakdown-section">
      <div class="breakdown-row total"><span>Total All-In Cost</span><span class="bkdn-val">${fmt(Math.round(totalAllIn))}</span></div>
      <div class="breakdown-row"><span>Estimated Home Value</span><span class="bkdn-val">${fmt(homeValue)}</span></div>
      <div class="breakdown-row highlight"><span>Gross Profit</span><span class="bkdn-val">${fmt(Math.round(grossProfit))}</span></div>
      <div class="breakdown-row"><span>Gross Margin</span><span class="bkdn-val">${grossMargin}%</span></div>
    </div>

    <div class="verdict-box ${verdictClass}">
      <div class="verdict-label ${verdictClass}">
        ${verdictClass === 'feasible' ? '&#10003;' : verdictClass === 'stretch' ? '&#9888;' : '&#10005;'}
        ${verdict}
      </div>
      <div class="verdict-detail">Target: ${m.margin}% · Actual: ${grossMargin}% · ${grossProfit > 0 ? 'Profit' : 'Loss'}: ${fmt(Math.abs(Math.round(grossProfit)))}</div>
    </div>

    ${comps.length > 0 ? `
    <div class="section-heading">Comparable Home Sales</div>
    <div class="info-list">
      ${comps.map((c, i) => `<div class="info-row"><span class="info-label">Comp ${i + 1}</span><span class="info-value">${fmt(c)}</span></div>`).join('')}
      <div class="info-row" style="font-weight:600;"><span class="info-label">Average</span><span class="info-value">${fmt(compsAvg)}</span></div>
    </div>
    ` : ''}
  `;
}

function generateSensitivityMargins(current) {
  const step = current <= 10 ? 2 : current <= 30 ? 5 : 10;
  const margins = [];
  const start = Math.max(1, current - step * 3);

  for (let i = 0; i < 7; i++) {
    const val = start + (i * step);
    if (val <= 100) margins.push(val);
  }

  if (!margins.includes(current)) {
    margins.push(current);
    margins.sort((a, b) => a - b);
    if (margins.length > 7) margins.splice(0, margins.length - 7);
  }

  return margins;
}

function renderBreakdown(p, calc) {
  return `
    <div class="breakdown-row"><span>Asking Price</span><span class="bkdn-val">${fmt(p.askingPrice)}</span></div>
    <div class="breakdown-row"><span>+ Site Development Costs</span><span class="bkdn-val">${fmt(Math.round(calc.siteDev))}</span></div>
    <div class="breakdown-row"><span>+ Soft Costs (12%)</span><span class="bkdn-val">${fmt(Math.round(calc.softCosts))}</span></div>
    <div class="breakdown-row"><span>+ Holding Costs (7%, 18mo)</span><span class="bkdn-val">${fmt(Math.round(calc.holdingCosts))}</span></div>
    <div class="breakdown-row total"><span>Total Investment</span><span class="bkdn-val">${fmt(Math.round(calc.totalInvestment))}</span></div>
    <div class="breakdown-row highlight"><span>Target Revenue (at ${feasibilityState.margin}%)</span><span class="bkdn-val">${fmt(Math.round(calc.targetRevenue))}</span></div>
    <div class="breakdown-row"><span>Required Price / Lot</span><span class="bkdn-val">${fmt(Math.round(calc.requiredPerLot))}</span></div>
    <div class="breakdown-row"><span>Market Comp / Lot</span><span class="bkdn-val">${fmt(feasibilityState.finishedLotPrice)}</span></div>
  `;
}

function calculateFeasibility(p, m) {
  const siteDev = m.lotYield * m.constructionCost;
  const baseCost = p.askingPrice + siteDev;
  const softCosts = baseCost * 0.12;
  const subtotal = baseCost + softCosts;
  const holdingCosts = subtotal * 0.07 * 1.5;
  const totalInvestment = subtotal + holdingCosts;
  const targetRevenue = totalInvestment / (1 - m.margin / 100);
  const requiredPerLot = targetRevenue / m.lotYield;
  const ratio = requiredPerLot / m.finishedLotPrice;
  const ratioPct = Math.round(ratio * 100);

  let verdict, verdictDetail;
  if (requiredPerLot <= m.finishedLotPrice) {
    verdict = 'FEASIBLE';
    verdictDetail = `Required price is ${ratioPct}% of market median`;
  } else if (ratio <= 1.25) {
    verdict = 'STRETCH';
    verdictDetail = `Required price is ${ratioPct}% of market median`;
  } else {
    verdict = 'UNLIKELY';
    verdictDetail = `Required price is ${ratioPct}% of market median`;
  }

  return { siteDev, softCosts, holdingCosts, totalInvestment, targetRevenue, requiredPerLot, verdict, verdictDetail, ratio, ratioPct };
}

function initFeasibilityListeners(parcel) {
  const slider = document.getElementById('marginSlider');
  const display = document.getElementById('marginDisplay');
  const lotYieldInput = document.getElementById('inputLotYield');
  const costInput = document.getElementById('inputConstructionCost');
  const priceInput = document.getElementById('inputFinishedLotPrice');

  if (!slider) return;

  function update() {
    feasibilityState.margin = parseInt(slider.value);
    if (lotYieldInput) feasibilityState.lotYield = parseInt(lotYieldInput.value) || 1;
    if (costInput) feasibilityState.constructionCost = parseCurrency(costInput.value);
    if (priceInput) feasibilityState.finishedLotPrice = parseCurrency(priceInput.value);

    display.textContent = `${feasibilityState.margin}%`;

    let sliderColor;
    if (feasibilityState.margin <= 15) sliderColor = 'var(--color-success)';
    else if (feasibilityState.margin <= 30) sliderColor = 'var(--color-gold)';
    else if (feasibilityState.margin <= 50) sliderColor = 'var(--color-warning)';
    else sliderColor = 'var(--color-primary)';
    const pct = ((feasibilityState.margin - 1) / 99) * 100;
    slider.style.background = `linear-gradient(to right, ${sliderColor} ${pct}%, var(--color-surface-offset) ${pct}%)`;

    const calc = calculateFeasibility(parcel, feasibilityState);

    const bkdn = document.getElementById('breakdownSection');
    if (bkdn) bkdn.innerHTML = renderBreakdown(parcel, calc);

    const vBox = document.getElementById('verdictBox');
    if (vBox) {
      vBox.className = `verdict-box ${calc.verdict.toLowerCase()}`;
      vBox.innerHTML = `
        <div class="verdict-label ${calc.verdict.toLowerCase()}">
          ${calc.verdict === 'FEASIBLE' ? '&#10003;' : calc.verdict === 'STRETCH' ? '&#9888;' : '&#10005;'}
          ${calc.verdict}
        </div>
        <div class="verdict-detail">${calc.verdictDetail}</div>
      `;
    }

    const sensMargins = generateSensitivityMargins(feasibilityState.margin);
    const tbody = document.querySelector('#sensitivityTable tbody');
    if (tbody) {
      tbody.innerHTML = sensMargins.map(mg => {
        const c = calculateFeasibility(parcel, { ...feasibilityState, margin: mg });
        const isCurrent = mg === feasibilityState.margin;
        return `<tr class="${isCurrent ? 'current' : ''}">
          <td>${mg}%</td>
          <td>${fmt(Math.round(c.requiredPerLot))}</td>
          <td class="verdict-cell" style="color: var(--color-${c.verdict === 'FEASIBLE' ? 'success' : c.verdict === 'STRETCH' ? 'warning' : 'error'});">${c.verdict}</td>
        </tr>`;
      }).join('');
    }
  }

  slider.addEventListener('input', update);
  if (lotYieldInput) lotYieldInput.addEventListener('input', update);
  if (costInput) costInput.addEventListener('input', update);
  if (priceInput) priceInput.addEventListener('input', update);
}

function renderEnvironment(p) {
  const floodClass = p.floodRisk === 'Minimal Risk' ? 'safe' : 'danger';
  const wetClass = p.wetlandsAcres > 0 ? 'caution' : 'safe';

  return `
    <div class="env-item">
      <div class="env-icon ${floodClass}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16.3c2.2 0 4-1.83 4-4.05C11 9.5 7 3 7 3S3 9.5 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.6 21.3c3.28 0 5.94-2.73 5.94-6.1C18.54 11.1 12.6 1 12.6 1S6.66 11.1 6.66 15.2c0 3.37 2.66 6.1 5.94 6.1z" opacity="0.4"/></svg>
      </div>
      <div class="env-info">
        <div class="env-title">Flood Zone: ${escapeHtml(p.floodZone)}</div>
        <div class="env-detail">${escapeHtml(p.floodRisk)}</div>
      </div>
      <span class="badge badge-${floodClass === 'safe' ? 'success' : 'error'}">${p.floodRisk === 'Minimal Risk' ? 'Low Risk' : 'High Risk'}</span>
    </div>
    <div class="env-item">
      <div class="env-icon ${wetClass}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/></svg>
      </div>
      <div class="env-info">
        <div class="env-title">Wetlands: ${escapeHtml(p.wetlands)}</div>
        <div class="env-detail">${p.wetlandsAcres > 0 ? `${p.wetlandsAcres} acres affected` : 'No wetlands identified on parcel'}</div>
      </div>
      <span class="badge badge-${p.wetlandsAcres > 0 ? 'warning' : 'success'}">${p.wetlandsAcres > 0 ? 'Present' : 'Clear'}</span>
    </div>
    <div class="env-item">
      <div class="env-icon safe">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L2 12l7.5 8h5L22 12z"/></svg>
      </div>
      <div class="env-info">
        <div class="env-title">Topography</div>
        <div class="env-detail">${escapeHtml(p.topography)}</div>
      </div>
    </div>
    <div class="env-item">
      <div class="env-icon safe">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <div class="env-info">
        <div class="env-title">Soil Type</div>
        <div class="env-detail">${escapeHtml(p.soilType)}</div>
      </div>
    </div>
  `;
}


// ==================== AI CHAT ====================

let chatHistory = {}; // per-parcel chat history

function renderAIChat(p) {
  const history = chatHistory[p.id] || [];
  const messagesHtml = history.map(m => `
    <div class="chat-message chat-message--${m.role}">
      <div class="chat-bubble chat-bubble--${m.role}">${escapeHtml(m.text)}</div>
    </div>
  `).join('');

  return `
    <div class="ai-chat-container">
      <div class="ai-chat-header">
        <div class="ai-chat-header-icon">
          <i data-lucide="bot" width="16" height="16"></i>
        </div>
        <div>
          <div class="ai-chat-header-title">SquareBerry AI</div>
          <div class="ai-chat-header-subtitle">Ask about ${escapeHtml(p.address)}</div>
        </div>
      </div>
      <div class="ai-chat-messages" id="chatMessages">
        ${history.length === 0 ? `
          <div class="chat-message chat-message--assistant">
            <div class="chat-bubble chat-bubble--assistant">Hi! I can answer questions about this ${p.acreage}-acre parcel. Try asking about lot yield, wetland risk, setbacks, zoning, feasibility, owner info, or comparable sales.</div>
          </div>
        ` : messagesHtml}
      </div>
      <div class="ai-chat-suggestions" id="chatSuggestions">
        <button class="chat-suggestion" onclick="sendChatQuestion('How many lots can I get?')">How many lots?</button>
        <button class="chat-suggestion" onclick="sendChatQuestion('What\\'s the wetland risk?')">Wetland risk?</button>
        <button class="chat-suggestion" onclick="sendChatQuestion('Does this pencil at 25%?')">Pencil at 25%?</button>
        <button class="chat-suggestion" onclick="sendChatQuestion('What are the setbacks?')">Setbacks?</button>
      </div>
      <div class="ai-chat-input-row">
        <input type="text" class="ai-chat-input" id="chatInput" placeholder="Ask a question..." autocomplete="off">
        <button class="btn btn-primary btn-sm ai-chat-send" id="chatSendBtn">
          <i data-lucide="send" width="14" height="14"></i>
        </button>
      </div>
    </div>
  `;
}

function initAIChatListeners(parcel) {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  if (!input || !btn) return;

  const send = () => {
    const q = sanitizeInput(input.value, 300);
    if (!q) return;
    input.value = '';
    processChatQuestion(parcel, q);
  };

  btn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });
}

function sendChatQuestion(q) {
  const parcel = PARCELS.find(p => p.id === selectedParcelId);
  if (!parcel) return;
  const input = document.getElementById('chatInput');
  if (input) input.value = '';

  // Hide suggestions after first use
  const suggestions = document.getElementById('chatSuggestions');
  if (suggestions) suggestions.style.display = 'none';

  processChatQuestion(parcel, q);
}

function processChatQuestion(parcel, question) {
  if (!chatHistory[parcel.id]) chatHistory[parcel.id] = [];
  chatHistory[parcel.id].push({ role: 'user', text: question });

  const answer = generateAnswer(parcel, question);
  chatHistory[parcel.id].push({ role: 'assistant', text: answer });

  // Update messages
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = chatHistory[parcel.id].map(m => `
      <div class="chat-message chat-message--${m.role}">
        <div class="chat-bubble chat-bubble--${m.role}">${escapeHtml(m.text)}</div>
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }
}

function generateAnswer(p, q) {
  const ql = q.toLowerCase();

  // Lot yield / how many lots
  if (ql.includes('lot') || ql.includes('yield') || ql.includes('how many')) {
    return `Based on ${p.acreage} acres with ${p.zoningFull} zoning (min lot size ${p.minLotSize}), the estimated lot yield is ${p.lotYield} lots. This factors in road ROW, stormwater, and typical open space dedications.`;
  }

  // Wetland risk
  if (ql.includes('wetland') || ql.includes('wet land')) {
    if (p.wetlandsAcres > 0) {
      return `Wetlands are present on this parcel — approximately ${p.wetlandsAcres} acres affected. This reduces the developable area and may require MDEQ/Army Corps permits. You'd need a wetland delineation survey to confirm exact boundaries. Budget $8K-$15K for the survey and potential mitigation.`;
    }
    return `No wetlands have been detected on this parcel. The developable area should be the full ${p.acreage} acres minus road ROW and setbacks. Low risk for wetland-related delays.`;
  }

  // Flood
  if (ql.includes('flood')) {
    if (p.floodRisk === 'Minimal Risk') {
      return `This parcel is in ${p.floodZone} — minimal flood risk. No FEMA flood insurance should be required. This is favorable for development financing.`;
    }
    return `This parcel is in ${p.floodZone} — ${p.floodRisk}. FEMA flood insurance will likely be required. Building within the flood zone requires elevated foundations and special permits. This can add $30K-$60K per lot.`;
  }

  // Pencil / feasibility
  if (ql.includes('pencil') || ql.includes('feasib') || ql.includes('profit') || ql.includes('margin') || ql.includes('work at') || ql.includes('viable')) {
    const marginMatch = ql.match(/(\d+)\s*%/);
    const targetMargin = marginMatch ? parseInt(marginMatch[1]) : appSettings.defaultMargin;
    const calc = calculateFeasibility(p, {
      margin: targetMargin,
      lotYield: p.lotYield,
      constructionCost: p.avgConstructionCost,
      finishedLotPrice: p.avgFinishedLotPrice
    });
    const required = fmt(Math.round(calc.requiredPerLot));
    const market = fmt(p.avgFinishedLotPrice);
    return `At a ${targetMargin}% gross profit target with ${p.lotYield} lots: you'd need ${required}/lot, and market comps are at ${market}/lot. Verdict: ${calc.verdict}. ${calc.verdictDetail}.`;
  }

  // Setbacks
  if (ql.includes('setback')) {
    return `Setbacks for ${p.zoningFull}: Front ${p.frontSetback}, Side ${p.sideSetback}, Rear ${p.rearSetback}. Max building height is ${p.maxHeight}. Max lot coverage is ${p.maxCoverage}.`;
  }

  // Zoning
  if (ql.includes('zoning') || ql.includes('zone')) {
    const uses = p.permittedUses.join(', ');
    return `This parcel is zoned ${p.zoningFull}. Min lot size: ${p.minLotSize}. Min frontage: ${p.minFrontage}. Permitted uses include: ${uses}. ${p.suitableForDev ? 'The zoning is suitable for residential development.' : 'Current zoning has restrictions — review conditional uses and consider a rezoning or variance.'}`;
  }

  // Owner
  if (ql.includes('owner') || ql.includes('who owns')) {
    return `This parcel is owned by ${p.owner}. Mailing address: ${p.ownerAddress}. Last sold on ${p.lastSaleDate} for ${fmt(p.lastSalePrice)}. Current assessed total value is ${fmt(p.totalValue)}.`;
  }

  // Comps / comparable
  if (ql.includes('comp') || ql.includes('comparable') || ql.includes('sale')) {
    const comps = p.comparableHomeSales;
    if (comps && comps.length > 0) {
      const avg = Math.round(comps.reduce((a, b) => a + b, 0) / comps.length);
      return `Comparable home sales in the area: ${comps.map(c => fmt(c)).join(', ')}. Average: ${fmt(avg)}. Estimated finished home value: ${fmt(p.estimatedHomeValue)}.`;
    }
    return `No comparable sales data is available for this parcel yet. This will be available when we connect real parcel APIs.`;
  }

  // Price / value
  if (ql.includes('price') || ql.includes('value') || ql.includes('cost') || ql.includes('worth')) {
    const ppa = Math.round(p.askingPrice / p.acreage);
    return `Asking price: ${fmt(p.askingPrice)} (${fmt(ppa)}/acre). Assessed land value: ${fmt(p.landValue)}, improvement value: ${fmt(p.improvementValue)}, total: ${fmt(p.totalValue)}. Last sale: ${fmt(p.lastSalePrice)} on ${p.lastSaleDate}.`;
  }

  // Soil
  if (ql.includes('soil')) {
    return `Soil type: ${p.soilType}. Topography: ${p.topography}. The soil type impacts foundation requirements, septic suitability, and stormwater management design.`;
  }

  // Topography
  if (ql.includes('topograph') || ql.includes('terrain') || ql.includes('slope')) {
    return `Topography: ${p.topography}. ${p.topography.toLowerCase().includes('flat') ? 'Flat terrain is ideal for subdivision development with lower grading costs.' : 'Sloped terrain may require additional grading and retaining walls — budget an extra $5K-$15K per lot.'}`;
  }

  // School
  if (ql.includes('school')) {
    return `This parcel is in the ${p.schoolDistrict}. Quality school districts are a strong selling point for residential lots and can command a 5-15% premium.`;
  }

  // Acreage / size
  if (ql.includes('acre') || ql.includes('size') || ql.includes('big') || ql.includes('large')) {
    return `This parcel is ${p.acreage} acres in ${p.township} Township, ${p.county} County. ${p.wetlandsAcres > 0 ? `Note: ${p.wetlandsAcres} acres have wetlands, leaving approximately ${(p.acreage - p.wetlandsAcres).toFixed(1)} developable acres.` : 'The full acreage appears developable.'}`;
  }

  // Fallback
  return `I'll need more data to answer that specifically — this will be available when we connect real parcel APIs. In the meantime, try asking about: lot yield, wetlands, flood risk, setbacks, zoning, feasibility, owner info, comps, or soil type.`;
}


