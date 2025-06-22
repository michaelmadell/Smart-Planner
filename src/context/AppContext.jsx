import React, { createContext, useContext } from 'react';

// This context will provide global values like the user object and database instance.
const AppContext = createContext(null);

// The Provider component that will wrap our application.
export const AppProvider = ({ children, value }) => {
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// A custom hook to make consuming the context easier and cleaner.
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
};
