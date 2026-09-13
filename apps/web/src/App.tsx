import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  BookOpen,
  BrainCircuit,
  Network,
  Image as ImageIcon,
  ListTodo,
  Timer,
  Settings2,
  ArrowUp,
  Mic,
  Square,
  ScreenShare,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  X,
  Download,
  Upload,
  Trash2,
  PencilLine,
  Check,
  AlertTriangle,
  RefreshCw,
  Plug,
  Database,
  Menu,
  ArrowRight,
  FileText,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Monitor,
  SlidersHorizontal,
  LogOut,
  Save,
  ArrowLeft,
} from "lucide-react";
import { api, post, patch, remove } from "./api";
import {
  defaults,
  type Settings,
  type Note,
  type Message,
  type Run,
  type Model,
  type Connection,
  type Brain,
} from "../../../packages/shared/types";
const labels: Record<string, string> = {
  local: "Busca local",
  codex: "Codex · OAuth",
  claude: "Claude · OAuth",
  openrouter: "OpenRouter",
};
const states: Record<string, string> = {
  queued: "Na fila",
  running: "Em andamento",
  submitting: "Enviando",
  submitted: "Enviado",
  processing: "Gerando",
  downloading: "Baixando",
  succeeded: "Concluído",
  failed: "Falhou",
  cancelled: "Interrompido",
  interrupted: "Interrompido",
  unknown: "Confirmar no provedor",
  needs_attention: "Precisa de atenção",
};
const active = (r: Run) =>
  [
    "queued",
    "running",
    "submitted",
    "submitting",
    "processing",
    "downloading",
  ].includes(r.state);
