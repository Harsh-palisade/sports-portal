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

// ===== ALWAYS ENSURE COACH EXISTS =====
function ensureCoachAccount() {
    const users = getData("users");
    let coach = users.find(u => u.role === "coach" && u.username === "coach1");
    if (!coach) {
        users.push({
            username: "coach1",
            password: "coach123",
            role: "coach",
            active: true,
            locked: false,
            failedAttempts: 0,
            profile: {},
            stats: {}
        });
        saveData("users", users);
    }
}

// ===== ANNOUNCEMENTS FIX =====
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
        return;
    }

    let account = findAccount(role, username);

    if (!account) {
        showNotification("Incorrect username or role.", "error");
        return;
    }

    if (!account.active) {
        showNotification("This account has been disabled.", "error");
        return;
    }

    if (account.locked) {
        showNotification("Account locked due to too many failed attempts.", "error");
        return;
    }

    const attempts = getAttemptsFor(username);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        account.locked = true;
        persistAccount(account);
        showNotification("Account locked due to too many failed attempts.", "error");
        return;
    }

    if (account.password !== password) {
        const newAttempts = attempts + 1;
        setAttemptsFor(username, newAttempts);
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            account.locked = true;
            persistAccount(account);
            showNotification("Account locked due to too many failed attempts.", "error");
        } else {
            showNotification(`Incorrect password. Attempts: ${newAttempts}/${MAX_LOGIN_ATTEMPTS}`, "error");
        }
        return;
    }

    // success
    setAttemptsFor(username, 0);
    account.failedAttempts = 0;
    persistAccount(account);

    localStorage.setItem("loggedInRole", role);
    localStorage.setItem("loggedInUser", username);

    window.location.href = role + "-dashboard.html";
}

// ===== SESSION / NAVBAR / PERMISSIONS =====
function requireLogin(expectedRole) {
    const role = localStorage.getItem("loggedInRole");
    const user = localStorage.getItem("loggedInUser");
    if (!role || !user || (expectedRole && role !== expectedRole)) {
        window.location.href = "index.html";
    }
}

function renderNavbar() {
    const role = localStorage.getItem("loggedInRole");
    const user = localStorage.getItem("loggedInUser");
    const badge = document.getElementById("role-badge");
    const label = document.getElementById("username-label");
    if (badge) badge.textContent = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";
    if (label) label.textContent = user || "";
}

function logout() {
    localStorage.removeItem("loggedInRole");
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function applyPermissions() {
    const role = localStorage.getItem("loggedInRole");
    document.querySelectorAll(".menu-item").forEach(item => {
        const allowed = (item.getAttribute("data-role") || "all").split(",");
        if (!allowed.includes("all") && !allowed.includes(role)) {
            item.style.display = "none";
        }
    });
}

// ===== INIT =====
initData();
ensureCoachAccount();
ensureMoreAnnouncements();

// only attach login handler on pages that have the button
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
    loginBtn.addEventListener("click", login);
}
;
ensureMoreAnnouncements();

// ===== INIT =====
initData();
ensureCoachAccount();
ensureMoreAnnouncements();

// only attach login handler on pages that have the button
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
    loginBtn.addEventListener("click", login);
}
