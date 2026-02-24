import { Check, X } from 'lucide-react';

interface ComparisonTableProps {
  headers: string[];
  rows: { feature: string; values: (string | boolean)[] }[];
  highlightColumn?: number;
}

export function ComparisonTable({ headers, rows, highlightColumn = 1 }: ComparisonTableProps) {
  if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) return null;
  return (
    <div className="overflow-x-auto my-8 not-prose">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className={`text-left px-4 py-3 font-semibold border-b-2 ${
                  i === highlightColumn
                    ? 'bg-xtal-ice text-xtal-navy border-b-xtal-navy'
                    : 'text-slate-600 border-b-slate-200'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const values = Array.isArray(row?.values) ? row.values : [];
            return (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-700">{row?.feature}</td>
                {values.map((val, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 ${j + 1 === highlightColumn ? 'bg-xtal-ice/50' : ''}`}
                  >
                    {val === true ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : val === false ? (
                      <X className="w-4 h-4 text-red-400" />
                    ) : (
                      <span className="text-slate-600">{String(val)}</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
