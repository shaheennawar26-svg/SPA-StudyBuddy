// State Management
let state = {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    habits: JSON.parse(localStorage.getItem('habits')) || [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    theme: localStorage.getItem('theme') || 'light'
};

// DOM Elements
const navLinks = document.querySelectorAll('#nav-menu a');
const sections = document.querySelectorAll('main section');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const quickAddForm = document.getElementById('quick-add-form');
const habitForm = document.getElementById('habit-form');
const habitsList = document.getElementById('habits-list');
const themeToggle = document.getElementById('theme-toggle');

let currentFilter = 'all'; 
let currentCategoryFilter = 'all';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setMinDate();
    checkWeekReset();
    applyTheme();
    renderTasks();
    renderHabits();
    updateDashboard();
    handleRouting();
});

function setMinDate() {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    const dateInputs = ['quick-date', 'task-date'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.setAttribute('min', todayString);
    });
}

// Routing
window.addEventListener('hashchange', handleRouting);

function handleRouting() {
    const hash = window.location.hash || '#dashboard';
    const targetId = hash.slice(1);
    
    const targetSection = document.getElementById(targetId);
    if (!targetSection) {
        window.location.hash = '#dashboard'; 
        return;
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if(link.getAttribute('href') === hash) link.classList.add('active');
    });

    sections.forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active-section');
    });
    
    targetSection.classList.remove('hidden');
    targetSection.classList.add('active-section');

    if (targetId === 'dashboard') updateDashboard();
    if (targetId === 'resources') fetchResources();
    
    document.getElementById('nav-menu').classList.remove('show');
}

document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('show');
});

// Quick Add
if (quickAddForm) {
    quickAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('quick-title').value;
        const date = document.getElementById('quick-date').value;
        
        const newTask = {
            id: Date.now(),
            title,
            description: '',
            dueDate: date,
            priority: 'Medium',
            category: 'Personal',
            completed: false
        };
        
        state.tasks.push(newTask);
        document.getElementById('quick-title').value = '';
        document.getElementById('quick-date').value = '';
        
        saveData();
        renderTasks();
        updateDashboard();
        alert('تمت الإضافة بنجاح!');
    });
}

// Tasks Logic
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idInput = document.getElementById('task-id');
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;

    if (idInput.value) {
        const task = state.tasks.find(t => t.id == idInput.value);
        if (task) {
            task.title = title;
            task.description = desc;
            task.dueDate = date;
            task.priority = priority;
            task.category = category;
        }
        document.getElementById('task-submit-btn').innerHTML = '<i class="fas fa-plus"></i> إضافة المهمة';
    } else {
        const newTask = {
            id: Date.now(),
            title,
            description: desc,
            dueDate: date,
            priority,
            category,
            completed: false
        };
        state.tasks.push(newTask);
    }

    idInput.value = '';
    taskForm.reset();
    saveData();
    renderTasks();
    updateDashboard();
});

taskList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = parseInt(btn.dataset.id);
    const action = btn.dataset.action;

    if (action === 'delete') {
        if(confirm('هل أنت متأكد من الحذف؟')) {
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveData();
            renderTasks();
            updateDashboard();
        }
    } else if (action === 'edit') {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.description || '';
            document.getElementById('task-date').value = task.dueDate;
            
            const dateInput = document.getElementById('task-date');
            dateInput.type = 'date'; 
            dateInput.value = task.dueDate;
            
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-category').value = task.category;
            
            document.getElementById('task-submit-btn').textContent = 'حفظ التعديلات';
            window.location.hash = '#tasks';
            document.getElementById('task-title').focus();
        }
    } else if (action === 'toggle') {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderTasks();
            updateDashboard();
        }
    }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.filter-btn').forEach(b => b.style.background = '');
        btn.style.background = 'var(--primary-color)';
        
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

document.getElementById('filter-category-select').addEventListener('change', (e) => {
    currentCategoryFilter = e.target.value;
    renderTasks();
});

document.getElementById('sort-tasks').addEventListener('change', renderTasks);

