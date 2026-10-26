import React from 'react';

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (!this.state.failed) return this.props.children;
        return <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
            <h1>TIGHT could not display this screen</h1>
            <p>Reload to reconnect to the host. Check the game before repeating any recent actions.</p>
            <button onClick={() => window.location.reload()}>Reload TIGHT</button>
        </main>;
    }
}
