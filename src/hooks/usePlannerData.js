import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, where, writeBatch } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';
import { getInitialAvailability, scheduleTasks } from '../utils/scheduling';

export const usePlannerData = () => {
    const { db, user, appId } = useAppContext();
    const userId = user?.uid;

    const [isLoading, setIsLoading] = useState(true);
    const [availability, setAvailability] = useState(null);
    const [rawTasksByUser, setRawTasksByUser] = useState({});
    const [tasks, setTasks] = useState([]);

    // Effect for setting up all Firestore listeners
    useEffect(() => {
        if (!db || !userId) {
            setRawTasksByUser({});
            setAvailability(null);
            setTasks([]);
            setIsLoading(false); // Set loading to false when logged out
            return;
        }

        setIsLoading(true);
        const unsubscribers = new Map();

        // Availability, self-tasks, and connections listeners...
        // This entire block is cut from App.jsx and pasted here.
        const availabilityDocPath = `artifacts/${appId}/users/${userId}/settings/availability`;
        const availabilityUnsub = onSnapshot(doc(db, availabilityDocPath), (doc) => {
            setAvailability(doc.exists() ? doc.data() : getInitialAvailability());
        });
        unsubscribers.set('availability', availabilityUnsub);

        const selfTasksPath = `artifacts/${appId}/users/${userId}/tasks`;
        const qSelfTasks = query(collection(db, selfTasksPath));
        const selfTasksUnsub = onSnapshot(qSelfTasks, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), ownerId: userId }));
            setRawTasksByUser(current => ({ ...current, [userId]: tasksData }));
        });
        unsubscribers.set(userId, selfTasksUnsub);
        
        const connectionsPath = collection(db, 'connections');
        const qConnections = query(connectionsPath, where("userIds", "array-contains", userId), where("status", "==", "accepted"));
        const connectionsUnsub = onSnapshot(qConnections, (connectionsSnapshot) => {
             const connectedUserIds = new Set();
             connectionsSnapshot.forEach(doc => {
                 const otherUserId = doc.data().userIds.find(id => id !== userId);
                 if (otherUserId) connectedUserIds.add(otherUserId);
             });
             unsubscribers.forEach((unsub, id) => {
                 if (id !== userId && id !== 'availability' && id !== 'connections' && !connectedUserIds.has(id)) {
                     unsub();
                     unsubscribers.delete(id);
                     setRawTasksByUser(current => {
                         const newTasks = { ...current };
                         delete newTasks[id];
                         return newTasks;
                     });
                 }
             });
             connectedUserIds.forEach(connId => {
                 if (!unsubscribers.has(connId)) {
                     const friendTasksPath = `artifacts/${appId}/users/${connId}/tasks`;
                     const qFriendTasks = query(
                         collection(db, friendTasksPath),
                         where('isComplete', '==', false),
                         where('scheduledStart', '!=', null)
                     );
                     const friendTasksUnsub = onSnapshot(qFriendTasks, (friendSnapshot) => {
                         const tasksData = friendSnapshot.docs.map(doc => {
                             const connectionDoc = connectionsSnapshot.docs.find(cDoc => cDoc.data().userIds.includes(connId));
                             const ownerEmail = connectionDoc?.data().userEmails?.find(email => email !== user.email) || 'Shared Task';
                             return { id: doc.id, ...doc.data(), ownerId: connId, ownerEmail: ownerEmail };
                         });
                         setRawTasksByUser(current => ({ ...current, [connId]: tasksData }));
                     });
                     unsubscribers.set(connId, friendTasksUnsub);
                 }
             });
         });
         unsubscribers.set('connections', connectionsUnsub);


        return () => unsubscribers.forEach(unsub => unsub());
    }, [db, userId, appId, user?.email]);


    // Effect for processing tasks when raw data or availability changes
    useEffect(() => {
        if (!userId || !availability) {
            setIsLoading(true);
            return;
        }

        const allRawTasks = Object.values(rawTasksByUser).flat();
        
        if (allRawTasks.length === 0) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        const { scheduledTasks, needsUpdate } = scheduleTasks(allRawTasks, availability, userId);
        setTasks(scheduledTasks);
        setIsLoading(false);

        if (needsUpdate && db) {
            const writeSchedulesToDb = async () => {
                const batch = writeBatch(db);
                const tasksToUpdate = scheduledTasks.filter(task => task.isDirty && task.ownerId === userId);
                if (tasksToUpdate.length === 0) return;
                tasksToUpdate.forEach(task => {
                    const taskRef = doc(db, `artifacts/${appId}/users/${userId}/tasks/${task.id}`);
                    batch.update(taskRef, {
                        scheduledStart: task.scheduledStart,
                        scheduledEnd: task.scheduledEnd
                    });
                });
                await batch.commit();
            };
            writeSchedulesToDb();
        }
    }, [rawTasksByUser, availability, userId, db, appId]);

    return { tasks, availability, isLoading };
};