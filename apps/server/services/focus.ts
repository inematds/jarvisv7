import { Store, id, now } from "../store.js";
export class FocusService {
  constructor(private store: Store) {}
  current() {
    const r = this.store.db
      .prepare("SELECT * FROM focus ORDER BY created_at DESC LIMIT 1")
      .get() as any;
    if (!r) return null;
    const elapsed =
      r.elapsed_seconds +
      (r.state === "running" && r.started_ms
        ? Math.max(0, Math.floor((Date.now() - r.started_ms) / 1000))
        : 0);
    if (r.state === "running" && elapsed >= r.planned_seconds) {
      this.store.db
        .prepare(
          "UPDATE focus SET state='completed',elapsed_seconds=planned_seconds,started_ms=NULL WHERE id=?",
        )
        .run(r.id);
      return {
        ...r,
        state: "completed",
        elapsed_seconds: r.planned_seconds,
        remaining: 0,
        sensor: "manual",
      };
    }
    return {
      ...r,
      elapsed_seconds: elapsed,
      remaining: Math.max(0, r.planned_seconds - elapsed),
      sensor: "manual",
    };
  }
  start(minutes: number) {
    const c = this.current();
    if (c && ["running", "paused"].includes(c.state))
      throw new Error("Encerre a sessão atual antes de começar outra.");
    const fid = id();
    this.store.db
      .prepare("INSERT INTO focus VALUES (?,?,?,?,?,?,?)")
      .run(fid, "running", minutes * 60, 0, Date.now(), 0, now());
    return this.current();
  }
  action(action: "pause" | "resume" | "stop" | "drift" | "extend") {
    const c = this.current();
    if (!c || !["running", "paused"].includes(c.state))
      throw new Error("Nenhuma sessão ativa.");
    if (action === "pause" && c.state === "running")
      this.store.db
        .prepare(
          "UPDATE focus SET state='paused',elapsed_seconds=?,started_ms=NULL WHERE id=?",
        )
        .run(c.elapsed_seconds, c.id);
    if (action === "resume" && c.state === "paused")
      this.store.db
        .prepare("UPDATE focus SET state='running',started_ms=? WHERE id=?")
        .run(Date.now(), c.id);
    if (action === "stop")
      this.store.db
        .prepare(
          "UPDATE focus SET state='stopped',elapsed_seconds=?,started_ms=NULL WHERE id=?",
        )
        .run(c.elapsed_seconds, c.id);
    if (action === "drift")
      this.store.db
        .prepare("UPDATE focus SET drifts=drifts+1 WHERE id=?")
        .run(c.id);
    if (action === "extend")
      this.store.db
        .prepare(
          "UPDATE focus SET planned_seconds=planned_seconds+300 WHERE id=?",
        )
        .run(c.id);
    return this.current();
  }
}
