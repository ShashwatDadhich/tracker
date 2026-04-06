const SIGNER_STORAGE_KEY = "accountability-signer-v1";

const loginButtons = [...document.querySelectorAll("[data-login-role]")];

loginButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.loginRole;
    window.localStorage.setItem(SIGNER_STORAGE_KEY, role);
    window.location.href = role === "Admin" ? "admin.html" : "dashboard.html";
  });
});
