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

// ===== LOGIN / SESSION =====
function login() {
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {
        alert("Please fill all fields");
        return;
    }

    let success = false;
    let linkedPlayerId = null;

    if (role === "coach") {
        const coach = JSON.parse(localStorage.getItem("coach"));
        success = (username === coach.username && password === coach.password);
    }

    if (role === "parent") {
        const parent = getData("parents").find(p => p.username === username && p.password === password);
        if (parent) { success = true; linkedPlayerId = parent.childId; }
    }

    if (role === "player") {
        const player = getData("players").find(p => p.username === username && p.password === password);
        if (player) { success = true; linkedPlayerId = player.id; }
    }

    if (!success) {
        alert("Incorrect username or password for " + role);
        return;
    }

    localStorage.setItem("loggedInRole", role);
    localStorage.setItem("loggedInUser", username);
    if (linkedPlayerId) localStorage.setItem("linkedPlayerId", linkedPlayerId);
    else localStorage.removeItem("linkedPlayerId");

    window.location.href = "dashboard." + role + ".html";
}

function requireLogin(expectedRole) {
    const role = localStorage.getItem("loggedInRole");
    if (!role || role !== expectedRole) {
        alert("Please log in to view this page.");
        window.location.href = "login.html";
    }
}

function logout() {
    localStorage.removeItem("loggedInRole");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("linkedPlayerId");
    window.location.href = "login.html";
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
    if (!name) { alert("Enter a player name"); return; }
    const players = getData("players");
    const id = "p" + Date.now();
    players.push({ id, username: "player" + Date.now(), password: "changeme",
        name, fees: { amount: 150, paid: false }, stats: { matches: 0, runs: 0, wickets: 0 } });
    saveData("players", players);
    renderRoster();
    document.getElementById("new-player-name").value = "";
}

function removePlayer(playerId) {
    let players = getData("players");
    players = players.filter(p => p.id !== playerId);
    saveData("players", players);
    renderRoster();
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