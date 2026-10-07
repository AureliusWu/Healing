import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ReadingOverlayOpacity } from './ReadingOverlayOpacity';
import './styles.css';
import './fullscreen-reading.css';
import { pwa } from './pwa';

createRoot(document.getElementById('root')!).render(<React.StrictMode><><App /><ReadingOverlayOpacity /></></React.StrictMode>);

pwa.start();
