const BOARD_FIREBASE_BASE_URL = (typeof FIREBASE_BASE_URL === 'string' && FIREBASE_BASE_URL)
    ? FIREBASE_BASE_URL
    : "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app/";

/**
 * Checks if a response is an unauthorized error (401).
 * @param {Response} response
 * @returns {boolean}
 */
function isUnauthorizedResponse(response) {
    return response && (response.status === 401 || response.status === 403);
}

/**
 * Syncs contacts from Firebase into local storage if available.
 * @returns {Promise<void>}
 */
async function syncBoardContactsFromFirebase() {
    if (typeof syncContactsFromFirebaseToLocalStorage !== 'function') return;
    await syncContactsFromFirebaseToLocalStorage();
}

/**
 * Stores the generated Firebase key on the task and persists local state.
 * @param {object} task
 * @param {object} payload
 */
function syncPostedTaskFirebaseKey(task, payload) {
    if (!payload?.name) return;
    task.firebaseKey = payload.name;
    saveBoardsToLocalStorage();
}

/**
 * Persists a newly created task to Firebase.
 * @param {object} task
 * @returns {Promise<void>}
 */
async function postTaskToFirebase(task) {
    try {
        const payload = await postTaskRequestToFirebase(task);
        if (!payload) return;
        syncPostedTaskFirebaseKey(task, payload);
    } catch (error) {
        console.warn('Task could not be saved to Firebase:', error);
    }
}

/**
 * Resolves a Firebase key by matching a local task id against remote data.
 * @param {string|number} taskId
 * @returns {Promise<string|null>}
 */
async function resolveFirebaseKeyByTaskId(taskId) {
    try {
        if (typeof isFirebaseBoardsReadDisabled === 'function' && isFirebaseBoardsReadDisabled()) {
            return null;
        }

        const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`);
        if (isUnauthorizedResponse(response)) {
            if (typeof disableFirebaseBoardsRead === 'function') disableFirebaseBoardsRead();
            console.warn(`Firebase key resolution unauthorized (HTTP ${response.status}). Task not synced.`);
            return null;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const remoteBoards = await response.json() || {};
        const match = Object.entries(remoteBoards).find(([, item]) => String(item?.id) === String(taskId));
        return match?.[0] || null;
    } catch (error) {
        console.warn('Firebase key could not be resolved:', error);
        return null;}
}

/**
 * Persists a task category change to Firebase.
 * @param {object} task
 * @returns {Promise<void>}
 */
async function persistTaskCategoryToFirebase(task) {
    const firebaseKey = await resolveTaskFirebaseKey(task);
    if (!firebaseKey) return;
    try {
        await patchTaskCategoryToFirebase(firebaseKey, task);
        saveBoardsToLocalStorage();
    } catch (error) {
        console.warn('Task category change could not be saved to Firebase:', error);
    }
}

/**
 * Sends a category and position PATCH update for a task to Firebase.
 * @param {string} firebaseKey
 * @param {object} task
 * @returns {Promise<void>}
 */
async function patchTaskCategoryToFirebase(firebaseKey, task) {
    const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: buildCategoryPatchBody(task),
    });
    if (isUnauthorizedResponse(response)) {
        console.warn(`Firebase category update unauthorized (HTTP ${response.status}). Using local storage only.`);
        return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/**
 * Builds the JSON request body for category and position task updates.
 * @param {object} task
 * @returns {string}
 */
function buildCategoryPatchBody(task) {
    return JSON.stringify({
        category: task.category,
        position: mapCategoryToSummaryPosition(task.category || task.position),
    });
}

/**
 * Creates a standardized persistence result object.
 * @param {boolean} ok
 * @param {boolean} attempted
 * @returns {{ok: boolean, attempted: boolean}}
 */
function createPersistResult(ok, attempted) {
    return { ok, attempted };
}

/**
 * Resolves and caches a task's Firebase key.
 * @param {object} task
 * @returns {Promise<string|null>}
 */
async function resolveTaskFirebaseKey(task) {
    if (!task) return null;
    const firebaseKey = task.firebaseKey || await resolveFirebaseKeyByTaskId(task.id);
    if (!firebaseKey) return null;
    task.firebaseKey = firebaseKey;
    return firebaseKey;
}

/**
 * Sends a PATCH request to update a task in Firebase.
 * @param {string} firebaseKey - The Firebase key of the task to update.
 * @param {string} taskBody - JSON-stringified task body to send as request payload.
 * @returns {Promise<void>}
 */
async function patchTaskUpdateToFirebase(firebaseKey, taskBody) {
    const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: taskBody
    });
    if (isUnauthorizedResponse(response)) {
        console.warn(`Firebase task update unauthorized (HTTP ${response.status}). Using local storage only.`);
        return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

/**
 * Persists a full task update to Firebase and refreshes local storage on success.
 * @param {object} task - The task to persist.
 * @returns {Promise<{ok: boolean, attempted: boolean}>}
 */
async function persistTaskUpdateToFirebase(task) {
    const firebaseKey = await resolveTaskFirebaseKey(task);
    if (!firebaseKey) return createPersistResult(false, false);
    try {
        const body = buildFirebaseTaskBody(task);
        await patchTaskUpdateToFirebase(firebaseKey, body);
        saveBoardsToLocalStorage();
        return createPersistResult(true, true);
    } catch (error) {
        console.warn('Task changes could not be saved to Firebase:', error);
        return createPersistResult(false, true);
    }
}

/**
 * Builds the JSON request body representing a complete task for Firebase.
 * @param {object} task - The task to serialize.
 * @returns {string} JSON-stringified task payload.
 */
function buildFirebaseTaskBody(task) {
    return JSON.stringify({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: mapPriorityToSummaryValue(task.priority),
        position: mapCategoryToSummaryPosition(task.category || task.position),
        category: task.category || mapSummaryPositionToCategory(task.position) || 'toDo',
        selectedCategoryLabel: task.selectedCategoryLabel || categoryLabel(task.position || 'toDo'),
        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    });
}

/**
 * Sends a DELETE request for a task to Firebase.
 * @param {string} firebaseKey - The Firebase key of the task to delete.
 * @returns {Promise<{ok: boolean, attempted: boolean}>}
 */
async function sendDeleteTaskRequest(firebaseKey) {
    const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards/${firebaseKey}.json`, {
        method: 'DELETE',
    });
    if (isUnauthorizedResponse(response)) {
        console.warn(`Firebase task deletion unauthorized (HTTP ${response.status}). Using local storage only.`);
        return { ok: true, attempted: true };
    }
    return { ok: response.ok, attempted: true };
}

