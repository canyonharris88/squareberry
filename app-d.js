// ==================== ALERTS ====================

function renderAlerts() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  function formatLastChecked(ts) {
    if (!ts) return 'Never';
    const d = new Date(ts + 'Z');
    const now = Date.now();
    const diffMs = now - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const alertsHtml = apiAlerts.length > 0 ? apiAlerts.map(a => `
    <div class="alert-card">
      <div class="alert-status-dot ${a.active === 1 ? 'active' : 'paused'}"></div>
      <div class="alert-info">
        <div class="alert-criteria">${escapeHtml(a.criteria_display)}</div>
        <div class="alert-meta">Last checked: ${formatLastChecked(a.last_checked)}${a.new_matches > 0 ? ` · <strong>${a.new_matches} new ${a.new_matches === 1 ? 'match' : 'matches'}</strong>` : ''}</div>
      </div>
      <div class="alert-actions">
        <label class="toggle-switch">
          <input type="checkbox" ${a.active === 1 ? 'checked' : ''} onchange="toggleAlert(${a.id}, this.checked)">
          <span class="toggle-track"></span>
        </label>
        <button class="alert-delete-btn" onclick="deleteAlert(${a.id})" title="Delete alert">
          <i data-lucide="trash-2" width="13" height="13"></i>
        </button>
      </div>
    </div>
  `).join('') : `
    <div class="empty-state" style="padding: var(--space-6) 0;">
      <div class="empty-state-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
      <div class="empty-state-title">No alerts yet</div>
      <div class="empty-state-detail">Create an alert to get notified when new leads match your criteria.</div>
    </div>
  `;

  const newAlertHtml = `
    <button class="btn btn-secondary new-alert-btn" onclick="toggleNewAlertForm()" id="newAlertToggle">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      New Alert
    </button>
    <div class="new-alert-form ${showNewAlertForm ? 'visible' : ''}" id="newAlertForm">
      <div class="form-group">
        <label class="form-label">County</label>
        <select class="form-input" id="newAlertCounty" style="max-width:100%;">
          <option>Livingston County</option>
          <option>Washtenaw County</option>
          <option>Oakland County</option>
          <option>Grand Traverse County</option>
          <option>Emmet County</option>
          <option>Antrim County</option>
          <option>Charlevoix County</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex:1;">
          <label class="form-label">Min Acreage</label>
          <input class="form-input" type="number" id="newAlertMinAcres" value="10" style="max-width:100%;">
        </div>
        <div class="form-group" style="flex:1;">
          <label class="form-label">Max Acreage</label>
          <input class="form-input" type="number" id="newAlertMaxAcres" value="50" style="max-width:100%;">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Max Price</label>
        <input class="form-input" type="text" id="newAlertMaxPrice" value="$500,000" style="max-width:100%;">
      </div>
      <div class="form-group">
        <label class="form-label">Zoning</label>
        <select class="form-input" id="newAlertZoning" style="max-width:100%;">
          <option>Any Residential</option>
          <option>R-1 Only</option>
          <option>R-2 Only</option>
          <option>PUD Only</option>
          <option>Agricultural</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-sm" onclick="createNewAlert()">Create Alert</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleNewAlertForm()">Cancel</button>
      </div>
    </div>
  `;

  list.innerHTML = newAlertHtml + alertsHtml;
  lucide.createIcons({ nodes: [list] });
}

function toggleNewAlertForm() {
  showNewAlertForm = !showNewAlertForm;
  const form = document.getElementById('newAlertForm');
  if (form) form.classList.toggle('visible', showNewAlertForm);
}

