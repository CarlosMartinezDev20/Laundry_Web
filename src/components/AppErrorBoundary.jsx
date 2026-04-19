import React from 'react';
import { Button } from './UI/Button';
import { ArrowsClockwise, Bug } from '@phosphor-icons/react';

export class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-fallback">
          <div className="app-error-fallback-card">
            <div className="app-error-fallback-icon" aria-hidden>
              <Bug size={32} weight="duotone" />
            </div>
            <h1 className="app-error-fallback-title">Something went wrong</h1>
            <p className="app-error-fallback-text">
              The interface hit an unexpected error. You can reload the application to continue. If
              the problem persists, contact your administrator.
            </p>
            <Button type="button" variant="primary" onClick={this.handleReload} className="app-error-fallback-btn">
              <ArrowsClockwise size={18} />
              Reload application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
