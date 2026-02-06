import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Plus, Minus, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface Log {
  id: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country_code: string | null;
  action: string;
}

interface ThreatMapProps {
  logs: Log[];
}

export default function ThreatMap({ logs }: ThreatMapProps) {
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  // Filter logs with valid coordinates
  const markers = useMemo(() => {
    return logs
      .filter(l => l.latitude && l.longitude)
      .map(l => ({
        name: l.city || l.country_code || 'Unknown',
        coordinates: [Number(l.longitude), Number(l.latitude)] as [number, number],
        type: l.action.includes('failed') ? 'attack' : 'activity',
        id: l.id
      }));
  }, [logs]);

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleReset() {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  }

  function handleMoveEnd(position: { coordinates: [number, number]; zoom: number }) {
    setPosition(position);
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm relative group">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live Threat Map
        </h3>
        <p className="text-slate-400 text-xs">Real-time GeoIP Tracking</p>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-slate-800/80 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-md border border-slate-700 transition-all active:scale-95"
          title="Zoom In"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-slate-800/80 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-md border border-slate-700 transition-all active:scale-95"
          title="Zoom Out"
        >
          <Minus size={20} />
        </button>
        <button 
          onClick={handleReset}
          className="p-2 bg-slate-800/80 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-md border border-slate-700 transition-all active:scale-95"
          title="Reset View"
        >
          <Maximize size={20} />
        </button>
      </div>
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 100,
        }}
        className="w-full h-full bg-[#0f172a]"
      >
        <ZoomableGroup 
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={10}
          filterZoomEvent={(_evt: any) => {
             // Optional: Disable scroll zoom if it interferes with page scroll
             return true; 
          }}
          // Fast & Fun Animation config
          motionStyle={{
            transition: {
              duration: 500, // Fast but noticeable
              ease: "easeInOut", // Smooth
            }
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none", transition: "all 250ms" },
                    hover: { fill: "#334155", outline: "none", cursor: "grab" },
                    pressed: { outline: "none", cursor: "grabbing" },
                  }}
                />
              ))
            }
          </Geographies>

          {markers.map((marker) => (
            <Marker key={marker.id} coordinates={marker.coordinates}>
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <circle 
                  r={marker.type === 'attack' ? 4 / position.zoom : 2 / position.zoom} 
                  fill={marker.type === 'attack' ? "#ef4444" : "#3b82f6"} 
                  stroke="#fff" 
                  strokeWidth={1 / position.zoom}
                  className={marker.type === 'attack' ? "animate-ping" : ""}
                  opacity={0.7}
                />
                <circle 
                  r={marker.type === 'attack' ? 4 / position.zoom : 2 / position.zoom} 
                  fill={marker.type === 'attack' ? "#ef4444" : "#3b82f6"} 
                  stroke="#fff" 
                  strokeWidth={1 / position.zoom}
                />
              </motion.g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
