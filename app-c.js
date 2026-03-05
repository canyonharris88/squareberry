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
        <button class="chat-suggestion" onclick="sendChatQuestion('What\'s the wetland risk?')">Wetland risk?</button>
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


// ==================== GENERATE REPORT ====================

async function generateReport() {
  const parcel = PARCELS.find(p => p.id === selectedParcelId);
  if (!parcel) {
    showToast('Error', 'Select a parcel first');
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
  .uses-list li::before { content: '\u2713'; position: absolute; left: 0; color: #2B5E3A; font-size: 12px; }
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

  // Open in new tab
  const blob = new Blob([reportHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');

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

  showToast('Report Generated', `Report for ${parcel.address} opened in new tab`);
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
      }
    });
  });
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

  board.innerHTML = columnsHtml;

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
    ].filter(Boolean).join(' \u00b7 ');
    notes = lead.notes || '';
    starred = lead.starred === 1;
  } else {
    lead = PARCELS.find(p => p.id === id);
    if (!lead) return;
    address = lead.address;
    detail = `${lead.acreage} acres \u00b7 ${fmt(lead.askingPrice)} \u00b7 ${lead.county} County \u00b7 ${lead.zoning}`;
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
        <div class="lead-detail-section">
          <label class="form-label">Notes</label>
          <textarea class="form-input lead-notes-textarea" id="leadNotesInput" placeholder="Add notes about this lead...">${escapeHtml(notes)}</textarea>
        </div>
        <div class="lead-detail-actions">
          <button class="btn btn-primary btn-sm" onclick="saveLeadNotes()">
            <i data-lucide="save" width="14" height="14"></i> Save Notes
          </button>
          ${type === 'parcel' ? `<button class="btn btn-secondary btn-sm" onclick="closeLeadDetail(); goToParcelFromPipeline(${id})">
            <i data-lucide="map-pin" width="14" height="14"></i> View on Map
          </button>` : ''}
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

// Click pipeline card to go to map
function goToParcelFromPipeline(id) {
  window.location.hash = '#map';
  setTimeout(() => selectParcel(id), 100);
}

// Add to Pipeline function
function addToPipeline(id) {
  const parcel = PARCELS.find(p => p.id === id);
  if (parcel) {
    parcel.pipeline = 'lead';
    parcel.pipelineDays = 0;
    renderPipeline();
    renderMapStats();

    const pipelineBadge = document.getElementById('panelPipeline');
    if (pipelineBadge) {
      pipelineBadge.textContent = 'Lead';
      pipelineBadge.style.display = 'inline-flex';
    }
    const addBtn = document.getElementById('addToPipelineBtn');
    if (addBtn) addBtn.style.display = 'none';

    showToast('Added to Pipeline', `${parcel.address} added as Lead`);
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


