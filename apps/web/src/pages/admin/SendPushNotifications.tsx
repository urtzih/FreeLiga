import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

type TabKey = 'SEND_NOW' | 'SCHEDULED';
type TargetType = 'ALL' | 'GROUP' | 'USER';
type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

interface NotificationTemplate {
    key: string;
    category: 'ON_DEMAND' | 'SCHEDULED';
    label: string;
    description: string;
    defaultTitle: string;
    defaultBody: string;
    defaultUrl: string;
}

interface TargetData {
    groups: Array<{ id: string; name: string; season: { name: string } }>;
    users: Array<{ id: string; email: string; player: { name: string } | null }>;
}

interface Campaign {
    id: string;
    type: 'ON_DEMAND' | 'SCHEDULED';
    templateKey: string;
    title: string;
    body: string;
    createdAt: string;
    createdBy: { email: string; player?: { name: string } | null };
    status: CampaignStatus;
    nextRunAt?: string | null;
    lastRunAt?: string | null;
    metrics: { totalSent: number; totalFailed: number; totalRuns: number };
}

interface AdoptionMetrics {
    push: {
        totalDevices: number;
        authenticatedDevices: number;
        publicDevices: number;
        usersWithPush: number;
    };
    pwa: {
        totalInstalledDevices: number;
        installsLast7Days: number;
        installsLast30Days: number;
        lastInstallAt: string | null;
    };
}

const targetOptions: Array<{ value: TargetType; label: string }> = [
    { value: 'ALL', label: 'Todos los suscritos' },
    { value: 'GROUP', label: 'Grupo concreto' },
    { value: 'USER', label: 'Jugador concreto' },
];

function formatDate(value?: string | null) {
    return value ? new Date(value).toLocaleString('es-ES') : '-';
}

