import React, { useMemo, useRef, useState } from "react";
import {
  FileText,
  ShieldCheck,
  Info,
  Save,
  Eye,
  EyeOff,
  ChevronRight,
  History,
  AlertCircle,
  Layout,
} from "lucide-react";
import {
  useGetAllCMSQuery,
  useUpsertCMSMutation,
  useDeleteCMSMutation,
  type CmsType,
} from "../app/features/auth/cmsApi";
import DeleteCMSModal from "../components/cms/DeleteCMSModal";
import { getErrorMessage } from "../lib/errors";

type ContentType = "Privacy" | "Terms" | "About";

interface ContentState {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  isActive: boolean;
}

const TAB_TYPE: Record<ContentType, CmsType> = { Terms: "terms", Privacy: "privacy", About: "about" };

const contentConfig = {
  Terms: {
    label: "Terms & Conditions",
    icon: FileText,
    desc: "User agreement and platform guidelines.",
  },
  Privacy: {
    label: "Privacy Policy",
    icon: ShieldCheck,
    desc: "Data protection and privacy standards.",
  },
  About: {
    label: "About Us",
    icon: Info,
    desc: "Company vision, mission, and story.",
  },
};

/** Simple HTML helpers for the toolbar: wrap the current selection in tags. */
const TOOLS: Array<{ label: string; before: string; after: string; placeholder: string }> = [
  { label: "H1", before: "<h1>", after: "</h1>", placeholder: "Heading" },
  { label: "H2", before: "<h2>", after: "</h2>", placeholder: "Heading" },
  { label: "B", before: "<strong>", after: "</strong>", placeholder: "bold text" },
  { label: "I", before: "<em>", after: "</em>", placeholder: "italic text" },
  { label: "U", before: "<u>", after: "</u>", placeholder: "underlined text" },
  { label: "Link", before: '<a href="https://">', after: "</a>", placeholder: "link text" },
  { label: "List", before: "<ul>\n  <li>", after: "</li>\n</ul>", placeholder: "item" },
  { label: "Quote", before: "<blockquote>", after: "</blockquote>", placeholder: "quote" },
];

const CMSManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentType>("Terms");
  /** Unsaved edits per tab; server content is shown when there is no draft. */
  const [drafts, setDrafts] = useState<Partial<Record<ContentType, string>>>({});
  const [isPreview, setIsPreview] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, error } = useGetAllCMSQuery();
  const [upsertCMS, { isLoading: isSaving }] = useUpsertCMSMutation();
  const [deleteCMS, { isLoading: isDeleting }] = useDeleteCMSMutation();

  const docs = useMemo(() => {
    const items = data?.data ?? [];
    const result = {} as Record<ContentType, ContentState>;
    (Object.keys(TAB_TYPE) as ContentType[]).forEach((tab) => {
      const item = items.find((i) => i.type === TAB_TYPE[tab]);
      result[tab] = {
        id: item?._id ?? "",
        title: item?.title || contentConfig[tab].label,
        content: drafts[tab] ?? item?.content ?? "",
        lastUpdated: item?.updatedAt ? new Date(item.updatedAt).toLocaleString("en-IN") : "-",
        isActive: item?.isActive ?? false,
      };
    });
    return result;
  }, [data, drafts]);

  const current = docs[activeTab];
  const isDirty = drafts[activeTab] !== undefined;

  const handleContentChange = (val: string) => {
    setDrafts((d) => ({ ...d, [activeTab]: val }));
    setNotice(null);
  };

  const applyTool = (tool: (typeof TOOLS)[number]) => {
    const el = editorRef.current;
    if (!el || isPreview) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || tool.placeholder;
    const next = value.slice(0, start) + tool.before + selected + tool.after + value.slice(end);
    handleContentChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tool.before.length, start + tool.before.length + selected.length);
    });
  };

  // POST /admin/cms upserts by type, so saving works even when the page does not exist yet.
  const saveContent = async () => {
    const content = current.content;
    if (!content.trim()) {
      setNotice({ kind: "error", text: "Content cannot be empty." });
      return;
    }
    try {
      await upsertCMS({ type: TAB_TYPE[activeTab], content, ...(current.id ? {} : { isActive: true }) }).unwrap();
      setDrafts((d) => {
        const next = { ...d };
        delete next[activeTab];
        return next;
      });
      setNotice({ kind: "ok", text: `${contentConfig[activeTab].label} published.` });
    } catch (err) {
      setNotice({ kind: "error", text: getErrorMessage(err, "Failed to save content.") });
    }
  };

  const handleDelete = async () => {
    if (!current.id) return;
    try {
      await deleteCMS(current.id).unwrap();
      setDrafts((d) => {
        const next = { ...d };
        delete next[activeTab];
        return next;
      });
      setIsDeleteOpen(false);
      setNotice({ kind: "ok", text: `${contentConfig[activeTab].label} deleted.` });
    } catch (err) {
      setIsDeleteOpen(false);
      setNotice({ kind: "error", text: getErrorMessage(err, "Failed to delete content.") });
    }
  };

  if (isLoading) {
    return (
      <div className="text-white text-center mt-20">
        Loading CMS...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-20">
        Failed to load CMS: {getErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            CMS Management
          </h1>
          <p className="text-white/30 text-sm font-medium">
            Manage legal policies, company info and dynamic content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-sm font-bold"
          >
            {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={saveContent}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-cyan text-dark-bg font-bold shadow-lg shadow-brand-cyan/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <Layout className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Publish Changes"}
          </button>

          <button
            onClick={() => setIsDeleteOpen(true)}
            disabled={!current.id}
            title={current.id ? "Delete this page" : "This page has not been published yet"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`glass-card p-4 rounded-2xl border text-sm ${
            notice.kind === "ok"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/20 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card rounded-3xl border border-white/5 p-4 bg-white/[0.02]">
            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-4 px-2 tracking-widest">
              Navigation
            </h3>
            <div className="space-y-1">
              {(Object.keys(contentConfig) as ContentType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setNotice(null);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    activeTab === tab
                      ? "bg-brand-cyan/10 text-brand-cyan border-l-4 border-brand-cyan pl-4"
                      : "text-white/40 hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-4"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {React.createElement(contentConfig[tab].icon, {
                      className: "w-5 h-5",
                    })}
                    <span className="text-sm font-bold">
                      {contentConfig[tab].label}
                      {drafts[tab] !== undefined ? " •" : ""}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-opacity ${activeTab === tab ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card rounded-3xl border border-white/5 p-6 bg-white/[0.02] space-y-4">
            <div className="flex items-center gap-2 text-white/30">
              <History className="w-4 h-4" />
              <h3 className="text-[10px] uppercase tracking-widest font-bold">
                Document Info
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/30 font-medium">State</span>
                <span className="text-white font-bold">
                  {!current.id ? "Not published" : isDirty ? "Unsaved changes" : "Saved"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs gap-2">
                <span className="text-white/30 font-medium">Last Sync</span>
                <span className="text-white font-bold text-right">
                  {current.lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="glass-card rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[600px] bg-white/[0.01]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border border-brand-cyan/20">
                  {React.createElement(contentConfig[activeTab].icon, {
                    className: "w-6 h-6",
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {current.title}
                  </h3>
                  <p className="text-xs text-white/30">
                    {contentConfig[activeTab].desc}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                {current.id && current.isActive ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                    Live on Production
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                    {current.id ? "Hidden" : "Not Published"}
                  </span>
                )}
              </div>
            </div>

            {/* Editor Toolbar (inserts HTML tags around the selection) */}
            <div className="px-6 py-3 border-b border-white/5 flex items-center gap-6 overflow-x-auto no-scrollbar">
              {TOOLS.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  disabled={isPreview}
                  onClick={() => applyTool(tool)}
                  className="text-xs font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest disabled:opacity-30"
                >
                  {tool.label}
                </button>
              ))}
            </div>

            {isPreview ? (
              <div
                className="cms-preview flex-1 w-full p-8 text-white/70 leading-relaxed text-sm font-medium space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_a]:text-brand-cyan [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4"
                // Admin-authored HTML from our own CMS, previewed as the app will render it.
                dangerouslySetInnerHTML={{ __html: current.content || "<p><em>Nothing to preview.</em></p>" }}
              />
            ) : (
              <textarea
                ref={editorRef}
                value={current.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="flex-1 w-full bg-transparent p-8 text-white/70 focus:outline-none resize-none leading-relaxed text-sm font-medium"
                placeholder={`Write the ${contentConfig[activeTab].label.toLowerCase()} here (HTML)...`}
              />
            )}
          </div>

          <div className="flex items-start gap-4 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-500/90 uppercase tracking-widest">
                Legal Notice
              </h4>
              <p className="text-xs text-amber-500/60 leading-relaxed font-medium">
                Edits to these documents are legally binding. Please ensure any
                changes have been reviewed by your compliance team before
                publishing to the live website.
              </p>
            </div>
          </div>
        </div>
      </div>
      <DeleteCMSModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDelete={handleDelete}
        title={current.title}
        isLoading={isDeleting}
      />

    </div>
  );
};

export default CMSManagement;
