import { useEffect, useRef } from "react";
import { useSubmarineStore, getBearing, getDistanceNm } from "../store/useSubmarineStore";

const getThermalColor = (intensity: number) => {
    const i = Math.max(0, Math.min(1, intensity));
    const hue = (1 - i) * 240;
    const lightness = 5 + (i * 45);
    return `hsl(${hue}, 100%, ${lightness}%)`;
}

export function NarrowbandDisplay() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // On récupère le cap ciblé par le joueur sur le BTR
    const selectedBearing = useSubmarineStore(s => s.selectedBearing);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const TICK_RATE_MS = 50;
        let animationId: number;

        const drawNarrowband = () => {
            const width = canvas.width;
            const height = canvas.height;
            const state = useSubmarineStore.getState();

            // 1. DÉFILEMENT VERTICAL : On copie tout et on décale d'un pixel vers le BAS
            const imageData = ctx.getImageData(0, 0, width, height - 1);
            ctx.putImageData(imageData, 0, 1);

            // 2. Nouvelle ligne au T=0 (Tout en haut)
            const currentSpeed = state.speed;
            const flowNoiseRatio = Math.max(0, (currentSpeed - 10) / 30);
            const backgroundIntensity = flowNoiseRatio * 0.2;

            ctx.fillStyle = getThermalColor(backgroundIntensity);
            ctx.fillRect(0, 0, width, 1);

            // 3. Parasites aléatoires sur le spectre des fréquences
            for (let x = 0; x < width; x += 2) {
                if (Math.random() > 0.85) {
                    const noise = Math.random() * 0.15 + (Math.random() * flowNoiseRatio * 0.5);
                    ctx.fillStyle = getThermalColor(noise);
                    ctx.fillRect(x, 0, 1, 1);
                }
            }

            // 4. Analyse du contact (si on traque un cap précis)
            if (state.selectedBearing !== null) {
                const target = state.contacts.find(contact => {
                    const trueBearing = getBearing(state.position, contact.position);
                    let diff = Math.abs(trueBearing - state.selectedBearing!);
                    if (diff > 180) diff = 360 - diff;
                    return diff < 3;
                });

                if (target && target.signature) {
                    const dist = getDistanceNm(state.position, target.position);
                    if (dist <= state.sensorRange) {
                        const baseNoise = target.speed / 35;
                        const proximityBonus = 1 - (dist / state.sensorRange);
                        const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                        if (intensity > 0.2) {
                            // 1. FRÉQUENCE FONDAMENTALE (Le réacteur/moteur)
                            // On place la trace exactement sur les Hertz correspondants (0 à 1000Hz)
                            const baseFreqX = Math.round((target.signature.baseFreq / 1000) * width);

                            ctx.fillStyle = getThermalColor(intensity);
                            ctx.fillRect(baseFreqX, 0, 2, 1); // Trace centrale forte

                            // 2. LE BLADE RATE (Fréquence de rotation de l'hélice)
                            if (target.speed > 0) {
                                // Formule de simulation : L'écart dépend de la vitesse ET du nombre de pales
                                // Plus il y a de pales, plus les harmoniques sont resserrées à vitesse égale
                                const bladeRateOffset = Math.max(3, Math.floor((target.speed * 10) / target.signature.bladeCount));

                                // Première harmonique (Les rails principaux)
                                ctx.fillStyle = getThermalColor(intensity * 0.85);
                                ctx.fillRect(baseFreqX - bladeRateOffset, 0, 1, 1);
                                ctx.fillRect(baseFreqX + bladeRateOffset, 0, 1, 1);

                                // Deuxième harmonique (Plus discrète, si le signal est fort)
                                if (intensity > 0.5) {
                                    ctx.fillStyle = getThermalColor(intensity * 0.5);
                                    ctx.fillRect(baseFreqX - (bladeRateOffset * 2), 0, 1, 1);
                                    ctx.fillRect(baseFreqX + (bladeRateOffset * 2), 0, 1, 1);
                                }
                            }
                        }
                    }
                }
            }

            setTimeout(() => {
                animationId = requestAnimationFrame(drawNarrowband);
            }, TICK_RATE_MS);
        };

        animationId = requestAnimationFrame(drawNarrowband);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col border border-slate-800">
            {/* HUD Status */}
            <div className="absolute top-8 left-2 z-10 bg-slate-900/80 px-2 py-1 border border-slate-700 text-[10px] text-cyan-500 font-bold tracking-widest backdrop-blur-sm shadow">
                LOFAR NARROWBAND {selectedBearing !== null ? `// TRACKING BRG ${selectedBearing.toString().padStart(3, "0")} //` : "// NO BEARING ASSIGNED //"}
            </div>

            {/* Axe X (Réglette des Fréquences) */}
            <div className="w-full h-6 bg-slate-950 border-b border-slate-800 flex relative text-[10px] text-slate-500 font-bold overflow-hidden select-none shrink-0">
                {[0, 200, 400, 600, 800, 1000].map(hz => (
                    <div key={hz} className="absolute h-full flex flex-col items-center justify-start py-0.5" style={{ left: `${(hz / 1000) * 100}%`, transform: "translateX(-50%)" }}>
                        <span>{hz}Hz</span>
                        <div className="w-px h-2 bg-slate-700"></div>
                    </div>
                ))}
            </div>

            {/* Chute d'eau */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={300}
                    className="w-full h-full absolute inset-0 mix-blend-screen"
                    style={{ imageRendering: "pixelated" }}
                />
                {/* Ligne de scan temporelle placée tout en HAUT */}
                <div className="absolute top-0 left-0 w-full h-px bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"></div>
            </div>
        </div>
    );
}