async function createNewAlert() {
  const county = sanitizeInput(document.getElementById('newAlertCounty')?.value, 100);
  const minAcres = parseFloat(document.getElementById('newAlertMinAcres')?.value) || null;
  const maxAcres = parseFloat(document.getElementById('newAlertMaxAcres')?.value) || null;
  const maxPriceStr = sanitizeInput(document.getElementById('newAlertMaxPrice')?.value, 20);
  const maxPrice = parseCurrency(maxPriceStr) || null;
  const zoning = sanitizeInput(document.getElementById('newAlertZoning')?.value, 50);

  const criteriaDisplay = `${county}, ${minAcres || '?'}-${maxAcres || '?'} acres, ${zoning}, under ${maxPriceStr || 'N/A'}`;

  try {
    const res = await fetch(`${API_BASE}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        county: county.replace(' County', ''),
        min_acreage: minAcres,
        max_acreage: maxAcres,
        max_price: maxPrice,
        zoning_filter: zoning,
        criteria_display: criteriaDisplay
      })
    });
    if (res.ok) {
      await fetchApiAlerts();
      showNewAlertForm = false;
      renderAlerts();
      showToast('Alert Created', `Watching for parcels in ${county}`);
    }
  } catch (e) {
    showToast('Error', 'Could not create alert');
  }
}

async function toggleAlert(id, active) {
  try {
    await fetch(`${API_BASE}/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: active ? 1 : 0 })
    });
    const a = apiAlerts.find(a => a.id === id);
    if (a) a.active = active ? 1 : 0;
    renderAlerts();
  } catch (e) {
    showToast('Error', 'Could not update alert');
  }
}

async function deleteAlert(id) {
  try {
    await fetch(`${API_BASE}/api/alerts/${id}`, { method: 'DELETE' });
    apiAlerts = apiAlerts.filter(a => a.id !== id);
    renderAlerts();
    showToast('Deleted', 'Alert removed');
  } catch (e) {
    showToast('Error', 'Could not delete alert');
  }
}


// ==================== REPORTS ====================

function renderReports() {
  const list = document.getElementById('reportsList');
  if (!list) return;

  if (apiReports.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
        <div class="empty-state-title">No reports yet</div>
        <div class="empty-state-detail">Reports are automatically generated when the daily cron processes new leads with PDF analyses. You can also generate a report from any parcel on the map.</div>
      </div>
    `;
    return;
  }

  list.innerHTML = apiReports.map(r => {
    const dateStr = r.report_date || (r.created_at ? r.created_at.split('T')[0] : '');
    const formattedDate = dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const ratingClass = r.feasibility_rating === 'Strong' ? 'success' : r.feasibility_rating === 'Moderate' ? 'warning' : 'neutral';
    const acresText = r.acreage ? `${r.acreage} acres` : '';
    const countyText = r.county ? `${r.county} County` : '';
    const metaParts = [formattedDate, acresText, countyText].filter(Boolean).join(' \u00b7 ');

    return `
      <div class="report-card">
        <div class="report-icon">
          <i data-lucide="file-text" width="20" height="20"></i>
        </div>
        <div class="report-info">
          <div class="report-title">${escapeHtml(r.title)}</div>
          <div class="report-meta">${escapeHtml(metaParts)}</div>
          ${r.feasibility_rating ? `<span class="badge badge-${ratingClass}" style="margin-top:4px;font-size:10px;">${escapeHtml(r.feasibility_rating)}</span>` : ''}
        </div>
        <div class="report-actions">
          ${r.pdf_url ? `<a href="${escapeHtml(r.pdf_url)}" target="_blank" class="btn btn-secondary btn-sm">View</a>` : `<button class="btn btn-secondary btn-sm" onclick="viewReport(${r.id})" disabled title="No PDF available">View</button>`}
          <button class="btn btn-ghost btn-sm" onclick="deleteReport(${r.id})" title="Delete report">
            <i data-lucide="trash-2" width="13" height="13"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons({ nodes: [list] });
}

function viewReport(reportId) {
  const report = apiReports.find(r => r.id === reportId);
  if (!report) return;

  if (report.pdf_url) {
    window.open(report.pdf_url, '_blank');
  } else {
    showToast('Report', 'No PDF URL available for this report');
  }
}

async function deleteReport(reportId) {
  try {
    await fetch(`${API_BASE}/api/reports/${reportId}`, { method: 'DELETE' });
    apiReports = apiReports.filter(r => r.id !== reportId);
    renderReports();
    showToast('Deleted', 'Report removed');
  } catch (e) {
    showToast('Error', 'Could not delete report');
  }
}


