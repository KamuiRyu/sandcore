import { useState, useRef } from "react";
import {
  Users,
  Scroll,
  Settings,
  Briefcase,
  Building,
  Coins,
  RefreshCw,
  Check,
  X,
  Plus,
  Edit3,
  Archive,
  Trash2,
  Eye,
  UserPlus,
  Upload,
} from "lucide-react";
import { pb } from "../../../../lib/pocketbase";
import { useAdminViewModel } from "../viewModels/useAdmin.viewModel";
import { MissionRankBadge } from "../components/MissionRankBadge";
import {
  VillageSection,
  VillageCard,
  VillagePrimaryButton,
  VillageSecondaryButton,
  VillageInput,
  VillageSelect,
  StatusBadge,
  VillageIconButton,
} from "../components/VillageSection";
import { usePagination, Pagination } from "../components/Pagination";
import { User } from "../../../authentication/core/entities/User.entity";
import { MissionTemplate } from "../../core/entities/MissionTemplate.entity";
import { Title } from "../../core/entities/Title.entity";
import { MissionRank } from "../../core/entities/VillageSettings.entity";

type AdminTab =
  | "members"
  | "missions"
  | "assign"
  | "reviews"
  | "settings"
  | "titles"
  | "orgs"
  | "bank";

const TABS: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "members", label: "Membros", icon: Users },
  { id: "missions", label: "Missões", icon: Scroll },
  { id: "assign", label: "Atribuir", icon: UserPlus },
  { id: "reviews", label: "Avaliações", icon: Eye },
  { id: "titles", label: "Títulos", icon: Briefcase },
  { id: "orgs", label: "Organizações", icon: Building },
  { id: "bank", label: "Banco", icon: Coins },
  { id: "settings", label: "Config.", icon: Settings },
];

const RANKS: MissionRank[] = ["D", "C", "B", "A", "S"];

// ─── Members Tab ─────────────────────────────────────────────────────────────

const MembersTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [editUser, setEditUser] = useState<User | null>(null);

  const list = tab === "pending" ? vm.pendingUsers : vm.approvedUsers;
  const pg = usePagination(list);

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", gap: 4 }}>
        {(["pending", "approved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              pg.setPage(1);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 2,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              cursor: "pointer",
              background: tab === t ? "rgba(200,134,10,0.2)" : "transparent",
              border: `1px solid ${tab === t ? "#c8860a" : "#1e1e1e"}`,
              color: tab === t ? "#c8860a" : "#9a7a40",
            }}
          >
            {t === "pending"
              ? `PENDENTES (${vm.pendingUsers.length})`
              : `APROVADOS (${vm.approvedUsers.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {pg.paged.map((u) => (
          <VillageCard key={u.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#e8d5a0" }}
                >
                  {u.name}
                </div>
                <div style={{ fontSize: 11, color: "#9a7a40" }}>
                  {u.email} · {new Date(u.created).toLocaleDateString("pt-BR")}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <StatusBadge status={u.status} />
                  <span
                    style={{
                      fontSize: 11,
                      color: "#9a7a40",
                      fontFamily: "'Orbitron', sans-serif",
                    }}
                  >
                    {u.role} {u.ninja_rank ? `· ${u.ninja_rank}` : ""}{" "}
                    {u.level ? `· Nv.${u.level}` : ""}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {u.status === "pending" && (
                  <>
                    <VillagePrimaryButton
                      small
                      onClick={() => vm.approveUser(u.id)}
                    >
                      <Check size={10} /> Aprovar
                    </VillagePrimaryButton>
                    <VillageSecondaryButton
                      small
                      danger
                      onClick={() => vm.rejectUser(u.id)}
                    >
                      <X size={10} /> Recusar
                    </VillageSecondaryButton>
                  </>
                )}
                {u.status === "approved" && (
                  <>
                    <VillageSecondaryButton
                      small
                      onClick={() => setEditUser(u)}
                    >
                      <Edit3 size={10} /> Editar
                    </VillageSecondaryButton>
                    <VillageSecondaryButton
                      small
                      danger
                      onClick={() => vm.rejectUser(u.id)}
                    >
                      <X size={10} /> Revogar
                    </VillageSecondaryButton>
                  </>
                )}
              </div>
            </div>
          </VillageCard>
        ))}
        {list.length === 0 && (
          <div
            style={{
              color: "#282828",
              fontSize: 12,
              textAlign: "center",
              padding: "30px 0",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Nenhum membro {tab === "pending" ? "pendente" : "aprovado"}
          </div>
        )}
      </div>
      <Pagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        onPage={pg.setPage}
      />

      {editUser && (
        <EditUserModal
          user={editUser}
          vm={vm}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
};

const EditUserModal = ({
  user,
  vm,
  onClose,
}: {
  user: User;
  vm: ReturnType<typeof useAdminViewModel>;
  onClose: () => void;
}) => {
  const [role, setRole] = useState<string>(user.role);
  const [ninja_rank, setNinjaRank] = useState<string>(user.ninja_rank || "");
  const [level, setLevel] = useState(String(user.level || 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await vm.updateUserField(user.id, {
      role: role as any,
      ninja_rank: ninja_rank as any,
      level: parseInt(level) || 0,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #282828",
          borderRadius: 3,
          padding: 20,
          minWidth: 320,
          maxWidth: 400,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#e8d5a0",
            marginBottom: 18,
            fontFamily: "'Cinzel', serif",
          }}
        >
          Editar: {user.name}
        </div>
        <div className="space-y-3">
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              ROLE
            </div>
            <VillageSelect value={role} onChange={setRole}>
              <option value="ninja">Ninja</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </VillageSelect>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              POSTO
            </div>
            <VillageSelect value={ninja_rank} onChange={setNinjaRank}>
              <option value="">–</option>
              <option value="genin">Genin</option>
              <option value="chunin">Chunin</option>
              <option value="jonin">Jonin</option>
              <option value="anbu">ANBU</option>
              <option value="kage">Kage</option>
            </VillageSelect>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              NÍVEL
            </div>
            <VillageInput
              type="number"
              value={level}
              onChange={setLevel}
              placeholder="0"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <VillagePrimaryButton onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </VillagePrimaryButton>
          <VillageSecondaryButton onClick={onClose}>
            Cancelar
          </VillageSecondaryButton>
        </div>
      </div>
    </div>
  );
};

// ─── Missions Tab ─────────────────────────────────────────────────────────────

const MissionsTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [showForm, setShowForm] = useState(false);
  const [editTpl, setEditTpl] = useState<MissionTemplate | null>(null);
  const [locationImageFiles, setLocationImageFiles] = useState<File[]>([]);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    rank: "D" as MissionRank,
    min_ninja_rank: "",
    min_level: "0",
    reward_yens: "0",
    reward_items: "",
    reward_points: "0",
    is_active: true,
  });
  const pg = usePagination(vm.templates);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      rank: "D",
      min_ninja_rank: "",
      min_level: "0",
      reward_yens: "0",
      reward_items: "",
      reward_points: "0",
      is_active: true,
    });
    setLocationImageFiles([]);
    setShouldRemoveImage(false);
  };

  const openEdit = (t: MissionTemplate) => {
    setEditTpl(t);
    setForm({
      title: t.title,
      description: t.description || "",
      rank: t.rank,
      min_ninja_rank: t.min_ninja_rank || "",
      min_level: String(t.min_level),
      reward_yens: String(t.reward_yens),
      reward_items: t.reward_items || "",
      reward_points: String(t.reward_points),
      is_active: t.is_active,
    });
    setLocationImageFiles([]);
    setShouldRemoveImage(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("rank", form.rank);
    formData.append("min_ninja_rank", form.min_ninja_rank);
    formData.append("min_level", String(parseInt(form.min_level) || 0));
    formData.append("reward_yens", String(parseInt(form.reward_yens) || 0));
    formData.append("reward_points", String(parseInt(form.reward_points) || 0));
    formData.append("reward_items", form.reward_items);
    formData.append("is_active", String(form.is_active));

    if (locationImageFiles.length > 0) {
      locationImageFiles.forEach((file) => {
        formData.append("location_image", file);
      });
    } else if (shouldRemoveImage) {
      formData.append("location_image", "");
    }

    if (editTpl) {
      await vm.editTemplate(editTpl.id, formData);
    } else {
      await vm.addTemplate(formData);
    }
    setShowForm(false);
    setEditTpl(null);
    resetForm();
  };

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <VillagePrimaryButton
          onClick={() => {
            resetForm();
            setEditTpl(null);
            setShowForm(true);
          }}
        >
          <Plus size={11} /> Nova Missão
        </VillagePrimaryButton>
      </div>

      {showForm && (
        <VillageCard>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#c8860a",
              marginBottom: 14,
              fontFamily: "'Cinzel', serif",
            }}
          >
            {editTpl ? "Editar Missão" : "Nova Missão"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                TÍTULO
              </div>
              <VillageInput
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                placeholder="Nome da missão"
              />
            </div>
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                DESCRIÇÃO
              </div>
              <VillageInput
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Detalhes da missão"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                RANK
              </div>
              <VillageSelect
                value={form.rank}
                onChange={(v) =>
                  setForm((f) => ({ ...f, rank: v as MissionRank }))
                }
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    Rank {r}
                  </option>
                ))}
              </VillageSelect>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                POSTO MÍNIMO
              </div>
              <VillageSelect
                value={form.min_ninja_rank}
                onChange={(v) => setForm((f) => ({ ...f, min_ninja_rank: v }))}
              >
                <option value="">Nenhum</option>
                <option value="genin">Genin</option>
                <option value="chunin">Chunin</option>
                <option value="jonin">Jonin</option>
                <option value="anbu">ANBU</option>
                <option value="kage">Kage</option>
              </VillageSelect>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                NÍVEL MÍNIMO
              </div>
              <VillageInput
                type="number"
                value={form.min_level}
                onChange={(v) => setForm((f) => ({ ...f, min_level: v }))}
                placeholder="0"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                RECOMPENSA (YENS)
              </div>
              <VillageInput
                type="number"
                value={form.reward_yens}
                onChange={(v) => setForm((f) => ({ ...f, reward_yens: v }))}
                placeholder="0"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                PONTOS DE TÍTULO
              </div>
              <VillageInput
                type="number"
                value={form.reward_points}
                onChange={(v) => setForm((f) => ({ ...f, reward_points: v }))}
                placeholder="0"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                ITENS (TEXTO)
              </div>
              <VillageInput
                value={form.reward_items}
                onChange={(v) => setForm((f) => ({ ...f, reward_items: v }))}
                placeholder="Ex: 5x Poção"
              />
            </div>
            
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                IMAGENS DE LOCALIZAÇÃO / REFERÊNCIA (MÚLTIPLAS)
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setLocationImageFiles((prev) => [...prev, ...selected]);
                    setShouldRemoveImage(false);
                  }}
                />
                <VillageSecondaryButton
                  small
                  onClick={() => imageRef.current?.click()}
                >
                  <Upload size={12} /> Selecionar imagens
                </VillageSecondaryButton>
                
                {shouldRemoveImage && (
                  <span style={{ fontSize: 11, color: "#f87171", fontFamily: "'Orbitron', sans-serif" }}>
                    Imagens existentes serão removidas ao salvar
                  </span>
                )}
              </div>

              {/* List of newly selected files */}
              {locationImageFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "#9a7a40", fontFamily: "'Orbitron', sans-serif" }}>
                    Novas imagens selecionadas:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {locationImageFiles.map((file, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #1e1e1e", borderRadius: 3, padding: "4px 8px", background: "rgba(255,255,255,0.02)" }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 2 }}
                        />
                        <span style={{ fontSize: 11, color: "#e8d5a0", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLocationImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11, padding: "2px" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* List of existing files in DB */}
              {editTpl?.location_image && !shouldRemoveImage && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "#9a7a40", fontFamily: "'Orbitron', sans-serif" }}>
                    Imagens existentes:
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {(Array.isArray(editTpl.location_image) ? editTpl.location_image : [editTpl.location_image]).map((imgName, i) => {
                      if (!imgName) return null;
                      return (
                        <div key={i} style={{ position: "relative", border: "1px solid #1e1e1e", borderRadius: 3, overflow: "hidden", width: 40, height: 40 }}>
                          <img
                            src={pb.files.getUrl(editTpl!, imgName)}
                            alt="Existing"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                      );
                    })}
                    <VillageSecondaryButton
                      small
                      danger
                      onClick={() => setShouldRemoveImage(true)}
                    >
                      Remover todas
                    </VillageSecondaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <VillagePrimaryButton onClick={handleSave}>
              {editTpl ? "Salvar" : "Criar"}
            </VillagePrimaryButton>
            <VillageSecondaryButton
              onClick={() => {
                setShowForm(false);
                setEditTpl(null);
                resetForm();
              }}
            >
              Cancelar
            </VillageSecondaryButton>
          </div>
        </VillageCard>
      )}

      <div className="space-y-2">
        {pg.paged.map((t) => (
          <VillageCard key={t.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MissionRankBadge rank={t.rank} />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: t.is_active ? "#e8d5a0" : "#6a5028",
                    }}
                  >
                    {t.title}
                  </div>
                  {t.description && (
                    <div
                      style={{ fontSize: 11, color: "#9a7a40", marginTop: 2 }}
                    >
                      {t.description}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 11,
                      color: "#c8a030",
                      marginTop: 4,
                    }}
                  >
                    {t.reward_yens > 0 && <span>💰 {t.reward_yens}¥</span>}
                    {t.reward_points > 0 && (
                      <span>⭐ {t.reward_points}pts</span>
                    )}
                    {!t.is_active && (
                      <span style={{ color: "#6a5028" }}>ARQUIVADA</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <VillageIconButton
                  icon={Edit3}
                  onClick={() => openEdit(t)}
                  title="Editar"
                />
                {t.is_active && (
                  <VillageIconButton
                    icon={Archive}
                    onClick={() => vm.archiveTemplate(t.id)}
                    title="Arquivar"
                  />
                )}
              </div>
            </div>
          </VillageCard>
        ))}
      </div>
      <Pagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        onPage={pg.setPage}
      />
    </div>
  );
};

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

const ReviewsTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const pg = usePagination(vm.pendingReviews);

  return (
    <div className="space-y-2">
      {vm.pendingReviews.length === 0 ? (
        <div
          style={{
            color: "#282828",
            fontSize: 10,
            textAlign: "center",
            padding: "40px 0",
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          Nenhuma missão aguardando avaliação
        </div>
      ) : (
        pg.paged.map((a) => {
          const tpl = a.expand?.template;
          const ninja = a.expand?.assigned_to;
          return (
            <VillageCard key={a.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    {tpl && <MissionRankBadge rank={tpl.rank as MissionRank} />}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e8d5a0",
                      }}
                    >
                      {tpl?.title || "Missão"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#9a7a40" }}>
                    Ninja:{" "}
                    <span style={{ color: "#c8a030" }}>
                      {ninja?.name || "–"}
                    </span>{" "}
                    · {a.day}
                  </div>
                  {a.submitted_at && (
                    <div
                      style={{ fontSize: 11, color: "#9a7a40", marginTop: 2 }}
                    >
                      Enviado em:{" "}
                      {new Date(a.submitted_at).toLocaleString("pt-BR")}
                    </div>
                  )}
                  {tpl && (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 11,
                        color: "#c8a030",
                        marginTop: 6,
                      }}
                    >
                      {tpl.reward_yens > 0 && (
                        <span>💰 {tpl.reward_yens}¥</span>
                      )}
                      {tpl.reward_points > 0 && (
                        <span>⭐ {tpl.reward_points}pts</span>
                      )}
                    </div>
                  )}

                  {a.evidence && (
                    <div style={{ marginTop: 10, borderTop: "1px dashed #282828", paddingTop: 8 }}>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#9a7a40",
                          fontFamily: "'Orbitron', sans-serif",
                          marginBottom: 6,
                        }}
                      >
                        EVIDÊNCIAS ENVIADAS:
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(Array.isArray(a.evidence) ? a.evidence : [a.evidence]).map((filename, i) => {
                          if (!filename) return null;
                          const fileUrl = pb.files.getUrl(a, filename);
                          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);

                          return (
                            <a
                              key={i}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                border: "1px solid #1e1e1e",
                                borderRadius: 3,
                                padding: 4,
                                background: "rgba(0,0,0,0.4)",
                                cursor: "zoom-in",
                                width: 70,
                              }}
                            >
                              {isImage ? (
                                <img
                                  src={fileUrl}
                                  alt={`Evidência ${i + 1}`}
                                  style={{
                                    width: "100%",
                                    height: 50,
                                    objectFit: "cover",
                                    borderRadius: 2,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: 50,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 16,
                                  }}
                                >
                                  📂
                                </div>
                              )}
                              <span
                                style={{
                                  fontSize: 8,
                                  color: "#9a7a40",
                                  marginTop: 4,
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  width: "100%",
                                  textAlign: "center",
                                }}
                              >
                                Doc {i + 1}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {rejectOpen === a.id && (
                    <div style={{ marginTop: 8 }}>
                      <VillageInput
                        value={rejectNote[a.id] || ""}
                        onChange={(v) =>
                          setRejectNote((n) => ({ ...n, [a.id]: v }))
                        }
                        placeholder="Motivo da rejeição..."
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <VillagePrimaryButton
                    small
                    onClick={() => vm.approveAssignment(a.id)}
                  >
                    <Check size={10} /> Aprovar
                  </VillagePrimaryButton>
                  {rejectOpen === a.id ? (
                    <VillageSecondaryButton
                      small
                      danger
                      onClick={() => {
                        vm.rejectAssignment(a.id, rejectNote[a.id] || "");
                        setRejectOpen(null);
                      }}
                    >
                      <X size={10} /> Confirmar
                    </VillageSecondaryButton>
                  ) : (
                    <VillageSecondaryButton
                      small
                      danger
                      onClick={() => setRejectOpen(a.id)}
                    >
                      <X size={10} /> Rejeitar
                    </VillageSecondaryButton>
                  )}
                </div>
              </div>
            </VillageCard>
          );
        })
      )}
      <Pagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        onPage={pg.setPage}
      />
    </div>
  );
};

// ─── Atribuir Tab ──────────────────────────────────────────────────────────────

const AssignTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [day, setDay] = useState(() => {
    const now = new Date();
    if (now.getHours() < 12) now.setDate(now.getDate() - 1);
    return now.toLocaleDateString("sv"); // YYYY-MM-DD
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeTemplates = vm.templates.filter((t) => t.is_active);

  const handleAssign = async () => {
    if (!selectedUser || !selectedTemplate || !day) {
      setError("Selecione o membro, a missão e a data.");
      return;
    }
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      await vm.assignMission(selectedTemplate, selectedUser, day);
      setSuccess(true);
      setSelectedUser("");
      setSelectedTemplate("");
    } catch (e: any) {
      setError(e.message || "Erro ao atribuir missão.");
    } finally {
      setLoading(false);
    }
  };

  const pg = usePagination(vm.assignments);

  return (
    <div className="space-y-3">
      <VillageSection label="Atribuir Missão" />
      <VillageCard>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 5,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              MEMBRO
            </div>
            <VillageSelect value={selectedUser} onChange={setSelectedUser}>
              <option value="">Selecione...</option>
              {vm.approvedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} [{u.role}]
                </option>
              ))}
            </VillageSelect>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 5,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              MISSÃO
            </div>
            <VillageSelect
              value={selectedTemplate}
              onChange={setSelectedTemplate}
            >
              <option value="">Selecione...</option>
              {activeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  [Rank {t.rank}] {t.title}
                </option>
              ))}
            </VillageSelect>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 5,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              DATA (AAAA-MM-DD)
            </div>
            <VillageInput
              value={day}
              onChange={setDay}
              placeholder="Ex: 2026-06-26"
            />
          </div>
        </div>

        {error && (
          <div
            style={{
              color: "#f87171",
              fontSize: 10,
              marginTop: 10,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div
            style={{
              color: "#34d399",
              fontSize: 10,
              marginTop: 10,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            ✅ Missão atribuída com sucesso!
          </div>
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}
        >
          <VillagePrimaryButton onClick={handleAssign} disabled={loading}>
            {loading ? "Atribuindo..." : "Atribuir Missão"}
          </VillagePrimaryButton>
        </div>
      </VillageCard>

      <div style={{ height: 10 }} />

      <VillageSection label="Missões em Andamento" />
      <div className="space-y-2">
        {vm.assignments.length === 0 ? (
          <div
            style={{
              color: "#282828",
              fontSize: 10,
              textAlign: "center",
              padding: "20px 0",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Nenhuma missão em andamento
          </div>
        ) : (
          pg.paged.map((a) => {
            const tpl = a.expand?.template;
            const ninja = a.expand?.assigned_to;
            return (
              <VillageCard key={a.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      {tpl && (
                        <MissionRankBadge rank={tpl.rank as MissionRank} />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#e8d5a0",
                        }}
                      >
                        {tpl?.title || "Missão excluída"}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#9a7a40", marginTop: 3 }}
                    >
                      Atribuído a:{" "}
                      <span style={{ color: "#c8a030" }}>
                        {ninja?.name || "Desconhecido"}
                      </span>{" "}
                      · Dia: {a.day}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 2,
                        background:
                          a.status === "pending_review"
                            ? "rgba(200,160,48,0.15)"
                            : "rgba(100,100,100,0.15)",
                        border:
                          a.status === "pending_review"
                            ? "1px solid rgba(200,160,48,0.4)"
                            : "1px solid rgba(100,100,100,0.4)",
                        color:
                          a.status === "pending_review" ? "#c8a030" : "#999999",
                      }}
                    >
                      {a.status === "pending_review"
                        ? "AVALIAÇÃO PENDENTE"
                        : "EM ANDAMENTO"}
                    </span>
                  </div>
                </div>
              </VillageCard>
            );
          })
        )}
      </div>
      <Pagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        onPage={pg.setPage}
      />
    </div>
  );
};

// ─── Titles Tab ───────────────────────────────────────────────────────────────

const TitlesTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [form, setForm] = useState({
    name: "",
    min_points: "0",
    description: "",
    order: "0",
  });
  const [editing, setEditing] = useState<Title | null>(null);
  const [showForm, setShowForm] = useState(false);

  const openEdit = (t: Title) => {
    setEditing(t);
    setForm({
      name: t.name,
      min_points: String(t.min_points),
      description: t.description || "",
      order: String(t.order),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      min_points: parseInt(form.min_points) || 0,
      order: parseInt(form.order) || 0,
    };
    if (editing) {
      await vm.editTitle(editing.id, data);
    } else {
      await vm.addTitle(data as any);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", min_points: "0", description: "", order: "0" });
  };

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <VillagePrimaryButton
          onClick={() => {
            setEditing(null);
            setForm({ name: "", min_points: "0", description: "", order: "0" });
            setShowForm(true);
          }}
        >
          <Plus size={11} /> Novo Título
        </VillagePrimaryButton>
      </div>
      {showForm && (
        <VillageCard>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                NOME
              </div>
              <VillageInput
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Nome do título"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                PONTOS MÍNIMOS
              </div>
              <VillageInput
                type="number"
                value={form.min_points}
                onChange={(v) => setForm((f) => ({ ...f, min_points: v }))}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                ORDEM
              </div>
              <VillageInput
                type="number"
                value={form.order}
                onChange={(v) => setForm((f) => ({ ...f, order: v }))}
              />
            </div>
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                DESCRIÇÃO
              </div>
              <VillageInput
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Descrição do título"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <VillagePrimaryButton onClick={handleSave}>
              {editing ? "Salvar" : "Criar"}
            </VillagePrimaryButton>
            <VillageSecondaryButton onClick={() => setShowForm(false)}>
              Cancelar
            </VillageSecondaryButton>
          </div>
        </VillageCard>
      )}
      <div className="space-y-2">
        {vm.titles.map((t) => (
          <VillageCard key={t.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#e8b840" }}
                >
                  {t.name}
                </div>
                <div style={{ fontSize: 11, color: "#9a7a40", marginTop: 2 }}>
                  {t.min_points} pontos mínimos{" "}
                  {t.description ? `· ${t.description}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <VillageIconButton
                  icon={Edit3}
                  onClick={() => openEdit(t)}
                  title="Editar"
                />
                <VillageIconButton
                  icon={Trash2}
                  danger
                  onClick={() => vm.removeTitle(t.id)}
                  title="Excluir"
                />
              </div>
            </div>
          </VillageCard>
        ))}
      </div>
    </div>
  );
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────

const SettingsTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [form, setForm] = useState({
    max_daily_missions: String(vm.settings?.max_daily_missions || 5),
    daily_points_per_ninja: String(vm.settings?.daily_points_per_ninja || 20),
    min_donation_amount: String(vm.settings?.min_donation_amount || 0),
    donation_period: (vm.settings?.donation_period || "weekly") as string,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await vm.saveSettings({
      max_daily_missions: parseInt(form.max_daily_missions) || 5,
      daily_points_per_ninja: parseInt(form.daily_points_per_ninja) || 20,
      min_donation_amount: parseInt(form.min_donation_amount) || 0,
      donation_period: form.donation_period as any,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!vm.settings) {
    return (
      <div
        style={{
          color: "#9a7a40",
          fontSize: 12,
          padding: 24,
          fontFamily: "'Orbitron', sans-serif",
          textAlign: "center",
        }}
      >
        Nenhuma configuração encontrada no banco. Crie o registro
        village_settings no PocketBase.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VillageSection label="Missões Diárias" />
      <VillageCard>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              MISSÕES DIÁRIAS POR NINJA
            </div>
            <VillageInput
              type="number"
              value={form.max_daily_missions}
              onChange={(v) =>
                setForm((f) => ({ ...f, max_daily_missions: v }))
              }
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              PONTOS DIÁRIOS POR NINJA
            </div>
            <VillageInput
              type="number"
              value={form.daily_points_per_ninja}
              onChange={(v) =>
                setForm((f) => ({ ...f, daily_points_per_ninja: v }))
              }
            />
          </div>
        </div>
      </VillageCard>

      <VillageSection label="Custo de Pontos por Rank" />
      <VillageCard>
        <div className="grid grid-cols-5 gap-2">
          {(["D", "C", "B", "A", "S"] as MissionRank[]).map((r) => (
            <div key={r}>
              <MissionRankBadge rank={r} />
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  color: "#9a7a40",
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                {vm.settings?.points_cost?.[r] ?? "–"} pts
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "#282828",
            marginTop: 8,
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          Edite os custos diretamente no PocketBase
          (village_settings.points_cost)
        </div>
      </VillageCard>

      <VillageSection label="Doações" />
      <VillageCard>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              DOAÇÃO MÍNIMA
            </div>
            <VillageInput
              type="number"
              value={form.min_donation_amount}
              onChange={(v) =>
                setForm((f) => ({ ...f, min_donation_amount: v }))
              }
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#9a7a40",
                marginBottom: 4,
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              PERÍODO
            </div>
            <VillageSelect
              value={form.donation_period}
              onChange={(v) => setForm((f) => ({ ...f, donation_period: v }))}
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </VillageSelect>
          </div>
        </div>
      </VillageCard>

      <VillagePrimaryButton onClick={save} disabled={saving}>
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar Configurações"}
      </VillagePrimaryButton>
    </div>
  );
};

// ─── Bank Tab ─────────────────────────────────────────────────────────────────

const BankTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const balance = vm.settings?.bank_balance ?? 0;
  const typeLabel = {
    reward_payout: "Pagamento",
    tax_income: "Imposto",
    donation_income: "Doação",
  };
  const pg = usePagination(vm.transactions);

  return (
    <div className="space-y-4">
      <VillageCard>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              fontSize: 9,
              color: "#9a7a40",
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Saldo do Banco da Vila
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#c8860a",
              fontFamily: "'Cinzel', serif",
              marginTop: 6,
            }}
          >
            {balance.toLocaleString("pt-BR")} ¥
          </div>
        </div>
      </VillageCard>
      <VillageSection label="Últimas Transações" />
      <div className="space-y-1">
        {pg.paged.map((t) => (
          <div
            key={t.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              background: "rgba(8,8,8,0.7)",
              border: "1px solid #1e1204",
              borderRadius: 3,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#e8d5a0" }}>
                {t.description || typeLabel[t.type]}
              </div>
              <div style={{ fontSize: 11, color: "#9a7a40", marginTop: 2 }}>
                {new Date(t.created).toLocaleString("pt-BR")}
              </div>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "'Orbitron', sans-serif",
                color: t.type === "reward_payout" ? "#e07070" : "#5ac87a",
              }}
            >
              {t.type === "reward_payout" ? "-" : "+"}
              {t.amount.toLocaleString("pt-BR")}¥
            </span>
          </div>
        ))}
        {vm.transactions.length === 0 && (
          <div
            style={{
              color: "#282828",
              fontSize: 12,
              textAlign: "center",
              padding: "30px 0",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Nenhuma transação registrada
          </div>
        )}
      </div>
      <Pagination
        page={pg.page}
        totalPages={pg.totalPages}
        total={pg.total}
        onPage={pg.setPage}
      />
    </div>
  );
};

// ─── Orgs Tab ─────────────────────────────────────────────────────────────────

const OrgsTab = ({ vm }: { vm: ReturnType<typeof useAdminViewModel> }) => {
  const [selectedOrg, setSelectedOrg] = useState<
    "policia" | "hospital" | "assistente"
  >("policia");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    role_name: "",
    yens_per_minute: "0",
    is_manager: false,
    order: "0",
  });

  const roles = vm.getOrgRolesByType(selectedOrg);

  const save = async () => {
    await vm.addOrgRole({
      ...form,
      organization: selectedOrg,
      yens_per_minute: parseFloat(form.yens_per_minute) || 0,
      order: parseInt(form.order) || 0,
    });
    setShowForm(false);
    setForm({
      role_name: "",
      yens_per_minute: "0",
      is_manager: false,
      order: "0",
    });
  };

  const ORG_LABELS = {
    policia: "Polícia",
    hospital: "Hospital",
    assistente: "Assistentes",
  };

  return (
    <div className="space-y-3">
      <div style={{ display: "flex", gap: 4 }}>
        {(["policia", "hospital", "assistente"] as const).map((org) => (
          <button
            key={org}
            onClick={() => setSelectedOrg(org)}
            style={{
              padding: "6px 14px",
              borderRadius: 2,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
              cursor: "pointer",
              background:
                selectedOrg === org ? "rgba(200,134,10,0.2)" : "transparent",
              border: `1px solid ${selectedOrg === org ? "#c8860a" : "#1e1e1e"}`,
              color: selectedOrg === org ? "#c8860a" : "#9a7a40",
            }}
          >
            {ORG_LABELS[org].toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <VillagePrimaryButton small onClick={() => setShowForm(true)}>
            <Plus size={10} /> Cargo
          </VillagePrimaryButton>
        </div>
      </div>

      {showForm && (
        <VillageCard>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                NOME DO CARGO
              </div>
              <VillageInput
                value={form.role_name}
                onChange={(v) => setForm((f) => ({ ...f, role_name: v }))}
                placeholder="Ex: Capitão"
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                YENS/MIN
              </div>
              <VillageInput
                type="number"
                value={form.yens_per_minute}
                onChange={(v) => setForm((f) => ({ ...f, yens_per_minute: v }))}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9a7a40",
                  marginBottom: 5,
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                ORDEM
              </div>
              <VillageInput
                type="number"
                value={form.order}
                onChange={(v) => setForm((f) => ({ ...f, order: v }))}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.is_manager}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_manager: e.target.checked }))
                }
              />
              <span
                style={{
                  fontSize: 9,
                  color: "#9a7a40",
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                É gestor
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <VillagePrimaryButton small onClick={save}>
              Criar
            </VillagePrimaryButton>
            <VillageSecondaryButton small onClick={() => setShowForm(false)}>
              Cancelar
            </VillageSecondaryButton>
          </div>
        </VillageCard>
      )}

      <div className="space-y-2">
        {roles.map((r) => (
          <VillageCard key={r.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#e8d5a0" }}
                >
                  {r.role_name} {r.is_manager ? "⭐" : ""}
                </div>
                <div style={{ fontSize: 11, color: "#9a7a40", marginTop: 2 }}>
                  {r.yens_per_minute} yens/min
                </div>
              </div>
              <VillageIconButton
                icon={Trash2}
                danger
                onClick={() => vm.removeOrgRole(r.id)}
              />
            </div>
          </VillageCard>
        ))}
        {roles.length === 0 && (
          <div
            style={{
              color: "#282828",
              fontSize: 12,
              textAlign: "center",
              padding: "30px 0",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Nenhum cargo cadastrado
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const AdminPanelScreen = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("members");
  const vm = useAdminViewModel();

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span
          style={{
            color: "#9a7a40",
            fontSize: 13,
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          Carregando painel admin...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ color: "#e8d5a0" }}>
      {/* Side nav */}
      <div
        style={{
          width: 150,
          flexShrink: 0,
          borderRight: "1px solid #1e1e1e",
          paddingRight: 12,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const badge =
            t.id === "members"
              ? vm.pendingUsers.length
              : t.id === "reviews"
                ? vm.pendingReviews.length
                : 0;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 2,
                background:
                  activeTab === t.id ? "rgba(200,134,10,0.12)" : "transparent",
                border: `1px solid ${activeTab === t.id ? "#c8860a30" : "transparent"}`,
                color: activeTab === t.id ? "#c8860a" : "#9a7a40",
                fontSize: 11,
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.06em",
                textAlign: "left",
                position: "relative",
              }}
            >
              <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              {t.label}
              {badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 5,
                    background: "#c8860a",
                    color: "#0a0800",
                    borderRadius: 10,
                    padding: "1px 5px",
                    fontSize: 9,
                    fontWeight: 900,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <button
            onClick={vm.reload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#9a7a40",
              background: "transparent",
              border: "1px solid #1e1e1e",
              borderRadius: 2,
              padding: "7px 10px",
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            <RefreshCw size={12} /> Atualizar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pl-4">
        {activeTab === "members" && <MembersTab vm={vm} />}
        {activeTab === "missions" && <MissionsTab vm={vm} />}
        {activeTab === "assign" && <AssignTab vm={vm} />}
        {activeTab === "reviews" && <ReviewsTab vm={vm} />}
        {activeTab === "titles" && <TitlesTab vm={vm} />}
        {activeTab === "settings" && <SettingsTab vm={vm} />}
        {activeTab === "orgs" && <OrgsTab vm={vm} />}
        {activeTab === "bank" && <BankTab vm={vm} />}
      </div>
    </div>
  );
};
