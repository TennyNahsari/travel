import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'export', sheetName = 'Data') => {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diexport.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
