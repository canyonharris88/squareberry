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


