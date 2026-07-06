import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/exo-2/400.css';
import '@fontsource/exo-2/500.css';
import '@fontsource/exo-2/600.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const domNode = document.getElementById('root');
if (domNode) {
    const root = createRoot(domNode);
    root.render(<App />);
}
