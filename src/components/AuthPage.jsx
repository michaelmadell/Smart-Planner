import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Component for user login and sign-up.
 */
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const db = getFirestore();

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                toast.error(`Login Failed: ${error.message}`);
            }
        } else {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const profileRef = doc(db, "profiles", user.uid);
                await setDoc(profileRef, {
                    email: user.email.toLowerCase(),
                    displayName: user.email.split('@')[0],
                });
            } catch (error) {
                toast.error(`Sign up failed: ${error.message}`);
            }
        }
    };

    return (
        <div className="w-full flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="mt-2 text-gray-400">{isLogin ? 'Sign in to continue' : 'Get started'}</p>
                </div>
                <form className="space-y-6" onSubmit={handleAuthAction}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                    <button type="submit" className="w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        {isLogin ? <><LogIn size={20} /> Sign In</> : <><UserPlus size={20} /> Sign Up</>}
                    </button>
                </form>
                <div className="text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-400 hover:underline">
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
