import React from 'react';
import { FileText, TrendingUp, DollarSign, Package } from 'lucide-react';

interface KpiMetricsProps {
  totalRx: number;
  projected30DayUnits: number;
  projected30DayCost: number;
  drugCount: number;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  totalRx,
  projected30DayUnits,
  projected30DayCost,
  drugCount,
}) => {
  return (
    <section className="bg-white border-b border-slate-200 py-3.5 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rx Recorded */}
        <div className="flex items-center space-x-3.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100 sm:border-0 sm:bg-transparent">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Rx Recorded
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {totalRx}
            </h4>
          </div>
        </div>

        {/* Projected 30-Day Demand */}
        <div className="flex items-center space-x-3.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100 sm:border-0 sm:bg-transparent">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Projected 30-Day Demand
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-amber-600 leading-tight">
              {projected30DayUnits > 0 ? `~${projected30DayUnits.toLocaleString()} units` : '-- units'}
            </h4>
          </div>
        </div>

        {/* Projected 30-Day Budget */}
        <div className="flex items-center space-x-3.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100 sm:border-0 sm:bg-transparent">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Projected 30-Day Budget
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-emerald-700 leading-tight">
              ₱{projected30DayCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        {/* Active Formulary Items */}
        <div className="flex items-center space-x-3.5 p-2 bg-slate-50/70 rounded-xl border border-slate-100 sm:border-0 sm:bg-transparent">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Formulary Items
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-purple-700 leading-tight">
              {drugCount}
            </h4>
          </div>
        </div>
      </div>
    </section>
  );
};
