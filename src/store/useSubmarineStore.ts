import { create } from "zustand";

// --- TYPAGE ---
export type ContactType = "civilian" | "military" | "unknown";
export type Alignment = "allié" | "neutre" | "hostile";

export interface Contact {
    id: string
    name: string
    type: ContactType
    alignment: Alignment
    nationality: string
    position: [number, number]
    heading: number
    speed: number
    depth: number
}

interface SubmarineState {
    // Instruments de bord
    depth: number
    heading: number
    pitch: number
    speed: number

    // Carte
    position: [number, number]
    contacts: Contact[]

    // Panneau de contrôle
    setDepth: (depth: number) => void
    setHeading: (heading: number) => void
    setPitch: (pitch: number) => void
    setSpeed: (speed: number) => void
    setPosition: (lat: number, lng: number) => void

    // Gestion du monde vivant
    addContact: (contact: Omit<Contact, "id">) => void
    updateContact: (id: string, updates: Partial<Omit<Contact, "id">>) => void
    removeContact: (id: string) => void
}

// --- STORE ---
export const useSubmarineStore = create<SubmarineState>()((set) => ({
    // État initial : Immersion périscopique aux Açores
    depth: 15,
    heading: 90,
    pitch: 0,
    speed: 0,
    position: [38.5, -28.0],

    contacts: [
        {
            id: crypto.randomUUID(),
            name: "FDI Amiral Cabanier",
            type: "military",
            alignment: "allié",
            nationality: "Française",
            position: [38.6, -27.8],
            heading: 90,
            speed: 0,
            depth: 0
        }
    ],

    // --- ACTIONS ---
    setDepth: (depth) => set({ depth }),
    setHeading: (heading) => set({ heading }),
    setPitch: (pitch) => set({ pitch }),
    setSpeed: (speed) => set({ speed }),
    setPosition: (lat, lng) => set({ position: [lat, lng] }),

    addContact: (contact) => set((state) => ({
        contacts: [
            ...state.contacts,
            { ...contact, id: crypto.randomUUID() }
        ]
    })),
    
    updateContact: (id, updates) => set((state) => ({
        contacts: state.contacts.map(c =>
            c.id === id ? { ...c, ...updates } : c
        )
    })),

    removeContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id)
    }))
}))
