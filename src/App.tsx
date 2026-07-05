import { useSubmarineStore } from './store/useSubmarineStore'

function App() {
  const { depth, speed, heading } = useSubmarineStore()

  return (
      <div className="flex h-screen w-full bg-slate-950 text-cyan-50 font-mono overflow-hidden">

        {/* =========================================
          ZONE JOUEURS (Dashboard & Carte)
      ========================================= */}
        <main className="flex-1 flex flex-col relative">

          {/* EMPLACEMENT CARTE TACTIQUE */}
          <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20"></div>

            <span className="text-slate-600 border border-slate-700 px-4 py-2 rounded">
            [ Composant Carte Leaflet à venir ]
          </span>
          </div>

          {/* TABLEAU DE BORD (Instruments) */}
          <div className="h-72 bg-slate-900 border-t border-slate-800 p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
            <div className="flex gap-6 h-full">

              {/* Bloc Profondeur & Vitesse */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                <div className="absolute top-2 left-2 text-xs text-slate-500">PARAMÈTRES GLOBAUX</div>
                <div className="text-4xl text-cyan-400 font-bold mb-2">{depth} <span className="text-lg text-cyan-800">m</span></div>
                <div className="text-2xl text-cyan-600">{speed} <span className="text-sm text-cyan-800">nds</span></div>
              </div>

              {/* Bloc Cap & Rose des Vents */}
              <div className="flex-[1.5] bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative">
                <div className="absolute top-2 left-2 text-xs text-slate-500">NAVIGATION</div>
                <div className="text-5xl text-emerald-400 font-bold">{heading}°</div>
                <div className="text-sm text-emerald-800 mt-2">[ Composant Rose des Vents à venir ]</div>
              </div>

              {/* Bloc Assiette */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-center items-center shadow-inner relative">
                <div className="absolute top-2 left-2 text-xs text-slate-500">ASSIETTE</div>
                <div className="text-4xl text-amber-500 font-bold">0°</div>
                <div className="text-sm text-amber-800 mt-2">[ Indicateur d'assiette à venir ]</div>
              </div>

            </div>
          </div>
        </main>

        {/* =========================================
          PANNEAU DE CONTRÔLE
      ========================================= */}
        <aside className="w-96 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-8 overflow-y-auto z-30 shadow-2xl">
          <header className="border-b border-red-900/50 pb-4">
            <h2 className="text-2xl font-bold text-red-500 tracking-wider">PANNEAU DE CONTRÔLE</h2>
            <p className="text-xs text-slate-500 mt-1">Interface d'administration de la session</p>
          </header>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Le Sous-marin</h3>
            <div className="h-32 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 rounded">
              [ Inputs MJ Sous-marin ]
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Contacts Radar / Sonar</h3>
            <div className="h-48 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 rounded">
              [ Liste & Inputs Contacts ]
            </div>
          </section>
        </aside>

      </div>
  )
}

export default App
