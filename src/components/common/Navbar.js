import { Bell, Menu } from "lucide-react";

function Navbar({ user, onMenuClick }) {
  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-600 hover:text-extra-blue"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1 className="text-sm text-gray-500">Welcome back</h1>
          <p className="text-sm font-semibold">{user.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <button className="text-gray-500 hover:text-extra-blue transition-all">
          <Bell size={20} />
        </button>

        <div className="h-9 w-9 rounded-full bg-medium-blue text-white flex items-center justify-center text-sm font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
