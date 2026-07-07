export const vesselSvgs = {
    submarine: `<circle cx="12" cy="12" r="8" />`,
    ship: `<circle cx="12" cy="12" r="8" />`,
    default: `<circle cx="12" cy="12" r="8" />`
};

export type VesselIconType = keyof typeof vesselSvgs;
