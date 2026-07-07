import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, CircleMarker, useMapEvents, SVGOverlay } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useSubmarineStore, type Alignment } from "../store/useSubmarineStore";

function MapClickHandler() {
    const addWaypoint = useSubmarineStore(s => s.addWaypoint);
    const contactToPlace = useSubmarineStore(s => s.contactToPlace);
    const updateContact = useSubmarineStore(s => s.updateContact);
    const setContactToPlace = useSubmarineStore(s => s.setContactToPlace);

    useMapEvents({
        click(e) {
            if (contactToPlace) {
                updateContact(contactToPlace, { position: [e.latlng.lat, e.latlng.lng] });
                setContactToPlace(null);
            } else {
                addWaypoint(e.latlng.lat, e.latlng.lng);
            }
        }
    });
    return null;
}

import { vesselSvgs, type VesselIconType } from "./VesselIcons";

const createVesselIcon = (color: string, heading: number, label: string, type: VesselIconType = 'default') => {
    const svgContent = vesselSvgs[type] || vesselSvgs.default;

    return L.divIcon({
        className: "bg-transparent border-none",
        html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 60px; margin-left: -15px; margin-top: -15px;">
        <div style="transform: rotate(${heading}deg); transition: transform 1s ease;">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="rgba(15, 23, 42, 0.8)" stroke="${color}" stroke-width="2">
            ${svgContent}
          </svg>
        </div>
        <div style="color: ${color}; font-size: 10px; font-weight: bold; text-align: center; text-shadow: 1px 1px 2px black; margin-top: 4px; white-space: nowrap;">
          ${label}
        </div>
      </div>
    `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
};

const getAlignmentColor = (alignment: Alignment) => {
    switch (alignment) {
        case "allié": return "#3b82f6"
        case "neutre": return "#f59e0b"
        case "hostile": return "#ef4444"
        default: return "#94a3b8"
    }
}

const formatCoords = (pos: [number, number]) => {
    const lat = Math.abs(pos[0]).toFixed(3) + (pos[0] >= 0 ? "°N" : "°S");
    const lng = Math.abs(pos[1]).toFixed(3) + (pos[1] >= 0 ? "°E" : "°W");
    return `${lat} - ${lng}`;
}

export function TacticalMap() {
    const { position, heading, speed, depth, sensorRange, getVisibleContacts, getSonarStatus, waypoints, isAlarmMuted, setAlarmMuted } = useSubmarineStore();

    const visibleContacts = getVisibleContacts();
    const { isBlind, reason } = getSonarStatus();
    const warningRef = useRef<HTMLDivElement>(null);

    const radarBounds = L.latLng(position).toBounds(sensorRange * 1852 * 2);

    useEffect(() => {
        if (isBlind && !isAlarmMuted && warningRef.current) {
            const tl = gsap.timeline();
            tl.fromTo(warningRef.current,
                { opacity: 0, scale: 1.1 },
                { opacity: 1, scale: 1, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" }
            ).to(warningRef.current,
                { opacity: 0.8, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut" }
            )
            return () => { tl.kill() };
        }
    }, [isBlind, isAlarmMuted]);

    return (
        <div className="relative w-full h-full overflow-hidden">

            {/* ================= ALERTE SONAR PRINCIPALE (Plein écran) ================= */}
            {isBlind && !isAlarmMuted && (
                <div className="absolute inset-0 z-1000 flex items-center justify-center bg-red-950/40 backdrop-blur-[2px] transition-all duration-500">
                    <div
                        ref={warningRef}
                        className="border-2 border-red-500 bg-red-950/90 text-red-500 px-8 py-6 rounded-lg flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.4)] pointer-events-auto"
                    >
                        <span className="text-4xl font-bold tracking-[0.2em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">SONAR AVEUGLE</span>
                        <span className="text-sm mt-3 text-red-400 font-bold uppercase tracking-widest text-center">{reason}</span>

                        <button
                            onClick={() => setAlarmMuted(true)}
                            className="mt-6 px-6 py-2 bg-red-900/50 hover:bg-red-500 hover:text-white border border-red-500 rounded font-bold tracking-widest transition-colors"
                        >
                            ACQUITTER
                        </button>
                    </div>
                </div>
            )}

            {/* ================= ALERTE SONAR MINEURE (Acquittée) ================= */}
            {isBlind && isAlarmMuted && (
                <div className="absolute top-4 right-4 z-1000 bg-red-950/90 border border-red-500 text-red-500 px-4 py-2 rounded-lg shadow-lg flex flex-col items-end pointer-events-none">
                    <span className="font-bold tracking-widest text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        SONAR HORS SERVICE
                    </span>
                    <span className="text-[10px] text-red-400 uppercase">{reason}</span>
                </div>
            )}

            <MapContainer
                center={position}
                zoom={11}
                scrollWheelZoom={true}
                className="w-full h-full bg-slate-900 z-0"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                <MapClickHandler />

                {waypoints.length > 0 && (
                    <>
                        <Polyline positions={[position, ...waypoints]} color="#f59e0b" weight={2} dashArray="4, 8" />
                        {waypoints.map((wp, i) => (
                            <CircleMarker key={i} center={wp} radius={4} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1 }} />
                        ))}
                    </>
                )}

                {/* ================= LE BALAYAGE SONAR DOIT ÊTRE ICI ================= */}
                {!isBlind && (
                    <SVGOverlay bounds={radarBounds}>
                        <foreignObject width="100%" height="100%">
                            <div className="w-full h-full animate-[spin_4s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_70%,rgba(34,211,238,0.05)_95%,rgba(34,211,238,0.5)_100%)] mix-blend-screen"></div>
                        </foreignObject>
                    </SVGOverlay>
                )}

                <Circle
                    center={position}
                    radius={sensorRange * 1852}
                    pathOptions={{
                        color: "#22d3ee",
                        fillColor: "#22d3ee",
                        fillOpacity: 0.05,
                        weight: 1,
                        dashArray: "5, 10"
                    }}
                />

                {/* --- MARQUEUR DU SOUS-MARIN JOUEUR --- */}
                <Marker position={position} icon={createVesselIcon("#22d3ee", heading, 'VOTRE SOUS-MARIN', 'submarine')}>
                    <Popup className="font-mono">
                        <div className="text-slate-900 font-bold mb-1">NOTRE POSITION</div>

                        <div className="text-xs text-slate-500 font-bold mb-2 pb-1 border-b border-slate-200">
                            {formatCoords(position)}
                        </div>

                        <div className="text-sm">Prof: {depth} m</div>
                        <div className="text-sm">Vit: {speed} nds</div>
                        <div className="text-sm">Cap: {heading}°</div>
                    </Popup>
                </Marker>

                {/* --- MARQUEURS DES CONTACTS --- */}
                {visibleContacts.map((contact) => (
                    <Marker
                        key={contact.id}
                        position={contact.position}
                        icon={createVesselIcon(getAlignmentColor(contact.alignment), contact.heading, contact.name, contact.vesselType)}
                    >
                        <Popup className="font-mono">
                            <div className="text-slate-900 font-bold mb-1 uppercase">{contact.name}</div>
                            
                            <div className="text-xs text-slate-500 font-bold mb-2 pb-1 border-b border-slate-200">
                                {formatCoords(contact.position)}
                            </div>

                            <div className="text-sm">Type: {contact.type}</div>
                            <div className="text-sm">Nat: {contact.nationality}</div>
                            <div className="text-sm">Vit: {contact.speed} nds</div>
                            {contact.depth > 0 && <div className="text-sm">Prof: {contact.depth} m</div>}
                            <div className="text-sm text-slate-500 mt-1 uppercase">Alignement: {contact.alignment}</div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
