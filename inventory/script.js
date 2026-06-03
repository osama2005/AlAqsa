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

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,5);
}

// ---- Color Customization System ----
const COLORS = ['', '#ffcdd2','#f8bbd0','#e1bee7','#bbdefb','#b3e5fc','#b2dfdb','#c8e6c9','#fff9c4','#ffe0b2','#ffccbc','#d7ccc8','#f5f5f5'];

const SECT_KEYS = { inventory:['code','ministryCode','name','unit','category','type','openingBalance','totalIn','totalOut','remaining','price','notes'], incoming:['day','date','code','ministryCode','name','unit','category','type','qty','source','price','total','notes'], outgoing:['day','date','code','ministryCode','name','unit','category','type','qty','destination','price','total','notes'], loan:['code','ministryCode','name','unit','category','openingBalance','totalIn','totalOut','remaining'], loanIncoming:['day','date','code','name','qty','source','price','total'], kahana:['name','details','notes'] };
const SECT_DISPLAY = { inventory:['كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','رصيد أول','الوارد','الصادر','المتبقي','السعر','ملاحظات'], incoming:['اليوم','التاريخ','كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','الكمية','الجهة','السعر','الإجمالي','ملاحظات'], outgoing:['اليوم','التاريخ','كود الصنف','كود وزارة','اسم الصنف','الوحدة','التصنيف','النوع','الكمية','الجهة','السعر','الإجمالي','ملاحظات'], loan:['كود','كود وزارة','الاسم','الوحدة','التصنيف','رصيد أول','الوارد','الصادر','المتبقي'], loanIncoming:['اليوم','التاريخ','كود','الاسم','الكمية','الجهة','السعر','الإجمالي'], kahana:['الاسم','التفاصيل','ملاحظات'] };

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

function showColorsPanel() {
    const sect = document.getElementById('tab-inventory').classList.contains('active') ? 'inventory'
        : document.getElementById('tab-incoming').classList.contains('active') ? 'incoming'
        : document.getElementById('tab-outgoing').classList.contains('active') ? 'outgoing'
        : document.getElementById('tab-loan').classList.contains('active') ? 'loan'
        : document.getElementById('tab-kahana')?.classList.contains('active') ? 'kahana' : 'inventory';
    const arr = SECT_MAP[sect] || [];
    const cols = SECT_KEYS[sect] || [];
    const dcols = SECT_DISPLAY[sect] || [];
    const rowOpts = arr.map((r,i) => `<option value="${i}">${esc(r.code||r.name||'')} - ${esc(r.name||r.code||'')}</option>`).join('');
    const colOpts = cols.map((k,i) => `<option value="${k}">${esc(dcols[i]||k)}</option>`).join('');
    openModal('<i class="fas fa-palette"></i> تخصيص الألوان', `
        <div style="margin-bottom:20px">
            <label style="font-weight:bold;display:block;margin-bottom:6px">القسم:</label>
            <select id="cpSect" onchange="changeCpSection()" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;font-size:14px">
                <option value="inventory" ${sect==='inventory'?'selected':''}>المخزون</option>
                <option value="incoming" ${sect==='incoming'?'selected':''}>الوارد</option>
                <option value="outgoing" ${sect==='outgoing'?'selected':''}>الصادر</option>
                <option value="loan" ${sect==='loan'?'selected':''}>الإعارة</option>
                <option value="loanIncoming" ${sect==='loanIncoming'?'selected':''}>وارد الإعارة</option>
                <option value="kahana" ${sect==='kahana'?'selected':''}>الكهنة</option>
            </select>
        </div>
        <div id="cpBody">
            ${renderCpBody(sect)}
        </div>
    `);
}

