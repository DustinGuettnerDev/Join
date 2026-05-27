// Helper utilities are provided globally by boards-utils.js.
let boardsLS = getFormattedLocalStorageItems("boards");
let contactsLS = getFormattedLocalStorageItems("contacts");
let defaultContacts = [];
let contacts = normalizeContacts(contactsLS, defaultContacts);
let categories = ["Technical Task", "User Story"];
let todos = normalizeBoards(boardsLS);

let suppressNextTaskClick = false;
let taskMoveMenuCloseListenerBound = false;
let boardViewportListenerBound = false;
let addTaskDialogOutsideCloseBound = false;

const BOARD_TOUCH_DND_MIN_WIDTH = 640;

const BOARD_DROP_ZONE_CATEGORY_MAP = {
    "board__list--todo": "toDo",
    "board__list--inprogress": "inProgress",
    "board__list--feedback": "feedback",
    "board__list--done": "done",
};

const BOARD_CATEGORY_FLOW = ['toDo', 'inProgress', 'feedback', 'done'];

/**
 * Initializes the board page, loads data, and renders the board.
 * @returns {Promise<void>}
 */
async function initBoardsPage() {
    await init();
    await syncBoardContactsFromFirebase();
    await syncBoardTasksFromFirebase();
    updateBoardContactsFromLocalStorage();
    updateBoardTodosFromLocalStorage();
    updateHTML();
}

/**
 * Updates the contacts list from local storage in memory.
 */
function updateBoardContactsFromLocalStorage() {
    contactsLS = getFormattedLocalStorageItems("contacts");
    contacts = normalizeContacts(contactsLS, defaultContacts);
}

/**
 * Updates the tasks list from local storage in memory.
 */
function updateBoardTodosFromLocalStorage() {
    boardsLS = getFormattedLocalStorageItems("boards");
    todos = normalizeBoards(boardsLS);
}

/**
 * Returns all board columns with their rendering targets.
 * @returns {Array<{category: string, cardsId: string, emptyId: string}>}
 */
function getBoardColumnsForRendering() {
    return [
        { category: "toDo", cardsId: "board__cards--todo", emptyId: "noneCardTodo" },
        { category: "inProgress", cardsId: "board__cards--inprogress", emptyId: "noneCardInProgress" },
        { category: "feedback", cardsId: "board__cards--feedback", emptyId: "noneCardFeedback" },
        { category: "done", cardsId: "board__cards--done", emptyId: "noneCardDone" }
    ].filter(Boolean);
}

/**
 * Initializes all board interaction handlers and UI state.
 */
function initializeBoardInteractions() {
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeBoardViewportBehavior();
    initializeTaskMoveMenuCloseBehavior();
    initializeAddTaskDialogOutsideClose();
    initializeBoardDropHighlights();
}

/**
 * Checks if a click happened outside the visible dialog box.
 * @param {MouseEvent} event
 * @param {HTMLElement} dialog
 * @returns {boolean}
 */
function isOutsideDialogBounds(event, dialog) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

/**
 * Binds outside-click closing for one dialog element.
 * @param {HTMLElement} dialog
 */
function bindDialogOutsideClose(dialog) {
    dialog.addEventListener('click', (event) => {
        if (!dialog.open || event.target !== dialog) return;
        if (!isOutsideDialogBounds(event, dialog)) return;
        closeDialog();
    });
}

/**
 * Binds closing of all board dialogs when clicking on the backdrop.
 */
function initializeAddTaskDialogOutsideClose() {
    if (addTaskDialogOutsideCloseBound) return;
    const ids = ['addTaskDialog', 'showTaskDialog', 'editTaskDialog'];
    let boundAny = false;
    ids.forEach((id) => {
        const dialog = document.getElementById(id);
        if (!dialog) return;
        bindDialogOutsideClose(dialog);
        boundAny = true;
    });
    if (boundAny) addTaskDialogOutsideCloseBound = true;
}

/**
 * Re-renders all board columns and reinitializes board interactions.
 */
function updateHTML() {
    const boardLists = Array.from(document.querySelectorAll('.board__list')).filter(Boolean);
    for (const list of boardLists) list.style.display = '';
    saveBoardsToLocalStorage();
    getBoardColumnsForRendering().forEach(col => renderCategoryContent(col));
    initializeBoardInteractions();
}

/**
 * Initializes viewport resize behavior for board interactions.
 */
function initializeBoardViewportBehavior() {
    if (boardViewportListenerBound) return;
    window.addEventListener('resize', () => {
        updateTaskDraggableState();
        if (window.innerWidth > 1010 && typeof closeAllTaskMovePanels === 'function') {
            closeAllTaskMovePanels();
        }
    });
    boardViewportListenerBound = true;
}

/**
 * Animates and closes a dialog with a given closing class.
 * @param {HTMLElement} dialog
 * @param {string} closingClass
 */
function animateAndCloseDialog(dialog, closingClass) {
    dialog.classList.add(closingClass);
    dialog.addEventListener('animationend', () => {
        dialog.classList.remove(closingClass);
        dialog.close();
        document.body.style.overflow = '';
    }, { once: true });
}

/**
 * Returns the list of board dialog descriptors used for closing.
 * @returns {Array<{el: HTMLElement|null, cls: string}>}
 */
function getBoardDialogDescriptors() {
    return [
        { el: document.getElementById("addTaskDialog"), cls: 'addTaskDialog--closing' },
        { el: document.getElementById("showTaskDialog"), cls: 'showTaskDialog--closing' },
        { el: document.getElementById("editTaskDialog"), cls: 'editTaskDialog--closing' }
    ];
}

/**
 * Closes all board-related dialogs and restores page scrolling.
 */
