import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsAuthReady(true);
        });

        // This handles the custom token sign-in if available
        (async () => {
            if (auth && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } catch (error) {
                    console.error("Custom token sign-in error:", error);
                }
            }
        })();

        return () => unsubscribe();
    }, []);

    return { user, isAuthReady };
};