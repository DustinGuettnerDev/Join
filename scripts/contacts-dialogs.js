// --- Add Contact ---

/**
 * Opens the add contact dialog and resets the form and avatar preview.
 */
function openAddContactDialog() {
    document.getElementById('addContactForm').reset();
    resetAddContactAvatar();
    document.getElementById('addContactOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}


/**
 * Closes the add contact dialog and restores page scrolling.
 */
function closeAddContactDialog() {
    document.getElementById('addContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}


/**
 * Resets the avatar in the add dialog to the default placeholder icon.
 */
function resetAddContactAvatar() {
    const avatar = document.getElementById('addContactAvatar');
    avatar.classList.add('add-contact__avatar--placeholder');
    avatar.innerHTML = getAvatarPlaceholderTemplate();
    avatar.style.backgroundColor = '';
}


/**
 * Updates the avatar preview in the add dialog based on the current name input value.
 */
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


/**
 * Called after Firebase has saved the new contact.
 * Updates local storage, re-renders the list, and shows the new contact's detail view.
 * @param {string} key - The Firebase key assigned to the new contact.
 * @param {{ name: string, email: string, phone: string }} contact - The newly created contact data.
 */
function onContactAdded(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeAddContactDialog();
    showContactDetail(key);
    showSuccessToast('Contact successfully created');
}


/**
 * Reads the add contact form and pushes the new contact to Firebase.
 * @param {Event} event - The form submit event.
 */
function handleAddContactSubmit(event) {
    event.preventDefault();
    const newContact = {
        name: toTitleCase(document.getElementById('addContactName').value),
        email: document.getElementById('addContactEmail').value.trim(),
        phone: document.getElementById('addContactPhone').value.trim(),
    };
    db.ref('contacts').push(newContact)
        .then(function(snapshot) { onContactAdded(snapshot.key, newContact); })
        .catch(showFirebaseError);
}


// --- Edit Contact ---

/**
 * Populates the avatar in the edit dialog with the contact's initials and avatar color.
 * @param {{ name: string, email: string }} contact - The contact whose avatar to display.
 */
function setEditContactAvatar(contact) {
    const avatar = document.getElementById('editContactAvatar');
    avatar.textContent = getInitials(contact.name);
    avatar.style.backgroundColor = getAvatarColor(contact.email);
}


/**
 * Opens the edit dialog and pre-fills all fields with the contact's current data.
 * @param {string} key - The Firebase key of the contact to edit.
 */
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


/**
 * Closes the edit contact dialog and restores page scrolling.
 */
function closeEditContactDialog() {
    document.getElementById('editContactOverlay').style.display = 'none';
    document.body.style.overflow = '';
}


/**
 * Called after Firebase has saved the updated contact data.
 * Updates local storage, re-renders the list, and refreshes the detail view.
 * @param {string} key - The Firebase key of the edited contact.
 * @param {{ name: string, email: string, phone: string }} contact - The updated contact data.
 */
function onContactEdited(key, contact) {
    setInLocalStorage(key, contact);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    showContactDetail(key);
}


/**
 * Reads the edit form and saves the updated contact data to Firebase.
 * @param {Event} event - The form submit event.
 */
function handleEditContactSubmit(event) {
    event.preventDefault();
    const key = document.getElementById('editContactFirebaseKey').value;
    const updated = {
        name: toTitleCase(document.getElementById('editContactName').value),
        email: document.getElementById('editContactEmail').value.trim(),
        phone: document.getElementById('editContactPhone').value.trim(),
    };
    db.ref('contacts/' + key).update(updated)
        .then(function() { onContactEdited(key, updated); })
        .catch(showFirebaseError);
}


// --- Delete Contact ---

/**
 * Shows a SweetAlert confirmation dialog and deletes the contact if confirmed.
 * @param {string} key - The Firebase key of the contact to delete.
 */
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
        customClass: deleteDialogClasses,
    }).then(function(result) { if (result.isConfirmed) deleteContact(key); });
}


/**
 * Called after Firebase has deleted the contact.
 * Removes it from local storage, re-renders the list, and clears the detail view.
 * @param {string} key - The Firebase key of the deleted contact.
 */
function onContactDeleted(key) {
    removeFromLocalStorage(key);
    loadContactsFromLocalStorage();
    renderContacts();
    closeEditContactDialog();
    clearContactDetail();
}


/**
 * Deletes a contact from Firebase by its key.
 * @param {string} key - The Firebase key of the contact to delete.
 */
function deleteContact(key) {
    db.ref('contacts/' + key).remove()
        .then(function() { onContactDeleted(key); })
        .catch(showFirebaseError);
}


// --- Mobile Action Menu ---

/**
 * Opens the edit dialog for the currently active contact from the mobile action menu.
 */
function openEditFromMenu() {
    closeContactActionMenu();
    openEditContactDialog(currentActiveFirebaseKey);
}


/**
 * Triggers the delete confirmation for the currently active contact from the mobile action menu.
 */
function deleteFromMenu() {
    closeContactActionMenu();
    confirmDeleteContact(currentActiveFirebaseKey);
}


/**
 * Toggles the visibility of the mobile action menu popup.
 * @param {Event} event - The click event (propagation is stopped to prevent immediate close).
 */
function toggleContactActionMenu(event) {
    event.stopPropagation();
    document.getElementById('contactActionPopup').classList.toggle('contact-action-menu__popup--visible');
}


/**
 * Hides the mobile action menu popup.
 */
function closeContactActionMenu() {
    document.getElementById('contactActionPopup').classList.remove('contact-action-menu__popup--visible');
}


// --- Event Listeners ---

/**
 * Reads the Firebase key from the edit dialog and triggers the delete confirmation.
 */
function onDeleteFromEditDialog() {
    const key = document.getElementById('editContactFirebaseKey').value;
    confirmDeleteContact(key);
}


/**
 * Attaches all event listeners for the add contact dialog.
 */
function setupAddDialogListeners() {
    document.getElementById('closeAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('cancelAddContactBtn').addEventListener('click', closeAddContactDialog);
    document.getElementById('addContactForm').addEventListener('submit', handleAddContactSubmit);
    document.getElementById('addContactName').addEventListener('input', updateAddContactAvatarPreview);
    document.getElementById('addContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'addContactOverlay') closeAddContactDialog();
    });
}


/**
 * Attaches all event listeners for the edit contact dialog.
 */
function setupEditDialogListeners() {
    document.getElementById('closeEditContactBtn').addEventListener('click', closeEditContactDialog);
    document.getElementById('editContactForm').addEventListener('submit', handleEditContactSubmit);
    document.getElementById('deleteContactFromEditBtn').addEventListener('click', onDeleteFromEditDialog);
    document.getElementById('editContactOverlay').addEventListener('click', function(event) {
        if (event.target.id === 'editContactOverlay') closeEditContactDialog();
    });
}


/**
 * Attaches all event listeners for mobile-specific UI elements (FAB, action menu, outside-click).
 */
function setupMobileListeners() {
    document.getElementById('addContactFab').addEventListener('click', openAddContactDialog);
    document.getElementById('contactActionBtn').addEventListener('click', toggleContactActionMenu);
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('contactActionMenu');
        if (!menu.contains(event.target)) closeContactActionMenu();
    });
}


/**
 * Sets up all event listeners for the contacts page.
 */
function setupEventListeners() {
    document.getElementById('addNewContact').addEventListener('click', openAddContactDialog);
    document.getElementById('contactsBackBtn').addEventListener('click', closeContactDetailOnMobile);
    setupAddDialogListeners();
    setupEditDialogListeners();
    setupMobileListeners();
}
