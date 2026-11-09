import { t } from "../../translations/index.js";

const AdminUsersSkeleton = () => (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{t("adminUsers.loading")}</span>

    <div className="animate-pulse" aria-hidden="true">
      <div className="h-3 w-32 rounded-sm bg-[#d8aa64]/20" />
      <div className="mt-3 h-10 w-72 max-w-[80%] rounded-sm bg-[#f5e8ce]/15" />
      <div className="mt-4 h-4 w-full max-w-xl rounded-sm bg-[#a99a83]/15" />

      <div className="mt-7 overflow-x-auto border border-[#6f5940]/55">
        <div className="grid grid-cols-[1.1fr_1.5fr_.7fr_.8fr_2.5rem] gap-4 bg-[#120e0d] px-4 py-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-3 rounded-sm bg-[#9f8968]/20" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, row) => (
          <div
            key={row}
            className="grid grid-cols-[1.1fr_1.5fr_.7fr_.8fr_2.5rem] gap-4 border-t border-[#6f5940]/40 bg-[#171210]/75 px-4 py-3.5"
          >
            {Array.from({ length: 5 }, (_, column) => (
              <div
                key={column}
                className={`h-4 rounded-sm bg-[#c9ba9e]/15 ${column === 4 ? "w-6 justify-self-end" : "w-full"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminUsersSkeleton;
