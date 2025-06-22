import React from "react";
import { useState, useEffect } from "react";
import {
    query,
    collection,
    where,
    onSnapshot,
    getDoc,
    addDoc,
    updateDoc,
    Timestamp,
    doc,
    getDocs
} from 'firebase/firestore';
import toast, {Toaster} from "react-hot-toast";

import { useAppContext } from "../context/AppContext";

const ConnectionsPage = () => {
    const { db, user: currentUser } = useAppContext();
    const [profiles, setProfiles] = useState([]);
    const [connections, setConnections] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [connectionProfiles, setConnectionProfiles] = useState(new Map());
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
    
    // Fetch all of the current user's connections
    useEffect(() => {
        if (!db || !currentUser) return;
        const q = query(collection(db, "connections"), where("userIds", "array-contains", currentUser.uid));
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const userConnections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConnections(userConnections);

            setIsLoadingProfiles(true);
            const profilesToFetch = new Set();
            userConnections.forEach(conn => {
              const otherUserId = conn.userIds.find(id => id !== currentUser.uid);
              if(otherUserId) profilesToFetch.add(otherUserId);
            });

            if (profilesToFetch.size > 0) {
              const profilePromises = Array.from(profilesToFetch).map(userId => getDoc(doc(db, "profiles", userId)));
              const profileDocs = await Promise.all(profilePromises);

              const newProfiles = new Map();
              profileDocs.forEach(pDoc => {
                if (pDoc.exists()) {
                  newProfiles.set(pDoc.id, pDoc.data());
                }
              });
              setConnectionProfiles(newProfiles);
            }
            setIsLoadingProfiles(false);
        });
        
        return () => unsubscribe();
    }, [db, currentUser]);

    // Function to search for users by email
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) return;
        
        setHasSearched(true);
        const q = query(collection(db, "profiles"), where("email", "==", searchEmail.toLowerCase()));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
    };

    // Function to send a connection request
    const handleSendRequest = async (requesteeId) => {
        if (!db || !currentUser) return;
        
        const newConnection = {
            userIds: [currentUser.uid, requesteeId],
            requesterId: currentUser.uid,
            requesteeId: requesteeId,
            status: "pending",
            updatedAt: Timestamp.now(),
        };
        
        await addDoc(collection(db, "connections"), newConnection);
        toast.success("Connection request sent!");
        setSearchEmail('');
        setSearchResults([]);
    };

    // Function to update the status of a connection request
    const handleUpdateRequest = async (connectionId, newStatus) => {
        if (!db) return;
        const connectionRef = doc(db, "connections", connectionId);
        await updateDoc(connectionRef, {
            status: newStatus,
            updatedAt: Timestamp.now(),
        });
    };

    // Filter connections into different categories for display
    const acceptedConnections = connections.filter(c => c.status === 'accepted');
    const pendingIncoming = connections.filter(c => c.status === 'pending' && c.requesteeId === currentUser.uid);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-white">My Connections</h1>
            </header>

            {/* Send new invitation */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Find New Connections</h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="email" 
                        value={searchEmail} 
                        onChange={e => setSearchEmail(e.target.value)} 
                        placeholder="Search by user email..." 
                        className="flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <button type="submit" className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Search</button>
                </form>
                {hasSearched && searchResults.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                      <p>No user found with that email.</p>
                  </div>
                )}
                {searchResults.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {searchResults.map(profile => (
                            <li key={profile.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                <span>{profile.email}</span>
                                {profile.id !== currentUser.uid && (
                                    <button onClick={() => handleSendRequest(profile.id)} className="px-3 py-1 bg-green-600 text-sm rounded-md hover:bg-green-700">Connect</button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Display Incoming Requests */}
            <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Incoming Requests</h2>

              {/* This is the corrected logic */}
              {pendingIncoming.length > 0 ? (
              // If there are pending requests, we then check if profiles are loading.
              // No extra curly braces are needed here.
                isLoadingProfiles ? (
                  <p className="text-gray-400 text-center py-4">Loading profile info...</p>
                ) : (
                  <ul className="space-y-3">
                    {pendingIncoming.map(req => {
                      const profile = connectionProfiles.get(req.requesterId);
                      return (
                        <li key={req.id} className="flex justify-between items-center bg-gray-700/50 p-4 rounded-lg">
                            <span className="font-semibold">{profile?.displayName || profile?.email || 'Awaiting profile...'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleUpdateRequest(req.id, 'accepted')} className="px-3 py-1 bg-green-600 text-sm rounded-md hover:bg-green-700">Accept</button>
                                <button onClick={() => handleUpdateRequest(req.id, 'declined')} className="px-3 py-1 bg-red-600 text-sm rounded-md hover:bg-red-700">Decline</button>
                            </div>
                        </li>
                      )
                    })}
                  </ul>
                )
              ) : (
                // If there are no pending requests, show this message.
                <div className="text-center py-4 text-gray-500">
                  <p>No pending connection requests.</p>
                </div>
              )}
            </div>

            {/* Display Accepted Connections */}
             <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Accepted Connections</h2>
              {isLoadingProfiles ? <p className="text-gray-400">Loading profile info...</p> : (
                acceptedConnections.length > 0 ? (
                  <ul className="space-y-3">
                    {acceptedConnections.map(conn => {
                      const otherUserId = conn.userIds.find(id => id !== currentUser.uid);
                      const profile = connectionProfiles.get(otherUserId);
                      return (
                        <li key={conn.id} className="bg-gray-700/50 p-4 rounded-lg">
                            {/* --- MODIFIED --- */}
                            <span className="font-semibold">{profile?.displayName || 'Connected User'} - {profile?.email}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-400">You haven't connected with any users yet.</p>
                )
              )}
            </div>
        </div>
    );
};

export default ConnectionsPage;