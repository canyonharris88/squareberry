// ==================== SCOUT AGENT (Primary Landing Screen) ====================

function renderScoutAgent() {
  const container = document.getElementById('scoutContainer');
  if (!container) return;

  const s = appSettings;
  const marginPct = ((s.defaultMargin - 1) / 99) * 100;

  let sliderColor;
  if (s.defaultMargin <= 15) sliderColor = 'var(--color-success)';
  else if (s.defaultMargin <= 30) sliderColor = 'var(--color-gold)';
  else if (s.defaultMargin <= 50) sliderColor = 'var(--color-warning)';
  else sliderColor = 'var(--color-primary)';

  container.innerHTML = `
    <div class="scout-header">
      <div class="scout-title-section">
        <div class="scout-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6" opacity="0.6"/>
            <circle cx="12" cy="12" r="2"/>
            <line x1="12" y1="2" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
        <div>
          <h1 class="scout-title">Scout Agent</h1>
          <p class="scout-subtitle">Your AI-powered Michigan land intelligence assistant</p>
        </div>
      </div>
    </div>

    <div class="scout-grid">
      <!-- Search Section -->
      <div class="scout-card">
        <div class="scout-card-header">
          <i data-lucide="search" width="18" height="18"></i>
          <h2 class="scout-card-title">Search Criteria</h2>
        </div>
        <div class="scout-card-body">
          <div class="form-group">
            <label class="form-label">Target Areas</label>
            <input class="form-input" type="text" id="scoutTargetAreas" value="${escapeHtml(s.targetAreas)}" placeholder="e.g. Livingston County, Washtenaw County">
          </div>
          <div class="form-row" style="gap: var(--space-3);">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Min Acreage</label>
              <input class="form-input" type="number" id="scoutMinAcreage" value="${s.minAcreage}" style="max-width:100%;">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Max Acreage</label>
              <input class="form-input" type="number" id="scoutMaxAcreage" value="${s.maxAcreage}" style="max-width:100%;">
            </div>
          </div>
          <div class="form-row" style="gap: var(--space-3);">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Min Price</label>
              <input class="form-input" type="text" id="scoutMinPrice" value="${fmtInput(s.minPrice)}" style="max-width:100%;">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Max Price</label>
              <input class="form-input" type="text" id="scoutMaxPrice" value="${fmtInput(s.maxPrice)}" style="max-width:100%;">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Zoning Types</label>
            <div class="checkbox-group">
              <label class="checkbox-label"><input type="checkbox" data-scout-zoning="R-1" ${s.zoningTypes.includes('R-1') ? 'checked' : ''}> R-1 Single Family</label>
              <label class="checkbox-label"><input type="checkbox" data-scout-zoning="R-2" ${s.zoningTypes.includes('R-2') ? 'checked' : ''}> R-2 Two-Family</label>
              <label class="checkbox-label"><input type="checkbox" data-scout-zoning="PUD" ${s.zoningTypes.includes('PUD') ? 'checked' : ''}> PUD Planned Unit Dev</label>
              <label class="checkbox-label"><input type="checkbox" data-scout-zoning="AG" ${s.zoningTypes.includes('AG') ? 'checked' : ''}> Agricultural</label>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="saveScoutSearch()">
            <i data-lucide="save" width="14" height="14"></i> Save Search
          </button>
        </div>
      </div>

      <!-- Deal Criteria -->
      <div class="scout-card">
        <div class="scout-card-header">
          <i data-lucide="calculator" width="18" height="18"></i>
          <h2 class="scout-card-title">Deal Criteria</h2>
        </div>
        <div class="scout-card-body">
          <div class="form-group">
            <label class="form-label">Target Gross Profit</label>
            <div style="display:flex;align-items:center;gap:var(--space-3);">
              <input type="range" class="profit-slider" min="1" max="100" value="${s.defaultMargin}" id="scoutMarginSlider" style="flex:1;background:linear-gradient(to right, ${sliderColor} ${marginPct}%, var(--color-surface-offset) ${marginPct}%);">
              <span style="font-size:var(--text-sm);font-weight:600;min-width:36px;" id="scoutMarginDisplay">${s.defaultMargin}%</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Contingency %</label>
            <input class="form-input" type="number" id="scoutContingency" value="${s.contingencyPct}" style="max-width:120px;">
          </div>
          <div class="form-row" style="gap: var(--space-3);">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Holding Rate (%/yr)</label>
              <input class="form-input" type="number" id="scoutHoldingRate" value="${s.holdingCostRate}" style="max-width:100%;">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Holding Period (mo)</label>
              <input class="form-input" type="number" id="scoutHoldingPeriod" value="${s.holdingPeriodMonths}" style="max-width:100%;">
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="saveScoutDeal()">
            <i data-lucide="save" width="14" height="14"></i> Save Deal Criteria
          </button>
        </div>
      </div>

      <!-- Email & Alerts -->
      <div class="scout-card">
        <div class="scout-card-header">
          <i data-lucide="mail" width="18" height="18"></i>
          <h2 class="scout-card-title">Email & Alerts</h2>
        </div>
        <div class="scout-card-body">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-input" type="email" id="scoutEmail" value="${escapeHtml(s.emailAddress)}">
          </div>
          <div class="form-group">
            <label class="form-label">Daily Leads Count</label>
            <select class="form-input" id="scoutDailyLeads" style="max-width:160px;">
              <option ${s.dailyLeadsCount === 3 ? 'selected' : ''}>3</option>
              <option ${s.dailyLeadsCount === 5 ? 'selected' : ''}>5</option>
              <option ${s.dailyLeadsCount === 10 ? 'selected' : ''}>10</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Delivery Time</label>
            <input class="form-input" type="time" id="scoutDeliveryTime" value="${escapeHtml(s.deliveryTime)}" style="max-width:160px;">
          </div>
          <div class="form-group">
            <label class="form-label">Notification Frequency</label>
            <select class="form-input" id="scoutNotifFreq" style="max-width:200px;">
              <option ${s.notificationFrequency === 'realtime' ? 'selected' : ''} value="realtime">Real-time</option>
              <option ${s.notificationFrequency === 'hourly' ? 'selected' : ''} value="hourly">Hourly digest</option>
              <option ${s.notificationFrequency === 'daily' ? 'selected' : ''} value="daily">Daily digest</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:var(--text-xs);color:var(--color-text);">Email alerts</span>
            <label class="toggle-switch"><input type="checkbox" id="scoutEmailAlerts" ${s.emailAlertsOn ? 'checked' : ''}><span class="toggle-track"></span></label>
          </div>
          <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:var(--text-xs);color:var(--color-text);">Daily briefing email</span>
            <label class="toggle-switch"><input type="checkbox" id="scoutDailyBriefing" ${s.dailyBriefingOn ? 'checked' : ''}><span class="toggle-track"></span></label>
          </div>
          <button class="btn btn-primary btn-sm" onclick="saveScoutEmail()">
            <i data-lucide="save" width="14" height="14"></i> Save Email Settings
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="scout-card scout-card--actions">
        <div class="scout-card-header">
          <i data-lucide="zap" width="18" height="18"></i>
          <h2 class="scout-card-title">Quick Actions</h2>
        </div>
        <div class="scout-card-body">
          <button class="btn btn-secondary scout-action-btn" onclick="window.location.hash='#map'">
            <i data-lucide="map-pin" width="16" height="16"></i>
            View on Map
          </button>
          <button class="btn btn-secondary scout-action-btn" onclick="scoutGenerateReport()">
            <i data-lucide="file-text" width="16" height="16"></i>
            Generate Report
          </button>
          <button class="btn btn-secondary scout-action-btn" onclick="window.location.hash='#pipeline'">
            <i data-lucide="kanban" width="16" height="16"></i>
            View Pipeline
          </button>
          <button class="btn btn-secondary scout-action-btn" onclick="window.location.hash='#alerts'">
            <i data-lucide="bell" width="16" height="16"></i>
            Manage Alerts
          </button>
        </div>
      </div>
    </div>
  `;

  // Scout margin slider listener
  const scoutSlider = document.getElementById('scoutMarginSlider');
  const scoutDisplay = document.getElementById('scoutMarginDisplay');
  if (scoutSlider && scoutDisplay) {
    scoutSlider.addEventListener('input', () => {
      const val = parseInt(scoutSlider.value);
      scoutDisplay.textContent = `${val}%`;
      const pct = ((val - 1) / 99) * 100;
      let color;
      if (val <= 15) color = 'var(--color-success)';
      else if (val <= 30) color = 'var(--color-gold)';
      else if (val <= 50) color = 'var(--color-warning)';
      else color = 'var(--color-primary)';
      scoutSlider.style.background = `linear-gradient(to right, ${color} ${pct}%, var(--color-surface-offset) ${pct}%)`;
    });
  }

  lucide.createIcons({ nodes: [container] });
}

