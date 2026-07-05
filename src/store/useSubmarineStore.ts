import { create } from "zustand";

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
    depth: number
    heading: number
    pitch: number
    speed: number
    position: [number, number]
    contacts: Contact[]
    timeMultiplier: number

    // NOUVEAU : Le temps in-game (en millisecondes)
    gameTime: number

    setDepth: (depth: number) => void
    setHeading: (heading: number) => void
    setPitch: (pitch: number) => void
    setSpeed: (speed: number) => void
    setPosition: (lat: number, lng: number) => void

    addContact: (contact: Omit<Contact, "id">) => void
    updateContact: (id: string, updates: Partial<Omit<Contact, "id">>) => void
    removeContact: (id: string) => void

    setTimeMultiplier: (multiplier: number) => void
    advanceTime: (dtRealSeconds: number) => void
    setGameTime: (timeMs: number) => void
}

export const useSubmarineStore = create<SubmarineState>()((set) => ({
    depth: 15,
    heading: 90,
    pitch: 0,
    speed: 4,
    position: [38.5, -28.0],
    timeMultiplier: 1,

    // Initialisation à l'heure de ta partie
    gameTime: Date.now(),

    contacts: [
        {
            id: crypto.randomUUID(),
            name: "FDI Amiral Cabanier",
            type: "military",
            alignment: "neutre",
            nationality: "Française",
            position: [38.6, -27.8],
            heading: 210,
            speed: 16,
            depth: 0
        }
    ],

    setDepth: (depth) => set({ depth }),
    setHeading: (heading) => set({ heading }),
    setPitch: (pitch) => set({ pitch }),
    setSpeed: (speed) => set({ speed }),
    setPosition: (lat, lng) => set({ position: [lat, lng] }),
    setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),
    setGameTime: (gameTime) => set({ gameTime }),

    addContact: (contact) => set((state) => ({
        contacts: [...state.contacts, { ...contact, id: crypto.randomUUID() }]
    })),

    updateContact: (id, updates) => set((state) => ({
        contacts: state.contacts.map(c => c.id === id ? { ...c, ...updates } : c)
    })),

    removeContact: (id) => set((state) => ({
        contacts: state.contacts.filter(c => c.id !== id)
    })),

    advanceTime: (dtRealSeconds) => set((state) => {
        if (state.timeMultiplier === 0) return state;

        const dtGameHours = (dtRealSeconds * state.timeMultiplier) / 3600;

        const calculateNewPosition = (pos: [number, number], speed: number, heading: number): [number, number] => {
            if (speed === 0) return pos;
            const distanceNm = speed * dtGameHours;
            const headingRad = heading * (Math.PI / 180);
            const latRad = pos[0] * (Math.PI / 180);

            const latChange = (distanceNm * Math.cos(headingRad)) / 60;
            const lngChange = (distanceNm * Math.sin(headingRad)) / (60 * Math.cos(latRad));

            return [pos[0] + latChange, pos[1] + lngChange];
        };

        let newDepth = state.depth;
        let newPitch = state.pitch;

        if (state.speed > 0 && state.pitch !== 0) {
            const pitchRad = state.pitch * (Math.PI / 180);
            const verticalSpeedMetersPerHour = state.speed * Math.sin(pitchRad) * 1852;
            newDepth = state.depth - (verticalSpeedMetersPerHour * dtGameHours);

            if (newDepth <= 0) {
                newDepth = 0;
                newPitch = 0;
            } else {
                newDepth = Math.round(newDepth);
            }
        }

        return {
            depth: newDepth,
            pitch: newPitch,
            gameTime: state.gameTime + (dtRealSeconds * state.timeMultiplier * 1000),
            position: calculateNewPosition(state.position, state.speed, state.heading),
            contacts: state.contacts.map(c => ({
                ...c,
                position: calculateNewPosition(c.position, c.speed, c.heading)
            }))
        };
    })
}))
