import { parseCSV } from '../data/initialData';
import { RawRecord } from '../types';

/**
 * Converts any Google Sheet URL (standard view/edit link, pubhtml, or export link)
 * into a directly fetchable CSV URL.
 */
export function convertGoogleSheetUrl(rawUrl: string): { csvUrl: string; isConverted: boolean; note?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { csvUrl: '', isConverted: false };
  }

  // Case 1: Already a "pub?output=csv" or "pub?gid=...&output=csv"
  if (trimmed.includes('output=csv')) {
    return { csvUrl: trimmed, isConverted: false };
  }

  // Case 2: Published to web with HTML view (.../pubhtml)
  if (trimmed.includes('/pubhtml')) {
    const csvUrl = trimmed.replace('/pubhtml', '/pub?output=csv');
    return { csvUrl, isConverted: true, note: 'Đã chuyển link pubhtml sang định dạng xuất CSV' };
  }

  // Case 3: Published to web with /pub
  if (trimmed.includes('/pub') && !trimmed.includes('output=csv')) {
    const separator = trimmed.includes('?') ? '&' : '?';
    return { csvUrl: `${trimmed}${separator}output=csv`, isConverted: true };
  }

  // Case 4: Standard Google Sheet URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={GID}
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Extract gid if available
    let gid = '0';
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    if (gidMatch && gidMatch[1]) {
      gid = gidMatch[1];
    }

    // Google Visualization CSV endpoint allows public access and returns clean CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    return {
      csvUrl,
      isConverted: true,
      note: `Đã tự động chuyển đổi sang link trích xuất dữ liệu Google Sheets (gid: ${gid})`,
    };
  }

  return { csvUrl: trimmed, isConverted: false };
}

/**
 * Fetches CSV content from Google Sheets URL with cache-busting timestamp
 */
export async function fetchGoogleSheetData(url: string): Promise<{ records: RawRecord[]; rawCsv: string }> {
  if (!url || !url.trim()) {
    throw new Error('Chưa cấu hình đường link Google Sheet.');
  }

  const { csvUrl } = convertGoogleSheetUrl(url);

  // Add cache buster query parameter to bypass browser and CDN cache
  const cacheBuster = `_t=${Date.now()}`;
  const fetchUrl = csvUrl.includes('?') ? `${csvUrl}&${cacheBuster}` : `${csvUrl}?${cacheBuster}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Không tìm thấy file Google Sheet (Lỗi 404). Vui lòng kiểm tra lại đường link.');
      } else if (response.status === 403 || response.status === 401) {
        throw new Error(
          'Không có quyền truy cập (Lỗi 403/401). Vui lòng kiểm tra: Bạn đã cấp quyền "Bất kỳ ai có đường liên kết đều có thể xem" hoặc vào "Tệp > Chia sẻ > Xuất bản lên web" chưa?'
        );
      } else {
        throw new Error(`Lỗi tải dữ liệu từ Google Sheets: Mã lỗi HTTP ${response.status}`);
      }
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Nội dung file Google Sheet trống.');
    }

    // Check if Google returned an HTML error page or login redirect instead of CSV
    if (csvText.trim().startsWith('<!DOCTYPE html>') || csvText.includes('<html')) {
      throw new Error(
        'Google Sheets yêu cầu đăng nhập hoặc trang tính chưa được Xuất bản lên web. Vui lòng vào Google Sheet: "Tệp > Chia sẻ > Xuất bản lên web" chọn sheet "theo subfolder" dạng CSV và copy link đó.'
      );
    }

    const records = parseCSV(csvText);
    if (records.length === 0) {
      throw new Error('Không tìm thấy dòng dữ liệu hợp lệ trong file. Vui lòng kiểm tra tiêu đề cột (date_days, type_folder, pageview...).');
    }

    return { records, rawCsv: csvText };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Quá thời gian chờ (Timeout 15s) khi kết nối tới Google Sheets. Vui lòng thử lại.');
    }
    throw err;
  }
}
