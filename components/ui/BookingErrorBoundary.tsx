import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * BookingErrorBoundary — local error boundary for the CarBookingWizard.
 * Catches any runtime error in the booking flow and shows a safe fallback UI
 * instead of a blank screen. Design is consistent with DR7 dark theme.
 */
class BookingErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BookingErrorBoundary] Errore nel wizard di prenotazione:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Errore temporaneo</h2>
            <p className="text-gray-400 text-sm mb-6">
              Si è verificato un problema nel modulo di prenotazione. Riprova o contattaci via WhatsApp.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                Riprova
              </button>
              <a
                href="https://wa.me/393457905205"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors text-sm"
              >
                Contattaci su WhatsApp
              </a>
              <button
                onClick={() => window.location.href = '/'}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Torna alla home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default BookingErrorBoundary;
