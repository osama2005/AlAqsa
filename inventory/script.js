/* ============================================
   نظام إدارة المخزون - مستشفى شهداء الأقصى
   ============================================ */

// ---- Helpers ----
function safeParse(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v != null ? v : fallback; } catch(e) { return fallback; }
}

function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function today() {
    const d = new Date();
    return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()];
}

function dateStr() {
    return new Date().toLocaleDateString('ar-EG');
}

function showToast(msg, type) {
    const c = document.getElementById('toastContainer') || (() => {
        const el = document.createElement('div'); el.id = 'toastContainer'; el.className = 'toast-container';
        document.body.appendChild(el); return el;
    })();
    const t = document.createElement('div'); t.className = 'toast ' + (type || 'info'); t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,5);
}

// ---- Color Customization System ----
const COLORS = ['', '#ffcdd2','#f8bbd0','#e1bee7','#bbdefb','#b3e5fc','#b2dfdb','#c8e6c9','#fff9c4','#ffe0b2','#ffccbc','#d7ccc8','#f5f5f5'];

const SECT_KEYS = { inventory:['code','ministryCode','name','unit','category','type','openingBalance','totalIn','totalOut','remaining','price','notes'], incoming:['day','date','code','ministryCode','name','unit','category','type','qty','source','price','total','notes'], outgoing:['day','date','code','ministryCode','name','unit','category','type','qty','destination','price','total','notes'], loan:['code','ministryCode','name','unit','category','openingBalance','totalIn','totalOut','remaining'], loanIncoming:['day','date','code','name','qty','source','price','total'], kahana:['name','category','details','notes'] };
const SECT_DISPLAY = { inventory:['كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','رصيد أول','الوارد','الصادر','المتبقي','السعر','ملاحظات'], incoming:['اليوم','التاريخ','كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','الكمية','الجهة','السعر','الإجمالي','ملاحظات'], outgoing:['اليوم','التاريخ','كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','الكمية','الجهة','السعر','الإجمالي','ملاحظات'], loan:['كود','كود وزارة','الاسم','الوحدة','التصنيف','رصيد أول','الوارد','الصادر','المتبقي'], loanIncoming:['اليوم','التاريخ','كود','الاسم','الكمية','الجهة','السعر','الإجمالي'], kahana:['الاسم','التصنيف','التفاصيل','ملاحظات'] };

let colColors = safeParse('_colColors', {});

function saveColColors() { localStorage.setItem('_colColors', JSON.stringify(colColors)); }

function rowStyle(item) {
    if (!item._color) return '';
    return `style="background:${item._color}"`;
}

function tdStyle(item, section, colKey) {
    if (item._cellColors && item._cellColors[colKey]) return `style="color:${item._cellColors[colKey]}"`;
    if (colColors[section] && colColors[section][colKey]) return `style="color:${colColors[section][colKey]}"`;
    if (item._textColor) return `style="color:${item._textColor}"`;
    return '';
}

function getColorBtn(item, section, i) {
    const c = item._color || '';
    return `<button class="action-btn color-btn" onclick="showRowColorPicker('${section}',${i})" style="background:${c || 'rgba(0,0,0,0.04)'};border:1px solid ${c || 'rgba(0,0,0,0.08)'};border-radius:9px;width:30px;height:30px;font-size:11px;display:inline-flex;align-items:center;justify-content:center;transition:0.25s" title="لون الصف"><i class="fas fa-palette"></i></button>`;
}

function showRowColorPicker(section, index) {
    const arr = SECT_MAP[section];
    if (!arr || !arr[index]) return;
    const item = arr[index];
    const curBg = item._color || '';
    const curTx = item._textColor || '';
    const swatch = (c, sel) => `<button onclick="setRowColor('${section}',${index},'${c}')" style="width:36px;height:36px;border-radius:6px;border:${c===sel?'3px solid #333':'2px solid #ddd'};background:${c||'#fff'};cursor:pointer;font-size:14px">${c?'':'<i class="fas fa-xmark"></i>'}</button>`;
    openModal(`لون الصف - ${esc(item.name||item.code||'')}`, `
        <div style="margin-bottom:12px"><strong>لون الخلفية:</strong></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:15px">${COLORS.map(c=>swatch(c,curBg)).join('')}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:15px">
            <input type="color" id="crBg" value="${curBg||'#ffffff'}" style="width:50px;height:36px;border:none;cursor:pointer">
            <button class="save-btn" onclick="setRowColor('${section}',${index},document.getElementById('crBg').value)" style="padding:6px 12px;font-size:12px">تطبيق</button>
        </div>
        <div style="margin-bottom:12px"><strong>لون النص:</strong></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:15px">
            <button onclick="setRowTextColor('${section}',${index},'')" style="width:36px;height:36px;border-radius:6px;border:2px solid #ddd;background:#fff;cursor:pointer;font-size:14px" title="إزالة"><i class="fas fa-xmark"></i></button>
            <button onclick="setRowTextColor('${section}',${index},'#000')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#000'?'3px solid #333':'2px solid #ddd'};background:#000;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#fff')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#fff'?'3px solid #333':'2px solid #ddd'};background:#fff;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#333')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#333'?'3px solid #333':'2px solid #ddd'};background:#333;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#e74c3c')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#e74c3c'?'3px solid #333':'2px solid #ddd'};background:#e74c3c;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#2980b9')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#2980b9'?'3px solid #333':'2px solid #ddd'};background:#2980b9;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#27ae60')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#27ae60'?'3px solid #333':'2px solid #ddd'};background:#27ae60;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#8e44ad')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#8e44ad'?'3px solid #333':'2px solid #ddd'};background:#8e44ad;cursor:pointer"></button>
            <button onclick="setRowTextColor('${section}',${index},'#e67e22')" style="width:36px;height:36px;border-radius:6px;border:${curTx==='#e67e22'?'3px solid #333':'2px solid #ddd'};background:#e67e22;cursor:pointer"></button>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
            <input type="color" id="crTx" value="${curTx||'#000000'}" style="width:50px;height:36px;border:none;cursor:pointer">
            <button class="save-btn" onclick="setRowTextColor('${section}',${index},document.getElementById('crTx').value)" style="padding:6px 12px;font-size:12px">تطبيق</button>
        </div>
    `);
}

function setRowColor(section, index, color) {
    const arr = SECT_MAP[section]; if (!arr || !arr[index]) return;
    arr[index]._color = color || undefined; save(); renderAll(); closeModal();
}

function setRowTextColor(section, index, color) {
    const arr = SECT_MAP[section]; if (!arr || !arr[index]) return;
    arr[index]._textColor = color || undefined; save(); renderAll(); closeModal();
}

function setColColor(section, colKey, color) {
    if (!colColors[section]) colColors[section] = {};
    colColors[section][colKey] = color || undefined;
    if (!colColors[section][colKey]) delete colColors[section][colKey];
    saveColColors(); renderAll(); closeModal();
}

function setCellColor(section, index, colKey, color) {
    const arr = SECT_MAP[section]; if (!arr || !arr[index]) return;
    if (!arr[index]._cellColors) arr[index]._cellColors = {};
    arr[index]._cellColors[colKey] = color || undefined;
    if (!arr[index]._cellColors[colKey]) delete arr[index]._cellColors[colKey];
    save(); renderAll(); closeModal();
}

