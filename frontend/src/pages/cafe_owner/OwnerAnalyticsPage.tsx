import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { TrendingUp, DollarSign, Award, ShoppingBag, ArrowUpRight } from 'lucide-react';

export const OwnerAnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <Badge variant="gold">Business Intelligence</Badge>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mt-1">
          Enterprise Analytics & Growth Metrics
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Visual insights into revenue trends, top-performing branches, and best-selling menu items.
        </p>
      </div>

      {/* Analytics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Weekly Revenue</span>
            <div className="p-2 bg-amber-500 text-stone-950 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-stone-900 mt-3">$18,450.00</h3>
          <p className="text-xs text-emerald-700 font-bold flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4" /> +12.5% increase vs last week
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">Top Selling Product</span>
            <div className="p-2 bg-rose-400 text-white rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl font-black text-stone-900 mt-3">Caramel Macchiato</h3>
          <p className="text-xs text-rose-800 font-medium mt-2">342 units sold ($1,539.00 total)</p>
        </Card>

        <Card className="bg-gradient-to-br from-sky-50 to-sky-100/50 border-sky-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider">Average Order Value</span>
            <div className="p-2 bg-sky-500 text-white rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-stone-900 mt-3">$24.15</h3>
          <p className="text-xs text-sky-800 font-medium mt-2">Avg 2.8 items per customer cart</p>
        </Card>
      </div>

      {/* Visual Progress Charts & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Revenue Performance Bar Visual */}
        <Card title="Branch Revenue Comparison" subtitle="Gross revenue distribution across physical locations">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-stone-800">Downtown Branch</span>
                <span className="text-amber-800">$11,240.00 (61%)</span>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '61%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-stone-800">Airport Terminal Branch</span>
                <span className="text-amber-800 font-bold">$5,120.00 (28%)</span>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-stone-800">Mall Kiosk Branch</span>
                <span className="text-amber-800 font-bold">$2,090.00 (11%)</span>
              </div>
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-300 rounded-full" style={{ width: '11%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card title="Category Revenue Distribution" subtitle="Sales contribution by menu category">
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-stone-800">Hot Specialty Coffee</span>
              </div>
              <span className="text-xs font-extrabold text-stone-900">$9,850.00 (53%)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-xs font-bold text-stone-800">Cold Brew & Iced Teas</span>
              </div>
              <span className="text-xs font-extrabold text-stone-900">$5,420.00 (29%)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-stone-800">Fresh Bakery & Pastries</span>
              </div>
              <span className="text-xs font-extrabold text-stone-900">$3,180.00 (18%)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
