type Props = {
  defaults?: {
    website?: string | null;
    social_profiles?: string | null;
    notes?: string | null;
    iban?: string | null;
    account_holder?: string | null;
  };
};

export function PartnerOptionalFields({ defaults }: Props) {
  return (
    <>
      <div className="sm:col-span-2 space-y-1 border-t border-line pt-4">
        <p className="text-sm font-medium">Stammdaten (optional)</p>
        <p className="text-xs text-muted">Alles freiwillig — nur für die Admin-Akte.</p>
      </div>
      <label className="block space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Webseite</span>
        <input
          name="website"
          type="text"
          inputMode="url"
          defaultValue={defaults?.website ?? ""}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2"
          placeholder="https://…"
        />
      </label>
      <label className="block space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Social-Media-Profile</span>
        <textarea
          name="social_profiles"
          rows={3}
          defaultValue={defaults?.social_profiles ?? ""}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2"
          placeholder="Instagram, TikTok, YouTube … (Links oder Handles)"
        />
      </label>
      <label className="block space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Freitext / Notizen</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ""}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2"
          placeholder="Interne Notizen zur Zusammenarbeit"
        />
      </label>
      <div className="sm:col-span-2 space-y-1 border-t border-line pt-4">
        <p className="text-sm font-medium">Auszahlung (optional)</p>
        <p className="text-xs text-muted">
          Nur hinterlegen, wenn Provisionen ausgezahlt werden sollen.
        </p>
      </div>
      <label className="block space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Kontoinhaber</span>
        <input
          name="account_holder"
          defaultValue={defaults?.account_holder ?? ""}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2"
          placeholder="Max Mustermann"
        />
      </label>
      <label className="block space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">IBAN</span>
        <input
          name="iban"
          defaultValue={defaults?.iban ?? ""}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 font-mono text-sm"
          placeholder="DE…"
          autoComplete="off"
        />
      </label>
    </>
  );
}
