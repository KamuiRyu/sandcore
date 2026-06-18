import { memo, useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Layers,
  X,
  Target,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";
import {
  getMarkerTypeLabel,
  getMarkerIconSrc,
} from "../../core/entities/MapConfig.entity";
import type { MapMarkerType } from "../../core/entities/MapCalibration.entity";
import { HudPanel } from "../../../app/ui/components/HudPanel";

interface SearchResult {
  id: string;
  name: string;
  x: number;
  y: number;
  iconId: string;
  isCustom: boolean;
  color?: string;
  type?: MapMarkerType;
}

interface MapCategoriesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchHistory: string[];
  removeFromHistory: (item: string) => void;
  addToHistory: (item: string) => void;
  clearHistory: () => void;
  searchResults: SearchResult[];
  selectCustomPin: (id: string | null) => void;
  selectOfficialPoint: (id: string | null) => void;
  focusCoords: (coords: { x: number; y: number }) => void;
  officialPinCategories: {
    base: {
      count: string;
      iconId: string;
      type: string;
      label?: string;
      total: number;
      marked: number;
    }[];
    identified: {
      count: string;
      iconId: string;
      type: string;
      label?: string;
      total: number;
      marked: number;
    }[];
  };
  selectedTypes: string[];
  toggleSelectedType: (type: string) => void;
}

const IconImage = memo(function IconImage({
  iconId,
  label,
  className,
}: {
  className?: string;
  iconId: string;
  label: string;
}) {
  const [hasError, setHasError] = useState(false);
  const src = getMarkerIconSrc(iconId);

  if (!src || hasError) {
    return (
      <span
        className={cn(
          "grid place-items-center rounded-full bg-cyan-500/10 font-mono text-[0.6rem] font-black uppercase tracking-[0.14em] text-cyan-400 border border-cyan-500/20",
          className,
        )}
      >
        {label.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      alt=""
      className={className}
      draggable={false}
      onError={() => setHasError(true)}
      src={src}
    />
  );
});

const CornerDecoration = ({ active }: { active?: boolean }) => (
  <div className="absolute inset-0 pointer-events-none">
    <div className={cn("absolute top-0 left-0 w-2.5 h-2.5 border-t border-l rounded-tl-sm transition-all duration-500", active ? "border-cyan-400/80" : "border-white/10")} />
    <div className={cn("absolute top-0 right-0 w-2.5 h-2.5 border-t border-r rounded-tr-sm transition-all duration-500", active ? "border-cyan-400/80" : "border-white/10")} />
    <div className={cn("absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l rounded-bl-sm transition-all duration-500", active ? "border-cyan-400/80" : "border-white/10")} />
    <div className={cn("absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r rounded-br-sm transition-all duration-500", active ? "border-cyan-400/80" : "border-white/10")} />
  </div>
);

const CategoryCard = memo(({ 
  category, 
  isActive, 
  onClick 
}: { 
  category: { count: string, iconId: string, type: string, label?: string, total: number, marked: number },
  isActive: boolean,
  onClick: () => void
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-4 p-4 pr-6 rounded-2xl transition-all duration-300 group shrink-0 min-w-[140px] snap-start select-none",
        "bg-[#0D1216]/40 border",
        isActive 
          ? "border-cyan-500/40 bg-cyan-500/[0.03] shadow-[0_0_30px_rgba(6,182,212,0.05)]" 
          : "border-white/5 hover:border-white/10 hover:bg-[#0D1216]/60"
      )}
    >
      {/* Icon Area */}
      <div className="relative shrink-0 flex flex-col items-center">
        <div className={cn(
          "relative grid place-items-center h-12 w-12 rounded-xl border transition-all duration-500",
          isActive 
            ? "border-cyan-500/30 bg-cyan-950/20" 
            : "border-white/5 bg-black/20 group-hover:border-white/10"
        )}>
          <IconImage 
            iconId={category.iconId} 
            label={category.label || ""} 
            className={cn(
              "h-7 w-7 object-contain transition-all duration-500 z-10",
              isActive ? "drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] scale-110" : "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
            )} 
          />
        </div>
        {/* Active Dot */}
        <div className={cn(
          "mt-2 h-1.5 w-1.5 rounded-full transition-all duration-500",
          isActive ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)]" : "bg-slate-700/50"
        )} />
      </div>

      {/* Label */}
      <div className="text-left pointer-events-none">
        <h4 className={cn(
          "text-[14px] font-black uppercase tracking-wider transition-colors duration-500 whitespace-nowrap",
          isActive ? "text-slate-100" : "text-slate-500 group-hover:text-slate-300"
        )}>
          {category.label || getMarkerTypeLabel(category.type as MapMarkerType)}
        </h4>
        <p className={cn(
          "text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-500",
          isActive ? "text-cyan-500/60" : "text-slate-600"
        )}>
          {category.total} Ativos
        </p>
      </div>
    </motion.button>
  );
});

