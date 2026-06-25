/** Firebase project credentials and settings. */
const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL: "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c",
};


/** Initializes Firebase and sets up the Realtime Database reference. */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
let authInitPromise = null;
document.body.style.visibility = "visible";


/** Reads email and password from the form, validates them, and triggers the login flow. */
function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    clearAllErrors();
    if (!validateLoginInputs(email, password)) return;
    runLoginFlow(email, password);
}

function runLoginFlow(email, password) {
    ensureFirebaseSession()
        .then(function() { return fetchUsersByEmail(email); })
        .then(function(snapshot) { return processLoginSnapshot(snapshot, password); })
        .catch(function(error) { handleLoginReadError(error, email, password); });
}

function processLoginSnapshot(snapshot, password) {
    if (checkIfUserExistsForLogin(snapshot, password)) {
        return loadDataToLocalStorage();
    }
    checkLoginResults(false);
}


/**
 * Validates email and password inputs for login.
 * @param {string} email
 * @param {string} password
 * @returns {boolean} True when both inputs are valid.
 */
function validateLoginInputs(email, password) {
    let isValid = true;
    if (!validateLoginEmail(email)) isValid = false;
    if (!password) {
        showFieldError("password", "passwordError", "Please enter your password.");
        isValid = false;
    }
    return isValid;
}


/**
 * Checks credentials against the DB snapshot and stores the user in localStorage.
 * @param {object} snapshot
 * @param {string} password
 * @returns {boolean}
 */
function checkIfUserExistsForLogin(snapshot, password) {
    let loginSuccess = false;
    snapshot.forEach(function(userSnapshot) {
        const userData = userSnapshot.val();
        if (userData.password == password) {
            loginSuccess = true;
            localStorage.setItem("currentUserName", userData.name);
            localStorage.setItem("currentUserEmail", userData.email);
        }
    });
    return loginSuccess;
}


/**
 * Redirects to summary on success, or shows field errors on failure.
 * @param {boolean} loginSuccess
 */
function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) {
        sessionStorage.setItem("fromLogin", "true");
        window.location.href = "summary.html";
    } else {
        showFieldError("email", "emailError", "Invalid email or password.");
        showFieldError("password", "passwordError", "Invalid email or password.");
    }
}



/**
 * Handles database read errors during login and shows a user-friendly message.
 * @param {Error} error
 * @param {string} email
 * @param {string} password
 */
function handleLoginReadError(error, email, password) {
    if (isFirebaseAdminRestrictedOperation(error)) {
        handleAdminRestrictedLogin(email, password);
        return;
    }
    console.error("Login data could not be loaded from Firebase:", error);
    showFieldError("email", "emailError", "Login is currently unavailable. Please try again later.");
    showFieldError("password", "passwordError", "Login is currently unavailable. Please try again later.");
}

function handleAdminRestrictedLogin(email, password) {
    console.warn("Firebase anonymous auth is blocked by project settings.");
    if (!loginWithLocalUser(email, password)) {
        checkLoginResults(false);
        return;
    }
    loadDataToLocalStorage().catch(function(localError) { completeLocalLoginFallback(localError); });
}

function completeLocalLoginFallback(localError) {
    console.warn("Local fallback data load failed:", localError);
    setLocalDataDefaults();
    checkLoginResults(true);
}


/** Loads boards and contacts from DB into localStorage, then triggers login redirect. */
async function loadDataToLocalStorage() {
    try {
        await ensureFirebaseSession();
    } catch (error) {
        if (isFirebaseAdminRestrictedOperation(error)) {
            setLocalDataDefaults();
            checkLoginResults(true);
            return;
        }
        throw error;
    }

    const results = await Promise.allSettled([
        db.ref("boards").once("value"),
        db.ref("contacts").once("value"),
    ]);

    const boardsResult = results[0];
    const contactsResult = results[1];

    if (boardsResult.status === "fulfilled") {
        localStorage.setItem("boards", JSON.stringify(boardsResult.value.val() || {}));
    } else {
        console.warn("Boards could not be loaded from Firebase:", boardsResult.reason);
        localStorage.setItem("boards", JSON.stringify({}));
    }

    if (contactsResult.status === "fulfilled") {
        const mergedContacts = mergeContactsWithLocal(contactsResult.value.val() || {});
        localStorage.setItem("contacts", JSON.stringify(mergedContacts));
    } else {
        console.warn("Contacts could not be loaded from Firebase:", contactsResult.reason);
        ensureContactsStorage();
    }

    checkLoginResults(true);
}