// ---- HeroUI Color Panel ----
function showColorsPanel() {
    const sect = getActiveSection();
    openModal('<i class="fas fa-palette"></i> تخصيص الألوان', `
        <div class="cp-hero">
            <div class="cp-hero-selector" style="margin-bottom:14px">
                <label>القسم:</label>
                <select id="cpSect" onchange="changeHeroSect()">
                    ${['inventory','incoming','outgoing','loan','loanIncoming','kahana'].map(v =>
                        `<option value="${v}" ${sect===v?'selected':''}>${v==='inventory'?'المخزون':v==='incoming'?'الوارد':v==='outgoing'?'الصادر':v==='loan'?'الإعارة':v==='loanIncoming'?'وارد الإعارة':'الكهنة'}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="cp-hero-tabs">
                <button class="cp-hero-tab active" data-htab="rows" onclick="switchHeroTab('rows')"><i class="fas fa-table-cells"></i> الصفوف</button>
                <button class="cp-hero-tab" data-htab="cols" onclick="switchHeroTab('cols')"><i class="fas fa-columns"></i> الأعمدة</button>
                <button class="cp-hero-tab" data-htab="cells" onclick="switchHeroTab('cells')"><i class="fas fa-border-all"></i> الخلايا</button>
            </div>
            <div id="heroCpBody">${renderHeroSection(sect)}</div>
        </div>
    `);
    setTimeout(initAllHeroCp, 50);
}
function getActiveSection() {
    return ['inventory','incoming','outgoing','loan','kahana'].find(v =>
        document.getElementById('tab-' + v)?.classList.contains('active')
    ) || 'inventory';
}
function switchHeroTab(tab) {
    document.querySelectorAll('.cp-hero-tab').forEach(t => t.classList.toggle('active', t.dataset.htab === tab));
    document.querySelectorAll('.cp-hero-section').forEach(s => s.classList.toggle('active', s.id === 'hero-'+tab));
}
function changeHeroSect() {
    const s = document.getElementById('cpSect').value;
    document.getElementById('heroCpBody').innerHTML = renderHeroSection(s);
    setTimeout(initAllHeroCp, 50);
}
function initAllHeroCp() {
    ['rows-bg','rows-tx','cols-tx','cells-tx'].forEach(id => {
        if(document.getElementById('cpw-'+id+'-area')) initHeroCp(id);
    });
}
function renderHeroSection(sect) {
    const arr = SECT_MAP[sect] || [];
    const cols = SECT_KEYS[sect] || [];
    const dcols = SECT_DISPLAY[sect] || [];
    const rowOpts = arr.map((r,i) =>
        `<option value="${i}">${esc(r.code||r.name||'')} - ${esc(r.name||r.code||'')}</option>`
    ).join('') || '<option>لا توجد بيانات</option>';
    const colOpts = cols.map((k,i) =>
        `<option value="${k}">${esc(dcols[i]||k)}</option>`
    ).join('') || '<option>لا توجد أعمدة</option>';
    return `
        ${heroCpSection('rows', 'الصفوف', `
            <div class="cp-hero-selector"><label>الصف:</label>
                <select id="heroRow" onchange="heroUpdatePreview('rows')">${rowOpts}</select></div>
            ${heroCpWidget('rows-bg', 'خلفية الصف')}
            ${heroCpWidget('rows-tx', 'لون النص')}
            <div class="cp-actions" style="margin-top:8px">
                <button class="cp-apply" onclick="heroApply('rows')"><i class="fas fa-check"></i> تطبيق</button>
                <button class="cp-reset" onclick="heroClear('rows')"><i class="fas fa-rotate-left"></i> إزالة</button>
            </div>
        `)}
        ${heroCpSection('cols', 'الأعمدة', `
            <div class="cp-hero-selector"><label>العمود:</label>
                <select id="heroCol">${colOpts}</select></div>
            ${heroCpWidget('cols-tx', 'لون النص')}
            <div class="cp-actions" style="margin-top:8px">
                <button class="cp-apply" onclick="heroApply('cols')"><i class="fas fa-check"></i> تطبيق</button>
                <button class="cp-reset" onclick="heroClear('cols')"><i class="fas fa-rotate-left"></i> إزالة</button>
            </div>
        `)}
        ${heroCpSection('cells', 'الخلايا', `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div class="cp-hero-selector"><label>الصف:</label>
                    <select id="heroCellRow">${rowOpts}</select></div>
                <div class="cp-hero-selector"><label>العمود:</label>
                    <select id="heroCellCol">${colOpts}</select></div>
            </div>
            ${heroCpWidget('cells-tx', 'لون النص')}
            <div class="cp-actions" style="margin-top:8px">
                <button class="cp-apply" onclick="heroApply('cells')"><i class="fas fa-check"></i> تطبيق</button>
                <button class="cp-reset" onclick="heroClear('cells')"><i class="fas fa-rotate-left"></i> إزالة</button>
            </div>
        `)}
    `;
}
function heroCpSection(id, label, content) {
    const active = id === 'rows' ? ' active' : '';
    return `<div id="hero-${id}" class="cp-hero-section${active}"><div class="cp-hero-selector" style="margin-bottom:10px"><label style="font-size:14px;color:var(--text-primary)"><i class="fas fa-paint-brush"></i> ${label}</label></div>${content}</div>`;
}

/* ── HeroUI Color Picker Widget ── */
function heroCpWidget(id, label) {
    return `
    <div class="cp-widget" id="cpw-${id}" data-cp-id="${id}">
        <div class="cp-widget-header">
            <span class="swatch-preview" id="cpw-${id}-swatch" style="background:#10b981"></span>
            <span>${label}</span>
        </div>
        <div class="cp-area-wrap">
            <div class="cp-area" id="cpw-${id}-area" style="background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(160,100%,50%))">
                <div class="cp-area-thumb" id="cpw-${id}-thumb" style="left:100%;top:0%;background:hsl(160,100%,50%)"></div>
            </div>
        </div>
        <div class="cp-hue-wrap">
            <div class="cp-slider-track" id="cpw-${id}-hue">
                <div class="cp-slider-thumb" id="cpw-${id}-huethumb" style="left:44.44%"></div>
            </div>
        </div>
        <div class="cp-field-group">
            <span class="cp-field-prefix">#</span>
            <input class="cp-field-input" id="cpw-${id}-hex" value="10B981" maxlength="6" spellcheck="false" oninput="heroHexInput('${id}')">
        </div>
        <div class="cp-swatches" id="cpw-${id}-swatches">
            ${['#ef4444','#f97316','#eab308','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#78716c','#000000','#ffffff'].map(c =>
                `<button class="cp-swatch" style="background:${c}" data-color="${c}" onclick="heroPickSwatch('${id}','${c}')"></button>`
            ).join('')}
        </div>
    </div>`;
}

/* ── HSB↔Hex color helpers ── */
function hsb2hex(h,s,b) {
    s/=100; b/=100; const k=n=>(n+h/60)%6, f=n=>b*(1-s*Math.max(0,Math.min(k(n),4-k(n),1)));
    const r=Math.round(255*f(5)), g=Math.round(255*f(3)), bl=Math.round(255*f(1));
    return [r,g,bl].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function hex2hsb(hex) {
    hex=hex.replace('#',''); if(hex.length<6) hex=hex.split('').map(x=>x+x).join('');
    const r=parseInt(hex.slice(0,2),16)/255, g=parseInt(hex.slice(2,4),16)/255, b=parseInt(hex.slice(4,6),16)/255;
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
    let h=0; if(d){if(mx===r)h=60*(((g-b)/d)%6);else if(mx===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4);}
    return {h:(h+360)%360, s:mx===0?0:(d/mx)*100, b:mx*100};
}
function hexColor(hex) { return '#'+hex.replace('#','').toUpperCase(); }

/* ── Initialize a color picker widget ── */
function initHeroCp(id) {
    const area = document.getElementById('cpw-'+id+'-area');
    const thumb = document.getElementById('cpw-'+id+'-thumb');
    const hueTrack = document.getElementById('cpw-'+id+'-hue');
    const hueThumb = document.getElementById('cpw-'+id+'-huethumb');
    const hexInput = document.getElementById('cpw-'+id+'-hex');
    const swatch = document.getElementById('cpw-'+id+'-swatch');

    let state = hex2hsb(hexInput.value);
    function updateUI() {
        const hex = hsb2hex(state.h, state.s, state.b);
        hexInput.value = hex;
        swatch.style.background = '#'+hex;
        const pctS = state.s, pctB = 100-state.b;
        thumb.style.left = pctS+'%'; thumb.style.top = pctB+'%';
        thumb.style.background = '#'+hex;
        area.style.background = `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${state.h},100%,50%))`;
        hueThumb.style.left = (state.h/360*100)+'%';
    }

    /* Area drag */
    let dragA=false;
    area.addEventListener('pointerdown', e => { dragA=true; area.setPointerCapture(e.pointerId); moveA(e); });
    area.addEventListener('pointermove', e => { if(dragA) moveA(e); });
    area.addEventListener('pointerup', () => dragA=false);
    function moveA(e) {
        const r=area.getBoundingClientRect();
        state.s=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));
        state.b=Math.max(0,Math.min(100,100-((e.clientY-r.top)/r.height)*100));
        updateUI();
    }

    /* Hue slider drag */
    let dragH=false;
    hueTrack.addEventListener('pointerdown', e => { dragH=true; hueTrack.setPointerCapture(e.pointerId); moveH(e); });
    hueTrack.addEventListener('pointermove', e => { if(dragH) moveH(e); });
    hueTrack.addEventListener('pointerup', () => dragH=false);
    function moveH(e) {
        const r=hueTrack.getBoundingClientRect();
        state.h=Math.max(0,Math.min(360,((e.clientX-r.left)/r.width)*360));
        updateUI();
    }

    /* Thumb drag visual */
    thumb.addEventListener('pointerdown', e => { thumb.classList.add('dragging'); });
    thumb.addEventListener('pointerup', e => { thumb.classList.remove('dragging'); });

    window['_heroCp_'+id] = { state, updateUI };
}

function heroHexInput(id) {
    const w = window['_heroCp_'+id]; if(!w) return;
    const hex = document.getElementById('cpw-'+id+'-hex').value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
    document.getElementById('cpw-'+id+'-hex').value = hex;
    if(hex.length===6) { const hsb=hex2hsb(hex); w.state=hsb; w.updateUI(); }
}
function heroPickSwatch(id, color) {
    const w = window['_heroCp_'+id]; if(!w) return;
    w.state = hex2hsb(color.replace('#','')); w.updateUI();
    document.getElementById('cpw-'+id+'-hex').value = color.replace('#','').toUpperCase();
}

/* ── Apply / Clear ── */
function heroApply(type) {
    const sect = document.getElementById('cpSect').value;
    const arr = SECT_MAP[sect] || [];
    const hex = '#' + document.getElementById('cpw-'+(type==='rows'?'rows-bg':type==='cols'?'cols-tx':'cells-tx')+'-hex').value;
    if(type==='rows') {
        const idx = Number(document.getElementById('heroRow').value);
        if(!arr[idx]) return;
        arr[idx]._color = hex;
        const txHex = '#' + document.getElementById('cpw-rows-tx-hex').value;
        if(txHex !== '#000000') arr[idx]._textColor = txHex;
        save(); renderAll();
    } else if(type==='cols') {
        const col = document.getElementById('heroCol').value;
        if(!colColors[sect]) colColors[sect] = {};
        colColors[sect][col] = hex!=='#000000' ? hex : undefined;
        if(!colColors[sect][col]) delete colColors[sect][col];
        saveColColors(); renderAll();
    } else if(type==='cells') {
        const idx = Number(document.getElementById('heroCellRow').value);
        const col = document.getElementById('heroCellCol').value;
        if(!arr[idx]) return;
        if(!arr[idx]._cellColors) arr[idx]._cellColors = {};
        arr[idx]._cellColors[col] = hex!=='#000000' ? hex : undefined;
        if(!arr[idx]._cellColors[col]) delete arr[idx]._cellColors[col];
        save(); renderAll();
    }
}
function heroClear(type) {
    const sect = document.getElementById('cpSect').value;
    const arr = SECT_MAP[sect] || [];
    if(type==='rows') {
        const idx = Number(document.getElementById('heroRow').value);
        if(!arr[idx]) return;
        arr[idx]._color = undefined; arr[idx]._textColor = undefined;
        save(); renderAll();
    } else if(type==='cols') {
        const col = document.getElementById('heroCol').value;
        if(colColors[sect]) delete colColors[sect][col];
        saveColColors(); renderAll();
    } else if(type==='cells') {
        const idx = Number(document.getElementById('heroCellRow').value);
        const col = document.getElementById('heroCellCol').value;
        if(arr[idx] && arr[idx]._cellColors) delete arr[idx]._cellColors[col];
        save(); renderAll();
    }
}
function heroUpdatePreview() {} // placeholder

// ---- Live Clock ----
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const d = now.getDate(), m = months[now.getMonth()], y = now.getFullYear(), day = days[now.getDay()];
    const el = document.getElementById('liveClock');
    if (el) el.innerHTML = `<span class="clock-time">${time}</span><span class="clock-sep">|</span><span class="clock-date">${day}، ${d} ${m} ${y}</span>`;
}
setInterval(updateClock, 1000);
updateClock();

// ---- Active Session Heartbeat ----
function setActiveHeartbeat() {
    const user = safeParse('inv_current_user', null);
    if (!user) return;
    const sessions = safeParse('inv_sessions', {});
    sessions[user.username] = { role: user.role, lastActive: Date.now() };
    localStorage.setItem('inv_sessions', JSON.stringify(sessions));
}
setInterval(setActiveHeartbeat, 15000);
setActiveHeartbeat();

// ---- Auth ----
(function checkAuth() {
    const user = safeParse('inv_current_user', null);
    if (!user || localStorage.getItem('inv_auth') !== 'active') {
        window.location.href = '../index.html';
    }
})();

const currentUser = safeParse('inv_current_user', null);
const canEdit = currentUser ? currentUser.canEdit : false;
const isAdmin = currentUser ? currentUser.role === 'admin' : false;

// ---- Data ----
let inventory   = safeParse('inv_items', []);
let incoming    = safeParse('inv_incoming', []);
let outgoing    = safeParse('inv_outgoing', []);
let loanItems   = safeParse('inv_loan', []);
let loanIncoming = safeParse('inv_loan_incoming', []);
let kahana      = safeParse('inv_kahana', []);
const SECT_MAP = { inventory, incoming, outgoing, loan: loanItems, loanIncoming, kahana };

// ---- Dynamic Field Lists (units, categories, types) ----
function getFieldList(key) { return safeParse(key, []); }
function saveFieldList(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

function fieldSelectHtml(key, id, selected, placeholder) {
    let items = getFieldList(key);
    if (selected && !items.includes(selected)) {
        items = [selected, ...items];
        saveFieldList(key, items);
    }
    return `<div class="unit-field-wrap">
        <select id="${id}">
            <option value="">${placeholder}</option>
            ${items.map(v => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('')}
        </select>
        <button type="button" class="btn-add-unit" onclick="addFieldItem('${key}', '${id}', '${placeholder}')" title="إضافة جديد">+</button>
    </div>`;
}

function addFieldItem(key, selectId, placeholder) {
    const name = prompt('أدخل القيمة الجديدة:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    let items = getFieldList(key);
    if (items.includes(trimmed)) { showToast('القيمة موجودة مسبقاً'); return; }
    items.push(trimmed);
    items.sort();
    saveFieldList(key, items);
    const sel = document.getElementById(selectId);
    if (sel) {
        sel.innerHTML = '<option value="">' + placeholder + '</option>' +
            items.map(v => `<option ${v === trimmed ? 'selected' : ''}>${esc(v)}</option>`).join('');
        sel.value = trimmed;
    }
}

// Seed units from existing data
if (!safeParse('inv_units', null)) {
    const s = new Set();
    inventory.forEach(i => { if (i.unit) s.add(i.unit); });
    loanItems.forEach(i => { if (i.unit) s.add(i.unit); });
    localStorage.setItem('inv_units', JSON.stringify(Array.from(s).sort()));
}
// Seed categories from existing data
if (!safeParse('inv_categories', null)) {
    const s = new Set(['أجهزة طبية','كهربائية','أقمشة','أثاث','مستلزمات طبية','أدوية','مواد تنظيف','قرطاسية','أخرى']);
    inventory.forEach(i => { if (i.category) s.add(i.category); });
    loanItems.forEach(i => { if (i.category) s.add(i.category); });
    localStorage.setItem('inv_categories', JSON.stringify(Array.from(s).sort()));
}
// Seed types from existing data
if (!safeParse('inv_types', null)) {
    const s = new Set(['مستهلك', 'مستديم']);
    inventory.forEach(i => { if (i.type) s.add(i.type); });
    localStorage.setItem('inv_types', JSON.stringify(Array.from(s).sort()));
}

// Convenience wrappers
function unitFieldHtml(id, selected) { return fieldSelectHtml('inv_units', id, selected, 'اختر الوحدة'); }
function categoryFieldHtml(id, selected) { return fieldSelectHtml('inv_categories', id, selected, 'اختر التصنيف'); }
function typeFieldHtml(id, selected) { return fieldSelectHtml('inv_types', id, selected, 'اختر النوع'); }
function addNewUnit(selectId) { addFieldItem('inv_units', selectId, 'اختر الوحدة'); }
function addNewCategory(selectId) { addFieldItem('inv_categories', selectId, 'اختر التصنيف'); }
function addNewType(selectId) { addFieldItem('inv_types', selectId, 'اختر النوع'); }

// ---- Audio ----
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        if (type === 'login') {
            osc.frequency.setValueAtTime(523, ctx.currentTime);
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        } else {
            osc.frequency.setValueAtTime(784, ctx.currentTime);
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(523, ctx.currentTime + 0.2);
        }
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
    } catch(e) {}
}

// ---- Persistence ----
function save() {
    localStorage.setItem('inv_items', JSON.stringify(inventory));
    localStorage.setItem('inv_incoming', JSON.stringify(incoming));
    localStorage.setItem('inv_outgoing', JSON.stringify(outgoing));
    localStorage.setItem('inv_loan', JSON.stringify(loanItems));
    localStorage.setItem('inv_loan_incoming', JSON.stringify(loanIncoming));
    localStorage.setItem('inv_kahana', JSON.stringify(kahana));
}

// ---- Theme ----
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    document.getElementById('themeBtn').classList.toggle('dark', isDark);
    localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
    const overlay = document.getElementById('themeOverlay');
    if (overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
}

(function loadTheme() {
    if (localStorage.getItem('inv_theme') === 'dark') {
        document.body.classList.add('dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.classList.add('dark');
    }
})();

// ---- Logout ----
function logout() {
    playSound('logout');
    localStorage.removeItem('inv_auth');
    localStorage.removeItem('inv_current_user');
    setTimeout(() => { window.location.href = '../index.html'; }, 300);
}

// ---- Tabs ----
function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
    });
    const tabBtn = document.querySelector(`.tab[data-tab="${name}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const target = document.getElementById(`tab-${name}`);
    if (target) {
        target.classList.add('active');
    }
}

// ---- Modal ----
function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('modal').classList.remove('active');
}

