import { useSubmarineStore, type Alignment } from "../store/useSubmarineStore";
import * as React from "react";

export function MjPanel() {
    const store = useSubmarineStore()

    const handleAddContact = () => {
        const latOffset = (Math.random() - 0.5) * 0.1
        const lngOffset = (Math.random() - 0.5) * 0.1

        store.addContact({
            name: "Contact Inconnu",
            type: "unknown",
            alignment: "neutre",
            nationality: "Inconnue",
            position: [store.position[0] + latOffset, store.position[1] + lngOffset],
            heading: Math.floor(Math.random() * 360),
            speed: 10,
            depth: 0
        })
    }

    // --- GESTION DU CHANGEMENT D'HEURE ---
    const gmtTimeString = new Date(store.gameTime).toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit"
    })

    // Modification de l'heure
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(":").map(Number)
        if (isNaN(hours) || isNaN(minutes)) return

        const date = new Date(store.gameTime);
        date.setUTCHours(hours, minutes, 0, 0);
        store.setGameTime(date.getTime());
    }

    // Calcul ETA
    const routeDist = store.getRouteDistance();
    let etaString = "--:--";
    if (routeDist > 0 && store.speed > 0) {
        const hoursNeeded = routeDist / store.speed
        const etaMs = store.gameTime + (hoursNeeded * 3600000)
        etaString = new Date(etaMs).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }) + " Z"
    }

    return (
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 shadow-2xl">
            <header className="border-b border-red-900/50 p-6 pb-4 shrink-0">
                <h2 className="text-2xl font-bold text-red-500 tracking-wider">CONTRÔLE MJ</h2>
                <p className="text-xs text-slate-500 mt-1">Interface d'administration tactique</p>
            </header>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8 custom-scrollbar">

                {/* ==================== ORDINATEUR DE BORD ==================== */}
                <section className="flex flex-col gap-3 bg-amber-950/20 p-4 rounded-lg border border-amber-900/50 shadow-inner">
                    <h3 className="text-xs text-amber-500 font-bold uppercase tracking-widest border-b border-amber-900/50 pb-2">NavCom (Calcul de Route)</h3>

                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Waypoints</span>
                        <span className="text-amber-400 font-mono">{store.waypoints.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Distance Totale</span>
                        <span className="text-amber-400 font-mono">{routeDist.toFixed(1)} nm</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">ETA (Heure d'arrivée)</span>
                        <span className="text-amber-400 font-mono font-bold">{etaString}</span>
                    </div>

                    <p className="text-[9px] text-slate-500 italic mt-1">Clic gauche sur la carte pour tracer une route.</p>
                    <button onClick={store.clearWaypoints} className="mt-2 text-xs bg-slate-900 border border-amber-900 hover:bg-amber-900/50 text-amber-500 py-1 rounded transition-colors">
                        Effacer la route
                    </button>
                </section>

                {/* ==================== SOUS-MARIN & PRÉCISION ==================== */}
                <section className="flex flex-col gap-4">
                    <h3 className="text-sm text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Le Sous-marin</h3>

                    {/* Cap */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Cap</label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="0" max="359" value={store.heading} onChange={(e) => store.setHeading(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                            <input type="number" min="0" max="359" value={store.heading} onChange={(e) => store.setHeading(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-700 rounded text-center text-emerald-400 font-mono text-sm py-1 outline-none" />
                        </div>
                    </div>

                    {/* Vitesse */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Vitesse (nds)</label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="0" max="45" value={store.speed} onChange={(e) => store.setSpeed(Number(e.target.value))} className="flex-1 accent-cyan-500" />
                            <input type="number" min="0" max="45" value={store.speed} onChange={(e) => store.setSpeed(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-700 rounded text-center text-cyan-400 font-mono text-sm py-1 outline-none" />
                        </div>
                    </div>

                    {/* Assiette */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Assiette (°)</label>
                        <div className="flex items-center gap-3">
                            <input type="range" min="-45" max="45" value={store.pitch} onChange={(e) => store.setPitch(Number(e.target.value))} className="flex-1 accent-amber-500" />
                            <input type="number" min="-45" max="45" value={store.pitch} onChange={(e) => store.setPitch(Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-700 rounded text-center text-amber-500 font-mono text-sm py-1 outline-none" />
                        </div>
                    </div>

                    {/* Pilote Auto */}
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 mt-2">
                        <label className="text-xs text-slate-400 block mb-2">Profondeur Cible (Pilote Auto)</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Ex: 200"
                                value={store.targetDepth === null ? "" : store.targetDepth}
                                onChange={(e) => store.setTargetDepth(e.target.value ? Number(e.target.value) : null)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded text-cyan-400 font-mono text-sm px-2 py-1 outline-none"
                            />
                            <button
                                onClick={() => store.setTargetDepth(null)}
                                className="px-3 bg-slate-800 text-slate-400 rounded text-xs hover:bg-slate-700"
                            >
                                Annuler
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 italic">
                            Définissez une cible, puis donnez de l'assiette. Le sous-marin s'arrêtera tout seul à cette profondeur. Actuelle: {store.depth}m.
                        </p>
                    </div>
                </section>

                {/* ==================== MOTEUR TEMPOREL ==================== */}
                <section className="flex flex-col gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner">
                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-widest">
                        <span>Moteur Temporel</span>
                        {store.timeMultiplier === 0 && <span className="text-amber-500 font-bold animate-pulse">PAUSE</span>}
                        {store.timeMultiplier > 1 && <span className="text-emerald-500 font-bold">x{store.timeMultiplier}</span>}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-2">
                        <button
                            onClick={() => store.setTimeMultiplier(0)}
                            className={`py-2 text-xs font-bold rounded border ${store.timeMultiplier === 0 ? "bg-amber-900/50 border-amber-500 text-amber-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                        >
                            PAUSE
                        </button>
                        <button
                            onClick={() => store.setTimeMultiplier(1)}
                            className={`py-2 text-xs font-bold rounded border ${store.timeMultiplier === 1 ? "bg-cyan-900/50 border-cyan-500 text-cyan-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                        >
                            1:1
                        </button>
                        <button
                            onClick={() => store.setTimeMultiplier(60)}
                            className={`py-2 text-xs font-bold rounded border ${store.timeMultiplier === 60 ? "bg-emerald-900/50 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                        >
                            x60
                        </button>
                        <button
                            onClick={() => store.setTimeMultiplier(600)}
                            className={`py-2 text-xs font-bold rounded border ${store.timeMultiplier === 600 ? "bg-emerald-900/50 border-emerald-500 text-emerald-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                        >
                            x600
                        </button>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-1">
                        <label className="text-[10px] text-slate-500 uppercase">Régler l'heure de départ (ZULU)</label>
                        <input
                            type="time"
                            value={gmtTimeString}
                            onChange={handleTimeChange}
                            className="bg-slate-900 text-xs p-1.5 border border-slate-700 rounded text-cyan-400 font-bold outline-none focus:border-cyan-500"
                        />
                    </div>
                </section>

                {/* ==================== CONTACTS (MONDE VIVANT) ==================== */}
                <section className="flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <h3 className="text-sm text-slate-400 uppercase tracking-widest">Contacts ({store.contacts.length})</h3>
                        <button onClick={handleAddContact} className="bg-slate-800 hover:bg-slate-700 transition-colors text-xs px-3 py-1 rounded text-cyan-400 border border-slate-700">
                            + Ajouter
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {store.contacts.map(contact => (
                            <div key={contact.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-3 shadow-inner">
                                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                                    <input type="text" value={contact.name} onChange={(e) => store.updateContact(contact.id, { name: e.target.value })} className="bg-transparent text-sm font-bold text-slate-200 outline-none w-full border-b border-transparent focus:border-slate-700 transition-colors" />
                                    <button onClick={() => store.removeContact(contact.id)} className="text-red-900 hover:text-red-500 transition-colors text-xs font-bold px-2">X</button>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div className="flex flex-col gap-1 col-span-2">
                                        <label className="text-[10px] text-slate-500 uppercase">Alignement</label>
                                        <select value={contact.alignment} onChange={(e) => store.updateContact(contact.id, { alignment: e.target.value as Alignment })} className="bg-slate-900 text-xs p-1.5 border border-slate-800 rounded text-slate-300 outline-none focus:border-slate-600">
                                            <option value="allié">Allié (Bleu)</option>
                                            <option value="neutre">Neutre (Jaune)</option>
                                            <option value="hostile">Hostile (Rouge)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <label>Cap</label>
                                            <span>{contact.heading}°</span>
                                        </div>
                                        <input type="range" min="0" max="359" value={contact.heading} onChange={(e) => store.updateContact(contact.id, { heading: Number(e.target.value) })} className="accent-slate-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <label>Vitesse</label>
                                            <span>{contact.speed} nds</span>
                                        </div>
                                        <input type="range" min="0" max="40" value={contact.speed} onChange={(e) => store.updateContact(contact.id, { speed: Number(e.target.value) })} className="accent-slate-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
    )
}