const navigation = [
  { id: "chat", label: "Conversa", icon: MessageSquare },
  { id: "notes", label: "Conhecimento", icon: BookOpen },
  { id: "memory", label: "Memórias", icon: BrainCircuit },
  { id: "graph", label: "Mapa de conexões", icon: Network },
  { id: "media", label: "Estúdio de mídia", icon: ImageIcon },
  { id: "tasks", label: "Trabalhos", icon: ListTodo },
  { id: "focus", label: "Foco", icon: Timer },
  { id: "settings", label: "Configurações", icon: Settings2 },
];
function Button({
  children,
  icon: Icon,
  kind = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: any;
  kind?: string;
}) {
  return (
    <button {...props} className={`button ${kind} ${props.className ?? ""}`}>
      {Icon && <Icon size={17} />}
      <span>{children}</span>
    </button>
  );
}
function Empty({ title, children, icon: Icon = BookOpen }: any) {
  return (
    <div className="empty">
      <Icon size={34} strokeWidth={1.3} />
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
function Tag({ children, tone = "" }: any) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function Loading() {
  return (
    <div className="loading" role="status">
      <RefreshCw size={18} className="spin" /> Carregando…
    </div>
  );
}
export default function App() {
  const [page, setPage] = useState("chat"),
    [settings, setSettings] = useState<Settings>(defaults),
    [boot, setBoot] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState(false),
    [onboard, setOnboard] = useState(false),
    [revision, setRevision] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]),
    [runs, setRuns] = useState<Run[]>([]),
    [connections, setConnections] = useState<Connection[]>([]),
    [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const refresh = useCallback(async () => {
    const [s, n, r] = await Promise.all([
      api<Settings>("/settings"),
      api<Note[]>("/notes"),
      api<Run[]>("/runs"),
    ]);
    setSettings(s);
    setNotes(n);
    setRuns(r);
  }, []);
  const connect = useCallback(
    () =>
      api<Connection[]>("/connections")
        .then(setConnections)
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    refresh()
      .then(() => api<Settings>("/settings"))
      .then((s) => setOnboard(!s.onboarded))
      .catch((e) => setError(e.message))
      .finally(() => setBoot(false));
    void connect();
  }, [refresh, connect]);
  useEffect(() => {
    const timer = setInterval(() => {
      api<Run[]>("/runs")
        .then(setRuns)
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  const act = async (fn: () => Promise<any>, message = "") => {
    try {
      await fn();
      await refresh();
      setRevision((v) => v + 1);
      if (message) setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  const save = async (s: Partial<Settings>) => {
    const result = await patch("/settings", s);
    setSettings(result);
    setRevision((v) => v + 1);
    return result;
  };
  const navigate = (p: string) => {
    setPage(p);
    setMenu(false);
  };
  if (boot)
    return (
      <div className="boot">
        <div className="brand-symbol">
          J<span>7</span>
        </div>
        <Loading />
      </div>
    );
  return (
    <div className="shell">
      {menu && (
        <button
          className="scrim"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("chat");
          }}
        >
          <span className="brand-symbol">
            J<span>7</span>
          </span>
          <span>
            Jarvis <small>v7</small>
          </span>
        </a>
        <Button
          icon={Plus}
          kind="new-chat"
          onClick={() => {
            setRevision((v) => v + 1);
            navigate("chat");
            window.dispatchEvent(new Event("jarvis:new-chat"));
          }}
        >
          Nova conversa
        </Button>
        <nav aria-label="Navegação principal">
          {navigation.map((n) => (
            <button
              key={n.id}
              aria-current={page === n.id ? "page" : undefined}
              className={page === n.id ? "selected" : ""}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "tasks" && runs.filter(active).length > 0 && (
                <small className="count">{runs.filter(active).length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-status">
            <span className="status-dot" /> Espaço local <Tag>pessoal</Tag>
          </div>
          <p>
            Seu conhecimento.
            <br />
            Suas conexões. Seu Jarvis.
          </p>
          <button className="profile" onClick={() => navigate("settings")}>
            <span className="profile-icon">
              <SlidersHorizontal size={17} />
            </span>
            <span>
              Meu espaço<small>{notes.length} documentos salvos</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>{navigation.find((n) => n.id === page)?.label}</span>
            <span className="separator">/</span>
            <span className="muted">Meu espaço</span>
          </div>
          <button className="brain-chip" onClick={() => navigate("settings")}>
            <span
              className={`status-dot ${settings.brain === "local" ? "dim" : ""}`}
            />
            {labels[settings.brain]}
            <ChevronRight size={14} />
          </button>
        </header>
        {error && (
          <div className="banner error" role="alert">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button aria-label="Fechar erro" onClick={() => setError("")}>
              <X size={18} />
            </button>
          </div>
        )}
        {notice && (
          <div className="banner success" role="status">
            <Check size={18} />
            <span>{notice}</span>
            <button aria-label="Fechar aviso" onClick={() => setNotice("")}>
              <X size={18} />
            </button>
          </div>
        )}
        <main>
          {page === "chat" && (
            <Chat
              settings={settings}
              notes={notes}
              revision={revision}
              onError={setError}
              onNote={setSelectedNote}
              onRefresh={refresh}
              onSettings={() => navigate("settings")}
            />
          )}
          {(page === "notes" || page === "memory") && (
            <Notes
              kind={page === "memory" ? "memory" : "note"}
              notes={notes}
              act={act}
              onNote={setSelectedNote}
            />
          )}
          {page === "graph" && (
            <Graph
              onNote={(nid: string) =>
                setSelectedNote(notes.find((n) => n.id === nid) ?? null)
              }
              notes={notes}
            />
          )}
          {page === "media" && (
            <Media
              settings={settings}
              runs={runs}
              act={act}
              onSettings={() => navigate("settings")}
            />
          )}
          {page === "tasks" && <Tasks runs={runs} act={act} />}
          {page === "focus" && (
            <Focus
              enabled={settings.focusEnabled}
              onError={setError}
              onSettings={() => navigate("settings")}
            />
          )}
          {page === "settings" && (
            <Preferences
              settings={settings}
              save={save}
              connections={connections}
              reconnect={connect}
              act={act}
              onError={setError}
            />
          )}
        </main>
      </div>
      {selectedNote && (
        <NoteEditor
          note={selectedNote}
          close={() => setSelectedNote(null)}
          save={async (b: Partial<Note>) => {
            if (
              await act(
                () => patch("/notes/" + selectedNote.id, b),
                "Documento atualizado.",
              )
            )
              setSelectedNote(null);
          }}
          removeNote={async () => {
            if (
              await act(
                () => remove("/notes/" + selectedNote.id),
                "Documento removido.",
              )
            )
              setSelectedNote(null);
          }}
        />
      )}
      {onboard && (
        <Onboarding
          settings={settings}
          save={save}
          connections={connections}
          close={() => setOnboard(false)}
          onSettings={() => {
            setOnboard(false);
            navigate("settings");
          }}
          act={act}
        />
      )}
    </div>
  );
}
function Chat({
  settings,
  notes,
  revision,
  onError,
  onNote,
  onRefresh,
  onSettings,
}: any) {
  const [conversations, setConversations] = useState<any[]>([]),
    [current, setCurrent] = useState<any>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(""),
    [draft, setDraft] = useState(""),
    [listening, setListening] = useState(false),
    [share, setShare] = useState<MediaStream | null>(null),
    [sendingImage, setSendingImage] = useState(false),
    [brainPicker, setBrainPicker] = useState(false),
    [historyPicker, setHistoryPicker] = useState(false),
    [source, setSource] = useState<Message["sources"][number] | null>(null);
  const transcript = useRef(""),
    recognition = useRef<any>(null),
    finish = useRef<any>(null),
    end = useRef<HTMLDivElement>(null),
    video = useRef<HTMLVideoElement>(null),
    isMounted = useRef(true),
    sending = useRef(false),
    streamRef = useRef<MediaStream | null>(null),
    runRef = useRef("");
  const loadConversations = () => api("/conversations").then(setConversations);
  useEffect(() => {
    isMounted.current = true;
    void loadConversations();
    const reset = () => {
      if (sending.current) return;
      setCurrent(null);
      setMessages([]);
      setDraft("");
      setQuestion("");
    };
    window.addEventListener("jarvis:new-chat", reset);
    return () => {
      isMounted.current = false;
      window.removeEventListener("jarvis:new-chat", reset);
      recognition.current?.abort();
      clearTimeout(finish.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    void loadConversations();
  }, [revision]);
  useEffect(() => {
    if (!current?.id) return;
    let alive = true;
    const poll = async () => {
      if (sending.current) return;
      try {
        const list = await api<Run[]>("/runs");
        if (!alive || sending.current) return;
        const r = list.find(
          (r) =>
            r.kind === "chat" &&
            r.input.conversationId === current.id &&
            active(r),
        );
        if (r) {
          setBusy(r.id);
          runRef.current = r.id;
        } else if (runRef.current) {
          setMessages(await api("/conversations/" + current.id + "/messages"));
          if (alive) {
            setBusy("");
            runRef.current = "";
            setDraft("");
          }
        }
      } catch {}
    };
    void poll();
    const t = setInterval(() => void poll(), 1200);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [current?.id]);
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: messages.length ? "smooth" : "instant",
    });
  }, [messages, draft]);
  function speak(text: string) {
    if (
      settings.voice &&
      !new URLSearchParams(location.search).has("mute") &&
      "speechSynthesis" in window
    ) {
      recognition.current?.abort();
      const u = new SpeechSynthesisUtterance(
        text.replace(/\[\d+\]/g, "").slice(0, 2500),
      );
      u.lang = "pt-BR";
      window.speechSynthesis.speak(u);
    }
  }
  async function cancel() {
    window.speechSynthesis?.cancel();
    recognition.current?.abort();
    if (runRef.current) {
      try {
        await post("/runs/" + runRef.current + "/cancel");
      } catch (e) {
        onError((e as Error).message);
      }
    }
  }
  async function send(value = question) {
    if (sending.current || !value.trim()) return;
    sending.current = true;
    setQuestion("");
    setDraft("");
    let cid = current?.id;
    try {
      let c = current;
      if (!c) {
        c = await post("/conversations", { title: value.slice(0, 65) });
        setCurrent(c);
        cid = c.id;
      }
      let image: string | undefined;
      if (share && sendingImage && video.current) {
        const canvas = document.createElement("canvas"),
          v = video.current;
        if (!v.videoWidth) throw new Error("A captura ainda não está pronta.");
        const scale = Math.min(1, 1440 / v.videoWidth);
        canvas.width = v.videoWidth * scale;
        canvas.height = v.videoHeight * scale;
        canvas
          .getContext("2d")!
          .drawImage(v, 0, 0, canvas.width, canvas.height);
        image = canvas.toDataURL("image/jpeg", 0.8);
      }
      const { runId } = await post("/conversations/" + cid + "/turns", {
        message: value,
        image,
      });
      setBusy(runId);
      runRef.current = runId;
      setMessages(await api("/conversations/" + cid + "/messages"));
      let finished = false,
        seq = 0;
      while (!finished && isMounted.current) {
        await new Promise((r) => setTimeout(r, 650));
        const [r, events] = await Promise.all([
          api<Run>("/runs/" + runId),
          api<any[]>("/runs/" + runId + "/events?after=" + seq),
        ]);
        for (const e of events) {
          seq = e.seq;
          if (e.type === "text") setDraft(e.data.text);
        }
        if (!active(r)) {
          finished = true;
          if (r.state === "failed") onError(r.error);
          const updated = await api<Message[]>(
            "/conversations/" + cid + "/messages",
          );
          setMessages(updated);
          setDraft("");
          if (r.state === "succeeded" && updated.at(-1)?.role === "assistant")
            speak(updated.at(-1)!.content);
        }
      }
      await loadConversations();
      await onRefresh();
    } catch (e) {
      onError((e as Error).message);
      setQuestion(value);
    } finally {
      sending.current = false;
      setBusy("");
      runRef.current = "";
    }
  }
  const sendRef = useRef(send);
  sendRef.current = send;
  function mic() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Constructor =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!Constructor) {
      onError(
        "Reconhecimento de voz não disponível neste navegador. Use o campo de texto.",
      );
      return;
    }
    const r = new Constructor();
    recognition.current = r;
    r.lang = "pt-BR";
    r.continuous = true;
    r.interimResults = true;
    transcript.current = "";
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => {
      setListening(false);
      onError("Não foi possível ouvir. Confira a permissão do microfone.");
    };
    r.onresult = (event: any) => {
      clearTimeout(finish.current);
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (/^(pare|parar|stop)$/i.test(text.trim())) {
          void cancel();
          return;
        }
        if (event.results[i].isFinal) transcript.current += " " + text;
      }
      setQuestion(transcript.current.trim());
      finish.current = setTimeout(() => {
        const text = transcript.current.trim();
        if (text) {
          r.stop();
          void sendRef.current(text);
        }
      }, 900);
    };
    r.start();
  }
  async function toggleShare() {
    if (share) {
      share.getTracks().forEach((t) => t.stop());
      setShare(null);
      setSendingImage(false);
      return;
    }
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setShare(s);
      streamRef.current = s;
      setSendingImage(true);
      s.getVideoTracks()[0].addEventListener("ended", () => {
        setShare(null);
        setSendingImage(false);
      });
      setTimeout(() => {
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
      }, 0);
    } catch {
      onError(
        "Compartilhamento não iniciado. Escolha uma tela ou continue por texto.",
      );
    }
  }
  const chooseConversation = async (c: any) => {
    if (busy) return;
    setCurrent(c);
    setMessages(await api("/conversations/" + c.id + "/messages"));
    setDraft("");
  };
  return (
    <div className="chat-layout">
      <section className="chat-main">
        <div className="chat-toolbar">
          <button
            className="text-button"
            onClick={() => setHistoryPicker(true)}
            disabled={!!busy}
          >
            <MessageSquare size={15} />
            Histórico
          </button>
          <span>{current?.title ?? "Nova conversa"}</span>
        </div>
        {historyPicker && (
          <Modal
            title="Histórico de conversas"
            close={() => setHistoryPicker(false)}
          >
            <div className="history-list">
              {conversations.length === 0 ? (
                <p>Nenhuma conversa salva ainda.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    className="conversation-link"
                    onClick={() => {
                      void chooseConversation(c).catch((e: Error) =>
                        onError(e.message),
                      );
                      setHistoryPicker(false);
                    }}
                  >
                    {c.title}
                    <small>{labels[c.brain]}</small>
                  </button>
                ))
              )}
            </div>
          </Modal>
        )}
        {source && (
          <Modal title={source.title} close={() => setSource(null)}>
            <p className="field-help">
              Trecho preservado no momento desta resposta.
            </p>
            <div className="message-text source-text">{source.content}</div>
            {notes.some((n: Note) => n.id === source.id) && (
              <Button
                onClick={() => {
                  onNote(notes.find((n: Note) => n.id === source.id));
                  setSource(null);
                }}
              >
                Abrir documento atual
              </Button>
            )}
          </Modal>
        )}
        {brainPicker && (
          <ConversationBrain
            brain={current?.brain ?? settings.brain}
            model={current?.model ?? settings.model}
            close={() => setBrainPicker(false)}
            onError={onError}
            save={async (brain: Brain, model: string) => {
              let c = current;
              if (!c) c = await post("/conversations", {});
              await patch("/conversations/" + c.id, { brain, model });
              setCurrent({ ...c, brain, model });
              setBrainPicker(false);
              await loadConversations();
            }}
          />
        )}

        {messages.length === 0 ? (
          <div className="welcome">
            <div className="assistant-mark">
              <BrainCircuit size={33} strokeWidth={1.35} />
            </div>
            <h1>
              Um espaço para pensar.
              <br />
              <span>E fazer acontecer.</span>
            </h1>
            <p>
              Converse com seu conhecimento, registre ideias
              <br className="desktop-break" /> e transforme o próximo passo em
              trabalho feito.
            </p>
            <div className="suggestions">
              {[
                "O que tenho salvo nas minhas notas?",
                "Lembre que quero organizar minhas ideias.",
                "Como posso começar um projeto?",
              ].map((q, i) => (
                <button key={q} onClick={() => setQuestion(q)}>
                  {i === 0 ? (
                    <BookOpen size={18} />
                  ) : i === 1 ? (
                    <PencilLine size={18} />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                  <span>{q}</span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((m) => (
              <article className={"message " + m.role} key={m.id}>
                <div className="message-author">
                  {m.role === "assistant" ? (
                    <>
                      <span className="mini-mark">J</span>
                      {settings.name}
                    </>
                  ) : (
                    "Você"
                  )}
                </div>
                <div className="message-text">{m.content}</div>
                {m.sources.length > 0 && (
                  <div className="sources">
                    {m.sources.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSource(s);
                        }}
                      >
                        <FileText size={14} />
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {busy && (
              <article className="message assistant">
                <div className="message-author">
                  <span className="mini-mark">J</span>Jarvis{" "}
                  <Tag>trabalhando</Tag>
                </div>
                <div className="message-text">
                  {draft || "Consultando o contexto e preparando a resposta…"}
                </div>
              </article>
            )}
            <div ref={end} />
          </div>
        )}
        <div className="composer-area">
          {share && (
            <div className="share-strip">
              <Monitor size={16} />
              <span>Tela compartilhada</span>
              <label>
                <input
                  type="checkbox"
                  checked={sendingImage}
                  onChange={(e) => setSendingImage(e.target.checked)}
                />{" "}
                Enviar um frame na próxima pergunta
              </label>
              <button
                onClick={() => void toggleShare()}
                aria-label="Encerrar compartilhamento"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="question">
              Mensagem para o Jarvis
            </label>
            <textarea
              id="question"
              placeholder="Pergunte, explore ou diga ‘lembre que…’"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
            />
            <div className="composer-controls">
              <div>
                <button
                  type="button"
                  className={`icon-button ${listening ? "is-on" : ""}`}
                  onClick={mic}
                  aria-label={listening ? "Parar microfone" : "Usar microfone"}
                  title="Usar microfone"
                >
                  <Mic size={19} />
                </button>
                {settings.screenEnabled && (
                  <button
                    type="button"
                    className={`icon-button ${share ? "is-on" : ""}`}
                    onClick={() => void toggleShare()}
                    aria-label={share ? "Encerrar tela" : "Compartilhar tela"}
                    title="Compartilhar tela"
                  >
                    <ScreenShare size={19} />
                  </button>
                )}
                <button
                  type="button"
                  className="text-button composer-model"
                  disabled={!!busy}
                  onClick={() => setBrainPicker(true)}
                >
                  {labels[current?.brain ?? settings.brain]}
                  <ChevronRight size={12} />
                </button>
              </div>
              {busy ? (
                <button
                  type="button"
                  className="send stop"
                  onClick={() => void cancel()}
                  aria-label="Interromper resposta"
                >
                  <Square size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="send"
                  disabled={!question.trim()}
                  aria-label="Enviar mensagem"
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </form>
          <p className="composer-foot">
            {listening
              ? "Ouvindo. O reconhecimento do navegador pode usar um serviço remoto."
              : (current?.brain ?? settings.brain) === "local"
                ? "Busca local ativa. Conecte um cérebro para receber respostas de IA."
                : "Confira as fontes e os resultados. Enter envia · Shift + Enter quebra a linha."}
          </p>
        </div>
        <video
          ref={video}
          className="capture-video"
          muted
          playsInline
          aria-hidden="true"
        />
      </section>
      <aside className="context-panel">
        <div className="context-title">
          <span>Seu contexto</span>
          <BookOpen size={17} />
        </div>
        <div className="context-summary">
          <strong>{notes.length} documentos</strong>
          <span>disponíveis neste espaço</span>
        </div>
        <div className="recent-notes">
          {notes.slice(0, 4).map((n: Note) => (
            <button key={n.id} onClick={() => onNote(n)}>
              <FileText size={17} />
              <span>
                {n.title}
                <small>
                  {n.kind === "memory" ? "Memória" : "Conhecimento"}
                </small>
              </span>
              <ChevronRight size={13} />
            </button>
          ))}
          {!notes.length && (
            <p className="muted">
              Adicione documentos em Conhecimento para começar.
            </p>
          )}
        </div>
        <div className="context-title conversations-title">
          <span>Conversas recentes</span>
          <MessageSquare size={16} />
        </div>
        {conversations.slice(0, 7).map((c) => (
          <button
            className={`conversation-link ${current?.id === c.id ? "current" : ""}`}
            key={c.id}
            disabled={!!busy}
            onClick={() => void chooseConversation(c)}
          >
            {c.title}
            <small>{labels[c.brain]}</small>
          </button>
        ))}
        <div className="context-tip">
          <Plug size={20} />
          <strong>O cérebro é uma escolha sua.</strong>
          <p>Conecte sua conta e mude de modelo sem perder suas memórias.</p>
          <button onClick={onSettings}>
            Gerenciar conexões <ArrowRight size={14} />
          </button>
        </div>
      </aside>
    </div>
  );
}
function Modal({ title, close, children }: any) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current!.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
      aria-label={title}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar janela"
          onClick={close}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function NoteEditor({ note, close, save, removeNote }: any) {
  const [title, setTitle] = useState(note.title),
    [content, setContent] = useState(note.content),
    [confirm, setConfirm] = useState(false),
    [working, setWorking] = useState(false);
  return (
    <Modal
      title={note.id ? "Revisar documento" : "Novo documento"}
      close={close}
    >
      <form
        className="note-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setWorking(true);
          try {
            await save({ title, content, kind: note.kind });
          } finally {
            setWorking(false);
          }
        }}
      >
        <label>
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />
        </label>
        <label>
          Conteúdo
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={13}
            maxLength={150000}
          />
        </label>
        <div className="form-foot">
          <span className="muted">
            {note.source ?? "Salvo neste espaço local"}
          </span>
          <Button type="submit" kind="primary" icon={Save} disabled={working}>
            {working ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
      {note.id && (
        <div className="delete-line">
          {confirm ? (
            <>
              <span>Remover este documento da base?</span>
              <Button kind="danger" onClick={removeNote}>
                Remover documento
              </Button>
              <Button onClick={() => setConfirm(false)}>Manter</Button>
            </>
          ) : (
            <button
              className="text-button danger"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={14} />
              Remover da base
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
function PageHeading({ title, description, children }: any) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
function Notes({ kind, notes, act, onNote }: any) {
  const [query, setQuery] = useState(""),
    [adding, setAdding] = useState(false),
    [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const filtered = notes.filter(
    (n: Note) =>
      n.kind === kind &&
      `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase()),
  );
  const title =
    kind === "memory" ? "Memórias que ficam." : "Seu conhecimento, reunido.";
  return (
    <section className="page">
      <PageHeading
        title={title}
        description={
          kind === "memory"
            ? "Fatos e decisões que você escolheu guardar. Revise quando quiser."
            : "Adicione documentos e encontre o contexto por trás de cada ideia."
        }
      >
        <Button kind="primary" icon={Plus} onClick={() => setAdding(true)}>
          {kind === "memory" ? "Nova memória" : "Nova nota"}
        </Button>
      </PageHeading>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar documentos"
            placeholder="Buscar por título ou conteúdo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {kind === "note" && (
          <>
            <Button
              icon={Upload}
              onClick={() => input.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Importando…" : "Importar arquivo"}
            </Button>
            <input
              className="sr-only"
              ref={input}
              type="file"
              accept=".md,.txt,.pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const form = new FormData();
                form.append("file", file);
                await act(
                  () => api("/notes/import", { method: "POST", body: form }),
                  "Arquivo importado.",
                );
                setUploading(false);
                e.target.value = "";
              }}
            />
          </>
        )}
        <span className="result-count">
          {filtered.length} {filtered.length === 1 ? "documento" : "documentos"}
        </span>
      </div>
      {filtered.length ? (
        <div className="document-list">
          <div className="table-heading">
            <span>Documento</span>
            <span>Atualizado</span>
            <span />
          </div>
          {filtered.map((n: Note) => (
            <button
              className="document-row"
              key={n.id}
              onClick={() => onNote(n)}
            >
              <div className="document-info">
                {kind === "memory" ? (
                  <BrainCircuit size={23} />
                ) : (
                  <FileText size={23} />
                )}
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.content.slice(0, 125)}</p>
                  <small>{n.source}</small>
                </div>
              </div>
              <time>{new Date(n.updated_at).toLocaleDateString("pt-BR")}</time>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title={
            query
              ? "Nenhum documento encontrado"
              : kind === "memory"
                ? "Guarde sua primeira memória"
                : "Comece pelo que você já sabe"
          }
          icon={kind === "memory" ? BrainCircuit : BookOpen}
        >
          <p>
            {query
              ? "Tente outras palavras."
              : kind === "memory"
                ? "Diga “lembre que…” na conversa ou escreva uma memória aqui."
                : "Importe Markdown, TXT ou PDF textual. Os arquivos ficam neste espaço."}
          </p>
          {!query && kind === "note" && (
            <Button
              icon={Plus}
              onClick={() =>
                void act(
                  () => post("/notes/examples"),
                  "Exemplos adicionados e identificados como fictícios.",
                )
              }
            >
              Explorar notas de exemplo
            </Button>
          )}
        </Empty>
      )}
      {adding && (
        <NoteEditor
          note={{ title: "", content: "", kind }}
          close={() => setAdding(false)}
          save={async (b: any) => {
            const ok = await act(() => post("/notes", b), "Documento salvo.");
            if (ok !== false) setAdding(false);
          }}
        />
      )}
    </section>
  );
}
function Graph({ onNote, notes }: any) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(""),
    [graphData, setGraphData] = useState<any>(null);
  useEffect(() => {
    let disposed = false,
      g: any,
      observer: ResizeObserver;
    void (async () => {
      try {
        const [data, module] = await Promise.all([
          api("/graph"),
          import("3d-force-graph"),
        ]);
        if (disposed || !container.current) return;
        setGraphData(data);
        g = new module.default(container.current)
          .warmupTicks(80)
          .cooldownTicks(0)
          .graphData(data)
          .backgroundColor("#111512")
          .nodeLabel((n: any) => {
            const el = document.createElement("span");
            el.textContent = n.name;
            return el;
          })
          .nodeColor((n: any) => (n.group === "memory" ? "#a9e19b" : "#8caac7"))
          .nodeRelSize(5)
          .linkColor(() => "#677a65")
          .linkOpacity(0.5)
          .onNodeClick((n: any) => onNote(n.id))
          .showNavInfo(false);
        observer = new ResizeObserver(() => {
          if (container.current)
            g.width(container.current.clientWidth).height(
              container.current.clientHeight,
            );
        });
        observer.observe(container.current);
        g.width(container.current.clientWidth).height(
          container.current.clientHeight,
        );
        setTimeout(() => {
          if (!disposed) g.zoomToFit(500, 60);
        }, 400);
      } catch {
        setError(
          "O mapa 3D não está disponível neste navegador. Seus documentos continuam acessíveis na lista abaixo.",
        );
      }
    })();
    return () => {
      disposed = true;
      observer?.disconnect();
      g?._destructor();
    };
  }, [notes]);
  return (
    <section className="page">
      <PageHeading
        title="Ideias que se conectam."
        description="Explore seus documentos em 3D. As conexões representam referências por título ou wikilinks."
      />
      {!error && graphData && graphData.links.length === 0 && (
        <div className="inline-note">
          <BookOpen size={20} />
          <div>
            <strong>Seus documentos ainda não têm conexões.</strong>
            <p>
              Edite uma nota e inclua [[Título]] com o título exato de outro
              documento para criar uma referência. Abra um documento pela lista
              abaixo.
            </p>
          </div>
        </div>
      )}
      <div
        className="graph-wrap"
        ref={container}
        aria-label="Mapa 3D de documentos"
      />
      {error && <p role="status">{error}</p>}
      <div className="graph-legend">
        <span>
          <i /> Nota
        </span>
        <span>
          <i className="memory-dot" /> Memória
        </span>
        <small>
          Arraste para girar · role para aproximar · clique para abrir
        </small>
      </div>
      <details
        className="text-alternative"
        open={!!error || (!!graphData && graphData.links.length === 0)}
      >
        <summary>Lista acessível de documentos ({notes.length})</summary>
        {notes.map((n: Note) => (
          <button
            className="text-button"
            key={n.id}
            onClick={() => onNote(n.id)}
          >
            {n.title}
            <ArrowRight size={14} />
          </button>
        ))}
      </details>
    </section>
  );
}
function Media({ settings, runs, act, onSettings }: any) {
  const [kind, setKind] = useState("image"),
    [prompt, setPrompt] = useState(""),
    [ratio, setRatio] = useState("3:2"),
    [consent, setConsent] = useState(false),
    [working, setWorking] = useState(false),
    [assets, setAssets] = useState<any[]>([]);
  const requestId = useRef(crypto.randomUUID());
  useEffect(() => {
    void api("/assets").then(setAssets);
  }, [runs]);
  return (
    <section className="page">
      <PageHeading
        title="Da ideia ao arquivo."
        description="Crie imagens e vídeos. Acompanhe os trabalhos e mantenha os resultados no seu espaço."
      />
      <div className="media-layout">
        <form
          className="media-form panel"
          onSubmit={async (e) => {
            e.preventDefault();
            setWorking(true);
            const ok = await act(
              () =>
                post("/media/jobs", {
                  model: "grok-imagine/text-to-" + kind,
                  prompt,
                  aspectRatio: ratio,
                  confirmCost: consent,
                  requestId: requestId.current,
                }),
              "Pedido criado. Acompanhe em Trabalhos.",
            );
            if (ok !== false) {
              requestId.current = crypto.randomUUID();
              setPrompt("");
              setConsent(false);
            }
            setWorking(false);
          }}
        >
          <div className="segmented" role="group" aria-label="Tipo de criação">
            <button
              type="button"
              className={kind === "image" ? "active" : ""}
              onClick={() => {
                setKind("image");
                requestId.current = crypto.randomUUID();
              }}
            >
              <ImageIcon size={16} />
              Imagem
            </button>
            <button
              type="button"
              className={kind === "video" ? "active" : ""}
              onClick={() => {
                setKind("video");
                if (ratio === "1:1") setRatio("3:2");
                requestId.current = crypto.randomUUID();
              }}
            >
              <Play size={16} />
              Vídeo
            </button>
          </div>
          <label>
            O que vamos criar?
            <textarea
              rows={7}
              placeholder="Descreva a cena, a luz, o enquadramento e o que é importante preservar…"
              value={prompt}
              minLength={5}
              required
              onChange={(e) => {
                setPrompt(e.target.value);
                requestId.current = crypto.randomUUID();
              }}
            />
          </label>
          <div className="field-pair">
            <label>
              Provedor
              <input value="Kie" readOnly />
            </label>
            <label>
              Modelo
              <input value="Grok Imagine" readOnly />
            </label>
          </div>
          <label>
            Formato
            <select
              value={ratio}
              onChange={(e) => {
                setRatio(e.target.value);
                requestId.current = crypto.randomUUID();
              }}
            >
              <option value="3:2">Horizontal · 3:2</option>
              <option value="2:3">Vertical · 2:3</option>
              {kind === "image" && <option value="1:1">Quadrado · 1:1</option>}
            </select>
          </label>
          {kind === "video" && (
            <p className="field-help">
              Perfil inicial: 6 segundos, 480p, modo normal.
            </p>
          )}
          <label className="check-field">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Autorizo este pedido com meus créditos Kie. O custo exato não está
            disponível nesta interface.
          </label>
          <p className="field-help">
            Limite local: {settings.mediaMaxJobs} pedidos por dia. O provedor
            pode continuar cobrando um trabalho já enviado.
          </p>
          {settings.mediaEnabled ? (
            <Button
              type="submit"
              kind="primary wide"
              icon={ArrowRight}
              disabled={!consent || working || prompt.trim().length < 5}
            >
              {working
                ? "Enviando…"
                : kind === "image"
                  ? "Criar imagem"
                  : "Criar vídeo"}
            </Button>
          ) : (
            <Button type="button" onClick={onSettings} icon={Plug}>
              Configurar estúdio
            </Button>
          )}
        </form>
        <div className="asset-section">
          <div className="section-title">
            <h2>Biblioteca de criações</h2>
            <Tag>{assets.length} arquivos</Tag>
          </div>
          {assets.length ? (
            <div className="asset-grid">
              {assets.map((a) => (
                <article className="asset" key={a.id}>
                  {a.mime.startsWith("image/") ? (
                    <img
                      src={"/api/assets/" + a.id}
                      alt="Imagem gerada no Jarvis v7"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      controls
                      preload="metadata"
                      src={"/api/assets/" + a.id}
                    />
                  )}
                  <div>
                    <span>
                      {a.mime.startsWith("image/") ? "Imagem" : "Vídeo"}{" "}
                      <small>{(a.bytes / 1024 / 1024).toFixed(1)} MB</small>
                    </span>
                    <a
                      href={"/api/assets/" + a.id + "?download=1"}
                      aria-label="Baixar criação"
                    >
                      <Download size={17} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty icon={ImageIcon} title="Suas criações moram aqui">
              <p>
                Descreva sua primeira ideia. Os arquivos concluídos ficam
                disponíveis para visualizar e baixar.
              </p>
            </Empty>
          )}
          <div className="recent-jobs">
            {runs
              .filter((r: Run) => r.kind !== "chat")
              .slice(0, 3)
              .map((r: Run) => (
                <div key={r.id}>
                  <span>{r.input.prompt?.slice(0, 70)}</span>
                  <Tag tone={r.state === "succeeded" ? "good" : ""}>
                    {states[r.state]}
                  </Tag>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function Tasks({ runs, act }: any) {
  return (
    <section className="page">
      <PageHeading
        title="O trabalho, à vista."
        description="Cada pedido tem um estado e um resultado. Falhas e interrupções também ficam registradas."
      />
      {runs.length ? (
        <div className="task-list">
          {runs.map((r: Run) => (
            <article className="task-row" key={r.id}>
              <div className="task-icon">
                {r.kind === "chat" ? (
                  <MessageSquare size={21} />
                ) : r.kind === "image" ? (
                  <ImageIcon size={21} />
                ) : (
                  <Play size={21} />
                )}
              </div>
              <div className="task-content">
                <strong>
                  {r.input.question ?? r.input.prompt ?? "Trabalho"}
                </strong>
                <p>
                  {labels[r.provider] ?? r.provider} ·{" "}
                  {r.model || "busca textual"} ·{" "}
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
                {r.error && <p className="task-error">{r.error}</p>}
                {r.remote_id && <small>ID remoto: {r.remote_id}</small>}
              </div>
              <div className="task-actions">
                <Tag
                  tone={
                    r.state === "succeeded"
                      ? "good"
                      : ["failed", "unknown", "needs_attention"].includes(
                            r.state,
                          )
                        ? "warn"
                        : ""
                  }
                >
                  {states[r.state] ?? r.state}
                </Tag>
                {active(r) && (r.kind === "chat" || r.state === "queued") && (
                  <Button
                    icon={Square}
                    onClick={() =>
                      void act(() => post("/runs/" + r.id + "/cancel"))
                    }
                  >
                    Interromper
                  </Button>
                )}
                {r.remote_id &&
                  ["needs_attention", "unknown"].includes(r.state) && (
                    <Button
                      icon={RefreshCw}
                      onClick={() =>
                        void act(() => post("/runs/" + r.id + "/reconcile"))
                      }
                    >
                      Consultar novamente
                    </Button>
                  )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty icon={ListTodo} title="Um passo de cada vez">
          <p>Suas conversas e gerações aparecerão aqui quando você começar.</p>
        </Empty>
      )}
    </section>
  );
}
function Focus({ enabled, onError, onSettings }: any) {
  const [focus, setFocus] = useState<any>(null),
    [minutes, setMinutes] = useState(25),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    const poll = () =>
      api("/focus")
        .then(setFocus)
        .catch(() => {})
        .finally(() => setLoading(false));
    void poll();
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, []);
  const act = async (a: string) => {
    try {
      setFocus(await post("/focus/action", { action: a }));
    } catch (e) {
      onError((e as Error).message);
    }
  };
  const running = focus && ["running", "paused"].includes(focus.state);
  const remaining = running ? focus.remaining : minutes * 60;
  return (
    <section className="page focus-page">
      <PageHeading
        title="Um pouco de espaço. Um objetivo."
        description="Reserve tempo para o que importa. Você decide quando pausar e quando retomar."
      />
      {loading ? (
        <Loading />
      ) : (
        <div className="focus-center">
          <div className="focus-label">
            <span
              className={`status-dot ${focus?.state !== "running" ? "dim" : ""}`}
            />
            {focus?.state === "running"
              ? "Sessão em andamento"
              : focus?.state === "paused"
                ? "Pausa, sem pressa"
                : "Pronto quando você estiver"}
          </div>
          <div
            className="timer-display"
            role="timer"
            aria-label="Tempo restante"
          >
            {String(Math.floor(remaining / 60)).padStart(2, "0")}
            <span>:</span>
            {String(remaining % 60).padStart(2, "0")}
          </div>
          {!running ? (
            <>
              <div className="focus-presets">
                {[15, 25, 45, 60].map((n) => (
                  <button
                    className={minutes === n ? "active" : ""}
                    key={n}
                    onClick={() => setMinutes(n)}
                  >
                    {n} min
                  </button>
                ))}
              </div>
              {enabled ? (
                <Button
                  kind="primary"
                  icon={Play}
                  onClick={async () => {
                    try {
                      setFocus(await post("/focus", { minutes }));
                    } catch (e) {
                      onError((e as Error).message);
                    }
                  }}
                >
                  Começar sessão
                </Button>
              ) : (
                <Button onClick={onSettings}>
                  Ativar foco em Configurações
                </Button>
              )}
            </>
          ) : (
            <div className="focus-controls">
              <Button
                icon={focus.state === "paused" ? Play : Pause}
                kind="primary"
                onClick={() =>
                  void act(focus.state === "paused" ? "resume" : "pause")
                }
              >
                {focus.state === "paused" ? "Retomar" : "Pausar"}
              </Button>
              <Button icon={Plus} onClick={() => void act("extend")}>
                5 minutos
              </Button>
              <Button icon={Square} onClick={() => void act("stop")}>
                Encerrar
              </Button>
            </div>
          )}
          <div className="focus-info">
            <div>
              <Monitor size={18} />
              <strong>Acompanhamento manual</strong>
              <p>
                Nesta versão, o Jarvis não observa suas abas nem avalia sua
                postura.
              </p>
            </div>
            {running && (
              <Button onClick={() => void act("drift")}>
                Registrar distração · {focus.drifts}
              </Button>
            )}
          </div>
          {focus && !running && (
            <p className="muted">
              Última sessão: {Math.floor(focus.elapsed_seconds / 60)} minutos ·{" "}
              {focus.drifts} distrações registradas.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
function Preferences({
  settings,
  save,
  connections,
  reconnect,
  act,
  onError,
}: any) {
  const [s, setS] = useState<Settings>(settings),
    [tab, setTab] = useState("brain"),
    [models, setModels] = useState<Model[]>([]),
    [modelLoading, setModelLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [secretProvider, setSecretProvider] = useState("openrouter"),
    [secret, setSecret] = useState(""),
    [login, setLogin] = useState(""),
    [updates, setUpdates] = useState<any>(null),
    [diagnostics, setDiagnostics] = useState<any>(null),
    [backups, setBackups] = useState<string[]>([]),
    [importing, setImporting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setS(settings);
  }, [settings]);
  useEffect(() => {
    let cancelled = false;
    setModelLoading(true);
    api<Model[]>("/models?provider=" + s.brain)
      .then((m) => {
        if (!cancelled) {
          setModels(m);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setModels([]);
          onError(e.message);
        }
      })
      .finally(() => {
        if (!cancelled) setModelLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [s.brain]);
  useEffect(() => {
    void api("/diagnostics").then(setDiagnostics);
    void api<string[]>("/backups").then(setBackups);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await save(s);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const selected = models.find((m) => m.id === s.model);
  return (
    <section className="page settings-page">
      <PageHeading
        title="Do seu jeito."
        description="Escolha o cérebro, conecte serviços e cuide do seu espaço."
      />
      <div
        className="settings-tabs"
        role="group"
        aria-label="Áreas de configuração"
      >
        {[
          ["brain", "Cérebro"],
          ["preferences", "Preferências"],
          ["connections", "Conexões"],
          ["data", "Dados e versões"],
        ].map(([key, name]) => (
          <button
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => setTab(key)}
          >
            {name}
          </button>
        ))}
      </div>
      {(tab === "brain" || tab === "preferences") && (
        <form className="settings-form" onSubmit={submit}>
          {tab === "brain" ? (
            <>
              <div className="section-title">
                <h2>Quem pensa com você?</h2>
                <Tag>Por conta própria</Tag>
              </div>
              <p className="muted">
                A escolha abaixo vale para conversas novas. As anteriores mantêm
                seu cérebro.
              </p>
              <label>
                Provedor
                <select
                  value={s.brain}
                  onChange={(e) =>
                    setS({ ...s, brain: e.target.value as Brain, model: "" })
                  }
                >
                  <option value="local">Busca local · sem IA generativa</option>
                  <option value="codex">Codex · OAuth ChatGPT</option>
                  <option value="claude">Claude · OAuth local</option>
                  <option value="openrouter">OpenRouter · API</option>
                </select>
              </label>
              <label>
                Modelo
                <select
                  value={s.model}
                  disabled={modelLoading}
                  onChange={(e) => setS({ ...s, model: e.target.value })}
                >
                  <option value="">
                    {modelLoading
                      ? "Carregando catálogo…"
                      : "Selecione um modelo"}
                  </option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              {selected && (
                <p className="field-help">
                  {selected.vision
                    ? "Aceita texto e captura de tela."
                    : "Texto; sem leitura de imagem neste adaptador."}
                </p>
              )}
              {(selected?.efforts?.length ?? 0) > 0 && (
                <label>
                  Esforço de raciocínio
                  <select
                    value={
                      selected!.efforts.includes(s.effort)
                        ? s.effort
                        : selected!.efforts[0]
                    }
                    onChange={(e) => setS({ ...s, effort: e.target.value })}
                  >
                    {selected!.efforts.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <span className="field-help">
                    Mais esforço pode aumentar o tempo e o consumo. Use medium
                    no cotidiano e high em tarefas mais difíceis.
                  </span>
                </label>
              )}
              {s.brain === "claude" && (
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={s.claudeEnabled}
                    onChange={(e) =>
                      setS({ ...s, claudeEnabled: e.target.checked })
                    }
                  />
                  Habilitar o runtime Claude da minha conta. Li as condições de
                  acesso e distribuição em docs/provedores-e-autenticacao.md.
                </label>
              )}
              <div className="inline-note">
                <Plug size={18} />
                <p>
                  Login e credenciais ficam em{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => setTab("connections")}
                  >
                    Conexões
                  </button>
                  . Trocar de cérebro não remove notas ou memórias.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2>Uma identidade, várias possibilidades.</h2>
              <div className="field-pair">
                <label>
                  Nome do assistente
                  <input
                    value={s.name}
                    maxLength={50}
                    onChange={(e) => setS({ ...s, name: e.target.value })}
                  />
                </label>
                <label>
                  Perfil
                  <select
                    value={s.preset}
                    onChange={(e) => {
                      const preset = e.target.value as Settings["preset"];
                      setS({
                        ...s,
                        preset,
                        mediaEnabled:
                          preset === "creative" || preset === "custom",
                        focusEnabled: preset === "work" || preset === "custom",
                        screenEnabled: preset === "work" || preset === "custom",
                      });
                    }}
                  >
                    <option value="knowledge">Conhecimento</option>
                    <option value="creative">Criação</option>
                    <option value="work">Assistente de trabalho</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </label>
              </div>
              <label>
                Como você quer que ele responda?
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={s.persona}
                  onChange={(e) => setS({ ...s, persona: e.target.value })}
                />
              </label>
              <div className="toggle-list">
                {[
                  [
                    "voice",
                    "Respostas em voz",
                    "Falar respostas neste navegador; disponível conforme as vozes instaladas.",
                  ],
                  [
                    "mediaEnabled",
                    "Estúdio de mídia",
                    "Criar imagens e vídeos pela Kie com sua credencial.",
                  ],
                  [
                    "screenEnabled",
                    "Contexto de tela",
                    "Disponibilizar o botão de compartilhamento; não inicia captura sozinho.",
                  ],
                  [
                    "focusEnabled",
                    "Sessões de foco",
                    "Temporizador com pausa e registro manual de distrações.",
                  ],
                ].map(([key, title, desc]) => (
                  <label className="toggle-row" key={key}>
                    <span>
                      <strong>{title}</strong>
                      <small>{desc}</small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={!!(s as any)[key]}
                      onChange={(e) =>
                        setS({
                          ...s,
                          [key]: e.target.checked,
                          preset: "custom",
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <label>
                Limite diário de pedidos de mídia
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={s.mediaMaxJobs}
                  onChange={(e) =>
                    setS({ ...s, mediaMaxJobs: Number(e.target.value) })
                  }
                />
                <span className="field-help">
                  É um limite local de quantidade, não uma estimativa de preço
                  do provedor.
                </span>
              </label>
            </>
          )}
          <div className="settings-save">
            <Button type="submit" kind="primary" icon={Check} disabled={saving}>
              {saving ? "Salvando…" : "Salvar preferências"}
            </Button>
            <span>{saving ? "" : "Aplicadas às próximas ações."}</span>
          </div>
        </form>
      )}
      {tab === "connections" && (
        <div className="settings-form">
          <div className="section-title">
            <h2>Suas contas, separadas.</h2>
            <Button icon={RefreshCw} onClick={reconnect}>
              Verificar
            </Button>
          </div>
          <p className="muted">
            O Jarvis não recebe tokens OAuth. Cada runtime gerencia seu próprio
            login.
          </p>
          <div className="connection-list">
            {connections.length === 0 ? (
              <Loading />
            ) : (
              connections
                .filter((c: Connection) => c.id !== "local")
                .map((c: Connection) => (
                  <div className="connection-row" key={c.id}>
                    <div className="connection-icon">
                      <Plug size={20} />
                    </div>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{c.detail}</p>
                      {c.id === "claude" && <code>claude auth login</code>}
                    </div>
                    <Tag tone={c.state === "connected" ? "good" : ""}>
                      {c.state === "connected"
                        ? ["kie", "openrouter"].includes(c.id)
                          ? "Credencial salva"
                          : "Conectado"
                        : c.state === "pending"
                          ? "Pendente"
                          : c.state === "missing"
                            ? "Runtime ausente"
                            : "Desconectado"}
                    </Tag>
                    {c.id === "codex" && c.state !== "connected" && (
                      <Button
                        onClick={async () => {
                          try {
                            const r = await post("/connections/codex/login");
                            setLogin(r.url);
                          } catch (e) {
                            onError((e as Error).message);
                          }
                        }}
                      >
                        Conectar
                      </Button>
                    )}
                    {c.state === "connected" && (
                      <button
                        className="icon-button"
                        aria-label={"Desconectar " + c.name}
                        onClick={() =>
                          void act(async () => {
                            await remove("/connections/" + c.id);
                            await reconnect();
                          }, "Preferência local removida. Contas globais dos CLIs não foram encerradas.")
                        }
                      >
                        <LogOut size={17} />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
          {login && (
            <div className="inline-note">
              <a
                href={login}
                target="_blank"
                rel="noreferrer"
                className="button primary"
              >
                Continuar login no navegador <ExternalLink size={16} />
              </a>
              <span>Conclua no provedor e clique em Verificar.</span>
            </div>
          )}
          <form
            className="credentials-form"
            onSubmit={async (e) => {
              e.preventDefault();
              await act(async () => {
                await post("/connections/secret", {
                  provider: secretProvider,
                  value: secret,
                });
                setSecret("");
                await reconnect();
              }, "Credencial salva apenas nesta instalação.");
            }}
          >
            <h3>Conectar uma API</h3>
            <div className="field-pair">
              <label>
                Serviço
                <select
                  value={secretProvider}
                  onChange={(e) => {
                    setSecretProvider(e.target.value);
                    setSecret("");
                  }}
                >
                  <option value="openrouter">OpenRouter</option>
                  <option value="kie">Kie</option>
                </select>
              </label>
              <label>
                Credencial
                <input
                  type="password"
                  autoComplete="new-password"
                  value={secret}
                  minLength={10}
                  required
                  placeholder="Cole somente neste campo local"
                  onChange={(e) => setSecret(e.target.value)}
                />
              </label>
            </div>
            <Button type="submit" icon={Save}>
              Salvar conexão
            </Button>
            <p className="field-help">
              Arquivo local protegido por permissões do sistema. A chave não é
              mostrada novamente nem incluída na exportação.
            </p>
          </form>
        </div>
      )}
      {tab === "data" && (
        <div className="settings-form">
          <h2>Seu espaço deve continuar sendo seu.</h2>
          <div className="data-row">
            <div>
              <h3>Exportar conhecimento e histórico</h3>
              <p>
                Baixe um JSON com suas notas, memórias, preferências e
                conversas. Sem credenciais.
              </p>
            </div>
            <a className="button" href="/api/export" download>
              <Download size={17} />
              Exportar JSON
            </a>
          </div>
          <div className="data-row">
            <div>
              <h3>Importar notas e memórias</h3>
              <p>
                Adiciona o conteúdo de uma exportação sem sobrescrever seus
                documentos. Não restaura conversas ou preferências.
              </p>
            </div>
            <Button
              icon={Upload}
              disabled={importing}
              onClick={() => input.current?.click()}
            >
              Importar JSON
            </Button>
            <input
              type="file"
              className="sr-only"
              ref={input}
              accept=".json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                await act(async () => {
                  const b = JSON.parse(await file.text());
                  return post("/import", b);
                }, "Notas e memórias importadas.");
                setImporting(false);
                e.target.value = "";
              }}
            />
          </div>
          <div className="data-row">
            <div>
              <h3>Snapshot do banco</h3>
              <p>
                Cria uma cópia consistente em data/backups. Imagens e vídeos
                precisam de cópia separada de data/assets.
              </p>
              {backups.length > 0 && (
                <small>
                  {backups.length} snapshots locais · último: {backups.at(-1)}
                </small>
              )}
            </div>
            <Button
              icon={Database}
              onClick={() =>
                void act(async () => {
                  await post("/backup");
                  setBackups(await api("/backups"));
                }, "Snapshot do banco criado.")
              }
            >
              Criar snapshot
            </Button>
          </div>
          <div className="update-section">
            <div className="section-title">
              <h2>Atualizações</h2>
              <Tag>v0.1.0</Tag>
            </div>
            <p className="muted">
              Nesta versão, a consulta verifica releases. A instalação de
              atualizações é manual e preserva sua pasta de dados.
            </p>
            <Button
              icon={RefreshCw}
              onClick={async () => {
                try {
                  setUpdates(await api("/updates"));
                } catch (e) {
                  onError((e as Error).message);
                }
              }}
            >
              Verificar atualizações
            </Button>
            {updates && (
              <div className="update-result">
                <p>
                  {updates.message ??
                    `Versão publicada: ${updates.latest ?? "nenhuma"}. Instalada: ${updates.current}.`}
                </p>
                {updates.url && (
                  <a href={updates.url} target="_blank" rel="noreferrer">
                    Abrir release <ExternalLink size={14} />
                  </a>
                )}
                {updates.notes && <pre>{updates.notes}</pre>}
              </div>
            )}
          </div>
          <details className="diagnostics">
            <summary>Diagnóstico da instalação</summary>
            <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}
function Onboarding({
  settings,
  save,
  connections,
  close,
  onSettings,
  act,
}: any) {
  const [step, setStep] = useState(0),
    [preset, setPreset] = useState("knowledge"),
    [examples, setExamples] = useState(true),
    [working, setWorking] = useState(false);
  const finish = async (connect: boolean) => {
    setWorking(true);
    const ok = await act(async () => {
      if (examples) await post("/notes/examples");
      await save({
        onboarded: true,
        preset,
        mediaEnabled: preset === "creative",
        focusEnabled: preset === "work",
        screenEnabled: preset === "work",
      });
    });
    setWorking(false);
    if (ok !== false) {
      close();
      if (connect) onSettings();
    }
  };
  return (
    <Modal title="Seu Jarvis começa aqui." close={() => void finish(false)}>
      <div className="onboarding">
        <p className="onboarding-intro">
          Um assistente pessoal. Um espaço para suas ideias.
          <br />
          Configure o essencial e ajuste o resto quando precisar.
        </p>
        <div className="setup-progress" aria-label={`Etapa ${step + 1} de 2`}>
          <span className="active" />
          <span className={step === 1 ? "active" : ""} />
        </div>
        {step === 0 ? (
          <>
            <h3>Por onde você quer começar?</h3>
            <div className="preset-list">
              {[
                [
                  "knowledge",
                  "Conhecimento",
                  "Notas, memórias e respostas com fontes.",
                ],
                [
                  "creative",
                  "Criação",
                  "Conhecimento, imagens, vídeos e biblioteca.",
                ],
                [
                  "work",
                  "Assistente de trabalho",
                  "Conhecimento, voz, tela e foco manual.",
                ],
              ].map(([value, title, desc]) => (
                <label
                  className={preset === value ? "selected" : ""}
                  key={value}
                >
                  <input
                    type="radio"
                    name="preset"
                    checked={preset === value}
                    onChange={() => setPreset(value)}
                  />
                  <span>
                    <strong>{title}</strong>
                    <small>{desc}</small>
                  </span>
                  {preset === value && <Check size={18} />}
                </label>
              ))}
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={examples}
                onChange={(e) => setExamples(e.target.checked)}
              />
              Incluir quatro notas fictícias para explorar o funcionamento.
            </label>
            <div className="onboarding-footer">
              <span>Você pode mudar tudo depois.</span>
              <Button
                kind="primary"
                icon={ArrowRight}
                onClick={() => setStep(1)}
              >
                Continuar
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3>Conecte seu próprio cérebro.</h3>
            <p>
              Codex e Claude usam a conta do runtime local. OpenRouter usa sua
              API. Você também pode explorar a busca local sem conectar nada.
            </p>
            <div className="setup-connections">
              {["codex", "claude", "openrouter"].map((cid) => (
                <div key={cid}>
                  <BrainCircuit size={20} />
                  <span>{labels[cid]}</span>
                  <Tag
                    tone={
                      connections.find((c: Connection) => c.id === cid)
                        ?.state === "connected"
                        ? "good"
                        : ""
                    }
                  >
                    {connections.find((c: Connection) => c.id === cid)
                      ?.state === "connected"
                      ? "Disponível"
                      : "Configurar"}
                  </Tag>
                </div>
              ))}
            </div>
            <div className="onboarding-footer">
              <Button icon={ArrowLeft} onClick={() => setStep(0)}>
                Voltar
              </Button>
              <Button
                kind="primary"
                icon={Plug}
                disabled={working}
                onClick={() => void finish(true)}
              >
                Escolher e conectar
              </Button>
            </div>
            <button
              className="text-button setup-skip"
              disabled={working}
              onClick={() => void finish(false)}
            >
              Explorar primeiro, conectar depois <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function ConversationBrain({ brain, model, close, save, onError }: any) {
  const [provider, setProvider] = useState<Brain>(brain),
    [selected, setSelected] = useState(model),
    [catalog, setCatalog] = useState<Model[]>([]),
    [loading, setLoading] = useState(true),
    [working, setWorking] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<Model[]>("/models?provider=" + provider)
      .then((m) => {
        if (alive) setCatalog(m);
      })
      .catch((e) => {
        if (alive) {
          setCatalog([]);
          onError(e.message);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [provider]);
  return (
    <Modal title="Cérebro desta conversa" close={close}>
      <form
        className="note-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setWorking(true);
          try {
            await save(provider, selected);
          } catch (e) {
            onError((e as Error).message);
          } finally {
            setWorking(false);
          }
        }}
      >
        <p className="field-help">
          O histórico continua nesta conversa. As próximas mensagens e os
          trechos selecionados serão enviados ao provedor escolhido. O esforço
          segue sua preferência global.
        </p>
        <label>
          Provedor da conversa
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as Brain);
              setSelected("");
            }}
          >
            {Object.entries(labels).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modelo da conversa
          <select
            value={selected}
            required
            disabled={loading}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">{loading ? "Carregando…" : "Selecione"}</option>
            {catalog.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="submit"
          kind="primary"
          disabled={working || loading || !selected}
        >
          Usar nesta conversa
        </Button>
      </form>
    </Modal>
  );
}
