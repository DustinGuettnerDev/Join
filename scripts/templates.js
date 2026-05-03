function getHeaderCircleUserTemplate() {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text id="js-header-user-initials" x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700"></text>
        </svg>
    `;
}

function getHeaderUserMenuTemplate() {
    return `
        <ul id="js-header-user-menu-list" class="header__user-list fs-small-regular fc-lightgrey">
            <li><a class="header__user-link" href="legal-notice.html">Legal Notice</a></li>
            <li><a class="header__user-link" href="privacy-policy.html">Privacy Policy</a></li>
            <li><a class="header__user-link" href="login.html">Log Out</a></li>
        </ul>
    `;
}
function getHeaderUserMenuHelpTemplate() {
    return `<li id="js-header-user-menu-help"><a class="header__user-link" href="help.html">Help</a></li>`;
}

function getSidebarTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-summary" class="sidebar__nav-link" href="summary.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/summary.svg" alt="" /> 
                                <span>Summary</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-add-task" class="sidebar__nav-link" href="add-task.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/add-task.svg" alt="" />
                                <span>Add Task</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-boards" class="sidebar__nav-link" href="boards.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/boards.svg" alt="" /> 
                                <span>Boards</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-contacts" class="sidebar__nav-link" href="contacts.html">
                                <img class="sidebar__nav-img" src="assets/icons/sidebar/inactive/contacts.svg" alt="" /> 
                                <span>Contacts</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                <footer class="sidebar__legal-information">
                    <ul class="sidebar__legal-information-list">
                        <li>
                            <a id="js-sidebar-privacy-policy" class="sidebar__legal-information-link" href="privacy-policy.html">Privacy Policy</a>
                        </li>
                        <li>
                            <a id="js-sidebar-legal-notice" class="sidebar__legal-information-link" href="legal-notice.html">Legal Notice</a>
                        </li>
                    </ul>
                </footer>`;
}

function getHeaderTemplate() {
    return `<div class="header__content">
                <img class="header__mobile-logo" src="assets/logos/logo-mobile.svg" alt="" />
                <h3 class="header__headline3 fs-medium-regular">Kanban Project Management Tool</h3>
                <div class="header__user-interaction-container">
                    <a onclick="goToHelp()"><img class="header__help-icon" src="assets/icons/header/help.svg" alt="Help" /></a>
                    <button id="js-user-menu-button" onclick="toggleUserMenu()" class="header__user-button"></button>
                    <div id="js-header-user-menu" class="header__user-menu"></div>
                </div>
            </div>`;
}


// --- Contacts Templates ---

// Einzelnes Kontakt-Item in der Sidebar-Liste
function getContactItemTemplate(contact, isActiveClass, avatarColor) {
    return `<div class="contact-item ${isActiveClass}" data-firebase-key="${contact.firebaseKey}" onclick="showContactDetail('${contact.firebaseKey}')">
                <div class="contact-item__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-item__info">
                    <span class="contact-item__name">${contact.name}</span>
                    <span class="contact-item__mail">${contact.email}</span>
                </div>
            </div>`;
}

// Buchstabengruppe mit allen zugehörigen Kontakt-Items
function getContactGroupTemplate(letter, itemsHtml) {
    return `<div class="contact-group">
                <div class="contact-group__header">
                    <span class="contact-group__letter">${letter}</span>
                    <hr class="contact-group__divider" />
                </div>
                <div class="contact-group__items">${itemsHtml}</div>
            </div>`;
}

// Großer Avatar mit Name und Edit/Delete-Buttons in der Detail-Ansicht
function getContactCardTemplate(contact, avatarColor) {
    return `<div class="contact-card">
                <div class="contact-card__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-card__user-info">
                    <h2 class="contact-card__name">${contact.name}</h2>
                    <div class="contact-card__btn-container">
                        <button class="contact-card__btn" onclick="openEditContactDialog('${contact.firebaseKey}')"><img src="assets/icons/edit.png" alt="" />Edit</button>
                        <button class="contact-card__btn" onclick="confirmDeleteContact('${contact.firebaseKey}')"><img src="assets/icons/delete.png" alt="" />Delete</button>
                    </div>
                </div>
            </div>`;
}

// E-Mail und Telefon in der Detail-Ansicht
function getContactInfoTemplate(contact) {
    return `<div class="contact-card__info">
                <h3>Contact Information</h3>
                <div class="contact-card__information">
                    <span><strong>Email</strong></span>
                    <a href="mailto:${contact.email}">${contact.email}</a>
                </div>
                <div class="contact-card__information">
                    <span><strong>Phone</strong></span>
                    <a href="tel:${contact.phone}">${contact.phone}</a>
                </div>
            </div>`;
}