function closeDialog() {
    let closed = false;
    getBoardDialogDescriptors().forEach(({ el, cls }) => {
        if (el?.open) { animateAndCloseDialog(el, cls); closed = true; }
    });
    if (!closed) document.body.style.overflow = '';
}

/**
 * Renders all task cards for a single board category.
 * @param {{category: string, cardsId: string, emptyId: string}} param0
 */
function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    const isEmpty = categoryTasks.length === 0;
    container.style.display = isEmpty ? 'none' : '';
    noCardElement.style.display = isEmpty ? 'flex' : 'none';
}

/**
 * Persists the current in-memory tasks to local storage.
 */
function saveBoardsToLocalStorage() {
    const boardsObject = todos.reduce((result, todo) => {
        const key = todo.firebaseKey || todo.id;
        result[key] = buildStorageTask(todo);
        return result;
    }, {});
    localStorage.setItem("boards", JSON.stringify(boardsObject));
}

/**
 * Removes internal-only fields before persisting tasks.
 * @param {object} todo
 * @returns {object}
 */
function stripInternalTaskFields(todo) {
    const { id, firebaseKey, priorityClass, subtask, sub_task, ...cleanTodo } = todo;
    return cleanTodo;
}

/**
 * Builds a summary-compatible storage object for one task.
 * @param {object} todo
 * @returns {object}
 */
function buildStorageTask(todo) {
    const cleanTodo = stripInternalTaskFields(todo);
    return {
        ...cleanTodo,
        position: mapCategoryToSummaryPosition(todo.category || todo.position),
        dueDate: cleanTodo.dueDate || '',
        priority: mapPriorityToSummaryValue(cleanTodo.priority),
    };
}

/**
 * Returns true if the click should be suppressed because a move panel is open.
 * @param {Event} event
 * @returns {boolean}
 */
function isMovePanelClickSuppressed(event) {
    const taskCard = event.currentTarget?.closest('.task') || event.target?.closest('.task');
    if (!taskCard?.querySelector('.task-move-panel--open')) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
}

/**
 * Handles task card click behavior, including move panel suppression.
 * @param {Event} event
 * @param {string|number} taskId
 */
function handleTaskClick(event, taskId) {
    if (isMovePanelClickSuppressed(event)) return;
    if (!suppressNextTaskClick) return toDoCardShow(taskId);
    suppressNextTaskClick = false;
    event.preventDefault();
    event.stopPropagation();
}

/**
 * Updates the subtask progress preview on a rendered task card.
 * @param {string|number} taskId
 * @param {object} task
 * @param {Array} subtasks
 * @param {boolean} [removeEmptyState=false]
 */
function updateTaskCardSubtaskPreview(taskId, task, subtasks, removeEmptyState = false) {
    const card = document.getElementById(String(taskId));
    if (!card) return;
    const countEl = card.querySelector('.task__subtask-text');
    if (countEl) countEl.textContent = getSubtaskCountText(task);
    const barEl = card.querySelector('.task__progress-bar');
    if (!barEl) return;
    const total = subtasks.length, done = subtasks.filter(s => s.done).length;
    barEl.style.width = total > 0 ? `${Math.round((done / total) * 100)}%` : '0%';
    if (removeEmptyState && total === 0) barEl.style.width = '0%';
}

/**
 * Opens the task details dialog for the selected task.
 * @param {string|number} taskId
 */
// Shows the task card or reopens edit dialog if last edit was aborted
function toDoCardShow(taskId) {
    if (typeof editAborted !== 'undefined' && editAborted) {
        editAborted = false;
        if (typeof editTask === 'function') {
            editTask(taskId);
            return;
        }
    }
    const task = todos.find((t) => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById('showTaskDialog');
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildShowTaskViewData(task));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
}

/**
 * Safely reads and normalizes local storage data by key.
 * @param {string} key
 * @returns {Array}
 */
function getFormattedLocalStorageItems(key) {
    try {
        const items = importandFormatLocalStorageData(key);
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

/**
 * Merges a new task into an existing match or inserts it as a new task.
 * @param {object} newTodo
 */
function mergeOrInsertTodo(newTodo) {
    const existingTodo = todos.find(todo =>
        todo.title === newTodo.title && todo.description === newTodo.description &&
        todo.dueDate === newTodo.dueDate && todo.priority === newTodo.priority &&
        todo.category === newTodo.category);
    if (!existingTodo) return todos.push(newTodo);
    if (!Array.isArray(existingTodo.assignedTo)) existingTodo.assignedTo = [];
    newTodo.assignedTo.forEach(contact => {
        if (!existingTodo.assignedTo.some(user => user.id === contact.id))
            existingTodo.assignedTo.push(contact);
    });
}

/**
 * Deletes a task locally and remotely, then updates the UI.
 * @param {string|number} taskId
 * @returns {Promise<void>}
 */
async function deleteTask(taskId) {
    const taskIndex = todos.findIndex((t) => t.id == taskId);
    if (taskIndex === -1) return;
    const task = todos[taskIndex];
    const remoteDelete = await deleteTaskFromFirebase(task);
    if (remoteDelete.attempted && !remoteDelete.ok) {
        if (typeof showFirebaseError === 'function') {
            showFirebaseError(new Error('Karte konnte nicht in Firebase geloescht werden.'));
        }
        return;
    }
    todos.splice(taskIndex, 1);
    updateHTML();
    closeDialog();
}

/**
 * Prevent body scroll when any dialog is open
 */
function updateBodyScrollLock() {
    const dialogOpen = document.querySelector('.editTaskDialog[open], .addTaskDialog[open], .showTaskDialog[open], dialog[open]');
    if (dialogOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}