const LOCAL_USERS_KEY = "joinLocalUsers";

function playIntroAnimation() {
    try {
        const body = document.body;
        const introLogo = document.querySelector(".logo-intro");
        if (!introLogo) return;
        body.classList.add("intro-active");
        const reveal = () => { body.classList.remove("intro-active"); introLogo.removeEventListener("animationend", onEnd); };
        const onEnd = (event) => { if (event.animationName === "logoFly") reveal(); };
        introLogo.addEventListener("animationend", onEnd);
        setTimeout(reveal, 2100);
    } catch (error) { console.error("Intro-Animation fehlgeschlagen:", error); document.body.classList.remove("intro-active"); }
}
playIntroAnimation();

function isValidEmail(email) {
    return /^[^\s@]+@[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)+$/.test(email);
}

function showToast(message, callback) {
    let toast = document.getElementById("joinToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "joinToast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("toast--visible");
    setTimeout(function() { toast.classList.remove("toast--visible"); if (callback) setTimeout(callback, 300); }, 2000);
}

function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const wrapper = input ? input.closest(".input__wrapper") : null;
    const errorElement = document.getElementById(errorId);
    if (wrapper) wrapper.classList.add("input--error");
    if (errorElement) errorElement.textContent = message;
}

function clearAllErrors() {
    document.querySelectorAll(".input__wrapper.input--error").forEach(function(wrapper) { wrapper.classList.remove("input--error"); });
    document.querySelectorAll(".error__text").forEach(function(errorText) { errorText.textContent = ""; });
}

function validateLoginEmail(email) {
    if (!isValidEmail(email)) {
        showFieldError("email", "emailError", "Please enter a valid email address.");
        return false;
    }
    return true;
}

function validateName() {
    const name = document.getElementById("name").value.trim();
    if (!name) { showFieldError("name", "nameError", "Please enter your name."); return false; }
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) { showFieldError("name", "nameError", "Your name must contain letters."); return false; }
    return true;
}

function applyPasswordMatchError(passwordsMatch) {
    const passwordError = document.getElementById("passwordError");
    const passwordconfirmWrapper = document.getElementById("passwordconfirmWrapper");
    passwordconfirmWrapper.classList.toggle("input--error", !passwordsMatch);
    if (passwordError) passwordError.textContent = passwordsMatch ? "" : "Your passwords don't match. Please try again.";
}

function validatePasswordMatch(password, passwordconfirm) {
    let isValid = true;
    if (!password.trim()) { showFieldError("password", "passwordFieldError", "Please enter a password."); isValid = false; }
    if (!passwordconfirm.trim()) { showFieldError("passwordconfirm", "passwordError", "Please confirm your password."); isValid = false; }
    if (isValid && password.trim() !== passwordconfirm.trim()) { applyPasswordMatchError(false); isValid = false; }
    return isValid;
}

function validateInputs(email, password, passwordconfirm) {
    clearAllErrors();
    let isValid = true;
    if (!validateName()) isValid = false;
    if (!isValidEmail(email)) { showFieldError("email", "emailError", "Please enter a valid email address."); isValid = false; }
    if (!checkPrivacy()) isValid = false;
    if (!validatePasswordMatch(password, passwordconfirm)) isValid = false;
    return isValid;
}

function checkPrivacy() {
    const privacy = document.getElementById("privacy");
    if (!privacy.checked) {
        const privacyError = document.getElementById("privacyError");
        if (privacyError) privacyError.textContent = "Please accept the Privacy Policy.";
        return false;
    }
    return true;
}

function userAlreadyExistsError() {
    showFieldError("email", "emailError", "This email address is already registered.");
}

function saveUserSuccess() {
    showToast("You Signed Up successfully", function() { window.location.href = "index.html"; });
}

function saveUserError() {
    showFieldError("email", "emailError", "Error during registration. Please try again.");
}

function loginWithLocalUser(email, password) {
    const users = getLocalUsers();
    const user = users.find(function(entry) { return entry.email === email && entry.password === password; });
    if (!user) return false;
    localStorage.setItem("currentUserName", user.name);
    localStorage.setItem("currentUserEmail", user.email);
    return true;
}

function saveUserLocally(name, email, password) {
    const users = getLocalUsers();
    users.push({ name: name, email: email, password: password });
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    saveUserSuccess();
}

function localUserExists(email) {
    return getLocalUsers().some(function(user) { return user.email === email; });
}

function getLocalUsers() {
    try {
        const raw = localStorage.getItem(LOCAL_USERS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) { console.warn("Local users could not be parsed. Resetting fallback users.", error); return []; }
}

function setLocalDataDefaults() {
    if (!localStorage.getItem("boards")) localStorage.setItem("boards", JSON.stringify({}));
    ensureContactsStorage();
}

function ensureContactsStorage() {
    if (!localStorage.getItem("contacts")) localStorage.setItem("contacts", JSON.stringify({}));
}

function mergeContactsWithLocal(remoteContacts) {
    const localContacts = parseContactsFromStorage();
    return Object.assign({}, remoteContacts || {}, localContacts);
}

function parseContactsFromStorage() {
    try {
        const raw = localStorage.getItem("contacts");
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) { console.warn("Local contacts could not be parsed. Using empty contact set.", error); return {}; }
}
