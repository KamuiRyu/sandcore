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
  Award,
  Award as MyMissionsIcon,
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

  return (
    <div
      key={lastActiveTab}
      className={`flex flex-col relative overflow-hidden transition-[opacity,transform,filter] duration-300 ease-out
        ${isMounted && !isClosing ? "opacity-100 scale-100 blur-none" : "opacity-0 scale-95 blur-sm"}
        ${['map','admin','manager'].includes(lastActiveTab)
            ? 'w-[1200px] h-[800px]'
            : 'w-[450px] h-[550px]'}
      `}
    >
      {isNinjaCardTab && (
        <div className="w-full h-full relative">
          <NinjaCardScreen onClose={handleClose} />
        </div>
      )}

      {!isNinjaCardTab && <HudPanel
        isOpen={isMounted && !isClosing}
        onClose={handleClose}
        title={TAB_META[lastActiveTab!]?.label || "Painel"}
        icon={TAB_META[lastActiveTab!]?.icon || FileText}
        standalone={true}
        hideHeader={isMapTab}
        contentClassName={isMapTab ? "flex flex-col overflow-hidden p-0" : "p-5"}
      >
        {isMapTab && (
          <div className="h-14 px-4 flex items-center justify-between gap-4 select-none z-50 flex-none relative"
            style={{ borderBottom: '2px solid rgba(90,55,20,.3)', background: 'rgba(90,55,20,.04)' }}
          >
            {/* Title row */}
            <div className="flex items-center gap-2 min-w-0 flex-none">
              <div
                className="flex items-center justify-center w-[18px] h-[18px] rounded-full border flex-shrink-0"
                style={{ borderColor: "rgba(90,55,20,.4)", color: "#3a2614" }}
              >
                <Map size={10} />
              </div>
              <div className="flex items-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#5a3618" }}>
                  SandCore
                </span>
                <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#7a5030" }}>
                  MAPA
                </span>
              </div>
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
                  className="w-full rounded-lg py-1.5 pl-9 pr-9 text-xs focus:outline-none transition-colors"
                  style={{ background: 'rgba(90,55,20,.08)', border: '1px solid rgba(90,55,20,.25)', color: '#3a2614' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.55)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(90,55,20,.25)')}
                />
                <button
                  className="absolute right-2.5 transition-colors flex items-center justify-center p-0.5 rounded-full cursor-pointer"
                  style={{ color: '#7a5030' }}
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
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded transition-all cursor-pointer"
                style={{ background: 'rgba(90,55,20,.08)', border: '1px solid rgba(90,55,20,.25)', color: '#3a2614' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.08)';
                }}
                title="Configurações do Mapa"
              >
                <Settings size={11} />
              </button>
              <button
                onClick={() => window.ipcRenderer?.send("minimize-panel-window")}
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded transition-all cursor-pointer"
                style={{ background: 'rgba(90,55,20,.08)', border: '1px solid rgba(90,55,20,.25)', color: '#3a2614' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.08)';
                }}
                title="Minimizar"
              >
                <Minus size={11} />
              </button>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-5 h-5 text-[11px] rounded transition-all cursor-pointer"
                style={{ background: 'rgba(90,55,20,.08)', border: '1px solid rgba(90,55,20,.25)', color: '#3a2614' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(90,55,20,.08)';
                }}
                title="Fechar"
              >
                <X size={11} />
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
        {!isMapTab && lastActiveTab === "missions" && (
          <div className="flex flex-col h-full">
            <div className="flex flex-none mb-3" style={{ gap: 4, padding: 4, borderRadius: 6, background: 'rgba(90,55,20,.07)', boxShadow: 'inset 0 0 0 1px rgba(90,55,20,.25)' }}>
              {([
                { key: 'board', icon: <Scroll size={10} />, label: 'QUADRO' },
                { key: 'mine', icon: <MyMissionsIcon size={10} />, label: 'MINHAS' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMissionsSubTab(tab.key)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 4, padding: '5px 4px', borderRadius: 4, border: 'none',
                    fontFamily: "'Cinzel', 'Georgia', serif", fontWeight: 700, fontSize: 9, letterSpacing: '0.1em',
                    cursor: 'pointer', transition: 'all .15s',
                    background: missionsSubTab === tab.key ? 'linear-gradient(180deg,#d8b87f,#c19f63)' : 'transparent',
                    boxShadow: missionsSubTab === tab.key ? 'inset 0 2px 4px rgba(80,50,15,.30), inset 0 0 0 1px rgba(90,60,25,.45)' : 'none',
                    color: missionsSubTab === tab.key ? '#194651' : '#3a2614',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {missionsSubTab === 'board' ? <MissionBoardScreen /> : <MyMissionsScreen />}
            </div>
          </div>
        )}
        {!isMapTab && lastActiveTab === "admin" && <AdminPanelScreen />}
        {!isMapTab && lastActiveTab === "manager" && <ManagerScreen />}
      </HudPanel>}
    </div>
  );
};
export default ContentPanelScreen;
