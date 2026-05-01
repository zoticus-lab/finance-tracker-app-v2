import { Menu, X, BarChart3, Plus, Download, Wallet, Landmark, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ currentPage, onNavigate, onImportExport }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Lihat laporan keuangan',
    },
    {
      id: 'wallets',
      label: 'Wallets',
      icon: Wallet,
      description: 'Kelola dompet',
    },
    {
      id: 'loans',
      label: 'Utang',
      icon: Landmark,
      description: 'Kelola utang',
    },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: Plus,
      description: 'Kelola transaksi',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp,
      description: 'Laporan keuangan',
    },
  ];

  const handleNavigate = (pageId) => {
    onNavigate(pageId);
    setIsOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-emerald-600 to-emerald-700 text-white transition-all duration-300 shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-500">
          {isOpen && <h1 className="text-xl font-bold">Finance</h1>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-emerald-500/30 rounded-lg transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/20 border-l-4 border-white font-semibold'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {isOpen && (
                  <div className="text-left">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="absolute bottom-6 left-3 right-3">
            <button
              onClick={onImportExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Download size={18} />
              <span>Import/Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Will be filled by parent component */}
      </div>
    </div>
  );
}
