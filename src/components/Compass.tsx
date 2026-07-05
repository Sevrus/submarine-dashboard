import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useSubmarineStore } from "../store/useSubmarineStore";

export function Compass() {
    const heading = useSubmarineStore((state) => state.heading);
    const needleRef = useRef(null);
    const cumulativeHeading = useRef(heading);

    useEffect(() => {
        let diff = heading - (cumulativeHeading.current % 360);
        if (diff > 180) diff -= 360
        else if (diff < -180) diff += 360
        cumulativeHeading.current += diff

        gsap.to(needleRef.current, {
            rotation: cumulativeHeading.current,
            duration: 1.5,
            ease: "elastic.out(1, 0.6)",
            transformOrigin: "center center"
        })
    }, [heading])

    return (
        <div className="relative w-32 h-32 rounded-full border-2 border-emerald-800 bg-slate-900 flex items-center justify-center shadow-inner mt-2">
            {/* Repères Cardinaux */}
            <span className="absolute top-1 text-xs font-bold text-emerald-600">N</span>
            <span className="absolute bottom-1 text-xs font-bold text-emerald-600">S</span>
            <span className="absolute right-2 text-xs font-bold text-emerald-600">E</span>
            <span className="absolute left-2 text-xs font-bold text-emerald-600">W</span>

            {/* Aiguille animée */}
            <div ref={needleRef} className="absolute w-full h-full flex flex-col items-center py-2">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-40 border-b-emerald-400"></div>
                <div className="w-3 h-3 bg-slate-950 rounded-full border-2 border-emerald-500 z-10 -my-1.5 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-40 border-t-slate-700"></div>
            </div>
        </div>
    )
}
