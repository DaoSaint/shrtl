import { useRef, useState } from "hono/jsx";
import { renderToString } from "hono/jsx/dom/server";
import { relativeTime } from "@/lib/time.ts";
import { Layout } from "@/views/layout.tsx";
import { PlasticCard } from "@/views/plastic-card.tsx";
import { Terminal } from "@/views/terminal.tsx";
import { fieldTone, FormError, inputLine, slugLine } from "@/views/field.tsx";

export type LinkRow = {
    id: number;
    slug: string;
    targetUrl: string;
    visibility: "public" | "private";
    hits: number;
    lastAccessAt: string | null;
};

export type VisibilityFilter = "all" | "public" | "private";

export type LinkDraft = {
    target: string;
    slug: string;
    visibility: "public" | "private";
};

export type DashboardProps = {
    username: string;
    links: LinkRow[];
    query: string;
    state: VisibilityFilter;
    next: number | null;
    error?: string;
    errorForm?: "create" | "update";
    errorField?: string;
    draft?: LinkDraft;
    editDraft?: LinkDraft & { id: number };
};

const title = "font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase";

const badge = {
    public: "border-accent/30 text-accent/80",
    private: "border-signal/30 text-signal/80",
};

const activeTab = "rounded px-2 py-1 bg-accent/15 text-accent";
const idleTab = "rounded px-2 py-1 text-white/35";

const prefixFor = (visibility: "public" | "private") => (visibility === "public" ? "/p/" : "/r/");

const Segment = ({
    value,
    options,
    onSelect,
}: {
    value: string;
    options: string[];
    onSelect: (value: string) => void;
}) => (
    <div class="inline-flex rounded-md border border-white/10 p-0.5 font-mono text-[10px]">
        {options.map((option) => (
            <button
                type="button"
                onClick={() => onSelect(option)}
                class={option === value ? activeTab : idleTab}
            >
                {option}
            </button>
        ))}
    </div>
);

const LinkItem = ({
    link,
    copied,
    onCopy,
    onEdit,
}: {
    link: LinkRow;
    copied: boolean;
    onCopy: () => void;
    onEdit: () => void;
}) => (
    <div class="grid grid-cols-1 gap-2 border-b border-white/8 px-5 py-4 last:border-b-0 sm:grid-cols-[130px_1fr_auto] sm:items-center sm:gap-4">
        <button
            type="button"
            onClick={onCopy}
            title="copy link"
            class="text-left font-mono text-xs text-accent/90 transition hover:text-accent"
        >
            {copied ? (
                "copied"
            ) : (
                <>
                    <span class="text-signal/60">{prefixFor(link.visibility)}</span>
                    {link.slug}
                </>
            )}
        </button>
        <span class="truncate font-mono text-[11px] text-white/45">{link.targetUrl}</span>
        <div class="flex items-center justify-between gap-3 sm:justify-end">
            <span
                class={`w-16 rounded-full border py-0.5 text-center font-mono text-[10px] ${badge[link.visibility]}`}
            >
                {link.visibility}
            </span>
            <span class="w-9 text-right font-mono text-[11px] text-signal/70">{link.hits}</span>
            <span class="w-8 text-right font-mono text-[11px] text-white/35">
                {relativeTime(link.lastAccessAt)}
            </span>
            <button
                type="button"
                onClick={onEdit}
                class="w-[84px] text-right font-mono text-[10px] text-white/40 transition hover:text-accent"
            >
                edit
            </button>
        </div>
    </div>
);

