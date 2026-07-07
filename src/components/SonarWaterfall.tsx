import { useEffect, useRef } from "react";
import { useSubmarineStore, getBearing, getDistanceNm } from "../store/useSubmarineStore";
import * as React from "react";

const getThermalColor = (intensity: number) => {
    const i = Math.max(0, Math.min(1, intensity));
    const hue = (1 - i) * 240;
    const lightness = 5 + (i * 45);
    return `hsl(${hue}, 100%, ${lightness}%)`;
}

export function SonarWaterfall() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // On récupère la fonction d'assignation
    const setSelectedBearing = useSubmarineStore(s => s.setSelectedBearing);

    // Gestion du clic sur la chute d'eau
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        // On calcule la position Y relative du clic
        const y = e.clientY - rect.top;
        // On la convertit en degrés (0 à 360)
        const clickedBearing = Math.round((y / rect.height) * 360);

        // Si on clique sur un cap qu'on traquait déjà, ça le désélectionne
        const currentBearing = useSubmarineStore.getState().selectedBearing;
        setSelectedBearing(currentBearing === clickedBearing ? null : clickedBearing);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const TICK_RATE_MS = 50;
        let animationId: number;

        const drawWaterfall = () => {
            const width = canvas.width;
            const height = canvas.height;

            // 1. FLUX HORIZONTAL : On décale l'image d'un pixel vers la GAUCHE
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            ctx.putImageData(imageData, 0, 0);

            // 2. Fond noir sur la nouvelle colonne (tout à droite)
            ctx.fillStyle = "#000000";
            ctx.fillRect(width - 1, 0, 1, height);

            // 3. Bruit de fond marin sur la hauteur (axe Y)
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.85) {
                    const noiseIntensity = Math.random() * 0.15;
                    ctx.fillStyle = getThermalColor(noiseIntensity);
                    // On dessine le pixel sur la dernière colonne à droite
                    ctx.fillRect(width - 1, y, 1, 1);
                }
            }

            const state = useSubmarineStore.getState();
            const { isBlind } = state.getSonarStatus();

            // 4. Dessiner les contacts
            if (!isBlind) {
                state.contacts.forEach(contact => {
                    const dist = getDistanceNm(state.position, contact.position);
                    if (dist > state.sensorRange) return;

                    const baseNoise = contact.speed / 35;
                    const proximityBonus = 1 - (dist / state.sensorRange);
                    const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                    if (intensity < 0.2) return;

                    const trueBearing = getBearing(state.position, contact.position);
                    // L'axe des caps est maintenant VERTICAL (Y)
                    const yPos = Math.round((trueBearing / 360) * height);

                    // L'épaisseur du signal de base
                    const signalWidth = Math.max(1, Math.floor(contact.speed / 5));

                    // Halo acoustique (Le bruit de fond de l'écoulement de l'eau)
                    if (intensity > 0.4) {
                        ctx.fillStyle = getThermalColor(intensity * 0.4);
                        ctx.fillRect(width - 1, yPos - signalWidth * 2, 1, signalWidth * 4);
                    }

                    // Les "Rails" / Harmoniques d'hélice (Sidebands)
                    // L'écartement dépend directement de la vitesse (vitesse de rotation)
                    const railOffset = Math.max(3, Math.floor(contact.speed / 2.5));

                    // Un navire à l'arrêt complet (0 nds) ne génère pas de sidebands d'hélice
                    if (contact.speed > 0 && intensity > 0.3) {
                        ctx.fillStyle = getThermalColor(intensity * 0.85); // Presque aussi chaud que le centre
                        // Rail supérieur
                        ctx.fillRect(width - 1, yPos - railOffset, 1, 1);
                        // Rail inférieur
                        ctx.fillRect(width - 1, yPos + railOffset, 1, 1);
                    }

                    // 3. Trace centrale (Cœur de chauffe de la machinerie)
                    ctx.fillStyle = getThermalColor(intensity);
                    ctx.fillRect(width - 1, yPos - Math.floor(signalWidth / 2), 1, Math.max(1, signalWidth));
                });
            } else {
                // 5. Brouillage (Cavitation) sur la colonne de droite
                for (let y = 0; y < height; y += 4) {
                    if (Math.random() > 0.5) {
                        const noiseIntensity = 0.6 + (Math.random() * 0.4);
                        ctx.fillStyle = getThermalColor(noiseIntensity);
                        // Des "blocs" de bruit verticaux
                        ctx.fillRect(width - 1, y, 1, 4);
                    }
                }
            }

            // Dessin de la ligne de sélection (Tracker) sur le LOFAR
            if (state.selectedBearing !== null) {
                const yPos = Math.round((state.selectedBearing / 360) * height);
                // Ligne jaune semi-transparente sur toute la largeur
                ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
                ctx.fillRect(0, yPos, width, 1);
            }

            setTimeout(() => {
                animationId = requestAnimationFrame(drawWaterfall);
            }, TICK_RATE_MS);
        };

        animationId = requestAnimationFrame(drawWaterfall);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-950 flex flex-row border border-slate-800">

            {/* Réglette d'azimut VERTICALE à gauche */}
            <div className="w-10 h-full bg-slate-950 border-r border-slate-800 flex relative text-[10px] text-slate-500 font-bold overflow-hidden select-none shrink-0">
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                    <div key={deg} className="absolute w-full flex items-center justify-between px-1" style={{ top: `${(deg / 360) * 100}%`, transform: 'translateY(-50%)' }}>
                        <span>{deg.toString().padStart(3, '0')}</span>
                        <div className="w-2 h-px bg-slate-700"></div>
                    </div>
                ))}
            </div>

            {/* L'écran principal du Sonar */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    width={720}
                    height={500}
                    className="w-full h-full absolute inset-0 mix-blend-screen"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Ligne de balayage lumineuse placée tout à DROITE */}
                <div className="absolute top-0 right-0 w-px h-full bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"></div>
            </div>
        </div>
    );
}
