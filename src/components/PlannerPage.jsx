import React from "react";
import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { CalendarDays, ChevronLeft, ChevronRight, Hourglass } from 'lucide-react';
import { Resizable } from "react-resizable";
import DelayModal from "./DelayModal";
import { useAppContext } from "../context/AppContext";

const PlannerPage = ({ tasks, onDelay, onTaskTimeUpdate, onTaskClick, isLoading }) => {
    const { user: currentUser } = useAppContext();
    const [viewDate, setViewDate] = useState(new Date());
    const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const dayOfWeek = (viewDate.getDay() + 6) % 7;
    const weekDates = days.map((_, i) => {
        const d = new Date(viewDate);
        d.setDate(d.getDate() - dayOfWeek + i);
        return d;
    });

    const rowHeightRem = 4;
    const plannerGridRef = useRef(null);
    const [plannerWidth, setPlannerWidth] = useState(0);

    useEffect(() => {
        const checkWidth = () => {
            if (plannerGridRef.current) {
                setPlannerWidth(plannerGridRef.current.clientWidth);
            }
        };
        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);
    
    const handlePreviousWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(newDate.getDate() - 7);
        setViewDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(viewDate);
        newDate.setDate(newDate.getDate() + 7);
        setViewDate(newDate);
    };

    const handleGoToToday = () => {
        setViewDate(new Date());
    };
    
    const handleDelaySubmit = (duration, context) => { onDelay(duration, context); setIsDelayModalOpen(false); };

    const EmptyState = () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <CalendarDays size={48} className="text-gray-600 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-400">Planner is Empty</h3>
        <p className="text-gray-500 mt-2">Add a task in the 'Tasks' view to see it scheduled here.</p>
      </div>
    );

    const LoadingState = () => (
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          <p className="mt-4 text-lg text-gray-400">Loading Schedule...</p>
        </div>
      </div>
    )

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl sm:text-4xl font-bold text-white">Weekly Planner</h1>
                    <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                        <button onClick={handlePreviousWeek} className="p-2 rounded-md hover:bg-gray-600 text-gray-300 hover:text-white"><ChevronLeft size={20}/></button>
                        <button onClick={handleGoToToday} className="px-4 py-1.5 text-sm font-semibold rounded-md hover:bg-gray-600 text-gray-300 hover:text-white">Today</button>
                        <button onClick={handleNextWeek} className="p-2 rounded-md hover:bg-gray-600 text-gray-300 hover:text-white"><ChevronRight size={20}/></button>
                    </div>
                </div>
                <button onClick={() => setIsDelayModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"><Hourglass size={20}/> Delay</button>
            </header>

            <div className="flex-grow bg-gray-800 rounded-2xl shadow-lg overflow-auto">
                <div className="relative" style={{ minWidth: '1200px' }}>
                    <div className="sticky top-0 z-20 grid grid-cols-8 bg-gray-800">
                        <div className="h-16 border-r border-b border-gray-700 flex items-center justify-center font-bold text-lg text-blue-400">
                           {weekDates[0].toLocaleString('default', { year: 'numeric' })}
                        </div>
                        {days.map((day, i) => ( 
                            <div key={day} className={`text-center font-bold h-16 flex items-center justify-center border-b border-r border-gray-700 ${new Date().toDateString() === weekDates[i].toDateString() ? 'text-blue-400' : ''}`}>
                                <div>
                                    <p>{day}</p>
                                    <p className="text-2xl font-semibold">{weekDates[i].getDate()}</p>
                                </div>
                            </div> 
                        ))}
                    </div>
                    <div className="grid grid-cols-8">
                        <div className="col-span-1">{hours.map(hour => (<div key={hour} className="text-right pr-2 border-r border-gray-700 text-sm text-gray-500" style={{ height: `${rowHeightRem}rem` }}><span className="relative -top-2">{`${hour.toString().padStart(2, '0')}:00`}</span></div>))}</div>
                        <div ref={plannerGridRef} className="col-span-7 grid grid-cols-7 relative">
                            {Array.from({length: 24*7}).map((_, i) => (<div key={i} className="border-b border-l border-gray-700/50" style={{height: `${rowHeightRem}rem`}}></div>))}
                            {isLoading ? (
                              <LoadingState />
                            ) : tasks.filter(t => t.scheduledStart).length === 0 ? (
                              <EmptyState />
                            ) : (
                              plannerWidth > 0 && (
                                <div className="absolute inset-0 z-10">
                                    {tasks.filter(t=>t.scheduledStart).map(task => (
                                        <DraggableTask 
                                            key={`${task.id}-${task.scheduledStart.seconds}`}
                                            task={task} 
                                            weekDates={weekDates} 
                                            rowHeightRem={rowHeightRem} 
                                            onTaskTimeUpdate={onTaskTimeUpdate}
                                            plannerWidth={plannerWidth}
                                            onTaskClick={onTaskClick}
                                            currentUser={currentUser}
                                        />
                                    ))}
                                </div>
                              )
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isDelayModalOpen && <DelayModal onSubmit={handleDelaySubmit} onClose={() => setIsDelayModalOpen(false)} />}
        </div>
    );
};

