const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL: "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c",
};


/**
 * Initializes Firebase if not already done and returns the Realtime Database instance.
 * @returns {firebase.database.Database} The Firebase Realtime Database instance.
 */
function getFirebaseDatabase() {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    return firebase.database();
}


const db = getFirebaseDatabase();

/** All loaded contacts as an array of objects: { firebaseKey, name, email, phone } */
let contactsList = [];

/** Firebase key of the currently displayed contact, used to highlight it in the list. */
let currentActiveFirebaseKey = null;

/** CSS class names for the SweetAlert delete confirmation dialog. */
const deleteDialogClasses = {
    popup: 'swal-delete-popup',
    title: 'swal-delete-title',
    htmlContainer: 'swal-delete-text',
    confirmButton: 'add-contact__btn--create',
    cancelButton: 'add-contact__btn--cancel',
};


/**
 * Initializes the contacts page: loads contacts from local storage,
 * renders the list, and sets up all event listeners.
 */
function initContacts() {
    loadContactsFromLocalStorage();
    renderContacts();
    setupEventListeners();
}


// --- Local Storage ---

/**
 * Returns the contacts data stored in local storage as a plain object.
 * @returns {Object} Key-value map of Firebase keys to contact data objects.
 */
function getLocalStorageData() {
    return JSON.parse(localStorage.getItem('contacts') || '{}');
}


/**
 * Converts a local storage entry into a normalized contact object.
 * @param {Array} entry - A [key, value] pair from Object.entries().
 * @returns {{ firebaseKey: string, name: string, email: string, phone: string }} Normalized contact.
 */
function parseContact(entry) {
    return {
        firebaseKey: entry[0],
        name: entry[1].name || '',
        email: entry[1].email || '',
        phone: String(entry[1].phone || ''),
    };
}


/**
 * Reads all contacts from local storage and populates the contactsList array.
 */
function loadContactsFromLocalStorage() {
    const entries = Object.entries(getLocalStorageData());
    contactsList = [];
    for (let index = 0; index < entries.length; index++) {
        contactsList.push(parseContact(entries[index]));
    }
}


/**
 * Fetches all contacts from Firebase and writes them to local storage.
 * @returns {Promise<boolean>} True on success, false on network or HTTP error.
 */
async function syncContactsFromFirebaseToLocalStorage() {
    try {
        const response = await fetch(`${firebaseBaseUrl}contacts.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteContacts = await response.json() || {};
        localStorage.setItem('contacts', JSON.stringify(remoteContacts));
        return true;
    } catch (error) {
        console.error('Failed to load contacts from Firebase:', error);
        return false;
    }
}


/**
 * Saves or overwrites a single contact in local storage.
 * @param {string} key - The Firebase key of the contact.
 * @param {{ name: string, email: string, phone: string }} contact - Contact data to store.
 */
function setInLocalStorage(key, contact) {
    const data = getLocalStorageData();
    data[key] = contact;
    localStorage.setItem('contacts', JSON.stringify(data));
}


/**
 * Removes a contact from local storage by its Firebase key.
 * @param {string} key - The Firebase key of the contact to remove.
 */
function removeFromLocalStorage(key) {
    const data = getLocalStorageData();
    delete data[key];
    localStorage.setItem('contacts', JSON.stringify(data));
}


// --- Utility ---

/**
 * Converts a string to title case (first letter of each word capitalized).
 * @param {string} str - The input string.
 * @returns {string} The title-cased string.
 */
function toTitleCase(str) {
    const words = str.trim().split(' ');
    const result = [];
    for (let index = 0; index < words.length; index++) {
        const word = words[index];
        result.push(word[0].toUpperCase() + word.slice(1).toLowerCase());
    }
    return result.join(' ');
}


/**
 * Returns the initials of a full name (first letter of first and last word).
 * @param {string} name - The full name of the contact.
 * @returns {string} One or two uppercase initials.
 */
function getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
}


/**
 * Returns a deterministic avatar color based on the contact's email address.
 * @param {string} email - The email address used to calculate the color index.
 * @returns {string} A hex color string from avatarColors.
 */
function getAvatarColor(email) {
    let sum = 0;
    for (let index = 0; index < email.length; index++) {
        sum += email.charCodeAt(index);
    }
    return avatarColors[sum % avatarColors.length];
}


/**
 * Sorts contactsList alphabetically and groups contacts by their first letter.
 * @returns {Object.<string, Array>} An object where keys are uppercase letters and values are contact arrays.
 */
function groupContactsAlphabetically() {
    const sorted = [...contactsList].sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    const groups = {};
    for (let index = 0; index < sorted.length; index++) {
        const trimmed = sorted[index].name?.trim();
        if (!trimmed) continue;
        const letter = trimmed[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(sorted[index]);
    }
    return groups;
}


/**
 * Builds an HTML string for all contact items within a letter group.
 * @param {Array} contacts - Array of contact objects belonging to one letter group.
 * @returns {string} HTML markup for all contact items in the group.
 */
function buildItemsHtml(contacts) {
    let html = '';
    for (let index = 0; index < contacts.length; index++) {
        const contact = contacts[index];
        const isActiveClass = contact.firebaseKey === currentActiveFirebaseKey ? 'contact-item--active' : '';
        const avatarColor = getAvatarColor(contact.email);
        html += getContactItemTemplate(contact, isActiveClass, avatarColor);
    }
    return html;
}


// --- Render ---

/**
 * Renders the full contacts list into the sidebar, grouped by first letter.
 */
function renderContacts() {
    const container = document.getElementById('contactGroups');
    const groups = groupContactsAlphabetically();
    const letters = Object.keys(groups).sort();
    let html = '';
    for (let index = 0; index < letters.length; index++) {
        html += getContactGroupTemplate(letters[index], buildItemsHtml(groups[letters[index]]));
    }
    container.innerHTML = html;
}


/**
 * Returns the combined HTML for the contact card and the info section.
 * @param {{ name: string, email: string, phone: string }} contact - The contact to display.
 * @returns {string} HTML markup for the full detail view.
 */
function getContactDetailTemplate(contact) {
    const avatarColor = getAvatarColor(contact.email);
    return getContactCardTemplate(contact, avatarColor) + getContactInfoTemplate(contact);
}


// --- Detail View ---

/**
 * Displays the detail view for a contact by its Firebase key.
 * Updates the active highlight in the list and injects the detail HTML.
 * @param {string} key - The Firebase key of the contact to display.
 */
function showContactDetail(key) {
    const contact = contactsList.find(function(c) { return c.firebaseKey === key; });
    if (!contact) return;
    currentActiveFirebaseKey = key;
    renderContacts();
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = getContactDetailTemplate(contact);
    contactInfo.classList.add('contact-content__info--visible');
    document.getElementById('contactsPanel').classList.add('contacts--detail-open');
    document.getElementById('contactActionMenu').classList.add('contact-action-menu--active');
}


/**
 * Clears the contact detail panel and resets all active state.
 */
function clearContactDetail() {
    currentActiveFirebaseKey = null;
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = '';
    contactInfo.classList.remove('contact-content__info--visible');
    document.getElementById('contactsPanel').classList.remove('contacts--detail-open');
    closeContactActionMenu();
    document.getElementById('contactActionMenu').classList.remove('contact-action-menu--active');
}


/**
 * Hides the detail panel on mobile to return to the contacts list.
 */
function closeContactDetailOnMobile() {
    document.getElementById('contactsPanel').classList.remove('contacts--detail-open');
}
