import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import SessionGate from './SessionGate';
import NativeHosting from './NativeHosting';

const domNode = document.getElementById('root');
if (domNode) {
    const root = createRoot(domNode);
    root.render(
        <ErrorBoundary>
            <SessionGate>
                <NativeHosting>
                    <App />
                </NativeHosting>
            </SessionGate>
        </ErrorBoundary>,
    );
}

if (process.env.NODE_ENV !== 'production' && module?.hot) {
    module.hot.accept();
}
