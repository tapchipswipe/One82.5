
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Loader2, ImageIcon, File as FileIcon } from 'lucide-react';
import { analyzeStatementDocument } from '../services/geminiService';
import { StorageService } from '../services/storage';

const StatementReader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const onAnalyze = async () => {
    if (!preview || !file) return;
    if (!StorageService.hasCredits(5)) { alert("Need 5 credits."); return; }
    
    setAnalyzing(true);
    StorageService.updateCredits(5, 'Document Analysis');
    const data = preview.split(',')[1];
    const res = await analyzeStatementDocument(data, file.type);
    setResult(res);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Document Analyzer</h2>
            <p className="text-sm text-slate-500 mt-1">Upload Merchant Statements (PDF, JPG, PNG)</p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">5 Credits</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <div onClick={() => document.getElementById('fu')?.click()} className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 bg-white dark:bg-slate-900 transition-all h-64">
                <input id="fu" type="file" className="hidden" accept="image/*,application/pdf" onChange={onFileChange} />
                {file ? (
                    <div className="text-center">
                        {file.type.includes('pdf') ? <FileIcon className="w-12 h-12 text-red-500 mx-auto" /> : <img src={preview!} className="max-h-32 rounded mb-2" />}
                        <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                    </div>
                ) : (
                    <><Upload className="w-10 h-10 text-slate-300 mb-2" /><p className="text-sm">Click to upload PDF or Image</p></>
                )}
            </div>
            <button onClick={onAnalyze} disabled={!file || analyzing} className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold disabled:opacity-50">
                {analyzing ? <Loader2 className="animate-spin mx-auto" /> : "Run AI Extraction"}
            </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 h-64 overflow-y-auto">
            <h3 className="text-sm font-bold mb-4 uppercase text-slate-400">Analysis Output</h3>
            {result ? <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{result}</div> : <div className="text-center text-slate-400 mt-12 italic">AI results will appear here...</div>}
        </div>
      </div>
    </div>
  );
};

export default StatementReader;
