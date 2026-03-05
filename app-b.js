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


