// Initialize variables
let tasks = JSON.parse(localStorage.getItem('cybertasks')) || [];
let editingIndex = null;
let selectedPriority = 'medium';
let currentSort = 'created';
let sortDirection = 'desc';

// DOM Elements
const taskTitle = document.getElementById('task-title');
const taskCategory = document.getElementById('task-category');
const taskDate = document.getElementById('task-date');
const taskDescription = document.getElementById('task-description');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const priorityButtons = document.querySelectorAll('.priority-btn');
const sortButtons = document.querySelectorAll('.sort-btn');
const sortInfo = document.getElementById('sort-info');

// Statistics elements
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');

// Progress elements
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const completedCount = document.getElementById('completed-count');
const totalCount = document.getElementById('total-count');
const remainingCount = document.getElementById('remaining-count');

// Initialize date to today
taskDate.value = new Date().toISOString().split('T')[0];

// Set default priority
document.querySelector('.priority-btn.medium').classList.add('active');

// Priority selection
priorityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        priorityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedPriority = btn.dataset.priority;
    });
});

// Sort functionality
sortButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const sortType = btn.dataset.sort;
        
        // Toggle direction if clicking the same sort button
        if (currentSort === sortType) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort = sortType;
            sortDirection = 'desc'; // Default direction
        }
        
        // Update UI
        sortButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update sort info
        updateSortInfo();
        
        // Re-render tasks
        renderTasks(getActiveFilter());
    });
});

function updateSortInfo() {
    const directions = {
        'desc': 'Descending',
        'asc': 'Ascending'
    };
    
    const sortNames = {
        'priority': 'Priority (High → Low)',
        'deadline': 'Deadline',
        'created': 'Created Date'
    };
    
    sortInfo.textContent = `Sorted by: ${sortNames[currentSort]} (${directions[sortDirection]})`;
}

// Sort tasks function
function sortTasks(tasksArray) {
    const sortedTasks = [...tasksArray];
    
    switch(currentSort) {
        case 'priority':
            // Priority order: High > Medium > Low
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            sortedTasks.sort((a, b) => {
                const priorityA = priorityOrder[a.priority];
                const priorityB = priorityOrder[b.priority];
                return sortDirection === 'desc' ? priorityB - priorityA : priorityA - priorityB;
            });
            break;
            
        case 'deadline':
            // Sort by due date
            sortedTasks.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sortDirection === 'desc' ? dateA - dateB : dateB - dateA;
            });
            break;
            
        case 'created':
        default:
            // Sort by creation date
            sortedTasks.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
            });
            break;
    }
    
    return sortedTasks;
}

// Add/Update task
addBtn.addEventListener('click', () => {
    const title = taskTitle.value.trim();
    if (!title) {
        alert('Please enter a task title!');
        return;
    }

    const task = {
        id: Date.now(),
        title: title,
        category: taskCategory.value,
        date: taskDate.value,
        priority: selectedPriority,
        description: taskDescription.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    if (editingIndex !== null) {
        // Update existing task
        tasks[editingIndex] = task;
        editingIndex = null;
        addBtn.textContent = 'Add Task';
    } else {
        // Add new task
        tasks.push(task);
    }

    saveTasks();
    renderTasks();
    updateStats();
    updateProgress();
    clearForm();
});

// Render tasks
function renderTasks(filter = 'all') {
    taskList.innerHTML = '';
    
    let filteredTasks = tasks;
    
    // Apply filter
    switch(filter) {
        case 'pending':
            filteredTasks = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(task => task.completed);
            break;
        case 'high':
            filteredTasks = tasks.filter(task => task.priority === 'high');
            break;
        case 'today':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = tasks.filter(task => task.date === today);
            break;
    }
    
    // Apply sorting
    filteredTasks = sortTasks(filteredTasks);

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a new task to get started!</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach((task, index) => {
        const originalIndex = tasks.findIndex(t => t.id === task.id);
        const li = document.createElement('li');
        li.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
        
        // Format date
        const dateObj = new Date(task.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Check if due today
        const today = new Date().toISOString().split('T')[0];
        const dateBadge = task.date === today ? 
            `<span class="date-badge">TODAY</span>` : '';

        // Check if overdue
        const isOverdue = !task.completed && new Date(task.date) < new Date() && task.date !== today;
        const overdueBadge = isOverdue ? 
            `<span class="date-badge overdue">OVERDUE</span>` : '';

        li.innerHTML = `
            ${dateBadge}
            ${overdueBadge}
            <div class="priority-indicator"></div>
            
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-category">${task.category.toUpperCase()}</span>
            </div>
            
            <div class="task-details">
                <div class="task-detail">
                    📅 ${formattedDate}
                </div>
                <div class="task-detail">
                    ${task.completed ? '✅ Completed' : '⏳ Pending'}
                </div>
            </div>
            
            ${task.description ? `
                <div class="task-description">
                    ${task.description}
                </div>
            ` : ''}
            
            <div class="task-footer">
                <div class="task-priority">${task.priority} priority</div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" onclick="editTask(${originalIndex})">
                        ✏️ Edit
                    </button>
                    <button class="action-btn complete-btn" onclick="toggleComplete(${originalIndex})">
                        ${task.completed ? '↩️ Undo' : '✓ Complete'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${originalIndex})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
        
        taskList.appendChild(li);
    });
}

// Update progress bar
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Update numbers
    completedCount.textContent = completed;
    totalCount.textContent = total;
    remainingCount.textContent = remaining;
    
    // Update progress bar
    progressPercent.textContent = `${percentage}%`;
    progressFill.style.width = `${percentage}%`;
    
    // Change color based on percentage
    if (percentage >= 75) {
        progressFill.style.background = 'linear-gradient(90deg, #00ff00, #00ffff)';
    } else if (percentage >= 50) {
        progressFill.style.background = 'linear-gradient(90deg, #ff9900, #00ffff)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #ff3333, #00ffff)';
    }
}

// Edit task
window.editTask = function(index) {
    const task = tasks[index];
    taskTitle.value = task.title;
    taskCategory.value = task.category;
    taskDate.value = task.date;
    taskDescription.value = task.description;
    
    priorityButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.priority === task.priority) {
            btn.classList.add('active');
            selectedPriority = task.priority;
        }
    });
    
    editingIndex = index;
    addBtn.textContent = 'Update Task';
    taskTitle.focus();
};

// Toggle complete
window.toggleComplete = function(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks(getActiveFilter());
    updateStats();
    updateProgress();
};

// Delete task
window.deleteTask = function(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(getActiveFilter());
        updateStats();
        updateProgress();
    }
};

// Filter tasks
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTasks(btn.dataset.filter);
    });
});

function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = pending;
}

// Save to localStorage
function saveTasks() {
    localStorage.setItem('cybertasks', JSON.stringify(tasks));
}

// Clear form
function clearForm() {
    taskTitle.value = '';
    taskDescription.value = '';
    editingIndex = null;
    addBtn.textContent = 'Add Task';
    
    priorityButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.priority === 'medium') {
            btn.classList.add('active');
            selectedPriority = 'medium';
        }
    });
}

// Initial render
renderTasks();
updateStats();
updateProgress();
updateSortInfo();
