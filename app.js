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

const PARCELS = [];

const PIPELINE_STAGES = [
  { id: "new_lead", label: "New Lead" },
  { id: "reviewing", label: "Reviewing" },
  { id: "site_visit", label: "Site Visit" },
  { id: "offer_sent", label: "Offer Sent" },
  { id: "under_contract", label: "Under Contract" },
  { id: "closed", label: "Closed" },
  { id: "dead", label: "Dead" }
];

const STAGE_COLORS = {
  new_lead: 'badge-neutral',
  reviewing: 'badge-primary',
  site_visit: 'badge-warning',
  offer_sent: 'badge-warning',
  under_contract: 'badge-success',
  closed: 'badge-success',
  dead: 'badge-error'
};

const STAGE_LABELS = {
  new_lead: 'New Lead',
  reviewing: 'Reviewing',
  site_visit: 'Site Visit',
  offer_sent: 'Offer Sent',
  under_contract: 'Under Contract',
  closed: 'Closed',
  dead: 'Dead'
};

// ==================== PIPELINE API ====================

const API_BASE = '';
let apiLeads = [];
let apiAlerts = [];
let apiReports = [];

async function fetchApiLeads() {
  try {
    const params = new URLSearchParams();
    if (pipelineSearch) params.set('search', pipelineSearch);
    if (pipelineCountyFilter) params.set('county', pipelineCountyFilter);
    if (pipelineSort) params.set('sort', pipelineSort);
    if (pipelineSortOrder) params.set('order', pipelineSortOrder);
    const res = await fetch(`${API_BASE}/api/leads?${params}`);
    if (res.ok) {
      apiLeads = await res.json();
    }
  } catch (e) {
    console.log('Pipeline API not available');
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

async function deleteLeadApi(leadId) {
  try {
    const res = await fetch(`${API_BASE}/api/leads/${leadId}`, { method: 'DELETE' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

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

let currentTheme = 'light';
let currentView = 'pipeline';

// Pipeline filter/search/sort/bulk state
let pipelineSearch = '';
let pipelineCountyFilter = '';
let pipelineSort = 'created_at';
let pipelineSortOrder = 'desc';
let pipelineBulkSelected = new Set();
let pipelineBulkMode = false;
let pipelineStarFilter = false;
let pipelineStageFilter = '';

// Lead detail modal state
let openLeadDetailId = null;
let openLeadDetailType = null;

// Default settings
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
  initSidebar();
  initNavigation();

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
  updateStatsBadge();
});


// ==================== THEME ====================

function initTheme() {
  const saved = localStorage.getItem('squareberry-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  currentTheme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('squareberry-theme', currentTheme);
      updateThemeIcon();
    });
  }
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const sun = btn.querySelector('.icon-sun');
  const moon = btn.querySelector('.icon-moon');
  if (sun) sun.style.display = currentTheme === 'dark' ? 'block' : 'none';
  if (moon) moon.style.display = currentTheme === 'dark' ? 'none' : 'block';
}


// ==================== SIDEBAR ====================

function initSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
}


// ==================== NAVIGATION ====================

function initNavigation() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.view;
      switchView(view);
    });
  });

  // Activate initial view
  const hash = window.location.hash.slice(1) || 'pipeline';
  switchView(hash);
}

function switchView(view) {
  currentView = view;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });

  document.querySelectorAll('.view').forEach(el => {
    el.classList.toggle('active', el.id === `view-${view}`);
  });

  window.location.hash = view;
}


// ==================== FORMATTING ====================

function fmt(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}

