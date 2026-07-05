import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useSubmarineStore, type Alignment } from "../store/useSubmarineStore";

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
    const { position, heading, speed, depth, sensorRange, getVisibleContacts } = useSubmarineStore();

    const visibleContacts = getVisibleContacts();

    return (
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

            <Circle
                center={position}
                radius={sensorRange * 1852}
                pathOptions={{
                    color: '#22d3ee',
                    fillColor: '#22d3ee',
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: '5, 10'
                }}
            />

            <Marker position={position} icon={createVesselIcon('#22d3ee', heading, 'VOTRE SOUS-MARIN')}>
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
                        <div className="text-sm text-slate-500 mt-1 uppercase text-xs">Alignement: {contact.alignment}</div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