function renderCpBody(sect) {
    const arr = SECT_MAP[sect] || [];
    const cols = SECT_KEYS[sect] || [];
    const dcols = SECT_DISPLAY[sect] || [];
    const rowOpts = arr.map((r,i) => `<option value="${i}">${esc(r.code||r.name||'')} - ${esc(r.name||r.code||'')}</option>`).join('');
    const colOpts = cols.map((k,i) => `<option value="${k}">${esc(dcols[i]||k)}</option>`).join('');
    return `
        <div style="margin-bottom:15px;padding:12px;background:#f9f9f9;border-radius:8px">
            <h4 style="margin-bottom:8px;color:#1a7a4c"><i class="fas fa-table-cells"></i> الصفوف (الخلفية + النص)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div><label style="font-size:12px">الصف:</label>
                    <select id="cpRow" onchange="updateCpRowPreview()" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ddd;font-size:13px">${rowOpts || '<option>لا توجد بيانات</option>'}</select></div>
                <div style="display:flex;gap:6px;align-items:end;flex-wrap:wrap">
                    <div><label style="font-size:12px">خلفية</label><input type="color" id="cpRowBg" value="#ffffff" style="width:40px;height:32px;border:none;cursor:pointer;display:block"></div>
                    <div><label style="font-size:12px">نص</label><input type="color" id="cpRowTx" value="#000000" style="width:40px;height:32px;border:none;cursor:pointer;display:block"></div>
                    <button class="save-btn" onclick="applyCpRow()" style="padding:6px 12px;font-size:12px">تطبيق</button>
                    <button onclick="clearCpRow()" style="padding:6px 10px;font-size:11px;background:#e0e0e0;border:none;border-radius:6px;cursor:pointer"><i class="fas fa-rotate-left"></i> إزالة</button>
                </div>
            </div>
        </div>
        <div style="margin-bottom:15px;padding:12px;background:#f9f9f9;border-radius:8px">
            <h4 style="margin-bottom:8px;color:#1a7a4c"><i class="fas fa-columns"></i> الأعمدة (لون النص)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div><label style="font-size:12px">العمود:</label>
                    <select id="cpCol" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ddd;font-size:13px">${colOpts || '<option>لا توجد أعمدة</option>'}</select></div>
                <div style="display:flex;gap:6px;align-items:end;flex-wrap:wrap">
                    <div><label style="font-size:12px">لون النص</label><input type="color" id="cpColTx" value="#000000" style="width:40px;height:32px;border:none;cursor:pointer;display:block"></div>
                    <button class="save-btn" onclick="applyCpCol()" style="padding:6px 12px;font-size:12px">تطبيق</button>
                    <button onclick="clearCpCol()" style="padding:6px 10px;font-size:11px;background:#e0e0e0;border:none;border-radius:6px;cursor:pointer"><i class="fas fa-rotate-left"></i> إزالة</button>
                </div>
            </div>
        </div>
        <div style="padding:12px;background:#f9f9f9;border-radius:8px">
            <h4 style="margin-bottom:8px;color:#1a7a4c"><i class="fas fa-border-all"></i> الخلايا (لون النص)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                <div><label style="font-size:12px">الصف:</label>
                    <select id="cpCellRow" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ddd;font-size:13px">${rowOpts || '<option>لا توجد بيانات</option>'}</select></div>
                <div><label style="font-size:12px">العمود:</label>
                    <select id="cpCellCol" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ddd;font-size:13px">${colOpts || '<option>لا توجد أعمدة</option>'}</select></div>
                <div style="display:flex;gap:6px;align-items:end;flex-wrap:wrap">
                    <div><label style="font-size:12px">لون النص</label><input type="color" id="cpCellTx" value="#000000" style="width:40px;height:32px;border:none;cursor:pointer;display:block"></div>
                    <button class="save-btn" onclick="applyCpCell()" style="padding:6px 12px;font-size:12px">تطبيق</button>
                    <button onclick="clearCpCell()" style="padding:6px 10px;font-size:11px;background:#e0e0e0;border:none;border-radius:6px;cursor:pointer"><i class="fas fa-rotate-left"></i> إزالة</button>
                </div>
            </div>
        </div>
    `;
}

function changeCpSection() {
    const s = document.getElementById('cpSect').value;
    document.getElementById('cpBody').innerHTML = renderCpBody(s);
}

function applyCpRow() {
    const s = document.getElementById('cpSect').value, idx = Number(document.getElementById('cpRow').value);
    const arr = SECT_MAP[s]; if (!arr || !arr[idx]) return;
    arr[idx]._color = document.getElementById('cpRowBg').value !== '#ffffff' ? document.getElementById('cpRowBg').value : undefined;
    arr[idx]._textColor = document.getElementById('cpRowTx').value !== '#000000' ? document.getElementById('cpRowTx').value : undefined;
    save(); renderAll(); updateCpRowPreview();
}
function clearCpRow() {
    const s = document.getElementById('cpSect').value, idx = Number(document.getElementById('cpRow').value);
    const arr = SECT_MAP[s]; if (!arr || !arr[idx]) return;
    arr[idx]._color = undefined; arr[idx]._textColor = undefined; save(); renderAll(); updateCpRowPreview();
}
function updateCpRowPreview() {
    const s = document.getElementById('cpSect').value, idx = Number(document.getElementById('cpRow').value);
    const arr = SECT_MAP[s]; if (!arr || !arr[idx]) return;
    const item = arr[idx];
    document.getElementById('cpRowBg').value = item._color || '#ffffff';
    document.getElementById('cpRowTx').value = item._textColor || '#000000';
}
function applyCpCol() {
    const s = document.getElementById('cpSect').value, col = document.getElementById('cpCol').value;
    const c = document.getElementById('cpColTx').value;
    if (!colColors[s]) colColors[s] = {};
    colColors[s][col] = c !== '#000000' ? c : undefined;
    if (!colColors[s][col]) delete colColors[s][col];
    saveColColors(); renderAll();
}
function clearCpCol() {
    const s = document.getElementById('cpSect').value, col = document.getElementById('cpCol').value;
    if (colColors[s]) delete colColors[s][col];
    saveColColors(); renderAll();
}
function applyCpCell() {
    const s = document.getElementById('cpSect').value, idx = Number(document.getElementById('cpCellRow').value), col = document.getElementById('cpCellCol').value;
    const arr = SECT_MAP[s]; if (!arr || !arr[idx]) return;
    if (!arr[idx]._cellColors) arr[idx]._cellColors = {};
    arr[idx]._cellColors[col] = document.getElementById('cpCellTx').value !== '#000000' ? document.getElementById('cpCellTx').value : undefined;
    if (!arr[idx]._cellColors[col]) delete arr[idx]._cellColors[col];
    save(); renderAll();
}
function clearCpCell() {
    const s = document.getElementById('cpSect').value, idx = Number(document.getElementById('cpCellRow').value), col = document.getElementById('cpCellCol').value;
    const arr = SECT_MAP[s]; if (!arr || !arr[idx]) return;
    if (arr[idx]._cellColors) delete arr[idx]._cellColors[col];
    save(); renderAll();
}

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
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('themeBtn').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
    const overlay = document.getElementById('themeOverlay');
    if (overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
}

