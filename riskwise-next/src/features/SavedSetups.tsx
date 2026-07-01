import { useState } from "react";
import { Bookmark, Trash2, Upload, Plus } from "lucide-react";
import { useSelector } from "../store/store";
import { actions } from "../store/actions";
import { Button, TextInput, EmptyState } from "../components/ui";
import { useToast } from "../components/Toast";
import { fmtDate } from "../lib/format";

export default function SavedSetups() {
  const setups = useSelector((d) => d.savedSetups);
  const [name, setName] = useState("");
  const toast = useToast();

  const save = () => {
    actions.saveSetup(name);
    setName("");
    toast("Đã lưu thiết lập.");
  };

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
        <Bookmark className="h-4 w-4" /> Thiết lập đã lưu
      </h3>

      <div className="mb-4 flex gap-2">
        <TextInput
          placeholder="Tên thiết lập…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <Button onClick={save}>
          <Plus className="h-4 w-4" /> Lưu
        </Button>
      </div>

      {setups.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-8 w-8" />}
          title="Chưa có thiết lập"
          description="Lưu cấu hình rủi ro hiện tại để tái sử dụng nhanh cho các lệnh sau."
        />
      ) : (
        <ul className="space-y-2">
          {setups.map((s) => (
            <li key={s.id} className="inset flex items-center gap-3 rounded-xl p-3">
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-text">{s.name}</p>
                <p className="text-[11px] text-faint">
                  {s.assetClass === "forex" ? s.forexPair : "Crypto/Stock"} · Rủi ro{" "}
                  {s.riskType === "percentage" ? `${s.riskValue}%` : `${s.riskValue}$`} · {fmtDate(s.createdAt)}
                </p>
              </div>
              <Button variant="outline" onClick={() => { actions.loadSetup(s.id); }}>
                <Upload className="h-3.5 w-3.5" /> Nạp
              </Button>
              <button
                onClick={() => actions.deleteSetup(s.id)}
                className="text-faint transition hover:text-neg"
                aria-label="delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
