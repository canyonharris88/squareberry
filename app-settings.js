// ==================== SETTINGS ====================

function renderSettings() {
  const container = document.getElementById('settingsContainer');
  if (!container) return;

  const s = appSettings;

  container.innerHTML = `
    <div class="settings-tabs">
      <button class="settings-tab active" data-stab="search" onclick="switchSettingsTab('search')">Search</button>
      <button class="settings-tab" data-stab="deal" onclick="switchSettingsTab('deal')">Deal Criteria</button>
      <button class="settings-tab" data-stab="email" onclick="switchSettingsTab('email')">Email</button>
      <button class="settings-tab" data-stab="alerts" onclick="switchSettingsTab('alerts')">Alerts</button>
      <button class="settings-tab" data-stab="account" onclick="switchSettingsTab('account')">Account</button>
    </div>

    <div class="settings-pane active" id="pane-search">
      <div class="settings-section">
        <div class="settings-section-title">Search Preferences</div>
        <div class="form-group">
          <label class="form-label">Target Areas</label>
          <input class="form-input" type="text" id="settTargetAreas" value="${escapeHtml(s.targetAreas)}" placeholder="e.g. Livingston County, Washtenaw County">
        </div>
        <div class="form-row" style="gap: var(--space-3);">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Min Acreage</label>
            <input class="form-input" type="number" id="settMinAcreage" value="${s.minAcreage}" style="max-width:100%;">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Max Acreage</label>
            <input class="form-input" type="number" id="settMaxAcreage" value="${s.maxAcreage}" style="max-width:100%;">
          </div>
        </div>
        <div class="form-row" style="gap: var(--space-3);">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Min Price</label>
            <input class="form-input" type="text" id="settMinPrice" value="${fmtInput(s.minPrice)}" style="max-width:100%;">
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Max Price</label>
            <input class="form-input" type="text" id="settMaxPrice" value="${fmtInput(s.maxPrice)}" style="max-width:100%;">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Zoning Types</label>
          <div class="checkbox-group">
            <label class="checkbox-label"><input type="checkbox" data-zoning="R-1" ${s.zoningTypes.includes('R-1') ? 'checked' : ''}> R-1 Single Family</label>
            <label class="checkbox-label"><input type="checkbox" data-zoning="R-2" ${s.zoningTypes.includes('R-2') ? 'checked' : ''}> R-2 Two-Family</label>
            <label class="checkbox-label"><input type="checkbox" data-zoning="PUD" ${s.zoningTypes.includes('PUD') ? 'checked' : ''}> PUD Planned Unit Dev</label>
            <label class="checkbox-label"><input type="checkbox" data-zoning="AG" ${s.zoningTypes.includes('AG') ? 'checked' : ''}> Agricultural</label>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveSearchSettings()">Save Search Preferences</button>
      </div>
    </div>

    <div class="settings-pane" id="pane-deal">
      <div class="settings-section">
        <div class="settings-section-title">Deal Criteria</div>
        <div class="form-group">
          <label class="form-label">Default Target Gross Profit</label>
          <div style="display:flex;align-items:center;gap:var(--space-3);max-width:400px;">
            <input type="range" class="profit-slider" min="1" max="100" value="${s.defaultMargin}" id="settingsMarginSlider" style="flex:1;background:linear-gradient(to right, var(--color-gold) ${((s.defaultMargin - 1) / 99) * 100}%, var(--color-surface-offset) ${((s.defaultMargin - 1) / 99) * 100}%);">
            <span style="font-size:var(--text-sm);font-weight:600;min-width:36px;" id="settingsMarginDisplay">${s.defaultMargin}%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Contingency %</label>
          <input class="form-input" type="number" id="settContingency" value="${s.contingencyPct}" style="max-width:120px;">
        </div>
        <div class="form-group">
          <label class="form-label">Holding Cost Rate (%/year)</label>
          <input class="form-input" type="number" id="settHoldingRate" value="${s.holdingCostRate}" style="max-width:120px;">
        </div>
        <div class="form-group">
          <label class="form-label">Holding Period (months)</label>
          <input class="form-input" type="number" id="settHoldingPeriod" value="${s.holdingPeriodMonths}" style="max-width:120px;">
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveDealSettings()">Save Deal Criteria</button>
      </div>
    </div>

    <div class="settings-pane" id="pane-email">
      <div class="settings-section">
        <div class="settings-section-title">Email Preferences</div>
        <div class="form-group">
          <label class="form-label">Daily Leads Count</label>
          <select class="form-input" id="settDailyLeads" style="max-width:160px;">
            <option ${s.dailyLeadsCount === 3 ? 'selected' : ''}>3</option>
            <option ${s.dailyLeadsCount === 5 ? 'selected' : ''}>5</option>
            <option ${s.dailyLeadsCount === 10 ? 'selected' : ''}>10</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Delivery Time</label>
          <input class="form-input" type="time" id="settDeliveryTime" value="${escapeHtml(s.deliveryTime)}" style="max-width:160px;">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-input" type="email" id="settEmail" value="${escapeHtml(s.emailAddress)}">
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveEmailSettings()">Save Email Preferences</button>
      </div>
    </div>

    <div class="settings-pane" id="pane-alerts">
      <div class="settings-section">
        <div class="settings-section-title">Alert Preferences</div>
        <div class="form-group">
          <label class="form-label">Notification Frequency</label>
          <select class="form-input" id="settNotifFreq" style="max-width:200px;">
            <option ${s.notificationFrequency === 'realtime' ? 'selected' : ''} value="realtime">Real-time</option>
            <option ${s.notificationFrequency === 'hourly' ? 'selected' : ''} value="hourly">Hourly digest</option>
            <option ${s.notificationFrequency === 'daily' ? 'selected' : ''} value="daily">Daily digest</option>
          </select>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;max-width:400px;">
          <span style="font-size:var(--text-xs);color:var(--color-text);">Email alerts on/off</span>
          <label class="toggle-switch"><input type="checkbox" id="settEmailAlerts" ${s.emailAlertsOn ? 'checked' : ''}><span class="toggle-track"></span></label>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;max-width:400px;">
          <span style="font-size:var(--text-xs);color:var(--color-text);">Daily briefing email</span>
          <label class="toggle-switch"><input type="checkbox" id="settDailyBriefing" ${s.dailyBriefingOn ? 'checked' : ''}><span class="toggle-track"></span></label>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveAlertSettings()">Save Alert Preferences</button>
      </div>
    </div>

    <div class="settings-pane" id="pane-account">
      <div class="settings-section">
        <div class="settings-section-title">Account Information</div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-input" type="text" id="settFullName" value="${escapeHtml(s.fullName)}">
        </div>
        <div class="form-group">
          <label class="form-label">Company</label>
          <input class="form-input" type="text" id="settCompany" value="${escapeHtml(s.company)}">
        </div>
        <div class="form-group">
          <label class="form-label">Role</label>
          <input class="form-input" type="text" id="settRole" value="${escapeHtml(s.role)}">
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveAccountSettings()">Save Account Info</button>
      </div>
      <div class="settings-section" style="margin-top: var(--space-6);">
        <div class="settings-section-title">Current Plan</div>
        <div class="plan-card">
          <div class="plan-name">Pro Plan</div>
          <div class="plan-price">$49/month · Billed monthly</div>
          <div style="margin-top:var(--space-3);">
            <div class="info-row"><span class="info-label">Parcels analyzed</span><span class="info-value">142 / unlimited</span></div>
            <div class="info-row"><span class="info-label">Reports generated</span><span class="info-value">${apiReports.length} / 50</span></div>
            <div class="info-row"><span class="info-label">Saved alerts</span><span class="info-value">${apiAlerts.length} / 10</span></div>
            <div class="info-row"><span class="info-label">Renewal date</span><span class="info-value">Mar 15, 2026</span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Settings margin slider
  const settingsSlider = document.getElementById('settingsMarginSlider');
  const settingsDisplay = document.getElementById('settingsMarginDisplay');
  if (settingsSlider && settingsDisplay) {
    settingsSlider.addEventListener('input', () => {
      const val = parseInt(settingsSlider.value);
      settingsDisplay.textContent = `${val}%`;
      const pct = ((val - 1) / 99) * 100;
      let color;
      if (val <= 15) color = 'var(--color-success)';
      else if (val <= 30) color = 'var(--color-gold)';
      else if (val <= 50) color = 'var(--color-warning)';
      else color = 'var(--color-primary)';
      settingsSlider.style.background = `linear-gradient(to right, ${color} ${pct}%, var(--color-surface-offset) ${pct}%)`;
    });
  }
}

async function saveSearchSettings() {
  appSettings.targetAreas = sanitizeInput(document.getElementById('settTargetAreas')?.value, 500);
  appSettings.minAcreage = parseInt(document.getElementById('settMinAcreage')?.value) || 0;
  appSettings.maxAcreage = parseInt(document.getElementById('settMaxAcreage')?.value) || 1000;
  appSettings.minPrice = parseCurrency(document.getElementById('settMinPrice')?.value || '0');
  appSettings.maxPrice = parseCurrency(document.getElementById('settMaxPrice')?.value || '1000000');
  appSettings.zoningTypes = [...document.querySelectorAll('[data-zoning]:checked')].map(el => el.dataset.zoning);
  await saveSettingsToApi({
    targetAreas: appSettings.targetAreas,
    minAcreage: appSettings.minAcreage,
    maxAcreage: appSettings.maxAcreage,
    minPrice: appSettings.minPrice,
    maxPrice: appSettings.maxPrice,
    zoningTypes: appSettings.zoningTypes
  });
  showToast('Saved', 'Search preferences updated');
}

async function saveDealSettings() {
  appSettings.defaultMargin = parseInt(document.getElementById('settingsMarginSlider')?.value) || 25;
  appSettings.contingencyPct = parseInt(document.getElementById('settContingency')?.value) || 12;
  appSettings.holdingCostRate = parseInt(document.getElementById('settHoldingRate')?.value) || 7;
  appSettings.holdingPeriodMonths = parseInt(document.getElementById('settHoldingPeriod')?.value) || 18;
  await saveSettingsToApi({
    defaultMargin: appSettings.defaultMargin,
    contingencyPct: appSettings.contingencyPct,
    holdingCostRate: appSettings.holdingCostRate,
    holdingPeriodMonths: appSettings.holdingPeriodMonths
  });
  showToast('Saved', 'Deal criteria updated');
}

async function saveEmailSettings() {
  appSettings.dailyLeadsCount = parseInt(document.getElementById('settDailyLeads')?.value) || 5;
  appSettings.deliveryTime = sanitizeInput(document.getElementById('settDeliveryTime')?.value, 10);
  appSettings.emailAddress = sanitizeInput(document.getElementById('settEmail')?.value, 200);
  await saveSettingsToApi({
    dailyLeadsCount: appSettings.dailyLeadsCount,
    deliveryTime: appSettings.deliveryTime,
    emailAddress: appSettings.emailAddress
  });
  showToast('Saved', 'Email preferences updated');
}

async function saveAlertSettings() {
  appSettings.notificationFrequency = sanitizeInput(document.getElementById('settNotifFreq')?.value, 20);
  appSettings.emailAlertsOn = document.getElementById('settEmailAlerts')?.checked || false;
  appSettings.dailyBriefingOn = document.getElementById('settDailyBriefing')?.checked || false;
  await saveSettingsToApi({
    notificationFrequency: appSettings.notificationFrequency,
    emailAlertsOn: appSettings.emailAlertsOn,
    dailyBriefingOn: appSettings.dailyBriefingOn
  });
  showToast('Saved', 'Alert preferences updated');
}

async function saveAccountSettings() {
  appSettings.fullName = sanitizeInput(document.getElementById('settFullName')?.value, 100);
  appSettings.company = sanitizeInput(document.getElementById('settCompany')?.value, 200);
  appSettings.role = sanitizeInput(document.getElementById('settRole')?.value, 100);
  await saveSettingsToApi({
    fullName: appSettings.fullName,
    company: appSettings.company,
    role: appSettings.role
  });
  showToast('Saved', 'Account information updated');
}

function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.toggle('active', t.dataset.stab === tab));
  document.querySelectorAll('.settings-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
}


// ==================== TOAST NOTIFICATIONS ====================

function showToast(title, message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}


// ==================== FEASIBILITY MODE SWITCH ====================

function switchFeasibilityMode(mode) {
  feasibilityState.mode = mode;
  const parcel = PARCELS.find(p => p.id === selectedParcelId);
  if (parcel) {
    renderTabContent(parcel, 'feasibility');
    initFeasibilityListeners(parcel);
  }
}


// ==================== UTILITIES ====================

function fmt(num) {
  if (num === 0) return '$0';
  return '$' + num.toLocaleString('en-US');
}

function fmtCompact(num) {
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return '$' + Math.round(num / 1000) + 'K';
  return '$' + num;
}

function fmtInput(num) {
  if (num === null || num === undefined) return '$0';
  return '$' + num.toLocaleString('en-US');
}

function parseCurrency(str) {
  return parseInt(String(str).replace(/[^0-9]/g, '')) || 0;
}

// Make functions global
window.handleDragStart = handleDragStart;
window.handleDragEnd = handleDragEnd;
window.handleDragOver = handleDragOver;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.toggleAlert = toggleAlert;
window.deleteAlert = deleteAlert;
window.deleteReport = deleteReport;
window.handlePipelineSearch = handlePipelineSearch;
window.handlePipelineCountyFilter = handlePipelineCountyFilter;
window.handlePipelineSort = handlePipelineSort;
window.togglePipelineBulkMode = togglePipelineBulkMode;
window.toggleBulkSelect = toggleBulkSelect;
window.clearBulkSelection = clearBulkSelection;
window.applyBulkStageChange = applyBulkStageChange;
window.exportPipelineCsv = exportPipelineCsv;
window.switchSettingsTab = switchSettingsTab;
window.selectParcelFromSearch = selectParcelFromSearch;
window.goToParcelFromPipeline = goToParcelFromPipeline;
window.addToPipeline = addToPipeline;
window.switchFeasibilityMode = switchFeasibilityMode;
window.toggleNewAlertForm = toggleNewAlertForm;
window.createNewAlert = createNewAlert;
window.showToast = showToast;
window.fitToParcels = fitToParcels;
window.generateReport = generateReport;
window.viewReport = viewReport;
window.toggleStarApi = toggleStarApi;
window.toggleStarParcel = toggleStarParcel;
window.archiveApiLead = archiveApiLead;
window.archiveParcel = archiveParcel;
window.unarchiveApiLead = unarchiveApiLead;
window.unarchiveParcel = unarchiveParcel;
window.toggleShowArchived = toggleShowArchived;
window.confirmDeleteLead = confirmDeleteLead;
window.closeDeleteConfirm = closeDeleteConfirm;
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