function renderTasks() {
    taskList.innerHTML = '';
    const sortBy = document.getElementById('sort-tasks').value;
    
    let filteredTasks = state.tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (currentCategoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentCategoryFilter);
    }

    filteredTasks.sort((a, b) => {
        if (sortBy === 'date') return new Date(a.dueDate) - new Date(b.dueDate);
        const p = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return p[b.priority] - p[a.priority]; 
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                <p>لا توجد مهام هنا. ابدأ بإضافة مهامك الجديدة!</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const formattedDate = task.dueDate.split('-').reverse().join('/');

        li.innerHTML = `
            <div style="flex: 1;">
                <h4>${task.title} <span style="font-size:0.8em; color:var(--primary-color)">(${task.category})</span></h4>
                ${task.description ? `<p style="font-size:0.85rem; color:var(--text-muted); margin: 2px 0;">${task.description}</p>` : ''}
                <small><i class="far fa-calendar"></i> ${formattedDate} | <span style="color:${getPriorityColor(task.priority)}">${task.priority}</span></small>
            </div>
            <div class="task-actions">
                <button data-action="toggle" data-id="${task.id}" class="btn-primary" title="إكمال"><i class="fas fa-check"></i></button>
                <button data-action="edit" data-id="${task.id}" class="btn-secondary" style="background:var(--warning-color); color:white" title="تعديل"><i class="fas fa-edit"></i></button>
                <button data-action="delete" data-id="${task.id}" class="btn-danger" title="حذف"><i class="fas fa-trash"></i></button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Habits Logic
habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('habit-name').value;
    const goal = document.getElementById('habit-goal').value;
    
    state.habits.push({
        id: Date.now(),
        name,
        goal: parseInt(goal),
        days: [false, false, false, false, false, false, false] 
    });
    
    habitForm.reset();
    saveData();
    renderHabits();
    updateDashboard(); 
});

function renderHabits() {
    habitsList.innerHTML = '';
    const daysLabels = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    
    if (state.habits.length === 0) {
        habitsList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-seedling" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                <p>لم تضف أي عادات بعد. ابدأ ببناء روتينك الآن!</p>
            </div>
        `;
    }
    
    let habitsAchieved = 0;
    const totalHabits = state.habits.length;

    state.habits.forEach(habit => {
        const completedCount = habit.days.filter(d => d).length;
        const isGoalMet = completedCount >= habit.goal;
        if (isGoalMet) habitsAchieved++;

        const div = document.createElement('div');
        div.className = 'habit-card';
        if (isGoalMet) div.style.border = "2px solid var(--success-color)";

        let daysHTML = '<div class="week-days">';
        daysLabels.forEach((label, index) => {
            const isChecked = habit.days[index] ? 'checked' : '';
            daysHTML += `
                <div class="day-check">
                    <input type="checkbox" id="h-${habit.id}-${index}" ${isChecked} onchange="toggleHabit(${habit.id}, ${index})">
                    <label for="h-${habit.id}-${index}">${label}</label>
                </div>
            `;
        });
        daysHTML += '</div>';

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>${habit.name}</h3>
                ${isGoalMet ? '<span style="color:var(--success-color)"><i class="fas fa-check-circle"></i> تم الهدف</span>' : ''}
            </div>
            <p style="color:var(--text-muted)">التقدم: <strong>${completedCount}</strong> / ${habit.goal} أيام</p>
            ${daysHTML}
            <button onclick="deleteHabit(${habit.id})" class="btn-danger" style="margin-top:15px; width:100%">حذف العادة</button>
        `;
        habitsList.appendChild(div);
    });

    const summaryText = document.getElementById('habits-weekly-stat');
    if (totalHabits === 0) {
        summaryText.textContent = "ابدأ بإضافة عاداتك الجديدة!";
    } else {
        summaryText.textContent = `حققت ${habitsAchieved} من أصل ${totalHabits} أهداف هذا الأسبوع.`;
    }
}

window.toggleHabit = (id, dayIndex) => {
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
        habit.days[dayIndex] = !habit.days[dayIndex];
        saveData();
        renderHabits();
        updateDashboard();
    }
};

window.deleteHabit = (id) => {
    state.habits = state.habits.filter(h => h.id !== id);
    saveData();
    renderHabits();
    updateDashboard();
};

// Resources Logic
let allResources = [];
let showFavoritesOnly = false;

async function fetchResources() {
    const container = document.getElementById('resources-container');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x"></i><br>جاري تحميل المصادر...</div>';
    
    try {
        const response = await fetch('./resources.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        allResources = data; 
        renderResourcesList();

    } catch (error) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--danger-color); padding: 20px;">
                <i class="fas fa-exclamation-triangle fa-2x"></i><br>
                <h3>فشل تحميل البيانات</h3>
                <p>تأكد من تشغيل المشروع عبر Live Server.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function renderResourcesList() {
    const container = document.getElementById('resources-container');
    const searchTerm = document.getElementById('resource-search').value.toLowerCase();
    const categoryFilter = document.getElementById('resource-category-filter').value;
    
    container.innerHTML = '';

    const filtered = allResources.filter(res => {
        const matchesSearch = res.title.toLowerCase().includes(searchTerm) || 
                              res.description.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || res.category === categoryFilter;
        const matchesFav = showFavoritesOnly ? state.favorites.includes(res.id) : true;

        return matchesSearch && matchesCategory && matchesFav;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                <p>لا توجد نتائج مطابقة لبحثك.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(res => {
        const isFav = state.favorites.includes(res.id);
        const div = document.createElement('div');
        div.className = 'resource-card';
        if (isFav) div.style.borderColor = "var(--warning-color)";

        div.innerHTML = `
            <i class="fas fa-star fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav(${res.id}, this)"></i>
            <h3>${res.title}</h3>
            <span class="badge">${res.category}</span>
            <p style="color:var(--text-muted); font-size:0.9rem; flex:1;">${res.description}</p>
            <a href="${res.link}" target="_blank" class="btn-primary" style="display:flex; justify-content:center; margin-top:15px; text-decoration:none;">زيارة الموقع</a>
        `;
        container.appendChild(div);
    });
}

document.getElementById('resource-search').addEventListener('input', renderResourcesList);
document.getElementById('resource-category-filter').addEventListener('change', renderResourcesList);

document.getElementById('show-favorites-btn').addEventListener('click', (e) => {
    showFavoritesOnly = !showFavoritesOnly;
    if (showFavoritesOnly) {
        e.target.style.background = "var(--warning-color)";
        e.target.style.color = "#fff";
        e.target.innerHTML = '<i class="fas fa-star"></i> عرض الكل';
    } else {
        e.target.style.background = ""; 
        e.target.style.color = "";
        e.target.innerHTML = '<i class="fas fa-star"></i> المفضلة فقط';
    }
    renderResourcesList();
});

window.toggleFav = (id, btn) => {
    if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(fid => fid !== id);
    } else {
        state.favorites.push(id);
    }
    saveData(); 
    renderResourcesList();
};

// Dashboard Stats
function updateDashboard() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    document.getElementById('dash-completed').textContent = completed;
    document.getElementById('dash-progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${progress}%`;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSoonCount = state.tasks.filter(t => {
        if (t.completed) return false;
        const taskDate = new Date(t.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 1; 
    }).length;

    document.getElementById('dash-due-soon').textContent = dueSoonCount;

    const goalsMetCount = state.habits.filter(habit => {
        const completedDays = habit.days.filter(d => d).length;
        return completedDays >= habit.goal;
    }).length;
    document.getElementById('dash-habit-streak').textContent = `${goalsMetCount} / ${state.habits.length}`;

    const todayList = document.getElementById('dash-today-list');
    todayList.innerHTML = '';
    
    const upcomingTasks = state.tasks.filter(t => {
        if (t.completed) return false;
        const taskDate = new Date(t.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 2; 
    });

    if (upcomingTasks.length === 0) {
        todayList.innerHTML = '<li style="text-align:center; color:var(--text-muted); padding:10px;">لا توجد مهام عاجلة. استمتع بوقتك! 🎉</li>';
    } else {
        upcomingTasks.forEach(t => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid var(--border-color)';
            
            const formattedDate = t.dueDate.split('-').reverse().join('/');

            li.innerHTML = `<i class="fas fa-angle-left" style="color:var(--primary-color)"></i> ${t.title} <span style="font-size:0.8rem; color:var(--text-muted)">(${formattedDate})</span>`;
            todayList.appendChild(li);
        });
    }
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('habits', JSON.stringify(state.habits));
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    localStorage.setItem('theme', state.theme);
    
    if (!localStorage.getItem('weekStartDate')) {
        localStorage.setItem('weekStartDate', new Date().toISOString());
    }
}

function getPriorityColor(p) {
    if(p === 'High') return 'var(--danger-color)';
    if(p === 'Medium') return 'var(--warning-color)';
    return 'var(--success-color)';
}

themeToggle.addEventListener('click', toggleTheme);
document.getElementById('setting-theme-toggle').addEventListener('change', toggleTheme);

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveData();
}

function applyTheme() {
    if (state.theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('setting-theme-toggle').checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('setting-theme-toggle').checked = false;
    }
}

document.getElementById('reset-data-btn').addEventListener('click', () => {
    if(confirm('تحذير: سيتم حذف جميع البيانات نهائياً! هل أنت متأكد؟')) {
        localStorage.clear();
        location.reload();
    }
});

function checkWeekReset() {
    const weekStartStr = localStorage.getItem('weekStartDate');
    if (!weekStartStr) {
        localStorage.setItem('weekStartDate', new Date().toISOString());
        return;
    }

    const weekStart = new Date(weekStartStr);
    const today = new Date();
    const diffTime = Math.abs(today - weekStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 7) {
        if(confirm('بداية أسبوع جديد! هل تريد تصفير سجل العادات للبدء من جديد؟')) {
            state.habits.forEach(habit => {
                habit.days = [false, false, false, false, false, false, false];
            });
            localStorage.setItem('weekStartDate', today.toISOString());
            saveData();
            renderHabits();
            updateDashboard();
        }
    }
}

