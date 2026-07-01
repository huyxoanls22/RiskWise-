import { useState } from "react";
import { Check, Plus, Trash2, RotateCcw, ListChecks, Pencil, FolderPlus, X, Crown } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { MAX_CHECKLISTS } from "../lib/types";
import { Button, Badge, TextInput, Select } from "../components/ui";
import { usePaywall } from "../components/Paywall";
import { useToast } from "../components/Toast";
import { clsx } from "../lib/format";

export default function Checklist() {
  const checklists = useSelector((d) => d.checklists);
  const activeId = useSelector((d) => d.activeChecklistId);
  const premium = useSelector((d) => d.license.premium);
  const openPaywall = usePaywall();
  const toast = useToast();

  const active = checklists.find((c) => c.id === activeId) ?? checklists[0];
  const items = active?.items ?? [];

  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [required, setRequired] = useState(true);
  const [creatingSet, setCreatingSet] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [setName, setSetName] = useState("");

  const requiredItems = items.filter((c) => c.isRequired);
  const requiredDone = requiredItems.filter((c) => c.isChecked).length;
  const allRequiredDone = requiredItems.length > 0 && requiredDone === requiredItems.length;

  const submit = () => {
    actions.addChecklistItem(text, required);
    setText("");
    setAdding(false);
  };

  const startCreate = () => {
    // Free tier is limited to a single checklist; more requires premium.
    if (!premium) {
      openPaywall();
      return;
    }
    if (checklists.length >= MAX_CHECKLISTS) {
      toast(`Tối đa ${MAX_CHECKLISTS} bộ checklist.`, "info");
      return;
    }
    setSetName("");
    setCreatingSet(true);
  };

  const confirmCreate = () => {
    actions.addChecklist(setName);
    setCreatingSet(false);
    toast("Đã tạo bộ checklist mới.");
  };

  const confirmRename = () => {
    actions.renameChecklist(active.id, setName);
    setRenaming(false);
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <ListChecks className="h-4 w-4" /> Checklist trước vào lệnh
        </h3>
        <Badge tone={allRequiredDone ? "pos" : "warn"}>
          {requiredDone}/{requiredItems.length} bắt buộc
        </Badge>
      </div>

      {/* Checklist-set switcher */}
      {renaming ? (
        <div className="mb-4 flex gap-2">
          <TextInput
            autoFocus
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            placeholder="Tên bộ checklist"
          />
          <Button onClick={confirmRename}>Lưu</Button>
          <Button variant="ghost" onClick={() => setRenaming(false)} aria-label="cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : creatingSet ? (
        <div className="mb-4 flex gap-2">
          <TextInput
            autoFocus
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmCreate()}
            placeholder="VD: Scalping M5, Swing D1…"
          />
          <Button onClick={confirmCreate}>Tạo</Button>
          <Button variant="ghost" onClick={() => setCreatingSet(false)} aria-label="cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <Select
            value={active.id}
            onChange={(v) => actions.setActiveChecklist(v)}
            options={checklists.map((c) => ({ value: c.id, label: c.name }))}
            className="flex-1"
          />
          <button
            onClick={() => {
              setSetName(active.name);
              setRenaming(true);
            }}
            className="rounded-lg p-2 text-faint transition hover:bg-surface-2 hover:text-text"
            aria-label="rename"
            title="Đổi tên bộ"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={startCreate}
            className="flex items-center gap-1 rounded-lg p-2 text-faint transition hover:bg-surface-2 hover:text-text"
            aria-label="new checklist"
            title={premium ? "Tạo bộ checklist mới" : "Tạo thêm bộ — cần Premium"}
          >
            {premium ? <FolderPlus className="h-4 w-4" /> : <Crown className="h-4 w-4 text-brand" />}
          </button>
          {checklists.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Xoá bộ checklist "${active.name}"?`)) actions.deleteChecklist(active.id);
              }}
              className="rounded-lg p-2 text-faint transition hover:bg-surface-2 hover:text-neg"
              aria-label="delete checklist"
              title="Xoá bộ này"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={clsx(
              "group flex items-center gap-3 rounded-xl border p-3 transition",
              item.isChecked ? "border-pos/30 bg-pos/5" : "border-border bg-surface-2"
            )}
          >
            <button
              onClick={() => actions.toggleChecklist(item.id)}
              className={clsx(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                item.isChecked ? "border-pos bg-pos text-[rgb(var(--brand-ink))]" : "border-border"
              )}
              aria-label="toggle"
            >
              {item.isChecked && <Check className="h-3.5 w-3.5" />}
            </button>
            <span className={clsx("flex-1 text-sm", item.isChecked ? "text-muted line-through" : "text-text")}>
              {item.text}
            </span>
            {item.isRequired && <Badge tone="brand">Bắt buộc</Badge>}
            <button
              onClick={() => actions.deleteChecklistItem(item.id)}
              className="text-faint opacity-0 transition hover:text-neg group-hover:opacity-100"
              aria-label="delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-faint">
            Bộ checklist này chưa có tiêu chí nào.
          </li>
        )}
      </ul>

      {adding ? (
        <div className="mt-3 space-y-2">
          <TextInput
            autoFocus
            placeholder="Nội dung tiêu chí…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Bắt buộc
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Huỷ
              </Button>
              <Button onClick={submit}>Thêm</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Thêm tiêu chí
          </Button>
          <Button variant="ghost" onClick={() => actions.resetChecklist()}>
            <RotateCcw className="h-4 w-4" /> Đặt lại
          </Button>
        </div>
      )}
    </div>
  );
}
