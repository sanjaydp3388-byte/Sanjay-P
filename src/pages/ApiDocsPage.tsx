import React, { useState } from 'react';
import {
  Code2,
  BookOpen,
  Copy,
  Check,
  Server,
  Database,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.tsx';

export const ApiDocsPage: React.FC = () => {
  const { showToast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'viva'>('endpoints');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const endpoints = [
    {
      method: 'POST',
      path: '/api/auth/login',
      desc: 'Authenticate user & receive JWT session token',
      auth: 'None',
      body: '{\n  "username": "admin",\n  "password": "admin123"\n}',
      response: '{\n  "token": "admin-session-...",\n  "user": { "id": 1, "username": "admin", "role": "admin" }\n}',
    },
    {
      method: 'GET',
      path: '/api/products',
      desc: 'List catalog products with search, pagination & filters',
      auth: 'Optional / Bearer',
      query: '?search=laptop&category_id=1&stock_status=in_stock&page=1&limit=10',
      response: '{\n  "data": [ ... ],\n  "pagination": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }\n}',
    },
    {
      method: 'POST',
      path: '/api/products',
      desc: 'Create new product with SKU uniqueness validation',
      auth: 'Bearer Token (Staff / Admin)',
      body: '{\n  "name": "Wireless Mouse",\n  "sku": "PRD-ACC-091",\n  "category_id": 1,\n  "supplier_id": 2,\n  "unit_price": 29.99,\n  "cost_price": 14.50,\n  "quantity": 50,\n  "min_stock": 10,\n  "max_stock": 200,\n  "unit": "pcs"\n}',
      response: '{\n  "message": "Product created successfully",\n  "product": { "id": 13, ... }\n}',
    },
    {
      method: 'POST',
      path: '/api/inventory/stock-in',
      desc: 'Process incoming purchase & increment current stock',
      auth: 'Bearer Token',
      body: '{\n  "product_id": 1,\n  "supplier_id": 1,\n  "quantity": 25,\n  "unit_cost": 850.00,\n  "reference_no": "PO-2026-1021",\n  "notes": "Direct factory batch shipment"\n}',
      response: '{\n  "message": "Stock inward processed successfully",\n  "updated_stock": 35\n}',
    },
    {
      method: 'POST',
      path: '/api/inventory/stock-out',
      desc: 'Process stock dispatch & decrement inventory (validated against available stock)',
      auth: 'Bearer Token',
      body: '{\n  "product_id": 1,\n  "quantity": 5,\n  "reason": "Customer Sales Order",\n  "reference_no": "SO-2026-4011"\n}',
      response: '{\n  "message": "Stock outward processed successfully",\n  "updated_stock": 30\n}',
    },
    {
      method: 'GET',
      path: '/api/dashboard',
      desc: 'Aggregated analytics metrics, category distributions, monthly charts & low stock',
      auth: 'Bearer Token',
      response: '{\n  "metrics": { "totalProducts": 12, "totalStockUnits": 782, ... },\n  "charts": { ... }\n}',
    },
    {
      method: 'GET',
      path: '/api/reports/inventory',
      desc: 'Get full inventory valuation statement with margins & unit costs',
      auth: 'Bearer Token',
      response: '[ { "sku": "PRD-ELEC-001", "name": "...", "total_cost": 8500, "total_value": 11999 } ]',
    },
  ];

  const vivaQuestions = [
    {
      q: 'How does the architecture maintain data consistency during concurrent stock updates?',
      a: 'The system uses transactional atomic execution. In SQLite/SQL databases, stock changes update the Product quantity and insert a corresponding record into Inventory_Transactions in an atomic step. If insufficient stock is detected during Stock Out, the transaction is rejected before mutation occurs.',
    },
    {
      q: 'What is the role of Database Normalization in this Inventory System?',
      a: 'The database is designed in 3rd Normal Form (3NF). Products, Categories, and Suppliers are normalized into distinct tables with Foreign Key constraints (category_id, supplier_id). This prevents data redundancy (e.g. repeating supplier phone numbers on every product) and eliminates update anomalies.',
    },
    {
      q: 'How does Role-Based Access Control (RBAC) work here?',
      a: 'Users possess a role column ("admin" or "staff"). Destructive operations such as product deletion, category deletion, and supplier removal require Admin privileges verified both on the server (via authentication middleware returning 403 Forbidden) and on the frontend (buttons conditionally disabled or hidden).',
    },
    {
      q: 'How does the system compute Low Stock and Out of Stock alerts?',
      a: 'Each product defines a `min_stock` threshold and `quantity`. When `quantity <= min_stock`, the backend flags the stock_status as "low_stock" or "out_of_stock" (when quantity = 0). These are aggregated automatically for the Executive Dashboard and Stock Alert Center.',
    },
    {
      q: 'What HTTP Status Codes are utilized across the REST API?',
      a: '200 OK (successful query/update), 201 Created (product/supplier created), 400 Bad Request (insufficient stock, invalid input), 401 Unauthorized (unauthenticated user), 403 Forbidden (staff attempting admin-only delete), 404 Not Found (missing resource), 409 Conflict (duplicate SKU).',
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Snippet copied to clipboard!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Code2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              REST API & Viva Voce Guide
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete API specification, Postman payloads, and academic viva evaluation notes
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'endpoints' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'viva' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Viva Q&A Guide
          </button>
        </div>
      </div>

      {activeTab === 'endpoints' ? (
        <div className="space-y-4">
          {/* Base URL info */}
          <div className="p-4 bg-slate-900 rounded-2xl text-slate-300 text-xs font-mono flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Base URL: <strong className="text-white">http://localhost:3000/api</strong></span>
            </div>
            <span className="text-[11px] text-slate-400">Content-Type: application/json</span>
          </div>

          {/* Endpoints List */}
          <div className="space-y-3">
            {endpoints.map((ep, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono tracking-wider ${
                        ep.method === 'GET'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ep.method === 'POST'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ep.method === 'PUT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900">{ep.path}</span>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">{ep.desc}</span>
                </div>

                {ep.body && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Request Payload (JSON)</span>
                      <button
                        onClick={() => handleCopy(ep.body, idx)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 lowercase font-medium transition-colors"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === idx ? 'copied' : 'copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
                      {ep.body}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Viva Q&A Guide */
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-xs text-indigo-950">
            <h3 className="font-bold text-sm text-indigo-900 mb-1">Full-Stack Project Viva Voce Preparation</h3>
            <p className="leading-relaxed">
              These conceptual questions cover system design, relational database integrity, ACID guarantees, security models, and RESTful principles implemented inside this project.
            </p>
          </div>

          <div className="space-y-3">
            {vivaQuestions.map((item, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full flex items-start justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 leading-snug">
                      Q{idx + 1}: {item.q}
                    </span>
                    <span className="text-slate-400 mt-0.5">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
