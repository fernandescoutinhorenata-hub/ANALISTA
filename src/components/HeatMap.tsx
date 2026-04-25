import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, RefreshCcw, Navigation } from 'lucide-react';

interface HeatMapProps {
  userId: string;
}

interface DeathPoint {
  id: string;
  x_percent: number;
  y_percent: number;
}

interface GroupedPoint {
  x: number;
  y: number;
  count: number;
}

const mapasDisponiveis = ['BERMUDA', 'KALAHARI', 'NOVA TERRA', 'PURGATORIO', 'SOLARA'];

const mapaParaArquivo: Record<string, string> = {
  'BERMUDA': '/maps/Bermuda_grid.jpg',
  'KALAHARI': '/maps/Kalahari_grid.jpg',
  'NOVA TERRA': '/maps/Nova_Terra_grid.jpg',
  'PURGATORIO': '/maps/Purgatory_grid.jpg',
  'SOLARA': '/maps/Solara_grid.jpg',
};

export const HeatMap: React.FC<HeatMapProps> = ({ userId }) => {
  const [activeMap, setActiveMap] = useState<string>('BERMUDA');
  const [points, setPoints] = useState<DeathPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoints();
  }, [activeMap, userId]);

  const fetchPoints = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('death_locations')
        .select('id, x_percent, y_percent')
        .eq('user_id', userId)
        .eq('mapa', activeMap);

      if (error) throw error;
      setPoints(data || []);
    } catch (err) {
      console.error('Erro ao buscar mortes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group nearby points
  const groupedPoints = useMemo(() => {
    const groups: GroupedPoint[] = [];
    const radius = 3.5; // percentual radius to consider points "together"

    points.forEach(p => {
      let addedToGroup = false;
      for (const g of groups) {
        const dist = Math.sqrt(Math.pow(g.x - p.x_percent, 2) + Math.pow(g.y - p.y_percent, 2));
        if (dist <= radius) {
          g.count += 1;
          addedToGroup = true;
          break;
        }
      }
      if (!addedToGroup) {
        groups.push({ x: p.x_percent, y: p.y_percent, count: 1 });
      }
    });

    return groups;
  }, [points]);

  const getPointStyle = (count: number) => {
    if (count >= 6) {
      return { color: '#FF5252', size: 24, glow: '0 0 15px rgba(255, 82, 82, 0.8)' }; // Red, large
    } else if (count >= 3) {
      return { color: '#FF8C00', size: 18, glow: '0 0 10px rgba(255, 140, 0, 0.7)' }; // Orange, medium
    } else {
      return { color: '#FFC107', size: 14, glow: '0 0 8px rgba(255, 193, 7, 0.5)' }; // Yellow, small
    }
  };

  const mapImageSrc = mapaParaArquivo[activeMap];

  return (
    <div className="card p-6 flex flex-col h-full relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-heading text-lg flex items-center gap-2">
            <MapPin className="text-[var(--accent)]" />
            Mapa de Calor — Onde seu time morre
          </h2>
          <p className="text-label mt-1">Análise de densidade de mortes por mapa</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="badge badge-purple flex items-center gap-1 font-bold">
            <Navigation size={14} />
            Total de mortes: {points.length}
          </div>
          <button onClick={fetchPoints} disabled={loading} className="p-2 btn-ghost rounded-lg">
            <RefreshCcw size={16} className={loading ? 'animate-spin text-[var(--accent)]' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {mapasDisponiveis.map(m => (
          <button
            key={m}
            onClick={() => setActiveMap(m)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeMap === m 
                ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_var(--accent-muted)]' 
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex-1 relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 z-10 bg-[var(--bg-surface)]/50 backdrop-blur-sm flex items-center justify-center">
            <RefreshCcw size={24} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : null}

        {mapImageSrc ? (
          <div className="relative inline-block max-w-full max-h-full p-2">
            <img
              src={mapImageSrc}
              alt={`Mapa ${activeMap}`}
              className="max-w-full max-h-[600px] object-contain opacity-80"
              draggable={false}
            />
            
            {groupedPoints.map((p, idx) => {
              const style = getPointStyle(p.count);
              return (
                <div
                  key={idx}
                  className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-125 cursor-help"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${style.size}px`,
                    height: `${style.size}px`,
                    backgroundColor: style.color,
                    boxShadow: style.glow,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(10, style.size - 8)}px`
                  }}
                  title={`${p.count} mortes nesta região`}
                >
                  {p.count > 1 ? p.count : ''}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8">
            <p className="text-[var(--text-secondary)]">Mapa "{activeMap}" não possui imagem configurada.</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-6 justify-center text-sm font-medium">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="w-3 h-3 rounded-full bg-[#FFC107] shadow-[0_0_8px_rgba(255,193,7,0.5)]"></span> 1-2 mortes
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="w-4 h-4 rounded-full bg-[#FF8C00] shadow-[0_0_10px_rgba(255,140,0,0.7)]"></span> 3-5 mortes
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="w-5 h-5 rounded-full bg-[#FF5252] shadow-[0_0_15px_rgba(255,82,82,0.8)]"></span> 6+ mortes
        </div>
      </div>
    </div>
  );
};
