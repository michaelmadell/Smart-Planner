import React from 'react';

/**
 * A simple loading screen component displayed while the app initializes.
 */
const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 w-full">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <p className="mt-4 text-xl text-gray-300">Scheduling...</p>
        </div>
    </div>
);

export default LoadingScreen;
