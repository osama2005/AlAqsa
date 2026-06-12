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

function detectKeyboardLang(e) {
    const el = document.getElementById('kbLang');
    if (!el) return;
    const key = e.key;
    if (key.length !== 1) return;
    const code = key.charCodeAt(0);
    const isArabic = code >= 0x0600 && code <= 0x06FF || code >= 0x0750 && code <= 0x077F || code >= 0x08A0 && code <= 0x08FF || code === 0x061F || code === 0x0660 || code === 0x0020;
    if (isArabic) { el.textContent = 'AR'; el.className = 'kb-badge ar'; }
    else if (code >= 0x0041 && code <= 0x005A || code >= 0x0061 && code <= 0x007A || code >= 0x0030 && code <= 0x0039) { el.textContent = 'EN'; el.className = 'kb-badge en'; }
}

function toggleUserVis() {
    const input = document.getElementById('username');
    const btn = document.getElementById('toggleUserBtn');
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('username');
    if (input) {
        input.addEventListener('keydown', detectKeyboardLang);
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') login();
        });
    }
});

(function seed() {
    if (!localStorage.getItem('inv_users')) {
        localStorage.setItem('inv_users', JSON.stringify([
            { username: 'admin123', role: 'admin', canEdit: true }
        ]));
    }
})();

function setActiveHeartbeat() {
    const user = safeParse('inv_current_user', null);
    if (!user) return;
    const sessions = safeParse('inv_sessions', {});
    sessions[user.username] = { role: user.role, lastActive: Date.now() };
    localStorage.setItem('inv_sessions', JSON.stringify(sessions));
}

function login() {
    const username = document.getElementById('username').value.trim();
    const errorEl = document.getElementById('errorMsg');
    if (!username) {
        errorEl.textContent = 'الرجاء إدخال اسم المستخدم';
        errorEl.style.display = 'block';
        return;
    }
    const users = safeParse('inv_users', []);
    if (!Array.isArray(users)) {
        errorEl.textContent = 'خطأ في بيانات المستخدمين';
        errorEl.style.display = 'block';
        return;
    }
    const user = users.find(u => u && u.username === username);
    if (!user) {
        errorEl.textContent = 'اسم المستخدم غير صحيح';
        errorEl.style.display = 'block';
        return;
    }
    errorEl.style.display = 'none';
    playSound('login');
    localStorage.setItem('inv_auth', 'active');
    localStorage.setItem('inv_current_user', JSON.stringify(user));
    setActiveHeartbeat();
    const overlay = document.getElementById('successOverlay');
    if (overlay) overlay.classList.add('active');
    setTimeout(() => {
        if (user.role === 'admin') {
            window.location.href = 'admin/index.html';
        } else {
            window.location.href = 'inventory/index.html';
        }
    }, 1200);
}

(function loadTheme() {
    if (localStorage.getItem('inv_theme') === 'dark') {
        document.body.classList.add('dark');
    }
})();

function setThemeIcons(isDark) {
    const icon = isDark ? 'fa-sun' : 'fa-moon';
    document.querySelectorAll('.theme-toggle').forEach(b => b.innerHTML = `<i class="fas ${icon}"></i>`);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    setThemeIcons(isDark);
    localStorage.setItem('inv_theme', isDark ? 'dark' : 'light');
    const overlay = document.getElementById('themeOverlay');
    if (overlay) { overlay.classList.remove('active'); void overlay.offsetWidth; overlay.classList.add('active'); }
}

(function initThemeBtn() {
    const isDark = document.body.classList.contains('dark');
    if (isDark) setThemeIcons(true);
})();