async function saveScoutSearch() {
  appSettings.targetAreas = sanitizeInput(document.getElementById('scoutTargetAreas')?.value, 500);
  appSettings.minAcreage = parseInt(document.getElementById('scoutMinAcreage')?.value) || 0;
  appSettings.maxAcreage = parseInt(document.getElementById('scoutMaxAcreage')?.value) || 1000;
  appSettings.minPrice = parseCurrency(document.getElementById('scoutMinPrice')?.value || '0');
  appSettings.maxPrice = parseCurrency(document.getElementById('scoutMaxPrice')?.value || '1000000');
  appSettings.zoningTypes = [...document.querySelectorAll('[data-scout-zoning]:checked')].map(el => el.dataset.scoutZoning);
  await saveSettingsToApi({
    targetAreas: appSettings.targetAreas,
    minAcreage: appSettings.minAcreage,
    maxAcreage: appSettings.maxAcreage,
    minPrice: appSettings.minPrice,
    maxPrice: appSettings.maxPrice,
    zoningTypes: appSettings.zoningTypes
  });
  showToast('Saved', 'Search criteria updated');
}

async function saveScoutDeal() {
  appSettings.defaultMargin = parseInt(document.getElementById('scoutMarginSlider')?.value) || 25;
  appSettings.contingencyPct = parseInt(document.getElementById('scoutContingency')?.value) || 12;
  appSettings.holdingCostRate = parseInt(document.getElementById('scoutHoldingRate')?.value) || 7;
  appSettings.holdingPeriodMonths = parseInt(document.getElementById('scoutHoldingPeriod')?.value) || 18;
  await saveSettingsToApi({
    defaultMargin: appSettings.defaultMargin,
    contingencyPct: appSettings.contingencyPct,
    holdingCostRate: appSettings.holdingCostRate,
    holdingPeriodMonths: appSettings.holdingPeriodMonths
  });
  showToast('Saved', 'Deal criteria updated');
}

async function saveScoutEmail() {
  appSettings.emailAddress = sanitizeInput(document.getElementById('scoutEmail')?.value, 200);
  appSettings.dailyLeadsCount = parseInt(document.getElementById('scoutDailyLeads')?.value) || 5;
  appSettings.deliveryTime = sanitizeInput(document.getElementById('scoutDeliveryTime')?.value, 10);
  appSettings.notificationFrequency = sanitizeInput(document.getElementById('scoutNotifFreq')?.value, 20);
  appSettings.emailAlertsOn = document.getElementById('scoutEmailAlerts')?.checked || false;
  appSettings.dailyBriefingOn = document.getElementById('scoutDailyBriefing')?.checked || false;
  await saveSettingsToApi({
    emailAddress: appSettings.emailAddress,
    dailyLeadsCount: appSettings.dailyLeadsCount,
    deliveryTime: appSettings.deliveryTime,
    notificationFrequency: appSettings.notificationFrequency,
    emailAlertsOn: appSettings.emailAlertsOn,
    dailyBriefingOn: appSettings.dailyBriefingOn
  });
  showToast('Saved', 'Email & alert settings updated');
}

function scoutGenerateReport() {
  const parcel = window._selectedRegridParcel || PARCELS.find(p => p.id === selectedParcelId);
  if (!parcel) {
    showToast('No Parcel Selected', 'Open the map, click a parcel, then generate a report.');
    return;
  }
  generateReport();
}


// ==================== PROFILE (with embedded Settings) ====================

function renderProfile() {
  const container = document.getElementById('profileContainer');
  if (!container) return;

  const s = appSettings;

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-large">CH</div>
      <div class="profile-info">
        <h1 class="profile-name">${escapeHtml(s.fullName || 'Canyon Harris')}</h1>
        <p class="profile-company">${escapeHtml(s.company || 'Mitch Harris Building Company')}</p>
        <p class="profile-role">${escapeHtml(s.role || 'Developer')}</p>
      </div>
    </div>

    <div class="profile-section">
      <div class="settings-tabs">
        <button class="settings-tab active" data-stab="account" onclick="switchSettingsTab('account')">Account</button>
        <button class="settings-tab" data-stab="search" onclick="switchSettingsTab('search')">Search</button>
        <button class="settings-tab" data-stab="deal" onclick="switchSettingsTab('deal')">Deal Criteria</button>
        <button class="settings-tab" data-stab="email" onclick="switchSettingsTab('email')">Email</button>
        <button class="settings-tab" data-stab="alerts" onclick="switchSettingsTab('alerts')">Alerts</button>
      </div>

      <div class="settings-pane active" id="pane-account">
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
            <div class="plan-price">$49/month &middot; Billed monthly</div>
            <div style="margin-top:var(--space-3);">
              <div class="info-row"><span class="info-label">Parcels analyzed</span><span class="info-value">142 / unlimited</span></div>
              <div class="info-row"><span class="info-label">Reports generated</span><span class="info-value">${apiReports.length} / 50</span></div>
              <div class="info-row"><span class="info-label">Saved alerts</span><span class="info-value">${apiAlerts.length} / 10</span></div>
              <div class="info-row"><span class="info-label">Renewal date</span><span class="info-value">Mar 15, 2026</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-pane" id="pane-search">
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

  lucide.createIcons({ nodes: [container] });
}

// Keep renderSettings as an alias for backward compat
function renderSettings() {
  // Settings are now inside Profile — renderProfile() handles everything
  renderProfile();
}


// ==================== GENERATE REPORT ====================

