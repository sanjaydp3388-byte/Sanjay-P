import React, { useState, useEffect } from 'react';
import { Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Boxes,
} from 'lucide-react';

interface ReportsPageProps {
  categories: Category[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ categories }) => {
  const { showToast } = useToast();

  const [activeReport, setActiveReport] = useState<'inventory' | 'movements' | 'low-stock' | 'suppliers'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      if (activeReport === 'inventory') {
        const data = await api.reports.getInventoryReport(selectedCategory);
        setReportData(data);
      } else if (activeReport === 'movements') {
        const data = await api.reports.getStockMovementReport({});
        setReportData(data);
      } else if (activeReport === 'low-stock') {
        const data = await api.reports.getLowStockReport();
        setReportData(data);
      } else if (activeReport === 'suppliers') {
        const data = await api.reports.getSupplierReport();
        setReportData(data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to generate report.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, selectedCategory]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) {
      showToast('No data available to export.', 'warning');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of reportData) {
      const values = headers.map((header) => {
        const val = row[header];
        const escaped = String(val ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${activeReport}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Successfully exported ${activeReport} report to CSV.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations for summary banner
  const totalValuation = activeReport === 'inventory'
    ? reportData.reduce((acc, row) => acc + (row.total_value || 0), 0)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reports & Business Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready valuation statements, stock logs, and vendor procurement reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            id="reports-print-btn"
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            id="reports-export-csv-btn"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'inventory', title: 'Inventory Valuation', desc: 'Stock quantities and assets', icon: DollarSign },
          { id: 'movements', title: 'Stock Movement Log', desc: 'Inward & outward movements', icon: TrendingUp },
          { id: 'low-stock', title: 'Replenishment Needs', desc: 'Depleted & buffer deficits', icon: Boxes },
          { id: 'suppliers', title: 'Supplier Directory', desc: 'Active vendor relationships', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <h4 className="mt-3 text-sm font-bold leading-tight">{tab.title}</h4>
              <p className={`text-[11px] mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Ribbon (Category filter for inventory report) */}
      {activeReport === 'inventory' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Category Filter:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Inventory Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <span className="text-slate-500">Report Valuation Sum:</span>{' '}
            <strong className="text-sm font-extrabold text-emerald-600">
              ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Generating report data from database...</div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No records available for this report.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3.5 px-4 capitalize whitespace-nowrap">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {Object.entries(row).map(([key, val], cellIdx) => {
                      const isMoney = key.includes('price') || key.includes('value') || key.includes('cost');
                      const isDate = key.includes('date') || key.includes('created_at');

                      let displayVal = String(val ?? '—');
                      if (isMoney && typeof val === 'number') {
                        displayVal = `$${val.toFixed(2)}`;
                      } else if (isDate && val) {
                        displayVal = new Date(val as string).toLocaleDateString();
                      }

                      return (
                        <td
                          key={cellIdx}
                          className={`py-3 px-4 ${isMoney ? 'font-mono font-bold text-slate-900' : 'text-slate-700'}`}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
