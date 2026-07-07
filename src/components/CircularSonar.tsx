import { useEffect, useRef } from 'react';
import { useSubmarineStore, getBearing, getDistanceNm } from '../store/useSubmarineStore';

export function CircularSonar() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let sweepAngle = 0; // Le balayage purement visuel

        const draw = () => {
            // Pour éviter le flou, on utilise les vraies dimensions du canvas
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;
            const centerX = width / 2;
            const centerY = height / 2;
            // Le rayon s'adapte à la taille de la boîte (avec une petite marge)
            const radius = Math.min(centerX, centerY) - 20;

            // 1. Fond noir absolu
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);

            // 2. Cercles de repère (purement décoratifs sur un panoramique)
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 4; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * (i / 4), 0, Math.PI * 2);
                ctx.stroke();
            }

            // 3. Réticule (Croix)
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius);
            ctx.lineTo(centerX, centerY + radius);
            ctx.moveTo(centerX - radius, centerY);
            ctx.lineTo(centerX + radius, centerY);
            ctx.stroke();

            const state = useSubmarineStore.getState();
            const { isBlind } = state.getSonarStatus();
            const subHeading = state.heading;

            // 4. Dessin des signaux acoustiques
            if (!isBlind) {
                state.contacts.forEach(contact => {
                    const dist = getDistanceNm(state.position, contact.position);
                    if (dist > state.sensorRange) return;

                    // Calcul du volume (Intensité) - Le même que pour le LOFAR
                    const baseNoise = contact.speed / 35;
                    const proximityBonus = 1 - (dist / state.sensorRange);
                    const intensity = Math.min(1, (baseNoise * 0.7) + (proximityBonus * 0.4) + 0.15);

                    if (intensity < 0.2) return;

                    // Calcul du Cap Relatif (La Proue est à 0)
                    const trueBearing = getBearing(state.position, contact.position);
                    const relativeBearing = trueBearing - subHeading;

                    // Conversion en Radians pour le Canvas (-90° car le 0 du canvas est à droite/Est)
                    const angleRad = (relativeBearing - 90) * (Math.PI / 180);

                    // Plus le bruit est fort, plus le trait est long et s'approche du bord
                    const lineLength = radius * intensity;

                    // Trace lumineuse (Le trait qui indique la direction)
                    ctx.strokeStyle = `rgba(34, 211, 238, ${intensity})`;
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(34, 211, 238, 0.8)'; // Effet néon

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(centerX + Math.cos(angleRad) * lineLength, centerY + Math.sin(angleRad) * lineLength);
                    ctx.stroke();

                    ctx.shadowBlur = 0; // Réinitialisation
                });
            } else {
                // Brouillage complet de l'écran central si on est aveugle
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // 5. La "Sweep" Visuelle (Le balayage)
            sweepAngle += 0.03; // Vitesse de rotation

            // Le cône de lumière qui balaye
            ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, sweepAngle, sweepAngle + 0.5);
            ctx.closePath();
            ctx.fill();

            // La ligne de crête du balayage
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(sweepAngle + 0.5) * radius, centerY + Math.sin(sweepAngle + 0.5) * radius);
            ctx.stroke();

            animationId = requestAnimationFrame(draw);
        };

        // On force un premier redimensionnement propre
        setTimeout(() => {
            animationId = requestAnimationFrame(draw);
        }, 100);

        return () => cancelAnimationFrame(animationId);
    }, []);

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-950 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {/* Indicateur fixe de la Proue */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-500 bg-slate-900/80 px-2 py-1 rounded shadow-lg border border-cyan-900/50 backdrop-blur-sm z-10">
                PROUE (0°)
            </div>
        </div>
    );
}