function TargetSelector({
    targetType,
    targetValue,
    targets,
    onTargetTypeChange,
    onTargetValueChange,
}: {
    targetType: TargetType;
    targetValue: string;
    targets?: TargetData;
    onTargetTypeChange: (value: TargetType) => void;
    onTargetValueChange: (value: string) => void;
}) {
    return (
        <div className="space-y-2">
            <select
                value={targetType}
                onChange={(e) => onTargetTypeChange(e.target.value as TargetType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
            >
                {targetOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {targetType === 'GROUP' && (
                <select
                    value={targetValue}
                    onChange={(e) => onTargetValueChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                >
                    <option value="">Selecciona un grupo</option>
                    {(targets?.groups || []).map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.name} · {group.season.name}
                        </option>
                    ))}
                </select>
            )}

            {targetType === 'USER' && (
                <select
                    value={targetValue}
                    onChange={(e) => onTargetValueChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
                >
                    <option value="">Selecciona un jugador</option>
                    {(targets?.users || []).map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.player?.name || user.email}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}

export default function SendPushNotifications() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<TabKey>('SEND_NOW');
    const [search, setSearch] = useState('');

    const [sendForm, setSendForm] = useState({
        templateKey: '',
        title: '',
        body: '',
        url: '/dashboard',
        targetType: 'ALL' as TargetType,
        targetValue: '',
    });

    const [scheduledForm, setScheduledForm] = useState({
        templateKey: '',
        title: '',
        body: '',
        url: '/dashboard',
        targetType: 'ALL' as TargetType,
        targetValue: '',
    });

    const templatesQuery = useQuery({
        queryKey: ['admin-notification-templates'],
        queryFn: async () => (await api.get('/admin/notifications/templates')).data.templates as NotificationTemplate[],
    });

    const targetsQuery = useQuery({
        queryKey: ['admin-notification-targets', search],
        queryFn: async () =>
            (await api.get('/admin/notifications/targets', { params: { search: search || undefined } }))
                .data as TargetData,
    });

    const campaignsQuery = useQuery({
        queryKey: ['admin-notification-campaigns'],
        queryFn: async () => (await api.get('/admin/notifications/campaigns')).data.campaigns as Campaign[],
        refetchInterval: 45_000,
    });

    const adoptionMetricsQuery = useQuery({
        queryKey: ['admin-push-adoption-metrics'],
        queryFn: async () => (await api.get('/push/adoption-metrics')).data.metrics as AdoptionMetrics,
        refetchInterval: 45_000,
    });

    const onDemandTemplates = useMemo(
        () => (templatesQuery.data || []).filter((item) => item.category === 'ON_DEMAND'),
        [templatesQuery.data]
    );
    const scheduledTemplates = useMemo(
        () => (templatesQuery.data || []).filter((item) => item.category === 'SCHEDULED'),
        [templatesQuery.data]
    );
    const scheduledCampaigns = useMemo(
        () => (campaignsQuery.data || []).filter((item) => item.type === 'SCHEDULED'),
        [campaignsQuery.data]
    );
    const onDemandHistory = useMemo(
        () => (campaignsQuery.data || []).filter((item) => item.type === 'ON_DEMAND').slice(0, 8),
        [campaignsQuery.data]
    );

    const sendNowMutation = useMutation({
        mutationFn: async () =>
            (
                await api.post('/admin/notifications/send-now', {
                    ...sendForm,
                    targetValue: sendForm.targetType === 'ALL' ? undefined : sendForm.targetValue,
                })
            ).data,
        onSuccess: (data) => {
            showToast(`Notificacion enviada: ${data.result.sent} ok / ${data.result.failed} fallidas`, 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-notification-campaigns'] });
        },
        onError: (error: any) => showToast(error?.response?.data?.error || 'No se pudo enviar', 'error'),
    });

    const createScheduledMutation = useMutation({
        mutationFn: async () =>
            (
                await api.post('/admin/notifications/campaigns', {
                    ...scheduledForm,
                    timezone: 'Europe/Madrid',
                    status: 'ACTIVE',
                    targetValue: scheduledForm.targetType === 'ALL' ? undefined : scheduledForm.targetValue,
                })
            ).data,
        onSuccess: () => {
            showToast('Campana programada creada', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-notification-campaigns'] });
        },
        onError: (error: any) => showToast(error?.response?.data?.error || 'No se pudo crear', 'error'),
    });

    const patchCampaignMutation = useMutation({
        mutationFn: async (params: { id: string; payload: Record<string, string> }) =>
            (await api.patch(`/admin/notifications/campaigns/${params.id}`, params.payload)).data,
        onSuccess: () => {
            showToast('Campana actualizada', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-notification-campaigns'] });
        },
        onError: (error: any) => showToast(error?.response?.data?.error || 'No se pudo actualizar', 'error'),
    });

    const deleteCampaignMutation = useMutation({
        mutationFn: async (id: string) => (await api.delete(`/admin/notifications/campaigns/${id}`)).data,
        onSuccess: () => {
            showToast('Campana eliminada', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-notification-campaigns'] });
        },
        onError: (error: any) => showToast(error?.response?.data?.error || 'No se pudo eliminar', 'error'),
    });

    const applyTemplate = (templateKey: string, mode: TabKey) => {
        const source = mode === 'SEND_NOW' ? onDemandTemplates : scheduledTemplates;
        const template = source.find((entry) => entry.key === templateKey);
        if (!template) return;
        if (mode === 'SEND_NOW') {
            setSendForm((prev) => ({ ...prev, templateKey, title: template.defaultTitle, body: template.defaultBody, url: template.defaultUrl }));
            return;
        }
        setScheduledForm((prev) => ({ ...prev, templateKey, title: template.defaultTitle, body: template.defaultBody, url: template.defaultUrl }));
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-amber-600 to-amber-600">
                <h1 className="text-2xl font-bold">Centro de Notificaciones</h1>
                <p className="text-amber-100 mt-1">On-demand y automatizadas con targeting por jugador o grupo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">PWA instaladas</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {adoptionMetricsQuery.data?.pwa.totalInstalledDevices ?? '-'}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Instalaciones 7 dias</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {adoptionMetricsQuery.data?.pwa.installsLast7Days ?? '-'}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Dispositivos push</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {adoptionMetricsQuery.data?.push.totalDevices ?? '-'}
                    </p>
                    <p className="text-xs mt-1 text-slate-500">
                        auth {adoptionMetricsQuery.data?.push.authenticatedDevices ?? '-'} · public{' '}
                        {adoptionMetricsQuery.data?.push.publicDevices ?? '-'}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Usuarios con push</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {adoptionMetricsQuery.data?.push.usersWithPush ?? '-'}
                    </p>
                    <p className="text-xs mt-1 text-slate-500">
                        Ultima instalacion {formatDate(adoptionMetricsQuery.data?.pwa.lastInstallAt)}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-2">
                    <button onClick={() => setTab('SEND_NOW')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'SEND_NOW' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>Enviar ahora</button>
                    <button onClick={() => setTab('SCHEDULED')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'SCHEDULED' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>Programadas</button>
                </div>
                <div className="p-4 space-y-3">
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jugador/grupo" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />

                    {tab === 'SEND_NOW' && (
                        <div className="space-y-2">
                            <select value={sendForm.templateKey} onChange={(e) => applyTemplate(e.target.value, 'SEND_NOW')} className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700">
                                <option value="">Plantilla on-demand</option>
                                {onDemandTemplates.map((item) => (<option key={item.key} value={item.key}>{item.label}</option>))}
                            </select>
                            <TargetSelector targetType={sendForm.targetType} targetValue={sendForm.targetValue} targets={targetsQuery.data} onTargetTypeChange={(value) => setSendForm((prev) => ({ ...prev, targetType: value, targetValue: '' }))} onTargetValueChange={(value) => setSendForm((prev) => ({ ...prev, targetValue: value }))} />
                            <input value={sendForm.title} onChange={(e) => setSendForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titulo" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <textarea value={sendForm.body} onChange={(e) => setSendForm((prev) => ({ ...prev, body: e.target.value }))} rows={4} placeholder="Mensaje" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <input value={sendForm.url} onChange={(e) => setSendForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="URL" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <button onClick={() => sendNowMutation.mutate()} disabled={sendNowMutation.isPending || !sendForm.templateKey || (sendForm.targetType !== 'ALL' && !sendForm.targetValue)} className="w-full rounded-lg bg-amber-600 py-2 text-white disabled:bg-amber-300">{sendNowMutation.isPending ? 'Enviando...' : 'Enviar notificacion'}</button>
                        </div>
                    )}

                    {tab === 'SCHEDULED' && (
                        <div className="space-y-2">
                            <select value={scheduledForm.templateKey} onChange={(e) => applyTemplate(e.target.value, 'SCHEDULED')} className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700">
                                <option value="">Plantilla programada</option>
                                {scheduledTemplates.map((item) => (<option key={item.key} value={item.key}>{item.label}</option>))}
                            </select>
                            <TargetSelector targetType={scheduledForm.targetType} targetValue={scheduledForm.targetValue} targets={targetsQuery.data} onTargetTypeChange={(value) => setScheduledForm((prev) => ({ ...prev, targetType: value, targetValue: '' }))} onTargetValueChange={(value) => setScheduledForm((prev) => ({ ...prev, targetValue: value }))} />
                            <input value={scheduledForm.title} onChange={(e) => setScheduledForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Titulo" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <textarea value={scheduledForm.body} onChange={(e) => setScheduledForm((prev) => ({ ...prev, body: e.target.value }))} rows={4} placeholder="Mensaje" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <input value={scheduledForm.url} onChange={(e) => setScheduledForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="URL" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:bg-slate-900 dark:border-slate-700" />
                            <button onClick={() => createScheduledMutation.mutate()} disabled={createScheduledMutation.isPending || !scheduledForm.templateKey || (scheduledForm.targetType !== 'ALL' && !scheduledForm.targetValue)} className="w-full rounded-lg bg-green-600 py-2 text-white disabled:bg-green-300">{createScheduledMutation.isPending ? 'Guardando...' : 'Crear campana programada'}</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <h2 className="font-bold text-slate-900 dark:text-white">Programadas</h2>
                {scheduledCampaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                        <div className="flex justify-between gap-3">
                            <div>
                                <p className="font-semibold">{campaign.title}</p>
                                <p className="text-xs text-slate-500">{campaign.templateKey} · {campaign.status} · siguiente {formatDate(campaign.nextRunAt)}</p>
                                <p className="text-xs text-slate-500">runs {campaign.metrics.totalRuns} · sent {campaign.metrics.totalSent} · failed {campaign.metrics.totalFailed}</p>
                                <p className="text-xs text-slate-500">creada por {campaign.createdBy?.player?.name || campaign.createdBy?.email} ? {formatDate(campaign.createdAt)}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => patchCampaignMutation.mutate({ id: campaign.id, payload: { status: campaign.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED' } })} className="px-2 py-1 text-xs rounded bg-amber-600 text-white">{campaign.status === 'PAUSED' ? 'Reactivar' : 'Pausar'}</button>
                                <button
                                    onClick={() => {
                                        const title = window.prompt('Nuevo titulo', campaign.title);
                                        if (title === null) return;
                                        const body = window.prompt('Nuevo mensaje', campaign.body);
                                        if (body === null) return;
                                        patchCampaignMutation.mutate({
                                            id: campaign.id,
                                            payload: { title, body, status: campaign.status },
                                        });
                                    }}
                                    className="px-2 py-1 text-xs rounded bg-amber-600 text-white"
                                >
                                    Editar
                                </button>
                                <button onClick={() => deleteCampaignMutation.mutate(campaign.id)} className="px-2 py-1 text-xs rounded bg-red-600 text-white">Eliminar</button>
                            </div>
                        </div>
                    </div>
                ))}
                {scheduledCampaigns.length === 0 && <p className="text-sm text-slate-500">No hay campañas programadas.</p>}
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <h2 className="font-bold text-slate-900 dark:text-white">Historial on-demand</h2>
                {onDemandHistory.map((campaign) => (
                    <p key={campaign.id} className="text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(campaign.lastRunAt)} · {campaign.title} · sent {campaign.metrics.totalSent} · failed {campaign.metrics.totalFailed}
                    </p>
                ))}
                {onDemandHistory.length === 0 && <p className="text-sm text-slate-500">Sin envíos manuales recientes.</p>}
            </div>
        </div>
    );
}

