const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL: "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c",
};

const AVATAR_COLORS = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF', '#00BEE8',
    '#1FD7C1', '#FF745E', '#FFA35E', '#FC71FF', '#FFC701',
    '#0038FF', '#C3FF2B', '#FFE62B', '#FF4646', '#FFBB2B',
];

// Firebase wird initialisiert und Zugriff auf die Realtime Database
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Speichert alle geladenen Kontakte als Array von Objekten: { firebaseKey, name, email, phone }
let contactsList = [];

// Speichert den Firebase-Key des aktuell angezeigten Kontakts, damit er in der Liste Markiert wird
let currentActiveFirebaseKey = null;

// CSS-Klassen für den Bestätigungsdialog zum Löschen eines Kontakts
const DELETE_DIALOG_CLASSES = {
    popup: 'swal-delete-popup',
    title: 'swal-delete-title',
    htmlContainer: 'swal-delete-text',
    confirmButton: 'add-contact__btn--create',
    cancelButton: 'add-contact__btn--cancel',
};

function initContacts() {
    loadContactsFromLocalStorage();
    renderContacts();
    setupEventListeners();
}


// --- Local Storage ---

// Gibt die Kontaktdaten aus dem Local Storage als Objekt zurück
function getLocalStorageData() {
    return JSON.parse(localStorage.getItem('contacs') || '{}');
}

// Wandelt einen Eintrag aus dem Local Storage in ein Kontakt-Objekt
function parseContact(entry) {
    return {
        firebaseKey: entry[0],
        name: entry[1].name || '',
        email: entry[1].email || '',
        phone: String(entry[1].phone || ''),
    };
}

// Liest die Kontakte aus dem Local Storage und speichert sie im contactsList Array
function loadContactsFromLocalStorage() {
    const entries = Object.entries(getLocalStorageData());
    contactsList = [];
    for (let index = 0; index < entries.length; index++) {
        contactsList.push(parseContact(entries[index]));
    }
}

// Speichert oder überschreibt einen Kontakt im Local Storage
function setInLocalStorage(key, contact) {
    const data = getLocalStorageData();
    data[key] = contact;
    localStorage.setItem('contacs', JSON.stringify(data));
}

// Entfernt einen Kontakt aus dem Local Storage
function removeFromLocalStorage(key) {
    const data = getLocalStorageData();
    delete data[key];
    localStorage.setItem('contacs', JSON.stringify(data));
}


// --- Hilfsfunktionen ---

// Gibt die Initialen eines Namens zurück
function getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
}

