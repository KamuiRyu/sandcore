import { memo, useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Image as ImageIcon,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../../lib/utils";
import {
  customPinIcons,
  getMarkerIconSrc,
} from "../../core/entities/MapConfig.entity";
import type { SavedCustomPin } from "../../core/entities/MapRoute.entity";
import { HudPanel } from "../../../app/ui/components/HudPanel";

interface MapPinsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomPin: SavedCustomPin | null;
  editingCustomPinId: string | null;
  cancelCustomPin: () => void;
  confirmCustomPin: () => void;
  updateSelectedPinField: (
    field: keyof SavedCustomPin,
    value: string | string[],
  ) => void;
  customPins: SavedCustomPin[];
  removeCustomPin: (id: string) => void;
  toggleCustomPinVisibility: (id: string) => void;
  paginatedCustomPins: SavedCustomPin[];
  customPinsPage: number;
  totalCustomPinsPages: number;
  setCustomPinsPage: (page: number) => void;
  mode: "explore" | "pin" | "route" | "feedback";
  setMode: (mode: "explore" | "pin" | "route" | "feedback") => void;
  openCustomPinsSection: () => void;
  isAuthenticated: boolean;
  openLoginModal: () => void;
  focusCoords: (coords: { x: number; y: number }) => void;
  selectCustomPin: (id: string | null) => void;
  startEditingCustomPin: (id: string) => void;
}

