"use client";

import { useState } from "react";

import { Alert, Button, Eyebrow, Panel, Select, TextArea } from "@/components/ui";
import type { Scene, StoryNote } from "@/core/entities/story-plan";

function formatTimestamp(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface LiveNotesPanelProps {
  scenes: Scene[];
  notes: StoryNote[];
  onAddNote: (body: string, sceneId?: string) => Promise<void>;
}

export function LiveNotesPanel({ scenes, notes, onAddNote }: LiveNotesPanelProps) {
  const [body, setBody] = useState("");
  const [sceneId, setSceneId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onAddNote(body.trim(), sceneId || undefined);
      setBody("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Panel className="space-y-4 p-6">
      <Eyebrow>Notas ao vivo</Eyebrow>

      <form onSubmit={handleSubmit} className="space-y-3">
        <TextArea
          id="note-body"
          label="O que aconteceu na mesa?"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {scenes.length > 0 ? (
          <Select
            id="note-scene"
            label="Cena relacionada (opcional)"
            value={sceneId}
            onChange={(e) => setSceneId(e.target.value)}
          >
            <option value="">— sem cena específica —</option>
            {scenes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        ) : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Button type="submit" disabled={submitting || !body.trim()}>
          {submitting ? "Salvando…" : "Lançar nota"}
        </Button>
      </form>

      <div className="space-y-2 border-t border-guild-border pt-4">
        {sortedNotes.length === 0 ? (
          <p className="text-center text-xs text-guild-muted">
            Nenhuma nota lançada ainda.
          </p>
        ) : (
          sortedNotes.map((note) => {
            const scene = scenes.find((s) => s.id === note.sceneId);
            return (
              <div
                key={note.id}
                className="rounded-md border border-guild-border/60 bg-guild-bg1/40 p-3"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-guild-muted">
                  <span>{formatTimestamp(note.createdAt)}</span>
                  {scene ? (
                    <span className="font-heading uppercase tracking-wide text-guild-goldsoft">
                      {scene.title}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-guild-gold">{note.body}</p>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}
