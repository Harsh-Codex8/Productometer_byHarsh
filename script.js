document.addEventListener('DOMContentLoaded', () => {
    const mainTimeline = document.getElementById('mainTimeline');
    const capsules = document.querySelectorAll('.activity-capsule');
    const gaugeCanvas = document.getElementById('gaugeCanvas');
    const trendGraphCanvas = document.getElementById('trendGraphCanvas');
    const gaugeValue = document.getElementById('gaugeValue');
    
    // Action Buttons Mapping
    const newDayBtn = document.getElementById('newDayBtn');
    const saveDataBtn = document.getElementById('saveDataBtn');
    
    let selectedActivity = null;
    let isSliding = false;

    // --- AUTO-SAVE LOCALSTORAGE HOOKS ---
    const savedData = localStorage.getItem('productometer_timeline');
    const timelineData = savedData ? JSON.parse(savedData) : Array(48).fill(null);

    const activityColors = {
        academics: '#00e5ff',
        health: '#00e676',
        skills: '#ffb300',
        screen: '#ff1744', 
        school: '#ff00ea', 
        sleep: '#3d5afe',
        other: '#78909c'
    };

    const gCtx = gaugeCanvas.getContext('2d');
    const tCtx = trendGraphCanvas.getContext('2d');
    
    // Initial Render Actions
    drawGauge(0); 
    drawTrendGraph([]);

    function paintSlot(division) {
        if (!selectedActivity) return;
        const i = parseInt(division.dataset.index);
        
        if (timelineData[i] === selectedActivity) {
            timelineData[i] = null;
            division.style.backgroundColor = 'transparent';
            division.style.boxShadow = 'none';
        } else {
            timelineData[i] = selectedActivity;
            division.style.backgroundColor = activityColors[selectedActivity];
            division.style.boxShadow = `0 0 10px ${activityColors[selectedActivity]}`;
        }
        
        localStorage.setItem('productometer_timeline', JSON.stringify(timelineData));
        updateDashboardMetrics();
    }

    // Build timeline blocks and paint active restored memory states
    for (let i = 0; i < 48; i++) {
        const division = document.createElement('div');
        division.classList.add('timeline-division');
        division.dataset.index = i;
        
        if (timelineData[i]) {
            division.style.backgroundColor = activityColors[timelineData[i]];
            division.style.boxShadow = `0 0 10px ${activityColors[timelineData[i]]}`;
        }
        
        division.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isSliding = true;
            paintSlot(division);
        });

        division.addEventListener('mouseenter', () => {
            if (isSliding) paintSlot(division);
        });

        mainTimeline.appendChild(division);
    }

    updateDashboardMetrics();
    window.addEventListener('mouseup', () => { isSliding = false; });

        // Touch handlers for mobile tracking bindings
    mainTimeline.addEventListener('touchstart', (e) => {
        if (!selectedActivity) return;
        isSliding = true;
        handleTouchMove(e);
    }, { passive: false });

    mainTimeline.addEventListener('touchmove', (e) => {
        if (!isSliding || !selectedActivity) return;
        e.preventDefault();
        handleTouchMove(e);
    }, { passive: false });

    mainTimeline.addEventListener('touchend', () => { isSliding = false; });

    function handleTouchMove(e) {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains('timeline-division')) {
            const i = parseInt(element.dataset.index);
            if (timelineData[i] !== selectedActivity) {
                timelineData[i] = selectedActivity;
                element.style.backgroundColor = activityColors[selectedActivity];
                element.style.boxShadow = `0 0 10px ${activityColors[selectedActivity]}`;
                
                localStorage.setItem('productometer_timeline', JSON.stringify(timelineData));
                updateDashboardMetrics();
            }
        }
    }

    capsules.forEach(capsule => {
        capsule.addEventListener('click', () => {
            const targetActivity = capsule.dataset.activity;
            if (capsule.classList.contains('active')) {
                capsule.classList.remove('active');
                selectedActivity = null;
            } else {
                capsules.forEach(c => c.classList.remove('active'));
                capsule.classList.add('active');
                selectedActivity = targetActivity;
            }
        });
    });

    // Wipes all data models completely
    newDayBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset the timeline and clear today's progress data?")) {
            timelineData.fill(null);
            localStorage.removeItem('productometer_timeline');
            
            const divisions = document.querySelectorAll('.timeline-division');
            divisions.forEach(div => {
                div.style.backgroundColor = 'transparent';
                div.style.boxShadow = 'none';
            });
            updateDashboardMetrics();
        }
    });

    // Compiles a custom dashboard summary snapshot card and exports it as a clean JPG file
    saveDataBtn.addEventListener('click', () => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 600;
        exportCanvas.height = 700;
        const eCtx = exportCanvas.getContext('2d');

        eCtx.fillStyle = '#0a0a0c';
        eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        eCtx.fillStyle = '#ffffff';
        eCtx.font = 'bold italic 36px Caveat, cursive';
        eCtx.textAlign = 'center';
        eCtx.fillText('Productometer Summary', exportCanvas.width / 2, 55);

        eCtx.fillStyle = '#646475';
        eCtx.font = '600 14px Inter';
        eCtx.fillText(`Logged on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, exportCanvas.width / 2, 85);

        eCtx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        eCtx.lineWidth = 2;
        eCtx.strokeRect(30, 120, exportCanvas.width - 60, 140);

        eCtx.fillStyle = '#ffffff';
        eCtx.font = '800 16px Inter';
        eCtx.textAlign = 'left';
        eCtx.fillText('PERFORMANCE SUMMARY:', 50, 160);

        eCtx.fillStyle = '#00e676';
        eCtx.font = '800 32px Inter';
        const currentScore = gaugeValue.textContent;
        eCtx.fillText(`Score: ${currentScore}`, 50, 215);

        const slotsCount = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        timelineData.forEach(item => { if (item) slotsCount[item]++; });

        eCtx.fillStyle = '#a0a0ab';
        eCtx.font = '600 14px Inter';
        let rowY = 300;
        eCtx.fillText('HOURS LOGGED PER CATEGORY:', 50, rowY - 25);
        
        for (const key in slotsCount) {
            const calculatedHours = (slotsCount[key] * 0.5).toFixed(1);
            eCtx.fillStyle = '#ffffff'; eCtx.fillText(`• ${key.toUpperCase()}:`, 50, rowY);
            eCtx.fillStyle = '#00e5ff'; eCtx.fillText(`${calculatedHours} hours`, 220, rowY);
            rowY += 30;
        }

        eCtx.drawImage(gaugeCanvas, 300, 130, 240, 195);
        eCtx.drawImage(trendGraphCanvas, 30, 500, exportCanvas.width - 60, 160);

        try {
            const imageQualityJPG = exportCanvas.toDataURL('image/jpeg', 0.9);
            const linkTrigger = document.createElement('a');
            linkTrigger.href = imageQualityJPG;
            linkTrigger.download = `productometer_snapshot_${new Date().toISOString().slice(0,10)}.jpg`;
            document.body.appendChild(linkTrigger);
            linkTrigger.click();
            document.body.removeChild(linkTrigger);
        } catch (error) {
            console.error("Image export error: ", error);
            alert("Snapshot compiled! Once your web app is deployed live on Vercel, this automatic JPG download will fire perfectly.");
        }
    });
    function calculateAPRate(activity, hourIndex) {
        if (activity === 'academics') return 100;
        if (activity === 'skills') return 120 + (hourIndex * -20);
        if (activity === 'health') return 120 + (hourIndex * -40);
        if (activity === 'screen') return -80 + (hourIndex * -30);
        return 0;
    }

    function updateDashboardMetrics() {
        const slotsCount = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        const runningHourlyActivityCounts = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        
        let netFinalScore = 0;
        let cumulativeScoresArray = []; 
        let runningCumulativeScore = 0;

        timelineData.forEach(item => { if (item) slotsCount[item]++; });

        for (const key in slotsCount) {
            const hrsElement = document.getElementById(`hrs-${key}`);
            if (hrsElement) hrsElement.textContent = `${(slotsCount[key] * 0.5).toFixed(1)}h`;
        }

        for (let slot = 0; slot < 48; slot++) {
            const currentItem = timelineData[slot];
            if (currentItem) {
                const trackingHourIndex = Math.floor(runningHourlyActivityCounts[currentItem] * 0.5);
                const pointContribution = calculateAPRate(currentItem, trackingHourIndex) * 0.5;
                runningCumulativeScore += pointContribution;
                runningHourlyActivityCounts[currentItem]++;
            }
            cumulativeScoresArray.push(runningCumulativeScore);
        }

        netFinalScore = runningCumulativeScore;

        gaugeValue.className = ""; 
        if (netFinalScore < 0) gaugeValue.classList.add('text-red');
        else if (netFinalScore <= 300) gaugeValue.classList.add('text-yellow');
        else gaugeValue.classList.add('text-green');

        gaugeValue.textContent = netFinalScore > 0 ? `+${Math.round(netFinalScore)}` : Math.round(netFinalScore);
        
        drawGauge(netFinalScore);
        drawTrendGraph(cumulativeScoresArray);
    }

    function drawGauge(score) {
        gCtx.clearRect(0, 0, gaugeCanvas.width, gaugeCanvas.height);
        const cx = gaugeCanvas.width / 2;
        const cy = gaugeCanvas.height / 2 + 10;
        const radius = 90;
        const zeroAngle = -Math.PI / 2;

        gCtx.beginPath();
        gCtx.arc(cx, cy, radius, zeroAngle - (Math.PI * 0.75), zeroAngle + (Math.PI * 0.75), false);
        gCtx.lineWidth = 12;
        gCtx.strokeStyle = '#1e1e24';
        gCtx.lineCap = 'round';
        gCtx.stroke();

        gCtx.fillStyle = '#646475';
        gCtx.font = '600 11px Inter';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';

        const labels = [
            { text: '-1000', angle: zeroAngle - (Math.PI * 0.7) },
            { text: '0', angle: zeroAngle },
            { text: '300', angle: zeroAngle + (Math.PI * 0.25) },
            { text: '1000', angle: zeroAngle + (Math.PI * 0.7) }
        ];

        labels.forEach(lbl => {
            const lx = cx + (radius + 20) * Math.cos(lbl.angle);
            const ly = cy + (radius + 20) * Math.sin(lbl.angle);
            gCtx.fillText(lbl.text, lx, ly);
        });

        if (score !== 0) {
            let targetAngle = zeroAngle;
            let strokeColor = '#00e676';

            if (score < 0) {
                strokeColor = '#ff1744';
                const ratio = Math.max(-1, score / 1000);
                targetAngle = zeroAngle + (Math.PI * 0.7 * ratio);
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, targetAngle, zeroAngle, false);
            } else {
                const ratio = Math.min(1, score / 1000);
                targetAngle = zeroAngle + (Math.PI * 0.7 * ratio);
                if (score <= 300) strokeColor = '#ffb300';
                else strokeColor = '#00e676';
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, zeroAngle, targetAngle, false);
            }

            gCtx.lineWidth = 12;
            gCtx.strokeStyle = strokeColor;
            gCtx.lineCap = 'round';
            gCtx.shadowBlur = 15;
            gCtx.shadowColor = strokeColor + '55';
            gCtx.stroke();
            gCtx.shadowBlur = 0; 
        }
    }

    
        function calculateAPRate(activity, hourIndex) {
        if (activity === 'academics') return 100;
        if (activity === 'skills') return 120 + (hourIndex * -20);
        if (activity === 'health') return 120 + (hourIndex * -40);
        if (activity === 'screen') return -80 + (hourIndex * -30);
        return 0;
    }

    function updateDashboardMetrics() {
        const slotsCount = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        const runningHourlyActivityCounts = { academics: 0, health: 0, skills: 0, screen: 0, school: 0, sleep: 0, other: 0 };
        
        let netFinalScore = 0;
        let cumulativeScoresArray = []; 
        let runningCumulativeScore = 0;

        timelineData.forEach(item => { if (item) slotsCount[item]++; });

        for (const key in slotsCount) {
            const hrsElement = document.getElementById(`hrs-${key}`);
            if (hrsElement) hrsElement.textContent = `${(slotsCount[key] * 0.5).toFixed(1)}h`;
        }

        for (let slot = 0; slot < 48; slot++) {
            const currentItem = timelineData[slot];
            if (currentItem) {
                const trackingHourIndex = Math.floor(runningHourlyActivityCounts[currentItem] * 0.5);
                const pointContribution = calculateAPRate(currentItem, trackingHourIndex) * 0.5;
                runningCumulativeScore += pointContribution;
                runningHourlyActivityCounts[currentItem]++;
            }
            // Save both the running total score and the activity name for this slot to color-code the graph
            cumulativeScoresArray.push({
                score: runningCumulativeScore,
                activity: currentItem
            });
        }

        netFinalScore = runningCumulativeScore;

        gaugeValue.className = ""; 
        if (netFinalScore < 0) gaugeValue.classList.add('text-red');
        else if (netFinalScore <= 300) gaugeValue.classList.add('text-yellow');
        else gaugeValue.classList.add('text-green');

        gaugeValue.textContent = netFinalScore > 0 ? `+${Math.round(netFinalScore)}` : Math.round(netFinalScore);
        
        drawGauge(netFinalScore);
        drawTrendGraph(cumulativeScoresArray);
    }

    function drawGauge(score) {
        gCtx.clearRect(0, 0, gaugeCanvas.width, gaugeCanvas.height);
        const cx = gaugeCanvas.width / 2;
        const cy = gaugeCanvas.height / 2 + 10;
        const radius = 90;
        const zeroAngle = -Math.PI / 2;

        gCtx.beginPath();
        gCtx.arc(cx, cy, radius, zeroAngle - (Math.PI * 0.75), zeroAngle + (Math.PI * 0.75), false);
        gCtx.lineWidth = 12;
        gCtx.strokeStyle = '#1e1e24';
        gCtx.lineCap = 'round';
        gCtx.stroke();

        gCtx.fillStyle = '#646475';
        gCtx.font = '600 11px Inter';
        gCtx.textAlign = 'center';
        gCtx.textBaseline = 'middle';

        const labels = [
            { text: '-1000', angle: zeroAngle - (Math.PI * 0.7) },
            { text: '0', angle: zeroAngle },
            { text: '300', angle: zeroAngle + (Math.PI * 0.25) },
            { text: '1000', angle: zeroAngle + (Math.PI * 0.7) }
        ];

        labels.forEach(lbl => {
            const lx = cx + (radius + 20) * Math.cos(lbl.angle);
            const ly = cy + (radius + 20) * Math.sin(lbl.angle);
            gCtx.fillText(lbl.text, lx, ly);
        });

        if (score !== 0) {
            let targetAngle = zeroAngle;
            let strokeColor = '#00e676';

            if (score < 0) {
                strokeColor = '#ff1744';
                const ratio = Math.max(-1, score / 1000);
                targetAngle = zeroAngle + (Math.PI * 0.7 * ratio);
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, targetAngle, zeroAngle, false);
            } else {
                const ratio = Math.min(1, score / 1000);
                targetAngle = zeroAngle + (Math.PI * 0.7 * ratio);
                if (score <= 300) strokeColor = '#ffb300';
                else strokeColor = '#00e676';
                gCtx.beginPath();
                gCtx.arc(cx, cy, radius, zeroAngle, targetAngle, false);
            }

            gCtx.lineWidth = 12;
            gCtx.strokeStyle = strokeColor;
            gCtx.lineCap = 'round';
            gCtx.shadowBlur = 15;
            gCtx.shadowColor = strokeColor + '55';
            gCtx.stroke();
            gCtx.shadowBlur = 0; 
        }
    }

    // Upgraded Graph Engine: Draws line segments matching the exact color of the entry for that timeline slot
    function drawTrendGraph(pointsArray) {
        tCtx.clearRect(0, 0, trendGraphCanvas.width, trendGraphCanvas.height);
        
        const padL = 40, padR = 20, padT = 20, padB = 25;
        const graphW = trendGraphCanvas.width - padL - padR;
        const graphH = trendGraphCanvas.height - padT - padB;

        tCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        tCtx.lineWidth = 1;
        
        [0.25, 0.5, 0.75].forEach(ratio => {
            const yPos = padT + (graphH * ratio);
            tCtx.beginPath(); tCtx.moveTo(padL, yPos); tCtx.lineTo(trendGraphCanvas.width - padR, yPos); tCtx.stroke();
        });

        const minY = -500, maxY = 1500;
        function getCanvasY(scoreValue) {
            const clipped = Math.max(minY, Math.min(scoreValue, maxY));
            return padT + graphH - (graphH * ((clipped - minY) / (maxY - minY)));
        }

        const zeroYPos = getCanvasY(0);
        tCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        tCtx.beginPath(); tCtx.moveTo(padL, zeroYPos); tCtx.lineTo(trendGraphCanvas.width - padR, zeroYPos); tCtx.stroke();

        tCtx.fillStyle = '#4e4e5e'; tCtx.font = '600 10px Inter'; tCtx.textAlign = 'right';
        tCtx.fillText('1500', padL - 10, padT + 4);
        tCtx.fillText('0', padL - 10, zeroYPos + 3);
        tCtx.fillText('-500', padL - 10, padT + graphH + 2);

        tCtx.textAlign = 'center';
        tCtx.fillText('12 AM', padL, padT + graphH + 18);
        tCtx.fillText('12 PM', padL + (graphW * 0.5), padT + graphH + 18);
        tCtx.fillText('12 AM', padL + graphW, padT + graphH + 18);

        // Map and render line segments individually to change colors chronologically box-by-box
        if (pointsArray.length > 1) {
            for (let i = 1; i < pointsArray.length; i++) {
                const startX = padL + (graphW * ((i - 1) / 47));
                const startY = getCanvasY(pointsArray[i - 1].score);
                const endX = padL + (graphW * (i / 47));
                const endY = getCanvasY(pointsArray[i].score);

                // Read the activity tag logged for this specific slot interval index
                const activeActivityKey = pointsArray[i].activity;
                
                // Color assignment: If a slot is unassigned, draw a faint gray connector; otherwise, use its specific neon icon profile color
                let segmentColor = 'rgba(255, 255, 255, 0.15)'; 
                if (activeActivityKey && activityColors[activeActivityKey]) {
                    segmentColor = activityColors[activeActivityKey];
                }

                tCtx.beginPath();
                tCtx.moveTo(startX, startY);
                tCtx.lineTo(endX, endY);
                tCtx.lineWidth = 3.5;
                tCtx.strokeStyle = segmentColor;
                tCtx.lineCap = 'round';
                tCtx.lineJoin = 'round';
                
                // Adds a beautiful matching neon lighting backdrop aura around active plotted entries
                if (activeActivityKey) {
                    tCtx.shadowBlur = 10;
                    tCtx.shadowColor = segmentColor + '55'; 
                }
                
                tCtx.stroke();
                tCtx.shadowBlur = 0; // Reset canvas context state
            }
        }
    }
}); // End of structural event listener closure thread loop
