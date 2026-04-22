
let contacts = [
    { id: 1, name: 'David G.', abbreviation: 'DG' },
    { id: 2, name: 'Anna S.', abbreviation: 'AS' },
    { id: 3, name: 'John D.', abbreviation: 'JD' },
];

let categories = ['Technical Task', 'User Story'];

let todos = [];

let currentDraggedElement;

function allowDrop(event) {
    event.preventDefault();
}
function drag(event) {
    const taskElement = event.target.closest('.task');
    if (!taskElement) return;
    currentDraggedElement = taskElement;
    event.dataTransfer.setData('text/plain', String(taskElement.id));
}

function getLimitedSubtasks(input) {
    const source = Array.isArray(input) ? input : [input];

    return source
        .map(item => typeof item === 'string' ? { title: item, done: false } : item)
        .map(item => ({
            title: (item?.title || '').trim(),
            done: Boolean(item?.done),
        }))
        .filter(item => item.title)
        .slice(0, 2);
}

function getSubtaskCountText(todo) {
    const count = getLimitedSubtasks(todo?.subtasks).length;
    return `${count} / 2`;
}

function renderEditSubtaskItems(list, subtasks) {
    list.querySelectorAll('.subtask-item').forEach(item => item.remove());
    const editButton = list.querySelector('.edit-subtask-btn');
    if (!editButton) return;

    editButton.insertAdjacentHTML('beforebegin', subtasks.map((subtask, index) => `
        <li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>
    `).join(''));
}

function handleNewSubtaskInputKey(event, taskId) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addNewSubtask(taskId);
}

function addNewSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;

    const input = dialog.querySelector('#new-subtask-input');
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    const list = dialog.querySelector('.subtask-list');
    if (!input || !hiddenInput || !list) return;

    const title = input.value.trim();
    if (!title) return;

    const currentSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));
    if (currentSubtasks.length >= 2) {
        input.value = '';
        return;
    }

    const updatedSubtasks = getLimitedSubtasks([...currentSubtasks, { title, done: false }]);
    hiddenInput.value = JSON.stringify(updatedSubtasks);
    renderEditSubtaskItems(list, updatedSubtasks);
    input.value = '';

    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || '';
    updateHTML();
}

function editSubtask(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;

    const button = dialog.querySelector('.edit-subtask-btn');
    const list = dialog.querySelector('.subtask-list');
    const hiddenInput = dialog.querySelector('#edit-subtasks-data');
    if (!button || !list || !hiddenInput) return;

    const isSaveMode = button.dataset.mode === 'save';
    const savedSubtasks = getLimitedSubtasks(JSON.parse(hiddenInput.value || '[]'));

    if (!isSaveMode) {
        const currentTitle = savedSubtasks[0]?.title || '';
        const currentDone = Boolean(savedSubtasks[0]?.done);
        list.querySelectorAll('.subtask-item').forEach(item => item.remove());
        button.insertAdjacentHTML('beforebegin', `<li class="subtask-item"><input class="task-form__input" id="edit-subtask-input" type="text" value="${currentTitle}"></li>`);
        button.innerHTML = '&#10003;';
        button.dataset.mode = 'save';
        hiddenInput.value = JSON.stringify([{ title: currentTitle, done: currentDone }]);
        return;
    }

    const editedValue = dialog.querySelector('#edit-subtask-input')?.value.trim() || '';
    const doneState = Boolean(savedSubtasks[0]?.done);
    const updatedSubtasks = getLimitedSubtasks(editedValue ? [{ title: editedValue, done: doneState }] : []);

    hiddenInput.value = JSON.stringify(updatedSubtasks);
    renderEditSubtaskItems(list, updatedSubtasks);
    button.innerHTML = '&#9998;';
    button.dataset.mode = 'edit';

    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || '';
    updateHTML();
}

function clearSubtasks(taskId) {
    const dialog = document.getElementById('editTaskDialog');
    const list = dialog?.querySelector('.subtask-list');
    const hiddenInput = dialog?.querySelector('#edit-subtasks-data');
    if (list) {
        renderEditSubtaskItems(list, []);
    }
    if (hiddenInput) {
        hiddenInput.value = '[]';
    }

    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    task.subtasks = [];
    task.subtask = '';
    updateHTML();
}

function toggleAllSubtasks(checkbox) {
    const dialog = document.getElementById('editTaskDialog');
    const taskId = Number(dialog?.dataset?.taskId);
    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    const subtasks = getLimitedSubtasks(task.subtasks).map(subtask => ({
        ...subtask,
        done: Boolean(checkbox?.checked),
    }));

    task.subtasks = subtasks;
    updateHTML();
}

