import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * A class component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: error };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service here.
        console.error("Uncaught error in a component:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="m-8 p-6 bg-gray-800 rounded-2xl border border-red-500/30 flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={48} className="text-red-400 mb-4" />
                    <h1 className="text-2xl font-bold text-red-400">Something went wrong.</h1>
                    <p className="text-gray-400 mt-2">
                        Please try refreshing the page. This error has been logged.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;