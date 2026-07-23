// ===== CONFIG =====
const MIN_PASSWORD_LENGTH = 6;
const MAX_LOGIN_ATTEMPTS = 5;

// ===== STORAGE HELPERS =====
function getData(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ===== INITIAL SEED =====
function initData() {
    if (localStorage.getItem("dataInitialized")) return;

    const users = [
        {
            username: "coach1",
            password: "coach123",
            role: "coach",
            active: true,
            locked: false,
            failedAttempts: 0,
            profile: {
                grade: null,
                emergencyContact: "Club admin",
                disabilities: "None",
                medical: "None",
                finance: "N/A",
                trainingTime: "Mon/Wed 5–7pm",
                behaviourIndex: 90,
                disabilitiesIndex: 0
            },
            stats: {
                avgBowlingSpeed: 0,
                wickets: 0,
                runs: 0,
                battingAverage: 0
            }
        },
        {
            username: "player1",
            password: "player123",
            role: "player",
            active: true,
            locked: false,
            failedAttempts: 0,
            profile: {
                grade: 3,
                emergencyContact: "Parent B – 0400 111 111",
                disabilities: "Mild dyslexia",
                medical: "No major issues",
                finance: "Fees pending",
                trainingTime: "Tue/Thu 4–6pm",
                behaviourIndex: 75,
                disabilitiesIndex: 20
            },
            stats: {
                avgBowlingSpeed: 95,
                wickets: 10,
                runs: 300,
                battingAverage: 28
            }
        },
        {
            username: "parent1",
            password: "parent123",
            role: "parent",
            active: true,
            locked: false,
            failedAttempts: 0,
            profile: {
                grade: null,
                emergencyContact: "Self",
                disabilities: "None",
                medical: "None",
                finance: "Fees partially paid",
                trainingTime: "N/A",
                behaviourIndex: null,
                disabilitiesIndex: null
            },
            stats: {}
        },
        {
            username: "staff1",
            password: "staff123",
            role: "staff",
            active: true,
            locked: false,
            failedAttempts: 0,
            profile: {
                grade: null,
                emergencyContact: "Club admin",
                disabilities: "None",
                medical: "None",
                finance: "N/A",
                trainingTime: "Office hours",
                behaviourIndex: null,
                disabilitiesIndex: null
            },
            stats: {}
        }
    ];

    const players = users
        .filter(u => u.role === "player")
        .map(u => ({
            username: u.username,
            name: u.username,
            grade: u.profile.grade || 1,
            fees: { amount: 150, paid: u.profile.finance === "Fees paid" },
            stats: u.stats,
            behaviourIndex: u.profile.behaviourIndex,
            disabilitiesIndex: u.profile.disabilitiesIndex
        }));

    const matches = [
        { id: "m1", opponent: "Riverdale CC", date: "2026-07-20", venue: "Central Oval" },
        { id: "m2", opponent: "Northside Warriors", date: "2026-07-27", venue: "Home Ground" }
    ];

    const announcements = [
        { id: "a1", text: "Training moved to Thursday this week.", date: "2026-07-10" }
    ];

    saveData("users", users);
    saveData("players", players);
    saveData("matches", matches);
    saveData("announcements", announcements);
    saveData("auditLog", []);
    saveData("interviews", []);
    saveData("preferences", []);
    saveData("polls", []);
    saveData("loginAttempts", []);

    localStorage.setItem("dataInitialized", "true");
}

// ===== ANNOUNCEMENTS =====
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

function renderRecentAnnouncementsHome(limit) {
    const container = document.getElementById("home-announcements");
    if (!container) return;
    const items = getData("announcements").slice(0, limit || 5);
    container.innerHTML = items.length
        ? items.map(a => `
            <div class="card"><p>${a.text}</p><small>${a.date}</small></div>
        `).join("")
        : "<p>No announcements yet.</p>";
}

// ===== TEAM OVERVIEW =====
function getTeamOverview() {
    const players = getData("players");
    const matches = getData("matches");
    const totalPlayers = players.length;
    const feesPaid = players.filter(p => p.fees.paid).length;
    const feesUnpaid = totalPlayers - feesPaid;
    const totalRuns = players.reduce((sum, p) => sum + (p.stats.runs || 0), 0);
    const totalWickets = players.reduce((sum, p) => sum + (p.stats.wickets || 0), 0);
    return { totalPlayers, feesPaid, feesUnpaid, totalRuns, totalWickets, upcomingMatches: matches.length };
}

function renderTeamOverviewCoach() {
    const container = document.getElementById("team-overview-stats");
    if (!container) return;
    const o = getTeamOverview();
    container.innerHTML = `
        <div class="stat-card"><div class="stat-number">${o.totalPlayers}</div><div class="stat-label">Players</div></div>
        <div class="stat-card"><div class="stat-number">${o.upcomingMatches}</div><div class="stat-label">Matches</div></div>
        <div class="stat-card"><div class="stat-number">${o.feesPaid}</div><div class="stat-label">Fees Paid</div></div>
        <div class="stat-card"><div class="stat-number">${o.feesUnpaid}</div><div class="stat-label">Fees Unpaid</div></div>
    `;
}

// ===== AUDIT LOG =====
function getAuditLog() {
    return getData("auditLog");
}

function logAttempt(username, role, success, reason) {
    const log = getAuditLog();
    log.unshift({
        username,
        role,
        success,
        reason: reason || (success ? "Success" : "Failed"),
        time: new Date().toLocaleString()
    });
    if (log.length > 100) log.length = 100;
    saveData("auditLog", log);
}

function renderAuditLog() {
    const container = document.getElementById("audit-log-list");
    if (!container) return;
    const log = getAuditLog();
    container.innerHTML = log.length
        ? log.slice(0, 30).map(entry => `
            <div class="audit-row ${entry.success ? 'audit-success' : 'audit-fail'}">
                <strong>${entry.username}</strong> (${entry.role}) — ${entry.success ? 'Successful login' : 'Failed: ' + entry.reason}
                <small>${entry.time}</small>
            </div>
        `).join("")
        : "<p>No login activity yet.</p>";
}

// ===== LOGIN SECURITY =====
function showNotification(message, type = "info") {
    const box = document.getElementById("login-notifications");
    if (!box) return;
    const div = document.createElement("div");
    div.className = `notification ${type}`;
    div.textContent = message;
    box.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function getAttemptsFor(username) {
    const attempts = getData("loginAttempts");
    const entry = attempts.find(a => a.username === username);
    return entry ? entry.count : 0;
}

function setAttemptsFor(username, count) {
    let attempts = getData("loginAttempts");
    const entry = attempts.find(a => a.username === username);
    if (entry) {
        entry.count = count;
    } else {
        attempts.push({ username, count });
    }
    saveData("loginAttempts", attempts);
}

function findAccount(role, username) {
    const users = getData("users");
    return users.find(u => u.username === username && u.role === role);
}

function persistAccount(user) {
    const users = getData("users");
    const idx = users.findIndex(u => u.username === user.username && u.role === user.role);
    if (idx !== -1) {
        users[idx] = user;
        saveData("users", users);
    }
}

function login() {
    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        showNotification("Please fill all fields.", "error");
        return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        showNotification(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "error");
        logAttempt(username, role, false, "Password too short");
        return;
    }

    let account = findAccount(role, username);

    if (!account) {
        logAttempt(username, role, false, "Account not found");
        showNotification("Incorrect username or role.", "error");
        return;
    }

    if (!account.active) {
        logAttempt(username, role, false, "Account disabled");
        showNotification("This account has been disabled. Contact staff/coach.", "error");
        return;
    }

    if (account.locked) {
        logAttempt(username, role, false, "Account locked");
        showNotification("Account locked due to too many failed attempts.", "error");
        return;
    }

    const attempts = getAttemptsFor(username);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        account.locked = true;
        persistAccount(account);
        logAttempt(username, role, false, "Max attempts reached");
        showNotification("Account locked due to too many failed attempts.", "error");
        return;
    }

    if (account.password !== password) {
        const newAttempts = attempts + 1;
        setAttemptsFor(username, newAttempts);
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            account.locked = true;
            persistAccount(account);
            logAttempt(username, role, false, "Account locked (too many attempts)");
            showNotification("Account locked due to too many failed attempts.", "error");
        } else {
            logAttempt(username, role, false, "Incorrect password");
            showNotification(`Incorrect password. Attempts: ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`, "error");
        }
        return;
    }

    // success
    setAttemptsFor(username, 0);
    account.failedAttempts = 0;
    persistAccount(account);
    logAttempt(username, role, true, "Login success");
    showNotification(`Login successful as ${role}.`, "success");

    localStorage.setItem("loggedInRole", role);
    localStorage.setItem("loggedInUser", username);

    // For player/parent, link to player id if needed (you can extend this)
    // For now, just show coach members tab if coach
    if (role === "coach") {
        document.getElementById("tab-members").style.display = "block";
        renderRosterFiltered();
        renderTeamOverviewCoach();
        renderAuditLog();
    } else {
        document.getElementById("tab-members").style.display = "none";
    }
}

