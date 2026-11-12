
// ========================================
// LEAVE MANAGEMENT SYSTEM - FRONTEND JS
// ========================================

// IMPORTANT:
// Replace this with your Codespaces forwarded
// backend port 5000 URL before browser testing.
const API_URL = "https://fictional-funicular-97xgpj5pwjv729554-5000.app.github.dev/api";


// ========================================
// HELPER FUNCTION
// ========================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, options);

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}


// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message = document.getElementById("message");

        message.textContent = "Logging in...";

        try {
            const data = await apiRequest("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("username", data.username);

            window.location.href = "dashboard.html";

        } catch (error) {
            message.textContent = error.message;
        }
    });
}


// ========================================
// REGISTRATION
// ========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const rollNumber = document.getElementById("rollNumber").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("message");

        message.textContent = "Creating account...";

        try {
            await apiRequest("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    rollNumber,
                    email,
                    password
                })
            });

            message.textContent =
                "Registration successful! Please login.";

            registerForm.reset();

        } catch (error) {
            message.textContent = error.message;
        }
    });
}


// ========================================
// DASHBOARD AUTHENTICATION
// ========================================

const isDashboard = window.location.pathname.endsWith("dashboard.html");

if (isDashboard) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
    } else {
        loadDashboard(token);
    }
}


// ========================================
// LOAD DASHBOARD
// ========================================

async function loadDashboard(token) {

    const userName = document.getElementById("userName");

    if (userName) {
        userName.textContent =
            "Welcome, " + (localStorage.getItem("username") || "Student");
    }

    try {
        const balance = await apiRequest("/leaves/balance", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        document.getElementById("casualBalance").textContent =
            balance.casualLeave;

        document.getElementById("medicalBalance").textContent =
            balance.medicalLeave;

        await loadLeaveHistory(token);

    } catch (error) {
        console.error("Dashboard error:", error);
        alert(error.message);

        if (error.message.toLowerCase().includes("token") ||
            error.message.toLowerCase().includes("unauthorized")) {
            logout();
        }
    }
}


// ========================================
// APPLY FOR LEAVE
// ========================================

const leaveForm = document.getElementById("leaveForm");

if (leaveForm) {

    leaveForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        const leaveMessage = document.getElementById("leaveMessage");

        if (!token) {
            window.location.href = "index.html";
            return;
        }

        const leaveData = {
            leaveType: document.getElementById("leaveType").value,
            startDate: document.getElementById("startDate").value,
            endDate: document.getElementById("endDate").value,
            reason: document.getElementById("reason").value.trim()
        };

        leaveMessage.textContent = "Submitting application...";

        try {
            const data = await apiRequest("/leaves/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(leaveData)
            });

            leaveMessage.textContent =
                data.message || "Leave application submitted successfully!";

            leaveForm.reset();

            await loadDashboard(token);

        } catch (error) {
            leaveMessage.textContent = error.message;
        }
    });
}


// ========================================
// LOAD LEAVE HISTORY
// ========================================

async function loadLeaveHistory(token) {

    const table = document.getElementById("leaveHistory");

    if (!table) return;

    table.innerHTML = `
        <tr>
            <td colspan="6">Loading applications...</td>
        </tr>
    `;

    try {
        const leaves = await apiRequest("/leaves/history", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        table.innerHTML = "";

        if (!Array.isArray(leaves) || leaves.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="6">No leave applications found.</td>
                </tr>
            `;
            return;
        }

        leaves.forEach((leave) => {

            const row = document.createElement("tr");

            const values = [
                leave.leaveType,
                leave.startDate
                    ? leave.startDate.split("T")[0]
                    : "",
                leave.endDate
                    ? leave.endDate.split("T")[0]
                    : "",
                leave.days,
                leave.reason,
                leave.status
            ];

            values.forEach((value) => {

                const cell = document.createElement("td");

                cell.textContent = value ?? "";

                row.appendChild(cell);
            });

            table.appendChild(row);
        });

    } catch (error) {
        console.error("Leave history error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="6">Unable to load leave history.</td>
            </tr>
        `;
    }
}


// ========================================
// LOGOUT
// ========================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("username");

    window.location.href = "index.html";
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}