function moveTaskToCategory(taskId, targetCategory) {
    if (!targetCategory) return;
    const taskIndex = todos.findIndex(todo => todo.id == taskId);
    if (taskIndex !== -1) {
        todos[taskIndex].category = targetCategory;
        updateHTML();
    }
}

function drop(event) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain') || currentDraggedElement?.id;
    const dropZoneId = event.currentTarget.id;
    const categoryMap = {
        'board__list--todo': 'toDo',
        'board__list--inprogress': 'inProgress',
        'board__list--feedback': 'feedback',
        'board__list--done': 'done'
    };
    const targetCategory = categoryMap[dropZoneId];
    moveTaskToCategory(taskId, targetCategory);
}

function moveTo(event) {
    const targetCategory = event.currentTarget.dataset.category;
    moveTaskToCategory(event.target.id, targetCategory);
}

function renderCategoryContent({ category, cardsId, emptyId }) {
    const container = document.getElementById(cardsId);
    const noCardElement = document.getElementById(emptyId);
    if (!container || !noCardElement) return;

    const categoryTasks = todos.filter(todo => todo.category === category);
    container.innerHTML = categoryTasks
        .map(todo => generateTodoHTML(buildTodoCardTemplateData(todo)))
        .join('');
    noCardElement.style.display = categoryTasks.length === 0 ? 'flex' : 'none';
}

function buildTodoCardTemplateData(todo) {
    const fixedHeaderLabel = todo.selectedCategoryLabel || categoryLabel(todo.category);
    const priorityLabel = todo.priority || 'Medium';
    const iconClass = getPriorityIconClass(priorityLabel);

    return {
        id: todo.id,
        title: todo.title,
        description: todo.description || '',
        fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel),
        priorityLabel,
        iconClass,
        priorityIcon: iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖',
        assignedUsersHTML: Array.isArray(todo.assignedTo)
            ? todo.assignedTo.map(user => getCircleUserTemplate(user.abbreviation || '')).join('')
            : '',
        subtaskCountText: getSubtaskCountText(todo),
    };
}

function buildEditTaskFormTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const categoryOptions = ['Technical Task', 'User Story'];
    const subtasks = getLimitedSubtasks(task.subtasks);

    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        priority: task.priority,
        assignedUsersHTML: Array.isArray(task.assignedTo)
            ? task.assignedTo.map(user => getCircleUserTemplate(user.abbreviation || '')).join('')
            : '',
        editSubtasksHTML: subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join(''),
        subtasksHTML: subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join(''),
        subtasks,
        categoryOptionsHTML: categoryOptions.map(option => {
            const selected = option === fixedHeaderLabel ? 'selected' : '';
            return `<option value="${option}" ${selected}>${option}</option>`;
        }).join(''),
    };
}

function buildEditTaskDetailTemplateData(task) {
    const fixedHeaderLabel = task.selectedCategoryLabel || categoryLabel(task.category);
    const priorityLabel = task.priority || '';
    const iconClass = getPriorityIconClass(priorityLabel);
    const priorityIcon = iconClass === 'up' ? '⟪' : iconClass === 'down' ? '⟫' : '‖';
    const priorityText = priorityLabel === '⟪' ? 'Urgent'
        : priorityLabel === '‖' ? 'Medium'
            : priorityLabel === '⟫' ? 'Low'
                : (priorityLabel || 'Medium');
    const subtasks = getLimitedSubtasks(task.subtasks);
    const subtasksHTML = subtasks.map((subtask, index) => `<li class="subtask-item" data-subtask-index="${index}">${subtask.title}</li>`).join('');

    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || '',
        fixedHeaderLabel,
        headerClass: getCategoryHeaderClass(fixedHeaderLabel),
        assignedUsersHTML: Array.isArray(task.assignedTo)
            ? task.assignedTo.map(user => getCircleUserTemplate(user.abbreviation || '')).join('')
            : '',
        subtaskCountText: getSubtaskCountText(task),
        firstSubtaskDone: Boolean(subtasks[0]?.done),
        firstSubtaskTitle: subtasks[0]?.title || '',
        subtasksListHTML: subtasksHTML,
        subtasksHTML,
        subtasks,
        priorityLabel: priorityText,
        iconClass,
        priorityIcon,
    };
}