const DraggableTask = ({ task, weekDates, rowHeightRem, onTaskTimeUpdate, plannerWidth, onTaskClick}) => {
    const { user: currentUser } = useAppContext();
    const nodeRef = useRef(null);

    const originalMousePosition = useRef({ x: 0, y: 0});

    const start = task.scheduledStart.toDate();
    const dayWidth = plannerWidth / 7;

    const [size, setSize] = useState({
        height: ((task.scheduledEnd.toDate() - start) / 3600000) * rowHeightRem * 16,
        width: dayWidth,
    });
    
    useEffect(() => {
        setSize(prev => ({
            ...prev,
            height: ((task.scheduledEnd.toDate() - task.scheduledStart.toDate()) / 3600000) * rowHeightRem * 16
        }));
    }, [task.scheduledStart, task.scheduledEnd, rowHeightRem]);

    const isOwner = currentUser ? (task.ownerId ? task.ownerId === currentUser.uid : true) : false;

    const stringToColor = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      let color = '#';
      for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
      }
      return color;
    }

    const priorityColors = { 1: "#7f1d1d", 2: '#7c2d12', 3: '#713f12', 4: '#1e3a8a', 5: '#064e3b'};
    const userColor = isOwner ? priorityColors[task.priority] : stringToColor(task.ownerId || '');

    const dayIndex = weekDates.findIndex(d => d.toDateString() === start.toDateString());
    if (dayIndex === -1) return null;

    const startOffsetHours = start.getHours() + start.getMinutes() / 60;
    
    const onResize = (event, { size: newSize }) => {
        setSize(prev => ({ ...prev, height: newSize.height }));
    };
    
    const onDragStop = (e, data) => {
        const newDayIndex = Math.max(0, Math.min(6, Math.floor((data.x + dayWidth / 2) / dayWidth)));
        const newStartHour = data.y / (rowHeightRem * 16);
        const newStartDate = new Date(weekDates[newDayIndex]);
        const snappedMinutes = Math.round(((newStartHour % 1) * 60) / 15) * 15;
        newStartDate.setHours(Math.floor(newStartHour), snappedMinutes, 0, 0);
        const durationMs = task.scheduledEnd.toDate() - start;
        const newEndDate = new Date(newStartDate.getTime() + durationMs);
        onTaskTimeUpdate(task.id, newStartDate, newEndDate);
    };
    
    const onResizeStop = (e, { size: newSize }) => {
        const newDurationMinutes = (newSize.height / (rowHeightRem * 16)) * 60;
        const snappedMinutes = Math.max(15, Math.round(newDurationMinutes / 15) * 15);
        const newEndDate = new Date(start.getTime() + snappedMinutes * 60000);
        onTaskTimeUpdate(task.id, start, newEndDate);
    };

    const handleMouseDown = (e) => {
      originalMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e) => {
      const dx = Math.abs(e.clientX - originalMousePosition.current.x);
      const dy = Math.abs(e.clientY - originalMousePosition.current.y);

      if (dx < 5 && dy < 5) {
        onTaskClick(task);
      }
    };

    const contextColors = { work: 'border-indigo-400', home: 'border-teal-400' };
    
    return (
        <Draggable
            nodeRef={nodeRef}
            onStop={onDragStop}
            defaultPosition={{ x: dayIndex * dayWidth, y: startOffsetHours * rowHeightRem * 16 }}
            grid={[dayWidth, rowHeightRem * 16 / 4]}
            bounds="parent"
            cancel=".resize-handle"
            disabled={!isOwner}
        >
            <div ref={nodeRef} className="absolute" style={{ width: dayWidth, zIndex: 10 }}>
                <Resizable
                    height={size.height}
                    width={size.width}
                    onResize={onResize}
                    onResizeStop={onResizeStop}
                    axis="y"
                    minConstraints={[size.width, rowHeightRem * 16 / 4]}
                    maxConstraints={[size.width, 24 * rowHeightRem * 16]}
                    resizeHandles={isOwner ? ['s'] : []}
                    handle={<div onClick={(e) => e.stopPropagation()} className={`resize-handle absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-2 bg-white/50 rounded-full cursor-ns-resize ${!isOwner && 'hidden'}`}></div>}
                >
                    <div 
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        className={`w-full h-full p-2 rounded-lg text-white overflow-hidden flex flex-col relative cursor-pointer`}
                        style={{
                            backgroundColor: userColor,
                            width: size.width,
                            height: size.height
                        }}
                    >
                        <p className="font-bold text-sm truncate">{task.name}</p>
                        {!isOwner && <p className="text-xs text-gray-300 truncate">{task.ownerEmail || 'Shared Task'}</p>}
                        <p className="text-xs text-gray-300 mt-auto pt-1 font-mono">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - 
                            {new Date(start.getTime() + (size.height / (rowHeightRem * 16)) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                    </div>
                </Resizable>
            </div>
        </Draggable>
    );
}

export default PlannerPage;