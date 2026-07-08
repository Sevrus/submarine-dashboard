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

        // Gestion de la faune marine (Biologiques)
        interface BioContact {
            yPos: number;
            drift: number;        // Vitesse de dérive (ondulation)
            phase: number;        // Pour faire pulser le son (onde sinusoïdale)
            life: number;         // Temps à vivre
            maxLife: number;      // Durée de vie totale pour le fondu (fade in/out)
            baseIntensity: number;
        }
        let biologicals: BioContact[] = [];

        const drawWaterfall = () => {
            const width = canvas.width;
            const height = canvas.height;

            // ON RÉCUPÈRE L'ÉTAT PLUS TÔT POUR AVOIR LA VITESSE DU SOUS-MARIN
            const state = useSubmarineStore.getState();
            const currentSpeed = state.speed;

            // 1. FLUX HORIZONTAL : On décale l'image d'un pixel vers la GAUCHE
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            ctx.putImageData(imageData, 0, 0);

            // NOUVEAU : Calcul du Bruit Propre (Flow Noise)
            // L'eau commence à saturer les hydrophones au-delà de 10 nœuds.
            // À 40 nœuds, le ratio est de 1.0 (saturation maximale).
            const flowNoiseRatio = Math.max(0, (currentSpeed - 10) / 30);

            // 2. Fond de la nouvelle colonne (tout à droite)
            // Le silence complet (noir) laisse place à un fond "chaud" à haute vitesse
            const backgroundIntensity = flowNoiseRatio * 0.25;
            ctx.fillStyle = getThermalColor(backgroundIntensity);
            ctx.fillRect(width - 1, 0, 1, height);

            // 3. Bruit de fond marin + Turbulences d'eau sur la coque
            for (let y = 0; y < height; y += 2) {
                if (Math.random() > 0.85) {
                    const ambientNoise = Math.random() * 0.15;
                    const turbulenceNoise = Math.random() * flowNoiseRatio * 0.6;
                    const totalNoiseIntensity = ambientNoise + turbulenceNoise;

                    ctx.fillStyle = getThermalColor(totalNoiseIntensity);
                    const noiseSize = currentSpeed > 25 && Math.random() > 0.5 ? 2 : 1;
                    ctx.fillRect(width - 1, y, 1, noiseSize);
                }
            }

            // 4. Dessiner les contacts (Plus de condition isBlind, la physique masque naturellement les signaux)
            state.contacts.forEach(contact => {
                const dist = getDistanceNm(state.position, contact.position);
                if (dist > state.sensorRange) return;

                const baseNoise = contact.speed / 35;
                const proximityBonus = 1 - (dist / state.sensorRange);
                const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                if (intensity < 0.2) return;

                const trueBearing = getBearing(state.position, contact.position);
                const yPos = Math.round((trueBearing / 360) * height);
                const signalWidth = Math.max(1, Math.floor(contact.speed / 5));

                if (intensity > 0.4) {
                    ctx.fillStyle = getThermalColor(intensity * 0.4);
                    ctx.fillRect(width - 1, yPos - signalWidth * 2, 1, signalWidth * 4);
                }

                const railOffset = Math.max(3, Math.floor(contact.speed / 2.5));
                if (contact.speed > 0 && intensity > 0.3) {
                    ctx.fillStyle = getThermalColor(intensity * 0.85);
                    ctx.fillRect(width - 1, yPos - railOffset, 1, 1);
                    ctx.fillRect(width - 1, yPos + railOffset, 1, 1);
                }

                ctx.fillStyle = getThermalColor(intensity);
                ctx.fillRect(width - 1, yPos - Math.floor(signalWidth / 2), 1, Math.max(1, signalWidth));
            });

            // 5. Écosystème Biologique
            if (Math.random() < 0.005) {
                biologicals.push({
                    yPos: Math.random() * height,
                    drift: (Math.random() - 0.5) * 0.5,
                    phase: Math.random() * Math.PI * 2,
                    life: 0,
                    maxLife: 200 + Math.random() * 300,
                    baseIntensity: 0.2 + Math.random() * 0.3
                });
            }

            biologicals = biologicals.filter(bio => {
                bio.life++;
                bio.yPos += Math.sin(bio.phase) * bio.drift;
                bio.phase += 0.05;

                const lifeRatio = bio.life / bio.maxLife;
                const fadeMultiplier = Math.sin(lifeRatio * Math.PI);
                const pulse = (Math.sin(bio.phase * 0.5) + 1) / 2;
                const finalIntensity = bio.baseIntensity * fadeMultiplier * pulse;

                if (finalIntensity > 0.05) {
                    const bioWidth = 2 + Math.random() * 2;
                    ctx.fillStyle = getThermalColor(finalIntensity * 0.7);
                    ctx.fillRect(width - 1, Math.round(bio.yPos) - Math.floor(bioWidth/2), 1, bioWidth);
                }

                return bio.life < bio.maxLife;
            });

            // Dessin de la ligne de sélection (Tracker) sur le LOFAR
            if (state.selectedBearing !== null) {
                const yPos = Math.round((state.selectedBearing / 360) * height);
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