(function loadTheme() {
    if (localStorage.getItem('inv_theme') === 'dark') {
        document.body.classList.add('dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
    }
})();

/* === Background Selector === */
const BG_MAP = {
    default: null,
    earth: '../photo/planet-earth-dark-3840x2160-26342.jpg',
    mars: '../photo/mars-red-planet-3840x2160-26347.jpg',
    jupiter: '../photo/jupiter-dark-3840x2160-26348.png',
    moon: '../photo/moon-dark-3840x2160-26344.png',
    mercury: '../photo/planet-mercury-dark-3840x2160-26345.png',
    venus: '../photo/planet-venus-dark-3840x2160-26351.png',
    saturn: '../photo/saturn-dark-3840x2160-26350.png',
};

function toggleBgDropdown() {
    const menu = document.getElementById('bgMenu');
    if (menu) menu.classList.toggle('show');
}

function setBg(name) {
    const overlay = document.getElementById('bgOverlay');
    const path = BG_MAP[name];
    overlay.style.backgroundImage = path ? `url(${path})` : 'none';
    localStorage.setItem('inv_bg', name);
    document.querySelectorAll('#bgMenu button').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`#bgMenu button[data-bg="${name}"]`);
    if (btn) btn.classList.add('active');
    const menu = document.getElementById('bgMenu');
    if (menu) menu.classList.remove('show');
}

(function loadBg() {
    setBg(localStorage.getItem('inv_bg') || 'default');
})();

document.addEventListener('click', function(e) {
    const menu = document.getElementById('bgMenu');
    if (menu && !e.target.closest('.bg-dropdown')) menu.classList.remove('show');
});

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
        t.style.opacity = '0';
    });
    const tabBtn = document.querySelector(`.tab[data-tab="${name}"]`);
    if (tabBtn) tabBtn.classList.add('active');
    const target = document.getElementById(`tab-${name}`);
    if (target) {
        target.classList.add('active');
        setTimeout(() => target.style.opacity = '1', 20);
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
        <td ${tdStyle(item,'kahana',c[1])}>${esc(item.details || '')}</td>
        <td ${tdStyle(item,'kahana',c[2])}>${esc(item.notes || '')}</td>
        <td>${canEdit ? `
            ${getColorBtn(item, 'kahana', i)}
            <button class="action-btn edit-btn" onclick="editKahana(${i})"><i class="fas fa-pen"></i></button>
            <button class="action-btn delete-btn" onclick="deleteKahana(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
        </td>
    </tr>`}).join('');
}

