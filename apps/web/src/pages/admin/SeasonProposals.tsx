import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAdminQuery } from '../../hooks/useAdminQuery';

export default function SeasonProposals() {
 const { seasonId } = useParams();
 const navigate = useNavigate();
 const queryClient = useQueryClient();
 const [localEntries, setLocalEntries] = useState<any[]>([]);
 const [hasChanges, setHasChanges] = useState(false);
 const [showAddModal, setShowAddModal] = useState(false);
 const [selectedGroupId, setSelectedGroupId] = useState('');
 const [selectedPlayerId, setSelectedPlayerId] = useState('');
 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [groupDistribution, setGroupDistribution] = useState<Record<string, { name: string; count: number }>>({});

 const getPlayerStatsFromGroup = (groupDetail: any) => {
 const expectedMatches = Math.max((groupDetail?.groupPlayers?.length || 0) - 1, 0);
 const groupMatches = Array.isArray(groupDetail?.matches) ? groupDetail.matches : [];
 const groupPlayers = Array.isArray(groupDetail?.groupPlayers) ? groupDetail.groupPlayers : [];

 const legacyInjuryExposureByPlayer = new Map<string, number>();
 groupMatches.forEach((match: any) => {
 if (match.matchStatus !== 'INJURY' || match.winnerId) return;
 legacyInjuryExposureByPlayer.set(match.player1Id, (legacyInjuryExposureByPlayer.get(match.player1Id) ?? 0) + 1);
 legacyInjuryExposureByPlayer.set(match.player2Id, (legacyInjuryExposureByPlayer.get(match.player2Id) ?? 0) + 1);
 });

 const isPlayerInjuredInMatch = (match: any, playerId: string) => {
 if (match.matchStatus !== 'INJURY') return false;
 if (match.winnerId) {
 return (match.player1Id === playerId || match.player2Id === playerId) && match.winnerId !== playerId;
 }
 const p1Count = legacyInjuryExposureByPlayer.get(match.player1Id) ?? 0;
 const p2Count = legacyInjuryExposureByPlayer.get(match.player2Id) ?? 0;
 const inferredInjuredPlayerId = p1Count === p2Count
 ? match.player1Id
 : p1Count > p2Count
 ? match.player1Id
 : match.player2Id;
 return inferredInjuredPlayerId === playerId;
 };

 const statsByPlayer: Record<string, { losses: number; remaining: number; injuries: number; setAverage: number }> = {};

 for (const gp of groupPlayers) {
 const playerId = gp.playerId;
 const playerMatches = groupMatches.filter((m: any) => m.player1Id === playerId || m.player2Id === playerId);
 const playedMatches = playerMatches.filter((m: any) => m.gamesP1 !== null && m.gamesP2 !== null && m.matchStatus !== 'INJURY');
 const injuredMatches = playerMatches.filter((m: any) => isPlayerInjuredInMatch(m, playerId));
 const losses = playedMatches.filter((m: any) => m.winnerId && m.winnerId !== playerId).length;
 const remaining = Math.max(expectedMatches - playedMatches.length - injuredMatches.length, 0);

 let setsWon = 0;
 let setsLost = 0;
 for (const match of playedMatches) {
 if (match.player1Id === playerId) {
 setsWon += match.gamesP1 || 0;
 setsLost += match.gamesP2 || 0;
 } else {
 setsWon += match.gamesP2 || 0;
 setsLost += match.gamesP1 || 0;
 }
 }

 const setAverage = setsWon - setsLost;

 statsByPlayer[playerId] = {
 losses,
 remaining,
 injuries: injuredMatches.length,
 setAverage,
 };
 }

 return statsByPlayer;
 };

 // Fetch season details and closure
 const { data: season, isLoading, refetch } = useAdminQuery({
 queryKey: ['season-proposal', seasonId],
 queryFn: async () => {
 const { data: seasonData } = await api.get(`/seasons/${seasonId}`);
 const { data: groups } = await api.get('/groups');
 const seasonGroups = groups.filter((g: any) => g.seasonId === seasonId);

 // Sort groups
 seasonGroups.sort((a: any, b: any) => {
 const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
 const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
 return numA - numB;
 });

 const groupDetails = await Promise.all(
 seasonGroups.map(async (group: any) => {
 const { data } = await api.get(`/groups/${group.id}`);
 return data;
 })
 );

 const statsByPlayerId: Record<string, { losses: number; remaining: number; injuries: number; setAverage: number }> = {};
 for (const groupDetail of groupDetails) {
 const groupStats = getPlayerStatsFromGroup(groupDetail);
 Object.assign(statsByPlayerId, groupStats);
 }

 // Try to get existing closure
 try {
 const { data: closure } = await api.get(`/seasons/${seasonId}/closure`);
 return { ...seasonData, groups: seasonGroups, closure, statsByPlayerId };
 } catch (e) {
 // If not found, generate preview
 const { data: closure } = await api.post(`/seasons/${seasonId}/closure/preview`);
 return { ...seasonData, groups: seasonGroups, closure, statsByPlayerId };
 }
 },
 enabled: !!seasonId
 });

 // Initialize local state when data loads
 useEffect(() => {
 if (season?.closure?.entries) {
 setLocalEntries(season.closure.entries);
 }
 }, [season]);

 // Inactive or ungrouped players to optionally add
 const { data: candidateUsers } = useAdminQuery({
 queryKey: ['inactive-ungrouped-users'],
 queryFn: async () => {
 const { data } = await api.get('/users?page=1&limit=500');
 return data.users as any[];
 }
 });

 const candidatePlayers = (candidateUsers || []).filter((u: any) => {
 if (!u.player) return false;
 const noGroup = !u.player.currentGroup;
 const inactive = u.isActive === false;
 return noGroup || inactive;
 });

 const saveMutation = useMutation({
 mutationFn: async (entries: any[]) => {
 await api.put(`/seasons/${seasonId}/closure/entries`, {
 entries: entries.map(e => ({
 id: e.id,
 movementType: e.movementType,
 toGroupId: e.toGroupId
 }))
 });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
 setHasChanges(false);
 alert('Cambios guardados correctamente');
 },
 onError: (error: any) => {
 console.error('Error al guardar:', error);
 alert('Error al guardar los cambios: ' + (error?.response?.data?.error || error?.message || 'Error desconocido'));
 }
 });

 const approveMutation = useMutation({
 mutationFn: async () => {
 await api.post(`/seasons/${seasonId}/closure/approve`);
 },
 onSuccess: async () => {
 await queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
 await refetch();
 alert('Propuesta aprobada correctamente. Los movimientos se han aplicado. Ahora puedes generar la siguiente temporada.');
 },
 onError: () => {
 alert('Error al aprobar la propuesta');
 }
 });

 const toggleActiveMutation = useMutation({
 mutationFn: async (userId: string) => {
 await api.post(`/users/${userId}/toggle-active`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
 },
 onError: () => {
 alert('Error al cambiar el estado del jugador');
 }
 });

 const rolloverMutation = useMutation({
 mutationFn: async () => {
 await api.post(`/seasons/${seasonId}/rollover`, { importPlayers: true });
 },
 onSuccess: () => {
 alert('Nueva temporada generada con éxito.');
 navigate('/admin/seasons');
 },
 onError: () => {
 alert('Error al generar la nueva temporada');
 }
 });

 const addPlayerMutation = useMutation({
 mutationFn: async ({ playerId, toGroupId }: { playerId: string; toGroupId: string }) => {
 await api.post(`/seasons/${seasonId}/closure/entries/add`, { playerId, toGroupId });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
 setShowAddModal(false);
 setSelectedGroupId('');
 setSelectedPlayerId('');
 },
 onError: () => {
 alert('No se pudo añadir el jugador');
 }
 });

 const handleMovementChange = (playerId: string, newType: string) => {
 setLocalEntries(prev => prev.map(entry => {
 if (entry.playerId !== playerId) return entry;
 
 // Calculate toGroupId based on movement type
 const fromGroupIdx = season?.groups?.findIndex((g: any) => g.id === entry.fromGroupId) ?? -1;
 const isTop = fromGroupIdx === 0;
 const isBottom = fromGroupIdx === (season?.groups?.length ?? 1) - 1;
 
 let toGroupId = null;
 if (newType === 'PROMOTION' && !isTop) {
 // Go to group above (lower index)
 toGroupId = season?.groups?.[fromGroupIdx - 1]?.id ?? null;
 } else if (newType === 'RELEGATION' && !isBottom) {
 // Go to group below (higher index)
 toGroupId = season?.groups?.[fromGroupIdx + 1]?.id ?? null;
 }
 
 return { ...entry, movementType: newType, toGroupId };
 }));
 setHasChanges(true);
 };

 const handleSave = () => {
 // Calculate final player distribution
 const distribution: Record<string, { name: string; count: number }> = {};
 
 // Initialize with all groups
 season?.groups?.forEach((group: any) => {
 distribution[group.id] = {
 name: group.name,
 count: 0
 };
 });

 // Count players per group after movements
 localEntries.forEach((entry: any) => {
 const targetGroupId = entry.toGroupId || entry.fromGroupId;
 if (targetGroupId && distribution[targetGroupId]) {
 distribution[targetGroupId].count++;
 }
 });

 setGroupDistribution(distribution);
 setShowConfirmModal(true);
 };

 const confirmSave = () => {
 setShowConfirmModal(false);
 saveMutation.mutate(localEntries);
 };

 const getWinsScaleClass = (wins: number, minWins: number, maxWins: number, tieOnWins: boolean) => {
 if (maxWins === minWins) {
 return tieOnWins
 ? 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-200 ring-2 ring-amber-400/70 dark:ring-amber-500/60'
 : 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300';
 }

 const ratio = (wins - minWins) / (maxWins - minWins);

 if (ratio >= 0.85) {
 return `bg-amber-300 text-amber-900 dark:bg-amber-500/40 dark:text-amber-200 ${tieOnWins ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/60' : ''}`;
 }
 if (ratio >= 0.6) {
 return `bg-amber-200 text-amber-900 dark:bg-amber-600/30 dark:text-amber-200 ${tieOnWins ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/60' : ''}`;
 }
 if (ratio >= 0.35) {
 return `bg-amber-100 text-amber-800 dark:bg-amber-700/20 dark:text-amber-300 ${tieOnWins ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/60' : ''}`;
 }
 if (ratio > 0) {
 return `bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 ${tieOnWins ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/60' : ''}`;
 }

 return tieOnWins
 ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300 ring-2 ring-amber-400/70 dark:ring-amber-500/60'
 : 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300';
 };

 if (isLoading) {
 return <div className="p-8 text-center">Cargando propuesta...</div>;
 }

 if (!season) {
 return <div className="p-8 text-center">Temporada no encontrada</div>;
 }

 const isApproved = season.closure?.status === 'APPROVED';

 // Calculate statistics
 const promotions = localEntries.filter(e => e.movementType === 'PROMOTION').length;
 const relegations = localEntries.filter(e => e.movementType === 'RELEGATION').length;
 const stays = localEntries.filter(e => e.movementType === 'STAY').length;

 return (
 <div className="space-y-8">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Propuesta de Movimientos</h1>
 <p className="text-slate-600 dark:text-slate-400 mt-1">
 Temporada: {season.name} {isApproved && <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">APROBADA</span>}
 </p>
 </div>
 <div className="flex gap-3">
 <Link
 to="/admin/seasons"
 className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
 >
 Volver
 </Link>

 {!isApproved && hasChanges && (
 <button
 onClick={handleSave}
 disabled={saveMutation.isPending}
 className="px-4 py-2 club-btn-yellow shadow-lg animate-pulse"
 >
 {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
 </button>
 )}

 {!isApproved && !hasChanges && (
 <button
 onClick={() => {
 if (window.confirm('¿Estás seguro de aprobar esta propuesta? Esto aplicará los movimientos a los jugadores.')) {
 approveMutation.mutate();
 }
 }}
 disabled={approveMutation.isPending}
 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
 >
 {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Propuesta'}
 </button>
 )}

 {isApproved && (
 <button
 onClick={() => {
 if (window.confirm('¿Generar la siguiente temporada importando estos jugadores?')) {
 rolloverMutation.mutate();
 }
 }}
 disabled={rolloverMutation.isPending}
 className="px-4 py-2 club-btn-yellow"
 >
 {rolloverMutation.isPending ? 'Generando...' : 'Generar Siguiente Temporada'}
 </button>
 )}
 </div>
 </div>

 {/* Summary Statistics */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
 <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Total Jugadores</div>
 <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{localEntries.length}</div>
 </div>
 <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
 <div className="text-sm font-medium text-green-600 dark:text-green-400">Ascensos</div>
 <div className="text-3xl font-bold text-green-900 dark:text-green-100">{promotions}</div>
 </div>
 <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
 <div className="text-sm font-medium text-red-600 dark:text-red-400">Descensos</div>
 <div className="text-3xl font-bold text-red-900 dark:text-red-100">{relegations}</div>
 </div>
 <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
 <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Mantienen</div>
 <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stays}</div>
 </div>
 <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
 <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Desactivados</div>
 <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
 {localEntries.filter((e: any) => e.player?.user?.isActive === false).length}
 </div>
 </div>
 </div>

 {isApproved && (
 <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 rounded-lg p-6">
 <div className="flex items-start gap-4">
 <div className="text-4xl">✅</div>
 <div>
 <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">Propuesta Aprobada</h3>
 <p className="text-green-800 dark:text-green-200 mt-2">
 Los movimientos han sido registrados en el historial de los jugadores. Los cambios serán aplicados cuando generes la siguiente temporada.
 </p>
 <div className="mt-4 space-y-1 text-sm text-green-700 dark:text-green-300">
 <p>{promotions} jugador(es) ascendido(s)</p>
 <p>{relegations} jugador(es) descendido(s)</p>
 <p>{stays} jugador(es) mantiene(n) grupo</p>
 </div>
 </div>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
 {season.groups.map((group: any) => {
 // Get entries for this group to have correct ranking
 const groupEntries = localEntries.filter((e: any) => e.fromGroupId === group.id).sort((a: any, b: any) => a.finalRank - b.finalRank);
 const winsCountByValue = groupEntries.reduce((acc: Record<number, number>, entry: any) => {
 const wins = entry.matchesWon || 0;
 acc[wins] = (acc[wins] || 0) + 1;
 return acc;
 }, {});
 const winsValues = groupEntries.map((entry: any) => entry.matchesWon || 0);
 const minWins = winsValues.length ? Math.min(...winsValues) : 0;
 const maxWins = winsValues.length ? Math.max(...winsValues) : 0;

 return (
 <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
 <h3 className="font-bold text-lg text-slate-900 dark:text-white">{group.name}</h3>
 <div className="flex items-center gap-2">
 <Link
 to={`/groups/${group.id}`}
 className="text-xs px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
 title="Ver clasificación del grupo"
 >
 Ver más
 </Link>
 <button
 disabled={!candidatePlayers.length || addPlayerMutation.isPending}
 onClick={() => {
 setSelectedGroupId(group.id);
 setShowAddModal(true);
 setSelectedPlayerId(candidatePlayers[0]?.player?.id || '');
 }}
 className="text-xs px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
 title={candidatePlayers.length ? 'Añadir jugador inactivo o sin grupo' : 'No hay jugadores disponibles'}
 >
 + Player
 </button>
 </div>
 </div>
 <div className="grid grid-cols-[minmax(150px,1fr)_40px_34px_34px_34px_44px_minmax(120px,1fr)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70">
 <span className="pl-9">Jugador</span>
 <span className="text-center">W</span>
 <span className="text-center">D</span>
 <span className="text-center">R</span>
 <span className="text-center">Les</span>
 <span className="text-center">±</span>
 <span>Movimiento</span>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
 {groupEntries.map((entry: any) => {
 const movement = entry.movementType || 'STAY';

 let statusColor = 'text-slate-500';
 if (movement === 'PROMOTION') statusColor = 'text-green-600 dark:text-green-400';
 if (movement === 'RELEGATION') statusColor = 'text-red-600 dark:text-red-400';

 const isActive = entry.player?.user?.isActive !== false;
 const userId = entry.player?.user?.id;
 const playerStats = season?.statsByPlayerId?.[entry.playerId] || { losses: 0, remaining: 0, injuries: 0, setAverage: 0 };
 const wins = entry.matchesWon || 0;
 const tieOnWins = (winsCountByValue[wins] || 0) > 1;
 const winsClass = getWinsScaleClass(wins, minWins, maxWins, tieOnWins);

 return (
 <div 
 key={entry.playerId} 
 className={`px-4 py-2 hover:transition-colors ${
 !isActive 
 ? 'bg-red-50 dark:bg-red-900/20 opacity-60' 
 : movement === 'PROMOTION'
 ? 'bg-green-50 dark:bg-green-900/20'
 : movement === 'RELEGATION'
 ? 'bg-red-50 dark:bg-red-900/20'
 : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
 }`}
 >
 <div className="grid grid-cols-[minmax(150px,1fr)_40px_34px_34px_34px_44px_minmax(120px,1fr)] items-start gap-2">
 <div className="flex items-center gap-3 min-w-0">
 <span className="font-mono text-sm text-slate-400 w-6 shrink-0">#{entry.finalRank}</span>
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <span className={`font-medium leading-tight whitespace-normal ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
 {entry.player.name}
 </span>
 {!isActive && (
 <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium shrink-0">
 Desactivado
 </span>
 )}
 </div>
 </div>
 </div>

 <span className={`text-xs inline-flex h-7 w-10 items-center justify-center rounded-full font-semibold ${winsClass}`} title={tieOnWins ? 'Empate en victorias dentro del grupo' : 'Victorias'}>
 {wins}
 </span>
 <span className="text-sm text-center font-semibold text-rose-600 dark:text-rose-300 pt-1">{playerStats.losses}</span>
 <span className="text-sm text-center font-semibold text-yellow-600 dark:text-yellow-300 pt-1">{playerStats.remaining}</span>
 <span className="text-sm text-center font-semibold text-orange-600 dark:text-orange-300 pt-1">{playerStats.injuries}</span>
 <span className={`text-sm text-center font-semibold pt-1 ${playerStats.setAverage > 0 ? 'text-green-600 dark:text-green-300' : playerStats.setAverage < 0 ? 'text-red-600 dark:text-red-300' : 'text-slate-500 dark:text-slate-300'}`}>
 {playerStats.setAverage > 0 ? `+${playerStats.setAverage}` : playerStats.setAverage}
 </span>

 {isApproved ? (
 <div className="flex items-center gap-2 min-w-0">
 <div className={`text-xs font-bold ${statusColor} whitespace-nowrap`}>
 {movement === 'STAY' && 'Mantiene'}
 {movement === 'PROMOTION' && 'Asciende'}
 {movement === 'RELEGATION' && 'Desciende'}
 </div>
 {userId && (
 <select
 value=""
 onChange={(e) => {
 const selectedValue = e.target.value;
 if (selectedValue !== 'TOGGLE') return;

 if (window.confirm(`¿${isActive ? 'Desactivar' : 'Activar'} a ${entry.player.name}? ${!isActive ? 'Podrá participar en la siguiente temporada.' : 'NO participará en la siguiente temporada.'}`)) {
 toggleActiveMutation.mutate(userId);
 }
 }}
 className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-slate-500 dark:text-slate-300 min-w-0"
 >
 <option value="">Acción </option>
 <option value="TOGGLE">{isActive ? 'Desactivar' : 'Activar'}</option>
 </select>
 )}
 </div>
 ) : (
 <select
 value={movement}
 onChange={(e) => {
 const selectedValue = e.target.value;

 if (selectedValue.startsWith('TOGGLE:')) {
 if (!userId) return;
 if (window.confirm(`¿${isActive ? 'Desactivar' : 'Activar'} a ${entry.player.name}? ${!isActive ? 'Podrá participar en la siguiente temporada.' : 'NO participará en la siguiente temporada.'}`)) {
 toggleActiveMutation.mutate(userId);
 }
 return;
 }

 handleMovementChange(entry.playerId, selectedValue);
 }}
 className={`text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer ${statusColor} whitespace-nowrap w-full min-w-0`}
 >
 <option value="STAY">Mantiene </option>
 <option value="PROMOTION">Asciende </option>
 <option value="RELEGATION">Desciende </option>
 {userId && (
 <option value={`TOGGLE:${userId}`}>
 {isActive ? 'Desactivar' : 'Activar'}
 </option>
 )}
 </select>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>

 {showAddModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Añadir jugador al grupo</h3>
 <div className="space-y-3">
 <div>
 <div className="text-sm text-slate-600 dark:text-slate-300">Grupo destino</div>
 <div className="font-semibold text-slate-900 dark:text-white">
 {season.groups.find((g: any) => g.id === selectedGroupId)?.name || '-'}
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Jugador</label>
 <select
 value={selectedPlayerId}
 onChange={e => setSelectedPlayerId(e.target.value)}
 className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
 >
 {candidatePlayers.map((u: any) => (
 <option key={u.player.id} value={u.player.id}>
 {u.player.name} ({u.email}) {u.isActive === false ? '⬢ Inactivo' : ''} {u.player.currentGroup ? '⬢ Tiene grupo' : '⬢ Sin grupo'}
 </option>
 ))}
 </select>
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400">
 Se añadirá a la propuesta para la siguiente temporada en este grupo.
 </p>
 <div className="flex gap-3 pt-2">
 <button
 onClick={() => setShowAddModal(false)}
 className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
 >
 Cancelar
 </button>
 <button
 disabled={!selectedPlayerId || addPlayerMutation.isPending}
 onClick={() => {
 if (!selectedPlayerId || !selectedGroupId) return;
 addPlayerMutation.mutate({ playerId: selectedPlayerId, toGroupId: selectedGroupId });
 }}
 className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
 >
 {addPlayerMutation.isPending ? 'Añadiendo...' : 'Añadir'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Confirmation Modal */}
 {showConfirmModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
 <div className="p-6 space-y-4">
 <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Confirmar Cambios</h2>
 <p className="text-slate-600 dark:text-slate-400">
 Revisa la distribución final de jugadores por grupo:
 </p>
 <div className="space-y-2">
 {Object.entries(groupDistribution).map(([groupId, { name, count }]) => (
 <div
 key={groupId}
 className={`p-3 rounded-lg flex justify-between items-center ${
 count !== 8
 ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600'
 : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
 }`}
 >
 <span className="font-semibold text-slate-900 dark:text-white">{name}</span>
 <span
 className={`px-3 py-1 rounded-full font-bold ${
 count !== 8
 ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
 : 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'
 }`}
 >
 {count} jugadores
 </span>
 </div>
 ))}
 </div>
 {Object.values(groupDistribution).some(g => g.count !== 8) && (
 <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
 <p className="text-sm text-amber-900 dark:text-amber-200 font-semibold">
 Atención: Algunos grupos no tienen exactamente 8 jugadores
 </p>
 </div>
 )}
 <div className="flex gap-3 pt-4">
 <button
 onClick={() => setShowConfirmModal(false)}
 className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
 >
 Cancelar
 </button>
 <button
 onClick={confirmSave}
 disabled={saveMutation.isPending}
 className="flex-1 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
 >
 {saveMutation.isPending ? 'Guardando...' : 'Confirmar y Guardar'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}