// ===== ROSTER: SEARCH BY NAME & GRADE, ADD PLAYER =====
function renderRosterFiltered() {
    const players = getData("players");
    const search = (document.getElementById("member-search")?.value || "").toLowerCase();
    const gradeFilter = document.getElementById("member-grade-filter")?.value || "all";

    const filtered = players.filter(p => {
        const matchesName = p.name.toLowerCase().includes(search);
        const matchesGrade = gradeFilter === "all" ? true : String(p.grade) === gradeFilter;
        return matchesName && matchesGrade;
    });

    const list = document.getElementById("roster-list");
    if (!list) return;

    if (!filtered.length) {
        list.innerHTML = "<p>No players found.</p>";
        return;
    }

    list.innerHTML = filtered.map(p => `
        <div class="member-row">
            <strong>${p.name}</strong> (Grade ${p.grade}) - Fees: ${p.fees.paid ? "Paid" : "Unpaid"}
            <br>
            Behaviour index: ${p.behaviourIndex ?? "N/A"} | Disabilities index: ${p.disabilitiesIndex ?? "N/A"}
            <br>
            Stats: Runs ${p.stats.runs || 0}, Wickets ${p.stats.wickets || 0}, Avg Bowling Speed ${p.stats.avgBowlingSpeed || "N/A"}
        </div>
    `).join("");
}

