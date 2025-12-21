/**
 * CSVデータとJSONデータの相互変換を行うサービス
 */
export class CsvService {
  /**
   * JSON配列をCSV文字列に変換する
   * @param data JSONデータの配列
   * @param headers ヘッダー（列名）の配列
   * @returns CSV文字列
   */
  static jsonToCsv(data: any[], headers: { key: string; label: string }[]): string {
    const headerRow = headers.map(h => this.escapeCsvValue(h.label)).join(',');
    const rows = data.map(item => {
      return headers.map(h => this.escapeCsvValue(item[h.key])).join(',');
    });
    
    // BOM（UTF-8）を付けて文字化けを防ぐ
    const bom = '\uFEFF';
    return bom + [headerRow, ...rows].join('\r\n');
  }

  /**
   * CSV文字列をJSONの配列に変換する
   * @param csvContent CSV文字列
   * @param headerMap ヘッダー名とプロパティ名のマッピング
   * @returns JSONデータの配列
   */
  static csvToJson(csvContent: string, headerMap: Record<string, string>): any[] {
    // BOMの除去
    const cleanedContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanedContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = this.parseCsvLine(lines[i]);
      const item: any = {};
      
      headers.forEach((header, index) => {
        const key = headerMap[header];
        if (key) {
          item[key] = values[index];
        }
      });
      data.push(item);
    }

    return data;
  }

  /**
   * 文字列をCSVのルールに従ってエスケープする
   */
  private static escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * CSVの1行を正しくパースする（クォート内のカンマ等に対応）
   */
  private static parseCsvLine(line: string): string[] {
    const result = [];
    let curValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // エスケープされたダブルクォート
          curValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(curValue);
        curValue = '';
      } else {
        curValue += char;
      }
    }
    result.push(curValue);
    return result;
  }

  /**
   * CSVファイルをダウンロードする
   */
  static downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
