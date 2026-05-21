let currentUserNameLS = localStorage.getItem("currentUserName");
let currentUserEmailLS = localStorage.getItem("currentUserEmail");
let fromLogin = false;
const mobileQuery = window.matchMedia("(max-width: 850px)");
let userMenuOpen = false;
let userMenuCloseTimer;

/** Base URL for all Firebase Realtime Database REST requests. */
const firebaseBaseUrl = "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";

/**
 * Ordered list of colors used to generate deterministic contact avatars.
 * The color for a contact is chosen by hashing the email address modulo this array's length.
 */
const avatarColors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
    '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B',
];

/**
 * Initializes shared page elements and reveals the layout after key images are ready.
 */
async function init() {
    redirectToLoginIfNotLoggedIn();
    injectSharedTemplates();
    addHelpToUserMenu(850);
    highlightActivePage();
    removeHelpLink();
    if (currentUserNameLS) addNameInitials();
    hideNavIfNotLoggedIn();
    await waitForImages(); // Wait for all images to load before showing the page to prevent layout shifts and ensure a smooth user experience.
    document.body.style.visibility = "visible"; // Show the page after all images are loaded
}

/**
 * Waits until all sidebar and header images have finished loading.
 * @returns {promise} Resolves when all relevant images are loaded or failed.
 */
async function waitForImages() {
    const imagePromises = [...document.querySelectorAll("#js-sidebar img, #js-header img")].filter((img) => !img.complete).map((img) => new Promise((resolve) => (img.onload = img.onerror = resolve)));
    return Promise.all(imagePromises);
}

/**
 * Reads a serialized object from local storage and returns its first-level values.
 * @param {string} key - Local storage key containing a serialized object.
 * @returns {array} First-level values from the stored object.
 */
function importandFormatLocalStorageData(key) {
    return Object.values(JSON.parse(localStorage.getItem(key)));
}

/**
 * Renders the sidebar that matches the current login state.
 */
function addSidebar() {
    const sidebar = document.getElementById("js-sidebar");
    const isLoggedIn = localStorage.getItem("currentUserEmail") !== null;
    sidebar.innerHTML = isLoggedIn ? getSidebarTemplate() : getSidebarNotLoggedInTemplate();
}

/**
 * Injects the shared sidebar and header templates into the current page.
 */
function injectSharedTemplates() {
    const isLoggedIn = localStorage.getItem("currentUserEmail") !== null;
    document.getElementById("js-sidebar").innerHTML = isLoggedIn ? getSidebarTemplate() : getSidebarNotLoggedInTemplate();
    document.getElementById("js-header").innerHTML = getHeaderTemplate();
    document.getElementById("js-user-menu-button").innerHTML = getHeaderCircleUserTemplate();
    document.getElementById("js-header-user-menu").innerHTML = getHeaderUserMenuTemplate();
}

mobileQuery.addEventListener("change", () => {
    applyUserMenuState();
});

/**
 * Toggles the user menu state and reapplies the matching classes.
 */
function toggleUserMenu() {
    userMenuOpen = !userMenuOpen;
    applyUserMenuState();
}

/**
 * Synchronizes the user menu classes with the current viewport and open state.
 */
function applyUserMenuState() {
    const userMenu = document.getElementById("js-header-user-menu");

    resetUserMenuCloseTimer();

    if (!mobileQuery.matches) {
        toggleDesktopUserMenu(userMenu);
        return;
    }

    if (userMenuOpen) {
        openMobileUserMenu(userMenu);
        return;
    }

    closeMobileUserMenu(userMenu);
}

/**
 * Cancels a pending delayed close action for the mobile user menu.
 */
function resetUserMenuCloseTimer() {
    clearTimeout(userMenuCloseTimer);
}

/**
 * Applies the desktop user menu state without mobile animation classes.
 * @param {HTMLElement} userMenu - The user menu element.
 */
function toggleDesktopUserMenu(userMenu) {
    userMenu.classList.toggle("opened", userMenuOpen);
    userMenu.classList.remove("header__user-menu-slide-in");
}

/**
 * Opens the mobile user menu and applies the slide-in animation class.
 * @param {HTMLElement} userMenu - The user menu element.
 */
function openMobileUserMenu(userMenu) {
    userMenu.classList.add("opened");
    userMenu.classList.add("header__user-menu-slide-in");
}

/**
 * Starts the mobile closing animation and hides the menu after the transition delay.
 * @param {HTMLElement} userMenu - The user menu element.
 */
function closeMobileUserMenu(userMenu) {
    userMenu.classList.remove("header__user-menu-slide-in");
    userMenuCloseTimer = setTimeout(() => {
        userMenu.classList.remove("opened");
    }, 260);
}

