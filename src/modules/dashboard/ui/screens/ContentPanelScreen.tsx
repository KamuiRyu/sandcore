import { useState, useEffect } from "react";
import {
  Search,
  HelpCircle,
  Users,
  Settings,
  BarChart2,
  Hammer,
  Info,
  type LucideIcon,
  FileText,
  Map,
  X,
  Minus,
  Scroll,
  Shield,
  Award as MyMissionsIcon,
  UserCircle,
} from "lucide-react";
import { GroupsScreen } from "../../../groups/ui/screens/GroupsScreen";
import { MapScreen } from "../../../map/ui/screens/MapScreen";
import { SettingsScreen } from "../../../settings/ui/screens/SettingsScreen";
import { StatsScreen } from "./StatsScreen";
import { AppDetailsScreen } from "./AppDetailsScreen";
import { CraftingScreen } from "./CraftingScreen";
import { MissionBoardScreen } from "../../../village/ui/screens/MissionBoardScreen";
import { MyMissionsScreen } from "../../../village/ui/screens/MyMissionsScreen";
import { NinjaCardScreen } from "../../../village/ui/screens/NinjaCardScreen";
import { AdminPanelScreen } from "../../../village/ui/screens/AdminPanelScreen";
import { ManagerScreen } from "../../../village/ui/screens/ManagerScreen";
import { ProfileEditScreen } from "../../../authentication/ui/screens/ProfileEditScreen";
import { HudPanel } from "../../../app/ui/components/HudPanel";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SunagakureLogo } from "../../../app/ui/components/SunagakureLogo";

const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  groups: { label: "Grupos", icon: Users },
  settings: { label: "Configurações", icon: Settings },
  stats: { label: "Estatísticas", icon: BarChart2 },
  details: { label: "Detalhes", icon: Info },
  crafting: { label: "Crafting", icon: Hammer },
  missions: { label: "Missões", icon: Scroll },
  "ninja-card": { label: "Carteirinha", icon: Shield },
  admin: { label: "Admin", icon: Settings },
  manager: { label: "Organização", icon: Users },
  profile: { label: "Perfil", icon: UserCircle },
};

interface ContentPanelScreenProps {
  activeTab: string | null;
  lastActiveTab: string;
}

