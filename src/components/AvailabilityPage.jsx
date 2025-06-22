import React from "react";
import {
    useState,
    useEffect
} from 'react';
import GoogleCalendarLink from './GoogleCalendarLink';
import { useAppContext } from "../context/AppContext";

const AvailabilityPage = ({ currentAvailability, onSave }) => {
    const { user } = useAppContext();
    const [availability, setAvailability] = useState(() => currentAvailability || getInitialAvailability());
    const orderedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    useEffect(() => {
        if (currentAvailability) {
            setAvailability(currentAvailability);
        }
    }, [currentAvailability]);

    const handleTimeChange = (day, type, field, value) => {
        const newAv = JSON.parse(JSON.stringify(availability));
        newAv.days[day][type][field] = value;
        setAvailability(newAv);
    };

    const handleToggle = (day, type) => {
        const newAv = JSON.parse(JSON.stringify(availability));
        newAv.days[day][type].enabled = !newAv.days[day][type].enabled;
        setAvailability(newAv);
    };

    if (!currentAvailability) {
      return (
        <div className="w-full h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )
    }

    return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Your Settings</h1>
            <button onClick={() => onSave(availability)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Save Availability</button>
        </header>
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
            {orderedDays.map(day => {
                const dayData = availability?.days?.[day];
                if (!dayData) return null;

                return (
                    <DayAvailability 
                        key={day} 
                        day={day} 
                        data={dayData} 
                        onTimeChange={handleTimeChange} 
                        onToggle={handleToggle}
                    />
                );
            })}
          </div>
          <GoogleCalendarLink user={user} />
          </div>
    </div>
    );
};

const DayAvailability = ({ day, data, onTimeChange, onToggle }) => (
    <div className="p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-xl font-bold capitalize text-white mb-4">{day}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AvailabilitySlot type="work" data={data.work} day={day} onTimeChange={onTimeChange} onToggle={onToggle}/>
            <AvailabilitySlot type="home" data={data.home} day={day} onTimeChange={onTimeChange} onToggle={onToggle}/>
        </div>
    </div>
);

const AvailabilitySlot = ({ type, data, day, onTimeChange, onToggle }) => (
    <div className={`p-4 rounded-lg ${data.enabled ? (type === 'work' ? 'bg-indigo-900/50' : 'bg-teal-900/50') : 'bg-gray-600/50 opacity-70'}`}>
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold capitalize">{type} Hours</h4>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={data.enabled} onChange={() => onToggle(day, type)} className="sr-only peer"/>
                <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
        <div className={`grid grid-cols-2 gap-4 ${!data.enabled && 'pointer-events-none'}`}>
            <div>
                <label className="text-sm text-gray-400">Start</label>
                <input type="time" value={data.start} onChange={(e) => onTimeChange(day, type, 'start', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"/>
            </div>
            <div>
                <label className="text-sm text-gray-400">End</label>
                <input type="time" value={data.end} onChange={(e) => onTimeChange(day, type, 'end', e.target.value)} className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"/>
            </div>
        </div>
    </div>
);

export default AvailabilityPage;