export const MapCategoriesMenu = memo(function MapCategoriesMenu({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchHistory,
  removeFromHistory,
  addToHistory,
  clearHistory,
  searchResults,
  selectCustomPin,
  selectOfficialPoint,
  focusCoords,
  officialPinCategories,
  selectedTypes,
  toggleSelectedType,
}: MapCategoriesMenuProps) {
  const [exploreConstraints, setExploreConstraints] = useState({ left: 0, right: 0 });
  const [resultsConstraints, setResultsConstraints] = useState({ left: 0, right: 0 });
  const [historyConstraints, setHistoryConstraints] = useState({ left: 0, right: 0 });
  
  const exploreRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const exploreContentRef = useRef<HTMLDivElement>(null);
  const resultsContentRef = useRef<HTMLDivElement>(null);
  const historyContentRef = useRef<HTMLDivElement>(null);

  const allCategories = useMemo(() => {
    return [...officialPinCategories.base, ...officialPinCategories.identified];
  }, [officialPinCategories]);

  useEffect(() => {
    const updateConstraints = () => {
      if (exploreRef.current && exploreContentRef.current) {
        const overflow = exploreContentRef.current.scrollWidth - exploreRef.current.offsetWidth;
        setExploreConstraints({ left: overflow > 0 ? -overflow : 0, right: 0 });
      }
      if (resultsRef.current && resultsContentRef.current) {
        const overflow = resultsContentRef.current.scrollWidth - resultsRef.current.offsetWidth;
        setResultsConstraints({ left: overflow > 0 ? -overflow : 0, right: 0 });
      }
      if (historyRef.current && historyContentRef.current) {
        const overflow = historyContentRef.current.scrollWidth - historyRef.current.offsetWidth;
        setHistoryConstraints({ left: overflow > 0 ? -overflow : 0, right: 0 });
      }
    };

    // Initial update
    updateConstraints();
    
    // Create an observer to track content changes
    const observer = new ResizeObserver(updateConstraints);
    [exploreContentRef, resultsContentRef, historyContentRef].forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    window.addEventListener("resize", updateConstraints);
    return () => {
      window.removeEventListener("resize", updateConstraints);
      observer.disconnect();
    };
  }, [allCategories, searchQuery, searchHistory, isOpen]);

  const totalGroups = allCategories.filter(c => c.total > 0).length;

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allCategories.filter((category) => {
      const label = category.label || getMarkerTypeLabel(category.type as MapMarkerType);
      return label.toLowerCase().includes(query) && category.total > 0;
    });
  }, [allCategories, searchQuery]);

  return (
    <HudPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Categorias"
      subtitle="Pins no mapa"
      icon={Layers}
      width="w-[480px]"
      height="h-[320px]"
    >
      <div className="flex h-full flex-col relative overflow-hidden rounded-b-[24px]">
        {/* Subtle technical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-b-[24px]" />

        {/* Content Area */}
        <div className="relative z-10 min-h-0 flex-1 flex flex-col px-6 py-4 overflow-hidden rounded-b-[24px]">
          {searchQuery.trim() ? (
            // Search Results (Filtered Categories)
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-1 bg-cyan-500 rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Categorias Encontradas ({filteredCategories.length})
                </h3>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-5">
                    <Search size={40} strokeWidth={1} className="text-slate-700" />
                    <div className="absolute inset-0 bg-slate-500/5 blur-xl rounded-full" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em]">Nenhuma categoria detectada</p>
                </div>
              ) : (
                <div className="overflow-hidden" ref={resultsRef}>
                  <motion.div 
                    drag="x"
                    dragConstraints={resultsConstraints}
                    dragElastic={0.05}
                    dragMomentum={true}
                    className="flex gap-4 pb-4 cursor-grab active:cursor-grabbing w-max"
                    ref={resultsContentRef}
                  >
                    {filteredCategories.map((category) => (
                      <CategoryCard
                        key={category.type}
                        category={category}
                        isActive={selectedTypes.includes(category.type)}
                        onClick={() => {
                          addToHistory(searchQuery);
                          toggleSelectedType(category.type);
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          ) : (
            // Modern Grid Categories (Horizontal Swiper Style)
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-3 w-0.5 bg-cyan-500 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explorar</h3>
                </div>
                <div className="overflow-hidden" ref={exploreRef}>
                  <motion.div 
                    drag="x"
                    dragConstraints={exploreConstraints}
                    dragElastic={0.05}
                    dragMomentum={true}
                    className="flex gap-4 pb-4 cursor-grab active:cursor-grabbing w-max"
                    ref={exploreContentRef}
                  >
                    {allCategories
                      .filter((category) => category.total > 0)
                      .map((category) => (
                        <CategoryCard
                          key={category.type}
                          category={category}
                          isActive={selectedTypes.includes(category.type)}
                          onClick={() => toggleSelectedType(category.type)}
                        />
                      ))}
                  </motion.div>
                </div>
              </div>

              {/* History Section (only if not searching) */}
              {searchHistory.length > 0 && (
                <section className="pt-4 border-t border-white/5 relative">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-0.5 bg-slate-700 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        Histórico
                      </h3>
                    </div>
                    <button
                      onClick={clearHistory}
                      className="text-[9px] font-black text-slate-700 hover:text-red-400 uppercase tracking-[0.15em] transition-colors px-2 py-1"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="overflow-hidden" ref={historyRef}>
                    <motion.div 
                      drag="x"
                      dragConstraints={historyConstraints}
                      dragElastic={0.05}
                      dragMomentum={true}
                      className="flex gap-4 pb-4 cursor-grab active:cursor-grabbing w-max"
                      ref={historyContentRef}
                    >
                      {searchHistory.map((item, idx) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          key={idx}
                          className="flex items-center gap-2.5 bg-[#0D1216]/60 border border-white/5 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] hover:border-white/10 transition-all group cursor-pointer shrink-0 snap-start select-none"
                        >
                          <button
                            onClick={() => setSearchQuery(item)}
                            className="text-[10px] font-bold text-slate-500 group-hover:text-slate-200 transition-colors bg-transparent border-none p-0 outline-none truncate max-w-[100px] uppercase tracking-wider pointer-events-none"
                          >
                            {item}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item);
                            }}
                            className="text-slate-700 hover:text-red-400 transition-colors active:scale-90 relative z-20 pointer-events-auto"
                          >
                            <X size={10} />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Search Bar at the bottom */}
        <div className="relative z-10 px-6 py-5 border-t border-white/[0.03] bg-black/40 rounded-b-[24px]">
          <div className="relative flex items-center group">
            <Search size={14} className="absolute left-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1216]/60 border border-white/[0.03] rounded-xl py-3 pl-11 pr-4 text-[12px] text-slate-200 placeholder-slate-600 focus:border-cyan-500/30 focus:bg-[#0D1216] focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </HudPanel>
  );
});

export default MapCategoriesMenu;