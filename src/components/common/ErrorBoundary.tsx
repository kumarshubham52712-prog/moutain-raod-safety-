import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 my-4 bg-red-950/20 border border-red-500/30 rounded-xl text-center shadow-glow-red max-w-2xl mx-auto animate-fade-in">
          <div className="p-3 rounded-full bg-red-500/20 text-red-400 mb-4 animate-pulse-slow">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Component Rendering Failure</h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed max-w-md">
            An error occurred while loading this section of the command center. This could be due to a visualization, leaflet map container, or browser compatibility issue.
          </p>
          {this.state.error && (
            <div className="w-full text-left bg-surface-950 border border-surface-700 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto font-mono text-[10px] text-red-300">
              <span className="font-bold text-red-400">Error:</span> {this.state.error.message}
              {this.state.error.stack && (
                <pre className="mt-1 whitespace-pre-wrap opacity-80">{this.state.error.stack.split('\n').slice(0, 3).join('\n')}</pre>
              )}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all cursor-pointer"
          >
            <RotateCcw size={12} />
            Reset Section & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
