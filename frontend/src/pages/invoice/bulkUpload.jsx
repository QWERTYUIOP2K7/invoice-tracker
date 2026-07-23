import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { FiUpload, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

export default function BulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const downloadTemplate = () => {
    const template = [
      {
        clientCode: 'CL001',
        invoicePrefix: 'INV',
        invoiceMonth: 'January 2024',
        billingMonth: 'January 2024',
        amount: '5000',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-15',
        poNumber: 'PO123',
        paymentTerms: 'Net 30',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'invoice_template.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const invoices = XLSX.utils.sheet_to_json(worksheet);

          if (invoices.length === 0) {
            setError('No data found in file');
            setLoading(false);
            return;
          }

          // Send invoices to backend
          const formData = new FormData();
          formData.append('invoices', JSON.stringify(invoices));

          const res = await invoiceAPI.bulkUploadInvoices(formData);

          setResults({
            total: res.data.total,
            success: res.data.success,
            failed: res.data.failed,
            errors: res.data.errors || [],
          });

          setFile(null);
        } catch (err) {
          setError(err.message || 'Failed to process file');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setError('Failed to upload invoices');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Invoice Upload</h1>
          <p className="text-gray-600 mb-8">Upload multiple invoices at once using an Excel file</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 mb-6 rounded">
              {error}
            </div>
          )}

          {results ? (
            <div className="bg-white border border-gray-200 p-8 rounded space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Complete</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-3xl font-bold text-blue-600">{results.total}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Success</p>
                    <p className="text-3xl font-bold text-green-600">{results.success}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Failed</p>
                    <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-left mb-6">
                    <h3 className="font-semibold text-yellow-900 mb-2">Errors:</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {results.errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-yellow-700">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResults(null);
                    setFile(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium rounded"
                >
                  Upload More
                </button>
                <button
                  onClick={() => navigate('/finance/invoices')}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded"
                >
                  View Invoices
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 p-8 rounded space-y-6">
              {/* Download Template */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Download Template</h2>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 font-medium rounded"
                >
                  <FiDownload size={18} /> Download Template
                </button>
                <p className="text-sm text-gray-600 mt-2">Download the Excel template to see the required format</p>
              </div>

              {/* File Upload */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Select File</h2>
                <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded">
                  <FiUpload className="mx-auto text-gray-400 mb-3" size={32} />
                  <label className="block">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer inline-block rounded font-medium">
                      Choose File
                    </span>
                  </label>
                  {file && (
                    <p className="text-sm text-gray-600 mt-3">
                      Selected: <span className="font-medium">{file.name}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Supported formats: XLSX, XLS, CSV</p>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded"
              >
                {loading ? 'Uploading...' : 'Upload Invoices'}
              </button>

              {/* Template Columns Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Required Columns:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• clientCode</div>
                  <div>• invoicePrefix</div>
                  <div>• invoiceMonth</div>
                  <div>• billingMonth</div>
                  <div>• amount</div>
                  <div>• invoiceDate (YYYY-MM-DD)</div>
                  <div>• dueDate (YYYY-MM-DD)</div>
                  <div>• poNumber (optional)</div>
                  <div>• paymentTerms (optional)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}