// Gibt eine Farbe für den Avatar zurück, basierend auf der E-Mail-Adresse des Kontakts
function getAvatarColor(email) {
    let sum = 0;
    for (let index = 0; index < email.length; index++) {
        sum += email.charCodeAt(index);
    }
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// Sortiert die Kontakte alphabetisch und gruppiert sie nach dem ersten Buchstaben
function groupContactsAlphabetically() {
    const sorted = [...contactsList].sort(function(a, b) {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
    const groups = {};
    for (let index = 0; index < sorted.length; index++) {
        const letter = sorted[index].name.trim()[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(sorted[index]);
    }
    return groups;
}

// Baut den HTML-String aller Kontakt-Items einer Gruppe zusammen
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

// Gibt den HTML-String für die Header-Section zurück
function showFirebaseError(error) {
    Swal.fire({ icon: 'error', title: 'Error', text: error.message });
}

// Erfolgsmeldung als Toast, z.B. nach dem Erstellen eines Kontakts
function showSuccessToast(message) {
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        title: message,
        showConfirmButton: false,
        timer: 3000,
        background: '#2a3647',
        color: '#fff',
    });
}


// --- Render ---

// Baut die Kontaktliste in der Sidebar auf
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

// Kombiniert Karte und Info-Bereich für die vollständige Detail-Ansicht
function getContactDetailTemplate(contact) {
    const avatarColor = getAvatarColor(contact.email);
    return getContactCardTemplate(contact, avatarColor) + getContactInfoTemplate(contact);
}


// --- Detail-Ansicht ---

// Zeigt die Detailinfos eines Kontakts an
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

// Leert den Detail-Bereich, z.B. nach dem Löschen eines Kontakts
function clearContactDetail() {
    currentActiveFirebaseKey = null;
    const contactInfo = document.getElementById('contactInfo');
    contactInfo.innerHTML = '';
    contactInfo.classList.remove('contact-content__info--visible');
    document.getElementById('contactsPanel').classList.remove('contacts--detail-open');
    closeContactActionMenu();
    document.getElementById('contactActionMenu').classList.remove('contact-action-menu--active');
}

function closeContactDetailOnMobile() {
    document.getElementById('contactsPanel').classList.remove('contacts--detail-open');
}


// --- Add Contact ---

function openAddContactDialog() {
    document.getElementById('addContactForm').reset();
    resetAddContactAvatar();
    document.getElementById('addContactOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddContactDialog() {
    document.getElementById('addContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

// Setzt den Avatar im Add-Dialog auf den grauen Platzhalter zurück
function resetAddContactAvatar() {
    const avatar = document.getElementById('addContactAvatar');
    avatar.classList.add('add-contact__avatar--placeholder');
    avatar.innerHTML = '<img src="assets/icons/person.png" alt="Person" class="add-contact__avatar-icon" />';
    avatar.style.backgroundColor = '';
}

// Aktualisiert die Avatar-Vorschau
function updateAddContactAvatarPreview() {
    const name = document.getElementById('addContactName').value.trim();
    const avatar = document.getElementById('addContactAvatar');
    if (name.length > 0) {
        avatar.classList.remove('add-contact__avatar--placeholder');
        avatar.innerHTML = getInitials(name);
        avatar.style.backgroundColor = '#29ABE2';
    } else {
        resetAddContactAvatar();
    }
}

// Wird aufgerufen nachdem Firebase den neuen Kontakt gespeichert hat
function onContactAdded(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeAddContactDialog();
    showContactDetail(key);
    showSuccessToast('Contact successfully created');
}

// Liest das Formular aus und speichert den neuen Kontakt in Firebase
function handleAddContactSubmit(event) {
    event.preventDefault();
    const newContact = {
        name: document.getElementById('addContactName').value.trim(),
        email: document.getElementById('addContactEmail').value.trim(),
        phone: document.getElementById('addContactPhone').value.trim(),
    };
    db.ref('contacs').push(newContact)
        .then(function(snapshot) { onContactAdded(snapshot.key, newContact); })
        .catch(showFirebaseError);
}


// --- Edit Contact ---

// Befüllt den Avatar im Edit-Dialog mit den Initialen und der Farbe des Kontakts
function setEditContactAvatar(contact) {
    const avatar = document.getElementById('editContactAvatar');
    avatar.textContent = getInitials(contact.name);
    avatar.style.backgroundColor = getAvatarColor(contact.email);
}

// Öffnet den Edit-Dialog und füllt alle Felder mit den aktuellen Daten des Kontakts
function openEditContactDialog(key) {
    const contact = contactsList.find(function(c) { return c.firebaseKey === key; });
    if (!contact) return;
    document.getElementById('editContactFirebaseKey').value = key;
    document.getElementById('editContactName').value = contact.name;
    document.getElementById('editContactEmail').value = contact.email;
    document.getElementById('editContactPhone').value = contact.phone;
    setEditContactAvatar(contact);
    document.getElementById('editContactOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditContactDialog() {
    document.getElementById('editContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

function onContactEdited(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    showContactDetail(key);
}

// Liest das Formular aus und speichert die Änderungen in Firebase
function handleEditContactSubmit(event) {
    event.preventDefault();
    const key = document.getElementById('editContactFirebaseKey').value;
    const updated = {
        name: document.getElementById('editContactName').value.trim(),
        email: document.getElementById('editContactEmail').value.trim(),
        phone: document.getElementById('editContactPhone').value.trim(),
    };
    db.ref('contacs/' + key).update(updated)
        .then(function() { onContactEdited(key, updated); })
        .catch(showFirebaseError);
}


// --- Delete Contact ---

// Dialog zum Löschen eines Kontakts, mit SweetAlert
function confirmDeleteContact(key) {
    const contact = contactsList.find(function(c) { return c.firebaseKey === key; });
    const name = contact ? contact.name : 'this contact';
    Swal.fire({
        title: 'Delete contact?',
        text: 'Do you really want to delete "' + name + '"?',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: DELETE_DIALOG_CLASSES,
    }).then(function(result) { if (result.isConfirmed) deleteContact(key); });
}

function onContactDeleted(key) {
    removeFromLocalStorage(key);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    clearContactDetail();
}

function deleteContact(key) {
    db.ref('contacs/' + key).remove()
        .then(function() { onContactDeleted(key); })
        .catch(showFirebaseError);
}


// --- Mobile Aktionsmenü ---

function openEditFromMenu() {
    closeContactActionMenu();
    openEditContactDialog(currentActiveFirebaseKey);
}

function deleteFromMenu() {
    closeContactActionMenu();
    confirmDeleteContact(currentActiveFirebaseKey);
}

function toggleContactActionMenu(event) {
    event.stopPropagation();
    document.getElementById('contactActionPopup').classList.toggle('contact-action-menu__popup--visible');
}

function closeContactActionMenu() {
    document.getElementById('contactActionPopup').classList.remove('contact-action-menu__popup--visible');
}


// --- Event Listeners ---

function onDeleteFromEditDialog() {
    const key = document.getElementById('editContactFirebaseKey').value;
    confirmDeleteContact(key);
}

function setupAddDialogListeners() {
    document.getElementById('closeAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('cancelAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('addContactForm').addEventListener('submit', handleAddContactSubmit);
    document.getElementById('addContactName').addEventListener('input', updateAddContactAvatarPreview);
    document.getElementById('addContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'addContactOverlay') closeAddContactDialog();
    });
}

function setupEditDialogListeners() {
    document.getElementById('closeEditContactBtn').addEventListener('click', closeEditContactDialog);
    document.getElementById('editContactForm').addEventListener('submit', handleEditContactSubmit);
    document.getElementById('deleteContactFromEditBtn').addEventListener('click', onDeleteFromEditDialog);
    document.getElementById('editContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'editContactOverlay') closeEditContactDialog();
    });
}

function setupMobileListeners() {
    document.getElementById('addContactFab').addEventListener('click', openAddContactDialog);
    document.getElementById('contactActionBtn').addEventListener('click', toggleContactActionMenu);
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('contactActionMenu');
        if (!menu.contains(event.target)) closeContactActionMenu();
    });
}

function setupEventListeners() {
    document.getElementById('addNewContact').addEventListener('click', openAddContactDialog);
    document.getElementById('contactsBackBtn').addEventListener('click', closeContactDetailOnMobile);
    setupAddDialogListeners();
    setupEditDialogListeners();
    setupMobileListeners();
}
