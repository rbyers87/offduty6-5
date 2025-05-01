export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  full_name: string;
  badge_number?: string;
}

export interface PDFTemplate {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
  updated_at: string;
  fields: PDFField[];
}

export interface PDFField {
  id: string;
  template_id: string;
  name: string;
  type: 'editable' | 'prefilled';
  value?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}
