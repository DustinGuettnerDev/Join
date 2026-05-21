/**
 * Base URL for Firebase Realtime Database.
 * @constant {string}
 */
const BASE_URL = "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";
const ADD_TASK_DEFAULT_RETURN = "boards.html";


let addTaskContactsLS = importandFormatLocalStorageData("contacts");



/**
 * Create a URLSearchParams object for the current page query string.
 * @returns {URLSearchParams} The parsed query parameters.
 */
function getAddTaskParams() {
    return new URLSearchParams(window.location.search);
}


/**
 * Get the target page to return to after adding a task.
 * Falls back to `ADD_TASK_DEFAULT_RETURN` when not provided.
 * @returns {string} The return target path.
 */
function getAddTaskReturnTarget() {
    return getAddTaskParams().get("returnTo") || ADD_TASK_DEFAULT_RETURN;
}


/**
 * Read an optionally requested board category from the URL.
 * @returns {string} The requested board category or empty string.
 */
function getRequestedBoardCategory() {
    return getAddTaskParams().get("boardCategory") || "";
}


/**
 * Map the form-select category value to the internal board category key.
 * @param {string} value - The category value from the form select.
 * @returns {string} The mapped board category key.
 */
function mapFormCategoryToBoardCategory(value) {
    if (value === "user-story") return "inProgress";
    return "toDo";
}


/**
 * Convert an internal board category key to a human-readable label.
 * @param {string} category - The internal category key.
 * @returns {string} The display label for the category.
 */
function getBoardCategoryLabel(category) {
    if (category === "inProgress") return "User Story";
    if (category === "feedback") return "Awaiting Feedback";
    if (category === "done") return "Done";
    return "Technical Task";
}


/**
 * Determine the board category for the new task, preferring the URL parameter.
 * @returns {string} The chosen board category key.
 */
function getBoardCategoryFromContext() {
    const fromUrl = getRequestedBoardCategory();
    if (fromUrl) return fromUrl;
    return mapFormCategoryToBoardCategory(
        document.getElementById('category-selected').dataset.value || ''
    );
}


/**
 * Read names of contacts selected in the assigned-to dropdown.
 * @returns {string[]} Array of selected contact names.
 */
function getSelectedContactNames() {
    return Array.from(document.querySelectorAll('.dropdown__checkbox:checked')).map((checkbox) => {
        const item = checkbox.closest('.dropdown__item');
        return item.querySelector('.dropdown__name').textContent;
    });
}


/**
 * Build the `assignedTo` array in the shape used by boards.js for a task.
 * Filters local-storage contacts down to the ones selected in the form.
 * @returns {Array<{id:number,name:string,abbreviation:string}>} Assigned users array.
 */
function getAssignedUsersForBoardTask() {
    const selectedNames = getSelectedContactNames();
    return addTaskContactsLS.filter(c => selectedNames.includes(c.name)).map((contact, index) => ({
        id: Number(contact.id) || index + 1,
        name: contact.name,
        abbreviation: contact.abbreviation || getInitials(contact.name || ""),
    }));
}


/**
 * Read the active priority button and convert to board label.
 * @returns {string} One of 'Urgent', 'Medium' or 'Low'.
 */
function getBoardPriorityLabel() {
    const active = document.querySelector('.priority-buttons__btn--active');
    const value = active ? active.dataset.priority || "medium" : "medium";
    if (value === "urgent") return "Urgent";
    if (value === "low") return "Low";
    return "Medium";
}


/**
 * Collect subtasks from the UI and map them to the board subtask shape.
 * @returns {Array<{title:string,done:boolean}>} Array of subtask objects.
 */
function getBoardSubtasks() {
    return Array.from(document.querySelectorAll('.subtask-list__text')).map((span) => ({
        title: span.textContent.replace('• ', '').trim(),
        done: false,
    }));
}


/**
 * Build the complete task object ready to be saved to boards and Firebase.
 * @returns {Object} Task object with fields expected by boards.js.
 */
function buildBoardTask() {
    const category = getBoardCategoryFromContext();
    const subtasks = getBoardSubtasks();
    return {
        id: Date.now(),
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        dueDate: document.getElementById('due-date').value,
        priority: getBoardPriorityLabel(),
        category,
        selectedCategoryLabel: getBoardCategoryLabel(category),
        assignedTo: getAssignedUsersForBoardTask(),
        subtasks,
        subtask: subtasks[0] ? subtasks[0].title || '' : '',
    };
}


/**
 * Save a task representation into `localStorage` under the `boards` key.
 * Removes transient fields like `id`, `subtask` and `firebaseKey` before saving.
 * @param {Object} task - The task object to persist.
 * @returns {void}
 */
function saveBoardTaskToLocalStorage(task) {
    // Erstelle eine Kopie ohne id, subtask/sub_task und firebaseKey
    const { id, subtask, sub_task, firebaseKey, ...cleanTask } = task;
    const boards = JSON.parse(localStorage.getItem("boards") || "{}");
    // Nutze als Key z.B. den Titel und das Fälligkeitsdatum, um Kollisionen zu vermeiden
    const key = `${cleanTask.title}_${cleanTask.dueDate}`;
    boards[key] = cleanTask;
    localStorage.setItem("boards", JSON.stringify(boards));
}


