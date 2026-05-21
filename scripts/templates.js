/**
 * Returns the placeholder icon markup for an empty contact avatar.
 * @returns {string} The avatar placeholder image HTML.
 */
function getAvatarPlaceholderTemplate() {
    return '<img src="assets/contacts/person.png" alt="Person" class="add-contact__avatar-icon" />';
}


/**
 * Returns the sidebar template for logged-in users.
 * @returns {string} The sidebar HTML markup.
 */
function getSidebarTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="Join" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-summary" class="sidebar__nav-link" href="summary.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/summary.svg" alt="Summary" /> 
                                <span>Summary</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-add-task" class="sidebar__nav-link" href="add-task.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/add-task.svg" alt="Add Task" />
                                <span>Add Task</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-boards" class="sidebar__nav-link" href="boards.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/boards.svg" alt="Boards" /> 
                                <span>Boards</span>
                            </a>
                        </li>
                        <li class="sidebar__list-item">
                            <a id="js-sidebar-contacts" class="sidebar__nav-link" href="contacts.html">
                                <img class="sidebar__nav-img" src="assets/sidebar/inactive/contacts.svg" alt="Contacts" /> 
                                <span>Contacts</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                <footer class="sidebar__legal-information">
                    <ul class="sidebar__legal-information-list">
                        <li>
                            <a id="js-sidebar-privacy-policy" class="sidebar__legal-information-link link-hover" href="privacy-policy.html">Privacy Policy</a>
                        </li>
                        <li>
                            <a id="js-sidebar-legal-notice" class="sidebar__legal-information-link link-hover" href="legal-notice.html">Legal Notice</a>
                        </li>
                    </ul>
                </footer>`;
}

/**
 * Returns the sidebar template for logged-out users.
 * @returns {string} The sidebar HTML markup.
 */
function getSidebarNotLoggedInTemplate() {
    return `<img class="sidebar__logo" src="assets/logos/logo.svg" alt="Join" />
                <nav class="sidebar__nav">
                    <ul class="sidebar__nav-list">
                        <li class="sidebar__list-item">
                            <a class="sidebar__nav-link sidebar__login-link" href="index.html">
                                <img class="sidebar__nav-img" src="assets/login/Login.png" alt="Login" />
                                <span>Login</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <footer class="sidebar__legal-information">
                    <ul class="sidebar__legal-information-list">
                        <li>
                            <a id="js-sidebar-privacy-policy" class="sidebar__legal-information-link link-hover" href="privacy-policy.html">Privacy Policy</a>
                        </li>
                        <li>
                            <a id="js-sidebar-legal-notice" class="sidebar__legal-information-link link-hover" href="legal-notice.html">Legal Notice</a>
                        </li>
                    </ul>
                </footer>`;
}

/**
 * Returns the shared header template.
 * @returns {string} The header HTML markup.
 */
function getHeaderTemplate() {
    return `<div class="header__content">
                <img class="header__mobile-logo" src="assets/logos/logo-mobile.svg" alt="Join" />
                <h3 class="header__headline3 fs-medium-regular">Kanban Project Management Tool</h3>
                <div id="js-header-user-interaction-container" class="header__user-interaction-container">
                    <a id="js-header-help-button" onclick="goToHelp()"><img class="header__help-icon" src="assets/header/help.svg" alt="Help" /></a>
                    <button id="js-user-menu-button" onclick="toggleUserMenu()" class="header__user-button"></button>
                    <div id="js-header-user-menu" class="header__user-menu"></div>
                </div>
            </div>`;
}

/**
 * Returns the SVG template for the header user circle.
 * @returns {string} The SVG markup.
 */
function getHeaderCircleUserTemplate() {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text id="js-header-user-initials" x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700"></text>
        </svg>
    `;
}

/**
 * Returns the user menu template shown in the header.
 * @returns {string} The user menu HTML markup.
 */
function getHeaderUserMenuTemplate() {
    return `
        <ul id="js-header-user-menu-list" class="header__user-list fs-small-regular fc-lightgrey">
            <li><a class="header__user-link" href="legal-notice.html">Legal Notice</a></li>
            <li><a class="header__user-link" href="privacy-policy.html">Privacy Policy</a></li>
            <li><a class="header__user-link" href="index.html">Log Out</a></li>
        </ul>
    `;
}

/**
 * Returns the mobile help entry for the header user menu.
 * @returns {string} The list item HTML markup.
 */
function getHeaderUserMenuHelpTemplate() {
    return `<li id="js-header-user-menu-help"><a class="header__user-link" href="help.html">Help</a></li>`;
}

/**
 * Returns the SVG template for the header user circle.
 * @returns {string} The SVG markup.
 */
function getHeaderCircleUserTemplate() {
    return `
        <svg width="50" height="50" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="header__circle" cx="40" cy="40" r="38" stroke="#555" stroke-width="4" fill="white" />
            <text id="js-header-user-initials" x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="28" font-family="Inter, sans-serif" fill="#4a90e2" font-weight="700"></text>
        </svg>
    `;
}

/**
 * Returns the user menu template shown in the header.
 * @returns {string} The user menu HTML markup.
 */
