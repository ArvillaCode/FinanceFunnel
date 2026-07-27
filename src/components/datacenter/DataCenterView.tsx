import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Download, Upload, FileSpreadsheet, FileCode, CheckCircle, FileText, AlertCircle } from 'lucide-react';

export const DataCenterView: React.FC = () => {
  const { transactions, categories, addTransaction, addToast } = useFinance();

  const [importStatus, setImportStatus] = useState('');
  const [importedCount, setImportedCount] = useState(0);

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

  // CSV Import Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length <= 1) {
        setImportStatus('El archivo CSV parece estar vacío o sin filas de datos.');
        return;
      }

      let count = 0;
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 4) {
          const dateStr = parts[1]?.replace(/"/g, '').trim() || new Date().toISOString().slice(0, 10);
          const typeStr = parts[2]?.replace(/"/g, '').trim().toLowerCase() === 'income' ? 'income' : 'expense';
          const amt = parseFloat(parts[3]?.replace(/"/g, '').trim() || '0');
          const desc = parts[5]?.replace(/"/g, '').trim() || `Importado CSV ${i}`;

          if (amt > 0) {
            addTransaction({
              transaction_date: dateStr,
              type: typeStr,
              amount: amt,
              description: desc,
              category_id: categories[0]?.id || 'c-1',
              notes: 'Importación masiva CSV',
            });
            count++;
          }
        }
      }

      setImportedCount(count);
      setImportStatus(`¡Se importaron ${count} transacciones correctamente!`);
      addToast({ type: 'success', title: 'Importación Exitosa', message: `${count} registros importados.` });
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-extrabold uppercase tracking-wider uf-glow-sm">
            CENTRO DE DATOS Y EXPORTACIÓN
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-[#FFFFFF] mt-1 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#00E5FF]" />
          <span>Exportación, Importación y Respaldo</span>
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Descarga informes ejecutivos en CSV o JSON, o importa transacciones masivas desde hojas de cálculo
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
            <span>Importación Masiva desde CSV</span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Selecciona un archivo CSV para importar transacciones históricas automáticamente en tu espacio de trabajo.
          </p>

          <div className="relative border-2 border-dashed border-[#00E5FF]/40 rounded-2xl p-6 text-center hover:border-[#00E5FF] transition-all bg-[#080C14]">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-[#00E5FF] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#FFFFFF]">Haz clic o arrastra tu archivo CSV aquí</p>
            <p className="text-[11px] text-[#94A3B8] mt-1">Formato: Fecha, Tipo, Monto, Descripción</p>
          </div>

          {importStatus && (
            <div className="p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs font-bold text-[#00E5FF] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
