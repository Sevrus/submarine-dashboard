import { useEffect } from "react";
import { useSubmarineStore } from "./store/useSubmarineStore";
import { Compass } from "./components/Compass";
import { PitchIndicator } from "./components/PitchIndicator";
import { TacticalMap } from "./components/TacticalMap";
import { MjPanel } from "./components/MjPanel";
import { BtrWaterfall } from "./components/BtrWaterfall.tsx";
import { NarrowbandDisplay } from "./components/NarrowbandDisplay";
import { CircularSonar } from "./components/CircularSonar";

function App() {
  const { depth, speed, heading, pitch, advanceTime, targetDepth } = useSubmarineStore()

  useEffect(() => {
    const interval = setInterval(() => {
      advanceTime(1)
    }, 1000)
    return () => clearInterval(interval)
  }, [advanceTime])

  // const gmtTime = new Date(gameTime).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" })

  return (
      <div className="flex h-screen w-full bg-slate-950 text-cyan-50 font-mono overflow-hidden">

        <main className="flex-1 flex flex-col relative">

          {/* ZONE D'AFFICHAGE TACTIQUE (Split 70/30) */}
          <div className="flex-1 relative flex flex-row">

            {/* ... HUD ZULU TIME ... */}

            {/* PARTIE GAUCHE : 70% SONARS ACOUSTIQUES */}
            <div className="w-[70%] h-full relative border-r border-slate-800 flex flex-col">
              {/* HAUT : Le BTR (Vue spatiale 360°) */}
              <div className="h-[65%] border-b border-slate-800">
                <BtrWaterfall />
              </div>

              {/* BAS : Le LOFAR (Vue Fréquences) */}
              <div className="h-[35%] bg-slate-900">
                <NarrowbandDisplay />
              </div>
            </div>

            {/* PARTIE DROITE : 30% STACKED (Panoramique + TMA) */}
            <div className="w-[30%] h-full flex flex-col">
              <div className="h-[50%] relative border-b border-slate-800">
                <CircularSonar />
              </div>
              <div className="h-[50%] relative bg-slate-900">
                <TacticalMap />
              </div>
            </div>

            {/* Effet Scanline Global */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%] z-10 opacity-10"></div>
          </div>

          <div className="h-72 bg-slate-900 border-t border-slate-800 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 shrink-0">

            <div className="flex gap-6 h-full">
              {/* Bloc Profondeur & Vitesse */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                <div className="absolute top-2 left-2 text-xs text-slate-500">PARAMÈTRES GLOBAUX</div>

                {/* Indicateur d'Autopilote */}
                {useSubmarineStore().targetDepth !== null && (
                    <div className="absolute top-2 right-2 text-[10px] font-bold text-amber-500 animate-pulse border border-amber-500/50 px-1 rounded">
                      AUTO: {targetDepth}m
                    </div>
                )}

                <div className="text-4xl text-cyan-400 font-bold mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                  {depth} <span className="text-lg text-cyan-800">m</span>
                </div>
                <div className="text-2xl text-cyan-600 font-bold">
                  {speed} <span className="text-sm text-cyan-800">nds</span>
                </div>
              </div>

              <div className="flex-[1.5] bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative">
                <div className="absolute top-2 left-2 text-xs text-slate-500">NAVIGATION</div>
                <div className="text-5xl text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                  {heading}°
                </div>
                <Compass />
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative">
                <div className="absolute top-2 left-2 text-xs text-slate-500">ASSIETTE</div>
                <div className="text-4xl text-amber-500 font-bold drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                  {pitch > 0 ? `+${pitch}` : pitch}°
                </div>
                <PitchIndicator />
              </div>
            </div>
          </div>
        </main>

        <MjPanel />
      </div>
  )
}

export default App;
