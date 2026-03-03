import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

interface SendNotificationForm {
    title: string;
    body: string;
    tag?: string;
}

export default function SendPushNotifications() {
    const [formData, setFormData] = useState<SendNotificationForm>({
        title: '',
        body: '',
        tag: 'season-notification',
    });
    const [recipientType, setRecipientType] = useState<'all' | 'user'>('all');
    const [selectedUserId, setSelectedUserId] = useState('');
    const { showToast } = useToast();

    const sendNotificationMutation = useMutation({
        mutationFn: async () => {
            let endpoint = '';
            let data: any = {
                title: formData.title,
                body: formData.body,
                icon: '/logo.jpg',
                badge: '/logo.jpg',
                tag: formData.tag || 'default',
                data: {
                    url: '/',
                    timestamp: new Date().toISOString(),
                },
            };

            if (recipientType === 'all') {
                endpoint = '/push/send-to-all';
            } else {
                if (!selectedUserId) {
                    throw new Error('Usuario no seleccionado');
                }
                endpoint = `/push/send-to-user/${selectedUserId}`;
            }

            const response = await api.post(endpoint, data);
            return response.data;
        },
        onSuccess: (data: any) => {
            if (recipientType === 'all' && data?.result) {
                showToast(
                    `✅ Notificación enviada correctamente · Enviadas: ${data.result.success} | Fallidas: ${data.result.failed}`,
                    'success'
                );
            } else if (recipientType === 'user' && data?.result) {
                // Mostrar estadísticas también para usuario individual
                showToast(
                    `✅ Notificación enviada · Enviadas: ${data.result.sent} | Fallidas: ${data.result.failed}`,
                    'success'
                );
            } else {
                showToast('✅ Notificación enviada correctamente', 'success');
            }
            setFormData({ title: '', body: '', tag: 'season-notification' });
            setSelectedUserId('');
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                'Error al enviar notificación';
            showToast(`❌ ${errorMessage}`, 'error');
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            showToast('❌ El título es requerido', 'error');
            return;
        }

        if (!formData.body.trim()) {
            showToast('❌ El mensaje es requerido', 'error');
            return;
        }

        sendNotificationMutation.mutate();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">🔔 Enviar Notificaciones Push</h1>
                <p className="opacity-90">
                    Envía notificaciones a todos los usuarios o a un usuario específico
                </p>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6">
                {/* Tabs para tipo de destinatario */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                        Enviar a:
                    </p>
                    <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="recipient"
                                value="all"
                                checked={recipientType === 'all'}
                                onChange={(e) => setRecipientType(e.target.value as 'all' | 'user')}
                                className="w-4 h-4 mr-2"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                                👥 Todos los usuarios
                            </span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="radio"
                                name="recipient"
                                value="user"
                                checked={recipientType === 'user'}
                                onChange={(e) => setRecipientType(e.target.value as 'all' | 'user')}
                                className="w-4 h-4 mr-2"
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                                👤 Usuario específico
                            </span>
                        </label>
                    </div>
                </div>

                {/* User Selection (if specific user) */}
                {recipientType === 'user' && (
                    <div>
                        <label htmlFor="userId" className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                            Selecciona un usuario:
                        </label>
                        <input
                            type="text"
                            id="userId"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            placeholder="Ingresa el ID del usuario"
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                )}

                {/* Título */}
                <div>
                    <label htmlFor="title" className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                        Título <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="ej. ¡Nueva temporada disponible!"
                        maxLength={100}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formData.title.length}/100
                    </p>
                </div>

                {/* Mensaje */}
                <div>
                    <label htmlFor="body" className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                        Mensaje <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="ej. La nueva temporada 2024-2025 ya está disponible. ¡Únete ahora!"
                        maxLength={500}
                        rows={5}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formData.body.length}/500
                    </p>
                </div>

                {/* Tag */}
                <div>
                    <label htmlFor="tag" className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                        Etiqueta (Tag)
                    </label>
                    <input
                        type="text"
                        id="tag"
                        name="tag"
                        value={formData.tag}
                        onChange={handleChange}
                        placeholder="ej. season-notification"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        La etiqueta agrupa notificaciones similares en el navegador
                    </p>
                </div>

                {/* Nota informativa */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-semibold">ℹ️ Nota:</span> Las notificaciones se enviarán solo a
                        usuarios que tengan habilitadas las notificaciones push en nuestra app.
                    </p>
                </div>

                {/* Botón de envío */}
                <button
                    type="submit"
                    disabled={sendNotificationMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sendNotificationMutation.isPending ? (
                        <>
                            <span className="inline-block mr-2">⏳</span>
                            Enviando...
                        </>
                    ) : (
                        <>
                            <span className="inline-block mr-2">🚀</span>
                            Enviar Notificación
                        </>
                    )}
                </button>
            </form>

            {/* Ejemplo de notificación */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-lg p-6 border border-purple-200 dark:border-purple-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    📋 Plantillas Recomendadas
                </h2>

                <div className="space-y-3">
                    {/* Nueva Temporada */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            setFormData({
                                title: '¡Nueva Temporada Disponible! 🎉',
                                body: 'La nueva temporada ya está abierta. ¡Comienza a competir!',
                                tag: 'season-notification',
                            });
                        }}>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            Nueva Temporada
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Anuncia el inicio de una nueva temporada
                        </p>
                    </div>

                    {/* Próximo Partido */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            setFormData({
                                title: '⚠️ Recordatorio: Próximo Partido',
                                body: 'Tu próximo partido está programado para hoy. ¡No olvides confirmar tu asistencia!',
                                tag: 'match-reminder',
                            });
                        }}>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            Recordatorio de Partido
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Recuerda a los jugadores sus próximos partidos
                        </p>
                    </div>

                    {/* Mantenimiento */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                            setFormData({
                                title: '🔧 Mantenimiento Programado',
                                body: 'Realizaremos mantenimiento mañana de 2-4 AM. El sistema estará temporalmente inaccesible.',
                                tag: 'maintenance',
                            });
                        }}>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            Notificación de Mantenimiento
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Avisa sobre mantenimiento programado
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