const LockedFeatureHUD = ({
  description,
  onLogin,
}: {
  title: string;
  description: string;
  onLogin: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="mb-8 relative">
      <div className="absolute inset-0 bg-slate-500/10 blur-[40px] rounded-full" />
      <div className="relative grid h-20 w-20 place-items-center bg-slate-900 border border-white/10 rounded-3xl text-slate-500">
        <Shield size={32} strokeWidth={1.5} />
      </div>
    </div>
    
    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-3">
      Acesso Restrito
    </h3>
    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[240px] mb-8">
      {description}
    </p>
    
    <button
      onClick={onLogin}
      className="group relative px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition-all active:scale-95 cursor-pointer shadow-lg shadow-cyan-900/20"
    >
      <span className="relative text-xs font-bold text-white">
        AUTENTICAR SISTEMA
      </span>
    </button>
  </div>
);

function HUDPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-white/5 px-2">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-20 transition-all cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex flex-col items-center">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Página</span>
         <span className="text-xs font-bold text-slate-200">
           {currentPage} <span className="text-slate-600">/</span> {totalPages}
         </span>
      </div>
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-slate-400 hover:border-cyan-500/30 hover:text-cyan-400 disabled:opacity-20 transition-all cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export const MapPinsMenu = memo(function MapPinsMenu({
  isOpen,
  onClose,
  selectedCustomPin,
  editingCustomPinId,
  cancelCustomPin,
  confirmCustomPin,
  updateSelectedPinField,
  customPins,
  removeCustomPin,
  toggleCustomPinVisibility,
  paginatedCustomPins,
  customPinsPage,
  totalCustomPinsPages,
  setCustomPinsPage,
  mode,
  setMode,
  openCustomPinsSection,
  isAuthenticated,
  openLoginModal,
  focusCoords,
  selectCustomPin,
  startEditingCustomPin,
}: MapPinsMenuProps) {
  return (
    <HudPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Meus Pinos"
      subtitle="Personalizados"
      icon={MapPin}
    >
      <div className="flex h-full flex-col relative overflow-hidden rounded-b-[24px]">
        {/* Subtle technical grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,214,163,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,214,163,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-b-[24px]" />

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative z-10 rounded-b-[24px]">
        {!isAuthenticated ? (
          <LockedFeatureHUD
            title="Acesso Restrito"
            description="O gerenciamento de pins exige autorização nível 1. Sincronização offline."
            onLogin={openLoginModal}
          />
        ) : mode === "pin" && selectedCustomPin ? (
          // Modern Form for creating/editing a custom pin
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center bg-[#0D1216]/80 border border-white/10 rounded-xl text-cyan-400">
                  <MapPin size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                    {editingCustomPinId ? "Modificar Entrada" : "Nova Entrada"}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                    {selectedCustomPin.isPlaced === false 
                      ? "Aguardando coordenadas..." 
                      : `Setor: ${selectedCustomPin.x.toFixed(0)}, ${selectedCustomPin.y.toFixed(0)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelCustomPin}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancelar
                </button>

                {selectedCustomPin.isPlaced && (
                  <button
                    type="button"
                    onClick={confirmCustomPin}
                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/30 transition cursor-pointer"
                  >
                    Registrar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6 px-1">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Identificador
                </label>
                <input
                  type="text"
                  value={selectedCustomPin.name}
                  onChange={(e) => updateSelectedPinField("name", e.target.value)}
                  placeholder="Nome do ponto..."
                  className="w-full bg-[#0D1216]/60 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-200 outline-none focus:border-cyan-500/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                    Cor do Sinal
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-[#0D1216]/60 border border-white/5 rounded-xl">
                    {[
                      "#00d6a3",
                      "#00bcd4",
                      "#ffeb3b",
                      "#ff9800",
                      "#f44336",
                      "#9c27b0",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateSelectedPinField("color", color)}
                        className={cn(
                          "h-5 w-5 rounded-full transition-all ring-offset-2 ring-offset-[#080B0E]",
                          selectedCustomPin.color === color
                            ? "ring-2 ring-white scale-110"
                            : "opacity-40 hover:opacity-100"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                    Ícone Tático
                  </label>
                  <div className="flex gap-2 overflow-x-auto p-3 bg-[#0D1216]/60 border border-white/5 rounded-xl custom-scrollbar">
                    {customPinIcons.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() => updateSelectedPinField("iconId", icon.id)}
                        className={cn(
                          "grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border transition-all",
                          selectedCustomPin.iconId === icon.id
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-white/20"
                        )}
                      >
                        <img
                          src={icon.src}
                          alt={icon.label}
                          className="h-5 w-5 object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Fragmento Visual (Opcional)
                </label>
                <div
                  className={cn(
                    "relative group cursor-pointer border border-dashed rounded-2xl transition-all duration-300 overflow-hidden",
                    selectedCustomPin.imageUrl 
                      ? "border-cyan-500/30 bg-cyan-500/5" 
                      : "border-white/10 bg-[#0D1216]/40 hover:border-white/20 hover:bg-[#0D1216]/60",
                  )}
                  onClick={() => document.getElementById("pin-image-upload-modern")?.click()}
                >
                  <input
                    type="file"
                    id="pin-image-upload-modern"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSelectedPinField("imageUrl", reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {selectedCustomPin.imageUrl ? (
                    <div className="relative aspect-video">
                      <img
                        src={selectedCustomPin.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
                        <ImageIcon className="text-white mb-2" size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Alterar Imagem</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-3">
                      <div className="grid h-10 w-10 place-items-center bg-white/[0.02] border border-white/5 rounded-2xl group-hover:bg-white/[0.05] transition-colors">
                        <ImageIcon size={20} strokeWidth={1.5} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest">Anexar Captura</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Notas Adicionais
                </label>
                <textarea
                  value={selectedCustomPin.description || ""}
                  onChange={(e) => updateSelectedPinField("description", e.target.value)}
                  placeholder="Relatório de observação..."
                  rows={3}
                  className="w-full bg-[#0D1216]/60 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-200 outline-none focus:border-cyan-500/30 transition-all resize-none custom-scrollbar"
                />
              </div>
            </div>
          </div>
        ) : (
          // Modern Pins List
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-1 bg-cyan-500 rounded-full" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Gerenciar Posições
                </h3>
              </div>
              <button
                onClick={openCustomPinsSection}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} strokeWidth={3} />
                <span className="text-[9px] font-black uppercase tracking-widest">Novo Ponto</span>
              </button>
            </div>

            {customPins.length === 0 ? (
              <div className="py-24 px-8 text-center bg-[#0D1216]/40 border border-dashed border-white/5 rounded-3xl">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Banco de Dados Vazio
                </p>
                <p className="text-[10px] font-medium text-slate-600">Nenhuma entrada detectada neste setor.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-2.5">
                  {paginatedCustomPins.map((pin, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      key={pin.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group",
                        editingCustomPinId === pin.id
                          ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                          : "bg-[#0D1216]/50 border-white/5 hover:border-white/10 hover:bg-[#0D1216]",
                      )}
                    >
                      <div
                        className="flex flex-1 items-center gap-4 min-w-0 cursor-pointer"
                        onClick={() => {
                          selectCustomPin(pin.id);
                          focusCoords({ x: pin.x, y: pin.y });
                        }}
                      >
                        <div
                          className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 relative overflow-hidden shrink-0 transition-transform group-hover:scale-105 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]"
                          style={{ backgroundColor: pin.color || "#00d6a3" }}
                        >
                          <img
                            src={getMarkerIconSrc(pin.iconId)}
                            alt=""
                            className="h-6 w-6 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-black text-slate-200 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                            {pin.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">
                              Setor: {pin.x.toFixed(0)}, {pin.y.toFixed(0)}
                            </span>
                            {pin.tags && pin.tags.length > 0 && (
                              <>
                                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                <span className="truncate text-[8px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                                  {pin.tags[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-4 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCustomPinVisibility(pin.id); }}
                          className={cn(
                            "p-2 rounded-xl transition-all cursor-pointer border",
                            pin.isPlaced === false 
                              ? "bg-red-500/10 border-red-500/20 text-red-400" 
                              : "bg-white/[0.02] border-transparent text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20"
                          )}
                        >
                          {pin.isPlaced === false ? <WifiOff size={14} /> : <Wifi size={14} />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditingCustomPin(pin.id); }}
                          className="p-2 rounded-xl bg-white/[0.02] border border-transparent text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer"
                        >
                          <Plus size={14} className="rotate-45" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCustomPin(pin.id); }}
                          className="p-2 rounded-xl bg-white/[0.02] border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <HUDPagination
                  currentPage={customPinsPage}
                  totalPages={totalCustomPinsPages}
                  onPageChange={setCustomPinsPage}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </HudPanel>
  );
});

export default MapPinsMenu;
