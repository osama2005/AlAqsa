const AUTH_USER_KEY = 'inv_current_user';

function safeParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch(e) { return fallback; }
}

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

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
}

(function loadTheme() {
    if (localStorage.getItem('inv_theme') === 'dark') {
        document.body.classList.add('dark');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = '☀️';
    }
})();

function goInventory() {
    window.location.href = '../inventory/index.html';
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
            <td>${esc(u.username)}</td>
            <td><span class="role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}">${u.role === 'admin' ? 'أدمن' : 'مستخدم'}</span></td>
            <td>${u.canEdit ? '✅ نعم' : '❌ لا'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser(${i})">✏️</button>
                ${u.role !== 'admin' ? `<button class="action-btn delete-btn" onclick="deleteUser(${i})">🗑️</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function showAddUserModal() {
    openModal('إضافة مستخدم جديد', `
        <div class="form-grid">
            <div class="form-group">
                <label>اسم المستخدم</label>
                <input type="text" id="user_username" placeholder="أدخل اسم المستخدم">
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

function saveUser() {
    const username = document.getElementById('user_username').value.trim();
    const role = document.getElementById('user_role').value;
    const canEdit = document.getElementById('user_canEdit').value === 'true';
    if (!username) { alert('يرجى إدخال اسم المستخدم'); return; }
    const users = getUsers();
    if (users.some(u => u.username === username)) {
        alert('اسم المستخدم موجود مسبقاً');
        return;
    }
    users.push({ username, role, canEdit });
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

renderUsers();
