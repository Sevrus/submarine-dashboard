import {useEffect, useState} from "react";
import { useSubmarineStore } from "./store/useSubmarineStore";
import { Compass } from "./components/Compass";
import { PitchIndicator } from "./components/PitchIndicator";
import { TacticalMap } from "./components/TacticalMap";
import { MjPanel } from "./components/MjPanel";
import { SonarWaterfall } from "./components/SonarWaterfall";

function App() {
  const { depth, speed, heading, pitch, advanceTime, gameTime, targetDepth } = useSubmarineStore();

  const [activeScreen, setActiveScreen] = useState<"MAP" | "SONAR">("SONAR");

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

  return (
      <div className="flex h-screen w-full bg-slate-950 text-cyan-50 font-mono overflow-hidden">

        <main className="flex-1 flex flex-col relative">

          {/* BARRE D'ONGLETS JOUEURS */}
          <header className="h-10 bg-slate-900 border-b border-slate-800 flex px-4 gap-2 items-end z-20 shrink-0">
            <button
                onClick={() => setActiveScreen('MAP')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${activeScreen === 'MAP' ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-500' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
            >
              CARTE TACTIQUE (TMA)
            </button>
            <button
                onClick={() => setActiveScreen('SONAR')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeScreen === 'SONAR' ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SONAR BANDE LARGE
            </button>
          </header>

          <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
            {/* HORLOGES HUD */}
            <div className="absolute top-4 left-4 z-1000 pointer-events-none flex flex-col gap-2">
              <div className="bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded flex items-center justify-between gap-4 backdrop-blur-sm shadow-lg">
                <span className="text-xs text-slate-500 font-bold tracking-widest">ZULU (GMT)</span>
                <span className="text-cyan-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{gmtTime}</span>
              </div>
            </div>

            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%] z-10 opacity-20"></div>

            {/* AFFICHAGE CONDITIONNEL DE L'ÉCRAN */}
            <div className="absolute inset-0">
              {activeScreen === 'MAP' ? <TacticalMap /> : <SonarWaterfall />}
            </div>
          </div>

          <div className="h-72 bg-slate-900 border-t border-slate-800 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">

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

export default App
