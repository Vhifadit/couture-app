'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/app/couturiers/leaflet.css";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, Map } from "lucide-react";
import { CouturierProfile } from "@/lib/api";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({
    click() {
      onClick();
    },
  });
  return null;
}

interface CouturierMapProps {
  geoPosition: { latitude: number; longitude: number } | null;
  radiusKm: number;
  filteredCouturiers: CouturierProfile[];
  scrollToCouturier: (id: string) => void;
}

export default function CouturierMap({ geoPosition, radiusKm, filteredCouturiers, scrollToCouturier }: CouturierMapProps) {
  return (
    <div className="w-full h-125 rounded-lg shadow-lg overflow-hidden mb-6">
      <MapContainer
        center={geoPosition ? [geoPosition.latitude, geoPosition.longitude] : [6.35, 2.44]}
        zoom={geoPosition ? 13 : 10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
        />
        {geoPosition && (
          <>
            <Circle
              center={[geoPosition.latitude, geoPosition.longitude]}
              radius={radiusKm * 1000}
              color="#2D6A4F"
              fillColor="#2D6A4F"
              fillOpacity={0.2}
              weight={3}
            />
            <Marker position={[geoPosition.latitude, geoPosition.longitude]}>
              <Popup>Vous êtes ici</Popup>
            </Marker>
          </>
        )}
        {filteredCouturiers
          .filter(c => c.localisation?.coordinates && c.localisation.coordinates.length === 2)
          .map((c) => {
            const [lng, lat] = c.localisation!.coordinates as [number, number];
            const icon = L.divIcon({
              html: `<div class="leaflet-div-icon rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg ${c.disponibilite_statut === 'DISPONIBLE' ? 'bg-green-500' : c.disponibilite_statut === 'OCCUPE' ? 'bg-orange-500' : 'bg-red-500'}">${c.nom_marque[0].toUpperCase()}</div>`,
              className: 'couturier-marker',
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            });
            return (
              <Marker key={c._id} position={[lat, lng]} icon={icon}>
                <Popup>
                  <div className="min-w-80 p-0.5">
                    <div className="flex justify-between items-start mb-1.5">
                       <h3 className="font-bold text-base text-[#2D6A4F] m-0 leading-tight">{c.nom_marque}</h3>
                       <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold bg-yellow-50 px-1.5 py-0.5 rounded-full border border-yellow-100 shrink-0">
                          <span>★</span>
                          {c.stats?.note_moyenne?.toFixed(1) || "N/A"}
                       </div>
                    </div>

                    <div className="flex flex-col gap-0.5 mb-2">
                       <p className="text-xs text-gray-600 m-0 font-semibold">
                         {c.adresse?.ville}{c.adresse?.quartier ? `, ${c.adresse.quartier}` : ""}
                       </p>
                       {c.telephone && (
                         <p className="text-xs text-[#2D6A4F] m-0 font-medium">
                           Tel: {c.telephone}
                         </p>
                       )}
                    </div>

                    <p className="text-xs text-gray-500 m-0 mb-3 italic leading-snug border-l-2 border-gray-100 pl-2">
                      {c.description ? (c.description.length > 100 ? c.description.substring(0, 100) + "..." : c.description) : "Aucune description fournie"}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      {c.disponibilite_statut === 'DISPONIBLE' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <CheckCircle size={10} /> Disponible
                        </span>
                      ) : c.disponibilite_statut === 'OCCUPE' ? (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <XCircle size={10} /> Occupé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <AlertCircle size={10} /> Absent
                        </span>
                      )}
                      
                      {c.tarifs && (Object.values(c.tarifs).some(v => !!v)) && (
                        <p className="text-xs font-black text-[#2D6A4F] m-0">
                          Dès {Math.min(...Object.values(c.tarifs).filter(v => !!v).map(v => Number(v)))} FCFA
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t flex items-center justify-between gap-4">
                      <div className="flex gap-4 items-center">
                        <Link href={`/couturiers/${c._id}`} className="text-[#2D6A4F] hover:underline text-xs font-black uppercase tracking-wider">Profil</Link>
                        {c.localisation?.coordinates && (
                           <a 
                             href={`https://www.google.com/maps/dir/?api=1&destination=${c.localisation.coordinates[1]},${c.localisation.coordinates[0]}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                           >
                             <Map size={12} /> Itinéraire
                           </a>
                        )}
                      </div>
                      {c.disponibilite_statut === 'DISPONIBLE' && (
                        <Link href={`/dashboard/client/commandes/new?couturierId=${c._id}`}>
                          <button className="bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1B4332] shadow-lg shadow-[#2D6A4F]/10 transition-all active:scale-95">
                            Commander
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Popup>
                <MapClickHandler onClick={() => scrollToCouturier(c._id)} />
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
