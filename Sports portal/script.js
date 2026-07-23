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

// always make sure coach exists even if dataInitialized was set earlier
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

// ===== LOGIN SECURITY (unchanged from your version, but now guaranteed data) =====
// ... keep your showNotification, getAttemptsFor, setAttemptsFor, findAccount, persistAccount, login() exactly as you have ...

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