/** Logs in as guest with fixed credentials. */
function guestLogin() {
    localStorage.setItem("currentUserName", "Gast");
    localStorage.setItem("currentUserEmail", "Gast@Gast.com");
    loadDataToLocalStorage().catch(function(error) {
        console.warn("Guest data load failed, using local defaults:", error);
        setLocalDataDefaults();
        checkLoginResults(true);
    });
}


/** Validates registration inputs and triggers the user-exists check. */
function registerUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    const passwordconfirm = document.getElementById("passwordconfirm").value.trim();
    if (!validateInputs(email, password, passwordconfirm)) return;
    checkIfUserExists();
}


/** Queries DB for an existing user with the same email; saves or shows error. */
function checkIfUserExists() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value.trim();
    runRegistrationPrecheck(name, email, password);
}

function runRegistrationPrecheck(name, email, password) {
    ensureFirebaseSession()
        .then(function() { return fetchUsersByEmail(email); })
        .then(function(snapshot) { processRegistrationSnapshot(snapshot, name, email, password); })
        .catch(function(error) { handleRegistrationReadError(error, name, email, password); });
}

function processRegistrationSnapshot(snapshot, name, email, password) {
    if (findExistingUser(snapshot)) {
        userAlreadyExistsError();
        return;
    }
    saveUser(name, email, password);
}


/**
 * Returns true if any user in the snapshot has the given email.
 * @param {object} snapshot
 * @returns {boolean}
 */
function findExistingUser(snapshot) {
    return snapshot.exists();
}


/**
 * Pushes a new user object to the DB and creates a new contact.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
async function saveUser(name, email, password) {
    try {
        await ensureFirebaseSession();
        await db.ref("users").push({ name: name, email: email, password: password });

        try {
            await db.ref("contacts").push({ name: name, email: email, phone: '' });
        } catch (error) {
            console.warn('Contact bootstrap during registration failed:', error);
        }

        saveUserSuccess();
    } catch (error) {
        if (isFirebaseAdminRestrictedOperation(error)) {
            if (localUserExists(email)) {
                userAlreadyExistsError();
                return;
            }
            saveUserLocally(name, email, password);
            return;
        }
        saveUserError();
    }
}


/**
 * Handles database read errors during registration checks.
 * @param {Error} error
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
function handleRegistrationReadError(error, name, email, password) {
    if (isFirebaseAdminRestrictedOperation(error)) {
        handleRegistrationAdminRestriction(name, email, password);
        return;
    }
    if (isFirebasePermissionDenied(error)) {
        console.warn("Registration pre-check denied by Firebase rules. Continuing with direct registration write.");
        saveUser(name, email, password);
        return;
    }
    console.error("Registration pre-check could not be loaded from Firebase:", error);
    showFieldError("email", "emailError", "Registration is currently unavailable. Please try again later.");
}

function handleRegistrationAdminRestriction(name, email, password) {
    console.warn("Firebase anonymous auth is blocked by project settings.");
    if (localUserExists(email)) {
        userAlreadyExistsError();
        return;
    }
    saveUserLocally(name, email, password);
}


/**
 * Detects Firebase permission-denied errors across SDK error shapes.
 * @param {Error} error
 * @returns {boolean}
 */
function isFirebasePermissionDenied(error) {
    if (!error) return false;
    const code = String(error.code || "").toLowerCase();
    const message = String(error.message || "").toLowerCase();
    return code.includes("permission") || message.includes("permission_denied");
}


/**
 * Detects Firebase auth/admin-restricted-operation errors.
 * @param {Error} error
 * @returns {boolean}
 */
function isFirebaseAdminRestrictedOperation(error) {
    if (!error) return false;
    const code = String(error.code || "").toLowerCase();
    const message = String(error.message || "").toLowerCase();
    return code.includes("admin-restricted-operation") || message.includes("admin-restricted-operation");
}


/**
 * Ensures an authenticated Firebase session for database access.
 * @returns {Promise<object|null>}
 */
function ensureFirebaseSession() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    if (!authInitPromise) authInitPromise = startAnonymousSession();
    return authInitPromise;
}

function startAnonymousSession() {
    return auth.signInAnonymously()
        .then(function(result) { return result.user || auth.currentUser; })
        .catch(function(error) {
            authInitPromise = null;
            throw error;
        });
}


/**
 * Queries users by email instead of reading the whole users tree.
 * @param {string} email
 * @returns {Promise<object>}
 */
function fetchUsersByEmail(email) {
    return db.ref("users")
        .orderByChild("email")
        .equalTo(email)
        .limitToFirst(1)
        .once("value");
}