async function generateReport() {
  // Get the currently selected parcel (Regrid or legacy)
  const parcel = window._selectedRegridParcel || PARCELS.find(p => p.id === selectedParcelId);
  if (!parcel) {
    showToast('Error', 'Select a parcel first — zoom into the map and click on a Regrid parcel');
    return;
  }

  const calc = calculateFeasibility(parcel, {
    margin: appSettings.defaultMargin || 25,
    lotYield: parcel.lotYield,
    constructionCost: parcel.avgConstructionCost,
    finishedLotPrice: parcel.avgFinishedLotPrice
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const pricePerAcre = Math.round(parcel.askingPrice / parcel.acreage);
  const appreciation = parcel.lastSalePrice > 0 ? Math.round(((parcel.askingPrice - parcel.lastSalePrice) / parcel.lastSalePrice) * 100) : 0;

  const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SquareBerry Report — ${escapeHtml(parcel.address)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #1A1A1A; background: #fff; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
  .report-header { border-bottom: 3px solid #C03030; padding-bottom: 24px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; }
  .report-logo { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 22px; color: #C03030; display: flex; align-items: center; gap: 8px; }
  .report-logo img { width: 28px; height: auto; }
  .report-meta { font-size: 12px; color: #6B6B65; text-align: right; }
  h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 600; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #E0E0DA; }
  .apn { font-size: 13px; color: #6B6B65; margin-bottom: 16px; }
  .badge-row { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .badge { display: inline-flex; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 500; }
  .badge-neutral { background: #F5F5F0; color: #6B6B65; border: 1px solid #D0D0C8; }
  .badge-primary { background: rgba(192,48,48,0.07); color: #C03030; }
  .badge-success { background: rgba(43,94,58,0.07); color: #2B5E3A; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E0E0DA; font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #6B6B65; }
  .info-value { font-weight: 500; font-variant-numeric: tabular-nums; }
  .snapshot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .snapshot-item { background: #F5F5F0; border: 1px solid #D0D0C8; border-radius: 6px; padding: 12px; text-align: center; }
  .snapshot-value { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700; display: block; }
  .snapshot-label { font-size: 10px; color: #6B6B65; text-transform: uppercase; letter-spacing: 0.03em; }
  .positive { color: #2B5E3A; }
  .negative { color: #C03030; }
  .verdict-box { border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
  .verdict-box.feasible { background: rgba(43,94,58,0.07); border: 1px solid rgba(43,94,58,0.15); }
  .verdict-box.stretch { background: rgba(212,168,67,0.08); border: 1px solid rgba(212,168,67,0.15); }
  .verdict-box.unlikely { background: rgba(192,48,48,0.07); border: 1px solid rgba(192,48,48,0.15); }
  .verdict-label { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 700; }
  .verdict-label.feasible { color: #2B5E3A; }
  .verdict-label.stretch { color: #B8922A; }
  .verdict-label.unlikely { color: #C03030; }
  .verdict-detail { font-size: 12px; color: #6B6B65; margin-top: 4px; }
  .env-flag { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #E0E0DA; }
  .env-flag:last-child { border-bottom: none; }
  .env-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .env-dot.safe { background: #2B5E3A; }
  .env-dot.caution { background: #D4A843; }
  .env-dot.danger { background: #C03030; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #E0E0DA; font-size: 11px; color: #A5A59F; text-align: center; }
  .uses-list { columns: 2; list-style: none; font-size: 13px; }
  .uses-list li { padding: 4px 0; padding-left: 18px; position: relative; }
  .uses-list li::before { content: '✓'; position: absolute; left: 0; color: #2B5E3A; font-size: 12px; }
  @media print { body { padding: 20px; } }
  @media (max-width: 600px) { .snapshot-grid { grid-template-columns: repeat(2, 1fr); } .info-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-logo"><img src="./logo-sidebar.png" alt="" width="28">SquareBerry</div>
      <div style="font-size:12px; color:#6B6B65; margin-top:4px;">Land Intelligence Report</div>
    </div>
    <div class="report-meta">
      <div>Generated: ${escapeHtml(dateStr)}</div>
      <div>Prepared for: Canyon Harris</div>
      <div>MHBC · Pro Plan</div>
    </div>
  </div>

  <h1>${escapeHtml(parcel.address)}</h1>
  <p class="apn">APN: ${escapeHtml(parcel.apn)} · ${escapeHtml(parcel.township)} Twp · ${escapeHtml(parcel.county)} County</p>

  <div class="badge-row">
    <span class="badge badge-neutral">${parcel.acreage} acres</span>
    <span class="badge badge-neutral">${escapeHtml(parcel.zoning)}</span>
    <span class="badge badge-primary">${fmt(parcel.askingPrice)}</span>
    ${parcel.pipeline ? `<span class="badge badge-success">${escapeHtml(PIPELINE_STAGES.find(s => s.id === parcel.pipeline)?.label || '')}</span>` : ''}
  </div>

  <h2>Property Overview</h2>
  <div class="snapshot-grid">
    <div class="snapshot-item"><span class="snapshot-value">${fmt(parcel.askingPrice)}</span><span class="snapshot-label">Asking Price</span></div>
    <div class="snapshot-item"><span class="snapshot-value">${fmt(pricePerAcre)}</span><span class="snapshot-label">Per Acre</span></div>
    <div class="snapshot-item"><span class="snapshot-value">${parcel.lotYield}</span><span class="snapshot-label">Est. Lot Yield</span></div>
    <div class="snapshot-item"><span class="snapshot-value ${appreciation > 0 ? 'positive' : 'negative'}">${appreciation > 0 ? '+' : ''}${appreciation}%</span><span class="snapshot-label">Since Last Sale</span></div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-row"><span class="info-label">Owner</span><span class="info-value">${escapeHtml(parcel.owner)}</span></div>
      <div class="info-row"><span class="info-label">Acreage</span><span class="info-value">${parcel.acreage} acres</span></div>
      <div class="info-row"><span class="info-label">Land Value</span><span class="info-value">${fmt(parcel.landValue)}</span></div>
      <div class="info-row"><span class="info-label">Total Assessed</span><span class="info-value">${fmt(parcel.totalValue)}</span></div>
    </div>
    <div>
      <div class="info-row"><span class="info-label">Last Sale</span><span class="info-value">${fmt(parcel.lastSalePrice)}</span></div>
      <div class="info-row"><span class="info-label">Last Sale Date</span><span class="info-value">${escapeHtml(parcel.lastSaleDate)}</span></div>
      <div class="info-row"><span class="info-label">School District</span><span class="info-value">${escapeHtml(parcel.schoolDistrict)}</span></div>
      <div class="info-row"><span class="info-label">Township</span><span class="info-value">${escapeHtml(parcel.township)}</span></div>
    </div>
  </div>

  <h2>Zoning: ${escapeHtml(parcel.zoningFull)}</h2>
  <div class="info-row"><span class="info-label">Min Lot Size</span><span class="info-value">${escapeHtml(parcel.minLotSize)}</span></div>
  <div class="info-row"><span class="info-label">Min Frontage</span><span class="info-value">${escapeHtml(parcel.minFrontage)}</span></div>
  <div class="info-row"><span class="info-label">Setbacks</span><span class="info-value">F: ${escapeHtml(parcel.frontSetback)} · S: ${escapeHtml(parcel.sideSetback)} · R: ${escapeHtml(parcel.rearSetback)}</span></div>
  <div class="info-row"><span class="info-label">Max Coverage</span><span class="info-value">${escapeHtml(parcel.maxCoverage)}</span></div>
  <h3 style="font-size:13px; font-weight:600; margin-top:16px; margin-bottom:8px;">Permitted Uses</h3>
  <ul class="uses-list">${parcel.permittedUses.map(u => `<li>${escapeHtml(u)}</li>`).join('')}</ul>

  <h2>Subdivision Feasibility (at ${appSettings.defaultMargin || 25}%)</h2>
  <div class="info-row"><span class="info-label">Total Investment</span><span class="info-value">${fmt(Math.round(calc.totalInvestment))}</span></div>
  <div class="info-row"><span class="info-label">Target Revenue</span><span class="info-value">${fmt(Math.round(calc.targetRevenue))}</span></div>
  <div class="info-row"><span class="info-label">Required / Lot</span><span class="info-value">${fmt(Math.round(calc.requiredPerLot))}</span></div>
  <div class="info-row"><span class="info-label">Market Comp / Lot</span><span class="info-value">${fmt(parcel.avgFinishedLotPrice)}</span></div>

  <div class="verdict-box ${calc.verdict.toLowerCase()}">
    <div class="verdict-label ${calc.verdict.toLowerCase()}">${calc.verdict}</div>
    <div class="verdict-detail">${calc.verdictDetail}</div>
  </div>

  <h2>Environmental Flags</h2>
  <div class="env-flag"><span class="env-dot ${parcel.floodRisk === 'Minimal Risk' ? 'safe' : 'danger'}"></span><span><strong>${escapeHtml(parcel.floodZone)}</strong> — ${escapeHtml(parcel.floodRisk)}</span></div>
  <div class="env-flag"><span class="env-dot ${parcel.wetlandsAcres > 0 ? 'caution' : 'safe'}"></span><span><strong>Wetlands:</strong> ${escapeHtml(parcel.wetlands)}${parcel.wetlandsAcres > 0 ? ` (${parcel.wetlandsAcres} acres)` : ''}</span></div>
  <div class="env-flag"><span class="env-dot safe"></span><span><strong>Topography:</strong> ${escapeHtml(parcel.topography)}</span></div>
  <div class="env-flag"><span class="env-dot safe"></span><span><strong>Soil:</strong> ${escapeHtml(parcel.soilType)}</span></div>

  <div class="footer">
    <p>Generated by SquareBerry Land Intelligence · ${escapeHtml(dateStr)} · Confidential</p>
    <p style="margin-top:4px;">This report is for informational purposes only. Verify all data independently before making investment decisions.</p>
  </div>
</body>
</html>`;

  // Force download as PDF-styled HTML
  const blob = new Blob([reportHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SquareBerry-Report-${parcel.address.replace(/[^a-zA-Z0-9]/g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Push report to API
  try {
    await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${parcel.address} — Full Analysis`,
        address: parcel.address,
        acreage: parcel.acreage,
        county: parcel.county,
        file_size: `${(reportHtml.length / 1024).toFixed(1)} KB`,
        report_date: new Date().toISOString().slice(0, 10)
      })
    });
    await fetchApiReports();
    renderReports();
  } catch (e) {
    console.log('Could not save report to API');
  }

  showToast('Report Downloaded', `Report for ${parcel.address} saved to downloads`);
}


// ==================== LAYER TOGGLES ====================

function initLayerToggles() {
  document.querySelectorAll('.layer-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.layer;
      if (layer === 'streets' || layer === 'satellite') {
        document.querySelectorAll('.layer-toggle[data-layer="streets"], .layer-toggle[data-layer="satellite"]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateMapStyle();
      } else {
        btn.classList.toggle('active');
        const isActive = btn.classList.contains('active');
        toggleOverlayLayer(layer, isActive);
      }
    });
  });
}

function toggleOverlayLayer(layer, visible) {
  if (!map) return;
  const vis = visible ? 'visible' : 'none';

  if (layer === 'parcels') {
    // Toggle Regrid parcel boundary lines and fill
    if (map.getLayer('regrid-parcels-line')) {
      map.setLayoutProperty('regrid-parcels-line', 'visibility', vis);
    }
    if (map.getLayer('regrid-parcels-fill')) {
      map.setLayoutProperty('regrid-parcels-fill', 'visibility', vis);
    }
    if (map.getLayer('regrid-parcels-highlight')) {
      map.setLayoutProperty('regrid-parcels-highlight', 'visibility', vis);
    }
  }
  if (layer === 'flood') {
    // Flood zone layer — requires FEMA NFHL data source (future integration)
    if (map.getLayer('flood-zones')) {
      map.setLayoutProperty('flood-zones', 'visibility', vis);
    }
  }
  if (layer === 'wetlands') {
    // Wetlands layer — requires NWI data source (future integration)
    if (map.getLayer('wetlands-fill')) {
      map.setLayoutProperty('wetlands-fill', 'visibility', vis);
    }
  }
}


// ==================== PIPELINE ====================

function renderPipelineToolbar() {
  return `
    <div class="pipeline-toolbar">
      <div class="pipeline-toolbar-left">
        <div class="pipeline-search-wrap">
          <i data-lucide="search" width="14" height="14"></i>
          <input type="text" class="pipeline-search-input" placeholder="Search leads..." value="${escapeHtml(pipelineSearch)}" oninput="handlePipelineSearch(this.value)">
          ${pipelineSearch ? '<button class="pipeline-search-clear" onclick="handlePipelineSearch(\'\')"><i data-lucide="x" width="12" height="12"></i></button>' : ''}
        </div>
        <select class="pipeline-filter-select" onchange="handlePipelineCountyFilter(this.value)">
          <option value="">All Counties</option>
        </select>
        <select class="pipeline-sort-select" onchange="handlePipelineSort(this.value)">
          <option value="created_at-desc" ${pipelineSort === 'created_at' && pipelineSortOrder === 'desc' ? 'selected' : ''}>Newest First</option>
          <option value="created_at-asc" ${pipelineSort === 'created_at' && pipelineSortOrder === 'asc' ? 'selected' : ''}>Oldest First</option>
          <option value="asking_price-desc" ${pipelineSort === 'asking_price' && pipelineSortOrder === 'desc' ? 'selected' : ''}>Price: High → Low</option>
          <option value="asking_price-asc" ${pipelineSort === 'asking_price' && pipelineSortOrder === 'asc' ? 'selected' : ''}>Price: Low → High</option>
          <option value="acreage-desc" ${pipelineSort === 'acreage' && pipelineSortOrder === 'desc' ? 'selected' : ''}>Acreage: High → Low</option>
          <option value="acreage-asc" ${pipelineSort === 'acreage' && pipelineSortOrder === 'asc' ? 'selected' : ''}>Acreage: Low → High</option>
        </select>
      </div>
      <div class="pipeline-toolbar-right">
        <button class="btn btn-ghost btn-sm" onclick="togglePipelineBulkMode()" title="${pipelineBulkMode ? 'Exit bulk mode' : 'Bulk actions'}">
          <i data-lucide="check-square" width="14" height="14"></i>
          ${pipelineBulkMode ? 'Done' : 'Bulk'}
        </button>
        <button class="btn btn-ghost btn-sm" onclick="exportPipelineCsv()" title="Export CSV">
          <i data-lucide="download" width="14" height="14"></i>
          Export
        </button>
      </div>
    </div>
    ${pipelineBulkMode && pipelineBulkSelected.size > 0 ? `
      <div class="pipeline-bulk-bar">
        <span class="pipeline-bulk-count">${pipelineBulkSelected.size} selected</span>
        <select class="pipeline-bulk-stage-select" id="bulkStageSelect">
          ${PIPELINE_STAGES.map(s => `<option value="${s.id}">${escapeHtml(s.label)}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="applyBulkStageChange()">Move</button>
        <button class="btn btn-ghost btn-sm" onclick="clearBulkSelection()">Clear</button>
      </div>
    ` : ''}
  `;
}

function handlePipelineSearch(val) {
  pipelineSearch = val;
  renderPipeline();
  // Re-focus the search input
  const input = document.querySelector('.pipeline-search-input');
  if (input) { input.focus(); input.selectionStart = input.selectionEnd = val.length; }
}

function handlePipelineCountyFilter(val) {
  pipelineCountyFilter = val;
  renderPipeline();
}

function handlePipelineSort(val) {
  const [field, order] = val.split('-');
  pipelineSort = field;
  pipelineSortOrder = order;
  renderPipeline();
}

function togglePipelineBulkMode() {
  pipelineBulkMode = !pipelineBulkMode;
  if (!pipelineBulkMode) pipelineBulkSelected.clear();
  renderPipeline();
}

function toggleBulkSelect(leadId) {
  if (pipelineBulkSelected.has(leadId)) {
    pipelineBulkSelected.delete(leadId);
  } else {
    pipelineBulkSelected.add(leadId);
  }
  renderPipeline();
}

function clearBulkSelection() {
  pipelineBulkSelected.clear();
  renderPipeline();
}

async function applyBulkStageChange() {
  const select = document.getElementById('bulkStageSelect');
  if (!select) return;
  const newStage = select.value;
  const ids = Array.from(pipelineBulkSelected);
  if (ids.length === 0) return;

  try {
    await fetch(`${API_BASE}/api/leads/bulk-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: ids, stage: newStage })
    });
    // Update local state
    ids.forEach(id => {
      const lead = apiLeads.find(l => l.id === id);
      if (lead) lead.stage = newStage;
    });
  } catch (e) {
    console.log('Bulk stage update failed');
  }

  pipelineBulkSelected.clear();
  pipelineBulkMode = false;
  renderPipeline();
  const stageLabel = PIPELINE_STAGES.find(s => s.id === newStage)?.label || newStage;
  showToast('Bulk Update', `${ids.length} leads moved to ${stageLabel}`);
}

async function exportPipelineCsv() {
  try {
    const res = await fetch(`${API_BASE}/api/leads/export`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `squareberry-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Export', 'CSV downloaded');
  } catch (e) {
    showToast('Error', 'Could not export CSV');
  }
}

function getFilteredApiLeads() {
  let leads = apiLeads.filter(l => !archivedLeads.includes(l.id));

  // Search filter
  if (pipelineSearch) {
    const q = pipelineSearch.toLowerCase();
    leads = leads.filter(l =>
      (l.address && l.address.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.county && l.county.toLowerCase().includes(q)) ||
      (l.zoning && l.zoning.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  }

  // County filter
  if (pipelineCountyFilter) {
    leads = leads.filter(l => l.county === pipelineCountyFilter);
  }

  // Sort
  leads.sort((a, b) => {
    let va = a[pipelineSort];
    let vb = b[pipelineSort];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'string') {
      return pipelineSortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return pipelineSortOrder === 'asc' ? va - vb : vb - va;
  });

  return leads;
}

function renderPipeline() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  // Render toolbar above the board
  let toolbarContainer = document.getElementById('pipelineToolbar');
  if (!toolbarContainer) {
    toolbarContainer = document.createElement('div');
    toolbarContainer.id = 'pipelineToolbar';
    board.parentElement.insertBefore(toolbarContainer, board);
  }
  toolbarContainer.innerHTML = renderPipelineToolbar();

  // Populate county filter options
  const countySelect = toolbarContainer.querySelector('.pipeline-filter-select');
  if (countySelect) {
    const counties = [...new Set(apiLeads.filter(l => l.county).map(l => l.county))].sort();
    counties.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c + ' County';
      if (c === pipelineCountyFilter) opt.selected = true;
      countySelect.appendChild(opt);
    });
  }

  // Filtered & sorted leads
  const visibleApiLeads = getFilteredApiLeads();

  let columnsHtml = PIPELINE_STAGES.map(stage => {
    const parcelCards = PARCELS.filter(p => p.pipeline === stage.id && !archivedParcels.includes(p.id));
    const apiCards = visibleApiLeads.filter(l => l.stage === stage.id);

    const parcelHtml = parcelCards.map(card => renderKanbanCard(card)).join('');
    const apiHtml = apiCards.map(card => renderApiLeadCard(card)).join('');
    const totalCount = parcelCards.length + apiCards.length;

    return `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <span class="kanban-column-title">${escapeHtml(stage.label)}</span>
          <span class="kanban-column-count">${totalCount}</span>
        </div>
        <div class="kanban-cards" data-stage="${escapeHtml(stage.id)}" ondragover="handleDragOver(event)" ondrop="handleDrop(event)" ondragleave="handleDragLeave(event)">
          ${totalCount > 0 ? apiHtml + parcelHtml : '<div class="kanban-empty">No parcels</div>'}
        </div>
      </div>
    `;
  }).join('');

  // Archive toggle button
  const archivedCount = archivedLeads.length + archivedParcels.length;
  const archiveBtn = archivedCount > 0 ? `
    <div class="pipeline-archive-toggle">
      <button class="btn btn-ghost btn-sm" onclick="toggleShowArchived()">
        <i data-lucide="archive" width="14" height="14"></i>
        ${showArchived ? 'Hide' : 'Show'} Archived (${archivedCount})
      </button>
    </div>
  ` : '';

  // Mobile stage tabs — render a tab bar so stages are visible without side-scroll
  const activeStageId = window._activePipelineStage || PIPELINE_STAGES[0].id;
  const stageTabsHtml = `
    <div class="pipeline-stage-tabs" id="pipelineStageTabs">
      ${PIPELINE_STAGES.map(stage => {
        const apiCards = visibleApiLeads.filter(l => l.stage === stage.id);
        const parcelCards = PARCELS.filter(p => p.pipeline === stage.id && !archivedParcels.includes(p.id));
        const count = apiCards.length + parcelCards.length;
        return `<button class="pipeline-stage-tab ${stage.id === activeStageId ? 'active' : ''}" data-stage-id="${escapeHtml(stage.id)}" onclick="switchPipelineStage('${escapeHtml(stage.id)}')">${escapeHtml(stage.label)}<span class="pipeline-stage-tab-count">${count}</span></button>`;
      }).join('')}
    </div>
  `;

  board.innerHTML = stageTabsHtml + columnsHtml;

  // Apply active stage visibility on mobile
  applyPipelineStageVisibility(activeStageId);

  // Add archive toggle after the board
  const existingToggle = document.querySelector('.pipeline-archive-toggle');
  if (existingToggle) existingToggle.remove();
  if (archivedCount > 0) {
    board.insertAdjacentHTML('afterend', archiveBtn);
  }

  // Render archived section
  const existingArchived = document.getElementById('archivedSection');
  if (existingArchived) existingArchived.remove();

  if (showArchived && archivedCount > 0) {
    const archivedParcelCards = PARCELS.filter(p => archivedParcels.includes(p.id));
    const archivedApiCards = apiLeads.filter(l => archivedLeads.includes(l.id));

    let archivedHtml = '<div id="archivedSection" class="archived-section"><div class="section-heading" style="padding:0 var(--space-6); margin-bottom: var(--space-3);">Archived</div><div class="archived-cards">';
    archivedHtml += archivedParcelCards.map(p => `
      <div class="kanban-card archived-card">
        <div class="kanban-card-address">${escapeHtml(p.address)}</div>
        <div class="kanban-card-details">${p.acreage} acres · ${fmt(p.askingPrice)}</div>
        <button class="btn btn-ghost btn-sm" onclick="unarchiveParcel(${p.id})">
          <i data-lucide="undo-2" width="12" height="12"></i> Restore
        </button>
      </div>
    `).join('');
    archivedHtml += archivedApiCards.map(l => `
      <div class="kanban-card archived-card kanban-card--api">
        <div class="kanban-card-address">${escapeHtml(l.address)}${l.city ? ', ' + escapeHtml(l.city) : ''}</div>
        <div class="kanban-card-details">${l.acreage ? l.acreage + ' acres' : ''} · ${l.asking_price ? fmt(l.asking_price) : 'No price'}</div>
        <button class="btn btn-ghost btn-sm" onclick="unarchiveApiLead(${l.id})">
          <i data-lucide="undo-2" width="12" height="12"></i> Restore
        </button>
      </div>
    `).join('');
    archivedHtml += '</div></div>';

    const toggle = document.querySelector('.pipeline-archive-toggle');
    if (toggle) toggle.insertAdjacentHTML('afterend', archivedHtml);
  }

  lucide.createIcons({ nodes: [toolbarContainer] });
  lucide.createIcons({ nodes: [board] });
  const archSec = document.getElementById('archivedSection');
  if (archSec) lucide.createIcons({ nodes: [archSec] });
  const archToggle = document.querySelector('.pipeline-archive-toggle');
  if (archToggle) lucide.createIcons({ nodes: [archToggle] });
}

function renderApiLeadCard(lead) {
  const ratingClass = lead.feasibility_rating === 'Strong' ? 'success' :
    lead.feasibility_rating === 'Moderate' ? 'warning' : 'neutral';
  const ratingLabel = lead.feasibility_rating || 'Unrated';
  const price = lead.asking_price ? fmt(lead.asking_price) : 'No price';
  const acres = lead.acreage ? `${lead.acreage} acres` : '';
  const detail = [acres, price].filter(Boolean).join(' \u00b7 ');
  const daysAgo = lead.created_at ? Math.max(0, Math.floor((Date.now() - new Date(lead.created_at + 'Z').getTime()) / 86400000)) : 0;
  const pdfLink = lead.pdf_url ? `<a href="${escapeHtml(lead.pdf_url)}" target="_blank" class="kanban-card-pdf" onclick="event.stopPropagation()" title="View PDF Analysis"><i data-lucide="file-text" width="12" height="12"></i></a>` : '';
  const isStarred = lead.starred === 1;
  const isChecked = pipelineBulkSelected.has(lead.id);
  const bulkCheckbox = pipelineBulkMode ? `<label class="bulk-checkbox" onclick="event.stopPropagation()"><input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleBulkSelect(${lead.id})"><span class="bulk-checkmark"></span></label>` : '';

  return `
    <div class="kanban-card kanban-card--api ${isChecked ? 'bulk-selected' : ''}" draggable="true" data-lead-id="${lead.id}"
      ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"
      onclick="${pipelineBulkMode ? 'toggleBulkSelect(' + lead.id + ')' : 'openLeadDetail(' + lead.id + ', \'api\')'}">
      <div class="kanban-card-header">
        ${bulkCheckbox}
        <div class="kanban-card-address">${escapeHtml(lead.address)}${lead.city ? ', ' + escapeHtml(lead.city) : ''}</div>
        <div class="kanban-card-actions-row">
          <button class="kanban-star-btn ${isStarred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleStarApi(${lead.id})" title="${isStarred ? 'Unstar' : 'Star'}">
            <i data-lucide="${isStarred ? 'star' : 'star'}" width="13" height="13"></i>
          </button>
          ${pdfLink}
        </div>
      </div>
      <div class="kanban-card-details">${escapeHtml(detail)}</div>
      ${lead.county ? `<div class="kanban-card-county">${escapeHtml(lead.county)} County${lead.zoning ? ' \u00b7 ' + escapeHtml(lead.zoning) : ''}</div>` : ''}
      <div class="kanban-card-footer">
        <span class="badge badge-${ratingClass}">${escapeHtml(ratingLabel)}</span>
        <div class="kanban-card-footer-right">
          <button class="kanban-archive-btn" onclick="event.stopPropagation(); archiveApiLead(${lead.id})" title="Archive">
            <i data-lucide="archive" width="12" height="12"></i>
          </button>
          <button class="kanban-delete-btn" onclick="event.stopPropagation(); confirmDeleteLead(${lead.id}, 'api')" title="Delete">
            <i data-lucide="trash-2" width="12" height="12"></i>
          </button>
          <span class="kanban-card-days">${daysAgo}d ago</span>
        </div>
      </div>
    </div>
  `;
}

function renderKanbanCard(p) {
  const calc = calculateFeasibility(p, {
    margin: appSettings.defaultMargin || 25,
    lotYield: p.lotYield,
    constructionCost: p.avgConstructionCost,
    finishedLotPrice: p.avgFinishedLotPrice
  });

  const verdictClass = calc.verdict === 'FEASIBLE' ? 'success' : calc.verdict === 'STRETCH' ? 'warning' : 'error';

  // Check if parcel is starred (stored in local state)
  const isStarred = p._starred || false;

  return `
    <div class="kanban-card" draggable="true" data-parcel-id="${p.id}"
      ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"
      onclick="openLeadDetail(${p.id}, 'parcel')">
      <div class="kanban-card-header">
        <div class="kanban-card-address">${escapeHtml(p.address)}</div>
        <button class="kanban-star-btn ${isStarred ? 'starred' : ''}" onclick="event.stopPropagation(); toggleStarParcel(${p.id})" title="${isStarred ? 'Unstar' : 'Star'}">
          <i data-lucide="star" width="13" height="13"></i>
        </button>
      </div>
      <div class="kanban-card-details">${p.acreage} acres · ${fmt(p.askingPrice)} · ${escapeHtml(p.county)} Co.</div>
      <div class="kanban-card-footer">
        <span class="badge badge-${verdictClass}">${calc.verdict}</span>
        <div class="kanban-card-footer-right">
          <button class="kanban-archive-btn" onclick="event.stopPropagation(); archiveParcel(${p.id})" title="Archive">
            <i data-lucide="archive" width="12" height="12"></i>
          </button>
          <button class="kanban-delete-btn" onclick="event.stopPropagation(); confirmDeleteLead(${p.id}, 'parcel')" title="Delete">
            <i data-lucide="trash-2" width="12" height="12"></i>
          </button>
          <span class="kanban-card-days">${p.pipelineDays}d in stage</span>
        </div>
      </div>
    </div>
  `;
}

// Star/unstar functions
function toggleStarApi(leadId) {
  const lead = apiLeads.find(l => l.id === leadId);
  if (!lead) return;
  lead.starred = lead.starred === 1 ? 0 : 1;
  updateLeadApi(leadId, { starred: lead.starred });
  renderPipeline();
  showToast(lead.starred ? 'Starred' : 'Unstarred', lead.address);
}

function toggleStarParcel(parcelId) {
  const p = PARCELS.find(p => p.id === parcelId);
  if (!p) return;
  p._starred = !p._starred;
  renderPipeline();
}

// Archive functions
function archiveApiLead(leadId) {
  archivedLeads.push(leadId);
  renderPipeline();
  showToast('Archived', 'Lead archived');
}

function archiveParcel(parcelId) {
  archivedParcels.push(parcelId);
  const p = PARCELS.find(p => p.id === parcelId);
  if (p) p.pipeline = null;
  renderPipeline();
  renderMapStats();
  showToast('Archived', (p?.address || 'Parcel') + ' archived');
}

function unarchiveApiLead(leadId) {
  archivedLeads = archivedLeads.filter(id => id !== leadId);
  renderPipeline();
  showToast('Restored', 'Lead restored to pipeline');
}

function unarchiveParcel(parcelId) {
  archivedParcels = archivedParcels.filter(id => id !== parcelId);
  const p = PARCELS.find(p => p.id === parcelId);
  if (p) p.pipeline = 'lead';
  renderPipeline();
  renderMapStats();
  showToast('Restored', 'Parcel restored to pipeline');
}

function toggleShowArchived() {
  showArchived = !showArchived;
  renderPipeline();
}

// Delete functions
function confirmDeleteLead(id, type) {
  const name = type === 'api'
    ? (apiLeads.find(l => l.id === id)?.address || 'this lead')
    : (PARCELS.find(p => p.id === id)?.address || 'this parcel');

  let overlay = document.getElementById('deleteConfirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'deleteConfirmOverlay';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDeleteConfirm(); });
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal-content delete-confirm-modal">
      <div class="modal-header">
        <div><h3 style="margin:0;font-size:var(--text-base);">Delete Lead</h3></div>
        <button class="btn btn-ghost btn-sm" onclick="closeDeleteConfirm()" style="padding:4px;">
          <i data-lucide="x" width="16" height="16"></i>
        </button>
      </div>
      <div style="padding:var(--space-4) var(--space-5);">
        <p style="margin:0 0 var(--space-4);color:var(--color-text-secondary);font-size:var(--text-sm);">
          Permanently delete <strong>${escapeHtml(name)}</strong>? This cannot be undone.
        </p>
        <div style="display:flex;gap:var(--space-2);justify-content:flex-end;">
          <button class="btn btn-ghost btn-sm" onclick="closeDeleteConfirm()">Cancel</button>
          <button class="btn btn-sm" style="background:var(--color-error);color:white;" onclick="executeDeleteLead(${id}, '${type}')">Delete</button>
        </div>
      </div>
    </div>
  `;
  overlay.classList.add('visible');
  if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [overlay] });
}

function closeDeleteConfirm() {
  const overlay = document.getElementById('deleteConfirmOverlay');
  if (overlay) overlay.classList.remove('visible');
}

async function executeDeleteLead(id, type) {
  closeDeleteConfirm();
  if (type === 'api') {
    try {
      await fetch(`${API_BASE}/api/leads/${id}`, { method: 'DELETE' });
      apiLeads = apiLeads.filter(l => l.id !== id);
      archivedLeads = archivedLeads.filter(lid => lid !== id);
    } catch (e) {
      console.log('Could not delete lead via API');
    }
  } else {
    const idx = PARCELS.findIndex(p => p.id === id);
    if (idx !== -1) PARCELS.splice(idx, 1);
    archivedParcels = archivedParcels.filter(pid => pid !== id);
  }
  renderPipeline();
  showToast('Deleted', 'Lead permanently deleted');
}

// Lead detail modal
function openLeadDetail(id, type) {
  openLeadDetailId = id;
  openLeadDetailType = type;

  let lead, address, detail, notes, starred;

  if (type === 'api') {
    lead = apiLeads.find(l => l.id === id);
    if (!lead) return;
    address = lead.address + (lead.city ? ', ' + lead.city : '');
    detail = [
      lead.acreage ? `${lead.acreage} acres` : '',
      lead.asking_price ? fmt(lead.asking_price) : '',
      lead.county ? `${lead.county} County` : '',
      lead.zoning || ''
    ].filter(Boolean).join(' · ');
    notes = lead.notes || '';
    starred = lead.starred === 1;
  } else {
    lead = PARCELS.find(p => p.id === id);
    if (!lead) return;
    address = lead.address;
    detail = `${lead.acreage} acres · ${fmt(lead.askingPrice)} · ${lead.county} County · ${lead.zoning}`;
    notes = lead._notes || '';
    starred = lead._starred || false;
  }

  // Create modal
  let modal = document.getElementById('leadDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'leadDetailModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content lead-detail-modal">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">${escapeHtml(address)}</h3>
          <p class="modal-subtitle">${escapeHtml(detail)}</p>
        </div>
        <button class="icon-btn" onclick="closeLeadDetail()">
          <i data-lucide="x" width="18" height="18"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="lead-detail-actions">
          <button class="btn btn-lead-action" onclick="openAddNotes(${id}, '${type}')">
            <i data-lucide="notebook-pen" width="16" height="16"></i> Add Notes
          </button>
          <button class="btn btn-lead-action" onclick="generatePdfAnalysis(${id}, '${type}')">
            <i data-lucide="file-text" width="16" height="16"></i> Generate PDF Analysis
          </button>
          <button class="btn btn-lead-action" onclick="openGrossProfitCalc(${id}, '${type}')">
            <i data-lucide="percent" width="16" height="16"></i> Gross Profit %
          </button>
          <button class="btn btn-lead-action" onclick="viewLeadOnMap(${id}, '${type}')">
            <i data-lucide="map-pin" width="16" height="16"></i> View on Map
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('visible');
  lucide.createIcons({ nodes: [modal] });
}

function closeLeadDetail() {
  const modal = document.getElementById('leadDetailModal');
  if (modal) modal.classList.remove('visible');
  openLeadDetailId = null;
  openLeadDetailType = null;
}

function saveLeadNotes() {
  const input = document.getElementById('leadNotesInput');
  if (!input) return;
  const notes = sanitizeInput(input.value, 2000);

  if (openLeadDetailType === 'api') {
    const lead = apiLeads.find(l => l.id === openLeadDetailId);
    if (lead) {
      lead.notes = notes;
      updateLeadApi(lead.id, { notes });
    }
  } else {
    const p = PARCELS.find(p => p.id === openLeadDetailId);
    if (p) p._notes = notes;
  }

  showToast('Notes Saved', 'Lead notes updated');
  closeLeadDetail();
}

// ===== LEAD DETAIL ACTION BUTTONS =====

function openAddNotes(id, type) {
  closeLeadDetail();
  // Open a notes modal for this lead
  let lead;
  if (type === 'api') {
    lead = apiLeads.find(l => l.id === id);
  } else {
    lead = PARCELS.find(p => p.id === id);
  }
  if (!lead) return;

  const notes = type === 'api' ? (lead.notes || '') : (lead._notes || '');

  let modal = document.getElementById('leadDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'leadDetailModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  openLeadDetailId = id;
  openLeadDetailType = type;

  modal.innerHTML = `
    <div class="modal-content lead-detail-modal">
      <div class="modal-header">
        <h3 class="modal-title">Add Notes</h3>
        <button class="icon-btn" onclick="closeLeadDetail()">
          <i data-lucide="x" width="18" height="18"></i>
        </button>
      </div>
      <div class="modal-body">
        <textarea class="form-input lead-notes-textarea" id="leadNotesInput" placeholder="Add notes about this lead...">${escapeHtml(notes)}</textarea>
        <div class="lead-detail-actions" style="margin-top:var(--space-3)">
          <button class="btn btn-primary btn-sm" onclick="saveLeadNotes()">
            <i data-lucide="save" width="14" height="14"></i> Save Notes
          </button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add('visible');
  lucide.createIcons({ nodes: [modal] });
}

function generatePdfAnalysis(id, type) {
  showToast('Coming Soon', 'PDF Analysis generation will be available soon.');
}

function openGrossProfitCalc(id, type) {
  showToast('Coming Soon', 'Gross Profit calculator will be available soon.');
}

function viewLeadOnMap(id, type) {
  closeLeadDetail();

  // For PARCELS with coords, fly directly
  if (type === 'parcel') {
    const p = PARCELS.find(p => p.id === id);
    if (p && p.coords) {
      window.location.hash = '#map';
      setTimeout(() => {
        if (typeof map !== 'undefined' && map) {
          map.flyTo({ center: p.coords, zoom: 15, duration: 1200 });
        }
      }, 300);
      return;
    }
  }

  // For API leads, geocode the address via Mapbox then fly there
  const lead = apiLeads.find(l => l.id === id);
  if (!lead) return;

  const query = encodeURIComponent(
    [lead.address, lead.city, lead.county, lead.state || 'MI'].filter(Boolean).join(', ')
  );
  const token = window.MAPBOX_TOKEN;

  if (!token) {
    showToast('Map Unavailable', 'Mapbox token not configured.');
    return;
  }

  window.location.hash = '#map';

  fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`)
    .then(r => r.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setTimeout(() => {
          if (typeof map !== 'undefined' && map) {
            map.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
          }
        }, 300);
      } else {
        showToast('Location Not Found', 'Could not locate this address on the map.');
      }
    })
    .catch(() => {
      showToast('Geocoding Error', 'Could not look up the address location.');
    });
}

// Click pipeline card to go to map
function goToParcelFromPipeline(id) {
  window.location.hash = '#map';
  setTimeout(() => selectParcel(id), 100);
}

// Add to Pipeline function
function addToPipeline(id) {
  // For Regrid parcels, we'd need to create them as API leads first
  // For now, show a message that this feature will be available with full Regrid API
  const parcel = window._selectedRegridParcel || PARCELS.find(p => p.id === id);
  if (parcel) {
    showToast('Coming Soon', 'Adding Regrid parcels to pipeline will be available with the full Regrid API integration');
  }
}

// Drag and Drop
function handleDragStart(e) {
  e.stopPropagation();
  e.target.classList.add('dragging');
  const id = e.target.dataset.parcelId || e.target.dataset.leadId;
  const type = e.target.dataset.leadId ? 'api' : 'parcel';
  e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  let data;
  try {
    data = JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch (err) {
    console.warn('Invalid drop data');
    return;
  }
  if (!data || !data.id || !data.type) return;
  const newStage = e.currentTarget.dataset.stage;

  if (data.type === 'api') {
    const lead = apiLeads.find(l => l.id === parseInt(data.id));
    if (lead) {
      lead.stage = newStage;
      updateLeadStageApi(lead.id, newStage);
      renderPipeline();
      const stage = PIPELINE_STAGES.find(s => s.id === newStage);
      showToast('Pipeline Updated', `Moved to ${stage ? stage.label : newStage}`);
    }
  } else {
    const parcelId = parseInt(data.id);
    const parcel = PARCELS.find(p => p.id === parcelId);
    if (parcel) {
      parcel.pipeline = newStage;
      parcel.pipelineDays = 0;
      renderPipeline();
      const stage = PIPELINE_STAGES.find(s => s.id === newStage);
      showToast('Pipeline Updated', `Moved to ${stage ? stage.label : newStage}`);
    }
  }
}


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
    const metaParts = [formattedDate, acresText, countyText].filter(Boolean).join(' · ');

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


// ==================== SETTINGS (legacy — now lives inside Profile) ====================
// Individual save functions are still needed since Profile uses them

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
  const parcel = window._selectedRegridParcel || PARCELS.find(p => p.id === selectedParcelId);
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
window.openAddNotes = openAddNotes;
window.generatePdfAnalysis = generatePdfAnalysis;
window.openGrossProfitCalc = openGrossProfitCalc;
window.viewLeadOnMap = viewLeadOnMap;
window.sendChatQuestion = sendChatQuestion;
window.saveSearchSettings = saveSearchSettings;
window.saveDealSettings = saveDealSettings;
window.saveEmailSettings = saveEmailSettings;
window.saveAlertSettings = saveAlertSettings;
window.saveAccountSettings = saveAccountSettings;
window.renderScoutAgent = renderScoutAgent;
window.renderProfile = renderProfile;
window.saveScoutSearch = saveScoutSearch;
window.saveScoutDeal = saveScoutDeal;
window.saveScoutEmail = saveScoutEmail;
window.scoutGenerateReport = scoutGenerateReport;
window.switchPipelineStage = switchPipelineStage;

// ==================== MOBILE PIPELINE STAGE TABS ====================

function switchPipelineStage(stageId) {
  window._activePipelineStage = stageId;
  // Update tab active states
  document.querySelectorAll('.pipeline-stage-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.stageId === stageId);
  });
  applyPipelineStageVisibility(stageId);
}

function applyPipelineStageVisibility(stageId) {
  // On mobile: show only the column whose data-stage matches
  // On desktop: CSS keeps all columns visible regardless
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach((col, i) => {
    const cardsDiv = col.querySelector('.kanban-cards');
    const colStage = cardsDiv ? cardsDiv.dataset.stage : PIPELINE_STAGES[i]?.id;
    col.setAttribute('data-stage-id', colStage || '');
    col.classList.toggle('pipeline-stage-hidden', colStage !== stageId);
  });
}

