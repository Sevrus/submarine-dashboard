import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useSubmarineStore } from "../store/useSubmarineStore";

export function PitchIndicator() {
    const pitch = useSubmarineStore((state) => state.pitch)
    const subRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        gsap.to(subRef.current, {
            rotation: -pitch,
            duration: 1.2,
            ease: "power2.out",
            transformOrigin: "center center"
        })
    }, [pitch])

    return (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden mt-2">
            {/* Ligne d'horizon fixe (Zéro absolu) */}
            <div className="absolute w-full h-px bg-amber-800/50 border-t border-dashed border-amber-900/50"></div>

            {/* Repères visuels */}
            <div className="absolute left-2 top-2 text-[10px] text-amber-800/70">+30°</div>
            <div className="absolute left-2 bottom-2 text-[10px] text-amber-800/70">-30°</div>

            {/* Profil du sous-marin animé */}
            <svg
                ref={subRef}
                viewBox="0 0 100 40"
                className="w-24 h-auto text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] z-10"
                fill="currentColor"
            >
                {/* Coque principale */}
                <rect x="15" y="15" width="70" height="10" rx="5" />
                {/* Kiosque (Massif) */}
                <rect x="60" y="5" width="15" height="10" rx="2" />
                {/* Barres de plongée (Gouvernail arrière) */}
                <path d="M 15 15 L 5 20 L 15 25 Z" />
                {/* Ligne d'eau sur la coque */}
                <line x1="20" y1="20" x2="80" y2="20" stroke="#0f172a" strokeWidth="1" />
            </svg>
        </div>
    )
}
