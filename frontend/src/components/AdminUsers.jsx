import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { deleteAdminUser, getAdminUsers } from "../services/gameApi.js";
import { t } from "../translations/index.js";
import AdminUsersSkeleton from "./skeletons/AdminUsersSkeleton.jsx";

const AdminUsers = ({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminUsers();
      setUsers(result.users);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!deleteTarget) return undefined;
    const closeWithEscape = (event) => {
      if (event.key === "Escape" && !deleting) setDeleteTarget(null);
    };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [deleteTarget, deleting]);

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminUser(deleteTarget.id);
      setUsers((current) => current.filter(({ id }) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <AdminUsersSkeleton />;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.24em] text-[#d8aa64]">{t("adminUsers.eyebrow")}</p>
      <h1 className="mt-2 font-serif text-3xl text-[#f5e8ce] sm:text-4xl">{t("adminUsers.title")}</h1>
      <p className="mt-3 text-[#a99a83]">{t("adminUsers.description")}</p>
      {error && <p className="mt-5 border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="mt-7 overflow-x-auto border border-[#6f5940]/55">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="bg-[#120e0d] text-xs uppercase tracking-[.14em] text-[#9f8968]">
            <tr>
              <th className="px-4 py-3">{t("adminUsers.name")}</th>
              <th className="px-4 py-3">{t("adminUsers.email")}</th>
              <th className="px-4 py-3">{t("adminUsers.role")}</th>
              <th className="px-4 py-3">{t("adminUsers.created")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[#6f5940]/40 bg-[#171210]/75">
                <td className="px-4 py-3 font-semibold text-[#f2dfbd]">{user.displayName}</td>
                <td className="px-4 py-3 text-[#c9ba9e]">{user.email}</td>
                <td className="px-4 py-3 text-[#d8aa64]">{t(`adminUsers.roles.${user.role}`)}</td>
                <td className="px-4 py-3 text-[#a99a83]">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={user.id === currentUserId || deleting}
                    aria-label={t("adminUsers.delete")}
                    onClick={() => {
                      setDeleteTarget(user);
                      setDeleteError("");
                    }}
                    className="border border-red-300/30 p-2 text-red-200 hover:border-red-300/70 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border border-red-300/30 bg-[#211916] p-5 shadow-2xl shadow-black sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
            <button
              type="button"
              disabled={deleting}
              aria-label={t("ui.close")}
              onClick={() => setDeleteTarget(null)}
              className="absolute right-4 top-4 text-[#958772] transition hover:text-[#f5e8ce] disabled:opacity-40"
            >
              <X size={21} />
            </button>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-300/30 bg-red-950/40 text-red-200">
              <AlertTriangle size={24} />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.2em] text-red-300/80">
              {t("deleteModal.dangerZone")}
            </p>
            <h2 id="delete-user-title" className="mt-2 font-serif text-3xl text-[#f5e8ce]">
              {t("adminUsers.modalTitle")}
            </h2>
            <p className="mt-2 text-lg text-[#e6d3b2]">{deleteTarget.displayName}</p>
            <p className="text-sm text-[#a99a83]">{deleteTarget.email}</p>
            <p className="mt-4 leading-relaxed text-[#bcae95]">
              {t("adminUsers.deleteConfirm").replace("{name}", deleteTarget.displayName)}
            </p>
            {deleteError && (
              <p className="mt-4 border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                {deleteError}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="border border-[#806644] px-5 py-2.5 font-bold text-[#e4d2ae] transition hover:border-[#d7b77b] disabled:opacity-40"
              >
                {t("deleteModal.cancel")}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void remove()}
                className="bg-red-800 px-5 py-2.5 font-bold text-red-50 transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {deleting ? t("deleteModal.deleting") : t("adminUsers.confirm")}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
