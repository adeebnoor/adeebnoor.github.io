/* Kinetic HR v0.3 — audit UI. No employee-level data is persisted here. */
function renderAudit(){
 const a=auditState();
 const trust=[
  [t('audit_ssco'),`${a.sscoVersion} · ${a.sscoMode}`,'GASTAT'],
  [t('audit_formula'),a.formula,'deterministic'],
  [t('audit_policy'),`≥ ${a.threshold}× baseline`,'event-based'],
  [t('audit_fingerprint_label'),a.fingerprint,a.contract]
 ];
 const grid=$('#audit-trust-grid');if(grid)grid.innerHTML=trust.map(([label,value,note])=>`<article class="metric-card"><span>${label}</span><strong class="audit-metric-value">${value}</strong><small>${note}</small></article>`).join('');
 const prov=$('#audit-provenance');if(prov)prov.innerHTML=`<div class="provenance-row"><div><span>${t('audit_snapshot')}</span><strong>${t('audit_count')}: ${a.snapshotCount}</strong></div><div><span>${t('audit_mode')}</span><code>${a.snapshotMode}</code></div><div><span>${t('audit_imported')}</span><strong>${a.snapshotImportedAt?new Date(a.snapshotImportedAt).toLocaleString(lang==='ar'?'ar-SA':'en-GB'):t('audit_not_imported')}</strong></div></div><div class="provenance-row"><div><span>${t('audit_events')}</span><strong>${t('audit_count')}: ${a.eventCount}</strong></div><div><span>${t('audit_mode')}</span><code>${a.eventMode}</code></div><div><span>${t('audit_imported')}</span><strong>${a.eventImportedAt?new Date(a.eventImportedAt).toLocaleString(lang==='ar'?'ar-SA':'en-GB'):t('audit_not_imported')}</strong></div></div>`;
 const fp=$('#audit-fingerprint');if(fp)fp.textContent=a.fingerprint;
 const rows=[...a.ledger].reverse(),body=$('#audit-body');
 if(body)body.innerHTML=rows.length?rows.map(x=>{const occ=sscoByCode(x.ssco),when=x.recorded_at?new Date(x.recorded_at).toLocaleString(lang==='ar'?'ar-SA':'en-GB'):'—';if(x.kind==='surveillance_alert'){const ratio=x.ratio==null?'∞':`${x.ratio}×`;return `<tr><td>${when}</td><td class="code-cell">${x.cell}</td><td>${occ?.[lang]||x.ssco||'—'}<small class="subline">SSCO ${x.ssco||'—'}</small></td><td><strong class="alert-dot">ALERT</strong> · ${x.current}/${x.baseline} (${ratio})</td><td>threshold ≥ ${x.threshold}× · ${x.formula}</td><td><code>${x.event_mode}</code> · <code>${x.source_row||'—'}</code></td></tr>`}return `<tr><td>${when}</td><td class="code-cell">—</td><td>${x.kind}</td><td>${x.count||'—'} rows</td><td>${x.formula||'—'}</td><td><code>${x.file_name||x.snapshot_mode||'—'}</code></td></tr>`}).join(''):`<tr><td colspan="6">—</td></tr>`;
}

const kineticRenderAll=renderAll;
renderAll=function(){kineticRenderAll();renderAudit()};

document.addEventListener('DOMContentLoaded',()=>{
 $('#csv-upload')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;setTimeout(()=>{if(snapshotMode==='local'){snapshotImportedAt=new Date().toISOString();recordImportAudit('snapshot',SNAPSHOTS.length,f.name);renderAudit()}},300)});
 $('#event-upload')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;setTimeout(()=>{if(eventMode==='local'){eventImportedAt=new Date().toISOString();recordImportAudit('events',HR_EVENTS.length,f.name);renderAudit()}},300)});
});
