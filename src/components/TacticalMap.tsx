import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useSubmarineStore, type Alignment } from "../store/useSubmarineStore";

function MapClickHandler() {
    const addWaypoint = useSubmarineStore(s => s.addWaypoint)
    useMapEvents({
        click(e) {
            addWaypoint(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

const createVesselIcon = (color: string, heading: number, label: string) => {
    return L.divIcon({
        className: "bg-transparent border-none",
        html: `
      <div style="display: flex; flex-direction: column; align-items: center; width: 60px; margin-left: -15px; margin-top: -15px;">
        <div style="transform: rotate(${heading}deg); transition: transform 1s ease;">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="rgba(15, 23, 42, 0.8)" stroke="${color}" stroke-width="2">
            <polygon points="12,2 20,20 12,17 4,20" />
          </svg>
        </div>
        <div style="color: ${color}; font-size: 10px; font-weight: bold; text-align: center; text-shadow: 1px 1px 2px black; margin-top: 4px; white-space: nowrap;">
          ${label}
        </div>
      </div>
    `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    })
}

const getAlignmentColor = (alignment: Alignment) => {
    switch (alignment) {
        case "allié": return "#3b82f6"
        case "neutre": return "#f59e0b"
        case "hostile": return "#ef4444"
        default: return "#94a3b8"
    }
}

export function TacticalMap() {
    const { position, heading, speed, depth, sensorRange, getVisibleContacts, getSonarStatus, waypoints } = useSubmarineStore();

    const visibleContacts = getVisibleContacts();
    const { isBlind, reason } = getSonarStatus();
    const warningRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isBlind && warningRef.current) {
            const tl = gsap.timeline();
            tl.fromTo(warningRef.current,
                { opacity: 0, scale: 1.1 },
                { opacity: 1, scale: 1, duration: 0.1, repeat: 3, yoyo: true, ease: "power2.inOut" }
            ).to(warningRef.current,
                { opacity: 0.8, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut" }
            )

            return () => { tl.kill() };
        }
    }, [isBlind]);

    return (
        <div className="relative w-full h-full">

            {/* ================= ALERTE SONAR AVEUGLE ================= */}
            {isBlind && (
                <div className="absolute inset-0 z-1000 pointer-events-none flex items-center justify-center bg-red-950/30 backdrop-blur-[2px] transition-all duration-500">
                    <div
                        ref={warningRef}
                        className="border-2 border-red-500 bg-red-950/90 text-red-500 px-8 py-6 rounded-lg flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                    >
                        <span className="text-4xl font-bold tracking-[0.2em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">SONAR AVEUGLE</span>
                        <span className="text-sm mt-3 text-red-400 font-bold uppercase tracking-widest">{reason}</span>
                    </div>
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

            <Marker position={position} icon={createVesselIcon("#22d3ee", heading, 'VOTRE SOUS-MARIN')}>
                <Popup className="font-mono">
                    <div className="text-slate-900 font-bold mb-1">NOTRE POSITION</div>
                    <div className="text-sm">Prof: {depth} m</div>
                    <div className="text-sm">Vit: {speed} nds</div>
                    <div className="text-sm">Cap: {heading}°</div>
                </Popup>
            </Marker>

            {visibleContacts.map((contact) => (
                <Marker
                    key={contact.id}
                    position={contact.position}
                    icon={createVesselIcon(getAlignmentColor(contact.alignment), contact.heading, contact.name)}
                >
                    <Popup className="font-mono">
                        <div className="text-slate-900 font-bold mb-1 uppercase">{contact.name}</div>
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
