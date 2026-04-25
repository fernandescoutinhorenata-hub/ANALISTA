import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Undo2, Save, MapPin } from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapa: string;
  partida_id: string;
}

interface Point {
  x: number; // percentage
  y: number; // percentage
}

const mapaParaArquivo: Record<string, string> = {
  'BERMUDA': '/maps/Bermuda_grid.jpg',
  'KALAHARI': '/maps/Kalahari_grid.jpg',
  'NOVA TERRA': '/maps/Nova_Terra_grid.jpg',
  'PURGATORIO': '/maps/Purgatory_grid.jpg',
  'SOLARA': '/maps/Solara_grid.jpg',
};

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, mapa, partida_id }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Normalize map name to find the correct image
  const normalizedMapa = mapa?.toUpperCase().trim() || '';
  const mapImageSrc = mapaParaArquivo[normalizedMapa];

  useEffect(() => {
    if (isOpen) {
      setPoints([]);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (points.length >= 2) return;
    
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate percentage coordinates
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPoints(prev => [...prev, { x, y }]);
  };

  const handleUndo = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (points.length === 0 || !user || !partida_id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('death_locations').insert(
        points.map(p => ({
          user_id: user.id,
          partida_id,
          mapa: normalizedMapa,
          x_percent: p.x,
          y_percent: p.y
        }))
      );

      if (error) throw error;
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pontos de morte:', err);
      alert('Erro ao salvar localizações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="card w-full max-w-4xl p-6 relative animate-reveal flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-heading text-lg flex items-center gap-2">
              <MapPin className="text-[var(--accent)]" /> 
              Onde o time morreu? ({mapa})
            </h3>
            <p className="text-label mt-1">Clique no mapa para marcar até 2 pontos (onde caíram os últimos vivos).</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-tertiary)]"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center min-h-[300px]">
          {mapImageSrc ? (
            <div className="relative inline-block max-w-full max-h-full">
              <img
                ref={imageRef}
                src={mapImageSrc}
                alt={`Mapa ${mapa}`}
                onClick={handleImageClick}
                className={`max-w-full max-h-[60vh] object-contain cursor-crosshair transition-opacity ${loading ? 'opacity-50' : ''}`}
                draggable={false}
              />
              
              {points.map((p, idx) => (
                <div
                  key={idx}
                  className="absolute w-5 h-5 rounded-full bg-[#FF5252] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-lg animate-pulse"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none'
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-[var(--text-secondary)]">Mapa "{mapa}" não possui imagem configurada.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            Pontos marcados: <span className={points.length === 2 ? 'text-[var(--accent)]' : ''}>{points.length} / 2</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleUndo}
              disabled={points.length === 0 || loading}
              className="btn-ghost flex items-center gap-2"
            >
              <Undo2 size={16} /> Desfazer
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-ghost flex items-center gap-2"
            >
              Pular
            </button>
            <button
              onClick={handleSave}
              disabled={points.length === 0 || loading || !mapImageSrc}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} /> Salvar Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