function fmtAcres(val) {
  if (val == null || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return '—';
  return n % 1 === 0 ? n + ' ac' : n.toFixed(1) + ' ac';
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return days + 'd ago';
  const months = Math.floor(days / 30);
  return months + 'mo ago';
}


// ==================== PIPELINE ====================

function renderPipeline() {
  const tbody = document.getElementById('leadsBody');
  const subtitle = document.getElementById('pipelineSubtitle');
  if (!tbody) return;

  // Filter leads
  let filtered = [...apiLeads];

  if (pipelineStageFilter) {
    filtered = filtered.filter(l => l.stage === pipelineStageFilter);
  }
  if (pipelineStarFilter) {
    filtered = filtered.filter(l => l.starred === 1);
  }
  if (pipelineSearch) {
    const q = pipelineSearch.toLowerCase();
    filtered = filtered.filter(l =>
      (l.address || '').toLowerCase().includes(q) ||
      (l.city || '').toLowerCase().includes(q) ||
      (l.county || '').toLowerCase().includes(q) ||
      (l.notes || '').toLowerCase().includes(q)
    );
  }
  if (pipelineCountyFilter) {
    filtered = filtered.filter(l => l.county === pipelineCountyFilter);
  }

  // Sort
  filtered.sort((a, b) => {
    let va = a[pipelineSort], vb = b[pipelineSort];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va === null || va === undefined) va = '';
    if (vb === null || vb === undefined) vb = '';
    if (pipelineSortOrder === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });

  if (subtitle) {
    const total = apiLeads.length;
    const showing = filtered.length;
    const stages = {};
    apiLeads.forEach(l => {
      stages[l.stage] = (stages[l.stage] || 0) + 1;
    });
    const activeCount = (stages.reviewing || 0) + (stages.site_visit || 0) + (stages.offer_sent || 0) + (stages.under_contract || 0);
    subtitle.textContent = `${total} total leads · ${activeCount} active · ${showing} showing`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 2rem; color: var(--color-text-secondary)">No leads found</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => {
    const stageClass = STAGE_COLORS[lead.stage] || 'badge-neutral';
    const stageLabel = STAGE_LABELS[lead.stage] || lead.stage;
    const starFill = lead.starred ? 'fill: currentColor;' : '';
    return `<tr class="lead-row" data-id="${lead.id}">
      <td class="col-star">
        <button class="star-btn ${lead.starred ? 'starred' : ''}" onclick="toggleStar(${lead.id})" title="${lead.starred ? 'Unstar' : 'Star'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" style="${starFill}"/>
          </svg>
        </button>
      </td>
      <td class="col-address">
        <button class="lead-address-btn" onclick="openLeadDetail(${lead.id}, 'api')">${escapeHtml(lead.address)}</button>
        ${lead.city ? `<div class="lead-city">${escapeHtml(lead.city)}</div>` : ''}
      </td>
      <td class="col-county">${escapeHtml(lead.county || '—')}</td>
      <td class="col-acres">${fmtAcres(lead.acreage)}</td>
      <td class="col-price">${fmt(lead.asking_price)}</td>
      <td class="col-ppa">${lead.price_per_acre ? fmt(lead.price_per_acre) : (lead.acreage && lead.asking_price ? fmt(lead.asking_price / lead.acreage) : '—')}</td>
      <td class="col-zoning">${escapeHtml(lead.zoning || '—')}</td>
      <td class="col-rating">${lead.feasibility_rating ? `<span class="rating-badge rating-${lead.feasibility_rating.toLowerCase()}">${escapeHtml(lead.feasibility_rating)}</span>` : '—'}</td>
      <td class="col-stage"><span class="badge ${stageClass}">${stageLabel}</span></td>
      <td class="col-actions">
        <div class="row-actions">
          ${lead.listing_url ? `<a href="${escapeHtml(lead.listing_url)}" target="_blank" rel="noopener" class="action-link" title="View listing"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : ''}
          <button class="action-btn delete-btn" onclick="confirmDeleteLead(${lead.id})" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Update county filter options
  updateCountyFilter();

  // Update stage tabs counts
  updateStageTabs();
}

function updateStageTabs() {
  const stageCounts = {};
  apiLeads.forEach(l => {
    stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
  });

  document.querySelectorAll('.stage-tab').forEach(tab => {
    const stage = tab.dataset.stage;
    const count = stage ? (stageCounts[stage] || 0) : apiLeads.length;
    const existing = tab.querySelector('.tab-count');
    if (existing) existing.remove();
    if (count > 0) {
      const span = document.createElement('span');
      span.className = 'tab-count';
      span.textContent = count;
      tab.appendChild(span);
    }
  });
}

function updateCountyFilter() {
  const select = document.getElementById('countyFilter');
  if (!select) return;
  const counties = [...new Set(apiLeads.map(l => l.county).filter(Boolean))].sort();
  const current = select.value;
  select.innerHTML = '<option value="">All Counties</option>' +
    counties.map(c => `<option value="${escapeHtml(c)}" ${c === current ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
}

function updateStatsBadge() {
  const badge = document.getElementById('alertsBadge');
  if (!badge) return;
  const totalNew = apiAlerts.reduce((sum, a) => sum + (a.new_matches || 0), 0);
  if (totalNew > 0) {
    badge.textContent = totalNew;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// Stage tab click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('stageTabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.stage-tab');
    if (!tab) return;
    document.querySelectorAll('.stage-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    pipelineStageFilter = tab.dataset.stage || '';
    renderPipeline();
  });

  // Search input
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    pipelineSearch = sanitizeInput(e.target.value, 200);
    renderPipeline();
  });

  // Stage filter
  document.getElementById('stageFilter')?.addEventListener('change', (e) => {
    pipelineStageFilter = e.target.value;
    document.querySelectorAll('.stage-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.stage === pipelineStageFilter);
    });
    renderPipeline();
  });

  // County filter
  document.getElementById('countyFilter')?.addEventListener('change', (e) => {
    pipelineCountyFilter = e.target.value;
    renderPipeline();
  });

  // Sort
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    pipelineSort = e.target.value;
    renderPipeline();
  });

  // Starred filter
  document.getElementById('starredFilterBtn')?.addEventListener('click', (e) => {
    pipelineStarFilter = !pipelineStarFilter;
    e.currentTarget.classList.toggle('active', pipelineStarFilter);
    renderPipeline();
  });

  // Export CSV
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    window.open(`${API_BASE}/api/leads/export`, '_blank');
  });

  // Add Lead button
  document.getElementById('addLeadBtn')?.addEventListener('click', () => {
    openAddLeadModal();
  });
});


// ==================== STAR TOGGLE ====================

async function toggleStar(leadId) {
  const lead = apiLeads.find(l => l.id === leadId);
  if (!lead) return;
  const newStarred = lead.starred ? 0 : 1;
  lead.starred = newStarred; // optimistic update
  renderPipeline();
  await updateLeadApi(leadId, { starred: newStarred });
}


// ==================== DELETE LEAD ====================

let deleteLeadId = null;

function confirmDeleteLead(leadId) {
  deleteLeadId = leadId;
  const lead = apiLeads.find(l => l.id === leadId);
  const modal = document.createElement('div');
  modal.id = 'deleteConfirmModal';
  modal.className = 'modal-overlay visible';
  modal.innerHTML = `
    <div class="modal" style="max-width:360px">
      <div class="modal-header">
        <h2 class="modal-title">Delete Lead</h2>
        <button class="modal-close" onclick="document.getElementById('deleteConfirmModal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:1rem">Are you sure you want to delete <strong>${escapeHtml(lead?.address || 'this lead')}</strong>? This cannot be undone.</p>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end">
          <button class="btn btn-outline" onclick="document.getElementById('deleteConfirmModal').remove()">Cancel</button>
          <button class="btn btn-primary" style="background:var(--color-danger)" onclick="executeDeleteLead()">Delete</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function executeDeleteLead() {
  if (!deleteLeadId) return;
  document.getElementById('deleteConfirmModal')?.remove();
  const ok = await deleteLeadApi(deleteLeadId);
  if (ok) {
    apiLeads = apiLeads.filter(l => l.id !== deleteLeadId);
    renderPipeline();
    showToast('Lead deleted', 'success');
  } else {
    showToast('Failed to delete lead', 'error');
  }
  deleteLeadId = null;
}


// ==================== ADD LEAD MODAL ====================

function openAddLeadModal() {
  const existing = document.getElementById('addLeadModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'addLeadModal';
  modal.className = 'modal-overlay visible';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Add Lead</h2>
        <button class="modal-close" onclick="document.getElementById('addLeadModal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="addLeadForm">
          <div class="form">
            <div class="form-group">
              <label class="form-label">Address *</label>
              <input type="text" name="address" class="form-input" required placeholder="123 Main St, Anytown, MI">
            </div>
            <div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" name="city" class="form-input" placeholder="City">
              </div>
              <div class="form-group">
                <label class="form-label">County</label>
                <input type="text" name="county" class="form-input" placeholder="County">
              </div>
              <div class="form-group">
                <label class="form-label">Acreage</label>
                <input type="number" name="acreage" class="form-input" step="0.1" min="0" placeholder="0.0">
              </div>
              <div class="form-group">
                <label class="form-label">Asking Price</label>
                <input type="number" name="asking_price" class="form-input" min="0" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label">Zoning</label>
                <input type="text" name="zoning" class="form-input" placeholder="R-1">
              </div>
              <div class="form-group">
                <label class="form-label">Stage</label>
                <select name="stage" class="form-input">
                  <option value="new_lead">New Lead</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="site_visit">Site Visit</option>
                  <option value="offer_sent">Offer Sent</option>
                  <option value="under_contract">Under Contract</option>
                  <option value="closed">Closed</option>
                  <option value="dead">Dead</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Listing URL</label>
                <input type="url" name="listing_url" class="form-input" placeholder="https://...">
              </div>
              <div class="form-group">
                <label class="form-label">PDF URL</label>
                <input type="url" name="pdf_url" class="form-input" placeholder="https://...">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea name="notes" class="form-input" rows="3" placeholder="Notes..."></textarea>
            </div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem">
              <button type="button" class="btn btn-outline" onclick="document.getElementById('addLeadModal').remove()">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Lead</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.acreage) data.acreage = parseFloat(data.acreage);
    if (data.asking_price) data.asking_price = parseFloat(data.asking_price);
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        document.getElementById('addLeadModal').remove();
        await fetchApiLeads();
        renderPipeline();
        showToast('Lead added', 'success');
      } else {
        showToast('Failed to add lead', 'error');
      }
    } catch (e) {
      showToast('Failed to add lead', 'error');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}


// ==================== LEAD DETAIL MODAL ====================

async function openLeadDetail(leadId, type) {
  openLeadDetailId = leadId;
  openLeadDetailType = type;

  const lead = apiLeads.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('leadModal');
  const title = document.getElementById('leadModalTitle');
  const body = document.getElementById('leadModalBody');
  if (!modal || !body) return;

  title.textContent = lead.address;

  const stageClass = STAGE_COLORS[lead.stage] || 'badge-neutral';
  const stageLabel = STAGE_LABELS[lead.stage] || lead.stage;

  body.innerHTML = `
    <div class="lead-detail-section">
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
        <span class="badge ${stageClass}">${stageLabel}</span>
        ${lead.starred ? '<span class="badge badge-warning">Starred</span>' : ''}
        ${lead.feasibility_rating ? `<span class="badge badge-primary">Rating: ${escapeHtml(lead.feasibility_rating)}</span>` : ''}
      </div>
      <table style="width:100%;font-size:var(--font-size-sm)">
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">County</td><td style="text-align:right">${escapeHtml(lead.county || '—')}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">City</td><td style="text-align:right">${escapeHtml(lead.city || '—')}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Acreage</td><td style="text-align:right">${fmtAcres(lead.acreage)}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Asking Price</td><td style="text-align:right">${fmt(lead.asking_price)}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">$/Acre</td><td style="text-align:right">${lead.price_per_acre ? fmt(lead.price_per_acre) : (lead.acreage && lead.asking_price ? fmt(lead.asking_price / lead.acreage) : '—')}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Zoning</td><td style="text-align:right">${escapeHtml(lead.zoning || '—')}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Lot Yield</td><td style="text-align:right">${lead.lot_yield || '—'}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Source</td><td style="text-align:right">${escapeHtml(lead.source || '—')}</td></tr>
        <tr><td style="color:var(--color-text-secondary);padding:4px 0">Added</td><td style="text-align:right">${fmtDate(lead.created_at)}</td></tr>
      </table>
    </div>
    <div class="lead-detail-section">
      <label class="form-label">Stage</label>
      <select id="leadStageSelect" class="form-input" style="max-width:200px">
        ${Object.entries(STAGE_LABELS).map(([v, l]) => `<option value="${v}" ${lead.stage === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div class="lead-detail-section">
      <label class="form-label">Notes</label>
      <textarea id="leadNotesTextarea" class="form-input" rows="4" style="width:100%;max-width:100%">${escapeHtml(lead.notes || '')}</textarea>
    </div>
    <div class="lead-detail-actions" style="display:flex;gap:0.5rem;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="saveLeadNotes(${lead.id})">Save</button>
      ${lead.listing_url ? `<a href="${escapeHtml(lead.listing_url)}" target="_blank" rel="noopener" class="btn btn-outline">View Listing</a>` : ''}
      ${lead.pdf_url ? `<a href="${escapeHtml(lead.pdf_url)}" target="_blank" rel="noopener" class="btn btn-outline">View PDF</a>` : ''}
      <button class="btn btn-outline" onclick="toggleStar(${lead.id}); closeLeadDetail()">${lead.starred ? 'Unstar' : 'Star'}</button>
    </div>
  `;

  modal.style.display = 'flex';

  document.getElementById('leadModalClose')?.addEventListener('click', closeLeadDetail, { once: true });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLeadDetail(); }, { once: true });
}

function closeLeadDetail() {
  const modal = document.getElementById('leadModal');
  if (modal) modal.style.display = 'none';
  openLeadDetailId = null;
}

async function saveLeadNotes(leadId) {
  const notes = document.getElementById('leadNotesTextarea')?.value || '';
  const stage = document.getElementById('leadStageSelect')?.value;
  const updates = {};
  if (notes !== undefined) updates.notes = notes;
  if (stage) updates.stage = stage;
  const result = await updateLeadApi(leadId, updates);
  if (result) {
    const lead = apiLeads.find(l => l.id === leadId);
    if (lead) Object.assign(lead, result);
    renderPipeline();
    closeLeadDetail();
    showToast('Lead updated', 'success');
  } else {
    showToast('Failed to save', 'error');
  }
}


// ==================== ALERTS ====================

function renderAlerts() {
  const grid = document.getElementById('alertsGrid');
  if (!grid) return;

  if (apiAlerts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No alerts yet. Create one to get notified when new leads match your criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = apiAlerts.map(alert => {
    const isActive = alert.active === 1;
    return `
      <div class="alert-card" data-id="${alert.id}">
        <div class="alert-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:0.75rem">
          <div>
            <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:0.25rem">${escapeHtml(alert.criteria_display)}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
              ${alert.new_matches > 0 ? `<span style="color:var(--color-success);font-weight:600">${alert.new_matches} new match${alert.new_matches > 1 ? 'es' : ''}</span> · ` : ''}
              ${isActive ? '<span style="color:var(--color-success)">Active</span>' : '<span style="color:var(--color-text-muted)">Paused</span>'}
            </div>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <button class="btn btn-ghost btn-sm" onclick="toggleAlert(${alert.id}, ${isActive ? 0 : 1})">${isActive ? 'Pause' : 'Resume'}</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="deleteAlert(${alert.id})">Delete</button>
          </div>
        </div>
        <div style="font-size:11px;color:var(--color-text-muted)">
          ${alert.county ? `County: ${escapeHtml(alert.county)} · ` : ''}
          ${alert.min_acreage != null ? `Min: ${alert.min_acreage} ac · ` : ''}
          ${alert.max_acreage != null ? `Max: ${alert.max_acreage} ac · ` : ''}
          ${alert.max_price != null ? `Under ${fmt(alert.max_price)} · ` : ''}
          ${alert.zoning_filter ? escapeHtml(alert.zoning_filter) : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function toggleAlert(alertId, active) {
  try {
    await fetch(`${API_BASE}/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    await fetchApiAlerts();
    renderAlerts();
  } catch (e) {
    showToast('Failed to update alert', 'error');
  }
}

async function deleteAlert(alertId) {
  try {
    await fetch(`${API_BASE}/api/alerts/${alertId}`, { method: 'DELETE' });
    await fetchApiAlerts();
    renderAlerts();
    showToast('Alert deleted', 'success');
  } catch (e) {
    showToast('Failed to delete alert', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('newAlertBtn')?.addEventListener('click', () => {
    document.getElementById('alertModal').style.display = 'flex';
  });

  document.getElementById('alertModalClose')?.addEventListener('click', () => {
    document.getElementById('alertModal').style.display = 'none';
  });

  document.getElementById('alertModalCancel')?.addEventListener('click', () => {
    document.getElementById('alertModal').style.display = 'none';
  });

  document.getElementById('alertModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('alertModal')) {
      document.getElementById('alertModal').style.display = 'none';
    }
  });

  document.getElementById('alertForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.min_acreage) data.min_acreage = parseFloat(data.min_acreage);
    if (data.max_acreage) data.max_acreage = parseFloat(data.max_acreage);
    if (data.max_price) data.max_price = parseFloat(data.max_price);

    // Build criteria_display
    const parts = [];
    if (data.county) parts.push(data.county + ' County');
    if (data.min_acreage) parts.push(data.min_acreage + '+ acres');
    if (data.max_acreage) parts.push('under ' + data.max_acreage + ' acres');
    if (data.max_price) parts.push('under ' + fmt(data.max_price));
    if (data.zoning_filter) parts.push(data.zoning_filter);
    data.criteria_display = parts.length ? parts.join(' · ') : 'All leads';

    try {
      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        document.getElementById('alertModal').style.display = 'none';
        e.target.reset();
        await fetchApiAlerts();
        renderAlerts();
        showToast('Alert created', 'success');
      }
    } catch (err) {
      showToast('Failed to create alert', 'error');
    }
  });
});


// ==================== REPORTS ====================

function renderReports() {
  const grid = document.getElementById('reportsGrid');
  if (!grid) return;

  if (apiReports.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>No reports yet. Reports are auto-created when leads with PDF links are added.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = apiReports.map(report => `
    <div class="report-card" data-id="${report.id}">
      <div class="report-icon">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <div class="report-info">
        <div class="report-title">${escapeHtml(report.title)}</div>
        <div class="report-meta">
          ${report.county ? escapeHtml(report.county) + ' · ' : ''}
          ${fmtAcres(report.acreage)}
          ${report.feasibility_rating ? ' · Rating: ' + escapeHtml(report.feasibility_rating) : ''}
          ${report.report_date ? ' · ' + fmtDate(report.report_date) : ''}
        </div>
      </div>
      <div class="report-actions">
        ${report.pdf_url ? `<a href="${escapeHtml(report.pdf_url)}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">View PDF</a>` : ''}
        ${report.listing_url ? `<a href="${escapeHtml(report.listing_url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Listing</a>` : ''}
        <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)" onclick="deleteReport(${report.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deleteReport(reportId) {
  try {
    await fetch(`${API_BASE}/api/reports/${reportId}`, { method: 'DELETE' });
    await fetchApiReports();
    renderReports();
    showToast('Report deleted', 'success');
  } catch (e) {
    showToast('Failed to delete report', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('newReportBtn')?.addEventListener('click', () => {
    document.getElementById('reportModal').style.display = 'flex';
  });

  document.getElementById('reportModalClose')?.addEventListener('click', () => {
    document.getElementById('reportModal').style.display = 'none';
  });

  document.getElementById('reportModalCancel')?.addEventListener('click', () => {
    document.getElementById('reportModal').style.display = 'none';
  });

  document.getElementById('reportModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('reportModal')) {
      document.getElementById('reportModal').style.display = 'none';
    }
  });

  document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (data.acreage) data.acreage = parseFloat(data.acreage);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        document.getElementById('reportModal').style.display = 'none';
        e.target.reset();
        await fetchApiReports();
        renderReports();
        showToast('Report saved', 'success');
      }
    } catch (err) {
      showToast('Failed to save report', 'error');
    }
  });
});


// ==================== SETTINGS ====================

function renderSettings() {
  const container = document.getElementById('settingsContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="max-width:560px">
      <div style="margin-bottom:2rem">
        <h3 style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:1rem">Search Preferences</h3>
        <div class="form-group">
          <label class="form-label">Target Areas</label>
          <input type="text" id="targetAreasInput" class="form-input" value="${escapeHtml(appSettings.targetAreas || '')}" placeholder="Counties or regions">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Min Acreage</label>
            <input type="number" id="minAcreageInput" class="form-input" value="${appSettings.minAcreage || ''}" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label class="form-label">Max Acreage</label>
            <input type="number" id="maxAcreageInput" class="form-input" value="${appSettings.maxAcreage || ''}" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label class="form-label">Min Price ($)</label>
            <input type="number" id="minPriceInput" class="form-input" value="${appSettings.minPrice || ''}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Max Price ($)</label>
            <input type="number" id="maxPriceInput" class="form-input" value="${appSettings.maxPrice || ''}" min="0">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveSearchSettings()">Save Search Settings</button>
      </div>

      <div style="margin-bottom:2rem">
        <h3 style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:1rem">Deal Settings</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Default Margin (%)</label>
            <input type="number" id="defaultMarginInput" class="form-input" value="${appSettings.defaultMargin || ''}" min="0" max="100">
          </div>
          <div class="form-group">
            <label class="form-label">Contingency (%)</label>
            <input type="number" id="contingencyInput" class="form-input" value="${appSettings.contingencyPct || ''}" min="0" max="100">
          </div>
          <div class="form-group">
            <label class="form-label">Holding Cost Rate (%)</label>
            <input type="number" id="holdingCostRateInput" class="form-input" value="${appSettings.holdingCostRate || ''}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Holding Period (months)</label>
            <input type="number" id="holdingPeriodInput" class="form-input" value="${appSettings.holdingPeriodMonths || ''}" min="1">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveDealSettings()">Save Deal Settings</button>
      </div>

      <div style="margin-bottom:2rem">
        <h3 style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:1rem">Email Settings</h3>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="emailAddressInput" class="form-input" value="${escapeHtml(appSettings.emailAddress || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Time</label>
          <input type="time" id="deliveryTimeInput" class="form-input" value="${appSettings.deliveryTime || '05:00'}">
        </div>
        <button class="btn btn-primary" onclick="saveEmailSettings()">Save Email Settings</button>
      </div>

      <div style="margin-bottom:2rem">
        <h3 style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:1rem">Alert Settings</h3>
        <div class="form-group">
          <label class="form-label">Notification Frequency</label>
          <select id="notificationFrequencySelect" class="form-input">
            <option value="realtime" ${appSettings.notificationFrequency === 'realtime' ? 'selected' : ''}>Real-time</option>
            <option value="hourly" ${appSettings.notificationFrequency === 'hourly' ? 'selected' : ''}>Hourly digest</option>
            <option value="daily" ${appSettings.notificationFrequency === 'daily' ? 'selected' : ''}>Daily digest</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:var(--font-size-sm);cursor:pointer">
            <input type="checkbox" id="emailAlertsToggle" ${appSettings.emailAlertsOn ? 'checked' : ''} style="accent-color:var(--color-primary);width:16px;height:16px">
            Email alerts for new matching leads
          </label>
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:var(--font-size-sm);cursor:pointer">
            <input type="checkbox" id="dailyBriefingToggle" ${appSettings.dailyBriefingOn ? 'checked' : ''} style="accent-color:var(--color-primary);width:16px;height:16px">
            Daily pipeline briefing
          </label>
        </div>
        <button class="btn btn-primary" style="margin-top:1rem" onclick="saveAlertSettings()">Save Alert Settings</button>
      </div>

      <div style="margin-bottom:2rem">
        <h3 style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text);margin-bottom:1rem">Account</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="fullNameInput" class="form-input" value="${escapeHtml(appSettings.fullName || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" id="companyInput" class="form-input" value="${escapeHtml(appSettings.company || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <input type="text" id="roleInput" class="form-input" value="${escapeHtml(appSettings.role || '')}">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveAccountSettings()">Save Account</button>
      </div>
    </div>
  `;
}

async function saveSearchSettings() {
  const updates = {
    targetAreas: sanitizeInput(document.getElementById('targetAreasInput')?.value, 500),
    minAcreage: parseFloat(document.getElementById('minAcreageInput')?.value) || 0,
    maxAcreage: parseFloat(document.getElementById('maxAcreageInput')?.value) || 1000,
    minPrice: parseFloat(document.getElementById('minPriceInput')?.value) || 0,
    maxPrice: parseFloat(document.getElementById('maxPriceInput')?.value) || 10000000,
  };
  Object.assign(appSettings, updates);
  await saveSettingsToApi(appSettings);
  showToast('Search settings saved', 'success');
}

async function saveDealSettings() {
  const updates = {
    defaultMargin: parseFloat(document.getElementById('defaultMarginInput')?.value) || 25,
    contingencyPct: parseFloat(document.getElementById('contingencyInput')?.value) || 12,
    holdingCostRate: parseFloat(document.getElementById('holdingCostRateInput')?.value) || 7,
    holdingPeriodMonths: parseInt(document.getElementById('holdingPeriodInput')?.value) || 18,
  };
  Object.assign(appSettings, updates);
  await saveSettingsToApi(appSettings);
  showToast('Deal settings saved', 'success');
}

async function saveEmailSettings() {
  const updates = {
    emailAddress: sanitizeInput(document.getElementById('emailAddressInput')?.value, 200),
    deliveryTime: document.getElementById('deliveryTimeInput')?.value || '05:00',
  };
  Object.assign(appSettings, updates);
  await saveSettingsToApi(appSettings);
  showToast('Email settings saved', 'success');
}

async function saveAlertSettings() {
  const updates = {
    notificationFrequency: document.getElementById('notificationFrequencySelect')?.value || 'hourly',
    emailAlertsOn: document.getElementById('emailAlertsToggle')?.checked || false,
    dailyBriefingOn: document.getElementById('dailyBriefingToggle')?.checked || false,
  };
  Object.assign(appSettings, updates);
  await saveSettingsToApi(appSettings);
  showToast('Alert settings saved', 'success');
}

async function saveAccountSettings() {
  const updates = {
    fullName: sanitizeInput(document.getElementById('fullNameInput')?.value, 200),
    company: sanitizeInput(document.getElementById('companyInput')?.value, 200),
    role: sanitizeInput(document.getElementById('roleInput')?.value, 100),
  };
  Object.assign(appSettings, updates);
  await saveSettingsToApi(appSettings);
  showToast('Account settings saved', 'success');
}


// ==================== AI CHAT ====================

let chatMessages = [];

async function sendChatQuestion(question) {
  if (!question?.trim()) return;
  const trimmed = sanitizeInput(question, 500);
  chatMessages.push({ role: 'user', content: trimmed });
  renderChatMessages();

  try {
    const context = {
      totalLeads: apiLeads.length,
      byStage: Object.fromEntries(
        Object.entries(STAGE_LABELS).map(([s, l]) => [l, apiLeads.filter(lead => lead.stage === s).length])
      ),
      recentLeads: apiLeads.slice(0, 5).map(l => ({
        address: l.address,
        county: l.county,
        acreage: l.acreage,
        asking_price: l.asking_price,
        stage: STAGE_LABELS[l.stage] || l.stage
      }))
    };

    const systemPrompt = `You are SquareBerry AI, a helpful assistant for a Michigan land development pipeline. Current pipeline data: ${JSON.stringify(context)}`;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...chatMessages
        ]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
      chatMessages.push({ role: 'assistant', content: reply });
    } else {
      chatMessages.push({ role: 'assistant', content: 'I am unable to connect to the AI service right now. Please try again later.' });
    }
  } catch (e) {
    chatMessages.push({ role: 'assistant', content: 'I am unable to connect to the AI service right now.' });
  }

  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  container.innerHTML = chatMessages.map(msg => `
    <div class="chat-message chat-message--${msg.role}">
      <div class="chat-bubble chat-bubble--${msg.role}">${escapeHtml(msg.content)}</div>
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}


// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    info: 'var(--color-primary)',
    warning: 'var(--color-warning)'
  };

  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.background = colors[type] || colors.info;
  toast.style.color = '#fff';
  toast.style.padding = '0.75rem 1.25rem';
  toast.style.borderRadius = '8px';
  toast.style.position = 'fixed';
  toast.style.bottom = '1.5rem';
  toast.style.right = '1.5rem';
  toast.style.zIndex = '9999';
  toast.style.fontSize = 'var(--font-size-sm)';
  toast.style.fontWeight = '500';
  toast.style.boxShadow = 'var(--shadow-lg)';
  toast.style.maxWidth = '320px';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}


// ==================== GLOBAL EXPORTS (for inline handlers) ====================

window.toggleStar = toggleStar;
window.confirmDeleteLead = confirmDeleteLead;
window.executeDeleteLead = executeDeleteLead;
window.openLeadDetail = openLeadDetail;
window.closeLeadDetail = closeLeadDetail;
window.saveLeadNotes = saveLeadNotes;
window.sendChatQuestion = sendChatQuestion;
window.saveSearchSettings = saveSearchSettings;
window.saveDealSettings = saveDealSettings;
window.saveEmailSettings = saveEmailSettings;
window.saveAlertSettings = saveAlertSettings;
window.saveAccountSettings = saveAccountSettings;