function renderAll() {
    renderInventory();
    renderIncoming();
    renderOutgoing();
    renderLoan();
    renderLoanIncoming();
    renderKahana();
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
        data = kahana.map(i => ({ 'الاسم': i.name, 'التفاصيل': i.details || '', 'ملاحظات': i.notes || '' }));
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
                <input type="text" id="item_unit" placeholder="مثال: عدد، كرتون">
            </div>
            <div class="form-group">
                <label>التصنيف</label>
                <select id="item_category">
                    <option value="">اختر التصنيف</option>
                    <option>أجهزة طبية</option><option>أجهزة كهربائية</option>
                    <option>أقمشة وملبوسات</option><option>أثاث مكتبي</option>
                    <option>مستلزمات طبية</option><option>أدوية</option>
                    <option>مواد تنظيف</option><option>قرطاسية</option><option>أخرى</option>
                </select>
            </div>
            <div class="form-group">
                <label>النوع</label>
                <select id="item_type">
                    <option value="مستهلك">مستهلك</option>
                    <option value="مستديم">مستديم</option>
                </select>
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
    if (!code) { alert('يرجى إدخال كود الصنف'); return; }
    if (inventory.some(i => i.code === code)) { alert('كود الصنف موجود مسبقاً'); return; }
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
                <input type="text" id="item_unit" value="${esc(item.unit)}">
            </div>
            <div class="form-group">
                <label>التصنيف</label>
                <select id="item_category">${(['أجهزة طبية','أجهزة كهربائية','أقمشة وملبوسات','أثاث مكتبي','مستلزمات طبية','أدوية','مواد تنظيف','قرطاسية','أخرى']).map(c =>
                    `<option ${c === item.category ? 'selected' : ''}>${esc(c)}</option>`
                ).join('')}</select>
            </div>
            <div class="form-group">
                <label>النوع</label>
                <select id="item_type">
                    <option ${item.type === 'مستهلك' ? 'selected' : ''} value="مستهلك">مستهلك</option>
                    <option ${item.type === 'مستديم' ? 'selected' : ''} value="مستديم">مستديم</option>
                </select>
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
                <select id="incoming_source">
                    <option value="">اختر الجهة</option>
                    <option>مخازن وزارة الصحة</option><option>خزانة الأمريكي</option>
                    <option>تبرعات</option><option>منظمة الصحة العالمية</option>
                    <option>أونروا</option><option>الهلال الأحمر</option>
                    <option>شراء مباشر</option><option>أخرى</option>
                </select>
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
    if (!code) { alert('يرجى اختيار كود الصنف'); return; }
    if (!inventory.some(i => i.code === code)) { alert('كود الصنف غير موجود في المخزون'); return; }
    const qty = Number(document.getElementById('incoming_qty').value) || 0;
    if (qty <= 0) { alert('الكمية يجب أن تكون أكبر من صفر'); return; }
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
            <div class="form-group"><label>الجهة</label><select id="incoming_source">${(['','مخازن وزارة الصحة','خزانة الأمريكي','تبرعات','منظمة الصحة العالمية','أونروا','الهلال الأحمر','شراء مباشر','أخرى']).map(c =>
                `<option ${c === rec.source ? 'selected' : ''}>${esc(c)}</option>`
            ).join('')}</select></div>
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
    if (!newCode || !inventory.some(i => i.code === newCode)) { alert('يرجى اختيار كود صنف صحيح'); return; }
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
            <div class="form-group"><label>اليوم</label><input type="text" id="outgoing_day" value="${today()}"></div>
            <div class="form-group"><label>التاريخ</label><input type="text" id="outgoing_date" value="${dateStr()}"></div>
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
    if (!code) { alert('يرجى اختيار كود الصنف'); return; }
    if (!inventory.some(i => i.code === code)) { alert('كود الصنف غير موجود في المخزون'); return; }
    const qty = Number(document.getElementById('outgoing_qty').value) || 0;
    if (qty <= 0) { alert('الكمية يجب أن تكون أكبر من صفر'); return; }
    const item = inventory.find(i => i.code === code);
    if (item) {
        const rem = (item.openingBalance || 0) + (item.totalIn || 0) - (item.totalOut || 0);
        if (qty > rem) { alert(`الرصيد المتبقي غير كافٍ! المتاح: ${rem}`); return; }
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
            <div class="form-group"><label>اليوم</label><input type="text" id="outgoing_day" value="${esc(rec.day)}"></div>
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
    if (!newCode || !inventory.some(i => i.code === newCode)) { alert('يرجى اختيار كود صنف صحيح'); return; }
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
            <div class="form-group"><label>التصنيف</label><input type="text" id="loan_category"></div>
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
    if (!code) { alert('يرجى اختيار كود الصنف'); return; }
    if (loanItems.some(i => i.code === code)) { alert('هذا الصنف موجود مسبقاً في الإعارة'); return; }
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
            <div class="form-group"><label>التصنيف</label><input type="text" id="loan_category" value="${esc(item.category)}"></div>
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
    if (!code) { alert('يرجى اختيار كود الصنف'); return; }
    if (!loanItems.some(i => i.code === code)) { alert('كود الصنف غير موجود في الإعارة'); return; }
    const qty = Number(document.getElementById('loan_incoming_qty').value) || 0;
    if (qty <= 0) { alert('الكمية يجب أن تكون أكبر من صفر'); return; }
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
    if (!newCode || !loanItems.some(i => i.code === newCode)) { alert('يرجى اختيار كود صنف صحيح'); return; }
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
    if (!name) { alert('يرجى إدخال الاسم'); return; }
    kahana.push({
        id: generateId(), name,
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

// ---- Initial render ----
renderAll();
