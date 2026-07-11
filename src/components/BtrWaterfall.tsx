import * as React from "react";
import { useEffect, useRef } from "react";
import { useSubmarineStore, getBearing, getDistanceNm } from "../store/useSubmarineStore";

const getThermalColor = (intensity: number) => {
    const i = Math.max(0, Math.min(1, intensity));
    const hue = (1 - i) * 240;
    const lightness = 5 + (i * 45);
    return `hsl(${hue}, 100%, ${lightness}%)`;
}

export function BtrWaterfall() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // On récupère la fonction d'assignation
    const setSelectedBearing = useSubmarineStore(s => s.setSelectedBearing);

    // Gestion du clic sur la chute d'eau
    const isDragging = useRef(false);

    const updateBearing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const bearing = Math.round((y / rect.height) * 360);
        // On s'assure que le cap reste entre 0 et 359°
        setSelectedBearing(Math.max(0, Math.min(359, bearing)));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        isDragging.current = true;
        // Permet de garder le focus sur le canvas même si la souris sort légèrement du cadre
        e.currentTarget.setPointerCapture(e.pointerId);
        updateBearing(e);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging.current) return;
        updateBearing(e);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleDoubleClick = () => {
        setSelectedBearing(null); // Le double-clic efface la piste instantanément
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const TICK_RATE_MS = 50;
        let animationId: number;

        // --- VARIABLES GLOBALES ---
        interface BioContact {
            yPos: number;
            drift: number;
            phase: number;
            life: number;
            maxLife: number;
            baseIntensity: number;
        }
        let biologicals: BioContact[] = [];
        let transientFlash = 0;
        let lastDepth = useSubmarineStore.getState().depth;
        let accumulatedDepthChange = 0;

        // --- BOUCLE DE DESSIN ---
        const drawWaterfall = () => {
            const width = canvas.width;
            const height = canvas.height;

            const state = useSubmarineStore.getState();
            const currentSpeed = state.speed;
            const currentDepth = state.depth;
            // SÉCURITÉ : On s'assure d'avoir un cap valide (par défaut 0)
            const currentHeading = state.heading || 0;

            // Variation de profondeur (Craquements)
            accumulatedDepthChange += Math.abs(currentDepth - lastDepth);
            lastDepth = currentDepth;

            // 1. FLUX HORIZONTAL : On décale l'image
            const imageData = ctx.getImageData(1, 0, width - 1, height);
            ctx.putImageData(imageData, 0, 0);

            // 2. Bruit Propre global (Flow Noise)
            const flowNoiseRatio = Math.max(0, (currentSpeed - 10) / 30);
            const backgroundIntensity = flowNoiseRatio * 0.25;
            ctx.fillStyle = getThermalColor(backgroundIntensity);
            ctx.fillRect(width - 1, 0, 1, height);

            // --- 3. BRUIT AMBIANT ET ZONE D'OMBRE (BAFFLE) ---
            for (let y = 0; y < height; y += 2) {
                const pixelBearing = (y / height) * 360;

                let relativeAngle = Math.abs(pixelBearing - currentHeading);
                if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

                const isInBaffle = relativeAngle > 150;

                if (isInBaffle) {
                    // CORRECTION : L'intensité de base est forcée à 0.45 (Vert brillant)
                    // Elle monte jusqu'à 0.9 (Rouge vif) avec la vitesse.
                    // On retire le fondu sur les bords pour avoir une ligne de démarcation nette.
                    const speedFactor = Math.min(1, currentSpeed / 30);
                    const baffleNoise = 0.45 + (speedFactor * 0.45) + (Math.random() * 0.1);

                    ctx.fillStyle = getThermalColor(baffleNoise);
                    ctx.fillRect(width - 1, y, 1, 2);
                }
                else if (Math.random() > 0.85) {
                    const ambientNoise = Math.random() * 0.15;
                    const turbulenceNoise = Math.random() * flowNoiseRatio * 0.6;
                    ctx.fillStyle = getThermalColor(ambientNoise + turbulenceNoise);
                    const noiseSize = currentSpeed > 25 && Math.random() > 0.5 ? 2 : 1;
                    ctx.fillRect(width - 1, y, 1, noiseSize);
                }
            }
            // --------------------------------------------------

            // 4. Bruits Transitoires
            if (accumulatedDepthChange >= 0.5) {
                if (Math.random() < 0.35) transientFlash = 0.6 + Math.random() * 0.4;
                accumulatedDepthChange = 0;
            } else if (Math.random() < 0.0003) {
                transientFlash = 0.4 + Math.random() * 0.4;
            }

            if (transientFlash > 0) {
                for (let y = 0; y < height; y += 3) {
                    if (Math.random() < transientFlash) {
                        ctx.fillStyle = getThermalColor(transientFlash);
                        ctx.fillRect(width - 1, y, 1 + Math.random() * 2, 1);
                    }
                }
                transientFlash = Math.max(0, transientFlash - 0.25);
            }

            // 5. Contacts (Militaires)
            state.contacts.forEach(contact => {
                const dist = getDistanceNm(state.position, contact.position);
                if (dist > state.sensorRange) return;

                const trueBearing = getBearing(state.position, contact.position);

                let relativeAngle = Math.abs(trueBearing - currentHeading);
                if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;
                // Le contact est dans notre cône arrière de 60° : il est physiquement ignoré
                if (relativeAngle > 150) return;

                const baseNoise = contact.speed / 35;
                const proximityBonus = 1 - (dist / state.sensorRange);
                const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                if (intensity < 0.2) return;

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

            // 6. Écosystème Biologique
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

                const pixelBearing = (bio.yPos / height) * 360;
                let relativeAngle = Math.abs(pixelBearing - currentHeading);
                if (relativeAngle > 180) relativeAngle = 360 - relativeAngle;

                // La baleine n'est dessinée que si elle n'est pas dans le Baffle
                if (relativeAngle <= 150) {
                    const lifeRatio = bio.life / bio.maxLife;
                    const fadeMultiplier = Math.sin(lifeRatio * Math.PI);
                    const pulse = (Math.sin(bio.phase * 0.5) + 1) / 2;
                    const finalIntensity = bio.baseIntensity * fadeMultiplier * pulse;

                    if (finalIntensity > 0.05) {
                        const bioWidth = 2 + Math.random() * 2;
                        ctx.fillStyle = getThermalColor(finalIntensity * 0.7);
                        ctx.fillRect(width - 1, Math.round(bio.yPos) - Math.floor(bioWidth / 2), 1, bioWidth);
                    }
                }

                return bio.life < bio.maxLife;
            });

            // 7. Ligne de sélection
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
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onDoubleClick={handleDoubleClick}
                    width={720}
                    height={500}
                    // La classe touch-none évite que la page scroll si tu joues sur tablette
                    className="w-full h-full absolute inset-0 mix-blend-screen cursor-crosshair touch-none"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Ligne de balayage lumineuse placée tout à DROITE */}
                <div className="absolute top-0 right-0 w-px h-full bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10 pointer-events-none"></div>

                {/* Indication des commandes (désactivée pour les clics via pointer-events-none) */}
                <div className="absolute bottom-2 right-2 text-[10px] text-slate-500/80 font-bold bg-slate-900/80 px-2 py-1 rounded border border-slate-800 pointer-events-none shadow-lg backdrop-blur-sm">
                    GLISSER : DÉPLACER LA PISTE | DOUBLE-CLIC : EFFACER
                </div>
            </div>
        </div>
    );
}
