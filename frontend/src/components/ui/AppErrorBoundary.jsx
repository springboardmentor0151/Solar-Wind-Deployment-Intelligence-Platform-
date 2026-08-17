import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep the UI recoverable while still exposing the error to the browser console.
    console.error("Unhandled frontend error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-navy-800 bg-navy-900 p-6 text-center shadow-popover">
          <h1 className="text-base font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-navy-600">
            The application hit an unexpected error. Your data was not changed by this screen.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-navy-950 hover:bg-brand-400"
          >
            Reload application
          </button>
        </div>
      </div>
    );
  }
}
