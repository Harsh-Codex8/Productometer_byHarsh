document.addEventListener('DOMContentLoaded', () => {
    // Structural Layout Nodes Mapping Framework
    const mainTimeline = document.getElementById('mainTimeline');
    const capsules = document.querySelectorAll('.activity-capsule');
    const gaugeCanvas = document.getElementById('gaugeCanvas');
    const trendGraphCanvas = document.getElementById('trendGraphCanvas');
    const weeklyCanvas = document.getElementById('weeklyGraphCanvas');
    const gaugeValue = document.getElementById('gaugeValue');
    
    // Core Command Buttons Selectors Mapping
    const newDayBtn = document.getElementById('newDayBtn');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const todoItemsBucket = document.getElementById('todoItemsBucket');

    // Menu Drawer Elements Selector
    const addTaskTriggerRow = document.getElementById('addTaskTriggerRow');
    const taskSubmenuWrapper = document.getElementById('taskSubmenuWrapper');

    // --- GRAPHICAL DYNAMIC FLOATING POPUP OVERLAYS SYSTEM HANDLES ---
    const customTaskModal = document.getElementById('customTaskModal');
    const customTaskTitleInput = document.getElementById('customTaskTitleInput');
    const taskCancelBtn = document.getElementById('taskCancelBtn');
    const taskConfirmBtn = document.getElementById('taskConfirmBtn');

    const resetConfirmModal = document.getElementById('resetConfirmModal');
    const resetCancelBtn = document.getElementById('resetCancelBtn');
    const resetConfirmBtn = document.getElementById('resetConfirmBtn');

    const saveNotifyModal = document.getElementById('saveNotifyModal');
    const saveCloseBtn = document.getElementById('saveCloseBtn');

    // Global Interactive Component Operating Filters
    let selectedActivity = null;
    let isSliding = false;
    let currentSelectedCategoryType = 'academics'; 

    // --- AUTO-SAVE HARD RUNTIME LOCALSTORAGE INITIALIZATIONS ---
    const savedTimeline = localStorage.getItem('productometer_timeline');
    const timelineData = savedTimeline ? JSON.parse(savedTimeline) : Array(48).fill(null);

    const savedTodoList = localStorage.getItem('productometer_slider_free_todolist');
    let todoListData = savedTodoList ? JSON.parse(savedTodoList) : [];

    const savedWeeklyHistory = localStorage.getItem('productometer_weekly_history');
    const weeklyHistoryData = savedWeeklyHistory ? JSON.parse(savedWeeklyHistory) : [
        { day: 'MON', score: 0 }, { day: 'TUE', score: 0 }, { day: 'WED', score: 0 },
        { day: 'THU', score: 0 }, { day: 'FRI', score: 0 }, { day: 'SAT', score: 0 }, { day: 'SUN', score: 0 }
    ];

    const activityColors = {
        academics: '#00e5ff', health: '#00e676', skills: '#ffb300',
        screen: '#ff1744', school: '#ff00ea', sleep: '#3d5afe',
        other: '#78909c', eraser: 'transparent'
    };

    const gCtx = gaugeCanvas ? gaugeCanvas.getContext('2d') : null;
    const tCtx = trendGraphCanvas ? trendGraphCanvas.getContext('2d') : null;
    const wCtx = weeklyCanvas ? weeklyCanvas.getContext('2d') : null;

    // Bootstrap baseline visualization rendering pathways loops
    initializeMainTimelineTrack();
    initializeSliderFreeMenuEngine();
    renderTodoListChecklistGrid();
    updateDashboardMetrics();

    window.addEventListener('mouseup', () => { isSliding = false; });

    // Instantiates the 24-Hour Timeline Grid Blocks (48 slots total, each = 30 mins)
    function initializeMainTimelineTrack() {
        if (!mainTimeline) return;
        mainTimeline.innerHTML = ""; 
        for (let i = 0; i < 48; i++) {
            const division = document.createElement('div');
            division.classList.add('timeline-division'); division.dataset.index = i;
            if (timelineData[i]) {
                division.style.backgroundColor = activityColors[timelineData[i]];
                division.style.boxShadow = `0 0 10px ${activityColors[timelineData[i]]}`;
            }
            division.addEventListener('mousedown', (e) => { e.preventDefault(); isSliding = true; paintMainTimelineSlot(division); });
            division.addEventListener('mouseenter', () => { if (isSliding) slidePaintMainTimelineSlot(division); });
            mainTimeline.appendChild(division);
        }
    }
    // Single node tap track mapping functions
    function paintMainTimelineSlot(division) {
        if (!selectedActivity) return;
        const i = parseInt(division.dataset.index);
        if (selectedActivity === 'eraser') {
            timelineData[i] = null; division.style.backgroundColor = 'transparent'; division.style.boxShadow = 'none';
        } else {
            if (timelineData[i] === selectedActivity) {
                timelineData[i] = null; division.style.backgroundColor = 'transparent'; division.style.boxShadow = 'none';
            } else {
                timelineData[i] = selectedActivity;
                division.style.backgroundColor = activityColors[selectedActivity]; division.style.boxShadow = `0 0 10px ${activityColors[selectedActivity]}`;
            }
        }
        localStorage.setItem('productometer_timeline', JSON.stringify(timelineData));
        updateDashboardMetrics();
    }

    // Swiping brush drag tracker vectors
    function slidePaintMainTimelineSlot(division) {
        if (!selectedActivity) return;
        const i = parseInt(division.dataset.index);
        if (selectedActivity === 'eraser') {
            if (timelineData[i] !== null) {
                timelineData[i] = null; division.style.backgroundColor = 'transparent'; division.style.boxShadow = 'none';
                localStorage.setItem('productometer_timeline', JSON.stringify(timelineData));
                updateDashboardMetrics();
            }
        } else {
            if (timelineData[i] !== selectedActivity) {
                timelineData[i] = selectedActivity;
                division.style.backgroundColor = activityColors[selectedActivity]; division.style.boxShadow = `0 0 10px ${activityColors[selectedActivity]}`;
                localStorage.setItem('productometer_timeline', JSON.stringify(timelineData));
                updateDashboardMetrics();
            }
        }
    }

    // 📱 MOBILE TOUCH FIX: Cross-platform thumb drag coordination handlers
    if (mainTimeline) {
        mainTimeline.addEventListener('touchstart', (e) => {
            if (!selectedActivity) return; isSliding = true;
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('timeline-division')) paintMainTimelineSlot(element);
        }, { passive: false });
        mainTimeline.addEventListener('touchmove', (e) => {
            if (!isSliding || !selectedActivity) return; e.preventDefault(); 
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('timeline-division')) slidePaintMainTimelineSlot(element);
        }, { passive: false });
        mainTimeline.addEventListener('touchend', () => { isSliding = false; });
    }

    // Handles capsule selections for bottom grid widgets
    capsules.forEach(capsule => {
        capsule.addEventListener('click', () => {
            const targetActivity = capsule.dataset.activity;
            if (capsule.classList.contains('active')) {
                capsule.classList.remove('active'); selectedActivity = null;
            } else {
                capsules.forEach(c => c.classList.remove('active')); capsule.classList.add('active'); selectedActivity = targetActivity;
            }
        });
    });
    // 2. High-Performance Failsafe Slider-Free Option Tab Navigation Matrix Engine
    function initializeSliderFreeMenuEngine() {
        if (addTaskTriggerRow && taskSubmenuWrapper) {
            addTaskTriggerRow.addEventListener('click', () => { taskSubmenuWrapper.classList.toggle('hidden'); });
        }

        const categorySelectionCapsules = document.querySelectorAll('.type-tab-btn');
        const taskDescriptionInput = document.getElementById('taskDescriptionInput');

        categorySelectionCapsules.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetKey = tab.dataset.type || tab.textContent.trim().toLowerCase();
                if (!['academics', 'skills', 'health'].includes(targetKey)) return;

                currentSelectedCategoryType = targetKey;
                categorySelectionCapsules.forEach(c => c.classList.remove('active')); tab.classList.add('active');

                document.querySelectorAll('.sub-buttons-row').forEach(row => { row.classList.add('hidden'); row.style.display = 'none'; });
                const targetGridRow = document.getElementById(`options-${targetKey}`);
                if (targetGridRow) { targetGridRow.classList.remove('hidden'); targetGridRow.style.display = 'flex'; }
            });
        });

        // Event listener hooks capturing preset selections
        document.querySelectorAll('.sub-buttons-row button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                const selectedTaskLabel = btn.dataset.task || btn.textContent.trim();
                
                if (btn.classList.contains('custom-task-btn') || selectedTaskLabel.toLowerCase().includes('custom')) {
                    // --- 🌟 TRIGGER GLASSMORPHIC POPUP GRAPHICAL MODAL OVERLAY ---
                    if (customTaskModal && customTaskTitleInput) {
                        customTaskTitleInput.value = ""; 
                        customTaskModal.classList.remove('hidden');
                        customTaskTitleInput.focus();
                    }
                } else {
                    const optionalDescription = taskDescriptionInput ? taskDescriptionInput.value.trim() : "";
                    createNewTaskChecklistItemNode(selectedTaskLabel, currentSelectedCategoryType, optionalDescription);
                }
                if (taskDescriptionInput) taskDescriptionInput.value = ""; 
            });
        });

        // Connect action button paths inside custom modal frames
        if (taskConfirmBtn && customTaskTitleInput) {
            taskConfirmBtn.addEventListener('click', () => {
                const customLabel = customTaskTitleInput.value.trim();
                if (!customLabel) return;
                
                const optionalDescription = taskDescriptionInput ? taskDescriptionInput.value.trim() : "";
                createNewTaskChecklistItemNode(customLabel, currentSelectedCategoryType, optionalDescription);
                
                customTaskModal.classList.add('hidden');
                customTaskTitleInput.value = "";
            });
        }
        if (taskCancelBtn) { taskCancelBtn.addEventListener('click', () => { customTaskModal.classList.add('hidden'); }); }
    }

    function createNewTaskChecklistItemNode(title, category, customDescription) {
        const newTaskObject = {
            id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 100),
            title: title, category: category,
            description: customDescription || `Target objective planned for your daily ${category} roadmap.`,
            completed: false
        };
        todoListData.push(newTaskObject); localStorage.setItem('productometer_slider_free_todolist', JSON.stringify(todoListData));
        renderTodoListChecklistGrid(); updateDashboardMetrics();
    }
    // 3. Render HTML To-Do List Checklist cards live inside black background templates
    function renderTodoListChecklistGrid() {
        if (!todoItemsBucket) return;
        if (todoListData.length === 0) {
            todoItemsBucket.innerHTML = `<p class="todo-empty-placeholder">Your To-Do list is currently empty. Tap choices inside the Creator menu below to populate tasks!</p>`; return;
        }
        todoItemsBucket.innerHTML = ""; 
        todoListData.forEach(task => {
            const itemElement = document.createElement('div'); itemElement.classList.add('todo-item', task.category);
            if (task.completed) itemElement.classList.add('checked-done');

            itemElement.innerHTML = `
                <label class="todo-checkbox-wrapper">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} class="native-task-checkbox">
                    <span class="custom-indicator-box"></span>
                </label>
                <div class="todo-item-info-stack">
                    <div class="todo-item-main-headline">${task.title}</div>
                    <div class="todo-item-sub-desc">${task.description}</div>
                </div>
                <button class="delete-todo-item-btn" title="Delete Task">&times;</button>
            `;

            const checkbox = itemElement.querySelector('.native-task-checkbox');
            checkbox.addEventListener('change', () => {
                task.completed = checkbox.checked; localStorage.setItem('productometer_slider_free_todolist', JSON.stringify(todoListData));
                if (task.completed) itemElement.classList.add('checked-done'); else itemElement.classList.remove('checked-done');
                updateDashboardMetrics(); 
            });

            itemElement.querySelector('.delete-todo-item-btn').addEventListener('click', (e) => {
                e.stopPropagation(); todoListData = todoListData.filter(t => t.id !== task.id);
                localStorage.setItem('productometer_slider_free_todolist', JSON.stringify(todoListData));
                renderTodoListChecklistGrid(); updateDashboardMetrics();
            });
            todoItemsBucket.appendChild(itemElement);
        });
    }

    // 4. Arithmetic Progression (AP) Math Equation Solvers
    function calculateAPRate(activity, hourIndex) {
        if (activity === 'academics') return 100; if (activity === 'skills') return 120 + (hourIndex * -20);
        if (activity === 'health') return 120 + (hourIndex * -40); if (activity === 'screen') return -80 + (hourIndex * -30);
        return 0;
    }

    function updateDashboardMetrics() {
        const slotsCount = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        const runningHourlyActivityCounts = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        let netFinalScore = 0; let cumulativeScoresArray = []; let runningCumulativeScore = 0;

        timelineData.forEach(item => { if (item && item !== 'eraser') slotsCount[item]++; });

        for (const key in slotsCount) {
            const calculatedHours = slotsCount[key] * 0.5; const hrsElement = document.getElementById(`hrs-${key}`);
            if (hrsElement) hrsElement.textContent = `${calculatedHours.toFixed(1)}h`;

            const capsuleCard = document.querySelector(`.activity-capsule.${key}`);
            if (capsuleCard) {
                if (key === 'screen' && calculatedHours > 0 && calculatedHours <= 4) capsuleCard.classList.add('goal-achieved');
                else if (key !== 'screen' && calculatedHours > 0 && calculatedHours >= 2) capsuleCard.classList.add('goal-achieved');
                else capsuleCard.classList.remove('goal-achieved');
            }
        }
        for (let slot = 0; slot < 48; slot++) {
            const currentItem = timelineData[slot];
            if (currentItem && currentItem !== 'eraser') {
                const trackingHourIndex = Math.floor(runningHourlyActivityCounts[currentItem] * 0.5);
                runningCumulativeScore += calculateAPRate(currentItem, trackingHourIndex) * 0.5; runningHourlyActivityCounts[currentItem]++;
            }
            cumulativeScoresArray.push({ score: runningCumulativeScore, activity: currentItem });
        }

        netFinalScore = runningCumulativeScore;
        let activeCompletedBonusCount = 0; todoListData.forEach(task => { if (task.completed) activeCompletedBonusCount++; });
        const totalBonusYieldPoints = activeCompletedBonusCount * 50; netFinalScore += totalBonusYieldPoints;

        if (cumulativeScoresArray.length > 0 && totalBonusYieldPoints > 0) {
            cumulativeScoresArray[cumulativeScoresArray.length - 1].score += totalBonusYieldPoints;
        }

        const daysNameIndex = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; const currentDayLabelName = daysNameIndex[new Date().getDay()];
        weeklyHistoryData.forEach(item => { if (item.day === currentDayLabelName) item.score = Math.round(netFinalScore); });
        localStorage.setItem('productometer_weekly_history', JSON.stringify(weeklyHistoryData));

        if (gaugeValue) {
            gaugeValue.className = ""; if (netFinalScore < 0) gaugeValue.classList.add('text-red'); else if (netFinalScore <= 300) gaugeValue.classList.add('text-yellow'); else gaugeValue.classList.add('text-green');
            gaugeValue.textContent = netFinalScore > 0 ? `+${Math.round(netFinalScore)}` : Math.round(netFinalScore);
        }
        drawGauge(netFinalScore); drawTrendGraph(cumulativeScoresArray); if (wCtx) drawWeeklyComparisonGraph(weeklyHistoryData);
    }

    // 5. Speedometer Dial Gauge Arc Vector Canvas Renderer
    function drawGauge(score) {
        if (!gCtx || !gaugeCanvas) return; gCtx.clearRect(0, 0, gaugeCanvas.width, gaugeCanvas.height);
        const cx = gaugeCanvas.width / 2; const cy = gaugeCanvas.height / 2 + 10; const radius = 90; const zeroAngle = -Math.PI / 2;
        gCtx.beginPath(); gCtx.arc(cx, cy, radius, zeroAngle - (Math.PI * 0.75), zeroAngle + (Math.PI * 0.75), false); gCtx.lineWidth = 12; gCtx.strokeStyle = '#1e1e24'; gCtx.lineCap = 'round'; gCtx.stroke();
        gCtx.fillStyle = '#646475'; gCtx.font = '600 11px Inter'; gCtx.textAlign = 'center'; gCtx.textBaseline = 'middle';
        const labels = [{ text: '-1000', angle: zeroAngle - (Math.PI * 0.7) }, { text: '0', angle: zeroAngle }, { text: '300', angle: zeroAngle + (Math.PI * 0.25) }, { text: '1000', angle: zeroAngle + (Math.PI * 0.7) }];
        labels.forEach(lbl => { gCtx.fillText(lbl.text, cx + (radius + 20) * Math.cos(lbl.angle), cy + (radius + 20) * Math.sin(lbl.angle)); });
        if (score !== 0) {
            let targetAngle = zeroAngle; let strokeColor = '#00e676'; if (score < 0) { strokeColor = '#ff1744'; const ratio = Math.max(-1, score / 1000); targetAngle = zeroAngle + (Math.PI * 0.7 * ratio); gCtx.beginPath(); gCtx.arc(cx, cy, radius, targetAngle, zeroAngle, false); } else { const ratio = Math.min(1, score / 1000); targetAngle = zeroAngle + (Math.PI * 0.7 * ratio); if (score <= 300) strokeColor = '#ffb300'; else strokeColor = '#00e676'; gCtx.beginPath(); gCtx.arc(cx, cy, radius, zeroAngle, targetAngle, false); }
            gCtx.lineWidth = 12; gCtx.strokeStyle = strokeColor; gCtx.lineCap = 'round'; gCtx.shadowBlur = 15; gCtx.shadowColor = strokeColor + '55'; gCtx.stroke(); gCtx.shadowBlur = 0;
        }
    }

    // 6. Chronological Line Graph Canvas Renderer
       // 6. Chronological Multi-Color Activity Plotted Line Graph Canvas Renderer (Responsive)
    function drawTrendGraph(pointsArray) {
        if (!tCtx || !trendGraphCanvas) return;
        
        // Dynamically match the actual display width of your Android screen
        const parentW = trendGraphCanvas.parentElement.clientWidth;
        if (parentW && trendGraphCanvas.width !== parentW) {
            trendGraphCanvas.width = parentW;
        }

        tCtx.clearRect(0, 0, trendGraphCanvas.width, trendGraphCanvas.height);
        const padL = 40, padR = 20, padT = 20, padB = 25; 
        const graphW = trendGraphCanvas.width - padL - padR; 
        const graphH = trendGraphCanvas.height - padT - padB;
        
        tCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; tCtx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(ratio => { tCtx.beginPath(); tCtx.moveTo(padL, padT + (graphH * ratio)); tCtx.lineTo(trendGraphCanvas.width - padR, padT + (graphH * ratio)); tCtx.stroke(); });
        function getCanvasY(val) { return padT + graphH - (graphH * ((Math.max(-500, Math.min(val, 1500)) - (-500)) / 2000)); }
        tCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; tCtx.beginPath(); tCtx.moveTo(padL, getCanvasY(0)); tCtx.lineTo(trendGraphCanvas.width - padR, getCanvasY(0)); tCtx.stroke();
        tCtx.fillStyle = '#4e4e5e'; tCtx.font = '600 10px Inter'; tCtx.textAlign = 'right'; tCtx.fillText('1500', padL - 10, padT + 4); tCtx.fillText('0', padL - 10, getCanvasY(0) + 3); tCtx.fillText('-500', padL - 10, padT + graphH + 2);
        tCtx.textAlign = 'center'; tCtx.fillText('12 AM', padL, padT + graphH + 18); tCtx.fillText('12 PM', padL + (graphW * 0.5), padT + graphH + 18); tCtx.fillText('12 AM', padL + graphW, padT + graphH + 18);

        if (pointsArray.length > 1) {
            for (let i = 1; i < pointsArray.length; i++) {
                tCtx.beginPath(); tCtx.moveTo(padL + (graphW * ((i - 1) / 47)), getCanvasY(pointsArray[i - 1].score)); tCtx.lineTo(padL + (graphW * (i / 47)), getCanvasY(pointsArray[i].score));
                const act = pointsArray[i].activity; let col = 'rgba(255, 255, 255, 0.15)'; if (act && activityColors[act]) col = activityColors[act];
                tCtx.lineWidth = 3.5; tCtx.strokeStyle = col; tCtx.lineCap = 'round'; tCtx.lineJoin = 'round';
                if (act && act !== 'eraser') { tCtx.shadowBlur = 10; tCtx.shadowColor = col + '55'; } tCtx.stroke(); tCtx.shadowBlur = 0;
            }
        }
    }

    // 7. Weekly Historical 7-Day Performance Bar Chart Canvas Rendering Engine
       // 7. Weekly Historical 7-Day Performance Bar Chart Canvas Rendering Engine (Responsive)
    function drawWeeklyComparisonGraph(historyArray) {
        if (!weeklyCanvas || !wCtx) return;
        
        // Dynamically match the actual display width of your Android screen
        const parentW = weeklyCanvas.parentElement.clientWidth;
        if (parentW && weeklyCanvas.width !== parentW) {
            weeklyCanvas.width = parentW;
        }

        wCtx.clearRect(0, 0, weeklyCanvas.width, weeklyCanvas.height);
        const padL = 40, padR = 20, padT = 20, padB = 25; 
        const graphW = weeklyCanvas.width - padL - padR; 
        const graphH = weeklyCanvas.height - padT - padB;
        
        wCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; wCtx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(ratio => { wCtx.beginPath(); wCtx.moveTo(padL, padT + (graphH * ratio)); wCtx.lineTo(weeklyCanvas.width - padR, padT + (graphH * ratio)); wCtx.stroke(); });
        const minY = -500, maxY = 1500; function getCanvasY(val) { return padT + graphH - (graphH * ((Math.max(minY, Math.min(val, maxY)) - minY) / (maxY - minY))); }
        const zeroY = getCanvasY(0); wCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; wCtx.beginPath(); wCtx.moveTo(padL, zeroY); wCtx.lineTo(weeklyCanvas.width - padR, zeroY); wCtx.stroke();
        wCtx.fillStyle = '#4e4e5e'; wCtx.font = '600 10px Inter'; wCtx.textAlign = 'right'; wCtx.fillText('1500', padL - 10, padT + 4); wCtx.fillText('0', padL - 10, zeroY + 3); wCtx.fillText('-500', padL - 10, padT + graphH + 2);

        // Adjust column bar widths fluidly so they never clip on small screens
        const columnWidthBar = Math.max(14, Math.min(30, graphW / 14)); 
        const totalElements = historyArray.length;
        
        historyArray.forEach((item, idx) => {
            const barCenterX = padL + (graphW * (idx / (totalElements - 1))); const barTopY = getCanvasY(item.score);
            wCtx.fillStyle = '#646475'; wCtx.font = '600 10px Inter'; wCtx.textAlign = 'center'; wCtx.fillText(item.day, barCenterX, padT + graphH + 18);
            let barColor = '#ff1744'; if (item.score >= 0) { barColor = item.score <= 300 ? '#ffb300' : '#00e676'; }
            wCtx.fillStyle = barColor; wCtx.beginPath();
            if (item.score >= 0) { wCtx.roundRect(barCenterX - (columnWidthBar / 2), barTopY, columnWidthBar, zeroY - barTopY, 4); }
            else { wCtx.roundRect(barCenterX - (columnWidthBar / 2), zeroY, columnWidthBar, barTopY - zeroY, 4); }
            wCtx.shadowBlur = 8; wCtx.shadowColor = barColor + '33'; wCtx.fill(); wCtx.shadowBlur = 0;
        });
    }


    // --- 🛡️ GRAPHICAL NEON MODAL POP-UP TIMEOUT EVENT LISTENERS TRACKS ---
    if (newDayBtn && resetConfirmModal) { newDayBtn.addEventListener('click', () => { resetConfirmModal.classList.remove('hidden'); }); }
    if (resetCancelBtn) { resetCancelBtn.addEventListener('click', () => { resetConfirmModal.classList.add('hidden'); }); }
    if (resetConfirmBtn) {
        resetConfirmBtn.addEventListener('click', () => {
            timelineData.fill(null); todoListData = []; localStorage.removeItem('productometer_timeline'); localStorage.removeItem('productometer_slider_free_todolist');
            initializeMainTimelineTrack(); renderTodoListChecklistGrid(); updateDashboardMetrics(); resetConfirmModal.classList.add('hidden');
        });
    }

    if (saveCloseBtn) { saveCloseBtn.addEventListener('click', () => { saveNotifyModal.classList.add('hidden'); }); }

    if (saveDataBtn) {
        saveDataBtn.addEventListener('click', () => {
            const exportCanvas = document.createElement('canvas'); exportCanvas.width = 650; exportCanvas.height = 1080;
            const eCtx = exportCanvas.getContext('2d'); eCtx.fillStyle = '#0a0a0c'; eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            eCtx.fillStyle = '#ffffff'; eCtx.font = 'bold italic 36px Caveat, cursive'; eCtx.textAlign = 'center'; eCtx.fillText('Productometer Summary Sheet', exportCanvas.width / 2, 55);
            eCtx.fillStyle = '#646475'; eCtx.font = '600 13px Inter'; eCtx.fillText(`Logged on: ${new Date().toLocaleDateString()}`, exportCanvas.width / 2, 85);
            eCtx.strokeStyle = 'rgba(0, 229, 255, 0.2)'; eCtx.lineWidth = 2; eCtx.strokeRect(30, 110, exportCanvas.width - 60, 100);
            eCtx.fillStyle = '#ffffff'; eCtx.font = '800 15px Inter'; eCtx.textAlign = 'left'; eCtx.fillText('PERFORMANCE DISPOSITION SUMMARY:', 50, 145);
            
            const scoreString = gaugeValue ? gaugeValue.textContent : "0"; const numericScoreValue = parseFloat(scoreString.replace('+', '')) || 0;
            let scoreLabelThemeColor = '#00e676'; if (numericScoreValue < 0) { scoreLabelThemeColor = '#ff1744'; } else if (numericScoreValue <= 300) { scoreLabelThemeColor = '#ffb300'; }
            eCtx.fillStyle = '#ffffff'; eCtx.font = '800 32px Inter'; eCtx.fillText('Net Score: ', 50, 190);
            eCtx.fillStyle = scoreLabelThemeColor; eCtx.fillText(scoreString, 50 + eCtx.measureText('Net Score: ').width, 190);

            const rx = 405; const ry = 160; const outerRadius = 45; const innerRadius = 28;
            const slotsCount = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
            let totalLoggedSlots = 0; timelineData.forEach(item => { if (item && item !== 'eraser') { slotsCount[item]++; totalLoggedSlots++; } });

            if (totalLoggedSlots === 0) {
                eCtx.beginPath(); eCtx.arc(rx, ry, (outerRadius + innerRadius) / 2, 0, Math.PI * 2); eCtx.lineWidth = outerRadius - innerRadius; eCtx.strokeStyle = '#1e1e24'; eCtx.stroke();
            } else {
                let startAngle = -Math.PI / 2;
                for (const activity in slotsCount) {
                    const count = slotsCount[activity]; if (count === 0) continue;
                    const endAngle = startAngle + ((count / totalLoggedSlots) * (Math.PI * 2)); eCtx.beginPath(); eCtx.arc(rx, ry, (outerRadius + innerRadius) / 2, startAngle, endAngle); eCtx.lineWidth = outerRadius - innerRadius; eCtx.strokeStyle = activityColors[activity]; eCtx.shadowBlur = 8; eCtx.shadowColor = activityColors[activity] + '44'; eCtx.stroke(); startAngle = endAngle;
                }
            }
            eCtx.shadowBlur = 0;

            let legendX = 490; let legendY = 125; eCtx.font = '700 10px Inter'; eCtx.textAlign = 'left'; eCtx.textBaseline = 'middle';
            for (const activity in slotsCount) { eCtx.fillStyle = activityColors[activity]; eCtx.fillRect(legendX, legendY, 10, 10); eCtx.fillStyle = '#a0a0ab'; eCtx.fillText(activity.toUpperCase(), legendX + 16, legendY + 5); legendY += 13; }

            eCtx.fillStyle = '#a0a0ab'; eCtx.font = '800 13px Inter'; eCtx.fillText('PROGRAMMED CHECKS SUMMARY:', 35, 255);
            let checkY = 285;
            if (todoListData.length === 0) {
                eCtx.fillStyle = '#555566'; eCtx.font = 'italic 13px Inter'; eCtx.fillText('No checklist items programmed for this session calendar interval.', 45, checkY);
            } else {
                todoListData.forEach(task => {
                    if (checkY > 440) return; eCtx.font = '14px Inter'; if (task.completed) { eCtx.fillStyle = '#00e676'; eCtx.fillText('✔️', 40, checkY); } else { eCtx.fillStyle = '#ff1744'; eCtx.fillText('❌', 40, checkY); }
                    eCtx.fillStyle = '#ffffff'; eCtx.font = '700 13px Inter'; eCtx.fillText(task.title.toUpperCase(), 70, checkY - 2); checkY += 26;
                });
            }

            if (trendGraphCanvas) eCtx.drawImage(trendGraphCanvas, 30, 480, exportCanvas.width - 60, 240);
            if (weeklyCanvas) { eCtx.fillStyle = '#a0a0ab'; eCtx.font = '800 13px Inter'; eCtx.fillText('WEEKLY ANALYTICS HISTORY SUMMARY:', 35, 765); eCtx.drawImage(weeklyCanvas, 30, 790, exportCanvas.width - 60, 210); }

            try {
                const linkTrigger = document.createElement('a'); linkTrigger.href = exportCanvas.toDataURL('image/jpeg', 0.95); linkTrigger.download = `productometer_sheet_${new Date().toISOString().slice(0,10)}.jpg`;
                document.body.appendChild(linkTrigger); linkTrigger.click(); document.body.removeChild(linkTrigger);
                if (saveNotifyModal) saveNotifyModal.classList.remove('hidden');
            } catch (e) { alert("Snapshot sheet compiled successfully!"); }
        });
    }
 // --- 📝 FAILSAFE BACKGROUND DESCRIPTION SYNC COLLECTOR HOOK ---
