/**
 * MITS Campus 2D Landmark Coordinate Dataset (Archival / Reference)
 * Note: Interactive campus location picking on forms is powered by
 * js/campus-locations.js and js/location-picker.js.
 */
const LANDMARKS=[
{id:'gate',name:'Main Entrance Gate',short:'Main Gate',x:205,y:530,w:105,h:45,cx:258,cy:552},
{id:'main',name:'Main Building Block',short:'Main Building',x:455,y:430,w:145,h:82,cx:528,cy:471},
{id:'admin',name:'Administrative Block',short:'Administration',x:405,y:365,w:105,h:55,cx:458,cy:392},
{id:'library',name:'Central Library',short:'Central Library',x:540,y:355,w:110,h:58,cx:595,cy:384},
{id:'canteen',name:'Canteen',short:'Canteen',x:365,y:500,w:82,h:48,cx:406,cy:524},
{id:'drone',name:'Drone School',short:'Drone School',x:285,y:330,w:82,h:48,cx:326,cy:354},
{id:'arch',name:'Architecture Department',short:'Architecture',x:650,y:325,w:110,h:55,cx:705,cy:352},
{id:'workshop',name:'Workshops',short:'Workshops',x:385,y:445,w:80,h:50,cx:425,cy:470},
{id:'football',name:'Football Ground',short:'Football Ground',x:720,y:300,w:170,h:82,cx:805,cy:341,field:true},
{id:'cricket',name:'Cricket Ground',short:'Cricket Ground',x:755,y:440,w:175,h:88,cx:842,cy:484,field:true},
{id:'hostel3',name:'Hostel Block 3',short:'Hostel 3',x:575,y:205,w:88,h:48,cx:619,cy:229},
{id:'girls1',name:'Girls Hostel 1',short:'Girls Hostel 1',x:705,y:180,w:95,h:48,cx:753,cy:204},
{id:'girls2',name:'Girls Hostel 2',short:'Girls Hostel 2',x:820,y:220,w:95,h:48,cx:868,cy:244},
{id:'hostel1',name:'Hostel Block 1',short:'Hostel 1',x:680,y:260,w:95,h:48,cx:728,cy:284},
{id:'hostel2',name:'Hostel Block 2',short:'Hostel 2',x:805,y:285,w:95,h:48,cx:853,cy:309},
{id:'hostel4',name:'Hostel Block 4',short:'Hostel 4',x:840,y:355,w:95,h:48,cx:888,cy:379},
{id:'diamond',name:'Diamond Jubilee Gate',short:'Jubilee Gate',x:920,y:535,w:110,h:45,cx:975,cy:557},
{id:'upcoming',name:'Upcoming Infrastructure',short:'Upcoming',x:555,y:285,w:92,h:48,cx:601,cy:309}
];
const REPORT_POSITION={
  library:[595,384],central_library:[595,384],
  main:[528,471],academic:[528,471],admin:[458,392],canteen:[406,524],
  main_gate:[258,552],gate:[258,552],diamond:[975,557],jubilee_gate:[975,557],
  sac:[528,471],tp_cell:[528,471],workshops:[425,470],workshop:[425,470],
  drone:[326,354],drone_school:[326,354],arch:[705,352],
  main_gf_conclave:[528,471],main_gf_lt:[528,471],main_gf_sh:[528,471],main_gf_dir:[458,392],main_gf_arch_dept:[705,352],main_gf_civil:[528,471],main_gf_studios:[705,352],main_gf_girls_common:[528,471],
  main_ff_cloud_lab:[528,471],main_ff_ml_lab:[528,471],main_ff_ds_lab:[528,471],main_ff_hardware_lab:[528,471],main_ff_it_dept:[528,471],main_ff_exam:[458,392],main_ff_drawing:[528,471],main_ff_classrooms:[528,471],main_ff_sh:[528,471],
  main_sf_et_dept:[528,471],main_sf_comm_lab:[528,471],main_sf_proj_lab:[528,471],main_sf_exam_room:[458,392],
  ai_gf_ciot:[458,392],ai_gf_rooms:[458,392],ai_ff_dept:[458,392],ai_sf_provc:[458,392],
  hostel:[728,284],hostel1:[728,284],hostel_b1:[728,284],hostel2:[853,309],hostel_b2:[853,309],
  hostel3:[619,229],hostel_b3:[619,229],hostel4:[888,379],hostel_b4:[888,379],
  girls1:[753,204],hostel_g1:[753,204],girls2:[868,244],hostel_g2:[868,244],
  sports:[842,484],football:[805,341],sports_football:[805,341],cricket:[842,484],sports_cricket:[842,484]
};
let mapView={x:0,y:0,w:1200,h:760},activeFilter='all';
function getReportPosition(report,index){const base=REPORT_POSITION[report.locationKey]||REPORT_POSITION.main;const offsets=[[0,0],[-18,15],[19,-14],[28,10],[-28,-8],[10,28]];const [dx,dy]=offsets[index%offsets.length];return [base[0]+dx,base[1]+dy]}
function drawCampus(){const g=document.getElementById('campusBuildings'),labels=document.getElementById('mapLabels');if(!g||!labels)return;g.innerHTML=LANDMARKS.map(l=>{if(l.field)return `<g class="landmark-group field-landmark" data-landmark="${l.id}" tabindex="0"><rect class="field" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="18"></rect><ellipse class="field-inner" cx="${l.cx}" cy="${l.cy}" rx="24" ry="15"></ellipse><rect class="field-line" x="${l.x+12}" y="${l.y+12}" width="${l.w-24}" height="${l.h-24}" rx="12"></rect></g>`;return `<g class="landmark-group" data-landmark="${l.id}" tabindex="0"><polygon class="building-side" points="${l.x+8},${l.y+l.h} ${l.x+l.w+8},${l.y+l.h} ${l.x+l.w},${l.y+l.h-8} ${l.x},${l.y+l.h-8}"></polygon><rect class="building" x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h-8}" rx="5"></rect><rect class="building-roof" x="${l.x+7}" y="${l.y+7}" width="${Math.max(20,l.w-14)}" height="6" rx="3"></rect></g>`}).join('');labels.innerHTML=LANDMARKS.map(l=>`<text class="building-label ${l.field?'field-label':''}" x="${l.cx}" y="${l.cy}" text-anchor="middle" dominant-baseline="middle">${escapeHTML(l.short)}</text>`).join('');g.querySelectorAll('[data-landmark]').forEach(el=>{el.addEventListener('click',()=>selectLandmark(el.dataset.landmark));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectLandmark(el.dataset.landmark)}})})}
function drawMarkers(){const g=document.getElementById('reportMarkers');if(!g)return;const reports=getReports().filter(r=>activeFilter==='all'||r.type===activeFilter),grouped={};g.innerHTML=reports.map(r=>{const key=r.locationKey||'main',idx=grouped[key]||0;grouped[key]=idx+1;const [x,y]=getReportPosition(r,idx);return `<g class="report-marker ${r.type}" data-id="${r.id}" transform="translate(${x} ${y})" tabindex="0" aria-label="${escapeHTML(r.name)}"><circle class="marker-halo" r="19"></circle><path class="marker-pin" d="M0 20 C-2 16 -13 7 -13 -2 A13 13 0 1 1 13 -2 C13 7 2 16 0 20Z"></path><circle class="marker-core" r="9"></circle><text y="1" text-anchor="middle" dominant-baseline="middle">${r.type==='lost'?'!':'✓'}</text></g>`}).join('');g.querySelectorAll('[data-id]').forEach(el=>{const show=()=>selectReport(Number(el.dataset.id));el.addEventListener('click',show);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}})})}
function selectLandmark(id){const l=LANDMARKS.find(x=>x.id===id);if(!l)return;document.querySelectorAll('.landmark-group').forEach(x=>x.classList.toggle('selected',x.dataset.landmark===id));const near=getReports().filter(r=>(r.locationKey||'')===id||(id==='main'&&r.locationKey==='academic'));document.getElementById('selectedTitle').textContent=l.name;document.getElementById('selectedText').textContent=near.length?`${near.length} report${near.length===1?'':'s'} associated with this location.`:'No current reports are associated with this landmark.';document.getElementById('nearbyList').innerHTML=near.length?near.map(r=>`<button class="nearby-item" type="button" data-report-id="${r.id}"><span class="nearby-dot ${r.type}"></span><span><strong>${escapeHTML(r.name)}</strong><small>${r.type==='lost'?'Lost':'Found'} · ${escapeHTML(r.time||'Recently')}</small></span></button>`).join(''):'<div class="nearby-empty">No active reports here.</div>';document.querySelectorAll('[data-report-id]').forEach(btn=>btn.addEventListener('click',()=>selectReport(Number(btn.dataset.reportId))))}
function selectReport(id){const r=getReports().find(x=>x.id===id);if(!r)return;document.querySelectorAll('.landmark-group').forEach(x=>x.classList.remove('selected'));const landmarkId=r.locationKey==='academic'?'main':r.locationKey;if(landmarkId)document.querySelector(`[data-landmark="${landmarkId}"]`)?.classList.add('selected');document.getElementById('selectedTitle').textContent=r.name;document.getElementById('selectedText').textContent=`${r.type==='lost'?'Lost':'Found'} at ${r.location}. ${r.description}`;document.getElementById('nearbyList').innerHTML=`<div class="selected-report"><span class="status-mini ${r.type}">${r.type==='lost'?'LOST':'FOUND'}</span><strong>${escapeHTML(r.categoryLabel||r.category||'Item')}</strong><small>${escapeHTML(r.time||'Recently')}</small></div>`}
function resetSelection(){document.querySelectorAll('.landmark-group').forEach(x=>x.classList.remove('selected'));document.getElementById('selectedTitle').textContent='MITS Campus';document.getElementById('selectedText').textContent='Select a landmark or report marker to see nearby activity.';document.getElementById('nearbyList').innerHTML=''}
function zoomMap(factor){const svg=document.getElementById('campusSvg');if(!svg)return;const newW=Math.max(760,Math.min(1200,mapView.w/factor)),newH=Math.max(480,Math.min(760,mapView.h/factor));mapView.x=Math.max(0,Math.min(1200-newW,mapView.x+(mapView.w-newW)/2));mapView.y=Math.max(0,Math.min(760-newH,mapView.y+(mapView.h-newH)/2));mapView.w=newW;mapView.h=newH;svg.setAttribute('viewBox',`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`)}
function resetMapView(){mapView={x:0,y:0,w:1200,h:760};document.getElementById('campusSvg')?.setAttribute('viewBox','0 0 1200 760')}
function searchLandmark(query){const q=query.trim().toLowerCase();if(!q){resetSelection();return}const found=LANDMARKS.find(l=>l.name.toLowerCase().includes(q)||l.short.toLowerCase().includes(q));if(found)selectLandmark(found.id)}
document.addEventListener('DOMContentLoaded',()=>{drawCampus();drawMarkers();document.getElementById('mapSearch')?.addEventListener('input',e=>searchLandmark(e.target.value));document.querySelectorAll('[data-map-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-map-filter]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.mapFilter;drawMarkers()}));document.getElementById('zoomIn')?.addEventListener('click',()=>zoomMap(1.18));document.getElementById('zoomOut')?.addEventListener('click',()=>zoomMap(1/1.18));document.getElementById('resetMap')?.addEventListener('click',()=>{resetMapView();resetSelection()})});
