import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profiles = [] } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .order("created_at", { ascending: false });

  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  const users = usersData?.users ?? [];
  const profileMap = new Map((profiles as Profile[]).map((p) => [p.id, p]));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Admin · Users Monitor</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track all user accounts, verification status, and role assignments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-800 bg-[#0f1117] p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Total Users</p>
          <p className="text-3xl mt-2 font-bold text-white">{users.length}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f1117] p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Admins</p>
          <p className="text-3xl mt-2 font-bold text-indigo-300">
            {(profiles as Profile[]).filter((p) => p.role === "admin").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0f1117] p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500">Email Confirmed</p>
          <p className="text-3xl mt-2 font-bold text-emerald-300">
            {users.filter((u) => !!u.email_confirmed_at).length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-[#0f1117] overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800/60">
          <h2 className="text-sm font-semibold text-white">Users</h2>
          {usersError && (
            <p className="text-xs text-red-400 mt-1">
              Failed to fetch auth users: {usersError.message}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800/60">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sign In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {users.map((u) => {
                const profile = profileMap.get(u.id);
                const role = profile?.role ?? "user";
                const created = u.created_at ? new Date(u.created_at).toLocaleString() : "-";
                const signedIn = u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "-";
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 text-gray-200">{u.email ?? "-"}</td>
                    <td className="py-3 px-4">
                      <span className={role === "admin"
                        ? "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30"
                        : "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-700/40 text-gray-300 ring-1 ring-gray-700/60"
                      }>
                        {role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={u.email_confirmed_at
                        ? "text-emerald-300 text-xs"
                        : "text-amber-300 text-xs"
                      }>
                        {u.email_confirmed_at ? "confirmed" : "pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{created}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{signedIn}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
