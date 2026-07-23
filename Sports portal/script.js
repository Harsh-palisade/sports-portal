// ===== SEED DATA (only runs once) =====
function initData() {
    if (localStorage.getItem("dataInitialized")) return;

    const coach = { username: "coach1", password: "coach123" };

    const players = [
        { id: "p1", username: "player1", password: "player123", name: "Alex Johnson",
          fees: { amount: 150, paid: false },
          stats: { matches: 5, runs: 120, wickets: 3 } },
        { id: "p2", username: "player2", password: "player123", name: "Sam Lee",
          fees: { amount: 150, paid: true },
          stats: { matches: 6, runs: 95, wickets: 8 } }
    ];

    const parents = [
        { username: "parent1", password: "parent123", childId: "p1" },
        { username: "parent2", password: "parent123", childId: "p2" }
    ];

    const matches = [
        { id: "m1", opponent: "Riverdale CC", date: "2026-07-20", venue: "Central Oval" },
        { id: "m2", opponent: "Northside Warriors", date: "2026-07-27", venue: "Home Ground" }
    ];

    const announcements = [
        { id: "a1", text: "Training moved to Thursday this week.", date: "2026-07-10" }
    ];

    localStorage.setItem("coach", JSON.stringify(coach));
    localStorage.setItem("players", JSON.stringify(players));
    localStorage.setItem("parents", JSON.stringify(parents));
    localStorage.setItem("matches", JSON.stringify(matches));
    localStorage.setItem("announcements", JSON.stringify(announcements));
    localStorage.setItem("dataInitialized", "true");
}

