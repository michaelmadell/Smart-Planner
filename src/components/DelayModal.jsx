import React, { useState } from 'react';
import { X } from 'lucide-react';

/**
 * A modal that allows the user to delay all upcoming tasks by a specified duration.
 */
const DelayModal = ({ onSubmit, onClose }) => {
    const [duration, setDuration] = useState(60);
    const [context, setContext] = useState('all');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(Number(duration), context);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Delay Upcoming Tasks</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="delay-duration" className="block text-sm font-medium text-gray-300 mb-1">Delay (minutes)</label>
                        <input id="delay-duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} min="15" step="15" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg" required />
                    </div>
                    <div>
                        <label htmlFor="delay-context" className="block text-sm font-medium text-gray-300 mb-1">Tasks to delay</label>
                        <select id="delay-context" value={context} onChange={e => setContext(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
                            <option value="all">All</option>
                            <option value="work">Work Only</option>
                            <option value="home">Home Only</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Confirm Delay</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DelayModal;
