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
} from "lucide-react";
import { GroupsScreen } from "../../../groups/ui/screens/GroupsScreen";
import { MapScreen } from "../../../map/ui/screens/MapScreen";
import { SettingsScreen } from "../../../settings/ui/screens/SettingsScreen";
import { StatsScreen } from "./StatsScreen";
import { AppDetailsScreen } from "./AppDetailsScreen";
import { CraftingScreen } from "./CraftingScreen";
import { HudPanel } from "../../../app/ui/components/HudPanel";
import { SunagakureLogo } from "../../../app/ui/components/SunagakureLogo";

const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  groups: { label: "Grupos", icon: Users },
  settings: { label: "Configurações", icon: Settings },
  stats: { label: "Estatísticas", icon: BarChart2 },
  details: { label: "Detalhes", icon: Info },
  crafting: { label: "Crafting", icon: Hammer },
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
  const isCraftingTab = lastActiveTab === "crafting";

  const tabMeta = TAB_META[lastActiveTab] ?? TAB_META["settings"];

  return (
    <div
      key={lastActiveTab}
      className={`flex flex-col relative overflow-hidden transition-[opacity,transform,filter] duration-300 ease-out
        ${isMounted && !isClosing ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-95 blur-sm"}
        ${isMapTab 
            ? "w-[1200px] h-[800px]" 
            : "w-[450px] h-[550px]"}
      `}
    >
      <HudPanel
        isOpen={isMounted && !isClosing}
        onClose={handleClose}
        title={TAB_META[lastActiveTab!]?.label || "Painel"}
        icon={TAB_META[lastActiveTab!]?.icon || FileText}
        standalone={true}
        hideHeader={isMapTab}
        contentClassName={isMapTab ? "flex flex-col overflow-hidden p-0" : "p-5"}
      >
        {isMapTab && (
          <div className="h-14 bg-transparent border-b border-[#4a2f0a] px-4 flex items-center justify-between gap-4 select-none z-50 flex-none relative">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-none">
              <SunagakureLogo width={20} height={20} active={true} />
              <span className="font-bold text-sm tracking-widest text-[#c8860a]" style={{ fontFamily: "'Cinzel', serif" }}>
                SHINOBI MAP
              </span>
            </div>

            {/* Search, Help */}
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
                  className="w-full bg-[#1a1007]/65 border border-[#4a2f0a] rounded-lg py-1.5 pl-9 pr-9 text-xs text-[#f0d9a0] placeholder-[#9a7a40] focus:border-[#c8860a]/50 focus:outline-none transition-colors backdrop-blur-sm"
                />
                <button
                  className="absolute right-2.5 text-[#9a7a40] hover:text-[#c8860a] transition-colors flex items-center justify-center p-0.5 rounded-full hover:bg-white/5 cursor-pointer"
                  title="Ajuda"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            </div>

            {/* Window controls */}
            <div className="flex items-center h-full gap-2">
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-map-settings"))
                }
                className="w-8 h-8 rounded-[1px] border border-[#4a2f0a] transition-all cursor-pointer text-[#9a7a40]"
                style={{ background: "#2e1f08" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#c8860a";
                  el.style.color = "#c8860a";
                  el.style.background = "#4a2f0a";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#4a2f0a";
                  el.style.color = "#9a7a40";
                  el.style.background = "#2e1f08";
                }}
                title="Configurações do Mapa"
              >
                <svg
                  className="w-4 h-4 mx-auto"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-[1px] border border-[#4a2f0a] transition-all cursor-pointer text-[#9a7a40]"
                style={{ background: "#2e1f08" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#c8860a";
                  el.style.color = "#c8860a";
                  el.style.background = "#4a2f0a";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#4a2f0a";
                  el.style.color = "#9a7a40";
                  el.style.background = "#2e1f08";
                }}
                title="Minimizar"
              >
                <svg
                  className="w-3 h-3 mx-auto"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <line x1="1" y1="5" x2="9" y2="5" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-[1px] border border-[#4a2f0a] transition-all cursor-pointer text-[#9a7a40]"
                style={{ background: "#2e1f08" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#ff3333";
                  el.style.color = "#ffffff";
                  el.style.background = "#cc0000";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#4a2f0a";
                  el.style.color = "#9a7a40";
                  el.style.background = "#2e1f08";
                }}
                title="Fechar"
              >
                <svg
                  className="w-3 h-3 mx-auto"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M1 1L9 9M9 1L1 9" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {isMapTab && (
          <div className="flex-1 overflow-hidden h-full flex flex-col relative z-20">
            <MapScreen searchQuery={searchQuery} />
          </div>
        )}

        {!isMapTab && lastActiveTab === "groups" && <GroupsScreen />}
        {!isMapTab && lastActiveTab === "settings" && <SettingsScreen />}
        {!isMapTab && lastActiveTab === "stats" && <StatsScreen />}
        {!isMapTab && lastActiveTab === "details" && <AppDetailsScreen />}
        {!isMapTab && lastActiveTab === "crafting" && <CraftingScreen />}
      </HudPanel>
    </div>
  );
};
export default ContentPanelScreen;
