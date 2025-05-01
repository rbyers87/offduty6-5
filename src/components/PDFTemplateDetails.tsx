import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PDFTemplate } from '../types';
import { PDFViewer } from './PDFViewer';
import toast from 'react-hot-toast';

export function PDFTemplateDetails() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<PDFTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id]);

  const loadTemplate = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/templates');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return <div className="text-center">Template not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {template.name}
      </h1>
      <PDFViewer template={template} viewOnly={true} />
    </div>
  );
}