function updateHTML() {
    renderCategoryContent({ category: 'toDo', cardsId: 'board__cards--todo', emptyId: 'noneCardTodo' });
    renderCategoryContent({ category: 'inProgress', cardsId: 'board__cards--inprogress', emptyId: 'noneCardInProgress' });
    renderCategoryContent({ category: 'feedback', cardsId: 'board__cards--feedback', emptyId: 'noneCardFeedback' });
    renderCategoryContent({ category: 'done', cardsId: 'board__cards--done', emptyId: 'noneCardDone' });
}

//DRAG AND DROP ENDE
function addTask(category) {
    const dialog = document.getElementById("addTaskDialog");
    dialog.dataset.category = category || '';
    renderDialogContent();
    dialog.showModal();
}
function addTaskToDo() {
    addTask('toDo');
}
function addTaskInProgress() {
    addTask('inProgress');
}
function addTaskFeedback() {
    addTask('feedback');
}
function addTaskDone() {
    addTask('done');
}

function closeDialog() {
    const addTaskDialog = document.getElementById("addTaskDialog");
    const editTaskDialog = document.getElementById("editTaskDialog");

    if (addTaskDialog?.open) {
        addTaskDialog.close();
    }

    if (editTaskDialog?.open) {
        editTaskDialog.close();
    }
}
function categoryLabel(category) {
    if (category === 'toDo') return 'Technical Task';
    else if (category === 'inProgress') return 'User Story';
    else if (category === 'feedback') return 'Awaiting Feedback';
    else if (category === 'done') return 'Done';
    else return '';
}

function renderDialogContent() {
    const dialog = document.getElementById("addTaskDialog");
    dialog.innerHTML = getaddTaskTemplateDialog();
    // Event-Listener für das Formular hinzufügen
    const form = dialog.querySelector('.task-form');
    if (form) {
        form.addEventListener('submit', handleCreateTask);
    }
    // Cancel-Button leert das Formular und schließt den Dialog
    const cancelBtn = dialog.querySelector('#cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            form.reset();
        });
    }

    setupAssignedToMultiselect(dialog);
    // Kategorien dynamisch einfügen
    const categorySelect = dialog.querySelector('#category');
    if (categorySelect) {
        categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    // Prioritäts-Button-Listener setzen
    const priorityurgent = document.getElementById('priority-urgent');
    const priorityMedium = document.getElementById('priority-medium');
    const priorityLow = document.getElementById('priority-low');
    priorityurgent.classList.remove('priority-buttons__btn--urgent');
    priorityMedium.classList.remove('priority-buttons__btn--medium');
    priorityLow.classList.remove('priority-buttons__btn--low');
    if (priorityurgent) {

        priorityurgent.addEventListener('click', () => {
            priorityurgent.classList.toggle('priority-buttons__btn--urgent');
            priorityMedium.classList.remove('priority-buttons__btn--medium');
            priorityLow.classList.remove('priority-buttons__btn--low');
        });
    }
    if (priorityMedium) {

        priorityMedium.addEventListener('click', () => {
            priorityMedium.classList.toggle('priority-buttons__btn--medium');
            priorityurgent.classList.remove('priority-buttons__btn--urgent');
            priorityLow.classList.remove('priority-buttons__btn--low');
        });
    }
    if (priorityLow) {
        priorityLow.addEventListener('click', () => {
            priorityLow.classList.toggle('priority-buttons__btn--low');
            priorityurgent.classList.remove('priority-buttons__btn--urgent');
            priorityMedium.classList.remove('priority-buttons__btn--medium');
        });
    }
}

function setupAssignedToMultiselect(dialog, config = {}) {
    const {
        triggerId = 'assigned-to-trigger',
        checkboxContainerId = 'assigned-to-checkboxes',
        summaryId = 'assigned-to-summary',
        wrapperId = 'assigned-to-multiselect',
        optionIdPrefix = 'assigned-to',
        preselectedIds = [],
    } = config;

    const trigger = dialog.querySelector(`#${triggerId}`);
    const checkboxContainer = dialog.querySelector(`#${checkboxContainerId}`);
    const summary = dialog.querySelector(`#${summaryId}`);
    if (!trigger || !checkboxContainer || !summary) return;

    checkboxContainer.innerHTML = contacts.map(contact => `
        <label for="${optionIdPrefix}-${contact.id}">
            <input type="checkbox" id="${optionIdPrefix}-${contact.id}" value="${contact.id}" ${preselectedIds.includes(contact.id) ? 'checked' : ''}> ${contact.name}
        </label>
    `).join('');

    const setSummary = () => {
        const selectedNames = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.parentElement?.textContent?.trim())
            .filter(Boolean);
        summary.textContent = selectedNames.length > 0 ? selectedNames.join(', ') : 'Select contacts to assign';
    };

    checkboxContainer.removeAttribute('hidden');

    const openDropdown = () => {
        checkboxContainer.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
        checkboxContainer.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    };

    const toggle = (event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const isOpen = checkboxContainer.classList.contains('is-open');
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            toggle(event);
        }
    });

    checkboxContainer.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', setSummary);
    });

    dialog.addEventListener('click', (event) => {
        const wrapper = dialog.querySelector(`#${wrapperId}`);
        if (!wrapper) return;
        if (!wrapper.contains(event.target)) {
            closeDropdown();
        }
    });

    closeDropdown();
    setSummary();
}

