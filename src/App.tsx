import React, { useState, useMemo } from 'react';

const formatINR = (amount: number) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

export default function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedFY, setSelectedFY] = useState('2026-2027');

  // Core Data States (Initialized empty for a fresh start)
  const [suppliers, setSuppliers] = useState([
    { id: 'SUP-001', name: 'Royal Silk House', gstin: '08AABCR1234F1Z1', phone: '9829012345', category: 'Fabrics' },
    { id: 'SUP-002', name: 'ABC Fabrics (Surat Unit-2)', gstin: '24AABCA1234F1Z5', phone: '9829054321', category: 'Cotton & Mills' }
  ]);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Bulk Upload Simulation State
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  // Form states for manual entry/payments
  const [payForm, setPayForm] = useState({
    supplierId: 'SUP-001',
    paymentDate: '2026-11-03',
    financialYear: '2026-2027',
    amount: '',
    mode: 'NEFT',
    reference: '',
    remarks: ''
  });

  // Calculate Dashboard Metrics
  const totalSuppliers = suppliers.length;
  const totalBillsCount = invoices.length;
  const totalPurchaseAmount = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0);
  }, [invoices]);

  const totalPaidAmount = useMemo(() => {
    return payments.reduce((sum, pay) => sum + Number(pay.amount || 0), 0);
  }, [payments]);

  const totalOutstanding = totalPurchaseAmount - totalPaidAmount;

  // Handle Simulated Bulk PDF Upload & OCR Parsing
  const handleBulkUploadSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    setTimeout(() => {
      const newScannedBills = Array.from(files).map((file, index) => ({
        id: `INV-SCAN-${Date.now()}-${index}`,
        supplierName: index % 2 === 0 ? 'Royal Silk House' : 'ABC Fabrics (Surat Unit-2)',
        gstin: index % 2 === 0 ? '08AABCR1234F1Z1' : '24AABCA1234F1Z5',
        invoiceNumber: `RSH/26/${Math.floor(100 + Math.random() * 900)}`,
        invoiceDate: '2026-11-01',
        dueDate: '2026-12-01',
        financialYear: selectedFY,
        taxableAmount: 40000,
        cgst: 0,
        sgst: 0,
        igst: 5000,
        finalAmount: 45000,
        ocrConfidence: 98.2,
        fileName: file.name
      }));

      setPendingQueue(prev => [...prev, ...newScannedBills]);
      setIsProcessingUpload(false);
      setNotification(`Successfully scanned ${files.length} PDFs via OCR Engine! Check 'Verify Bills'.`);
      setTimeout(() => setNotification(null), 4000);
    }, 1500);
  };

  // Verify and Post Bill to Main Ledger
  const handleVerifyAndPost = (bill: any) => {
    setPendingQueue(prev => prev.filter(b => b.id !== bill.id));
    setInvoices(prev => [...prev, bill]);
    setNotification(`Invoice ${bill.invoiceNumber} verified & posted to ledger successfully!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newPayment = {
      id: `PAY-${Date.now()}`,
      ...payForm,
      amount: Number(payForm.amount)
    };

    setPayments(prev => [newPayment, ...prev]);
    setPayForm(prev => ({ ...prev, amount: '', reference: '', remarks: '' }));
    setNotification('Payment recorded successfully! Outstanding updated.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold tracking-wide text-amber-400">RAJNI'S CREATION</h1>
            <p className="text-xs text-slate-400 mt-1">Jodhpur - Showroom ERP</p>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { id: 'DASHBOARD', label: '1. Dashboard' },
              { id: 'BULK_UPLOAD', label: '2. Bulk Bill Upload' },
              { id: 'VERIFY_BILLS', label: `3. Verify Bills (${pendingQueue.length})` },
              { id: 'SUPPLIERS', label: '4. All Suppliers' },
              { id: 'LEDGERS', label: '5. Party Ledgers' },
              { id: 'PAYMENTS', label: '6. Record Payment' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Enterprise ERP v3.5 • Secured
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4 w-96">
            <input
              type="text"
              placeholder="Search supplier, bill no..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-slate-400">FY: </span>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="bg-slate-800 text-amber-400 font-semibold px-2 py-1 rounded border border-slate-700 focus:outline-none"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
              </select>
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-600 text-white px-6 py-3 text-sm font-medium flex items-center justify-between shadow-md">
            <span>{notification}</span>
          </div>
        )}

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-slate-100">Dashboard Overview</h2>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Suppliers</p>
                  <p className="text-3xl font-bold text-slate-100 mt-2">{totalSuppliers}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Bills Posted</p>
                  <p className="text-3xl font-bold text-amber-400 mt-2">{totalBillsCount}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Purchases</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">{formatINR(totalPurchaseAmount)}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total Outstanding</p>
                  <p className="text-3xl font-bold text-rose-400 mt-2">{formatINR(totalOutstanding)}</p>
                </div>
              </div>

              {/* Quick Summary Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Ledger Activity</h3>
                {invoices.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No bills posted yet. Upload bills via Bulk Upload.</p>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 5).map(inv => (
                        <tr key={inv.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-medium text-amber-400">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4">{inv.supplierName}</td>
                          <td className="py-3 px-4 text-slate-400">{inv.invoiceDate}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-400">{formatINR(inv.finalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BULK BILL UPLOAD (OCR ENGINE) */}
          {activeTab === 'BULK_UPLOAD' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Bulk Bill PDF Upload (OCR Parser)</h2>
                <p className="text-sm text-slate-400 mt-1">Upload multiple supplier invoice PDFs. AI will automatically extract Party Name, GSTIN, and Item Amounts.</p>
              </div>

              <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-amber-400 transition">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg"
                  onChange={handleBulkUploadSimulation}
                  className="hidden"
                  id="pdf-upload"
                  disabled={isProcessingUpload}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center text-2xl mb-4">
                    📄
                  </div>
                  <span className="text-lg font-semibold text-slate-200">
                    {isProcessingUpload ? 'Scanning & Parsing PDFs...' : 'Click to Upload Multiple Bill PDFs'}
                  </span>
                  <span className="text-xs text-slate-500 mt-2">Supports PDF, PNG, JPG (Multiple files allowed)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: VERIFY BILLS QUEUE */}
          {activeTab === 'VERIFY_BILLS' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Verify Scanned Bills ({pendingQueue.length})</h2>
              {pendingQueue.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                  No bills waiting for verification. Use Bulk Upload to scan new bills.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-800/40">
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">GSTIN</th>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQueue.map(bill => (
                        <tr key={bill.id} className="border-b border-slate-800">
                          <td className="py-3 px-4 font-semibold">{bill.supplierName}</td>
                          <td className="py-3 px-4 text-slate-400">{bill.gstin}</td>
                          <td className="py-3 px-4 text-amber-400">{bill.invoiceNumber}</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">{formatINR(bill.finalAmount)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleVerifyAndPost(bill)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow"
                            >
                              Verify & Post
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL SUPPLIERS */}
          {activeTab === 'SUPPLIERS' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Supplier Directory</h2>
              <div className="grid grid-cols-2 gap-6">
                {suppliers.map(sup => (
                  <div key={sup.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-amber-400">{sup.name}</h3>
                      <span className="bg-slate-800 text-xs px-2.5 py-1 rounded text-slate-300">{sup.category}</span>
                    </div>
                    <p className="text-xs text-slate-400">GSTIN: <span className="text-slate-200 font-mono">{sup.gstin}</span></p>
                    <p className="text-xs text-slate-400">Phone: <span className="text-slate-200">{sup.phone}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PARTY LEDGERS */}
          {activeTab === 'LEDGERS' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Party Wise Ledgers & Outstanding</h2>
              <div className="space-y-6">
                {suppliers.map(sup => {
                  const supInvoices = invoices.filter(inv => inv.supplierName === sup.name);
                  const supTotalPurchases = supInvoices.reduce((sum, i) => sum + i.finalAmount, 0);

                  return (
                    <div key={sup.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">{sup.name}</h3>
                          <p className="text-xs text-slate-400">GSTIN: {sup.gstin}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Total Purchases</p>
                          <p className="text-lg font-bold text-emerald-400">{formatINR(supTotalPurchases)}</p>
                        </div>
                      </div>

                      {supInvoices.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">No posted invoices found for this supplier.</p>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-800">
                              <th className="py-2">Invoice No</th>
                              <th className="py-2">Date</th>
                              <th className="py-2">Taxable</th>
                              <th className="py-2">GST</th>
                              <th className="py-2 text-right">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supInvoices.map(inv => (
                              <tr key={inv.id} className="border-b border-slate-800/50">
                                <td className="py-2 text-amber-400 font-medium">{inv.invoiceNumber}</td>
                                <td className="py-2 text-slate-400">{inv.invoiceDate}</td>
                                <td className="py-2">{formatINR(inv.taxableAmount)}</td>
                                <td className="py-2">{formatINR(inv.igst || (inv.cgst + inv.sgst))}</td>
                                <td className="py-2 text-right font-bold text-slate-200">{formatINR(inv.finalAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: RECORD PAYMENT */}
          {activeTab === 'PAYMENTS' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-slate-100">Record Outgoing Payment</h2>
              <form onSubmit={handleRecordPayment} className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Select Supplier</label>
                  <select
                    value={payForm.supplierId}
                    onChange={(e) => setPayForm({ ...payForm, supplierId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Payment Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={payForm.amount}
                      onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={payForm.mode}
                      onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                    >
                      <option value="NEFT">NEFT / RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Reference / UTR Number</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC520261012..."
                    value={payForm.reference}
                    onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-lg text-sm shadow-lg transition mt-4"
                >
                  Record Payment & Update Outstanding
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}