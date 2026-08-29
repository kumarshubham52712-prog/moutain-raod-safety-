import { useState, useRef }     from 'react';
import { useMonitoringStore }  from '../store/monitoringStore';
import { dataAdapter }         from '../services/dataAdapter';
import { Card, SectionHeader } from '../components/common';
import { Upload, FileJson, FileSpreadsheet, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { ImportResult, ImportedSensorRecord } from '../types';
import clsx                    from 'clsx';

export default function DataImport() {
  const { sensors, applySensorImport } = useMonitoringStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [imported, setImported] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [preview, setPreview]   = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setImported(false);
    setError(null);

    try {
      const text = await file.text();
      let records: unknown[];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.endsWith('.csv')) {
        records = parseCSV(text);
      } else {
        setError('Unsupported file format. Please upload .json or .csv');
        return;
      }

      const validation = dataAdapter.validateImport(records);
      setResult(validation);
      setPreview(true);
    } catch (err) {
      setError(`Parse error: ${(err as Error).message}`);
    }
  };

  const parseCSV = (text: string): Record<string, unknown>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const v = values[i];
        obj[h] = isNaN(Number(v)) ? v : Number(v);
      });
      return obj;
    });
  };

  const handleImport = () => {
    if (!result) return;
    const updated = dataAdapter.applyImport(sensors, result.preview as ImportedSensorRecord[]);
    applySensorImport(updated);
    setImported(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Upload Area ────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader title="Upload Sensor Data" subtitle="Import CSV or JSON files with sensor readings" />

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-surface-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-600/50 hover:bg-brand-600/5 transition-all"
        >
          <Upload size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-300 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-slate-600">
            Supports .json and .csv formats
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
        )}

        {imported && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
            <CheckCircle size={16} /> Data imported successfully! Dashboard has been updated.
          </div>
        )}
      </Card>

      {/* ── Expected Format ────────────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader title="Expected Data Format" subtitle="Use this structure for your import files" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileJson size={14} className="text-yellow-400" />
              <p className="text-xs font-semibold text-white">JSON Format</p>
            </div>
            <pre className="bg-surface-950 border border-surface-700 rounded-lg p-3 text-[10px] text-slate-400 font-mono overflow-x-auto">
{`[
  {
    "sensor_id": "IPI-001",
    "sensor_type": "IPI",
    "substation_id": "SUB-01",
    "master_station_id": "MASTER-01",
    "timestamp": "2026-08-29T18:30:00Z",
    "value": 12.4,
    "unit": "mm",
    "battery": 87,
    "signal": 91
  }
]`}
            </pre>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet size={14} className="text-green-400" />
              <p className="text-xs font-semibold text-white">CSV Format</p>
            </div>
            <pre className="bg-surface-950 border border-surface-700 rounded-lg p-3 text-[10px] text-slate-400 font-mono overflow-x-auto">
{`sensor_id,sensor_type,substation_id,master_station_id,timestamp,value,unit,battery,signal
IPI-001,IPI,SUB-01,MASTER-01,2026-08-29T18:30:00Z,12.4,mm,87,91
VWP-002,VWP,SUB-02,MASTER-01,2026-08-29T18:30:00Z,64.5,kPa,78,71`}
            </pre>
          </div>
        </div>

        <div className="mt-4 px-3 py-2 bg-surface-900 rounded-lg border border-surface-700 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 mb-1">Required fields:</p>
          <p>sensor_id, sensor_type (IPI | VWP | GEOPHONE | EXTENSOMETER), substation_id, timestamp, value</p>
          <p className="mt-1"><span className="text-slate-400">Optional:</span> master_station_id, unit, battery, signal, latitude, longitude</p>
        </div>
      </Card>

      {/* ── Validation Results ─────────────────────────────────── */}
      {result && preview && (
        <Card className="p-4">
          <SectionHeader title="Validation Results" subtitle="Review before importing" />

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-surface-900 rounded-lg border border-surface-700">
              <p className="text-xl font-bold text-white font-mono">{result.totalRecords}</p>
              <p className="text-[10px] text-slate-500">Total Records</p>
            </div>
            <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
              <p className="text-xl font-bold text-green-400 font-mono">{result.validRecords}</p>
              <p className="text-[10px] text-slate-500">Valid</p>
            </div>
            <div className="text-center p-3 bg-red-500/5 rounded-lg border border-red-500/20">
              <p className="text-xl font-bold text-red-400 font-mono">{result.invalidRecords}</p>
              <p className="text-[10px] text-slate-500">Invalid</p>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-400 mb-2">Validation Errors:</p>
              <div className="max-h-32 overflow-y-auto bg-red-500/5 border border-red-500/20 rounded-lg p-2">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-red-300 font-mono py-0.5">{err}</p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {result.preview.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <Eye size={12} /> Preview (first {result.preview.length} records)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-surface-700">
                      {['sensor_id', 'type', 'substation', 'timestamp', 'value', 'unit', 'battery', 'signal'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((rec, i) => (
                      <tr key={i} className="border-b border-surface-800">
                        <td className="py-1.5 px-2 font-mono text-white">{rec.sensor_id}</td>
                        <td className="py-1.5 px-2 text-slate-300">{rec.sensor_type}</td>
                        <td className="py-1.5 px-2 text-slate-400">{rec.substation_id}</td>
                        <td className="py-1.5 px-2 font-mono text-slate-500">{rec.timestamp}</td>
                        <td className="py-1.5 px-2 font-mono font-bold text-brand-400">{rec.value}</td>
                        <td className="py-1.5 px-2 text-slate-500">{rec.unit}</td>
                        <td className="py-1.5 px-2 text-slate-500">{rec.battery ?? '—'}</td>
                        <td className="py-1.5 px-2 text-slate-500">{rec.signal ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Import Button */}
          {result.validRecords > 0 && !imported && (
            <button
              onClick={handleImport}
              className="mt-4 w-full py-3 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-500 transition-all"
            >
              Import {result.validRecords} Valid Records
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
