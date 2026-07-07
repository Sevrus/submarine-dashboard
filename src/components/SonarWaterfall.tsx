import { useEffect, useRef } from 'react';
import { useSubmarineStore, getBearing, getDistanceNm } from '../store/useSubmarineStore';

const getThermalColor = (intensity: number) => {
    const i = Math.max(0, Math.min(1, intensity));
    const hue = (1 - i) * 240;
    const lightness = 5 + (i * 45);
    return `hsl(${hue}, 100%, ${lightness}%)`;
}

export function SonarWaterfall() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

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

            const imageData = ctx.getImageData(0, 0, width, height - 1);
            ctx.putImageData(imageData, 0, 1);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, 1);

            for (let x = 0; x < width; x += 2) {
                if (Math.random() > 0.85) {
                    const noiseIntensity = Math.random() * 0.15;
                    ctx.fillStyle = getThermalColor(noiseIntensity);
                    ctx.fillRect(x, 0, 1, 1);
                }
            }

            const state = useSubmarineStore.getState();
            const { isBlind } = state.getSonarStatus();

            if (!isBlind) {
                state.contacts.forEach(contact => {
                    const dist = getDistanceNm(state.position, contact.position);
                    if (dist > state.sensorRange) return;

                    const baseNoise = contact.speed / 35;
                    const proximityBonus = 1 - (dist / state.sensorRange);
                    const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                    if (intensity < 0.2) return;

                    const trueBearing = getBearing(state.position, contact.position);
                    const xPos = Math.round((trueBearing / 360) * width);

                    const signalWidth = Math.max(1, Math.floor(contact.speed / 4));

                    if (intensity > 0.4) {
                        ctx.fillStyle = getThermalColor(intensity * 0.6);
                        ctx.fillRect(xPos - signalWidth, 0, signalWidth * 2, 1);
                    }

                    ctx.fillStyle = getThermalColor(intensity);
                    ctx.fillRect(xPos - Math.floor(signalWidth / 2), 0, signalWidth, 1);
                });
            }

            setTimeout(() => {
                animationId = requestAnimationFrame(drawWaterfall);
            }, TICK_RATE_MS);
        };

        animationId = requestAnimationFrame(drawWaterfall);
        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="relative w-full h-full bg-slate-950 flex flex-col border border-slate-800">
            {/* Réglette d'azimut en haut */}
            <div className="h-6 bg-slate-950 border-b border-slate-800 flex relative text-[10px] text-slate-500 font-bold overflow-hidden select-none">
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                    <div key={deg} className="absolute top-1 flex flex-col items-center -ml-2" style={{ left: `${(deg / 360) * 100}%` }}>
                        <span>{deg.toString().padStart(3, '0')}</span>
                        <div className="h-1 w-px bg-slate-700 mt-0.5"></div>
                    </div>
                ))}
            </div>

            {/* L'écran principal du Sonar */}
            <div className="flex-1 relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={720}
                    height={500}
                    className="w-full h-full absolute inset-0 mix-blend-screen"
                    style={{ imageRendering: 'pixelated' }}
                />
                {/* Ligne de balayage lumineuse pour marquer le "Temps Réel" (en haut) */}
                <div className="absolute top-0 left-0 w-full h-px bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"></div>
            </div>
        </div>
    );
}