function addPlayer() {
    const nameInput = document.getElementById("new-player-name");
    const passInput = document.getElementById("new-player-password");
    const gradeSelect = document.getElementById("new-player-grade");

    const name = nameInput.value.trim();
    const password = passInput.value.trim();
    const grade = parseInt(gradeSelect.value, 10);

    if (!name || !password) {
        showNotification("Enter name and password for new player.", "error");
        return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        showNotification(`Player password must be at least ${MIN_PASSWORD_LENGTH} characters.`, "error");
        return;
    }

    const users = getData("users");
    if (users.find(u => u.username === name && u.role === "player")) {
        showNotification("Player with this username already exists.", "error");
        return;
    }

    const newUser = {
        username: name,
        password,
        role: "player",
        active: true,
        locked: false,
        failedAttempts: 0,
        profile: {
            grade,
            emergencyContact: "",
            disabilities: "",
            medical: "",
            finance: "Fees pending",
            trainingTime: "",
            behaviourIndex: 0,
            disabilitiesIndex: 0
        },
        stats: {
            avgBowlingSpeed: 0,
            wickets: 0,
            runs: 0,
            battingAverage: 0
        }
    };
    users.push(newUser);
    saveData("users", users);

    const players = getData("players");
    players.push({
        username: name,
        name,
        grade,
        fees: { amount: 150, paid: false },
        stats: newUser.stats,
        behaviourIndex: newUser.profile.behaviourIndex,
        disabilitiesIndex: newUser.profile.disabilitiesIndex
    });
    saveData("players", players);

    showNotification("New player added.", "success");
    nameInput.value = "";
    passInput.value = "";
    gradeSelect.value = "1";
    renderRosterFiltered();
}

// ===== PARENT–COACH INTERVIEW, PREFERENCES, POLLS (DATA-LEVEL) =====
function requestInterview(parentUsername, coachUsername, notes) {
    const interviews = getData("interviews");
    interviews.push({
        parentUsername,
        coachUsername,
        notes,
        status: "requested",
        time: new Date().toISOString()
    });
    saveData("interviews", interviews);
}

function setStudentPreferences(playerUsername, prefs) {
    const preferences = getData("preferences");
    const existing = preferences.find(p => p.playerUsername === playerUsername);
    if (existing) {
        Object.assign(existing, prefs);
    } else {
        preferences.push({ playerUsername, ...prefs });
    }
    saveData("preferences", preferences);
}

function createPoll(question, options) {
    const polls = getData("polls");
    const id = "poll_" + (polls.length + 1);
    polls.push({
        id,
        question,
        options: options.map(o => ({ text: o, votes: 0 }))
    });
    saveData("polls", polls);
    return id;
}

function votePoll(pollId, optionIndex) {
    const polls = getData("polls");
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    if (!poll.options[optionIndex]) return;
    poll.options[optionIndex].votes += 1;
    saveData("polls", polls);
}

// ===== INIT =====
initData();
ensureMoreAnnouncements();

document.getElementById("login-btn").addEventListener("click", login);
renderRosterFiltered();
renderAuditLog();
