export type SaveState =
  "saved" | "waiting" | "saving" | "offline" | "invalid" | "error" | "conflict";
type Versioned = { id: string; revision?: number };
type Entry<T> = {
  base: T;
  latest: T;
  state: SaveState;
  message: string;
  attempts: number;
  paused: boolean;
  timer?: ReturnType<typeof setTimeout>;
  flight?: Promise<void>;
  uncertain?: T;
  deleting?: boolean;
};
export const AUTOSAVE_DELAY = 500;
export class PortfolioAutosave<T extends Versioned> {
  private entries = new Map<string, Entry<T>>();
  private disposed = false;
  constructor(
    private options: {
      fingerprint: (p: T) => string;
      validate: (p: T) => string;
      available: () => boolean;
      write: (p: T, revision: number) => Promise<T>;
      create?: (p: T) => Promise<T>;
      read: (id: string) => Promise<T>;
      classify: (error: unknown) => "conflict" | "invalid" | "retry";
      message: (error: unknown) => string;
      acknowledged: (saved: T, latest: T) => void;
      changed: () => void;
    },
  ) {}
  private equal(a: T, b: T) {
    return this.options.fingerprint(a) === this.options.fingerprint(b);
  }
  track(p: T) {
    if (this.disposed || (p.revision === undefined && !this.options.create))
      return;
    const existing = this.entries.get(p.id);
    if (existing) {
      if (
        !existing.flight &&
        !existing.uncertain &&
        this.equal(existing.latest, existing.base) &&
        p.revision !== undefined &&
        p.revision > existing.base.revision!
      )
        this.entries.delete(p.id);
      else return;
    }
    this.entries.set(p.id, {
      base: structuredClone(p),
      latest: structuredClone(p),
      state: "saved",
      message: "",
      attempts: 0,
      paused: false,
    });
  }
  stage(p: T, baseline?: T) {
    if (this.disposed || (p.revision === undefined && !this.options.create))
      return;
    if (!this.entries.has(p.id)) this.track(baseline ?? p);
    const e = this.entries.get(p.id)!;
    e.latest = { ...structuredClone(p), revision: e.base.revision };
    clearTimeout(e.timer);
    if (e.deleting) {
      this.options.changed();
      return;
    }
    if (e.flight) {
      this.options.changed();
      return;
    }
    if (e.paused && e.state === "conflict") {
      this.options.changed();
      return;
    }
    if (e.state === "invalid") e.paused = false;
    this.schedule(e, AUTOSAVE_DELAY);
  }
  private schedule(e: Entry<T>, delay: number) {
    if (this.disposed) return;
    clearTimeout(e.timer);
    if (e.paused || e.deleting) return;
    if (
      e.base.revision !== undefined &&
      !e.uncertain &&
      this.equal(e.latest, e.base)
    ) {
      e.state = "saved";
      e.message = "";
    } else {
      // Settle an uncertain earlier write even when newer edits are invalid.
      // Only the attempted snapshot is reconciled; invalid work is never sent.
      const invalid = e.uncertain ? "" : this.options.validate(e.latest);
      if (invalid) {
        e.state = "invalid";
        e.message = invalid;
      } else if (!this.options.available()) {
        e.state = "offline";
        e.message = "Changes not saved. Reconnecting; keep this tab open.";
      } else {
        e.state = e.attempts ? "error" : "waiting";
        if (!e.attempts) e.message = "";
        e.timer = setTimeout(() => void this.flush(e.latest.id), delay);
      }
    }
    this.options.changed();
  }
  version(id: string) {
    return this.entries.get(id)?.base.revision;
  }
  status(id: string) {
    const e = this.entries.get(id);
    return e ? { state: e.state, message: e.message } : null;
  }
  dirty() {
    return [...this.entries.values()].some(
      (e) =>
        e.base.revision === undefined ||
        !!e.flight ||
        !!e.uncertain ||
        !this.equal(e.latest, e.base),
    );
  }
  dirtyId(id: string) {
    const e = this.entries.get(id);
    return (
      !!e &&
      (e.base.revision === undefined ||
        !!e.flight ||
        !!e.uncertain ||
        !this.equal(e.latest, e.base))
    );
  }
  resume() {
    for (const e of this.entries.values()) {
      if (!e.flight) this.schedule(e, 0);
      else {
        e.state = this.options.available() ? "saving" : "offline";
        e.message = this.options.available()
          ? ""
          : "Changes not saved. Reconnecting; keep this tab open.";
        this.options.changed();
      }
    }
  }
  retry(id: string) {
    const e = this.entries.get(id);
    if (!e || e.state === "conflict") return;
    e.paused = false;
    e.attempts = 0;
    this.schedule(e, 0);
  }
  discard(id: string) {
    const e = this.entries.get(id);
    clearTimeout(e?.timer);
    this.entries.delete(id);
    this.options.changed();
  }
  canDiscardUncreated(id: string) {
    const e = this.entries.get(id);
    return !e || (e.base.revision === undefined && !e.flight && !e.uncertain);
  }
  reset(p: T) {
    this.discard(p.id);
    this.track(p);
    this.options.changed();
  }
  // A confirmed deletion supersedes queued edits, including invalid ones. Wait
  // for an already-sent write, but do not send an unnecessary update before delete.
  async beforeDelete(id: string): Promise<number | undefined> {
    const e = this.entries.get(id);
    if (!e || this.disposed) return undefined;
    e.deleting = true;
    clearTimeout(e.timer);
    if (e.flight) await e.flight;
    if (this.disposed || this.entries.get(id) !== e)
      throw Error("SESSION_CHANGED");
    if (e.uncertain) {
      const remote = await this.options.read(id);
      if (this.disposed || this.entries.get(id) !== e)
        throw Error("SESSION_CHANGED");
      if (
        remote.revision === (e.base.revision ?? 0) + 1 &&
        this.equal(remote, e.uncertain)
      ) {
        e.base = remote;
        e.latest = { ...e.latest, revision: remote.revision };
        this.options.acknowledged(remote, e.latest);
      } else if (
        remote.revision !== e.base.revision ||
        !this.equal(remote, e.base)
      ) {
        e.state = "conflict";
        e.paused = true;
        e.message =
          "This portfolio changed elsewhere. Load the cloud version or duplicate your edits.";
        this.options.changed();
        throw Error("REVISION_CONFLICT");
      }
      e.uncertain = undefined;
    }
    return e.base.revision;
  }
  afterDeleteFailure(id: string) {
    const e = this.entries.get(id);
    if (e) {
      e.deleting = false;
      this.schedule(e, AUTOSAVE_DELAY);
    }
  }
  async flush(id: string): Promise<void> {
    const e = this.entries.get(id);
    if (!e || this.disposed) return;
    clearTimeout(e.timer);
    if (e.flight) {
      await e.flight;
      return;
    }
    if (
      e.paused ||
      !this.options.available() ||
      (!e.uncertain && this.options.validate(e.latest)) ||
      (e.base.revision !== undefined &&
        !e.uncertain &&
        this.equal(e.latest, e.base))
    ) {
      this.schedule(e, 0);
      return;
    }
    e.state = "saving";
    this.options.changed();
    e.flight = (async () => {
      let sent: T | undefined;
      try {
        if (e.uncertain) {
          // Re-submit the exact original creation, never a newer definition.
          // The server's client-ID idempotency acknowledges a lost response or
          // rejects different/deleted contents without recreating them.
          const creating = e.base.revision === undefined;
          const remote = creating
            ? await this.options.create!(e.uncertain)
            : await this.options.read(id);
          if (this.disposed || this.entries.get(id) !== e) return;
          if (
            (creating || remote.revision === (e.base.revision ?? 0) + 1) &&
            this.equal(remote, e.uncertain)
          ) {
            e.base = remote;
            e.latest = { ...e.latest, revision: remote.revision };
            this.options.acknowledged(remote, e.latest);
          } else if (
            remote.revision !== e.base.revision ||
            !this.equal(remote, e.base)
          ) {
            e.state = "conflict";
            e.message =
              "This portfolio changed elsewhere. Load the cloud version or duplicate your edits.";
            e.paused = true;
            return;
          }
          e.uncertain = undefined;
        }
        if (
          !this.options.available() ||
          this.options.validate(e.latest) ||
          (e.base.revision !== undefined && this.equal(e.latest, e.base))
        )
          return;
        sent = structuredClone(e.latest);
        const saved =
          e.base.revision === undefined
            ? await this.options.create!(sent)
            : await this.options.write(sent, e.base.revision);
        if (this.disposed || this.entries.get(id) !== e) return;
        e.base = saved;
        e.latest = { ...e.latest, revision: saved.revision };
        e.attempts = 0;
        e.message = "";
        this.options.acknowledged(saved, e.latest);
      } catch (error) {
        if (this.disposed || this.entries.get(id) !== e) return;
        const kind = this.options.classify(error);
        e.message = this.options.message(error);
        if (kind !== "retry") {
          e.state = kind;
          e.paused = true;
        } else {
          if (sent) e.uncertain = sent;
          e.state = "error";
          e.attempts++;
          if (e.attempts > 3) e.paused = true;
        }
      } finally {
        e.flight = undefined;
        if (!this.disposed && this.entries.get(id) === e) {
          if (!e.paused)
            this.schedule(e, e.attempts ? 1000 * 2 ** (e.attempts - 1) : 0);
          else this.options.changed();
        }
      }
    })();
    await e.flight;
  }
  activate() {
    this.disposed = false;
  }
  dispose() {
    this.disposed = true;
    for (const e of this.entries.values()) clearTimeout(e.timer);
    this.entries.clear();
  }
}
