import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import serverObj from "../config/config";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Users as UsersIcon,
  Shield,
  Trash2,
  Search,
  LayoutDashboard,
  Menu,
  LogOut,
  User as UserIcon,
  RefreshCw,
  MessageSquareText,
} from "lucide-react";
import { useNavigate, NavLink } from "react-router-dom";
import { removeUser } from "../store/slices/authSlice";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    messageStats: [],
    userStats: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("dashboard");
  const currentUser = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchData = () => {
    axios
      .get(`${serverObj.apikey}/admin/users`, { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch(() => toast.error("Failed to fetch users"));

    axios
      .get(`${serverObj.apikey}/admin/stats`, { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));
  };

  const updateRole = (id, role) => {
    axios
      .patch(
        `${serverObj.apikey}/admin/users/${id}/role`,
        { role },
        { withCredentials: true },
      )
      .then(() => {
        toast.success("Role updated");
        fetchData();
      })
      .catch(() => toast.error("Update failed"));
  };

  const deleteUser = (id) => {
    if (!window.confirm("Are you sure?")) return;
    axios
      .delete(`${serverObj.apikey}/admin/users/${id}`, {
        withCredentials: true,
      })
      .then(() => {
        toast.success("User deleted");
        fetchData();
      })
      .catch(() => toast.error("Deletion failed"));
  };

  const handleLogout = () => {
    axios
      .get(`${serverObj.apikey}/user/signout`, { withCredentials: true })
      .then(() => {
        dispatch(removeUser());
        navigate("/auth");
      });
  };

  useEffect(() => {
    if (currentUser?.role === "admin") fetchData();
  }, [currentUser]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  const areaChartData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month, idx) => {
      const monthData = stats.userStats.find((s) => s._id === idx + 1);
      return { name: month, count: monthData ? monthData.count : 0 };
    });
  }, [stats.userStats]);

  const rolePieData = useMemo(() => {
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userCount = users.length - adminCount;
    return [
      { name: "Admins", value: adminCount, color: "#4F46E5" },
      { name: "Users", value: userCount, color: "#10B981" },
    ];
  }, [users]);

  const barChartData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentMonth = new Date().getMonth();
    return months.slice(0, currentMonth + 1).map((month, idx) => {
      const monthData = stats.messageStats.find((s) => s._id === idx + 1);
      return { name: month, messages: monthData ? monthData.count : 0 };
    });
  }, [stats.messageStats]);

  if (currentUser?.role !== "admin") return null;

  return (
    <div className="flex h-screen bg-[#F3F4F6] text-slate-700 font-sans overflow-hidden dark:bg-zinc-950 dark:text-zinc-300">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1F2937] flex-shrink-0 flex flex-col dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800">
        <div className="p-5 flex items-center gap-2 border-b border-white/5">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-white text-lg font-semibold">VeloxAdmin</span>
        </div>

        <nav className="flex-1 px-3 mt-4">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveView("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm ${activeView === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView("users")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm ${activeView === "users" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              >
                <UsersIcon size={18} />
                <span>Users</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-rose-400 text-sm transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Menu size={18} className="text-slate-400 cursor-pointer" />
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-zinc-800 border-none rounded-md outline-none text-xs w-64 dark:text-slate-200"
              />
            </div>
          </div>
          <NavLink
            to="/profile"
            className="flex items-center gap-3 group px-2 py-1 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                {currentUser?.username}
              </p>
              <p className="text-[10px] text-indigo-500 uppercase font-medium">
                {currentUser?.role}
              </p>
            </div>
            <img
              src={currentUser?.profilePic}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700 object-cover"
              alt=""
            />
          </NavLink>
        </header>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {activeView === "dashboard" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
                  Admin Overview
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time statistics for the platform
                </p>
              </div>

              {/* Minimal Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-md">
                    <MessageSquareText size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Total Messages
                    </p>
                    <h3 className="text-xl font-bold dark:text-white">
                      {stats.totalMessages}
                    </h3>
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Total Users
                    </p>
                    <h3 className="text-xl font-bold dark:text-white">
                      {stats.totalUsers}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-6">
                    User Growth
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={areaChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: "11px",
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366F1"
                          strokeWidth={2}
                          fill="#6366F120"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-6">
                    Role Distribution
                  </h3>
                  <div className="h-[250px] w-full flex flex-col md:flex-row items-center gap-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rolePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {rolePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 w-full md:w-40 text-xs">
                      {rolePieData.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <p className="font-medium text-slate-600 dark:text-slate-400">
                            {item.name}: {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200 mb-6">
                    Real Message Activity
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f0f0f0"
                        />
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            fontSize: "11px",
                            borderRadius: "8px",
                            border: "none",
                          }}
                        />
                        <Bar
                          dataKey="messages"
                          fill="#6366F1"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
                    User Directory
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage platform access and roles
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold uppercase px-4 py-2 rounded transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                      {filteredUsers.map((u) => (
                        <tr
                          key={u._id}
                          className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.profilePic}
                                className="w-8 h-8 rounded-full border border-slate-100 dark:border-zinc-700 object-cover"
                                alt=""
                              />
                              <span className="font-semibold text-slate-700 dark:text-zinc-200">
                                {u.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                updateRole(u._id, e.target.value)
                              }
                              className="bg-transparent border border-slate-200 dark:border-zinc-700 px-2 py-1 rounded text-[10px] font-medium transition-colors focus:border-indigo-600 outline-none"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={u._id === currentUser?._id}
                              onClick={() => deleteUser(u._id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-20 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