// Intercepts input notes and injects them dynamically into your custom task entries
(function() {
    let capturedDescriptionBuffer = "";

    // Listener 1: Captures the note text from the field bar whenever you interact with it
    document.addEventListener('input', function(event) {
        if (event.target && event.target.id === 'taskDescriptionInput') {
            capturedDescriptionBuffer = event.target.value.trim();
        }
    });

    // Listener 2: Fires when your custom task modal confirms a name entry
    document.addEventListener('click', function(event) {
        const isConfirmBtnClicked = event.target && (
            event.target.id === 'taskConfirmBtn' || 
            event.target.classList.contains('confirm-btn') ||
            (event.target.closest('button') && event.target.closest('button').id === 'taskConfirmBtn')
        );

        if (isConfirmBtnClicked && typeof todoListData !== 'undefined') {
            const customTaskTitleInput = document.getElementById('customTaskTitleInput');
            const enteredTitle = customTaskTitleInput ? customTaskTitleInput.value.trim() : "";

            if (enteredTitle) {
                // Background monitor intercepts the array push before local saves execute
                setTimeout(() => {
                    const freshCustomTask = todoListData.find(t => t.title === enteredTitle && t.description.includes('Target objective'));
                    if (freshCustomTask && capturedDescriptionBuffer) {
                        freshCustomTask.description = capturedDescriptionBuffer;
                        localStorage.setItem('productometer_slider_free_todolist', JSON.stringify(todoListData));
                        renderTodoListChecklistGrid();
                        
                        // Clear out the input bar box and clear the text collector buffer
                        const mainInputBar = document.getElementById('taskDescriptionInput');
                        if (mainInputBar) mainInputBar.value = "";
                        capturedDescriptionBuffer = "";
                    }
                }, 20); // 20ms delay loop ensures the card array push has settled into memory first
            }
        }
    }, true);
})();
   
    renderTodoListChecklistGrid();
});

