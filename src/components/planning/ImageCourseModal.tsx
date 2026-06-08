"use client";

import { useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { Task, UserRole, COURSE_KITESURF, COURSE_WINGFOIL } from "@/types";

interface DetectedSession {
  instructor: string;
  startTime: string;
  endTime: string;
  studentCount: number;
  discipline: "kite" | "wing";
  selected: boolean;
  editedStartTime: string;
  editedEndTime: string;
  editedStudentCount: number;
  editedDiscipline: "kite" | "wing";
}

interface ImageCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  userId: string;
  userRole: UserRole;
  onSuccess: (tasks: Task[]) => void;
}

type Step = "capture" | "analyzing" | "review" | "saving" | "done";

export default function ImageCourseModal({
  isOpen,
  onClose,
  date,
  userId,
  userRole,
  onSuccess,
}: ImageCourseModalProps) {
  const [step, setStep] = useState<Step>("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sessions, setSessions] = useState<DetectedSession[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetAndClose() {
    setStep("capture");
    setImagePreview(null);
    setSessions([]);
    setIssues([]);
    setError("");
    onClose();
  }

  function compressImage(dataUrl: string, maxWidth = 1400): Promise<{ base64: string; preview: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        resolve({ base64: compressed.split(",")[1], preview: compressed });
      };
      img.src = dataUrl;
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const { base64, preview } = await compressImage(dataUrl);
      setImagePreview(preview);
      runAnalysis(base64, "image/jpeg");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function runAnalysis(base64: string, mimeType: string) {
    setStep("analyzing");
    setError("");
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      if (!res.ok) throw new Error("Analyse échouée");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const detected: DetectedSession[] = (data.sessions ?? []).map(
        (s: { instructor: string; startTime: string; endTime: string; studentCount: number; discipline: "kite" | "wing" }) => ({
          ...s,
          selected: true,
          editedStartTime: s.startTime,
          editedEndTime: s.endTime,
          editedStudentCount: s.studentCount,
          editedDiscipline: s.discipline,
        })
      );

      setSessions(detected);
      setIssues(data.issues ?? []);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'analyse");
      setStep("capture");
    }
  }

  function updateSession(index: number, patch: Partial<DetectedSession>) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    const toCreate = sessions.filter((s) => s.selected);
    if (toCreate.length === 0) { resetAndClose(); return; }

    setStep("saving");
    const created: Task[] = [];

    for (const s of toCreate) {
      const title = s.editedDiscipline === "kite" ? COURSE_KITESURF : COURSE_WINGFOIL;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startTime: s.editedStartTime,
          endTime: s.editedEndTime,
          date,
          userId,
          studentCount: userRole !== "AIDE_MONO" ? s.editedStudentCount : null,
        }),
      });
      if (res.ok) created.push(await res.json());
    }

    onSuccess(created);
    setStep("done");
    setTimeout(resetAndClose, 1500);
  }

  const selectedCount = sessions.filter((s) => s.selected).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Importer depuis photo"
      width="max-w-lg"
    >
      {/* CAPTURE */}
      {step === "capture" && (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {imagePreview && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Aperçu" className="w-full object-contain max-h-48" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-[0.99] transition-all"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Photographier le tableau</p>
              <p className="text-xs text-indigo-400 mt-0.5">ou choisir une photo existante</p>
            </div>
          </button>

          <button
            onClick={resetAndClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* ANALYZING */}
      {step === "analyzing" && (
        <div className="py-10 flex flex-col items-center gap-5">
          {imagePreview && (
            <div className="rounded-xl overflow-hidden border border-gray-200 w-full">
              <img src={imagePreview} alt="Analyse" className="w-full object-contain max-h-36" />
            </div>
          )}
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">Analyse en cours…</p>
            <p className="text-xs text-gray-400 mt-1">L&apos;IA lit le tableau pour vous</p>
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === "review" && (
        <div className="space-y-4">
          {issues.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Remarques de l&apos;IA</p>
              {issues.map((issue, i) => (
                <p key={i} className="text-xs text-amber-600">• {issue}</p>
              ))}
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-gray-500">Aucune session détectée dans cette image.</p>
              <button
                onClick={() => { setStep("capture"); setImagePreview(null); }}
                className="text-sm text-indigo-600 hover:underline font-medium"
              >
                Réessayer avec une autre photo
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-gray-500">
                {sessions.length} session{sessions.length > 1 ? "s" : ""} détectée{sessions.length > 1 ? "s" : ""}
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((session, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border transition-all ${
                      session.selected
                        ? "border-indigo-200 bg-indigo-50/40"
                        : "border-gray-100 bg-gray-50/40 opacity-60"
                    }`}
                  >
                    {/* Row header — click to toggle */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                      onClick={() => updateSession(i, { selected: !session.selected })}
                    >
                      <div
                        className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                          session.selected ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                        }`}
                      >
                        {session.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{session.instructor}</p>
                        <p className="text-xs text-gray-400">
                          {session.editedStartTime} → {session.editedEndTime}
                          {session.editedStudentCount > 0 && ` · ${session.editedStudentCount} stagiaire${session.editedStudentCount > 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          session.editedDiscipline === "kite"
                            ? "bg-sky-100 text-sky-600"
                            : "bg-violet-100 text-violet-600"
                        }`}
                      >
                        {session.editedDiscipline === "kite" ? "Kite" : "Wing"}
                      </span>
                    </div>

                    {/* Editable fields — shown only when selected */}
                    {session.selected && (
                      <div className="px-4 pb-3 space-y-3 border-t border-indigo-100">
                        {/* Discipline toggle */}
                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => updateSession(i, { editedDiscipline: "kite" })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              session.editedDiscipline === "kite"
                                ? "bg-sky-500 text-white shadow-sm"
                                : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                            }`}
                          >
                            Kitesurf
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSession(i, { editedDiscipline: "wing" })}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              session.editedDiscipline === "wing"
                                ? "bg-violet-500 text-white shadow-sm"
                                : "bg-violet-50 text-violet-600 hover:bg-violet-100"
                            }`}
                          >
                            Wingfoil
                          </button>
                        </div>

                        {/* Times */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Début</label>
                            <input
                              type="time"
                              value={session.editedStartTime}
                              onChange={(e) => updateSession(i, { editedStartTime: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg bg-white border border-indigo-200 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Fin</label>
                            <input
                              type="time"
                              value={session.editedEndTime}
                              onChange={(e) => updateSession(i, { editedEndTime: e.target.value })}
                              className="w-full px-2 py-1.5 rounded-lg bg-white border border-indigo-200 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                            />
                          </div>
                        </div>

                        {/* Student count — monitors only */}
                        {userRole !== "AIDE_MONO" && (
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Nombre de stagiaires</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateSession(i, { editedStudentCount: Math.max(0, session.editedStudentCount - 1) })}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-indigo-200 text-indigo-600 font-bold text-base hover:bg-indigo-50 active:scale-95 transition-all"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={session.editedStudentCount}
                                onChange={(e) =>
                                  updateSession(i, {
                                    editedStudentCount: Math.max(0, Math.min(50, Number(e.target.value))),
                                  })
                                }
                                className="flex-1 text-center px-2 py-1.5 rounded-lg bg-white border border-indigo-200 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => updateSession(i, { editedStudentCount: Math.min(50, session.editedStudentCount + 1) })}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-indigo-200 text-indigo-600 font-bold text-base hover:bg-indigo-50 active:scale-95 transition-all"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep("capture"); setImagePreview(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedCount === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  Créer {selectedCount > 0 ? `${selectedCount} cours` : ""}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SAVING */}
      {step === "saving" && (
        <div className="py-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Enregistrement…</p>
        </div>
      )}

      {/* DONE */}
      {step === "done" && (
        <div className="py-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">Cours créés !</p>
            <p className="text-xs text-gray-400 mt-1">Ajoutés à votre planning</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
