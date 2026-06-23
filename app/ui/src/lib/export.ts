interface Column<T> {
  header: string;
  accessor: (row: T) => string | number;
}

export function exportToCSV<T>(data: T[], columns: Column<T>[], filename: string) {
  const header = columns.map((c) => `"${c.header}"`).join(',');

  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = String(c.accessor(row)).replace(/"/g, '""');
        return `"${value}"`;
      })
      .join(','),
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
