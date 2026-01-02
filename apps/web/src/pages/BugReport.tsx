import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

export default function BugReport() {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const appVersion = (import.meta as any).env?.VITE_APP_VERSION || 'dev';
      let attachments = '';

      // Convertir archivos a base64 para enviar (alternativa: subir a servidor/cloud)
      if (files.length > 0) {
        const encoded = await Promise.all(files.map(async (file) => {
          const reader = new FileReader();
          return new Promise<string>((resolve) => {
            reader.onload = () => resolve(`${file.name}|${reader.result}`);
            reader.readAsDataURL(file);
          });
        }));
        attachments = encoded.join(':::');
      }

      const { data } = await api.post('/bugs', { description, email: email || undefined, userAgent: navigator.userAgent, appVersion, attachments: attachments || undefined });
      setUploading(false);
      return data;
    },
    onSuccess: () => {
      setDescription('');
      setEmail('');
      setFiles([]);
      showToast('✓ Bug enviado correctamente. ¡Gracias por tu reporte!', 'success');
    },
    onError: (error: any) => {
      setUploading(false);
      showToast(`Error al enviar el reporte: ${error.response?.data?.error || error.message}`, 'error');
    }
  });

  const disabled = mutation.isPending || uploading || description.trim().length < 5;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Reportar Bug</h1>
        <p className="text-red-100">Ayúdanos a mejorar la plataforma</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); if (!disabled) mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Explica qué estabas haciendo, qué pasó y qué esperabas..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mínimo 5 caracteres.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email (opcional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Si quieres respuesta, escribe tu email"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Imágenes o Videos (opcional)</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Máx. 5 MB por archivo. Formatos: imágenes y videos.</p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={disabled}
              className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Subiendo archivos...' : mutation.isPending ? 'Enviando...' : 'Enviar Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
