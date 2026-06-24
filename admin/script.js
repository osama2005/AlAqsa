const AUTH_USER_KEY = 'inv_current_user';

function safeParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e) { return fallback; }
}

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

(function checkAuth() {
    const user = safeParse(AUTH_USER_KEY, null);
    if (!user || user.role !== 'admin') {
        window.location.href = '../index.html';
    }
})();

function getUsers() {
    return safeParse('inv_users', []);
}

function saveUsers(users) {
    localStorage.setItem('inv_users', JSON.stringify(users));
}

function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setActiveHeartbeat() {
    const user = safeParse('inv_current_user', null);
    if (!user) return;
    const sessions = safeParse('inv_sessions', {});
    sessions[user.username] = { role: user.role, lastActive: Date.now() };
    localStorage.setItem('inv_sessions', JSON.stringify(sessions));
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    document.getElementById('themeBtn').classList.toggle('dark', isDark);
    localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
    const h = document.querySelector('#themeBtn .tt-handle i');
    if (h) h.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    const overlay = document.getElementById('themeOverlay');
    if (overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
}

(function loadTheme() {
    const isDark = localStorage.getItem('inv_theme') === 'dark';
    if (isDark) {
        document.body.classList.add('dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.classList.add('dark');
    }
    const h = document.querySelector('#themeBtn .tt-handle i');
    if (h) h.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
})();

function goInventory() {
    navigateWithProgress('../inventory/index.html');
}

function logout() {
    playSound('logout');
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('inv_auth');
    setTimeout(() => { window.location.href = '../index.html'; }, 300);
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    const users = getUsers();
    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td><span class="user-name">${esc(u.username)}</span></td>
            <td><span class="pass-mask">${u.password ? '•'.repeat(Math.min(u.password.length, 10)) : '—'}</span></td>
            <td><span class="role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}">${u.role === 'admin' ? 'أدمن' : 'مستخدم'}</span></td>
            <td>${u.canEdit ? '<span class="badge-yes"><i class="fas fa-check"></i> نعم</span>' : '<span class="badge-no"><i class="fas fa-xmark"></i> لا</span>'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser(${i})"><i class="fas fa-pen"></i></button>
                ${u.role !== 'admin' ? `<button class="action-btn delete-btn" onclick="deleteUser(${i})"><i class="fas fa-trash-can"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
    const admins = users.filter(u => u.role === 'admin').length;
    const regular = users.filter(u => u.role === 'user').length;
    document.getElementById('statTotalUsers').textContent = users.length;
    document.getElementById('statAdmins').textContent = admins;
    document.getElementById('statUsers').textContent = regular;
    const active = getActiveUsers().length;
    document.getElementById('statActive').textContent = active;
}

function showAddUserModal() {
    openModal('إضافة مستخدم جديد', `
        <div class="form-grid">
            <div class="form-group">
                <label>اسم المستخدم</label>
                <input type="text" id="user_username" placeholder="أدخل اسم المستخدم">
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="text" id="user_password" placeholder="أدخل كلمة المرور">
            </div>
            <div class="form-group">
                <label>الدور</label>
                <select id="user_role">
                    <option value="user">مستخدم</option>
                    <option value="admin">أدمن</option>
                </select>
            </div>
            <div class="form-group">
                <label>صلاحية التعديل</label>
                <select id="user_canEdit">
                    <option value="true">نعم - يمكنه التعديل والحذف</option>
                    <option value="false" selected>لا - مشاهدة فقط</option>
                </select>
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="saveUser()">حفظ</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
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

function saveUser() {
    const username = document.getElementById('user_username').value.trim();
    const password = document.getElementById('user_password').value.trim();
    const role = document.getElementById('user_role').value;
    const canEdit = document.getElementById('user_canEdit').value === 'true';
    if (!username) { showToast('يرجى إدخال اسم المستخدم'); return; }
    if (!password) { showToast('يرجى إدخال كلمة المرور'); return; }
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        showToast('اسم المستخدم موجود مسبقاً');
        return;
    }
    users.push({ username, password, role, canEdit });
    saveUsers(users);
    renderUsers();
    closeModal();
}

function editUser(index) {
    const users = getUsers();
    const user = users[index];
    if (!user) return;
    openModal('تعديل المستخدم', `
        <div class="form-grid">
            <div class="form-group">
                <label>اسم المستخدم</label>
                <input type="text" id="user_username" value="${esc(user.username)}" readonly="readonly">
            </div>
            <div class="form-group">
                <label>كلمة المرور</label>
                <input type="text" id="user_password" value="${esc(user.password || '')}" placeholder="اترك فارغاً إن لم ترد التغيير">
            </div>
            <div class="form-group">
                <label>الدور</label>
                <select id="user_role" ${user.role === 'admin' ? 'disabled="disabled"' : ''}>
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>مستخدم</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>أدمن</option>
                </select>
            </div>
            <div class="form-group">
                <label>صلاحية التعديل</label>
                <select id="user_canEdit">
                    <option value="true" ${user.canEdit ? 'selected' : ''}>نعم - يمكنه التعديل والحذف</option>
                    <option value="false" ${!user.canEdit ? 'selected' : ''}>لا - مشاهدة فقط</option>
                </select>
            </div>
            <div class="form-actions">
                <button class="save-btn" onclick="updateUser(${index})">تحديث</button>
                <button class="cancel-btn" onclick="closeModal()">إلغاء</button>
            </div>
        </div>
    `);
}

function updateUser(index) {
    const users = getUsers();
    const user = users[index];
    if (!user) return;
    if (user.role !== 'admin') {
        user.role = document.getElementById('user_role').value;
    }
    user.canEdit = document.getElementById('user_canEdit').value === 'true';
    const newPass = document.getElementById('user_password').value.trim();
    if (newPass) user.password = newPass;
    saveUsers(users);
    renderUsers();
    closeModal();
}

function deleteUser(index) {
    const users = getUsers();
    const user = users[index];
    if (!user || user.role === 'admin') return;
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.username}"؟`)) return;
    users.splice(index, 1);
    saveUsers(users);
    renderUsers();
}

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

// ---- Sidebar toggle (mobile) ----
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// ---- Active Users Monitor ----
function getActiveUsers() {
    const sessions = safeParse('inv_sessions', {});
    const now = Date.now();
    const TIMEOUT = 60000;
    const active = [];
    for (const [username, data] of Object.entries(sessions)) {
        if (data && data.lastActive && (now - data.lastActive) < TIMEOUT) {
            active.push({ username, role: data.role });
        }
    }
    active.sort((a, b) => a.username.localeCompare(b.username));
    return active;
}

function renderActiveUsers() {
    const list = document.getElementById('activeUsersList');
    const active = getActiveUsers();
    const activeEl = document.getElementById('statActive');
    if (activeEl) activeEl.textContent = active.length;
    if (active.length === 0) {
        list.innerHTML = '<span class="bar-empty">لا يوجد مستخدمون نشطون</span>';
        return;
    }
    list.innerHTML = active.map(u =>
        `<span class="active-user-badge">
            <span class="dot"></span>
            ${esc(u.username)}
            <span class="role-tag"><i class="fas fa-${u.role === 'admin' ? 'crown' : 'user'}"></i> ${u.role === 'admin' ? 'أدمن' : 'مستخدم'}</span>
        </span>`
    ).join('');
}

setActiveHeartbeat();
setInterval(renderActiveUsers, 5000);
renderActiveUsers();

renderUsers();

window.addEventListener('scroll', function() {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 300);
});

function adminTab(name) {
    document.querySelectorAll('.sidebar-nav .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const link = document.querySelector(`.sidebar-nav .tab[data-tab="${name}"]`);
    if (link) link.classList.add('active');
    const section = document.getElementById(`tab-${name}`);
    if (section) section.classList.add('active');
    if (name === 'lists') renderLists();
}

// ---- List Management ----
const LIST_DEFS = [
    { key:'inv_units',       label:'الوحدات',        icon:'fa-ruler-combined', seed:['قطعة','حبة','كرتونة','صندوق','زوج','لتر','كيلو','متر','طقم','علبة','بكرة','رول'] },
    { key:'inv_categories',  label:'التصنيفات',      icon:'fa-tags',          seed:['أجهزة طبية','كهربائية','أقمشة','أثاث','مستلزمات طبية','أدوية','مواد تنظيف','قرطاسية','أخرى'] },
    { key:'inv_types',       label:'الأنواع',         icon:'fa-layer-group',   seed:['مستهلك','مستديم'] },
    { key:'inv_sources',     label:'جهات الوارد',     icon:'fa-arrow-down',    seed:['مخازن وزارة الصحة','خزانة الأمريكي','تبرعات','منظمة الصحة العالمية','أونروا','الهلال الأحمر','أخرى'] },
    { key:'inv_destinations',label:'جهات الصادر',     icon:'fa-arrow-up',      seed:['أقسام المستشفى','مخازن وزارة الصحة','تبرعات','هيئة','محافظة','أخرى'] },
];

function getList(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveList(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

function seedLists() {
    LIST_DEFS.forEach(d => {
        if (!localStorage.getItem(d.key)) saveList(d.key, d.seed);
    });
}

function addListItem(key) {
    const input = document.getElementById(`li_input_${key}`);
    const val = input ? input.value.trim() : '';
    if (!val) { showToast('يرجى إدخال قيمة'); return; }
    let items = getList(key);
    if (items.includes(val)) { showToast('القيمة موجودة مسبقاً'); return; }
    items.push(val);
    items.sort();
    saveList(key, items);
    if (input) input.value = '';
    renderLists();
}

function deleteListItem(key, index) {
    if (!confirm('هل أنت متأكد من حذف هذه القيمة؟')) return;
    let items = getList(key);
    items.splice(index, 1);
    saveList(key, items);
    renderLists();
}

function renameListItem(key, index) {
    let items = getList(key);
    const oldVal = items[index];
    const newVal = prompt('أدخل القيمة الجديدة:', oldVal);
    if (!newVal || !newVal.trim() || newVal.trim() === oldVal) return;
    if (items.includes(newVal.trim())) { showToast('القيمة موجودة مسبقاً'); return; }
    items[index] = newVal.trim();
    saveList(key, items);
    renderLists();
}

function renderLists() {
    const body = document.getElementById('listsBody');
    body.innerHTML = LIST_DEFS.map(d => {
        const items = getList(d.key);
        return `
        <div class="list-manager">
            <div class="list-header"><i class="fas ${d.icon}"></i> ${d.label} <span class="list-count">${items.length}</span></div>
            <div class="list-items" id="li_items_${d.key}">
                ${items.length ? items.map((v, i) => `
                    <span class="list-tag">
                        <span class="list-tag-text" ondblclick="renameListItem('${d.key}',${i})" title="انقر مرتين للتعديل">${esc(v)}</span>
                        <button class="list-tag-del" onclick="deleteListItem('${d.key}',${i})" title="حذف">&times;</button>
                    </span>`).join('') : '<span class="list-empty">لا توجد قيم</span>'}
            </div>
            <div class="list-add">
                <input type="text" id="li_input_${d.key}" placeholder="إضافة قيمة جديدة..." onkeydown="if(event.key==='Enter')addListItem('${d.key}')">
                <button class="btn-list-add" onclick="addListItem('${d.key}')"><i class="fas fa-plus"></i></button>
            </div>
        </div>`;
    }).join('');
}

seedLists();
