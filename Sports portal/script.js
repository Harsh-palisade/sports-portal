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