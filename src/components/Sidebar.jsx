import React from 'react';
import { ListChecks, CalendarDays, Settings, Users, LogOut, X } from 'lucide-react';

// A single navigation item in the sidebar.
const NavItem = ({ icon, label, view, currentView, setView, onNavigate }) => (
    <button onClick={() => {
        setView(view);
        if (onNavigate) onNavigate();
    }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors ${currentView === view ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
        {icon} {label}
    </button>
);

/**
 * The main sidebar navigation component.
 */
const Sidebar = ({ currentView, setView, onLogout, isSidebarOpen, setIsSidebarOpen }) => (
    <div className={`
        w-64 bg-gray-800/50 p-6 flex flex-col justify-between
        fixed inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-2xl font-bold text-white">Smart Planner</h1>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-400 hover:text-white md:hidden">
                    <X size={24} />
                </button>
            </div>
            <nav className="space-y-2">
                <NavItem icon={<ListChecks />} label="Tasks" view="tasks" currentView={currentView} setView={setView} onNavigate={() => setIsSidebarOpen(false)} />
                <NavItem icon={<CalendarDays />} label="Planner" view="planner" currentView={currentView} setView={setView} onNavigate={() => setIsSidebarOpen(false)} />
                <NavItem icon={<Settings />} label="Availability" view="availability" currentView={currentView} setView={setView} onNavigate={() => setIsSidebarOpen(false)} />
                <NavItem icon={<Users />} label="Connections" view="connections" currentView={currentView} setView={setView} onNavigate={() => setIsSidebarOpen(false)} />
            </nav>
        </div>
        <button onClick={onLogout} className="flex items-center gap-3 w-full px-4 py-3 font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-red-600 hover:text-white">
            <LogOut size={20} /> Logout
        </button>
    </div>
);

export default Sidebar;
