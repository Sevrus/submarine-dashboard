import { useEffect } from "react";
import { useSubmarineStore } from "./store/useSubmarineStore";
import { Compass } from "./components/Compass";
import { PitchIndicator } from "./components/PitchIndicator";
import { TacticalMap } from "./components/TacticalMap";
import { MjPanel } from "./components/MjPanel";

function App() {
  const { depth, speed, heading, pitch, advanceTime, gameTime } = useSubmarineStore()

  useEffect(() => {
    const interval = setInterval(() => {
      advanceTime(1)
    }, 1000)
    return () => clearInterval(interval)
  }, [advanceTime])

  // --- FORMATAGE DES HORLOGES ---
  const timeDate = new Date(gameTime);

  const gmtTime = timeDate.toLocaleTimeString("fr-FR", {
    timeZone: "UTC",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const frTime = timeDate.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  return (
      <div className="flex h-screen w-full bg-slate-950 text-cyan-50 font-mono overflow-hidden">

        <main className="flex-1 flex flex-col relative">
          <div className="flex-1 relative bg-slate-900 flex items-center justify-center">

            {/* HORLOGES HUD (Superposées sur la carte) */}
            <div className="absolute top-4 left-4 z-[1000] pointer-events-none flex flex-col gap-2">

              <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded flex items-center justify-between gap-4 backdrop-blur-sm shadow-lg">
                <span className="text-xs text-slate-500 font-bold tracking-widest">ZULU (GMT)</span>
                <span className="text-cyan-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                {gmtTime}
              </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded flex items-center justify-between gap-4 backdrop-blur-sm shadow-lg">
                <span className="text-xs text-slate-500 font-bold tracking-widest">PARIS</span>
                <span className="text-slate-300 font-bold text-lg">
                {frTime}
              </span>
              </div>

            </div>

            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20"></div>

            <div className="absolute inset-0">
              <TacticalMap />
            </div>
          </div>

          <div className="h-72 bg-slate-900 border-t border-slate-800 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
            <div className="flex gap-6 h-full">
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                <div className="absolute top-2 left-2 text-xs text-slate-500">PARAMÈTRES GLOBAUX</div>
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

export default App