// Liest die Formulardaten aus und erstellt ein neues Todo
function handleCreateTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("addTaskDialog");
    const title = dialog.querySelector('#title').value.trim();
    const description = dialog.querySelector('#description').value.trim();
    const dueDate = dialog.querySelector('#due-date').value;
    const priority = getSelectedPriority(dialog);
    const assignedToCheckboxes = dialog.querySelectorAll('#assigned-to-checkboxes input[type="checkbox"]:checked');
    const selectedIds = Array.from(assignedToCheckboxes)
        .map(checkbox => Number(checkbox.value))
        .filter(id => Number.isFinite(id));
    const assignedTo = contacts.filter(contact => selectedIds.includes(contact.id));
    const categoryValue = dialog.querySelector('#category').value;
    const selectedCategoryLabel = categoryValue || 'Technical Task';
    const presetCategory = dialog.dataset.category;
    // Wenn über Spalten-Button geöffnet, bleibt die Zielspalte fix.
    // Nur beim globalen "Add Task +" (ohne preset) wird aus dem Select gemappt.
    let category = 'toDo';
    if (presetCategory) {
        category = presetCategory;
    } else if (categoryValue === 'Technical Task') {
        category = 'toDo';
    } else if (categoryValue === 'User Story') {
        category = 'inProgress';
    }
    const subtaskInput = dialog.querySelector('#subtask-input')?.value || '';
    const subtasks = getLimitedSubtasks(subtaskInput);
    const subtask = subtasks[0]?.title || '';
    // Neues Todo-Objekt
    const newTodo = {
        id: Date.now(),
        title,
        description,
        dueDate,
        priority,
        priorityClass: getPriorityIconClass(priority),
        assignedTo,
        category,
        selectedCategoryLabel,
        subtasks,
        subtask,
    };

    const existingTodo = todos.find(todo =>
        todo.title === newTodo.title &&
        todo.description === newTodo.description &&
        todo.dueDate === newTodo.dueDate &&
        todo.priority === newTodo.priority &&
        todo.category === newTodo.category
    );

    if (existingTodo) {
        if (!Array.isArray(existingTodo.assignedTo)) {
            existingTodo.assignedTo = [];
        }

        assignedTo.forEach(contact => {
            const alreadyAssigned = existingTodo.assignedTo.some(user => user.id === contact.id);
            if (!alreadyAssigned) {
                existingTodo.assignedTo.push(contact);
            }
        });
    } else {
        todos.push(newTodo);
    }

    updateHTML();
    closeDialog();
}

function getSelectedPriority(dialog) {
    const priorityUrgent = dialog.querySelector('#priority-urgent');
    const priorityMedium = dialog.querySelector('#priority-medium');
    const priorityLow = dialog.querySelector('#priority-low');
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return 'None';
    }
    if (priorityUrgent.classList.contains('priority-buttons__btn--urgent')) {
        return '⟪';
    } else if (priorityMedium.classList.contains('priority-buttons__btn--medium')) {
        return '‖';
    } else if (priorityLow.classList.contains('priority-buttons__btn--low')) {
        return '⟫';
    } else {
        return 'None';
    }
}

function getPriorityIconClass(priority) {
    if (priority === 'Urgent' || priority === '⟪') return 'up';
    if (priority === 'Medium' || priority === '‖') return 'medium';
    if (priority === 'Low' || priority === '⟫') return 'down';
    return 'medium';
}

function getCategoryHeaderClass(label) {
    if (label === 'Technical Task') return 'TechnicalTask';
    if (label === 'User Story') return 'UserStory';
    return '';
}

function toDoCardShow(taskId) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getShowTaskTemplate(buildEditTaskDetailTemplateData(task));
    dialog.showModal();
}

