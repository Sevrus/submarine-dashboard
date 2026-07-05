import { useSubmarineStore, type Alignment } from "../store/useSubmarineStore";

export function MjPanel() {
    const store = useSubmarineStore()

    // Fonction pour ajouter un contact proche du sous-marin
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

    return (
        <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 shadow-2xl">
            <header className="border-b border-red-900/50 p-6 pb-4 shrink-0">
                <h2 className="text-2xl font-bold text-red-500 tracking-wider">CONTRÔLE MJ</h2>
                <p className="text-xs text-slate-500 mt-1">Interface d'administration tactique</p>
            </header>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8 custom-scrollbar">

                {/* ==================== SOUS-MARIN JOUEUR ==================== */}
                <section className="flex flex-col gap-4">
                    <h3 className="text-sm text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Le Sous-marin</h3>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <label>Cap</label>
                            <span className="text-emerald-400">{store.heading}°</span>
                        </div>
                        <input
                            type="range" min="0" max="359"
                            value={store.heading}
                            onChange={(e) => store.setHeading(Number(e.target.value))}
                            className="accent-emerald-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <label>Vitesse</label>
                            <span className="text-cyan-400">{store.speed} nds</span>
                        </div>
                        <input
                            type="range" min="0" max="45"
                            value={store.speed}
                            onChange={(e) => store.setSpeed(Number(e.target.value))}
                            className="accent-cyan-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <label>Profondeur</label>
                            <span className="text-cyan-400">{store.depth} m</span>
                        </div>
                        <input
                            type="range" min="0" max="800"
                            value={store.depth}
                            onChange={(e) => store.setDepth(Number(e.target.value))}
                            className="accent-cyan-500"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <label>Assiette</label>
                            <span className="text-amber-500">{store.pitch}°</span>
                        </div>
                        <input
                            type="range" min="-45" max="45"
                            value={store.pitch}
                            onChange={(e) => store.setPitch(Number(e.target.value))}
                            className="accent-amber-500"
                        />
                    </div>
                </section>

                {/* ==================== CONTACTS ==================== */}
                <section className="flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <h3 className="text-sm text-slate-400 uppercase tracking-widest">Contacts ({store.contacts.length})</h3>
                        <button
                            onClick={handleAddContact}
                            className="bg-slate-800 hover:bg-slate-700 transition-colors text-xs px-3 py-1 rounded text-cyan-400 border border-slate-700"
                        >
                            + Ajouter
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {store.contacts.map(contact => (
                            <div key={contact.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-3 shadow-inner">

                                {/* En-tête du contact : Nom et bouton Supprimer */}
                                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                                    <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => store.updateContact(contact.id, { name: e.target.value })}
                                        className="bg-transparent text-sm font-bold text-slate-200 outline-none w-full border-b border-transparent focus:border-slate-700 transition-colors"
                                    />
                                    <button
                                        onClick={() => store.removeContact(contact.id)}
                                        className="text-red-900 hover:text-red-500 transition-colors text-xs font-bold px-2"
                                        title="Supprimer le contact"
                                    >
                                        X
                                    </button>
                                </div>

                                {/* Contrôles du contact */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">

                                    {/* Alignement */}
                                    <div className="flex flex-col gap-1 col-span-2">
                                        <label className="text-[10px] text-slate-500 uppercase">Alignement</label>
                                        <select
                                            value={contact.alignment}
                                            onChange={(e) => store.updateContact(contact.id, { alignment: e.target.value as Alignment })}
                                            className="bg-slate-900 text-xs p-1.5 border border-slate-800 rounded text-slate-300 outline-none focus:border-slate-600"
                                        >
                                            <option value="allié">Allié (Bleu)</option>
                                            <option value="neutre">Neutre (Jaune)</option>
                                            <option value="hostile">Hostile (Rouge)</option>
                                        </select>
                                    </div>

                                    {/* Cap */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <label>Cap</label>
                                            <span>{contact.heading}°</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="359"
                                            value={contact.heading}
                                            onChange={(e) => store.updateContact(contact.id, { heading: Number(e.target.value) })}
                                            className="accent-slate-500"
                                        />
                                    </div>

                                    {/* Vitesse */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <label>Vitesse</label>
                                            <span>{contact.speed} nds</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="40"
                                            value={contact.speed}
                                            onChange={(e) => store.updateContact(contact.id, { speed: Number(e.target.value) })}
                                            className="accent-slate-500"
                                        />
                                    </div>

                                </div>
                            </div>
                        ))}

                        {store.contacts.length === 0 && (
                            <div className="text-center text-xs text-slate-600 italic py-4">
                                Écran radar vide. Aucun contact.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </aside>
    )
}