export const Dashboard = ({
    username,
    links: initialLinks,
    query: initialQuery,
    state: initialState,
    next: initialNext,
    error,
    errorForm,
    errorField,
    draft,
    editDraft,
}: DashboardProps) => {
    const [links, setLinks] = useState(initialLinks);
    const [query, setQuery] = useState(initialQuery);
    const [state, setState] = useState<VisibilityFilter>(initialState);
    const [next, setNext] = useState<number | null>(initialNext);
    const [createTarget, setCreateTarget] = useState(draft?.target ?? "");
    const [createSlug, setCreateSlug] = useState(draft?.slug ?? "");
    const [createVisibility, setCreateVisibility] = useState<"public" | "private">(
        draft?.visibility ?? "public",
    );
    const [editId, setEditId] = useState<number | null>(editDraft?.id ?? null);
    const [editTarget, setEditTarget] = useState(editDraft?.target ?? "");
    const [editSlug, setEditSlug] = useState(editDraft?.slug ?? "");
    const [editVisibility, setEditVisibility] = useState<"public" | "private">(
        editDraft?.visibility ?? "public",
    );
    const [copied, setCopied] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const syncUrl = (value: string, filter: VisibilityFilter) => {
        const params = new URLSearchParams();
        if (value) params.set("q", value);
        if (filter !== "all") params.set("state", filter);
        const search = params.toString();
        history.replaceState(null, "", search ? `?${search}` : location.pathname);
    };

    const search = async (value: string, filter: VisibilityFilter) => {
        syncUrl(value, filter);
        const params = new URLSearchParams({ q: value, state: filter });
        const response = await fetch(`/links/page?${params}`);
        const data = (await response.json()) as { items: LinkRow[]; next: number | null };
        setLinks(data.items);
        setNext(data.next);
    };

    const loadMore = async () => {
        if (busy || next === null) return;
        setBusy(true);
        const params = new URLSearchParams({ q: query, state, offset: String(next) });
        const response = await fetch(`/links/page?${params}`);
        const data = (await response.json()) as { items: LinkRow[]; next: number | null };
        setLinks([...links, ...data.items]);
        setNext(data.next);
        setBusy(false);
    };

    const copy = (link: LinkRow) => {
        void navigator.clipboard.writeText(
            location.origin + prefixFor(link.visibility) + link.slug,
        );
        setCopied(link.slug);
        setTimeout(() => setCopied(null), 1200);
    };

    const openEditor = (link: LinkRow) => {
        setEditId(link.id);
        setEditTarget(link.targetUrl);
        setEditSlug(link.slug);
        setEditVisibility(link.visibility);
    };

    return (
        <div class="mx-auto flex w-full max-w-[880px] flex-col gap-4">
            <PlasticCard class="p-5">
                <div class="flex items-center justify-between gap-4">
                    <Terminal title="links" />
                    <form method="post" action="/logout" class="flex items-center gap-3">
                        <span class="font-mono text-[11px] text-signal/80">{username}</span>
                        <button
                            type="submit"
                            class="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white/50 transition hover:border-accent/40 hover:text-accent"
                        >
                            sign out
                        </button>
                    </form>
                </div>
            </PlasticCard>

            {editId === null && (
                <PlasticCard class="p-5">
                    <p class={title}>New redirection</p>

                    <FormError message={errorForm === "create" ? error : undefined} />

                    <form method="post" action="/links">
                        <label class="mt-4 flex items-baseline gap-2">
                            <span class="font-mono text-[11px] text-accent/70">›</span>
                            <input
                                name="target"
                                value={createTarget}
                                placeholder="https://example.com/some/path?ref=shrtl"
                                onInput={(event) =>
                                    setCreateTarget((event.target as HTMLInputElement).value)
                                }
                                class={`${inputLine} ${fieldTone(errorField === "target")}`}
                            />
                        </label>

                        <div class="mt-4 flex flex-wrap items-center gap-3">
                            <input type="hidden" name="visibility" value={createVisibility} />
                            <Segment
                                value={createVisibility}
                                options={["public", "private"]}
                                onSelect={(value) =>
                                    setCreateVisibility(value as "public" | "private")
                                }
                            />
                            <div class="flex items-center gap-2 font-mono text-xs">
                                <span class="text-signal/60">{prefixFor(createVisibility)}</span>
                                <input
                                    name="slug"
                                    value={createSlug}
                                    placeholder="auto"
                                    onInput={(event) =>
                                        setCreateSlug((event.target as HTMLInputElement).value)
                                    }
                                    class={`${slugLine} ${fieldTone(errorField === "slug")}`}
                                />
                            </div>
                            <button
                                type="submit"
                                class="ml-auto rounded-md bg-accent px-3 py-1.5 font-mono text-[11px] font-semibold text-accent-ink transition hover:brightness-110"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </PlasticCard>
            )}

            {editId !== null && (
                <PlasticCard class="p-5">
                    <form method="post" action="/links/update">
                        <FormError message={errorForm === "update" ? error : undefined} />
                        <input type="hidden" name="id" value={editId ?? ""} />
                        <input type="hidden" name="visibility" value={editVisibility} />

                        <div class="mt-3 flex items-center justify-between gap-4">
                            <p class={title}>Edit redirection</p>
                            <span class="truncate font-mono text-[11px] text-signal/70">
                                {prefixFor(editVisibility)}
                                {editSlug}
                            </span>
                        </div>

                        <label class="mt-4 flex items-baseline gap-2">
                            <span class="font-mono text-[11px] text-accent/70">›</span>
                            <input
                                name="target"
                                value={editTarget}
                                onInput={(event) =>
                                    setEditTarget((event.target as HTMLInputElement).value)
                                }
                                class={`${inputLine} ${fieldTone(errorField === "target")}`}
                            />
                        </label>

                        <div class="mt-4 flex flex-wrap items-center gap-3">
                            <Segment
                                value={editVisibility}
                                options={["public", "private"]}
                                onSelect={(value) =>
                                    setEditVisibility(value as "public" | "private")
                                }
                            />
                            <div class="flex items-center gap-2 font-mono text-xs">
                                <span class="text-signal/60">{prefixFor(editVisibility)}</span>
                                <input
                                    name="slug"
                                    value={editSlug}
                                    onInput={(event) =>
                                        setEditSlug((event.target as HTMLInputElement).value)
                                    }
                                    class={`${slugLine} ${fieldTone(errorField === "slug")}`}
                                />
                            </div>
                        </div>

                        <div class="mt-5 flex items-center justify-between gap-4">
                            <button
                                type="submit"
                                formaction="/links/delete"
                                class="rounded-md border border-red-400/30 px-2.5 py-1 font-mono text-[10px] text-red-400/80 transition hover:border-red-400/60 hover:text-red-400"
                            >
                                delete
                            </button>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditId(null)}
                                    class="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10px] text-white/50 transition hover:text-white/80"
                                >
                                    cancel
                                </button>
                                <button
                                    type="submit"
                                    class="rounded-md bg-accent px-3 py-1.5 font-mono text-[10px] font-semibold text-accent-ink transition hover:brightness-110"
                                >
                                    save
                                </button>
                            </div>
                        </div>
                    </form>
                </PlasticCard>
            )}

            <PlasticCard class="overflow-hidden">
                <div class="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-3">
                    <input
                        value={query}
                        placeholder="search slug or target"
                        class="w-full max-w-[220px] border-b border-dashed border-white/15 bg-transparent pb-1 font-mono text-xs text-fg outline-none placeholder:text-white/15 focus:border-accent/60"
                        onInput={(event) => {
                            const value = (event.target as HTMLInputElement).value;
                            setQuery(value);
                            if (timer.current) clearTimeout(timer.current);
                            timer.current = setTimeout(() => void search(value, state), 250);
                        }}
                    />
                    <Segment
                        value={state}
                        options={["all", "public", "private"]}
                        onSelect={(value) => {
                            const filter = value as VisibilityFilter;
                            setState(filter);
                            void search(query, filter);
                        }}
                    />
                </div>

                <div class="hidden grid-cols-[130px_1fr_auto] gap-4 border-b border-white/8 px-5 py-2.5 font-mono text-[10px] tracking-[0.14em] text-white/25 uppercase sm:grid">
                    <span>slug</span>
                    <span>target</span>
                    <div class="flex items-center justify-end gap-3">
                        <span class="w-16 text-center">state</span>
                        <span class="w-9 text-right">hits</span>
                        <span class="w-8 text-right">last</span>
                        <span class="w-[84px] text-right">edit</span>
                    </div>
                </div>

                <div
                    id="link-list"
                    class="max-h-[420px] overflow-y-auto"
                    onScroll={(event) => {
                        const list = event.currentTarget as HTMLDivElement;
                        if (list.scrollTop + list.clientHeight >= list.scrollHeight - 80) {
                            void loadMore();
                        }
                    }}
                >
                    {links.length === 0 ? (
                        <p class="px-5 py-6 font-mono text-[11px] text-white/25">
                            no redirections yet
                        </p>
                    ) : (
                        links.map((link) => (
                            <LinkItem
                                link={link}
                                copied={copied === link.slug}
                                onCopy={() => copy(link)}
                                onEdit={() => openEditor(link)}
                            />
                        ))
                    )}
                </div>
            </PlasticCard>
        </div>
    );
};

const embed = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export const DashboardPage = (props: DashboardProps) => (
    <Layout title="shrtl">
        <main class="min-h-dvh px-6 py-10">
            <div
                id="dashboard-root"
                dangerouslySetInnerHTML={{ __html: renderToString(<Dashboard {...props} />) }}
            />
        </main>
        <script
            type="application/json"
            id="dashboard-props"
            dangerouslySetInnerHTML={{ __html: embed(props) }}
        />
        <script src="/dashboard.js" defer />
    </Layout>
);