function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function saveData(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function login() {
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
        alert("Please fill all fields");
        return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        alert("Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        return;
    }

    const account = findAccount(role, username);

    if (!account) {
        logAttempt(username, role, false, "Account not found");
        alert("Incorrect username or password for " + role);
        return;
    }

    if (account.active === false) {
        logAttempt(username, role, false, "Account disabled");
        alert("This account has been disabled. Contact your coach.");
        return;
    }

    if (account.locked) {
        logAttempt(username, role, false, "Account locked");
        alert("This account is locked due to too many failed attempts. Contact your coach.");
        return;
    }

    if (account.password !== password) {
        account.failedAttempts = (account.failedAttempts || 0) + 1;
        if (account.failedAttempts >= MAX_LOGIN_ATTEMPTS) account.locked = true;
        persistAccountByRole(role, account);
        logAttempt(username, role, false, account.locked ? "Account locked (too many attempts)" : "Incorrect password");
        alert(account.locked ? "Account locked due to too many failed attempts." : "Incorrect username or password for " + role);
        return;
    }

    account.failedAttempts = 0;
    persistAccountByRole(role, account);

    let linkedPlayerId = null;
    if (role === "parent") linkedPlayerId = account.childId;
    if (role === "player") linkedPlayerId = account.id;

    logAttempt(username, role, true);

    localStorage.setItem("loggedInRole", role);
    localStorage.setItem("loggedInUser", username);
    if (linkedPlayerId) localStorage.setItem("linkedPlayerId", linkedPlayerId);
    else localStorage.removeItem("linkedPlayerId");

    window.location.href = "dashboard." + role + ".html";
}

// ===== NAVBAR =====
function renderNavbar() {
    const role = localStorage.getItem("loggedInRole");
    const username = localStorage.getItem("loggedInUser");
    const badge = document.getElementById("role-badge");
    const userLabel = document.getElementById("username-label");
    if (badge && role) badge.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    if (userLabel && username) userLabel.textContent = username;
}

// ===== MATCHES =====
function renderMatches() {
    const container = document.getElementById("matches-list");
    if (!container) return;
    const matches = getData("matches");
    container.innerHTML = matches.length ? matches.map(m => `
        <div class="match-item"><strong>vs ${m.opponent}</strong><br>📅 ${m.date} &nbsp; 📍 ${m.venue}</div>
    `).join("") : "<p>No matches scheduled yet.</p>";
}

function addMatch() {
    const opponent = document.getElementById("new-opponent").value.trim();
    const date = document.getElementById("new-date").value;
    const venue = document.getElementById("new-venue").value.trim();
    if (!opponent || !date || !venue) { alert("Fill all match fields"); return; }

    const matches = getData("matches");
    matches.push({ id: "m" + Date.now(), opponent, date, venue });
    saveData("matches", matches);
    renderMatches();
    document.getElementById("new-opponent").value = "";
    document.getElementById("new-date").value = "";
    document.getElementById("new-venue").value = "";
}

// ===== FEES =====
function renderFeesCoach() {
    const container = document.getElementById("fees-list");
    if (!container) return;
    const players = getData("players");
    container.innerHTML = players.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <p>Fee: $${p.fees.amount} — Status:
                <strong style="color:${p.fees.paid ? '#7CFC00' : '#ff6b6b'}">
                    ${p.fees.paid ? 'Paid' : 'Unpaid'}
                </strong>
            </p>
            <button onclick="toggleFee('${p.id}')">
                Mark as ${p.fees.paid ? 'Unpaid' : 'Paid'}
            </button>
        </div>
    `).join("");
}

function toggleFee(playerId) {
    const players = getData("players");
    const player = players.find(p => p.id === playerId);
    player.fees.paid = !player.fees.paid;
    saveData("players", players);
    renderFeesCoach();
}

function renderFeeForLinkedPlayer() {
    const container = document.getElementById("fee-status");
    if (!container) return;
    const linkedId = localStorage.getItem("linkedPlayerId");
    const player = getData("players").find(p => p.id === linkedId);
    if (!player) return;
    container.innerHTML = `
        <p>Fee amount: $${player.fees.amount}</p>
        <p>Status: <strong style="color:${player.fees.paid ? '#7CFC00' : '#ff6b6b'}">
            ${player.fees.paid ? 'Paid' : 'Unpaid'}
        </strong></p>
    `;
}

// ===== ROSTER (coach only) =====
function renderRoster() {
    const container = document.getElementById("roster-list");
    if (!container) return;
    const players = getData("players");
    container.innerHTML = players.map(p => `
        <div class="card">
            <h3>${p.name}</h3>
            <p>Matches: ${p.stats.matches} | Runs: ${p.stats.runs} | Wickets: ${p.stats.wickets}</p>
            <button onclick="removePlayer('${p.id}')">Remove Player</button>
        </div>
    `).join("");
}

function addPlayer() {
    const name = document.getElementById("new-player-name").value.trim();
    const passwordInput = document.getElementById("new-player-password");
    const gradeInput = document.getElementById("new-player-grade");
    const password = passwordInput ? passwordInput.value.trim() : "";
    const grade = gradeInput ? gradeInput.value : "1";

    if (!name) { alert("Enter a player name"); return; }
    if (password.length < MIN_PASSWORD_LENGTH) {
        alert("Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        return;
    }

    const players = getData("players");
    const id = "p" + Date.now();
    players.push({
        id, username: "player" + Date.now(), password, name, grade,
        active: true, locked: false, failedAttempts: 0,
        fees: { amount: 150, paid: false },
        stats: { matches: 0, runs: 0, wickets: 0 },
        profile: { bio: "", privacy: "team", medical: "", phone: "", email: "", dob: "", photo: "" },
        settings: { language: "English", notifications: true }
    });
    saveData("players", players);
    renderRosterFiltered();
    document.getElementById("new-player-name").value = "";
    if (passwordInput) passwordInput.value = "";
}

// ===== STATS (own player, for player dashboard) =====
function renderOwnStats() {
    const container = document.getElementById("my-stats");
    if (!container) return;
    const linkedId = localStorage.getItem("linkedPlayerId");
    const player = getData("players").find(p => p.id === linkedId);
    if (!player) return;
    container.innerHTML = `
        <p>Matches played: ${player.stats.matches}</p>
        <p>Runs scored: ${player.stats.runs}</p>
        <p>Wickets taken: ${player.stats.wickets}</p>
    `;
}

// ===== ANNOUNCEMENTS =====
function renderAnnouncements() {
    const container = document.getElementById("announcements-list");
    if (!container) return;
    const items = getData("announcements");
    container.innerHTML = items.length ? items.map(a => `
        <div class="card"><p>${a.text}</p><small>${a.date}</small></div>
    `).join("") : "<p>No announcements yet.</p>";
}

function postAnnouncement() {
    const text = document.getElementById("new-announcement").value.trim();
    if (!text) { alert("Write something first"); return; }
    const items = getData("announcements");
    items.unshift({ id: "a" + Date.now(), text, date: new Date().toISOString().split("T")[0] });
    saveData("announcements", items);
    renderAnnouncements();
    document.getElementById("new-announcement").value = "";
}

// Always seed data when script loads
initData();

// ===== EXTEND SEED DATA: add profile fields to players =====
function ensureProfileFields() {
    const players = getData("players");
    let changed = false;
    players.forEach(p => {
        if (!p.profile) {
            p.profile = {
                bio: "",
                privacy: "team",
                medical: "",
                phone: "",
                email: "",
                dob: "",
                photo: ""
            };
            changed = true;
        }
        if (!p.settings) {
            p.settings = { language: "English", notifications: true };
            changed = true;
        }
    });
    if (changed) saveData("players", players);
}

// ===== Placeholder messages (UI only) =====
const placeholderMessages = [
    { from: "Coach", text: "Great effort at training today!", time: "9:15 AM" },
    { from: "Team Group", text: "Reminder: match this Sunday, 9am.", time: "Yesterday" }
];

// ===== TAB SWITCHING (used by all dashboards) =====
function switchTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach(el => el.style.display = "none");
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

    const panel = document.getElementById(tabId);
    if (panel) panel.style.display = "block";

    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.classList.add("active");
}

// ===== PROFILE RENDER (player) =====
function renderPlayerProfile() {
    const linkedId = localStorage.getItem("linkedPlayerId");
    const player = getData("players").find(p => p.id === linkedId);
    if (!player) return;

    document.getElementById("profile-name").textContent = player.name;
    document.getElementById("profile-team").textContent = "Team: Senior Cricket Squad";
    document.getElementById("profile-stats").innerHTML = `
        <p>Matches: ${player.stats.matches} | Runs: ${player.stats.runs} | Wickets: ${player.stats.wickets}</p>
    `;
    document.getElementById("profile-bio").textContent = player.profile.bio || "No bio added yet.";

    // Pre-fill edit form
    document.getElementById("edit-name").value = player.name;
    document.getElementById("edit-bio").value = player.profile.bio;
    document.getElementById("edit-medical").value = player.profile.medical;
    document.getElementById("edit-phone").value = player.profile.phone;
    document.getElementById("edit-email").value = player.profile.email;
    document.getElementById("edit-dob").value = player.profile.dob;
    document.getElementById("edit-privacy").value = player.profile.privacy;
}

function saveProfile() {
    const linkedId = localStorage.getItem("linkedPlayerId");
    const players = getData("players");
    const player = players.find(p => p.id === linkedId);
    if (!player) return;

    player.name = document.getElementById("edit-name").value.trim() || player.name;
    player.profile.bio = document.getElementById("edit-bio").value.trim();
    player.profile.medical = document.getElementById("edit-medical").value.trim();
    player.profile.phone = document.getElementById("edit-phone").value.trim();
    player.profile.email = document.getElementById("edit-email").value.trim();
    player.profile.dob = document.getElementById("edit-dob").value;
    player.profile.privacy = document.getElementById("edit-privacy").value;

    saveData("players", players);
    alert("Profile updated!");
    renderPlayerProfile();
    switchTab("tab-profile");
}

// ===== SETTINGS =====
function renderSettings() {
    const linkedId = localStorage.getItem("linkedPlayerId");
    const player = getData("players").find(p => p.id === linkedId);
    if (!player) return;
    document.getElementById("setting-language").value = player.settings.language;
    document.getElementById("setting-notifications").checked = player.settings.notifications;
}

function saveSettings() {
    const linkedId = localStorage.getItem("linkedPlayerId");
    const players = getData("players");
    const player = players.find(p => p.id === linkedId);
    if (!player) return;
    player.settings.language = document.getElementById("setting-language").value;
    player.settings.notifications = document.getElementById("setting-notifications").checked;
    saveData("players", players);
    alert("Settings saved!");
}

// ===== MESSAGES (placeholder UI) =====
function renderMessages() {
    const container = document.getElementById("messages-list");
    if (!container) return;
    container.innerHTML = placeholderMessages.map(m => `
        <div class="card">
            <strong>${m.from}</strong>
            <p>${m.text}</p>
            <small>${m.time}</small>
        </div>
    `).join("");
}

// Run field setup on load
ensureProfileFields();

// ===== PHOTOS =====
function ensurePhotosSeed() {
    if (localStorage.getItem("photosInitialized")) return;
    const photos = [
        { id: "ph1", url: "https://picsum.photos/seed/cricket1/400/280", caption: "Training session", date: "2026-07-05" },
        { id: "ph2", url: "https://picsum.photos/seed/cricket2/400/280", caption: "Match day warm-up", date: "2026-07-12" },
        { id: "ph3", url: "https://picsum.photos/seed/cricket3/400/280", caption: "Team huddle", date: "2026-07-14" }
    ];
    saveData("photos", photos);
    localStorage.setItem("photosInitialized", "true");
}

function renderPhotos() {
    const container = document.getElementById("photos-grid");
    if (!container) return;
    const photos = getData("photos");
    container.innerHTML = photos.length ? photos.map(p => `
        <div class="photo-card">
            <img src="${p.url}" alt="${p.caption}">
            <p>${p.caption}</p>
            <small>${p.date}</small>
        </div>
    `).join("") : "<p>No photos uploaded yet.</p>";
}

function uploadPhoto() {
    const fileInput = document.getElementById("photo-file");
    const captionInput = document.getElementById("photo-caption");
    const file = fileInput.files[0];

    if (!file) { alert("Choose a photo first"); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const photos = getData("photos");
        photos.unshift({
            id: "ph" + Date.now(),
            url: e.target.result,
            caption: captionInput.value.trim() || "Team photo",
            date: new Date().toISOString().split("T")[0]
        });
        saveData("photos", photos);
        renderPhotos();
        fileInput.value = "";
        captionInput.value = "";
    };
    reader.readAsDataURL(file);
}

// ===== MORE MESSAGES =====
placeholderMessages.push(
    { from: "Coach", text: "Well played everyone in Sunday's match!", time: "2 days ago" },
    { from: "Team Group", text: "New training kit has arrived, collect from the clubhouse.", time: "3 days ago" },
    { from: "Coach", text: "Fees are due by end of the month, please check your dashboard.", time: "5 days ago" },
    { from: "Team Group", text: "Photos from last week's match are now up!", time: "1 week ago" }
);

ensurePhotosSeed();

renderPhotos();

// ===== EXPAND ROSTER (adds more players if fewer than 15 exist) =====
function ensureMorePlayers() {
    let players = getData("players");
    if (players.length >= 15) return;

    const extraNames = [
        "Jordan Blake", "Mia Chen", "Ethan Wright", "Priya Nair", "Liam Foster",
        "Zoe Martinez", "Noah Bennett", "Ava Thompson", "Ryan Okafor", "Chloe Baker",
        "Kai Nakamura", "Emily Scott", "Marcus Reid"
    ];

    let counter = players.length + 1;
    extraNames.forEach(name => {
        if (players.length >= 15) return;
        const id = "p" + counter;
        players.push({
            id,
            username: "player" + counter,
            password: "player123",
            name,
            fees: { amount: 150, paid: Math.random() > 0.5 },
            stats: {
                matches: Math.floor(Math.random() * 10) + 1,
                runs: Math.floor(Math.random() * 300),
                wickets: Math.floor(Math.random() * 15)
            },
            profile: { bio: "", privacy: "team", medical: "", phone: "", email: "", dob: "", photo: "" },
            settings: { language: "English", notifications: true }
        });
        counter++;
    });

    saveData("players", players);
}

// ===== REAL CHAT (coach <-> each player) =====
function getChats() {
    return JSON.parse(localStorage.getItem("chats")) || {};
}

function saveChats(chats) {
    localStorage.setItem("chats", JSON.stringify(chats));
}

function getChatFor(playerId) {
    const chats = getChats();
    return chats[playerId] || [];
}

function nowTime() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ----- Coach side -----
let activeChatPlayerId = null;

function renderCoachChatList() {
    const container = document.getElementById("chat-player-list");
    if (!container) return;
    const players = getData("players");
    container.innerHTML = players.map(p => `
        <div class="chat-contact ${p.id === activeChatPlayerId ? 'active' : ''}" onclick="openCoachChat('${p.id}')">
            <strong>${p.name}</strong>
        </div>
    `).join("");
}

function openCoachChat(playerId) {
    activeChatPlayerId = playerId;
    renderCoachChatList();
    renderCoachChatWindow();
}

function renderCoachChatWindow() {
    const windowEl = document.getElementById("chat-window");
    const titleEl = document.getElementById("chat-window-title");
    if (!windowEl) return;

    if (!activeChatPlayerId) {
        windowEl.innerHTML = "<p style='padding:20px; color:#9ca3af;'>Select a player to start chatting.</p>";
        if (titleEl) titleEl.textContent = "";
        return;
    }

    const players = getData("players");
    const player = players.find(p => p.id === activeChatPlayerId);
    if (titleEl) titleEl.textContent = "Chat with " + (player ? player.name : "");

    const messages = getChatFor(activeChatPlayerId);
    windowEl.innerHTML = messages.length ? messages.map(m => `
        <div class="chat-bubble ${m.from === 'coach' ? 'from-me' : 'from-them'}">
            <p>${m.text}</p>
            <small>${m.time}</small>
        </div>
    `).join("") : "<p style='padding:20px; color:#9ca3af;'>No messages yet. Say hello!</p>";

    windowEl.scrollTop = windowEl.scrollHeight;
}

function sendCoachMessage() {
    if (!activeChatPlayerId) { alert("Select a player first"); return; }
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    const chats = getChats();
    if (!chats[activeChatPlayerId]) chats[activeChatPlayerId] = [];
    chats[activeChatPlayerId].push({ from: "coach", text, time: nowTime() });
    saveChats(chats);

    input.value = "";
    renderCoachChatWindow();
}

// ----- Player side -----
function renderPlayerChat() {
    const windowEl = document.getElementById("chat-window");
    if (!windowEl) return;
    const linkedId = localStorage.getItem("linkedPlayerId");
    const messages = getChatFor(linkedId);

    windowEl.innerHTML = messages.length ? messages.map(m => `
        <div class="chat-bubble ${m.from === 'player' ? 'from-me' : 'from-them'}">
            <p>${m.text}</p>
            <small>${m.time}</small>
        </div>
    `).join("") : "<p style='padding:20px; color:#9ca3af;'>No messages yet. Message your coach!</p>";

    windowEl.scrollTop = windowEl.scrollHeight;
}

function sendPlayerMessage() {
    const linkedId = localStorage.getItem("linkedPlayerId");
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    const chats = getChats();
    if (!chats[linkedId]) chats[linkedId] = [];
    chats[linkedId].push({ from: "player", text, time: nowTime() });
    saveChats(chats);

    input.value = "";
    renderPlayerChat();
}

// Run expansions on load
ensureMorePlayers();

// ===== EXPAND ANNOUNCEMENTS (adds more if fewer than 20 exist) =====
function ensureMoreAnnouncements() {
    let items = getData("announcements");
    if (items.length >= 20) return;

    const extra = [
        "Nets booked for Wednesday evening, all welcome.",
        "New team kit sponsor confirmed — jerseys arriving next month.",
        "Congratulations to the U16s on their tournament win!",
        "Reminder: fill in your availability for next month's fixtures.",
        "Pre-season fitness testing scheduled for next weekend.",
        "Club AGM will be held in the clubhouse, all parents welcome.",
        "New scoring app rollout — training session on how to use it.",
        "Ground maintenance means no training this Friday.",
        "Player of the Month voting is now open.",
        "First aid kits have been restocked in the clubhouse.",
        "Please return all borrowed training gear by Sunday.",
        "End of season presentation night — date to be confirmed.",
        "New assistant coach joining the squad next week.",
        "Reminder to bring water bottles — hot weather forecast.",
        "Car park will be closed for resurfacing this weekend.",
        "Sponsorship packs available for anyone interested in helping the club.",
        "Nutrition workshop for players and parents next Tuesday.",
        "Under-13s trial dates have been posted on the noticeboard.",
        "Please label all personal equipment clearly.",
        "Thank you to all volunteers who helped at the weekend BBQ!"
    ];

    let counter = items.length + 1;
    extra.forEach((text, i) => {
        if (items.length >= 20) return;
        const daysAgo = i + 1;
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        items.push({
            id: "a" + counter,
            text,
            date: d.toISOString().split("T")[0]
        });
        counter++;
    });

    saveData("announcements", items);
}

// ===== TEAM OVERVIEW STATS (icon/color version, used on Home tabs) =====
function getTeamOverview() {
    const players = getData("players");
    const matches = getData("matches");
    const totalPlayers = players.length;
    const feesPaid = players.filter(p => p.fees.paid).length;
    const feesUnpaid = totalPlayers - feesPaid;
    const totalRuns = players.reduce((sum, p) => sum + p.stats.runs, 0);
    const totalWickets = players.reduce((sum, p) => sum + p.stats.wickets, 0);
    return { totalPlayers, feesPaid, feesUnpaid, totalRuns, totalWickets, upcomingMatches: matches.length };
}

function renderTeamOverviewCoach() {
    const container = document.getElementById("team-overview-stats");
    if (!container) return;
    const o = getTeamOverview();
    container.innerHTML = `
        <div class="stat-card c-green"><div class="stat-icon">👥</div><div class="stat-number">${o.totalPlayers}</div><div class="stat-label">Players</div></div>
        <div class="stat-card c-blue"><div class="stat-icon">📅</div><div class="stat-number">${o.upcomingMatches}</div><div class="stat-label">Matches</div></div>
        <div class="stat-card c-gold"><div class="stat-icon">✅</div><div class="stat-number">${o.feesPaid}</div><div class="stat-label">Fees Paid</div></div>
        <div class="stat-card c-red"><div class="stat-icon">⚠️</div><div class="stat-number">${o.feesUnpaid}</div><div class="stat-label">Unpaid</div></div>
    `;
}

function renderRecentAnnouncementsHome(limit) {
    const container = document.getElementById("home-announcements");
    if (!container) return;
    const items = getData("announcements").slice(0, limit || 5);
    container.innerHTML = items.length ? items.map(a => `
        <div class="card"><p>${a.text}</p><small>${a.date}</small></div>
    `).join("") : "<p>No announcements yet.</p>";
}

function renderMyStatsGrid() {
    const container = document.getElementById("my-stats-grid");
    if (!container) return;
    const linkedId = localStorage.getItem("linkedPlayerId");
    const player = getData("players").find(p => p.id === linkedId);
    if (!player) return;
    container.innerHTML = `
        <div class="stat-card c-green"><div class="stat-icon">🏏</div><div class="stat-number">${player.stats.matches}</div><div class="stat-label">Matches</div></div>
        <div class="stat-card c-blue"><div class="stat-icon">🏃</div><div class="stat-number">${player.stats.runs}</div><div class="stat-label">Runs</div></div>
        <div class="stat-card c-gold"><div class="stat-icon">🎯</div><div class="stat-number">${player.stats.wickets}</div><div class="stat-label">Wickets</div></div>
    `;
}

// Run on load
ensureMoreAnnouncements();

// ===== SECURITY SETTINGS =====
const MIN_PASSWORD_LENGTH = 6;
const MAX_LOGIN_ATTEMPTS = 5;

// ===== ACCOUNT FIELDS (active/locked/failedAttempts) =====
function ensureAccountFields() {
    let players = getData("players");
    let changed = false;
    players.forEach(p => {
        if (p.active === undefined) { p.active = true; changed = true; }
        if (p.locked === undefined) { p.locked = false; changed = true; }
        if (p.failedAttempts === undefined) { p.failedAttempts = 0; changed = true; }
    });
    if (changed) saveData("players", players);

    let parents = getData("parents");
    changed = false;
    parents.forEach(pa => {
        if (pa.active === undefined) { pa.active = true; changed = true; }
        if (pa.locked === undefined) { pa.locked = false; changed = true; }
        if (pa.failedAttempts === undefined) { pa.failedAttempts = 0; changed = true; }
    });
    if (changed) saveData("parents", parents);

    let coach = JSON.parse(localStorage.getItem("coach"));
    if (coach && coach.active === undefined) {
        coach.active = true;
        coach.locked = false;
        coach.failedAttempts = 0;
        localStorage.setItem("coach", JSON.stringify(coach));
    }
}

// ===== AUDIT LOG =====
function getAuditLog() {
    return JSON.parse(localStorage.getItem("auditLog")) || [];
}

function logAttempt(username, role, success, reason) {
    const log = getAuditLog();
    log.unshift({
        username, role, success,
        reason: reason || (success ? "Success" : "Failed"),
        time: new Date().toLocaleString()
    });
    if (log.length > 100) log.length = 100;
    localStorage.setItem("auditLog", JSON.stringify(log));
}

function renderAuditLog() {
    const container = document.getElementById("audit-log-list");
    if (!container) return;
    const log = getAuditLog();
    container.innerHTML = log.length ? log.slice(0, 30).map(entry => `
        <div class="audit-row ${entry.success ? 'audit-success' : 'audit-fail'}">
            <strong>${entry.username}</strong> (${entry.role}) — ${entry.success ? 'Successful login' : 'Failed: ' + entry.reason}
            <small>${entry.time}</small>
        </div>
    `).join("") : "<p>No login activity yet.</p>";
}

// ===== ACCOUNT ADMIN (coach only) =====
function toggleAccountActive(role, username) {
    const key = role === "player" ? "players" : "parents";
    const list = getData(key);
    const acc = list.find(x => x.username === username);
    acc.active = !acc.active;
    saveData(key, list);
    renderAdminAccounts();
}

function unlockAccount(role, username) {
    const key = role === "player" ? "players" : "parents";
    const list = getData(key);
    const acc = list.find(x => x.username === username);
    acc.locked = false;
    acc.failedAttempts = 0;
    saveData(key, list);
    renderAdminAccounts();
}

function accountStatusLabel(acc) {
    if (acc.locked) return "Locked";
    if (acc.active === false) return "Disabled";
    return "Active";
}

function accountStatusClass(acc) {
    if (acc.locked) return "status-locked";
    if (acc.active === false) return "status-disabled";
    return "status-active";
}

function renderAdminAccounts() {
    const playerContainer = document.getElementById("admin-player-accounts");
    if (playerContainer) {
        const players = getData("players");
        playerContainer.innerHTML = players.map(p => `
            <div class="admin-row">
                <span>${p.name} (${p.username})</span>
                <span class="admin-status ${accountStatusClass(p)}">${accountStatusLabel(p)}</span>
                <button onclick="toggleAccountActive('player','${p.username}')">${p.active === false ? 'Enable' : 'Disable'}</button>
                ${p.locked ? `<button onclick="unlockAccount('player','${p.username}')">Unlock</button>` : ''}
            </div>
        `).join("");
    }

    const parentContainer = document.getElementById("admin-parent-accounts");
    if (parentContainer) {
        const parents = getData("parents");
        parentContainer.innerHTML = parents.map(p => `
            <div class="admin-row">
                <span>${p.username}</span>
                <span class="admin-status ${accountStatusClass(p)}">${accountStatusLabel(p)}</span>
                <button onclick="toggleAccountActive('parent','${p.username}')">${p.active === false ? 'Enable' : 'Disable'}</button>
                ${p.locked ? `<button onclick="unlockAccount('parent','${p.username}')">Unlock</button>` : ''}
            </div>
        `).join("");
    }
}

// Run on load
ensureAccountFields();

// ===== STAFF (multiple coaches/staff, replaces single hardcoded coach) =====
function ensureStaffMigration() {
    let staff = getData("staff");
    if (staff.length > 0) return;

    const oldCoach = JSON.parse(localStorage.getItem("coach"));
    staff.push({
        username: oldCoach ? oldCoach.username : "coach1",
        password: oldCoach ? oldCoach.password : "coach123",
        name: "Head Coach",
        position: "Head Coach",
        active: true,
        locked: false,
        failedAttempts: 0
    });
    saveData("staff", staff);
}

function findAccount(role, username) {
    if (role === "coach") return getData("staff").find(a => a.username === username);
    if (role === "parent") return getData("parents").find(a => a.username === username);
    if (role === "player") return getData("players").find(a => a.username === username);
    return null;
}

function persistAccountByRole(role, updated) {
    const key = role === "coach" ? "staff" : (role === "parent" ? "parents" : "players");
    const list = getData(key);
    const idx = list.findIndex(a => a.username === updated.username);
    if (idx > -1) { list[idx] = updated; saveData(key, list); }
}

function addStaffMember() {
    const name = document.getElementById("new-staff-name").value.trim();
    const username = document.getElementById("new-staff-username").value.trim();
    const password = document.getElementById("new-staff-password").value.trim();
    const position = document.getElementById("new-staff-position").value;

    if (!name || !username) { alert("Enter a name and username"); return; }
    if (password.length < MIN_PASSWORD_LENGTH) {
        alert("Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        return;
    }
    const staff = getData("staff");
    if (staff.find(s => s.username === username)) { alert("That username is already taken"); return; }

    staff.push({ username, password, name, position, active: true, locked: false, failedAttempts: 0 });
    saveData("staff", staff);
    renderStaffAdmin();

    document.getElementById("new-staff-name").value = "";
    document.getElementById("new-staff-username").value = "";
    document.getElementById("new-staff-password").value = "";
}

function removeStaffMember(username) {
    let staff = getData("staff");
    if (staff.length <= 1) { alert("Can't remove the last remaining staff account."); return; }
    staff = staff.filter(s => s.username !== username);
    saveData("staff", staff);
    renderStaffAdmin();
}

function toggleStaffActive(username) {
    const staff = getData("staff");
    const s = staff.find(x => x.username === username);
    s.active = !s.active;
    saveData("staff", staff);
    renderStaffAdmin();
}

function unlockStaffAccount(username) {
    const staff = getData("staff");
    const s = staff.find(x => x.username === username);
    s.locked = false;
    s.failedAttempts = 0;
    saveData("staff", staff);
    renderStaffAdmin();
}

function renderStaffAdmin() {
    const container = document.getElementById("admin-staff-accounts");
    if (!container) return;
    const staff = getData("staff");
    container.innerHTML = staff.map(s => `
        <div class="admin-row">
            <span>${s.name} — ${s.position} (${s.username})</span>
            <span class="admin-status ${accountStatusClass(s)}">${accountStatusLabel(s)}</span>
            <button onclick="toggleStaffActive('${s.username}')">${s.active === false ? 'Enable' : 'Disable'}</button>
            ${s.locked ? `<button onclick="unlockStaffAccount('${s.username}')">Unlock</button>` : ''}
            <button onclick="removeStaffMember('${s.username}')">Remove</button>
        </div>
    `).join("");
}

// ===== GRADE LEVELS (1-6) + SEARCH/FILTER =====
function ensureGradeField() {
    const players = getData("players");
    let changed = false;
    players.forEach(p => {
        if (!p.grade) { p.grade = String(Math.floor(Math.random() * 6) + 1); changed = true; }
    });
    if (changed) saveData("players", players);
}

function renderRosterFiltered() {
    const container = document.getElementById("roster-list");
    if (!container) return;

    const searchInput = document.getElementById("member-search");
    const gradeInput = document.getElementById("member-grade-filter");
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const gradeFilter = gradeInput ? gradeInput.value : "all";

    let players = getData("players");
    if (searchTerm) players = players.filter(p => p.name.toLowerCase().includes(searchTerm));
    if (gradeFilter !== "all") players = players.filter(p => String(p.grade) === gradeFilter);

    container.innerHTML = players.length ? players.map(p => `
        <div class="card">
            <h3>${p.name} <span class="grade-badge">Grade ${p.grade}</span> <span class="admin-status ${accountStatusClass(p)}">${accountStatusLabel(p)}</span></h3>
            <p>Matches: ${p.stats.matches} | Runs: ${p.stats.runs} | Wickets: ${p.stats.wickets}</p>
            <button onclick="removePlayer('${p.id}')">Remove Player</button>
        </div>
    `).join("") : "<p>No players match your search.</p>";
}

// renderRoster now just calls the filtered version, so existing calls elsewhere still work
function renderRoster() {
    renderRosterFiltered();
}

// Run on load
ensureStaffMigration();
ensureGradeField();