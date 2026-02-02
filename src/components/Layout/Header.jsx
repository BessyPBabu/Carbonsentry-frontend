export default function Header({ role, organizationName, onLogout }) {
  return (
    <header className="bg-white border-b px-8 py-4 flex justify-end">
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-medium">{organizationName}</p>
          <p className="text-xs capitalize text-gray-500">{role}</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