/**
 * Apply optional presets from the URL to the add-task form elements.
 * For example, pre-select the category when `boardCategory` is provided.
 * @returns {void}
 */
function applyAddTaskContext() {
    const requested = getRequestedBoardCategory();
    const categorySelect = document.getElementById("category");
    if (!requested || !categorySelect) return;
    if (requested === "inProgress") categorySelect.value = "user-story";
    else categorySelect.value = "technical";
}


/**
 * Initialize add task page functionality.
 * @returns {void}
 */
function initAddTask() {
    setActivePriority();
    setMinDueDate();
    applyAddTaskContext();
    handleFormSubmit();
    addUserToTask();
    setupDropdownEvents();
    setupSubtaskEvents();
    setupCategoryDropdown();
}


/**
 * Set the default active priority button and attach click handlers.
 * @returns {void}
 */
function setActivePriority() {
    document.querySelector('.priority-buttons__btn--medium')
        .classList.add('priority-buttons__btn--active');

    document.querySelectorAll(".priority-buttons__btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".priority-buttons__btn")
                .forEach((buttons) => buttons.classList.remove("priority-buttons__btn--active"));
            btn.classList.add("priority-buttons__btn--active");
        });
    });
}


/**
 * Set the minimum allowed due date to today's date.
 * @returns {void}
 */
function setMinDueDate() {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("due-date").setAttribute("min", today);
}


/**
 * Show a temporary toast notification.
 * @returns {void}
 */
function showToast() {
    const toast = document.getElementById("add__task_toast");
    toast.classList.add('toast--visible');
    setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, 2000);
}


/**
 * Register form submit and clear button listeners.
 * @returns {void}
 */
function handleFormSubmit() {
    const form = document.querySelector(".task-form");
    const submitBtn = document.getElementById("add-task-submit-btn");
    const clearBtn = document.getElementById("add-task-clear-btn");

    submitBtn.addEventListener("click", () => handleSubmit(form));
    clearBtn.addEventListener("click", () => handleClear(form));
}


/**
 * Process the form submission, validate input, upload the task, and redirect.
 * @param {HTMLFormElement} form - The task form element.
 * @returns {Promise<void>}
 */
async function handleSubmit(form) {
    clearErrors();
    if (validateForm()) {
        disableButtons(true);
        try {
            const taskData = buildBoardTask();
            const payload = await postTaskRequestToFirebase(taskData);
            if (payload && payload.name) taskData.firebaseKey = payload.name;
            saveBoardTaskToLocalStorage(taskData);
            showToast();
            form.reset();
            setTimeout(() => {
                window.location.href = getAddTaskReturnTarget();
            }, 2000);
        } catch (error) {
            console.error('Aufgabe konnte nicht gespeichert werden:', error);
            disableButtons(false);
        }
    }
}


/**
 * Clear the form and remove any validation errors.
 * @param {HTMLFormElement} form - The task form element.
 * @returns {void}
 */
function handleClear(form) {
    form.reset();
    clearErrors();
    clearSubtaskList();
    clearSelectedUsers();
}


/**
 * Validate that all required form fields are filled.
 * @returns {boolean} True when the form is valid.
 */
function validateForm() {
    const requiredFields = document.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
        if (!field.value.trim()) {
            showError(field);
            isValid = false;
        }
    });
    if (!document.getElementById('category-selected').dataset.value) {
        document.getElementById('category-error').textContent = 'This field is required*';
        document.getElementById('category-trigger').style.borderColor = 'red';
        isValid = false;
    }

    return isValid;
}


/**
 * Display an error message for a required field.
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - The form field with an error.
 * @returns {void}
 */
function showError(field) {
    const error = document.getElementById(`${field.id}-error`);
    error.textContent = "This field is required*";
    field.style.borderColor = "red";
}


/**
 * Clear all displayed form error messages.
 * @returns {void}
 */
function clearErrors() {
    document.querySelectorAll(".task-form__error").forEach((e) => {
        e.textContent = "";
    });
    document.querySelectorAll("[required]").forEach((field) => {
        field.style.borderColor = "";
    });
    document.getElementById('category-trigger').style.borderColor = '';
}


/**
 * Return initials for a name string.
 * @param {string} name - The full name of the contact.
 * @returns {string} The generated initials.
 */
function getInitials(name) {
    if (!name) return '';
    return name.split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('');
}


/**
 * Choose an avatar color based on the contact email.
 * @param {string} email - The email of the contact.
 * @returns {string} The selected color code.
 */
function getAvatarColor(email) {
    if (!email) return avatarColors[0];
    let sum = 0;
    for (let index = 0; index < email.length; index++) {
        sum += email.charCodeAt(index);
    }
    return avatarColors[sum % avatarColors.length];
}


/**
 * Enable or disable the form action buttons.
 * @param {boolean} disabled - True to disable, false to enable.
 * @returns {void}
 */
function disableButtons(disabled) {
    document.querySelector('.task-form__btn--submit').disabled = disabled;
    document.querySelector('.task-form__btn--clear').disabled = disabled;
}