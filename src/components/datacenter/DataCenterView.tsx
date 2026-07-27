import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Download, Upload, FileSpreadsheet, FileCode, CheckCircle, AlertCircle, Eye, Check, X, FileText } from 'lucide-react';
import { TransactionType } from '../../types';

interface ParsedRow {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string;
  rawLine: string;
  selected: boolean;
}

export const DataCenterView: React.FC = () => {
  const { transactions, categories, addTransaction, addToast } = useFinance();

  const [importStatus, setImportStatus] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // CSV Export
  const exportToCSV = () => {
    if (transactions.length === 0) {
      addToast({ type: 'warning', title: 'Sin datos', message: 'No hay transacciones registradas para exportar.' });
      return;
    }

    const headers = ['ID', 'Fecha', 'Tipo', 'Monto', 'Categoría', 'Descripción', 'Notas'];
    const rows = transactions.map((t) => {
      const cat = categories.find((c) => c.id === t.category_id)?.name || 'General';
      return [
        t.id,
        t.transaction_date,
        t.type,
        t.amount.toFixed(2),
        `"${cat}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financefunnel_reporte_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    addToast({ type: 'success', title: 'Exportación Exitosa', message: 'Se ha descargado el archivo CSV.' });
  };

  // JSON Export
  const exportToJSON = () => {
    if (transactions.length === 0) {
      addToast({ type: 'warning', title: 'Sin datos', message: 'No hay transacciones registradas para exportar.' });
      return;
    }

    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financefunnel_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    addToast({ type: 'success', title: 'Copia de Seguridad', message: 'Se ha descargado el respaldo JSON.' });
  };

  // Quote-aware CSV line parser
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === ',' || c === ';') && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result.map((s) => s.replace(/^"|"$/g, '').trim());
  };

  // Smart Date Parser (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
  const normalizeDate = (raw: string): string => {
    if (!raw) return new Date().toISOString().slice(0, 10);
    const clean = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    const parts = clean.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;
      if (p1.length === 4) {
        return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
      } else if (p3.length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY
        let day = parseInt(p1, 10);
        let month = parseInt(p2, 10);
        if (day > 12) {
          return `${p3}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
        }
        return `${p3}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().slice(0, 10);
  };

  // Smart Amount Cleaner ($1,500.50 -> 1500.50)
  const parseAmount = (raw: string): number => {
    if (!raw) return 0;
    let clean = raw.replace(/[^0-9\,\.\-]/g, '');
    if (!clean) return 0;

    // Handle European 1.500,50 vs 1,500.50
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf(',') < clean.indexOf('.')) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/\./g, '').replace(',', '.');
      }
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }

    const val = parseFloat(clean);
    return isNaN(val) ? 0 : Math.abs(val);
  };

  // Handle File Select & Process
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setImportStatus('El archivo CSV está vacío.');
        return;
      }

      // 1. Detect Headers
      const rawHeader = parseCSVLine(lines[0]);
      const lowerHeader = rawHeader.map((h) => h.toLowerCase());

      let dateIdx = lowerHeader.findIndex((h) => h.includes('fecha') || h.includes('date') || h.includes('day'));
      let descIdx = lowerHeader.findIndex((h) => h.includes('desc') || h.includes('concepto') || h.includes('detalle') || h.includes('nota') || h.includes('name'));
      let amtIdx = lowerHeader.findIndex((h) => h.includes('monto') || h.includes('amount') || h.includes('valor') || h.includes('importe') || h.includes('total'));
      let typeIdx = lowerHeader.findIndex((h) => h.includes('tipo') || h.includes('type') || h.includes('clase'));
      let catIdx = lowerHeader.findIndex((h) => h.includes('cat') || h.includes('rubro'));

      const hasHeader = dateIdx !== -1 || descIdx !== -1 || amtIdx !== -1;

      // Fallbacks if no headers detected
      if (dateIdx === -1) dateIdx = 0;
      if (amtIdx === -1) amtIdx = rawHeader.length > 2 ? 2 : 1;
      if (descIdx === -1) descIdx = rawHeader.length > 3 ? 3 : rawHeader.length - 1;

      const startIndex = hasHeader ? 1 : 0;
      const rows: ParsedRow[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 2) continue;

        const rawDate = cols[dateIdx] || '';
        const rawAmt = cols[amtIdx] || '';
        const rawDesc = cols[descIdx] || `Transacción Importada #${i}`;
        const rawType = typeIdx !== -1 ? cols[typeIdx]?.toLowerCase() : '';
        const rawCat = catIdx !== -1 ? cols[catIdx] : '';

        const amount = parseAmount(rawAmt);
        if (amount <= 0) continue;

        const date = normalizeDate(rawDate);
        let type: TransactionType = 'expense';
        if (rawType.includes('inc') || rawType.includes('ing') || rawAmt.includes('+')) {
          type = 'income';
        } else if (rawType.includes('exp') || rawType.includes('gas') || rawAmt.includes('-')) {
          type = 'expense';
        }

        // Match Category by Name or Default
        let matchedCat = categories[0]?.id || 'c-1';
        if (rawCat) {
          const found = categories.find((c) => c.name.toLowerCase().includes(rawCat.toLowerCase()));
          if (found) matchedCat = found.id;
        }

        rows.push({
          id: `import-${i}-${Date.now()}`,
          date,
          type,
          amount,
          description: rawDesc || 'Importado desde CSV',
          category_id: matchedCat,
          rawLine: lines[i],
          selected: true,
        });
      }

      if (rows.length === 0) {
        setImportStatus('No se encontraron transacciones válidas en el archivo CSV.');
        addToast({ type: 'warning', title: 'Archivo Vacio', message: 'No hay filas válidas para importar.' });
        return;
      }

      setParsedRows(rows);
      setIsPreviewOpen(true);
      setImportStatus(`Se encontraron ${rows.length} transacciones listas para revisar e importar.`);
    };

    reader.readAsText(file);
  };

  // Confirm Import Batch
  const handleConfirmImport = async () => {
    const selectedRows = parsedRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      addToast({ type: 'warning', title: 'Sin Selección', message: 'Selecciona al menos una fila para importar.' });
      return;
    }

    setIsImporting(true);
    let count = 0;

    for (const row of selectedRows) {
      addTransaction({
        transaction_date: row.date,
        type: row.type,
        amount: row.amount,
        description: row.description,
        category_id: row.category_id,
        notes: 'Importación Masiva CSV',
      });
      count++;
    }

    setIsImporting(false);
    setIsPreviewOpen(false);
    setParsedRows([]);
    setImportStatus(`¡${count} transacciones fueron importadas con éxito!`);
    addToast({
      type: 'success',
      title: 'Importación Completada',
      message: `Se importaron ${count} registros a tu espacio de trabajo.`,
    });
  };

  const toggleSelectRow = (id: string) => {
    setParsedRows((prev) => prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)));
  };

  const toggleSelectAll = (select: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: select })));
  };

  // Download Sample CSV Template
  const downloadSampleCSV = () => {
    const sampleHeaders = ['Fecha', 'Tipo', 'Monto', 'Descripción', 'Categoría'];
    const sampleRows = [
      ['2026-07-01', 'Ingreso', '2500.00', '"Venta de Consultoría SaaS"', '"Ventas"'],
      ['2026-07-03', 'Gasto', '150.50', '"Suscripción Licencias Software"', '"Herramientas"'],
      ['2026-07-05', 'Ingreso', '4800.00', '"Cobro Factura Proyecto Upfunnel"', '"Ventas"'],
      ['2026-07-10', 'Gasto', '85.00', '"Almuerzo Ejecutivo y Café"', '"Alimentación"'],
      ['2026-07-15', 'Gasto', '320.00', '"Campaña Publicitaria Meta & Google Ads"', '"Marketing"'],
      ['2026-07-20', 'Ingreso', '1200.00', '"Pago Cliente Servicio Funnel"', '"Ventas"'],
      ['2026-07-25', 'Gasto', '45.00', '"Servicios de Hosting Cloud"', '"Infraestructura"'],
    ];

    const csvContent = [sampleHeaders.join(','), ...sampleRows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financefunnel_plantilla_ejemplo.csv`;
    link.click();

    addToast({
      type: 'info',
      title: 'Plantilla Descargada',
      message: 'Se descargó el archivo financefunnel_plantilla_ejemplo.csv con datos de muestra.',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-extrabold uppercase tracking-wider uf-glow-sm">
            CENTRO DE DATOS Y CARGA MASIVA
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#FFFFFF] mt-1 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#00E5FF]" />
          <span>Exportación, Importación y Respaldo</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Carga archivos CSV de cualquier banco u hoja de cálculo con detección automática de columnas y vista previa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <Download className="w-5 h-5" />
            <span>Exportar Informes y Respaldos</span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Descarga un reporte consolidado compatible con Excel o una copia de seguridad estructurada en JSON.
          </p>

          <div className="space-y-3 pt-2">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 text-[#FFFFFF] text-xs font-bold hover:bg-[#00E5FF]/10 hover:border-[#00E5FF] transition-all uf-glow-sm"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-[#00E5FF]" />
                <span>Exportar Informe CSV (Excel)</span>
              </div>
              <Download className="w-4 h-4 text-[#00E5FF]" />
            </button>

            <button
              onClick={exportToJSON}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 text-[#FFFFFF] text-xs font-bold hover:bg-[#94A3B8]/10 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-[#00E5FF]" />
                <span>Respaldo Completo en JSON</span>
              </div>
              <Download className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <Upload className="w-5 h-5" />
            <span>Importación Masiva de Datos (CSV)</span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Sube extractos bancarios o listas masivas de transacciones. El sistema limpia montos, fechas y descripciones automáticamente.
          </p>

          <div className="space-y-3">
            <div className="relative border-2 border-dashed border-[#00E5FF]/40 rounded-2xl p-6 text-center hover:border-[#00E5FF] transition-all bg-[#080C14] group cursor-pointer">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload className="w-8 h-8 text-[#00E5FF] mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-[#FFFFFF]">Haz clic o arrastra tu archivo CSV aquí</p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Soporta cualquier orden de columnas (Bancos, Excel, etc.)</p>
            </div>

            <button
              onClick={downloadSampleCSV}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/10 transition-all uf-glow-sm"
            >
              <Download className="w-4 h-4 text-[#00E5FF]" />
              <span>Descargar Plantilla de Ejemplo (.csv)</span>
            </button>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs font-bold text-[#00E5FF] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Table Modal / Drawer */}
      {isPreviewOpen && (
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 space-y-4 uf-glow shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#94A3B8]/20 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#FFFFFF] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00E5FF]" />
                <span>Vista Previa de Carga Masiva ({parsedRows.length} registros)</span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Revisa los datos detectados. Puedes marcar o desmarcar filas antes de confirmar la subida.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSelectAll(true)}
                className="px-2.5 py-1 rounded-lg bg-[#94A3B8]/10 text-[#94A3B8] hover:text-[#FFFFFF] text-[11px] font-bold"
              >
                Marcar Todos
              </button>
              <button
                onClick={() => toggleSelectAll(false)}
                className="px-2.5 py-1 rounded-lg bg-[#94A3B8]/10 text-[#94A3B8] hover:text-[#FFFFFF] text-[11px] font-bold"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border border-[#94A3B8]/20 rounded-xl">
            <table className="w-full text-left text-xs text-[#FFFFFF]">
              <thead className="bg-[#080C14] sticky top-0 border-b border-[#94A3B8]/20 text-[#94A3B8] uppercase text-[11px] font-bold">
                <tr>
                  <th className="p-3 w-10">Importar</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">Categoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#94A3B8]/15 font-mono">
                {parsedRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => toggleSelectRow(row.id)}
                    className={`cursor-pointer transition-colors ${
                      row.selected ? 'bg-[#00E5FF]/5 hover:bg-[#00E5FF]/10' : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-[#00E5FF] text-[#00E5FF] focus:ring-0"
                      />
                    </td>
                    <td className="p-3 text-[#00E5FF]">{row.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.type === 'income'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-600/40'
                        }`}
                      >
                        {row.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#FFFFFF]">${row.amount.toFixed(2)}</td>
                    <td className="p-3 text-[#FFFFFF] font-sans truncate max-w-xs">{row.description}</td>
                    <td className="p-3 text-[#94A3B8] font-sans">
                      {categories.find((c) => c.id === row.category_id)?.name || 'General'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-[#00E5FF]">
              {parsedRows.filter((r) => r.selected).length} de {parsedRows.length} transacciones seleccionadas
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold hover:text-[#FFFFFF]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="px-6 py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-black uppercase uf-glow-sm shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isImporting ? 'Importando...' : 'Confirmar e Importar Filas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
