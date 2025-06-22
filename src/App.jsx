import React, { useState } from 'react';

// Component Imports
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import AuthPage from './components/AuthPage';
import TodoListPage from './components/TodoListPage';
import TaskModal from './components/TaskModal';
import PlannerPage from './components/PlannerPage';
import AvailabilityPage from './components/AvailabilityPage';
import ConnectionsPage from './components/ConnectionsPage';

// Context and Hook Imports
import { AppProvider, useAppContext } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { usePlannerData } from './hooks/usePlannerData';

// Firebase and other library imports
import toast, { Toaster } from 'react-hot-toast';
import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, setDoc, query, getDocs, where, arrayUnion, Timestamp, writeBatch } from 'firebase/firestore';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Menu } from 'lucide-react';

// --- Global Firebase Setup ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const appInstance = initializeApp(firebaseConfig);
const authInstance = getAuth(appInstance);
const dbInstance = getFirestore(appInstance);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-planner-app';


// The component that renders the main, authenticated UI
function AppContent() {
    const { user, userId, db } = useAppContext();
    const { tasks, availability, isLoading } = usePlannerData();

    // UI-specific state remains here to control the view
    const [appView, setAppView] = useState('tasks');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isModalReadOnly, setIsModalReadOnly] = useState(false);

    // --- All Handler Functions ---
    const handleLogout = () => signOut(authInstance);

    const openTaskModal = (task = null) => {
        const isReadOnly = task ? task.ownerId !== userId : false;
        setEditingTask(task);
        setIsModalReadOnly(isReadOnly);
        setIsModalOpen(true);
    };

    const closeTaskModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleAddTask = async (task) => {
        if (!db || !userId) return;
        const tasksCollectionPath = `/artifacts/${appId}/users/${userId}/tasks`;
        await addDoc(collection(db, tasksCollectionPath), { 
          ...task, 
          isComplete: false, 
          createdAt: Timestamp.now(), 
          comments: [],
          googleEventId: null
        });
    };

    const handleUpdateTask = async (taskId, updatedTask) => {
        if (!db || !userId) return;
        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask) return console.error("Could not find original task to update.");

        const updatePayload = { ...updatedTask };
        const newDuration = updatedTask.estimatedTime;
        const hasDurationChanged = newDuration !== undefined && newDuration !== originalTask.estimatedTime;

        if (hasDurationChanged && originalTask.scheduledStart) {
            const startTime = originalTask.scheduledStart.toDate();
            const newEndTime = new Date(startTime.getTime() + Number(newDuration) * 60000);
            updatePayload.scheduledEnd = Timestamp.fromDate(newEndTime);
        }
        
        const taskDocPath = `/artifacts/${appId}/users/${userId}/tasks/${taskId}`;
        await updateDoc(doc(db, taskDocPath), updatePayload);
    };

    const handleTaskFormSubmit = (taskData) => {
        if (editingTask) {
            handleUpdateTask(editingTask.id, taskData);
        } else {
            handleAddTask(taskData);
        }
        closeTaskModal();
    };
    
    const handleDeleteTask = async (taskId) => {
       if (!db || !userId) return;
       const taskDocPath = `/artifacts/${appId}/users/${userId}/tasks/${taskId}`;
       await deleteDoc(doc(db, taskDocPath));
    };
    
    const toggleComplete = (task) => {
        const now = Timestamp.now();
        let updatePayload = { isComplete: !task.isComplete };
        if (!task.isComplete && task.scheduledEnd && task.scheduledEnd.toDate() > now.toDate()) {
            updatePayload.scheduledEnd = now;
        }
        handleUpdateTask(task.id, updatePayload);
    };

    const handleSaveAvailability = async (newAvailability) => {
        if (!db || !userId) return;
        const availabilityDocPath = `/artifacts/${appId}/users/${userId}/settings/availability`;
        try {
            await setDoc(doc(db, availabilityDocPath), newAvailability);
            toast.success("Availability settings saved!");
        } catch (error) {
            toast.error("Failed to save settings.");
        }
    };

    const handleAddTaskComment = async (taskId, commentText) => {
        if (!db || !userId || !commentText.trim()) return;
        const taskDocPath = `/artifacts/${appId}/users/${userId}/tasks/${taskId}`;
        const newComment = {
            text: commentText,
            createdAt: Timestamp.now(),
            authorEmail: user.email
        };
        try {
            await updateDoc(doc(db, taskDocPath), { comments: arrayUnion(newComment) });
        } catch (error) {
            console.error("Error adding comment: ", error);
            toast.error("Failed to add comment.");
        }
    };

    const handleDelay = async (durationMinutes, context) => {
        if (!db || !userId) return;
        const tasksCollectionPath = `/artifacts/${appId}/users/${userId}/tasks`;
        const now = Timestamp.now();
        let q;
        if (context === 'all') {
            q = query(collection(db, tasksCollectionPath), where('isComplete', '==', false), where('scheduledStart', '>=', now));
        } else {
            q = query(collection(db, tasksCollectionPath), where('isComplete', '==', false), where('scheduledStart', '>=', now), where('context', '==', context));
        }
        try {
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                const task = doc.data();
                const newStart = new Date(task.scheduledStart.toDate().getTime() + durationMinutes * 60000);
                const newEnd = new Date(task.scheduledEnd.toDate().getTime() + durationMinutes * 60000);
                batch.update(doc.ref, { scheduledStart: Timestamp.fromDate(newStart), scheduledEnd: Timestamp.fromDate(newEnd) });
            });
            await batch.commit();
            toast.success(`Tasks delayed successfully!`);
        } catch (error) {
            toast.error("Failed to delay tasks.");
        }
    };

    const handleTaskTimeUpdate = (taskId, newStart, newEnd) => {
        handleUpdateTask(taskId, {
            scheduledStart: Timestamp.fromDate(newStart),
            scheduledEnd: Timestamp.fromDate(newEnd),
            isManuallyMoved: true
        });
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{ className: 'bg-gray-700 text-white', style: { background: '#2D3748', color: '#F7FAFC' } }}/>
            <Sidebar currentView={appView} setView={setAppView} onLogout={handleLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            {isSidebarOpen && (<div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>)}
            
            <ErrorBoundary>
                <main className="flex-1 overflow-y-auto relative">
                    <div className="absolute top-0 left-0 p-4 z-20 md:hidden">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-800/50 rounded-md text-white">
                            <Menu size={24} />
                        </button>
                    </div>

                    {appView === 'tasks' && <TodoListPage tasks={tasks} onTaskAction={openTaskModal} onDeleteTask={handleDeleteTask} onToggleComplete={toggleComplete} />}
                    {appView === 'planner' && <PlannerPage tasks={tasks} onDelay={handleDelay} onTaskTimeUpdate={handleTaskTimeUpdate} onTaskClick={openTaskModal} />}
                    {appView === 'availability' && <AvailabilityPage currentAvailability={availability} onSave={handleSaveAvailability} />}
                    {appView === 'connections' && <ConnectionsPage />}
                </main>
            </ErrorBoundary>

            {isModalOpen && (
                <TaskModal task={editingTask} onSubmit={handleTaskFormSubmit} onClose={closeTaskModal} onAddComment={handleAddTaskComment} isReadOnly={isModalReadOnly} />
            )}
        </div>
    );
}

// This component sets up auth and provides the global context
function App() {
    const { user, isAuthReady } = useAuth();
    
    const contextValue = {
        user,
        userId: user?.uid,
        db: dbInstance,
        auth: authInstance,
        appId,
    };

    if (!isAuthReady) {
        return <LoadingScreen />;
    }

    return (
        <AppProvider value={contextValue}>
            {user ? <AppContent /> : <AuthPage />}
        </AppProvider>
    );
}

// The top-level wrapper for Google Auth
export default function AppWrapper() {
    const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return (
        <GoogleOAuthProvider clientId={googleClientID}>
            <App />
        </GoogleOAuthProvider>
    )
}