function getHeaderUserMenuTemplate() {
    return `
        <ul id="js-header-user-menu-list" class="header__user-list fs-small-regular fc-lightgrey">
            <li><a class="header__user-link" href="legal-notice.html">Legal Notice</a></li>
            <li><a class="header__user-link" href="privacy-policy.html">Privacy Policy</a></li>
            <li><a class="header__user-link" href="index.html" onclick="logout()">Log Out</a></li>
        </ul>
    `;
}

/**
 * Returns the mobile help entry for the header user menu.
 * @returns {string} The list item HTML markup.
 */
function getHeaderUserMenuHelpTemplate() {
    return `<li id="js-header-user-menu-help"><a class="header__user-link" href="help.html">Help</a></li>`;
}

/**
 * Returns the sidebar entry template for a single contact.
 * @param {object} contact - The contact data.
 * @param {string} isActiveClass - CSS class for the active state.
 * @param {string} avatarColor - Background color for the avatar.
 * @returns {string} The contact item HTML markup.
 */
function getContactItemTemplate(contact, isActiveClass, avatarColor) {
    return `<div class="contact-item ${isActiveClass}" data-firebase-key="${contact.firebaseKey}" onclick="showContactDetail('${contact.firebaseKey}')">
                <div class="contact-item__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-item__info">
                    <span class="contact-item__name">${contact.name}</span>
                    <span class="contact-item__mail">${contact.email}</span>
                </div>
            </div>`;
}

/**
 * Returns the grouped contact list template for one starting letter.
 * @param {string} letter - The letter heading for the group.
 * @param {string} itemsHtml - Rendered contact items for the group.
 * @returns {string} The contact group HTML markup.
 */
function getContactGroupTemplate(letter, itemsHtml) {
    return `<div class="contact-group">
                <div class="contact-group__header">
                    <span class="contact-group__letter">${letter}</span>
                    <hr class="contact-group__divider" />
                </div>
                <div class="contact-group__items">${itemsHtml}</div>
            </div>`;
}

/**
 * Returns the contact detail card template.
 * @param {object} contact - The contact data.
 * @param {string} avatarColor - Background color for the avatar.
 * @returns {string} The contact card HTML markup.
 */
function getContactCardTemplate(contact, avatarColor) {
    return `<div class="contact-card">
                <div class="contact-card__avatar" style="background-color: ${avatarColor}">${getInitials(contact.name)}</div>
                <div class="contact-card__user-info">
                    <h2 class="contact-card__name">${contact.name}</h2>
                    <div class="contact-card__btn-container">
                        <button class="contact-card__btn" onclick="openEditContactDialog('${contact.firebaseKey}')"><img src="assets/boards/edit.png" alt="edit" />Edit</button>
                        <button class="contact-card__btn" onclick="confirmDeleteContact('${contact.firebaseKey}')"><img src="assets/boards/delete.png" alt="delete" />Delete</button>
                    </div>
                </div>
            </div>`;
}

/**
 * Returns the contact detail information template.
 * @param {object} contact - The contact data.
 * @returns {string} The contact information HTML markup.
 */
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

/**
 * Returns a selectable contact entry for the assignee dropdown.
 * @param {string} initials - Initials shown in the avatar.
 * @param {string} color - Background color for the avatar.
 * @param {string} name - Display name of the contact.
 * @param {string} email - Contact email used as the checkbox value.
 * @returns {string} The dropdown item HTML markup.
 */
function getDropdownItemTemplate(initials, color, name, email) {
    return `
        <div class="dropdown__avatar" style="background-color: ${color}">${initials}</div>
        <span class="dropdown__name">${name}</span>
        <input type="checkbox" class="dropdown__checkbox" value="${email}" />
    `;
}

/**
 * Returns an avatar template for a selected assignee.
 * @param {string} initials - Initials shown in the avatar.
 * @param {string} color - Background color for the avatar.
 * @returns {string} The selected avatar HTML markup.
 */
function getSelectedAvatarTemplate(initials, color) {
    return `<div class="dropdown__avatar" style="background-color: ${color}">${initials}</div>`;
}

/**
 * Returns a template for one subtask list item.
 * @param {string} value - Text content of the subtask.
 * @returns {string} The subtask item HTML markup.
 */
function getSubtaskItemTemplate(value) {
    return `
        <span class="subtask-list__text">${value}</span>
        <div class="subtask-list__actions">
            <button type="button" class="subtask-list__btn subtask-list__btn--edit"><img src="assets/Boards/edit.png" alt="edit" /></button>
            <button type="button" class="subtask-list__btn subtask-list__btn--delete"><img src="assets/Boards/delete.png" alt="delete" /></button>
        </div>
    `;
}

function getSubtaskEditActionsTemplate() {
    return `
        <button type="button" class="subtask-list__btn subtask-list__btn--delete"><img src="assets/Boards/delete.png" alt="delete" /></button>
        <button type="button" class="subtask-list__btn subtask-list__btn--edit"><img src="assets/add-task/check grey.svg" alt="confirm" /></button>
    `;
}

function getSubtaskNormalActionsTemplate() {
    return `
        <button type="button" class="subtask-list__btn subtask-list__btn--edit"><img src="assets/Boards/edit.png" alt="edit" /></button>
        <button type="button" class="subtask-list__btn subtask-list__btn--delete"><img src="assets/Boards/delete.png" alt="delete" /></button>
    `;
}
