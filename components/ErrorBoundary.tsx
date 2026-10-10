import React, { ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#4c1d95] text-white">
          <div className="text-center p-8 max-w-md">
            <h1 className="text-3xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="mb-4 text-lg opacity-90">
              An unexpected error occurred. Please reload the app.
            </p>
            <p className="text-sm opacity-75 mb-6 break-words font-mono">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#FBBF24] hover:bg-[#F59E0B] text-[#4c1d95] font-black uppercase tracking-wider px-8 py-3.5 rounded-full shadow-[0_4px_20px_rgba(251,191,36,0.35)] active:scale-95 transition-all text-sm"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
