import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BugReport() {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const { language } = useLanguage();
  const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

  const mutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      const appVersion = (import.meta as any).env?.VITE_APP_VERSION || 'dev';
      let attachments = '';

      // Validar tamano de archivos (max 5MB por archivo, max 3 archivos)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      const MAX_FILES = 3;

      if (files.length > MAX_FILES) {
        throw new Error(tr(`Maximo ${MAX_FILES} archivos permitidos`, `${MAX_FILES} fitxategi gehienez onartzen dira`));
      }

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            tr(
              `El archivo "${file.name}" excede el tamano maximo de 5MB`,
              `"${file.name}" fitxategiak 5MB-ko gehieneko tamaina gainditzen du`,
            ),
          );
        }
      }

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

      const { data } = await api.post('/bugs', {
        description,
        email: email || undefined,
        userAgent: navigator.userAgent,
        appVersion,
        attachments: attachments || undefined,
      });
      setUploading(false);
      return data;
    },
    onSuccess: () => {
      setDescription('');
      setEmail('');
      setFiles([]);
      showToast(
        tr(
          'Mensaje enviado correctamente. Gracias por ayudarnos a mejorar.',
          'Mezua ondo bidali da. Eskerrik asko hobetzen laguntzeagatik.',
        ),
        'success',
      );
    },
    onError: (error: any) => {
      setUploading(false);
      showToast(
        tr('Error al enviar el mensaje:', 'Errorea mezua bidaltzean:') + ` ${error.response?.data?.error || error.message}`,
        'error',
      );
    },
  });

  const disabled = mutation.isPending || uploading || description.trim().length < 5;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{tr('Buzon de bugs y sugerencias', 'Akats eta iradokizunen postontzia')}</h1>
        <p className="text-amber-100">
          {tr(
            'Comparte errores, ideas o mejoras que te gustaria ver en la plataforma.',
            'Partekatu plataforman ikusi nahi dituzun erroreak, ideiak edo hobekuntzak.',
          )}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={(e) => { e.preventDefault(); if (!disabled) mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Descripcion *', 'Deskribapena *')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder={tr(
                'Cuenta el problema o la sugerencia con el mayor detalle posible...',
                'Azaldu arazoa edo iradokizuna ahalik eta xehetasun handienarekin...',
              )}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              required
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tr('Minimo 5 caracteres.', 'Gutxienez 5 karaktere.')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Email (opcional)', 'Emaila (aukerakoa)')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr('Si quieres respuesta, escribe tu email', 'Erantzuna nahi baduzu, idatzi zure emaila')}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Imagenes o videos (opcional)', 'Irudiak edo bideoak (aukerakoa)')}</label>
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
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-600 hover:text-red-800">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr(
                'Max. 5 MB por archivo, maximo 3 archivos. Formatos: imagenes y videos.',
                'Gehienez 5 MB fitxategi bakoitzeko, eta 3 fitxategi gehienez. Formatuak: irudiak eta bideoak.',
              )}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={disabled}
              className="px-6 py-3 rounded-lg bg-red-600 text-white font-semibold shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading
                ? tr('Subiendo archivos...', 'Fitxategiak igotzen...')
                : mutation.isPending
                  ? tr('Enviando...', 'Bidaltzen...')
                  : tr('Enviar mensaje', 'Mezua bidali')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

