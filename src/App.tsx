import React, { useState, useMemo } from 'react';

const formatINR = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

const INITIAL_SUPPLIERS = [];
const INITIAL_VERIFIED_INVOICES = [];
const INITIAL_PENDING_QUEUE = [];
const INITIAL_PAYMENTS = [];
  
export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedFY, setSelectedFY] = useState('2026-2027');

  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [invoices, setInvoices] = useState(INITIAL_VERIFIED_INVOICES);
  const [pendingQueue, setPendingQueue] = useState(INITIAL_PENDING_QUEUE);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  const [selectedSupplierId, setSelectedSupplierId] = useState('SUP-001');
  const [notification, setNotification] = useState(null);

  const [payForm, setPayForm] = useState({
    supplierId: 'SUP-001',
    paymentDate: '2026-11-03',
    amount: '',
    mode: 'NEFT',
    reference: '',
    remarks: '',
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const supplierLedgerSummaries = useMemo(() => {
    return suppliers.map((sup) => {
      const supInvoices = invoices.filter(
        (inv) => inv.supplierId === sup.id && inv.status === 'VERIFIED'
      );
      const supPayments = payments.filter((p) => p.supplierId === sup.id);

      const totalBills = supInvoices.length;
      const totalPurchases = supInvoices.reduce(
        (acc, i) => acc + Number(i.finalAmount),
        0
      );
      const totalPaid = supPayments.reduce(
        (acc, p) => acc + Number(p.amount),
        0
      );

      const outstanding =
        Number(sup.openingBalance) +
        totalPurchases +
        Number(sup.debitNotes) -
        totalPaid -
        Number(sup.creditNotes);

      return {
        ...sup,
        totalBills,
        totalPurchases,
        totalPaid,
        outstanding,
        invoices: supInvoices,
        payments: supPayments,
      };
    });
  }, [suppliers, invoices, payments]);

  const dashboardStats = useMemo(() => {
    const totalSuppliers = supplierLedgerSummaries.length;
    const totalBills = invoices.length;
    const totalPurchases = supplierLedgerSummaries.reduce(
      (s, x) => s + x.totalPurchases,
      0
    );
    const totalPaid = supplierLedgerSummaries.reduce(
      (s, x) => s + x.totalPaid,
      0
    );
    const totalOutstanding = supplierLedgerSummaries.reduce(
      (s, x) => s + x.outstanding,
      0
    );

    return {
      totalSuppliers,
      totalBills,
      totalPurchases,
      totalPaid,
      totalOutstanding,
    };
  }, [supplierLedgerSummaries, invoices]);

  const handleVerifyInvoice = (stagedInv) => {
    let targetSupplier = suppliers.find((s) => s.gstin === stagedInv.gstin);
    if (!targetSupplier) {
      targetSupplier = {
        id: `SUP-00${suppliers.length + 1}`,
        supplierName: stagedInv.supplierName,
        gstin: stagedInv.gstin,
        address: 'Jodhpur',
        state: 'Rajasthan',
        stateCode: '08',
        phone: '9829000000',
        openingBalance: 0,
        creditNotes: 0,
        debitNotes: 0,
      };
      setSuppliers([...suppliers, targetSupplier]);
    }

    const newInv = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.supplierName,
      gstin: targetSupplier.gstin,
      invoiceNumber: stagedInv.invoiceNumber,
      invoiceDate: stagedInv.invoiceDate,
      dueDate: stagedInv.dueDate,
      financialYear: stagedInv.financialYear,
      finalAmount: stagedInv.finalAmount,
      amountPaid: 0,
      status: 'VERIFIED',
    };

    setInvoices([newInv, ...invoices]);
    setPendingQueue(pendingQueue.filter((i) => i.id !== stagedInv.id));
    showToast(`Verified & Posted Bill ${stagedInv.invoiceNumber}!`);
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    const payAmt = Number(payForm.amount);
    if (!payAmt || payAmt <= 0) {
      showToast('Enter valid amount', 'error');
      return;
    }

    const newPay = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      supplierId: payForm.supplierId,
      paymentDate: payForm.paymentDate,
      financialYear: selectedFY,
      amount: payAmt,
      mode: payForm.mode,
      reference: payForm.reference || 'CASH',
      remarks: payForm.remarks,
    };

    setPayments([newPay, ...payments]);
    setPayForm({ ...payForm, amount: '', reference: '', remarks: '' });
    showToast(`Payment of ${formatINR(payAmt)} recorded successfully!`);
  };

  const navItems = [
    { id: 'DASHBOARD', label: '📊 1. Dashboard' },
    { id: 'BULK_UPLOAD', label: '📤 2. Bulk Bill Upload' },
    {
      id: 'VERIFY_BILLS',
      label: '✅ 3. Verify Bills',
      badge: pendingQueue.length,
    },
    { id: 'SUPPLIERS', label: '👥 4. All Suppliers' },
    { id: 'PARTY_LEDGERS', label: '📒 5. Party Ledgers' },
    { id: 'RECORD_PAYMENT', label: '💳 6. Record Payment' },
  ];

  const activeSupplierLedger =
    supplierLedgerSummaries.find((s) => s.id === selectedSupplierId) ||
    supplierLedgerSummaries[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-64 bg-[#0F172A] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <h1 className="font-bold text-lg text-[#D4AF37]">RAJNI'S CREATION</h1>
          <p className="text-xs text-slate-400">Jodhpur • Showroom ERP</p>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-[#D4AF37] text-[#0F172A] font-bold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-600 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search supplier, bill no..."
            className="px-3 py-1.5 border rounded text-sm w-80 bg-slate-50"
          />
          <div className="text-sm font-semibold text-slate-700">
            FY: {selectedFY}
          </div>
        </header>

        {notification && (
          <div
            className={`mx-6 mt-4 p-3 rounded border text-sm ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            {notification.msg}
          </div>
        )}

        <div className="p-6 space-y-6 overflow-y-auto">
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0F172A]">
                Dashboard Overview
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="text-xs text-slate-400">Total Suppliers</div>
                  <div className="text-2xl font-bold">
                    {dashboardStats.totalSuppliers}
                  </div>
                </div>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="text-xs text-slate-400">Total Bills</div>
                  <div className="text-2xl font-bold">
                    {dashboardStats.totalBills}
                  </div>
                </div>
                <div className="bg-white p-4 rounded border shadow-sm">
                  <div className="text-xs text-slate-400">Total Purchases</div>
                  <div className="text-xl font-bold">
                    {formatINR(dashboardStats.totalPurchases)}
                  </div>
                </div>
                <div className="bg-[#0F172A] text-white p-4 rounded border shadow-sm">
                  <div className="text-xs text-[#D4AF37]">
                    Total Outstanding
                  </div>
                  <div className="text-xl font-bold">
                    {formatINR(dashboardStats.totalOutstanding)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BULK_UPLOAD' && (
            <div className="bg-white p-8 rounded border text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-[#0F172A]">
                Bulk Bill Upload (OCR Simulation)
              </h2>
              <p className="text-sm text-slate-600">
                Simulate bulk upload of purchase bills instantly.
              </p>
              <button
                onClick={() => {
                  setPendingQueue([
                    ...pendingQueue,
                    {
                      id: `STG-${Date.now()}`,
                      supplierName: 'Royal Silk House',
                      gstin: '08AABCR1234F1Z1',
                      invoiceNumber: `RSH/26/${Math.floor(
                        100 + Math.random() * 900
                      )}`,
                      invoiceDate: '2026-11-03',
                      dueDate: '2026-12-03',
                      financialYear: '2026-2027',
                      finalAmount: 45000,
                      isDuplicate: false,
                    },
                  ]);
                  setActiveTab('VERIFY_BILLS');
                  showToast('1 Bill uploaded & extracted via OCR!');
                }}
                className="px-5 py-2.5 bg-[#0F172A] text-[#D4AF37] font-bold rounded text-sm"
              >
                Simulate Uploading New Bills
              </button>
            </div>
          )}

          {activeTab === 'VERIFY_BILLS' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                Verify Imported Bills ({pendingQueue.length})
              </h2>
              <div className="bg-white rounded border overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">GSTIN</th>
                      <th className="p-3">Invoice No</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingQueue.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-bold">{item.supplierName}</td>
                        <td className="p-3 font-mono text-xs">{item.gstin}</td>
                        <td className="p-3 font-mono text-xs">
                          {item.invoiceNumber}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatINR(item.finalAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleVerifyInvoice(item)}
                            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-bold"
                          >
                            Verify & Post
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingQueue.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-6 text-center text-slate-400"
                        >
                          No pending bills to verify. Upload from Bulk Bill
                          Upload.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SUPPLIERS' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">All Suppliers</h2>
              <div className="bg-white rounded border overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3">GSTIN</th>
                      <th className="p-3 text-center">Total Bills</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplierLedgerSummaries.map((sup) => (
                      <tr key={sup.id}>
                        <td className="p-3 font-bold">{sup.supplierName}</td>
                        <td className="p-3 font-mono text-xs">{sup.gstin}</td>
                        <td className="p-3 text-center">{sup.totalBills}</td>
                        <td className="p-3 text-right font-extrabold text-red-700">
                          {formatINR(sup.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'PARTY_LEDGERS' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {supplierLedgerSummaries.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`px-3 py-1.5 rounded text-xs font-bold ${
                      selectedSupplierId === s.id
                        ? 'bg-[#0F172A] text-[#D4AF37]'
                        : 'bg-white border'
                    }`}
                  >
                    {s.supplierName}
                  </button>
                ))}
              </div>
              {activeSupplierLedger && (
                <div className="bg-white p-5 rounded border space-y-4">
                  <h3 className="font-bold text-lg">
                    {activeSupplierLedger.supplierName} Ledger
                  </h3>
                  <div className="text-sm font-semibold text-red-700">
                    Outstanding Balance:{' '}
                    {formatINR(activeSupplierLedger.outstanding)}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'RECORD_PAYMENT' && (
            <div className="max-w-xl mx-auto bg-white p-6 rounded border space-y-4">
              <h2 className="text-xl font-bold">Record Supplier Payment</h2>
              <form onSubmit={handleRecordPayment} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Select Supplier
                  </label>
                  <select
                    value={payForm.supplierId}
                    onChange={(e) =>
                      setPayForm({ ...payForm, supplierId: e.target.value })
                    }
                    className="w-full p-2 border rounded text-sm font-semibold"
                  >
                    {supplierLedgerSummaries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplierName} (Due: {formatINR(s.outstanding)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) =>
                      setPayForm({ ...payForm, amount: e.target.value })
                    }
                    className="w-full p-2 border rounded text-sm font-bold"
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0F172A] text-[#D4AF37] font-bold rounded text-sm"
                >
                  Save Payment & Update Balance
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
