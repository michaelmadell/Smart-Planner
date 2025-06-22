import React from "react";
import { useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';

const GoogleCalendarLink = ({ user }) => {
    // In a real app, you would fetch this status from your database
    const [isLinked, setIsLinked] = useState(false); 
    const [error, setError] = useState(null);

    const login = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            console.log('Auth code received:', codeResponse.code);
            setError(null);
            
            try {
              const functions = getFunctions();
              const exchangeTokenFn = httpsCallable(functions, 'exchangeToken');

              const result = await exchangeTokenFn({ code: codeResponse.code });

              console.log(result.data);
              setIsLinked(true);
              toast.success("Account Linked Successfully!");
            } catch (err) {
              console.error("Error calling exchangeToken function:", err);
              setError("Failed to link account on server. Please try again.");
            }
        },
        onError: () => {
            setError("Failed to link Google Account. Please try again.");
            console.error("Google Login Failed");
        },
        // This flow is required to get the one-time code for your server
        flow: 'auth-code',
        // This scope allows your app to create and manage events
        scope: 'https://www.googleapis.com/auth/calendar.events',
    });

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Integrations</h3>
            <div className="flex items-center gap-4">
                <svg className="w-8 h-8" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A652" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                <div>
                    <h4 className="font-semibold text-lg">Google Calendar</h4>
                    {isLinked ? 
                        <p className="text-sm text-green-400">Account Linked</p> :
                        <p className="text-sm text-gray-400">Not Linked</p>
                    }
                </div>
                {!isLinked && (
                    <button 
                        onClick={() => login()}
                        className="ml-auto px-4 py-2 bg-white text-gray-800 font-semibold rounded-lg text-sm"
                    >
                        Link Account
                    </button>
                )}
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
    );
}

export default GoogleCalendarLink;