export const ContentPanelScreen = ({
  activeTab,
  lastActiveTab,
}: ContentPanelScreenProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [missionsSubTab, setMissionsSubTab] = useState<'board' | 'mine'>('board');

  useEffect(() => {
    if (activeTab) {
      setIsClosing(false);
      setIsMounted(true);
    } else {
      setIsClosing(true);
    }
  }, [activeTab]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      window.ipcRenderer?.send("close-panel-window");
    }, 300);
  };

  const isMapTab = lastActiveTab === "map";
  const isNinjaCardTab = lastActiveTab === "ninja-card";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isCraftingTab = lastActiveTab === "crafting";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tabMeta = TAB_META[lastActiveTab] ?? TAB_META["settings"];

  const panelVisible = isMounted && !isClosing;

  return (
    <>
      {/* MAP PANEL — sempre montado. Não usa HudPanel/AnimatePresence para evitar desmontagem
          ao fechar/minimizar. display:none esconde sem destruir o estado React. */}
      <div
        className={`flex flex-col relative overflow-hidden w-[1200px] h-[800px] transition-[opacity,transform,filter] duration-300 ease-out
          ${isMapTab && panelVisible ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-95 blur-sm"}`}
        style={{ display: isMapTab ? "flex" : "none" }}
      >
        {/* Mesma aparência do HudPanel, mas sem AnimatePresence */}
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-[2px]"
          style={{
            background: "linear-gradient(160deg,#0a0a0a 0%,#080808 100%)",
            border: "1px solid rgba(255, 221, 102, 0.4)",
          }}
        >
          {/* Gold top accent */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none z-10"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #282828 15%, #c8860a 40%, #e8a820 50%, #c8860a 60%, #282828 85%, transparent 100%)",
            }}
          />
          {/* Noise overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-[0.04]"
            style={{ backgroundImage: `url("./images/noise.svg")` }}
          />

          {/* Map custom header */}
          <div className="h-14 bg-transparent border-b border-[#282828] px-4 flex items-center justify-between gap-4 select-none z-50 flex-none relative">
            <div className="flex items-center gap-2 min-w-0 flex-none">
              <div
                className="flex items-center justify-center w-[18px] h-[18px] rounded-full border flex-shrink-0"
                style={{ borderColor: "#c8860a", color: "#c8860a" }}
              >
                <Map size={10} />
              </div>
              <div className="flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#c8860a" }}>
                  SandCore
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#9a9080" }}>
                  MAPA
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-sm flex items-center gap-2">
              <div className="flex-1 relative flex items-center">
                <span className="absolute left-3 flex items-center pointer-events-none text-[#9a7a40]">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar recursos no mapa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111]/65 border border-[#282828] rounded-lg py-1.5 pl-9 pr-9 text-xs text-[#f0d9a0] placeholder-[#9a7a40] focus:border-[#c8860a]/50 focus:outline-none transition-colors backdrop-blur-sm"
                />
                <button
                  className="absolute right-2.5 text-[#9a7a40] hover:text-[#c8860a] transition-colors flex items-center justify-center p-0.5 rounded-full hover:bg-white/5 cursor-pointer"
                  title="Ajuda"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center h-full gap-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-map-settings"))}
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded-[1px] border border-[#282828] transition-all cursor-pointer"
                style={{ background: "#1a1a1a", color: "#9a7a40" }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "#c8860a"; el.style.color = "#c8860a"; el.style.background = "#282828"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "#282828"; el.style.color = "#9a7a40"; el.style.background = "#1a1a1a"; }}
                title="Configurações do Mapa"
              >
                <Settings size={11} />
              </button>
              <button
                onClick={() => window.ipcRenderer?.send("minimize-panel-window")}
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded-[1px] border border-[#282828] transition-all cursor-pointer"
                style={{ background: "#1a1a1a", color: "#9a7a40" }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "#c8860a"; el.style.color = "#c8860a"; el.style.background = "#282828"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "#282828"; el.style.color = "#9a7a40"; el.style.background = "#1a1a1a"; }}
                title="Minimizar"
              >
                <Minus size={11} />
              </button>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded-[1px] border border-[#282828] transition-all cursor-pointer"
                style={{ background: "#1a1a1a", color: "#9a7a40" }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "#c8860a"; el.style.color = "#c8860a"; el.style.background = "#282828"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "#282828"; el.style.color = "#9a7a40"; el.style.background = "#1a1a1a"; }}
                title="Fechar"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Map content */}
          <div className="flex-1 overflow-hidden h-full flex flex-col relative z-20">
            <MapScreen searchQuery={searchQuery} />
          </div>
        </div>
      </div>

      {/* NON-MAP PANELS — mount/unmount normalmente com key para animação */}
      {!isMapTab && (
        <div
          key={lastActiveTab}
          className={`flex flex-col relative overflow-hidden transition-[opacity,transform,filter] duration-300 ease-out
            ${panelVisible ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-95 blur-sm"}
            ${['admin', 'manager'].includes(lastActiveTab) ? 'w-[1200px] h-[800px]' : 'w-[450px] h-[550px]'}`}
        >
          {isNinjaCardTab && (
            <div className="w-full h-full relative">
              <NinjaCardScreen onClose={handleClose} />
            </div>
          )}

          {!isNinjaCardTab && <HudPanel
            isOpen={panelVisible}
            onClose={handleClose}
            title={TAB_META[lastActiveTab!]?.label || "Painel"}
            icon={TAB_META[lastActiveTab!]?.icon || FileText}
            standalone={true}
            contentClassName="p-5"
          >
            {lastActiveTab === "groups" && <GroupsScreen />}
            {lastActiveTab === "settings" && <SettingsScreen />}
            {lastActiveTab === "stats" && <StatsScreen />}
            {lastActiveTab === "details" && <AppDetailsScreen />}
            {lastActiveTab === "crafting" && <CraftingScreen />}
            {lastActiveTab === "missions" && (
              <div className="flex flex-col h-full">
                <div className="flex border-b border-[#1a1a1a] flex-none">
                  <button
                    onClick={() => setMissionsSubTab('board')}
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-black uppercase tracking-widest transition-colors cursor-pointer"
                    style={{
                      color: missionsSubTab === 'board' ? '#c8860a' : '#6a5028',
                      borderBottom: missionsSubTab === 'board' ? '2px solid #c8860a' : '2px solid transparent',
                    }}
                  >
                    <Scroll size={11} />
                    Quadro
                  </button>
                  <button
                    onClick={() => setMissionsSubTab('mine')}
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-black uppercase tracking-widest transition-colors cursor-pointer"
                    style={{
                      color: missionsSubTab === 'mine' ? '#c8860a' : '#6a5028',
                      borderBottom: missionsSubTab === 'mine' ? '2px solid #c8860a' : '2px solid transparent',
                    }}
                  >
                    <MyMissionsIcon size={11} />
                    Minhas Missões
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {missionsSubTab === 'board' ? <MissionBoardScreen /> : <MyMissionsScreen />}
                </div>
              </div>
            )}
            {lastActiveTab === "admin" && <AdminPanelScreen />}
            {lastActiveTab === "manager" && <ManagerScreen />}
            {lastActiveTab === "profile" && <ProfileEditScreen />}
          </HudPanel>}
        </div>
      )}
    </>
  );
};
export default ContentPanelScreen;