/**
 * Hides the help button while the current page is the help page.
 */
function removeHelpLink() {
    const helpButton = document.getElementById("js-header-help-button");
    const currentPage = window.location.pathname.split("/").pop().split(".")[0];
    if (currentPage === "help") {
        helpButton.style.visibility = "hidden";
    }
}

/**
 * Redirects the user to the login page when required session data is missing.
 */
function redirectToLoginIfNotLoggedIn() {
    const publicPages = ['privacy-policy.html', 'legal-notice.html', 'index.html', 'registration.html'];
    if (publicPages.some(page => window.location.href.includes(page))) return;

    const requiredKeys = ["currentUserEmail", "currentUserName", "contacts", "boards"];
    const isMissing = requiredKeys.some((key) => localStorage.getItem(key) === null);
    if (isMissing) {
        window.location.href = "index.html";
    }
}

/**
 * Logs the user out by removing the stored session data.
 */
function logout() {
    localStorage.removeItem("currentUserEmail");
    localStorage.removeItem("currentUserName");
    localStorage.removeItem("contacts");
    localStorage.removeItem("boards");
}

/**
 * Marks the current sidebar entry as active and swaps its icon.
 */
function highlightActivePage() {
    const sidebarLinks = document.querySelectorAll("a[id^='js-sidebar-']");
    const currentPage = window.location.pathname.split("/").pop().split(".")[0];
    const activeLink = Array.from(sidebarLinks).find((link) => link.id.replace("js-sidebar-", "") === currentPage);

    if (!activeLink) return;

    activeLink.removeAttribute("href");
    activeLink.classList.add("sidebar__link--active");
    const icon = activeLink.querySelector("img.sidebar__nav-img");
    if (icon) {
        icon.src = `assets/sidebar/active/${currentPage}-active.svg`;
    }
}

/**
 * Opens the help page and stores the current page in the query string.
 */
function goToHelp() {
    const from = window.location.href;
    window.location.href = "help.html?from=" + encodeURIComponent(from);
}

/**
 * Returns to the page stored in the query string or falls back to browser history.
 */
function goBack() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (from) {
        window.location.href = from;
    } else {
        window.history.back();
    }
}

/**
 * Keeps the mobile help entry in sync after resize events.
 */
window.addEventListener("resize", () => {
    addHelpToUserMenu(850);
});

/**
 * Adds or removes the help entry inside the user menu based on viewport width.
 * @param {number} maxWidthMobile - Maximum width that counts as mobile.
 */
function addHelpToUserMenu(maxWidthMobile) {
    const userMenu = document.getElementById("js-header-user-menu-list");
    const existingHelpTag = document.getElementById("js-header-user-menu-help");

    if (window.innerWidth <= maxWidthMobile) {
        if (!existingHelpTag) {
            userMenu.innerHTML = getHeaderUserMenuHelpTemplate() + userMenu.innerHTML;
        }
    } else if (existingHelpTag) {
        existingHelpTag.remove();
    }
}

/**
 * Returns the first character of a string in uppercase.
 * @param {string} string - The source text.
 * @returns {string} The uppercase first character.
 */
function UpperCaseIntial(string) {
    return string.toUpperCase().charAt(0);
}

/**
 * Hides the user interaction area when no user is logged in.
 */
function hideNavIfNotLoggedIn() {
    if (localStorage.getItem("currentUserEmail") === null) {
        document.getElementById("js-header-user-interaction-container").style.display = "none";
    }
}

/**
 * Builds the current user's initials and displays them in the header.
 */
function addNameInitials() {
    let userNameArray = currentUserNameLS.split(" ");
    let userInitials;
    userInitials = UpperCaseIntial(userNameArray[0]);
    if (userNameArray.length > 1) {
        userInitials += UpperCaseIntial(userNameArray.at(-1));
    }

    document.getElementById("js-header-user-initials").textContent = userInitials;
}

/**
 * Waits for the given amount of time.
 * @param {number} time - Delay in milliseconds.
 */
function timeDelay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


// Shows a Firebase error using SweetAlert.
function showFirebaseError(error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
}

// Shows a success toast notification.
function showSuccessToast(message) {
    Swal.fire({
        toast: true,
        position: 'bottom',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        background: '#2a3647',
        color: '#fff',
        customClass: { container: 'success-toast-container' },
    });
}
// Sends a new task to Firebase Realtime Database and returns the response payload.
async function postTaskRequestToFirebase(task) {
    const response = await fetch(`${firebaseBaseUrl}boards.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error(`Firebase POST failed: HTTP ${response.status}`);
    return response.json();
}