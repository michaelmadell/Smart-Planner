import React, { useState } from 'react';
import { X } from 'lucide-react';

// Modal for creating, editing, or viewing a task.
const TaskModal = ({ task, onSubmit, onClose, onAddComment, isReadOnly }) => {
    const [name, setName] = useState(task ? task.name : '');
    const [description, setDescription] = useState(task ? task.description : '');
    const [priority, setPriority] = useState(task ? task.priority : 3);
    const [estimatedTime, setEstimatedTime] = useState(task ? task.estimatedTime : 60);
    const [context, setContext] = useState(task ? task.context : 'work');
    const [commentText, setCommentText] = useState('');
    const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(task ? !!task.addToGoogleCalendar : false);

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim() && task?.id) {
            onAddComment(task.id, commentText);
            setCommentText('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isReadOnly || !name.trim()) return;
        onSubmit({ name, description, priority: Number(priority), estimatedTime: Number(estimatedTime), context, addToGoogleCalendar });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{isReadOnly ? 'View Task' : (task ? 'Edit Task' : 'Create Task')}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Task Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={isReadOnly} placeholder="e.g., Quarterly report" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-70" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} disabled={isReadOnly} placeholder="Add details..." rows="3" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-70"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-70">
                                <option value="1">Highest</option><option value="2">High</option><option value="3">Medium</option><option value="4">Low</option><option value="5">Lowest</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Context</label>
                            <select value={context} onChange={e => setContext(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-70">
                                <option value="work">Work</option><option value="home">Home</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Time (minutes)</label>
                        <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} disabled={isReadOnly} min="15" step="15" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg disabled:opacity-70" required />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="googleCalendar" checked={addToGoogleCalendar} onChange={(e) => setAddToGoogleCalendar(e.target.checked)} disabled={isReadOnly} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-70" />
                        <label htmlFor="googleCalendar" className="text-sm text-gray-300">Add to Google Calendar</label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        {isReadOnly ? (
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Close</button>
                        ) : (
                            <>
                                <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">{task ? 'Save' : 'Create'}</button>
                            </>
                        )}
                    </div>
                </form>
                {task && (
                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-3">Comments</h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.slice().sort((a, b) => b.createdAt.seconds - a.createdAt.seconds).map((comment, index) => (
                                    <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                                        <p className="text-white text-sm whitespace-pre-wrap">{comment.text}</p>
                                        <p className="text-xs text-gray-400 mt-1 text-right">{comment.authorEmail} - {comment.createdAt.toDate().toLocaleDateString()}</p>
                                    </div>
                                ))
                            ) : (<p className="text-sm text-gray-500">No comments yet.</p>)}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
                            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                            <button type="submit" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold">Add</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskModal;