/**
 * Returns the avatar fill color from avatarColors for a given index.
 * @param {number} index - The index used to select a color from the shared avatarColors array.
 * @returns {string} A hex color string.
 */
function getAvatarFillColor(index) {
    return avatarColors[index % avatarColors.length];
}

/**
 * Builds reusable task display labels and icon symbols for a given priority.
 * @param {string} priority
 * @returns {{text: string, iconClass: string, icon: string}}
 */
function getPriorityView(priority) {
    const iconClass = getPriorityIconClass(priority || '');
    const priorityLabel = priority || '';
    let text, icon;
    if (iconClass === 'up') {
        text = 'Urgent';
        icon = 'assets/add-task/Prio alta.svg';
    } else if (iconClass === 'medium') {
        text = 'Medium';
        icon = 'assets/add-task/Prio media.svg';
    } else if (iconClass === 'down') {
        text = 'Low';
        icon = 'assets/add-task/Prio baja.svg';
    } else {
        text = 'Medium';
        icon = 'assets/add-task/Prio media.svg';
    }
    return { text, iconClass, icon };
}

/**
 * Returns assigned users as show-dialog row HTML.
 * @param {object} task
 * @returns {string}
 */
function getShowAssignedUsersHTML(task) {
    const users = Array.isArray(task.assignedTo) ? task.assignedTo : [];
    return users.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return getAssignedUserWithNameTemplate(user, fill);
    }).join('');
}

/**
 * Returns subtasks as show-dialog list HTML.
 * @param {object} task
 * @returns {string}
 */
function getShowSubtasksHTML(task) {
    const subtasks = getLimitedSubtasks(task.subtasks);
    return subtasks.map((subtask, index) => getShowSubtaskItemTemplate(subtask, task.id, index)).join('');
}

/**
 * Builds HTML strings for assigned users and subtasks in the show dialog.
 * @param {object} task
 * @returns {{assignedUsersHTML: string, subtasksHTML: string}}
 */
function buildShowTaskHTML(task) {
    return {
        assignedUsersHTML: getShowAssignedUsersHTML(task),
        subtasksHTML: getShowSubtasksHTML(task),
    };
}

/**
 * Builds view data for the task detail dialog.
 * @param {object} task
 * @returns {object}
 */
function buildShowTaskViewData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const { text, iconClass, icon } = getPriorityView(task.priority);
    const { assignedUsersHTML, subtasksHTML } = buildShowTaskHTML(task);
    return { id: task.id, title: task.title, description: task.description || '', dueDate: task.dueDate || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priorityLabel: text, iconClass, priorityIcon: icon,
        assignedUsersHTML, subtasksHTML };
}

/**
 * Builds subtask-related data for a task card.
 * @param {object} todo
 * @returns {{subtasks: Array, doneCount: number, hasSubtasks: boolean, subtaskPercent: number}}
 */
function buildTodoCardSubtaskData(todo) {
    const subtasks = getLimitedSubtasks(todo?.subtasks);
    const doneCount = subtasks.filter(subtask => Boolean(subtask.done)).length;
    const hasSubtasks = subtasks.length > 0;
    const subtaskPercent = hasSubtasks ? Math.round((doneCount / subtasks.length) * 100) : 0;
    return { subtasks, doneCount, hasSubtasks, subtaskPercent };
}

/**
 * Builds assigned users HTML for a board task card.
 * @param {object} todo
 * @returns {string}
 */
/**
 * Builds assigned users HTML for a board task card, showing max 3 avatars, no counter.
 * @param {object} todo
 * @returns {string}
 */
function getTodoAssignedUsersHTML(todo) {
    if (!Array.isArray(todo.assignedTo)) return '';
    const maxAvatars = 3;
    const users = todo.assignedTo.slice(0, maxAvatars);
    return users.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return getCircleUserTemplate(user.abbreviation || '', fill);
    }).join('');
}

/**
 * Builds template data used to render a task card.
 * @param {object} todo
 * @returns {object}
 */
function buildTodoCardTemplateData(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const { iconClass, icon } = getPriorityView(todo.priority || 'Medium');
    const { subtasks, doneCount, hasSubtasks, subtaskPercent } = buildTodoCardSubtaskData(todo);
    const nextCategory = getNextBoardCategory(todo.category);
    return { id: todo.id, title: todo.title, description: todo.description || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priorityLabel: todo.priority || 'Medium', iconClass, priorityIcon: icon,
        assignedUsersHTML: getTodoAssignedUsersHTML(todo), subtaskCountText: getSubtaskCountText(todo), subtaskPercent,
        hasSubtasks, hasCheckedSubtasks: doneCount > 0, allSubtasksDone: hasSubtasks && doneCount === subtasks.length,
        nextMoveArrow: getMoveDirectionArrow(todo.category, nextCategory), nextMoveLabel: getBoardColumnLabel(nextCategory), nextMoveDisabled: false };
}

/**
 * Builds assigned users HTML for task detail/edit sections.
 * @param {object} task
 * @returns {string}
 */
function getDetailAssignedUsersHTML(task) {
    if (!Array.isArray(task.assignedTo)) return '';
    return task.assignedTo.map((user, index) => {
        const fill = getAvatarFillColor(index);
        return `<div class="assigned-user-row">${getCircleUserTemplate(user.abbreviation || '', fill)}<span class="assigned-user-name">${user.name || ''}</span></div>`;
    }).join('');
}

/**
 * Builds subtasks list item HTML for detail/edit sections.
 * @param {Array} subtasks
 * @returns {string}
 */
function getDetailSubtasksHTML(subtasks) {
    return subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');
}

/**
 * Builds options HTML for editable task categories.
 * @param {string} fixedHeaderLabel
 * @returns {string}
 */
function getCategoryOptionsHTML(fixedHeaderLabel) {
    return ['Technical Task', 'User Story'].map(option => `<option value="${option}" ${option === fixedHeaderLabel ? 'plus Zeichen' : ''}>${option}</option>`).join('');
}

/**
 * Builds template data for the editable task form view.
 * @param {object} task
 * @returns {object}
 */
function buildEditTaskFormTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = getDetailSubtasksHTML(subtasks);
    return { id: task.id, title: task.title, description: task.description || '', dueDate: task.dueDate || '', fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel), priority: task.priority, assignedUsersHTML: getDetailAssignedUsersHTML(task),
        editSubtasksHTML: subtasksHTML, subtasksHTML, subtasks, categoryOptionsHTML: getCategoryOptionsHTML(fixedHeaderLabel) };
}
