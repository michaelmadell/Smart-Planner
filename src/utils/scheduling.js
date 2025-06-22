import { Timestamp } from 'firebase/firestore';

export const getInitialAvailability = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const initial = {};
    days.forEach(day => {
        initial[day] = {
            work: { start: '09:00', end: '17:00', enabled: !['saturday', 'sunday'].includes(day) },
            home: { start: '18:00', end: '22:00', enabled: true }
        };
    });
    return { days: initial };
};

export const scheduleTasks = (tasks, availability, currentUserId) => {
    let needsUpdate = false;

    const tasksToSchedule = tasks.filter(t => t.ownerId === currentUserId && !t.isComplete && !t.scheduledStart);
    const preservedTasks = tasks.filter(t => !tasksToSchedule.includes(t));

    const scheduledEvents = preservedTasks
        .filter(t => t.scheduledStart)
        .map(t => ({ start: t.scheduledStart.toDate(), end: t.scheduledEnd.toDate() }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasksToSchedule) {
        const taskDuration = task.estimatedTime || 60;
        let slotFound = false;
        for (let i = 0; i < 14 && !slotFound; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
            const dayAvailability = availability.days[dayOfWeek]?.[task.context];
            if (!dayAvailability || !dayAvailability.enabled) continue;
            const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
            const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);
            let searchTime = new Date(currentDate);
            searchTime.setHours(startHour, startMinute, 0, 0);
            const endTime = new Date(currentDate);
            endTime.setHours(endHour, endMinute, 0, 0);

            while (searchTime < endTime && !slotFound) {
                const potentialEnd = new Date(searchTime.getTime() + taskDuration * 60000);
                if (potentialEnd > endTime) break;
                const isOverlapping = scheduledEvents.some(event => (searchTime < event.end && potentialEnd > event.start));
                if (!isOverlapping) {
                    task.scheduledStart = Timestamp.fromDate(searchTime);
                    task.scheduledEnd = Timestamp.fromDate(potentialEnd);
                    task.isDirty = true;
                    scheduledEvents.push({ start: searchTime, end: potentialEnd });
                    needsUpdate = true;
                    slotFound = true;
                }
                searchTime.setMinutes(searchTime.getMinutes() + 15);
            }
        }
    }
    const finalScheduledTasks = [...preservedTasks, ...tasksToSchedule];
    return { scheduledTasks: finalScheduledTasks, needsUpdate };
};