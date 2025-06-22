import React from 'react';
import { Briefcase, PlusCircle, Home, Clock, Edit, Trash2, Check, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

// Component for a single task item in the list.
const TaskItem = ({ task, onEdit, onDelete, onToggleComplete }) => {
    const priorityColors = { 1: 'bg-red-500', 2: 'bg-orange-500', 3: 'bg-yellow-500', 4: 'bg-blue-500', 5: 'bg-green-500' };
    const contextIcons = { work: <Briefcase size={16} />, home: <Home size={16} /> };
    return (
        <li className={`flex items-center p-4 rounded-lg transition-all duration-300 ${task.isComplete ? 'bg-gray-700 opacity-60' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
            <div className={`w-2 h-full self-stretch rounded-full mr-4 ${priorityColors[task.priority] || 'bg-gray-500'}`}></div>
            <div className="flex-grow">
                <p className={`font-semibold text-lg ${task.isComplete ? 'line-through text-gray-400' : 'text-white'}`}>{task.name}</p>
                <p className="text-sm text-gray-400">{task.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">{contextIcons[task.context] || ''} {task.context}</span>
                    <span className="flex items-center gap-1.5"><Clock size={16} /> {task.estimatedTime} min</span>
                </div>
            </div>
            <div className="flex items-center gap-3 ml-4">
                <button onClick={() => onToggleComplete(task)} className={`p-2 rounded-full transition-colors ${task.isComplete ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                    {task.isComplete ? <Check size={20} /> : <div className="w-5 h-5"></div>}
                </button>
                <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full"><Edit size={20} /></button>
                <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-600 rounded-full"><Trash2 size={20} /></button>
            </div>
        </li>
    );
};

// The main page for displaying the user's task list.
const TodoListPage = ({ tasks, onTaskAction, onDeleteTask, onToggleComplete }) => {
    const { user: currentUser } = useAppContext();

    const openAddModal = () => onTaskAction(null);
    const openEditModal = (task) => onTaskAction(task);

    const myTasks = (tasks || []).filter(task => task.ownerId === currentUser.uid);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-white">My Tasks</h1>
                <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><PlusCircle size={20} /> New Task</button>
            </header>
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
                {myTasks.length > 0 ? (
                    <ul className="space-y-4">
                        {myTasks.map((task) => (
                            <TaskItem key={task.id} task={task} onEdit={openEditModal} onDelete={onDeleteTask} onToggleComplete={onToggleComplete} />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12">
                        <h3 className="text-2xl font-semibold text-gray-300">All clear!</h3>
                        <p className="text-gray-500 mt-2">Create a new task.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoListPage;