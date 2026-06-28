import { memo, useCallback, useEffect } from "react";
import { X, CheckCircle2, RefreshCw, Zap, Route, ChevronRight } from "lucide-react";
import { cn } from "../../../../lib/utils";
import {
  getMarkerIconSrc,
  getMarkerTypeLabel,
  markerIconsByType,
  getMarkerIconLabel,
} from "../../core/entities/MapConfig.entity";
import { getResourceData } from "../../core/entities/ResourceDefinitions.entity";
import type {
  MapPointReference,
  SavedCustomPin,
  SavedMapRoute,
  RouteCheckpoint,
} from "../../core/entities/MapRoute.entity";

type CompletedPinState = { status: string; subType?: string };

interface CheckpointItem {
  id: string;
  name: string;
  iconId: string;
  type: string;
  subRegionId?: string;
  isCustom: boolean;
  isCompleted: boolean;
  currentSubType?: string;
  allowedOres?: string[];
}

function getAllowedOresForSubRegion(subRegionId?: string): string[] {
  if (!subRegionId)
    return ["ore_1","ore_2","ore_3","ore_4","ore_5","ore_6","ore_7","ore_8","ore_9"];
  const sub = subRegionId.trim().toLowerCase();
  const list: string[] = ["ore_1"];
  if (["vale do fim"].includes(sub)) list.push("ore_2");
  if (["ilha doton","ilha dotou","caverna tetsu","caverna fuji"].includes(sub)) list.push("ore_3","ore_5","ore_9");
  if (["iwagakure"].includes(sub)) list.push("ore_4","ore_7");
  if (["tetsugakure"].includes(sub)) list.push("ore_6","ore_8");
  return list;
}

interface QuickMarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  visibleRoutes: string[];
  savedRoutes: SavedMapRoute[];
  publicRoutes: SavedMapRoute[];
  officialPoints: MapPointReference[];
  customPins: SavedCustomPin[];
  completedPins: Record<string, CompletedPinState>;
  notificationSettings: Record<string, any>;
  updateNotificationSettings: (s: Record<string, any>) => void;
  onMark: (pinId: string, subType?: string, isRestart?: boolean) => void;
}

export const QuickMarkPanel = memo(function QuickMarkPanel({
  isOpen,
  onClose,
  visibleRoutes,
  savedRoutes,
  publicRoutes,
  officialPoints,
  customPins,
  completedPins,
  notificationSettings,
  updateNotificationSettings,
  onMark,
}: QuickMarkPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const checkpoints: CheckpointItem[] = [];
  visibleRoutes.forEach((routeId) => {
    const route =
      savedRoutes.find((r) => r.id === routeId) ||
      publicRoutes.find((r) => r.id === routeId);
    if (!route) return;

    route.route.checkpoints.forEach((cp: RouteCheckpoint) => {
      if (cp.pointId) {
        const pin = officialPoints.find((p) => p.id === cp.pointId);
        if (!pin) return;
        const state = completedPins[pin.id];
        checkpoints.push({
          id: pin.id,
          name: state?.subType ? (getResourceData(state.subType)?.name ?? pin.name) : pin.name,
          iconId: state?.subType ?? pin.iconId,
          type: pin.type,
          subRegionId: pin.subRegionId,
          isCustom: false,
          isCompleted: !!state && state.status !== "ready",
          currentSubType: state?.subType,
          allowedOres: getAllowedOresForSubRegion(pin.subRegionId),
        });
      } else if (cp.customPinId) {
        const pin = customPins.find((p) => p.id === cp.customPinId);
        if (!pin) return;
        const state = completedPins[pin.id];
        checkpoints.push({
          id: pin.id,
          name: pin.name,
          iconId: pin.iconId,
          type: "custom",
          isCustom: true,
          isCompleted: !!state && state.status !== "ready",
        });
      }
    });
  });

  const handleMark = useCallback(
    (item: CheckpointItem, subType?: string) => {
      onMark(item.id, subType);
      if (subType && notificationSettings.rememberLastSubtype && item.type) {
        updateNotificationSettings({
          ...notificationSettings,
          lastSelectedSubTypes: {
            ...notificationSettings.lastSelectedSubTypes,
            [item.type]: subType,
          },
        });
      }
    },
    [onMark, notificationSettings, updateNotificationSettings],
  );

  if (!isOpen) return null;

  const pending = checkpoints.filter((c) => !c.isCompleted);
  const done = checkpoints.filter((c) => c.isCompleted);
  const current = pending[0] ?? null;
  const nextItems = pending.slice(1, 4);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
      <div
        className="absolute inset-0 bg-[#050402]/92 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <div className="relative pointer-events-auto w-[480px] max-h-[82vh] flex flex-col rounded-2xl border border-[rgba(200,134,10,0.25)] bg-[linear-gradient(160deg,#0d0b08_0%,#080808_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-[fade-in_150ms_ease-out]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8860a] to-transparent opacity-60" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(200,134,10,0.12)] border border-[rgba(200,134,10,0.2)]">
            <Zap size={15} className="text-[#c8860a]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-black uppercase tracking-widest text-[#f0d9a0]">
              Marcação Rápida
            </h2>
            <p className="text-[10px] text-[#9a7a40] mt-0.5">
              {pending.length} pendente{pending.length !== 1 ? "s" : ""} · {done.length} concluído{done.length !== 1 ? "s" : ""}
              <span className="ml-2 opacity-60">· ESC para fechar</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#9a7a40] hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {checkpoints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <Route size={28} className="text-[#9a7a40] opacity-40" />
              <p className="text-[11px] text-[#9a7a40]">
                Nenhuma rota ativa com checkpoints.
              </p>
            </div>
          )}

          {/* Current point — large, options already visible */}
          {current && (
            <CurrentPointCard
              item={current}
              notificationSettings={notificationSettings}
              onMark={handleMark}
            />
          )}

          {/* Upcoming */}
          {nextItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9a7a40] px-1">
                Próximos
              </p>
              {nextItems.map((item) => (
                <UpcomingRow key={item.id} item={item} />
              ))}
              {pending.length > 4 && (
                <p className="text-[9px] text-[#9a7a40] text-center py-1 opacity-60">
                  +{pending.length - 4} ponto{pending.length - 4 !== 1 ? "s" : ""} restante{pending.length - 4 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Done */}
          {done.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9a7a40]">
                  Concluídos
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              {done.map((item) => (
                <DoneRow key={item.id} item={item} onMark={handleMark} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function CurrentPointCard({
  item,
  notificationSettings,
  onMark,
}: {
  item: CheckpointItem;
  notificationSettings: Record<string, any>;
  onMark: (item: CheckpointItem, subType?: string) => void;
}) {
  const isOre = item.type === "ore";
  const isMushroom = item.type === "mushroom";
  const hasSubtypes = isOre || isMushroom;

  const lastSubtype: string | undefined =
    notificationSettings.rememberLastSubtype && item.type
      ? notificationSettings.lastSelectedSubTypes?.[item.type]
      : undefined;

  const icons: string[] = hasSubtypes
    ? (markerIconsByType[item.type as keyof typeof markerIconsByType] ?? []).filter(
        (iconId: string) =>
          iconId !== "mushroom_1" && (!isOre || (item.allowedOres ?? []).includes(iconId)),
      )
    : [];

  return (
    <div className="rounded-xl border border-[rgba(200,134,10,0.3)] bg-[rgba(200,134,10,0.06)] p-4">
      {/* Point info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(200,134,10,0.3)] bg-[rgba(200,134,10,0.1)]">
          <img src={getMarkerIconSrc(item.iconId)} alt="" className="h-8 w-8 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-[#f0d9a0] truncate">{item.name}</p>
          <p className="text-[10px] text-[#9a7a40] mt-0.5">
            {getMarkerTypeLabel(item.type as any) || item.type}
          </p>
        </div>
      </div>

      {/* Options */}
      {hasSubtypes ? (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9a7a40] mb-2">
            Identificar {isOre ? "Minério" : "Cogumelo"}
          </p>
          <div className="flex flex-wrap gap-2">
            {(isOre ? (item.allowedOres ?? []).includes("ore_1") : true) && (
              <button
                onClick={() => onMark(item, isOre ? "ore_1" : "mushroom_1")}
                className="flex items-center gap-1.5 rounded-lg border border-[rgba(200,134,10,0.3)] bg-[rgba(200,134,10,0.08)] px-2.5 py-1.5 text-[9px] font-bold text-[#f0d9a0] hover:bg-[rgba(200,134,10,0.2)] transition-colors cursor-pointer"
              >
                <CheckCircle2 size={10} className="text-[#c8860a]" /> Padrão / Já passei
              </button>
            )}
            {icons.map((iconId) => {
              const isLast = lastSubtype === iconId;
              return (
                <button
                  key={iconId}
                  onClick={() => onMark(item, iconId)}
                  title={getMarkerIconLabel(iconId)}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-150 cursor-pointer hover:scale-110",
                    isLast
                      ? "border-[#c8860a] bg-[rgba(200,134,10,0.15)] shadow-[0_0_10px_rgba(200,134,10,0.25)]"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10",
                  )}
                >
                  <img src={getMarkerIconSrc(iconId)} alt="" className="h-6 w-6 object-contain" />
                  {isLast && (
                    <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#c8860a] border-2 border-[#080808]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => onMark(item)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#c8860a] to-[#e0a020] py-2 text-[10px] font-black uppercase tracking-wider text-black hover:brightness-110 transition-all cursor-pointer"
        >
          <CheckCircle2 size={11} /> Marcar como coletado
        </button>
      )}
    </div>
  );
}

function UpcomingRow({ item }: { item: CheckpointItem }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02]">
      <ChevronRight size={10} className="text-[#9a7a40] shrink-0" />
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        <img src={getMarkerIconSrc(item.iconId)} alt="" className="h-5 w-5 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[#c8a060] truncate">{item.name}</p>
        <p className="text-[8px] text-[#9a7a40]">{getMarkerTypeLabel(item.type as any) || item.type}</p>
      </div>
    </div>
  );
}

function DoneRow({
  item,
  onMark,
}: {
  item: CheckpointItem;
  onMark: (item: CheckpointItem, subType?: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02] opacity-55">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
        <img src={getMarkerIconSrc(item.iconId)} alt="" className="h-5 w-5 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-[#f0d9a0] truncate">{item.name}</p>
        <p className="text-[8px] text-emerald-400 font-bold">Concluído</p>
      </div>
      <button
        onClick={() => onMark(item)}
        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-[#9a7a40] hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
      >
        <RefreshCw size={9} /> Desmarcar
      </button>
    </div>
  );
}
