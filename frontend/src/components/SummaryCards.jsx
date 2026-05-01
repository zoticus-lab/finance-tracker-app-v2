import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function SummaryCard({ icon: Icon, label, value, tone, accent }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/70 p-6 shadow-glass backdrop-blur-md">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${accent} blur-2xl`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{currencyFormatter.format(value)}</h3>
        </div>
        <div className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-black/5">
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary }) {
  const balanceTone = summary.balance >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard
        icon={Wallet}
        label="Saldo"
        value={summary.balance || 0}
        tone={balanceTone}
        accent="bg-emerald-300/40"
      />
      <SummaryCard
        icon={ArrowUpRight}
        label="Pemasukan"
        value={summary.income || 0}
        tone="text-emerald-600"
        accent="bg-emerald-200/50"
      />
      <SummaryCard
        icon={ArrowDownRight}
        label="Pengeluaran"
        value={summary.expense || 0}
        tone="text-rose-600"
        accent="bg-rose-200/50"
      />
    </div>
  );
}
