/**
 * Shows all cards again if the search input is cleared (live reset only for empty input).
 * @param {Event} event
 */
function resetBoardOnEmptyInput(event) {
    const input = event.currentTarget;
    if ((input?.value || '').trim().length === 0) {
        updateHTML();
    }
}
/**
 * Returns the search input element from the submitted search form.
 * @param {HTMLFormElement} form
 * @returns {HTMLInputElement|null}
 */
function getSearchInputFromForm(form) {
    return form?.querySelector('input[name="search"]') || null;
}

/**
 * Normalizes the raw search input to a lowercase query string.
 * @param {HTMLInputElement} searchInput
 * @returns {string}
 */
function getNormalizedSearchQuery(searchInput) {
    return (searchInput?.value || '').trim().toLowerCase();
}

/**
 * Validates the search query and shows a SweetAlert when empty.
 * @param {string} query
 * @returns {boolean}
 */

function validateSearchQuery(query) {
    if (query) return true;
    
    Swal.fire({ icon: 'warning', title: 'Oops...', text: 'Bitte gib einen Suchbegriff ein.' });
    return false;
}

/**
 * Returns the static board column metadata used for rendering and search.
 * @returns {Array<{category: string, cardsId: string, emptyId: string}>}
 */
function getBoardColumns() {
    return [
        { category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' },
        { category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' },
        { category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' },
        { category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' },
    ];
}

/**
 * Builds the searchable text for one task.
 * @param {object} t
 * @returns {string}
 */
function getSearchTaskHaystack(t) {
    const subtaskText = (t.subtasks || []).map(s => s?.title || '').join(' ');
    return `${t.title || ''} ${t.description || ''} ${subtaskText}`;
}

/**
 * Renders one board column with cards matching the current search query.
 * @param {{category: string, cardsId: string, emptyId: string}} col
 * @param {string} query
 */
function renderSearchResultColumn({ category, cardsId, emptyId }, query) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;
    const boardList = container.closest('.board__list');
    const filtered = todos.filter(t => t.category === category && getSearchTaskHaystack(t).toLowerCase().includes(query));
    container.innerHTML = filtered.map(todo => generateTodoHTML(buildTodoCardTemplateData(todo))).join('');
    noCardElement.style.display = filtered.length > 0 ? 'none' : '';
    if (boardList) boardList.style.display = '';
}

/**
 * Renders all search result columns and reapplies board interaction bindings.
 * @param {string} query
 */
function renderSearchResults(query) {
    getBoardColumns().forEach(col => renderSearchResultColumn(col, query));
    updateTaskDraggableState();
    initializeTouchBoardDnD();
    initializeTaskMoveMenuCloseBehavior();
}

/**
 * Handles board search form submit events.
 * @param {Event} event
 */
function searchCard(event) {
    event.preventDefault();
    const searchInput = getSearchInputFromForm(event.currentTarget);
    const query = getNormalizedSearchQuery(searchInput);
    if (!validateSearchQuery(query)) return; // HIER einsetzen!
    renderSearchResults(query);
}

/**
 * Filters the board live while typing and restores the full board when emptied.
 * @param {Event} event
 */
function clearSearch(event) {
    const input = event.currentTarget;
    input?.setCustomValidity('');
    const query = (input?.value || '').trim().toLowerCase();
    if (!query) {
        updateHTML();
        return;
    }
    renderSearchResults(query);
}

/**
 * Resets the current search and restores the full board on Escape.
 * @param {KeyboardEvent} event
 */
function resetSearchOnEscape(event) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.currentTarget.value = '';
    updateHTML();
}
