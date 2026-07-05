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
    gameTime: number
    sensorRange: number

    targetDepth: number | null
    waypoints: [number, number][]

    setDepth: (depth: number) => void
    setHeading: (heading: number) => void
    setPitch: (pitch: number) => void
    setSpeed: (speed: number) => void
    setPosition: (lat: number, lng: number) => void
    setSensorRange: (range: number) => void

    setTargetDepth: (depth: number | null) => void
    addWaypoint: (lat: number, lng: number) => void
    clearWaypoints: () => void

    addContact: (contact: Omit<Contact, "id">) => void
    updateContact: (id: string, updates: Partial<Omit<Contact, "id">>) => void
    removeContact: (id: string) => void

    setTimeMultiplier: (multiplier: number) => void
    advanceTime: (dtRealSeconds: number) => void
    setGameTime: (timeMs: number) => void

    getSonarStatus: () => { isBlind: boolean; reason: string | null }
    getVisibleContacts: () => Contact[]
    getRouteDistance: () => number
}

export const useSubmarineStore = create<SubmarineState>()((set, get) => ({
    depth: 15,
    heading: 90,
    pitch: 0,
    speed: 4,
    position: [38.5, -28.0],
    timeMultiplier: 1,
    gameTime: Date.now(),
    sensorRange: 15,
    targetDepth: null,
    waypoints: [],

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
    setSensorRange: (sensorRange) => set({ sensorRange }),
    setTargetDepth: (targetDepth) => set({ targetDepth }),
    addWaypoint: (lat, lng) => set((state) => ({ waypoints: [...state.waypoints, [lat, lng]] })),
    clearWaypoints: () => set({ waypoints: [] }),

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
        let newTargetDepth = state.targetDepth;

        if (state.speed > 0 && state.pitch !== 0) {
            const pitchRad = state.pitch * (Math.PI / 180);
            const verticalSpeedMetersPerHour = state.speed * Math.sin(pitchRad) * 1852;

            newDepth = state.depth - (verticalSpeedMetersPerHour * dtGameHours);

            if (newDepth <= 0) {
                newDepth = 0;
                newPitch = 0;
                newTargetDepth = null;
            } else if (state.targetDepth !== null) {
                if ((state.pitch < 0 && newDepth >= state.targetDepth) ||
                    (state.pitch > 0 && newDepth <= state.targetDepth)) {
                    newDepth = state.targetDepth;
                    newPitch = 0;
                    newTargetDepth = null;
                }
            }
        }

        return {
            depth: Math.round(newDepth * 10) / 10,
            pitch: newPitch,
            targetDepth: newTargetDepth,
            gameTime: state.gameTime + (dtRealSeconds * state.timeMultiplier * 1000),
            position: calculateNewPosition(state.position, state.speed, state.heading),
            contacts: state.contacts.map(c => ({
                ...c,
                position: calculateNewPosition(c.position, c.speed, c.heading)
            }))
        };
    }),

    getSonarStatus: () => {
        const { speed, depth } = get()
        if (speed > 15) return { isBlind: true, reason: "CAVITATION (Vitesse > 15nds)" }
        if (depth > 150) return { isBlind: true, reason: "THERMOCLINE (Profondeur > 150m)" }
        return { isBlind: false, reason: null }
    },

    getVisibleContacts: () => {
        const { contacts, position, sensorRange } = get()
        if (get().getSonarStatus().isBlind) return []
        return contacts.filter(contact => getDistanceNm(position, contact.position) <= sensorRange)
    },

    getRouteDistance: () => {
        const { position, waypoints } = get()
        if (waypoints.length === 0) return 0

        let total = getDistanceNm(position, waypoints[0])
        for(let i = 0; i < waypoints.length - 1; i++) {
            total += getDistanceNm(waypoints[i], waypoints[i+1])
        }
        return total
    }
}))

export const getDistanceNm = (pos1: [number, number], pos2: [number, number]) => {
    const R = 3440.065;
    const dLat = (pos2[0] - pos1[0]) * Math.PI / 180;
    const dLon = (pos2[1] - pos1[1]) * Math.PI / 180;
    const lat1 = pos1[0] * Math.PI / 180;
    const lat2 = pos2[0] * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