/**
 * Deletes a task from Firebase, resolving its Firebase key if necessary.
 * @param {object} task - The task to delete.
 * @returns {Promise<{ok: boolean, attempted: boolean}>}
 */
async function deleteTaskFromFirebase(task) {
    if (!task) return { ok: true, attempted: false };
    const firebaseKey = task.firebaseKey || await resolveFirebaseKeyByTaskId(task.id);
    if (!firebaseKey) return { ok: true, attempted: false };
    try {
        return await sendDeleteTaskRequest(firebaseKey);
    } catch (error) {
        console.warn('Task could not be deleted from Firebase:', error);
        return { ok: false, attempted: true };
    }
}

/**
 * Fetches all board tasks from Firebase.
 * @returns {Promise<object|null>} Map of Firebase key to task, or null when unauthorized.
 */
async function fetchBoardsFromFirebase() {
    if (typeof isFirebaseBoardsReadDisabled === 'function' && isFirebaseBoardsReadDisabled()) {
        return null;
    }

    const response = await fetch(`${BOARD_FIREBASE_BASE_URL}boards.json`);
    if (isUnauthorizedResponse(response)) {
        if (typeof disableFirebaseBoardsRead === 'function') disableFirebaseBoardsRead();
        console.warn(`Firebase board sync unauthorized (HTTP ${response.status}). Using local board tasks only.`);
        return null;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() || {};
}

/**
 * Normalizes the boards map fetched from Firebase and stores it in local storage.
 * @param {object} remoteBoards - Map of Firebase key to raw task.
 */
function normalizeFetchedBoards(remoteBoards) {
    const normalizedBoards = Object.entries(remoteBoards).reduce((result, [firebaseKey, task], index) => {
        const normalizedTask = normalizeBoardItem({ ...task, firebaseKey, id: task?.id || Date.now() + index }, index);
        result[firebaseKey] = normalizedTask;
        return result;
    }, {});
    localStorage.setItem("boards", JSON.stringify(normalizedBoards));
}

/**
 * Loads board tasks from Firebase and writes the normalized result into local storage.
 * @returns {Promise<void>}
 */
async function syncBoardTasksFromFirebase() {
    try {
        const remoteBoards = await fetchBoardsFromFirebase();
        if (remoteBoards) normalizeFetchedBoards(remoteBoards);
    } catch (error) {
        console.warn('Board tasks could not be loaded from Firebase:', error);
    }
}