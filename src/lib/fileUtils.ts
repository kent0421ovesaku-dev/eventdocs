export const ALLOWED_EXTENSIONS = [
  '.xlsx',
  '.xls',
  '.docx',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
] as const;

export type AllowedFileType =
  | 'xlsx'
  | 'xls'
  | 'docx'
  | 'pdf'
  | 'png'
  | 'jpg'
  | 'jpeg';

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

export function isAllowedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.some((e) => e === ext);
}

export function getFileType(filename: string): AllowedFileType | null {
  const ext = getFileExtension(filename);
  const map: Record<string, AllowedFileType> = {
    '.xlsx': 'xlsx',
    '.xls': 'xls',
    '.docx': 'docx',
    '.pdf': 'pdf',
    '.png': 'png',
    '.jpg': 'jpg',
    '.jpeg': 'jpeg',
  };
  return map[ext] ?? null;
}

export function getMimeType(filename: string): string {
  const type = getFileType(filename);
  const mimes: Record<string, string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return type ? mimes[type] : 'application/octet-stream';
}
