import { useState } from "react";
import { Check, Plus, Trash2, RotateCcw, ListChecks } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { Button, Badge, TextInput } from "../components/ui";
import { clsx } from "../lib/format";

export default function Checklist() {
  const checklist = useSelector((d) => d.checklist);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [required, setRequired] = useState(true);

  const requiredItems = checklist.filter((c) => c.isRequired);
  const requiredDone = requiredItems.filter((c) => c.isChecked).length;
  const allRequiredDone = requiredItems.length > 0 && requiredDone === requiredItems.length;

  const submit = () => {
    actions.addChecklistItem(text, required);
    setText("");
    setAdding(false);
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

      <ul className="space-y-2">
        {checklist.map((item) => (
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
