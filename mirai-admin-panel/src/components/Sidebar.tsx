import React from "react";
import { NavLink } from "react-router-dom";
// import { useAppDispatch } from "../hooks/reduxHooks";
// import { useNavigate } from "react-router-dom";
// import { logout } from "../app/features/auth/authSlice";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  Layout,
  Settings,
  CircleHelp,
  ChevronRight,
  MessageSquare,
  Image,
  LifeBuoy,
  ReceiptText,
  Inbox,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Users, label: "User Management", path: "/users" },
    { icon: CreditCard, label: "Subscription Plans", path: "/plans" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Layout, label: "CMS Management", path: "/policies" },
    { icon: Settings, label: "Settings", path: "/settings" },
    {
      icon: CircleHelp,
      label: "FAQ Management",
      path: "/faq",
    },
    {
    icon: MessageSquare,
    label: "Feedback Management",
    path: "/feedback",
  },

  {
    icon: LifeBuoy,
    label: "Support Management",
    path: "/support",
  },

  {
    icon: Inbox,
    label: "Leads",
    path: "/leads",
  },

  {
  icon: Image,
  label: "Banner Management",
  path: "/banners",
},
  {
  icon: ReceiptText,
  label: "Orders Management",
  path: "/orders",
}
  ];

  // const dispatch = useAppDispatch();

  // const navigate = useNavigate();

  // const handleLogout = () => {
  //   dispatch(logout());

  //   navigate("/login");
  // };

  return (
    <div className="w-72 h-screen border-r border-white/5 bg-white/5 backdrop-blur-2xl flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-12 px-2">
        <img
          src="/logo-mark-light.png"
          alt="MIRAI Logo"
          className="w-11 h-11 object-contain"
        />
        <div>
          <h2 className="text-xl font-bold text-white tracking-[0.15em]">
            MIRAI
          </h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Management
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between p-3 rounded-2xl transition-all duration-300 group
              ${
                isActive
                  ? "bg-brand-cyan/10 text-brand-cyan border-l-4 border-brand-cyan pl-4"
                  : "text-white/50 hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-4"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </div>

    </div>
  );
};

export default Sidebar;