function editTask(taskId) {
    const task = todos.find(t => t.id == taskId);
    if (!task) return;
    const dialog = document.getElementById("editTaskDialog");
    dialog.dataset.taskId = taskId;
    dialog.innerHTML = getEditTaskFormTemplate(buildEditTaskFormTemplateData(task));

    setupAssignedToMultiselect(dialog, {
        triggerId: 'edit-assigned-to-trigger',
        checkboxContainerId: 'edit-assigned-to-checkboxes',
        summaryId: 'edit-assigned-to-summary',
        wrapperId: 'edit-assigned-to-multiselect',
        optionIdPrefix: 'edit-assigned-to',
        preselectedIds: Array.isArray(task.assignedTo) ? task.assignedTo.map(user => user.id) : [],
    });

    const editForm = dialog.querySelector('.edit-task-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditTaskSave);
    }

    if (!dialog.open) {
        dialog.showModal();
    }
}

function mapCategoryLabelToKey(label) {
    if (label === 'Technical Task') return 'toDo';
    if (label === 'User Story') return 'inProgress';
    if (label === 'Awaiting Feedback') return 'feedback';
    if (label === 'Done') return 'done';
    return 'toDo';
}
function getSelectedEditPriority(dialog) {
    const priorityUrgent = dialog.querySelector('#edit-priority-urgent');
    const priorityMedium = dialog.querySelector('#edit-priority-medium');
    const priorityLow = dialog.querySelector('#edit-priority-low');
    if (!priorityUrgent || !priorityMedium || !priorityLow) {
        return 'Medium';
    }

    if (priorityUrgent.classList.contains('priority-buttons__btn--urgent')) {
        return 'Urgent';
    }

    if (priorityMedium.classList.contains('priority-buttons__btn--medium')) {
        return 'Medium';
    }

    if (priorityLow.classList.contains('priority-buttons__btn--low')) {
        return 'Low';
    }

    return 'Medium';
}

function handleEditTaskSave(event) {
    event.preventDefault();

    const dialog = document.getElementById("editTaskDialog");
    const taskId = Number(dialog.dataset.taskId);
    const task = todos.find(t => t.id == taskId);
    if (!task) return;

    const updatedTitle = dialog.querySelector('#edit-title')?.value.trim() || '';
    const updatedDescription = dialog.querySelector('#edit-description')?.value.trim() || '';
    const updatedDueDate = dialog.querySelector('#edit-due-date')?.value || '';
    const updatedPriority = getSelectedEditPriority(dialog);
    const updatedCategoryLabel = dialog.querySelector('#edit-category')?.value || 'Technical Task';
    const updatedAssignedIds = Array.from(dialog.querySelectorAll('#edit-assigned-to-checkboxes input[type="checkbox"]:checked'))
        .map(checkbox => Number(checkbox.value))
        .filter(id => Number.isFinite(id));
    const updatedSubtasks = getLimitedSubtasks(JSON.parse(dialog.querySelector('#edit-subtasks-data')?.value || '[]'));

    task.title = updatedTitle;
    task.description = updatedDescription;
    task.dueDate = updatedDueDate;
    task.priority = updatedPriority;
    task.priorityClass = getPriorityIconClass(updatedPriority);
    task.selectedCategoryLabel = updatedCategoryLabel;
    task.category = mapCategoryLabelToKey(updatedCategoryLabel);
    task.assignedTo = contacts.filter(contact => updatedAssignedIds.includes(contact.id));
    task.subtasks = updatedSubtasks;
    task.subtask = updatedSubtasks[0]?.title || '';

    updateHTML();
    closeDialog();
    toDoCardShow(taskId);
}

function setEditPriority(priority) {
    const dialog = document.getElementById('editTaskDialog');
    if (!dialog) return;

    const urgentBtn = dialog.querySelector('#edit-priority-urgent');
    const mediumBtn = dialog.querySelector('#edit-priority-medium');
    const lowBtn = dialog.querySelector('#edit-priority-low');
    if (!urgentBtn || !mediumBtn || !lowBtn) return;

    urgentBtn.classList.remove('priority-buttons__btn--urgent');
    mediumBtn.classList.remove('priority-buttons__btn--medium');
    lowBtn.classList.remove('priority-buttons__btn--low');

    if (priority === 'Urgent') {
        urgentBtn.classList.add('priority-buttons__btn--urgent');
    } else if (priority === 'Medium') {
        mediumBtn.classList.add('priority-buttons__btn--medium');
    } else if (priority === 'Low') {
        lowBtn.classList.add('priority-buttons__btn--low');
    }
}

function deleteTask(taskId) {
    const taskIndex = todos.findIndex(t => t.id == taskId);
    if (taskIndex !== -1) {
        todos.splice(taskIndex, 1);
        updateHTML();
        closeDialog();
    }
}



