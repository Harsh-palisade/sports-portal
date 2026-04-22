function login() {
    let role = document.getElementById("role").value;
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (username === "" || password === "") {
        alert("Please fill all fields");
        return;
    }

    if (role === "coach") {
        window.location.href = "dashboard.coach.html";
    } else if (role === "parent") {
        window.location.href = "dashboard.parent.html";
    } else {
        window.location.href = "dashboard.player.html";
    }
}