// ---- Recalc ----
function recalcInventoryTotals(code) {
    const item = inventory.find(i => i.code === code);
    if (!item) return;
    item.totalIn = incoming.filter(r => r.code === code).reduce((s, r) => s + Number(r.qty), 0);
    item.totalOut = outgoing.filter(r => r.code === code).reduce((s, r) => s + Number(r.qty), 0);
    item.remaining = (item.openingBalance || 0) + item.totalIn - item.totalOut;
    save();
}

function recalcLoanTotals(code) {
    const item = loanItems.find(i => i.code === code);
    if (!item) return;
    item.totalIn = loanIncoming.filter(r => r.code === code).reduce((s, r) => s + Number(r.qty), 0);
    save();
}

// ---- Render ----
function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    const c = SECT_KEYS.inventory;
    tbody.innerHTML = inventory.map((item, i) => {
        const remaining = item.remaining != null ? item.remaining : (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        return `<tr ${rowStyle(item)}>
            <td ${tdStyle(item,'inventory',c[0])}>${esc(item.code)}</td>
            <td ${tdStyle(item,'inventory',c[1])}>${esc(item.ministryCode)}</td>
            <td ${tdStyle(item,'inventory',c[2])}>${esc(item.name)}</td>
            <td ${tdStyle(item,'inventory',c[3])}>${esc(item.unit)}</td>
            <td ${tdStyle(item,'inventory',c[4])}>${esc(item.category)}</td>
            <td ${tdStyle(item,'inventory',c[5])}>${esc(item.type)}</td>
            <td ${tdStyle(item,'inventory',c[6])}>${item.openingBalance || 0}</td>
            <td ${tdStyle(item,'inventory',c[7])}>${item.totalIn || 0}</td>
            <td ${tdStyle(item,'inventory',c[8])}>${item.totalOut || 0}</td>
            <td ${tdStyle(item,'inventory',c[9])}>${remaining}</td>
            <td ${tdStyle(item,'inventory',c[10])}>${item.price || 0}</td>
            <td ${tdStyle(item,'inventory',c[11])}>${esc(item.notes || '')}</td>
            <td>${canEdit ? `
                ${getColorBtn(item, 'inventory', i)}
                <button class="action-btn edit-btn" onclick="editInventory(${i})"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteInventory(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function renderIncoming() {
    const tbody = document.getElementById('incomingTableBody');
    const c = SECT_KEYS.incoming;
    tbody.innerHTML = incoming.map((rec, i) => {
        return `<tr ${rowStyle(rec)}>
        <td ${tdStyle(rec,'incoming',c[0])}>${esc(rec.day)}</td>
        <td ${tdStyle(rec,'incoming',c[1])}>${esc(rec.date)}</td>
        <td ${tdStyle(rec,'incoming',c[2])}>${esc(rec.code)}</td>
        <td ${tdStyle(rec,'incoming',c[3])}>${esc(rec.ministryCode)}</td>
        <td ${tdStyle(rec,'incoming',c[4])}>${esc(rec.name)}</td>
        <td ${tdStyle(rec,'incoming',c[5])}>${esc(rec.unit)}</td>
        <td ${tdStyle(rec,'incoming',c[6])}>${esc(rec.category)}</td>
        <td ${tdStyle(rec,'incoming',c[7])}>${esc(rec.type)}</td>
        <td ${tdStyle(rec,'incoming',c[8])}>${rec.qty}</td>
        <td ${tdStyle(rec,'incoming',c[9])}>${esc(rec.source)}</td>
        <td ${tdStyle(rec,'incoming',c[10])}>${rec.price}</td>
        <td ${tdStyle(rec,'incoming',c[11])}>${rec.total}</td>
        <td ${tdStyle(rec,'incoming',c[12])}>${esc(rec.notes || '')}</td>
        <td>${canEdit ? `
            ${getColorBtn(rec, 'incoming', i)}
            <button class="action-btn edit-btn" onclick="editIncoming(${i})"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete-btn" onclick="deleteIncoming(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
        </td>
    </tr>`}).join('');
}

function renderOutgoing() {
    const tbody = document.getElementById('outgoingTableBody');
    const c = SECT_KEYS.outgoing;
    tbody.innerHTML = outgoing.map((rec, i) => {
        return `<tr ${rowStyle(rec)}>
        <td ${tdStyle(rec,'outgoing',c[0])}>${esc(rec.day)}</td>
        <td ${tdStyle(rec,'outgoing',c[1])}>${esc(rec.date)}</td>
        <td ${tdStyle(rec,'outgoing',c[2])}>${esc(rec.code)}</td>
        <td ${tdStyle(rec,'outgoing',c[3])}>${esc(rec.ministryCode)}</td>
        <td ${tdStyle(rec,'outgoing',c[4])}>${esc(rec.name)}</td>
        <td ${tdStyle(rec,'outgoing',c[5])}>${esc(rec.unit)}</td>
        <td ${tdStyle(rec,'outgoing',c[6])}>${esc(rec.category)}</td>
        <td ${tdStyle(rec,'outgoing',c[7])}>${esc(rec.type)}</td>
        <td ${tdStyle(rec,'outgoing',c[8])}>${rec.qty}</td>
        <td ${tdStyle(rec,'outgoing',c[9])}>${esc(rec.destination)}</td>
        <td ${tdStyle(rec,'outgoing',c[10])}>${rec.price}</td>
        <td ${tdStyle(rec,'outgoing',c[11])}>${rec.total}</td>
        <td ${tdStyle(rec,'outgoing',c[12])}>${esc(rec.notes || '')}</td>
        <td>${canEdit ? `
            ${getColorBtn(rec, 'outgoing', i)}
            <button class="action-btn edit-btn" onclick="editOutgoing(${i})"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete-btn" onclick="deleteOutgoing(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
        </td>
    </tr>`}).join('');
}

function renderLoan() {
    const tbody = document.getElementById('loanTableBody');
    const c = SECT_KEYS.loan;
    tbody.innerHTML = loanItems.map((item, i) => {
        const remaining = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        return `<tr ${rowStyle(item)}>
            <td ${tdStyle(item,'loan',c[0])}>${esc(item.code)}</td>
            <td ${tdStyle(item,'loan',c[1])}>${esc(item.ministryCode)}</td>
            <td ${tdStyle(item,'loan',c[2])}>${esc(item.name)}</td>
            <td ${tdStyle(item,'loan',c[3])}>${esc(item.unit)}</td>
            <td ${tdStyle(item,'loan',c[4])}>${esc(item.category)}</td>
            <td ${tdStyle(item,'loan',c[5])}>${item.openingBalance || 0}</td>
            <td ${tdStyle(item,'loan',c[6])}>${item.totalIn || 0}</td>
            <td ${tdStyle(item,'loan',c[7])}>${item.totalOut || 0}</td>
            <td ${tdStyle(item,'loan',c[8])}>${remaining}</td>
            <td>${canEdit ? `
                ${getColorBtn(item, 'loan', i)}
                <button class="action-btn edit-btn" onclick="editLoan(${i})"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete-btn" onclick="deleteLoan(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
            </td>
        </tr>`;
    }).join('');
}

function renderLoanIncoming() {
    const tbody = document.getElementById('loanIncomingBody');
    const c = SECT_KEYS.loanIncoming;
    tbody.innerHTML = loanIncoming.map((rec, i) => {
        return `<tr ${rowStyle(rec)}>
        <td ${tdStyle(rec,'loanIncoming',c[0])}>${esc(rec.day)}</td>
        <td ${tdStyle(rec,'loanIncoming',c[1])}>${esc(rec.date)}</td>
        <td ${tdStyle(rec,'loanIncoming',c[2])}>${esc(rec.code)}</td>
        <td ${tdStyle(rec,'loanIncoming',c[3])}>${esc(rec.name)}</td>
        <td ${tdStyle(rec,'loanIncoming',c[4])}>${rec.qty}</td>
        <td ${tdStyle(rec,'loanIncoming',c[5])}>${esc(rec.source)}</td>
        <td ${tdStyle(rec,'loanIncoming',c[6])}>${rec.price}</td>
        <td ${tdStyle(rec,'loanIncoming',c[7])}>${rec.total}</td>
        <td>${canEdit ? `
            ${getColorBtn(rec, 'loanIncoming', i)}
            <button class="action-btn edit-btn" onclick="editLoanIncoming(${i})"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete-btn" onclick="deleteLoanIncoming(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
        </td>
    </tr>`}).join('');
}

function renderKahana() {
    const tbody = document.getElementById('kahanaTableBody');
    if (!tbody) return;
    const c = SECT_KEYS.kahana;
    tbody.innerHTML = kahana.map((item, i) => {
        return `<tr ${rowStyle(item)}>
        <td ${tdStyle(item,'kahana',c[0])}>${esc(item.name)}</td>
        <td ${tdStyle(item,'kahana',c[1])}>${esc(item.category || '')}</td>
        <td ${tdStyle(item,'kahana',c[2])}>${esc(item.details || '')}</td>
        <td ${tdStyle(item,'kahana',c[3])}>${esc(item.notes || '')}</td>
        <td>${canEdit ? `
            ${getColorBtn(item, 'kahana', i)}
            <button class="action-btn edit-btn" onclick="editKahana(${i})"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete-btn" onclick="deleteKahana(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
        </td>
    </tr>`}).join('');
}

function updateStats() {
    const statItems = document.getElementById('statItems');
    const statIncoming = document.getElementById('statIncoming');
    const statOutgoing = document.getElementById('statOutgoing');
    const statLoan = document.getElementById('statLoan');
    const statLowStock = document.getElementById('statLowStock');
    if (statItems) statItems.textContent = inventory.length;
    if (statIncoming) statIncoming.textContent = incoming.length;
    if (statOutgoing) statOutgoing.textContent = outgoing.length;
    if (statLoan) statLoan.textContent = loanItems.length;
    if (statLowStock) {
        const low = inventory.filter(i => (i.openingBalance || 0) + (i.totalIn || 0) - (i.totalOut || 0) <= 5).length;
        statLowStock.textContent = low;
    }
}

function renderAll() {
    renderInventory();
    renderIncoming();
    renderOutgoing();
    renderLoan();
    renderLoanIncoming();
    renderKahana();
    updateTabCounters();
    updateStats();
}

// ---- Export Excel ----
function exportExcel(section) {
    const wb = XLSX.utils.book_new();
    let data, name;
    if (section === 'inventory') {
        data = inventory.map(i => ({
            'كود الصنف': i.code,
            'كود وزارة': i.ministryCode,
            'اسم الصنف': i.name,
            'الوحدة': i.unit,
            'التصنيف': i.category,
            'النوع': i.type,
            'رصيد أول المدة': i.openingBalance || 0,
            'الوارد': i.totalIn || 0,
            'الصادر': i.totalOut || 0,
            'الرصيد المتبقي': (i.openingBalance || 0) + (i.totalIn || 0) - (i.totalOut || 0),
            'السعر': i.price || 0,
            'ملاحظات': i.notes || ''
        }));
        name = 'المخزون';
    } else if (section === 'incoming') {
        data = incoming.map(r => ({
            'اليوم': r.day, 'التاريخ': r.date, 'كود الصنف': r.code,
            'كود وزارة': r.ministryCode, 'اسم الصنف': r.name, 'الوحدة': r.unit,
            'التصنيف': r.category, 'النوع': r.type, 'الكمية': r.qty,
            'الجهة الوارد منها': r.source, 'السعر': r.price, 'الإجمالي': r.total,
            'ملاحظات': r.notes || ''
        }));
        name = 'الوارد';
    } else if (section === 'outgoing') {
        data = outgoing.map(r => ({
            'اليوم': r.day, 'التاريخ': r.date, 'كود الصنف': r.code,
            'كود وزارة': r.ministryCode, 'اسم الصنف': r.name, 'الوحدة': r.unit,
            'التصنيف': r.category, 'النوع': r.type, 'الكمية': r.qty,
            'الجهة المصروف لها': r.destination, 'السعر': r.price, 'الإجمالي': r.total,
            'ملاحظات': r.notes || ''
        }));
        name = 'الصادر';
    } else if (section === 'loan') {
        data = loanItems.map(i => ({
            'كود الصنف': i.code, 'كود وزارة': i.ministryCode, 'اسم الصنف': i.name,
            'الوحدة': i.unit, 'التصنيف': i.category,
            'رصيد أول المدة': i.openingBalance || 0,
            'الوارد': i.totalIn || 0, 'الصادر': i.totalOut || 0,
            'الرصيد المتبقي': (i.openingBalance || 0) + (i.totalIn || 0) - (i.totalOut || 0)
        }));
        name = 'الإعارة';
    } else if (section === 'kahana') {
        data = kahana.map(i => ({ 'الاسم': i.name, 'التصنيف': i.category || '', 'التفاصيل': i.details || '', 'ملاحظات': i.notes || '' }));
        name = 'الكهنة';
    } else if (section === 'loanIncoming') {
        data = loanIncoming.map(r => ({
            'اليوم': r.day, 'التاريخ': r.date, 'كود': r.code,
            'الاسم': r.name, 'الكمية': r.qty, 'الجهة': r.source,
            'السعر': r.price, 'الإجمالي': r.total
        }));
        name = 'وارد الإعارة';
    }
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
    XLSX.writeFile(wb, `مستشفى_الأقصى_${name}_${dateStr().replace(/\//g,'-')}.xlsx`);
}

// ---- Import Excel ----
function importExcel(event, section) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
            if (!rows || rows.length === 0) { showToast('الملف فارغ'); return; }

            let added = 0;
            rows.forEach(row => {
                if (section === 'inventory') {
                    const code = String(row['كود الصنف'] || row['code'] || '').trim();
                    const name = String(row['اسم الصنف'] || row['name'] || '').trim();
                    if (!code || !name) return;
                    if (inventory.some(i => i.code === code)) return;
                    inventory.push({
                        code,
                        ministryCode: String(row['كود وزارة'] || row['ministryCode'] || ''),
                        name,
                        unit: String(row['الوحدة'] || row['unit'] || ''),
                        category: String(row['التصنيف'] || row['category'] || ''),
                        type: String(row['النوع'] || row['type'] || 'مستهلك'),
                        openingBalance: Number(row['رصيد أول المدة'] || row['openingBalance'] || 0),
                        price: Number(row['السعر'] || row['price'] || 0),
                        notes: String(row['ملاحظات'] || row['notes'] || ''),
                        totalIn: Number(row['الوارد'] || row['totalIn'] || 0),
                        totalOut: Number(row['الصادر'] || row['totalOut'] || 0),
                        remaining: Number(row['الرصيد المتبقي'] || row['remaining'] || 0)
                    });
                    added++;
                } else if (section === 'incoming') {
                    const code = String(row['كود الصنف'] || row['code'] || '').trim();
                    const name = String(row['اسم الصنف'] || row['name'] || '').trim();
                    if (!code || !name) return;
                    incoming.push({
                        id: generateId(),
                        day: String(row['اليوم'] || row['day'] || today()),
                        date: String(row['التاريخ'] || row['date'] || dateStr()),
                        code, ministryCode: String(row['كود وزارة'] || row['ministryCode'] || ''),
                        name, unit: String(row['الوحدة'] || row['unit'] || ''),
                        category: String(row['التصنيف'] || row['category'] || ''),
                        type: String(row['النوع'] || row['type'] || 'مستهلك'),
                        qty: Number(row['الكمية'] || row['qty'] || 0),
                        source: String(row['الجهة الوارد منها'] || row['source'] || ''),
                        price: Number(row['السعر'] || row['price'] || 0),
                        total: Number(row['الإجمالي'] || row['total'] || 0),
                        notes: String(row['ملاحظات'] || row['notes'] || '')
                    });
                    recalcInventoryTotals(code);
                    added++;
                } else if (section === 'outgoing') {
                    const code = String(row['كود الصنف'] || row['code'] || '').trim();
                    const name = String(row['اسم الصنف'] || row['name'] || '').trim();
                    if (!code || !name) return;
                    outgoing.push({
                        id: generateId(),
                        day: String(row['اليوم'] || row['day'] || today()),
                        date: String(row['التاريخ'] || row['date'] || dateStr()),
                        code, ministryCode: String(row['كود وزارة'] || row['ministryCode'] || ''),
                        name, unit: String(row['الوحدة'] || row['unit'] || ''),
                        category: String(row['التصنيف'] || row['category'] || ''),
                        type: String(row['النوع'] || row['type'] || 'مستهلك'),
                        qty: Number(row['الكمية'] || row['qty'] || 0),
                        destination: String(row['الجهة المصروف لها'] || row['destination'] || ''),
                        price: Number(row['السعر'] || row['price'] || 0),
                        total: Number(row['الإجمالي'] || row['total'] || 0),
                        notes: String(row['ملاحظات'] || row['notes'] || '')
                    });
                    recalcInventoryTotals(code);
                    added++;
                } else if (section === 'loan') {
                    const code = String(row['كود الصنف'] || row['code'] || '').trim();
                    const name = String(row['اسم الصنف'] || row['name'] || '').trim();
                    if (!code || !name) return;
                    if (loanItems.some(i => i.code === code)) return;
                    loanItems.push({
                        code, ministryCode: String(row['كود وزارة'] || row['ministryCode'] || ''),
                        name, unit: String(row['الوحدة'] || row['unit'] || ''),
                        category: String(row['التصنيف'] || row['category'] || ''),
                        openingBalance: Number(row['رصيد أول المدة'] || row['openingBalance'] || 0)
                    });
                    added++;
                } else if (section === 'loanIncoming') {
                    const code = String(row['كود الصنف'] || row['كود'] || row['code'] || '').trim();
                    const name = String(row['اسم الصنف'] || row['الاسم'] || row['name'] || '').trim();
                    if (!code || !name) return;
                    loanIncoming.push({
                        id: generateId(),
                        day: String(row['اليوم'] || row['day'] || today()),
                        date: String(row['التاريخ'] || row['date'] || dateStr()),
                        code, name,
                        qty: Number(row['الكمية'] || row['qty'] || 0),
                        source: String(row['الجهة'] || row['source'] || ''),
                        price: Number(row['السعر'] || row['price'] || 0),
                        total: Number(row['الإجمالي'] || row['total'] || 0)
                    });
                    recalcLoanTotals(code);
                    added++;
                } else if (section === 'kahana') {
                    const name = String(row['الاسم'] || row['name'] || '').trim();
                    if (!name) return;
                    kahana.push({
                        name,
                        category: String(row['التصنيف'] || row['category'] || ''),
                        details: String(row['التفاصيل'] || row['details'] || ''),
                        notes: String(row['ملاحظات'] || row['notes'] || '')
                    });
                    added++;
                }
            });
            save();
            renderAll();
            event.target.value = '';
            showToast(`تم استيراد ${added} سجل بنجاح`);
        } catch (err) {
            showToast('فشل قراءة الملف: ' + err.message);
            event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

// =============================================
// المخزون CRUD
// =============================================
function calcItemRemaining() {
    const opening = Number(document.getElementById('item_opening').value) || 0;
    const tin = Number(document.getElementById('item_totalIn').value) || 0;
    const tout = Number(document.getElementById('item_totalOut').value) || 0;
    document.getElementById('item_remaining').value = opening + tin - tout;
}

function getNextItemCode() {
    let max = 0;
    inventory.forEach(i => {
        const n = parseInt(i.code, 10);
        if (!isNaN(n) && n > max) max = n;
    });
    return String(max + 1);
}

function showAddItemModal() {
    const nextCode = getNextItemCode();
    openModal('إضافة صنف جديد', `
        <div class="form-grid">
            <div class="form-group">
                <label>كود الصنف</label>
                <input type="text" id="item_code" value="${nextCode}" readonly>
            </div>
            <div class="form-group">
                <label>كود وزارة</label>
                <input type="text" id="item_ministry_code" placeholder="كود وزارة الصحة">
            </div>
            <div class="form-group full">
                <label>اسم الصنف</label>
                <input type="text" id="item_name" placeholder="اسم الصنف">
            </div>
            <div class="form-group">
                <label>الوحدة</label>
                ${unitFieldHtml('item_unit', '')}
            </div>
            <div class="form-group">
                <label>التصنيف</label>
                ${categoryFieldHtml('item_category', '')}
            </div>
            <div class="form-group">
                <label>النوع</label>
                ${typeFieldHtml('item_type', '')}
            </div>
            <div class="form-group">
                <label>رصيد أول المدة</label>
                <input type="number" id="item_opening" value="0" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الوارد</label>
                <input type="number" id="item_totalIn" value="0" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الصادر</label>
                <input type="number" id="item_totalOut" value="0" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الرصيد المتبقي</label>
                <input type="number" id="item_remaining" value="0" min="0">
            </div>
            <div class="form-group">
                <label>السعر</label>
                <input type="number" id="item_price" value="0" min="0" step="0.01">
            </div>
            <div class="form-group full">
                <label>ملاحظات</label>
                <textarea id="item_notes"></textarea>
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveInventoryItem()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function saveInventoryItem() {
    const code = document.getElementById('item_code').value.trim();
    if (!code) { showToast('يرجى إدخال كود الصنف'); return; }
    if (inventory.some(i => i.code === code)) { showToast('كود الصنف موجود مسبقاً'); return; }
    inventory.push({
        code,
        ministryCode: document.getElementById('item_ministry_code').value.trim(),
        name: document.getElementById('item_name').value.trim(),
        unit: document.getElementById('item_unit').value.trim(),
        category: document.getElementById('item_category').value,
        type: document.getElementById('item_type').value,
        openingBalance: Number(document.getElementById('item_opening').value) || 0,
        price: Number(document.getElementById('item_price').value) || 0,
        notes: document.getElementById('item_notes').value.trim(),
        totalIn: Number(document.getElementById('item_totalIn').value) || 0,
        totalOut: Number(document.getElementById('item_totalOut').value) || 0,
        remaining: Number(document.getElementById('item_remaining').value) || 0
    });
    save();
    renderAll();
    closeModal();
}

function editInventory(index) {
    const item = inventory[index];
    if (!item) return;
    openModal('تعديل الصنف', `
        <div class="form-grid">
            <div class="form-group">
                <label>كود الصنف</label>
                <input type="text" id="item_code" value="${esc(item.code)}" readonly>
            </div>
            <div class="form-group">
                <label>كود وزارة</label>
                <input type="text" id="item_ministry_code" value="${esc(item.ministryCode)}">
            </div>
            <div class="form-group full">
                <label>اسم الصنف</label>
                <input type="text" id="item_name" value="${esc(item.name)}">
            </div>
            <div class="form-group">
                <label>الوحدة</label>
                ${unitFieldHtml('item_unit', item.unit)}
            </div>
            <div class="form-group">
                <label>التصنيف</label>
                ${categoryFieldHtml('item_category', item.category)}
            </div>
            <div class="form-group">
                <label>النوع</label>
                ${typeFieldHtml('item_type', item.type)}
            </div>
            <div class="form-group">
                <label>رصيد أول المدة</label>
                <input type="number" id="item_opening" value="${item.openingBalance}" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الوارد</label>
                <input type="number" id="item_totalIn" value="${item.totalIn || 0}" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الصادر</label>
                <input type="number" id="item_totalOut" value="${item.totalOut || 0}" min="0" oninput="calcItemRemaining()">
            </div>
            <div class="form-group">
                <label>الرصيد المتبقي</label>
                <input type="number" id="item_remaining" value="${(item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0)}" min="0">
            </div>
            <div class="form-group">
                <label>السعر</label>
                <input type="number" id="item_price" value="${item.price}" min="0" step="0.01">
            </div>
            <div class="form-group full">
                <label>ملاحظات</label>
                <textarea id="item_notes">${esc(item.notes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateInventory(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function updateInventory(index) {
    const item = inventory[index];
    if (!item) return;
    item.ministryCode = document.getElementById('item_ministry_code').value.trim();
    item.name = document.getElementById('item_name').value.trim();
    item.unit = document.getElementById('item_unit').value.trim();
    item.category = document.getElementById('item_category').value;
    item.type = document.getElementById('item_type').value;
    item.openingBalance = Number(document.getElementById('item_opening').value) || 0;
    item.totalIn = Number(document.getElementById('item_totalIn').value) || 0;
    item.totalOut = Number(document.getElementById('item_totalOut').value) || 0;
    item.remaining = Number(document.getElementById('item_remaining').value) || 0;
    item.price = Number(document.getElementById('item_price').value) || 0;
    item.notes = document.getElementById('item_notes').value.trim();
    save();
    renderAll();
    closeModal();
}

function deleteInventory(index) {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    const item = inventory[index];
    if (!item) return;
    inventory.splice(index, 1);
    save();
    renderAll();
}

// ---- Auto-fill ----
function selectIncomingItem() {
    const code = document.getElementById('incoming_code').value;
    const item = inventory.find(i => i.code === code);
    const bal = document.getElementById('incoming_balance');
    if (item) {
        document.getElementById('incoming_ministry_code').value = item.ministryCode || '';
        document.getElementById('incoming_name').value = item.name || '';
        document.getElementById('incoming_unit').value = item.unit || '';
        document.getElementById('incoming_category').value = item.category || '';
        document.getElementById('incoming_type').value = item.type || '';
        const rem = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        if (bal) bal.innerHTML = `إجمالي الوارد الحالي: <strong>${item.totalIn || 0}</strong> | الرصيد المتبقي: <strong>${rem}</strong>`;
    } else {
        if (bal) bal.innerHTML = '';
    }
}

function showAddIncomingModal() {
    const opts = inventory.map(i =>
        `<option value="${esc(i.code)}">${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    const emptyMsg = inventory.length === 0 ? '<option value="" disabled>لا توجد أصناف - أضف أصنافاً أولاً</option>' : '<option value="">اختر صنفاً</option>';
    openModal('إضافة وارد جديد', `
        <div class="form-grid">
            <div class="form-group">
                <label>اليوم</label>
                <input type="text" id="incoming_day" value="${today()}">
            </div>
            <div class="form-group">
                <label>التاريخ</label>
                <input type="text" id="incoming_date" value="${dateStr()}">
            </div>
            <div class="form-group">
                <label>كود الصنف</label>
                <select id="incoming_code" onchange="selectIncomingItem()">
                    ${emptyMsg}${opts}
                </select>
            </div>
            <div class="form-group full balance-hint" id="incoming_balance"></div>
            <div class="form-group">
                <label>كود وزارة</label>
                <input type="text" id="incoming_ministry_code">
            </div>
            <div class="form-group full">
                <label>اسم الصنف</label>
                <input type="text" id="incoming_name">
            </div>
            <div class="form-group">
                <label>الوحدة</label>
                <input type="text" id="incoming_unit">
            </div>
            <div class="form-group">
                <label>التصنيف</label>
                <input type="text" id="incoming_category">
            </div>
            <div class="form-group">
                <label>النوع</label>
                <input type="text" id="incoming_type">
            </div>
            <div class="form-group">
                <label>الكمية الواردة</label>
                <input type="number" id="incoming_qty" value="0" min="0" oninput="calcIncomingTotal()">
            </div>
            <div class="form-group">
                <label>الجهة الوارد منها</label>
                <input type="text" id="incoming_source" placeholder="الجهة الوارد منها">
            </div>
            <div class="form-group">
                <label>السعر</label>
                <input type="number" id="incoming_price" value="0" min="0" step="0.01" oninput="calcIncomingTotal()">
            </div>
            <div class="form-group">
                <label>الإجمالي</label>
                <input type="text" id="incoming_total" readonly>
            </div>
            <div class="form-group full">
                <label>ملاحظات</label>
                <textarea id="incoming_notes"></textarea>
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveIncoming()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function calcIncomingTotal() {
    const qty = Number(document.getElementById('incoming_qty').value) || 0;
    const price = Number(document.getElementById('incoming_price').value) || 0;
    document.getElementById('incoming_total').value = qty * price;
}

function saveIncoming() {
    const code = document.getElementById('incoming_code').value.trim();
    if (!code) { showToast('يرجى اختيار كود الصنف'); return; }
    if (!inventory.some(i => i.code === code)) { showToast('كود الصنف غير موجود في المخزون'); return; }
    const qty = Number(document.getElementById('incoming_qty').value) || 0;
    if (qty <= 0) { showToast('الكمية يجب أن تكون أكبر من صفر'); return; }
    const rec = {
        id: generateId(), day: document.getElementById('incoming_day').value,
        date: document.getElementById('incoming_date').value, code,
        ministryCode: document.getElementById('incoming_ministry_code').value,
        name: document.getElementById('incoming_name').value,
        unit: document.getElementById('incoming_unit').value,
        category: document.getElementById('incoming_category').value,
        type: document.getElementById('incoming_type').value, qty,
        source: document.getElementById('incoming_source').value,
        price: Number(document.getElementById('incoming_price').value) || 0,
        total: qty * (Number(document.getElementById('incoming_price').value) || 0),
        notes: document.getElementById('incoming_notes').value.trim()
    };
    incoming.push(rec);
    recalcInventoryTotals(code);
    save();
    renderAll();
    closeModal();
}

function editIncoming(index) {
    const rec = incoming[index];
    if (!rec) return;
    const opts = inventory.map(i =>
        `<option value="${esc(i.code)}" ${i.code === rec.code ? 'selected' : ''}>${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    openModal('تعديل وارد', `
        <div class="form-grid">
            <div class="form-group"><label>اليوم</label><input type="text" id="incoming_day" value="${esc(rec.day)}"></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="incoming_date" value="${esc(rec.date)}"></div>
            <div class="form-group"><label>كود الصنف</label><select id="incoming_code" onchange="selectIncomingItem()">${opts}</select></div>
            <div class="form-group"><label>كود وزارة</label><input type="text" id="incoming_ministry_code" value="${esc(rec.ministryCode)}"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="incoming_name" value="${esc(rec.name)}"></div>
            <div class="form-group"><label>الوحدة</label><input type="text" id="incoming_unit" value="${esc(rec.unit)}"></div>
            <div class="form-group"><label>التصنيف</label><input type="text" id="incoming_category" value="${esc(rec.category)}"></div>
            <div class="form-group"><label>النوع</label><input type="text" id="incoming_type" value="${esc(rec.type)}"></div>
            <div class="form-group"><label>الكمية</label><input type="number" id="incoming_qty" value="${rec.qty}" min="0" oninput="calcIncomingTotal()"></div>
            <div class="form-group"><label>الجهة</label><input type="text" id="incoming_source" value="${esc(rec.source)}"></div>
            <div class="form-group"><label>السعر</label><input type="number" id="incoming_price" value="${rec.price}" min="0" step="0.01" oninput="calcIncomingTotal()"></div>
            <div class="form-group"><label>الإجمالي</label><input type="text" id="incoming_total" value="${rec.total}" readonly></div>
            <div class="form-group full"><label>ملاحظات</label><textarea id="incoming_notes">${esc(rec.notes || '')}</textarea></div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateIncoming(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
    setTimeout(() => calcIncomingTotal(), 100);
}

function updateIncoming(index) {
    const rec = incoming[index];
    if (!rec) return;
    const oldCode = rec.code;
    const newCode = document.getElementById('incoming_code').value.trim();
    if (!newCode || !inventory.some(i => i.code === newCode)) { showToast('يرجى اختيار كود صنف صحيح'); return; }
    Object.assign(rec, {
        day: document.getElementById('incoming_day').value,
        date: document.getElementById('incoming_date').value,
        code: newCode,
        ministryCode: document.getElementById('incoming_ministry_code').value,
        name: document.getElementById('incoming_name').value,
        unit: document.getElementById('incoming_unit').value,
        category: document.getElementById('incoming_category').value,
        type: document.getElementById('incoming_type').value,
        qty: Number(document.getElementById('incoming_qty').value) || 0,
        source: document.getElementById('incoming_source').value,
        price: Number(document.getElementById('incoming_price').value) || 0,
        notes: document.getElementById('incoming_notes').value.trim()
    });
    rec.total = rec.qty * rec.price;
    recalcInventoryTotals(oldCode);
    if (oldCode !== newCode) recalcInventoryTotals(newCode);
    save();
    renderAll();
    closeModal();
}

function deleteIncoming(index) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    const rec = incoming[index];
    if (!rec) return;
    incoming.splice(index, 1);
    recalcInventoryTotals(rec.code);
    save();
    renderAll();
}

// =============================================
// الصادر CRUD
// =============================================
function selectOutgoingItem() {
    const code = document.getElementById('outgoing_code').value;
    const item = inventory.find(i => i.code === code);
    const bal = document.getElementById('outgoing_balance');
    if (item) {
        document.getElementById('outgoing_ministry_code').value = item.ministryCode || '';
        document.getElementById('outgoing_name').value = item.name || '';
        document.getElementById('outgoing_unit').value = item.unit || '';
        document.getElementById('outgoing_category').value = item.category || '';
        document.getElementById('outgoing_type').value = item.type || '';
        const rem = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        if (bal) bal.innerHTML = `الرصيد المتاح: <strong>${rem}</strong>`;
    } else {
        if (bal) bal.innerHTML = '';
    }
}

function showAddOutgoingModal() {
    const opts = inventory.map(i =>
        `<option value="${esc(i.code)}">${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    const emptyMsg = inventory.length === 0 ? '<option value="" disabled>لا توجد أصناف - أضف أصنافاً أولاً</option>' : '<option value="">اختر صنفاً</option>';
    openModal('إضافة صادر جديد', `
        <div class="form-grid">
            <div class="form-group"><label>اليوم</label><select id="outgoing_day"><option value="">اختر اليوم</option><option>الأحد</option><option>الإثنين</option><option>الثلاثاء</option><option>الأربعاء</option><option>الخميس</option><option>الجمعة</option><option>السبت</option></select></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="outgoing_date" placeholder="اكتب التاريخ"></div>
            <div class="form-group"><label>كود الصنف</label><select id="outgoing_code" onchange="selectOutgoingItem()">${emptyMsg}${opts}</select></div>
            <div class="form-group full balance-hint" id="outgoing_balance"></div>
            <div class="form-group"><label>كود وزارة</label><input type="text" id="outgoing_ministry_code"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="outgoing_name"></div>
            <div class="form-group"><label>الوحدة</label><input type="text" id="outgoing_unit"></div>
            <div class="form-group"><label>التصنيف</label><input type="text" id="outgoing_category"></div>
            <div class="form-group"><label>النوع</label><input type="text" id="outgoing_type"></div>
            <div class="form-group"><label>الكمية المنصرفة</label><input type="number" id="outgoing_qty" value="0" min="0" oninput="calcOutgoingTotal()"></div>
            <div class="form-group"><label>الجهة المصروف لها</label><input type="text" id="outgoing_destination" placeholder="أكتب اسم القسم"></div>
            <div class="form-group"><label>السعر</label><input type="number" id="outgoing_price" value="0" min="0" step="0.01" oninput="calcOutgoingTotal()"></div>
            <div class="form-group"><label>الإجمالي</label><input type="text" id="outgoing_total" readonly></div>
            <div class="form-group full"><label>ملاحظات</label><textarea id="outgoing_notes"></textarea></div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveOutgoing()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function calcOutgoingTotal() {
    const qty = Number(document.getElementById('outgoing_qty').value) || 0;
    const price = Number(document.getElementById('outgoing_price').value) || 0;
    document.getElementById('outgoing_total').value = qty * price;
}

function saveOutgoing() {
    const code = document.getElementById('outgoing_code').value.trim();
    if (!code) { showToast('يرجى اختيار كود الصنف'); return; }
    if (!inventory.some(i => i.code === code)) { showToast('كود الصنف غير موجود في المخزون'); return; }
    const qty = Number(document.getElementById('outgoing_qty').value) || 0;
    if (qty <= 0) { showToast('الكمية يجب أن تكون أكبر من صفر'); return; }
    const item = inventory.find(i => i.code === code);
    if (item) {
        const rem = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        if (qty > rem) { showToast(`الرصيد المتبقي غير كافٍ! المتاح: ${rem}`); return; }
    }
    const rec = {
        id: generateId(), day: document.getElementById('outgoing_day').value,
        date: document.getElementById('outgoing_date').value, code,
        ministryCode: document.getElementById('outgoing_ministry_code').value,
        name: document.getElementById('outgoing_name').value,
        unit: document.getElementById('outgoing_unit').value,
        category: document.getElementById('outgoing_category').value,
        type: document.getElementById('outgoing_type').value, qty,
        destination: document.getElementById('outgoing_destination').value,
        price: Number(document.getElementById('outgoing_price').value) || 0,
        total: qty * (Number(document.getElementById('outgoing_price').value) || 0),
        notes: document.getElementById('outgoing_notes').value.trim()
    };
    outgoing.push(rec);
    recalcInventoryTotals(code);
    save();
    renderAll();
    closeModal();
}

function editOutgoing(index) {
    const rec = outgoing[index];
    if (!rec) return;
    const opts = inventory.map(i =>
        `<option value="${esc(i.code)}" ${i.code === rec.code ? 'selected' : ''}>${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    openModal('تعديل صادر', `
        <div class="form-grid">
            <div class="form-group"><label>اليوم</label><select id="outgoing_day">${(['','الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']).map(d =>
                `<option ${d === rec.day ? 'selected' : ''}>${esc(d)}</option>`
            ).join('')}</select></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="outgoing_date" value="${esc(rec.date)}"></div>
            <div class="form-group"><label>كود الصنف</label><select id="outgoing_code" onchange="selectOutgoingItem()">${opts}</select></div>
            <div class="form-group"><label>كود وزارة</label><input type="text" id="outgoing_ministry_code" value="${esc(rec.ministryCode)}"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="outgoing_name" value="${esc(rec.name)}"></div>
            <div class="form-group"><label>الوحدة</label><input type="text" id="outgoing_unit" value="${esc(rec.unit)}"></div>
            <div class="form-group"><label>التصنيف</label><input type="text" id="outgoing_category" value="${esc(rec.category)}"></div>
            <div class="form-group"><label>النوع</label><input type="text" id="outgoing_type" value="${esc(rec.type)}"></div>
            <div class="form-group"><label>الكمية</label><input type="number" id="outgoing_qty" value="${rec.qty}" min="0" oninput="calcOutgoingTotal()"></div>
            <div class="form-group"><label>الجهة</label><input type="text" id="outgoing_destination" value="${esc(rec.destination)}" placeholder="أكتب اسم القسم"></div>
            <div class="form-group"><label>السعر</label><input type="number" id="outgoing_price" value="${rec.price}" min="0" step="0.01" oninput="calcOutgoingTotal()"></div>
            <div class="form-group"><label>الإجمالي</label><input type="text" id="outgoing_total" value="${rec.total}" readonly></div>
            <div class="form-group full"><label>ملاحظات</label><textarea id="outgoing_notes">${esc(rec.notes || '')}</textarea></div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateOutgoing(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
    setTimeout(() => calcOutgoingTotal(), 100);
}

function updateOutgoing(index) {
    const rec = outgoing[index];
    if (!rec) return;
    const oldCode = rec.code;
    const newCode = document.getElementById('outgoing_code').value.trim();
    if (!newCode || !inventory.some(i => i.code === newCode)) { showToast('يرجى اختيار كود صنف صحيح'); return; }
    Object.assign(rec, {
        day: document.getElementById('outgoing_day').value,
        date: document.getElementById('outgoing_date').value,
        code: newCode,
        ministryCode: document.getElementById('outgoing_ministry_code').value,
        name: document.getElementById('outgoing_name').value,
        unit: document.getElementById('outgoing_unit').value,
        category: document.getElementById('outgoing_category').value,
        type: document.getElementById('outgoing_type').value,
        qty: Number(document.getElementById('outgoing_qty').value) || 0,
        destination: document.getElementById('outgoing_destination').value,
        price: Number(document.getElementById('outgoing_price').value) || 0,
        notes: document.getElementById('outgoing_notes').value.trim()
    });
    rec.total = rec.qty * rec.price;
    recalcInventoryTotals(oldCode);
    if (oldCode !== newCode) recalcInventoryTotals(newCode);
    save();
    renderAll();
    closeModal();
}

function deleteOutgoing(index) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    const rec = outgoing[index];
    if (!rec) return;
    outgoing.splice(index, 1);
    recalcInventoryTotals(rec.code);
    save();
    renderAll();
}

// =============================================
// الإعارة CRUD
// =============================================
function selectLoanItem() {
    const code = document.getElementById('loan_code').value;
    const item = inventory.find(i => i.code === code);
    if (item) {
        document.getElementById('loan_ministry_code').value = item.ministryCode || '';
        document.getElementById('loan_name').value = item.name || '';
        document.getElementById('loan_unit').value = item.unit || '';
        document.getElementById('loan_category').value = item.category || '';
    }
}

function showAddLoanModal() {
    const opts = inventory.map(i =>
        `<option value="${esc(i.code)}">${esc(i.code)} - ${esc(i.name)} (${esc(i.type)})</option>`
    ).join('');
    const emptyMsg = inventory.length === 0 ? '<option value="" disabled>لا توجد أصناف - أضف أصنافاً أولاً</option>' : '<option value="">اختر صنفاً</option>';
    openModal('إضافة إعارة جديدة', `
        <div class="form-grid">
            <div class="form-group"><label>كود الصنف</label><select id="loan_code" onchange="selectLoanItem()">${emptyMsg}${opts}</select></div>
            <div class="form-group"><label>كود وزارة</label><input type="text" id="loan_ministry_code"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="loan_name"></div>
            <div class="form-group"><label>الوحدة</label><input type="text" id="loan_unit"></div>
            <div class="form-group"><label>التصنيف</label>${categoryFieldHtml('loan_category', '')}</div>
            <div class="form-group"><label>رصيد أول المدة</label><input type="number" id="loan_opening" value="0" min="0"></div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveLoan()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function saveLoan() {
    const code = document.getElementById('loan_code').value.trim();
    if (!code) { showToast('يرجى اختيار كود الصنف'); return; }
    if (loanItems.some(i => i.code === code)) { showToast('هذا الصنف موجود مسبقاً في الإعارة'); return; }
    loanItems.push({
        code, ministryCode: document.getElementById('loan_ministry_code').value,
        name: document.getElementById('loan_name').value,
        unit: document.getElementById('loan_unit').value,
        category: document.getElementById('loan_category').value,
        openingBalance: Number(document.getElementById('loan_opening').value) || 0,
        totalIn: 0, totalOut: 0
    });
    save();
    renderAll();
    closeModal();
}

function editLoan(index) {
    const item = loanItems[index];
    if (!item) return;
    openModal('تعديل إعارة', `
        <div class="form-grid">
            <div class="form-group"><label>كود الصنف</label><input type="text" value="${esc(item.code)}" readonly></div>
            <div class="form-group"><label>كود وزارة</label><input type="text" id="loan_ministry_code" value="${esc(item.ministryCode)}"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="loan_name" value="${esc(item.name)}"></div>
            <div class="form-group"><label>الوحدة</label><input type="text" id="loan_unit" value="${esc(item.unit)}"></div>
            <div class="form-group"><label>التصنيف</label>${categoryFieldHtml('loan_category', item.category)}</div>
            <div class="form-group"><label>رصيد أول المدة</label><input type="number" id="loan_opening" value="${item.openingBalance}" min="0"></div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateLoan(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function updateLoan(index) {
    const item = loanItems[index];
    if (!item) return;
    Object.assign(item, {
        ministryCode: document.getElementById('loan_ministry_code').value,
        name: document.getElementById('loan_name').value,
        unit: document.getElementById('loan_unit').value,
        category: document.getElementById('loan_category').value,
        openingBalance: Number(document.getElementById('loan_opening').value) || 0
    });
    save();
    renderAll();
    closeModal();
}

function deleteLoan(index) {
    if (!confirm('هل أنت متأكد من حذف هذه الإعارة؟')) return;
    const item = loanItems[index];
    if (!item) return;
    loanItems.splice(index, 1);
    loanIncoming = loanIncoming.filter(r => r.code !== item.code);
    SECT_MAP.loanIncoming = loanIncoming;
    save();
    renderAll();
}

// =============================================
// وارد الإعارة CRUD
// =============================================
function calcLoanIncomingTotal() {
    const qty = Number(document.getElementById('loan_incoming_qty').value) || 0;
    const price = Number(document.getElementById('loan_incoming_price').value) || 0;
    document.getElementById('loan_incoming_total').value = qty * price;
}

function showAddLoanIncomingModal() {
    const opts = loanItems.map(i =>
        `<option value="${esc(i.code)}">${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    const emptyMsg = loanItems.length === 0 ? '<option value="" disabled>لا توجد أصناف إعارة - أضف إعارة أولاً</option>' : '<option value="">اختر صنفاً</option>';
    openModal('إضافة وارد إعارة جديد', `
        <div class="form-grid">
            <div class="form-group"><label>اليوم</label><input type="text" id="loan_incoming_day" value="${today()}"></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="loan_incoming_date" value="${dateStr()}"></div>
            <div class="form-group"><label>كود الصنف</label><select id="loan_incoming_code" onchange="selectLoanIncomingItem()">${emptyMsg}${opts}</select></div>
            <div class="form-group full balance-hint" id="loan_incoming_balance"></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="loan_incoming_name"></div>
            <div class="form-group"><label>الكمية</label><input type="number" id="loan_incoming_qty" value="0" min="0" oninput="calcLoanIncomingTotal()"></div>
            <div class="form-group"><label>الجهة</label><select id="loan_incoming_source">
                <option value="">اختر الجهة</option>
                <option>مخازن وزارة الصحة</option><option>خزانة الأمريكي</option>
                <option>تبرعات</option><option>منظمة الصحة العالمية</option>
                <option>أونروا</option><option>الهلال الأحمر</option><option>أخرى</option>
            </select></div>
            <div class="form-group"><label>السعر</label><input type="number" id="loan_incoming_price" value="0" min="0" step="0.01" oninput="calcLoanIncomingTotal()"></div>
            <div class="form-group"><label>الإجمالي</label><input type="text" id="loan_incoming_total" readonly></div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveLoanIncoming()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function selectLoanIncomingItem() {
    const code = document.getElementById('loan_incoming_code').value;
    const item = loanItems.find(i => i.code === code);
    const bal = document.getElementById('loan_incoming_balance');
    document.getElementById('loan_incoming_name').value = item ? item.name || '' : '';
    if (item && bal) {
        const rem = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        bal.innerHTML = `الرصيد المتبقي في الإعارة: <strong>${rem}</strong>`;
    } else if (bal) {
        bal.innerHTML = '';
    }
}

function saveLoanIncoming() {
    const code = document.getElementById('loan_incoming_code').value.trim();
    if (!code) { showToast('يرجى اختيار كود الصنف'); return; }
    if (!loanItems.some(i => i.code === code)) { showToast('كود الصنف غير موجود في الإعارة'); return; }
    const qty = Number(document.getElementById('loan_incoming_qty').value) || 0;
    if (qty <= 0) { showToast('الكمية يجب أن تكون أكبر من صفر'); return; }
    loanIncoming.push({
        id: generateId(), day: document.getElementById('loan_incoming_day').value,
        date: document.getElementById('loan_incoming_date').value, code,
        name: document.getElementById('loan_incoming_name').value, qty,
        source: document.getElementById('loan_incoming_source').value,
        price: Number(document.getElementById('loan_incoming_price').value) || 0,
        total: qty * (Number(document.getElementById('loan_incoming_price').value) || 0)
    });
    recalcLoanTotals(code);
    save();
    renderAll();
    closeModal();
}

function editLoanIncoming(index) {
    const rec = loanIncoming[index];
    if (!rec) return;
    const opts = loanItems.map(i =>
        `<option value="${esc(i.code)}" ${i.code === rec.code ? 'selected' : ''}>${esc(i.code)} - ${esc(i.name)}</option>`
    ).join('');
    openModal('تعديل وارد إعارة', `
        <div class="form-grid">
            <div class="form-group"><label>اليوم</label><input type="text" id="loan_incoming_day" value="${esc(rec.day)}"></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="loan_incoming_date" value="${esc(rec.date)}"></div>
            <div class="form-group"><label>كود الصنف</label><select id="loan_incoming_code" onchange="selectLoanIncomingItem()">${opts}</select></div>
            <div class="form-group full"><label>اسم الصنف</label><input type="text" id="loan_incoming_name" value="${esc(rec.name)}"></div>
            <div class="form-group"><label>الكمية</label><input type="number" id="loan_incoming_qty" value="${rec.qty}" min="0" oninput="calcLoanIncomingTotal()"></div>
            <div class="form-group"><label>الجهة</label><select id="loan_incoming_source">${(['','مخازن وزارة الصحة','خزانة الأمريكي','تبرعات','منظمة الصحة العالمية','أونروا','الهلال الأحمر','أخرى']).map(c =>
                `<option ${c === rec.source ? 'selected' : ''}>${esc(c)}</option>`
            ).join('')}</select></div>
            <div class="form-group"><label>السعر</label><input type="number" id="loan_incoming_price" value="${rec.price}" min="0" step="0.01" oninput="calcLoanIncomingTotal()"></div>
            <div class="form-group"><label>الإجمالي</label><input type="text" id="loan_incoming_total" value="${rec.total}" readonly></div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateLoanIncoming(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
    setTimeout(() => calcLoanIncomingTotal(), 100);
}

function updateLoanIncoming(index) {
    const rec = loanIncoming[index];
    if (!rec) return;
    const oldCode = rec.code;
    const newCode = document.getElementById('loan_incoming_code').value.trim();
    if (!newCode || !loanItems.some(i => i.code === newCode)) { showToast('يرجى اختيار كود صنف صحيح'); return; }
    Object.assign(rec, {
        day: document.getElementById('loan_incoming_day').value,
        date: document.getElementById('loan_incoming_date').value,
        code: newCode,
        name: document.getElementById('loan_incoming_name').value,
        qty: Number(document.getElementById('loan_incoming_qty').value) || 0,
        source: document.getElementById('loan_incoming_source').value,
        price: Number(document.getElementById('loan_incoming_price').value) || 0
    });
    rec.total = rec.qty * rec.price;
    recalcLoanTotals(oldCode);
    if (oldCode !== newCode) recalcLoanTotals(newCode);
    save();
    renderAll();
    closeModal();
}

function deleteLoanIncoming(index) {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    const rec = loanIncoming[index];
    if (!rec) return;
    loanIncoming.splice(index, 1);
    recalcLoanTotals(rec.code);
    save();
    renderAll();
}

// =============================================
// الكهنة CRUD
// =============================================
function showAddKahanaModal() {
    openModal('إضافة كهنة', `
        <div class="form-grid">
            <div class="form-group full"><label>الاسم</label><input type="text" id="kahana_name" placeholder="الاسم"></div>
            <div class="form-group"><label>التصنيف</label><select id="kahana_category"><option value="">اختر التصنيف</option><option>أجهزة طبية</option><option>كهربائية</option><option>أقمشة</option><option>أثاث</option><option>مستلزمات طبية</option><option>أدوية</option><option>مواد تنظيف</option><option>قرطاسية</option><option>أخرى</option></select></div>
            <div class="form-group full"><label>التفاصيل</label><textarea id="kahana_details"></textarea></div>
            <div class="form-group full"><label>ملاحظات</label><textarea id="kahana_notes"></textarea></div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveKahana()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function saveKahana() {
    const name = document.getElementById('kahana_name').value.trim();
    if (!name) { showToast('يرجى إدخال الاسم'); return; }
    kahana.push({
        id: generateId(), name,
        category: document.getElementById('kahana_category').value,
        details: document.getElementById('kahana_details').value.trim(),
        notes: document.getElementById('kahana_notes').value.trim()
    });
    save();
    renderAll();
    closeModal();
}

function editKahana(index) {
    const item = kahana[index];
    if (!item) return;
    openModal('تعديل كهنة', `
        <div class="form-grid">
            <div class="form-group full"><label>الاسم</label><input type="text" id="kahana_name" value="${esc(item.name)}"></div>
            <div class="form-group"><label>التصنيف</label><select id="kahana_category">${(['','أجهزة طبية','كهربائية','أقمشة','أثاث','مستلزمات طبية','أدوية','مواد تنظيف','قرطاسية','أخرى']).map(c =>
                `<option ${c === item.category ? 'selected' : ''}>${esc(c)}</option>`
            ).join('')}</select></div>
            <div class="form-group full"><label>التفاصيل</label><textarea id="kahana_details">${esc(item.details || '')}</textarea></div>
            <div class="form-group full"><label>ملاحظات</label><textarea id="kahana_notes">${esc(item.notes || '')}</textarea></div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateKahana(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function updateKahana(index) {
    const item = kahana[index];
    if (!item) return;
    Object.assign(item, {
        name: document.getElementById('kahana_name').value.trim(),
        category: document.getElementById('kahana_category').value,
        details: document.getElementById('kahana_details').value.trim(),
        notes: document.getElementById('kahana_notes').value.trim()
    });
    save();
    renderAll();
    closeModal();
}

function deleteKahana(index) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    const item = kahana[index];
    if (!item) return;
    kahana.splice(index, 1);
    save();
    renderAll();
}

// ---- Tab Counters ----
function updateTabCounters() {
    const map = { inventory: inventory.length, incoming: incoming.length, outgoing: outgoing.length, loan: loanItems.length, kahana: kahana.length };
    document.querySelectorAll('.tab').forEach(t => {
        const key = t.dataset.tab;
        const old = t.querySelector('.badge');
        if (old) old.remove();
        if (key && map[key] !== undefined) {
            const b = document.createElement('span'); b.className = 'badge'; b.textContent = map[key];
            t.appendChild(b);
        }
    });
}

// ---- Scroll-to-Top ----
window.addEventListener('scroll', function() {
    document.getElementById('scrollTopBtn').classList.toggle('visible', window.scrollY > 300);
});

// ---- Ripple Effect ----
document.addEventListener('click', function(e) {
    const btn = e.target.closest('.toolbar button, .action-btn, .form-actions button, .tab, .btn-action, .navbar-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const span = document.createElement('span');
    span.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);width:100px;height:100px;margin-top:-50px;margin-left:-50px;top:${y}px;left:${x}px;transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;`;
    btn.style.position = 'relative'; btn.style.overflow = 'hidden';
    btn.appendChild(span);
    setTimeout(() => span.remove(), 600);
});

// ---- Sidebar toggle (mobile) ----
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// ---- Initial render ----
renderAll();
updateTabCounters();

// Auto-switch tab from URL hash (e.g., #tab-incoming)
if (window.location.hash) {
    const tab = window.location.hash.replace('#tab-', '');
    if (tab && document.getElementById(`tab-${tab}`)) {
        sidebarTab(tab);
    }
}
