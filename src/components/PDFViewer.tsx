import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFTemplate, PDFField } from '../types';
import { createClient } from '@supabase/supabase-js';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Pencil, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  template: PDFTemplate;
  viewOnly?: boolean;
}

export function PDFViewer({ template, viewOnly = false }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [fields, setFields] = useState<PDFField[]>([]);
  const [selectedField, setSelectedField] = useState<PDFField | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    loadFields();
    fetchPdfUrl();
  }, [template.id]);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('pdf_fields')
        .select('*')
        .eq('template_id', template.id);

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchPdfUrl = async () => {
    if (!template?.file_url) {
      setPdfError('No PDF file URL provided');
      setLoadingPdf(false);
      return;
    }

    setLoadingPdf(true);
    setPdfError(null);

    try {
      // Extract the file path from the public URL
      const filePathMatch = template.file_url.match(/pdf-templates\/(.+)$/);
      if (!filePathMatch) {
        throw new Error('Invalid file URL format');
      }
      const filePath = filePathMatch[1];

      // Get a fresh download URL
      const { data, error } = await supabase.storage
        .from('pdf-templates')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      
      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
      } else {
        throw new Error('Failed to generate signed URL');
      }
    } catch (error: any) {
      console.error('Error fetching PDF:', error);
      setPdfError('Failed to load PDF file');
      toast.error('Failed to load PDF file');
    } finally {
      setLoadingPdf(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError('Failed to load PDF file');
    toast.error('Failed to load PDF file');
  };

  const handleAddField = (e: React.MouseEvent) => {
    if (viewOnly) return;
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newField: PDFField = {
      id: Math.random().toString(36).substring(2, 15),
      template_id: template.id,
      name: 'New Field',
      type: 'editable',
      x: x,
      y: y,
      width: 100,
      height: 20,
      page: pageNumber,
    };
    setFields([...fields, newField]);
    setSelectedField(newField);
    setIsEditing(true);
  };

  const handleFieldClick = (e: React.MouseEvent, field: PDFField) => {
    if (viewOnly) return;
    e.stopPropagation(); // Prevent triggering handleAddField
    setSelectedField(field);
    setIsEditing(true);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, fieldId: string, key: keyof PDFField) => {
    setFields(fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, [key]: e.target.value };
      }
      return field;
    }));
  };

  const handleFieldDelete = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
    setSelectedField(null);
    setIsEditing(false);
  };

  const handleSaveFields = async () => {
    setIsUploading(true);
    try {
      // Delete existing fields
      const { error: deleteError } = await supabase
        .from('pdf_fields')
        .delete()
        .eq('template_id', template.id);

      if (deleteError) throw deleteError;

      // Insert new fields
      const { error: insertError } = await supabase
        .from('pdf_fields')
        .insert(fields.map(field => ({
          ...field,
          template_id: template.id,
        })));

      if (insertError) throw insertError;

      toast.success('Fields saved successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="lg:w-3/4 relative">
        <div
          ref={containerRef}
          className="relative border border-gray-300 rounded-md overflow-hidden"
          onClick={viewOnly ? undefined : handleAddField}
        >
          {loadingPdf ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pdfError ? (
            <div className="flex justify-center items-center h-64 text-red-600">
              {pdfError}
            </div>
          ) : (
            <Document 
              file={pdfUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Page pageNumber={pageNumber} />
            </Document>
          )}
          {fields.map((field) => (
            <div
              key={field.id}
              onClick={(e) => viewOnly ? undefined : handleFieldClick(e, field)}
              className={`absolute border border-blue-500 rounded-md cursor-pointer transition-all duration-200 ${
                selectedField?.id === field.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
                pointerEvents: 'auto',
              }}
            >
              {selectedField?.id === field.id && isEditing && !viewOnly && (
                <div className="absolute top-0 left-0 bg-white p-2 border border-blue-500 rounded-md shadow-md z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-700">Edit Field</h4>
                    <button
                      onClick={() => handleFieldDelete(field.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-600">Name</label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleFieldChange(e, field.id, 'name')}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <label className="block text-xs text-gray-600">Type</label>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(e, field.id, 'type')}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="editable">Editable</option>
                      <option value="prefilled">Prefilled</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="mx-4 text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
      <div className="lg:w-1/4 p-4">
        {!viewOnly && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleSaveFields}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Saving...' : 'Save Fields'}
            </button>
          </div>
        )}
        <div className="bg-white rounded-md shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Instructions
          </h3>
          <p className="text-sm text-gray-600">
            {viewOnly ? "This is a view-only template." : "Click on the PDF to add a new field. Click on a field to edit it."}
          </p>
        </div>
      </div>
    </div>
  );
}
