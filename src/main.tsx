import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Import vital pour la carte Leaflet
import 'leaflet/dist/leaflet.css'

// Le CSS Tailwind en dessous
import './index.css'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
