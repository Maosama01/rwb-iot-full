import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in widget:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[150px] flex flex-col items-center justify-center p-6 bg-red-50/50 border border-red-100 rounded-2xl text-center animate-fade-in">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-red-800 font-semibold mb-1">
            {this.props.widgetName ? `${this.props.widgetName} failed to load` : 'Something went wrong'}
          </h3>
          <p className="text-red-600/80 text-sm max-w-[200px] truncate">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
