export default function AdminHelp() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">🛠️ Manual de Administrador</h1>
                <p className="text-purple-100">Guía completa para gestionar FreeSquash League</p>
            </div>

            {/* Introducción */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Responsabilidades del Administrador</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Como administrador de FreeSquash League, eres el responsable de que la liga funcione correctamente. 
                    Tu trabajo principal es organizar las temporadas, crear los grupos de jugadores, y gestionar los ascensos 
                    y descensos al final de cada temporada.
                </p>
                <div className="space-y-3 text-slate-600 dark:text-slate-400 mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué hace un administrador?</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li><strong>Crear y activar temporadas:</strong> Decides cuándo empieza y termina cada período de competición</li>
                        <li><strong>Organizar grupos:</strong> Distribuyes a los jugadores en grupos según su nivel</li>
                        <li><strong>Gestionar jugadores:</strong> Das de alta nuevos jugadores, actualizas sus datos, o los desactivas si se dan de baja</li>
                        <li><strong>Cerrar temporadas:</strong> Al final de cada temporada, decides quién sube, quién baja y quién se mantiene en su grupo</li>
                        <li><strong>Resolver problemas:</strong> Atiendes los reportes de bugs y dudas de los jugadores</li>
                    </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>⚠️ Muy Importante - Protección de Datos Históricos:</strong><br/>
                        El sistema protege automáticamente toda la información histórica de la liga. Esto significa que:
                    </p>
                    <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
                        <li>No puedes eliminar temporadas que tienen grupos, partidos o cierres guardados</li>
                        <li>No puedes eliminar usuarios (solo desactivarlos)</li>
                        <li>Los cierres de temporada son permanentes una vez aprobados</li>
                    </ul>
                    <p className="text-sm mt-2">Esto asegura que nunca se pierda el historial de la liga, los ascensos/descensos pasados, ni las estadísticas de los jugadores.</p>
                </div>
            </section>

            {/* Navegación */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🧭 Cómo Navegar como Administrador</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Cuando inicias sesión como administrador, ves un menú especial en la parte superior de la página con estas opciones:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                        <li><strong>Dashboard:</strong> Página principal con estadísticas generales</li>
                        <li><strong>Usuarios:</strong> Lista de todos los jugadores, donde puedes crear, editar o desactivar usuarios</li>
                        <li><strong>Temporadas:</strong> Gestión de todas las temporadas (crear nuevas, activar, ver detalles)</li>
                        <li><strong>Grupos:</strong> Creación y gestión de grupos de jugadores</li>
                        <li><strong>Bugs:</strong> Reportes de problemas enviados por los jugadores</li>
                        <li><strong>Ver todos los partidos:</strong> Historial completo de todos los partidos de la liga</li>
                        <li><strong>📚 Ayuda:</strong> Este manual que estás leyendo ahora</li>
                    </ul>
                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 mt-4">
                        <p className="text-sm"><strong>💡 Consejo:</strong> Al principio puede parecer complicado, pero el orden lógico de trabajo es: 1) Crear temporada → 2) Crear grupos → 3) Asignar jugadores a grupos → 4) Activar temporada → 5) Al final de temporada: cerrar y generar siguiente temporada.</p>
                    </div>
                </div>
            </section>

            {/* Dashboard Admin */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📊 Panel de Administrador</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Vista General</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Estadísticas Totales:</strong> Jugadores, grupos, temporadas y partidos totales</li>
                            <li><strong>Temporada Activa:</strong> Información de la temporada en curso con sus grupos</li>
                            <li><strong>Partidos Recientes:</strong> Últimos 10 partidos registrados en todas las temporadas</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Gestión de Usuarios */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">👥 Gestión de Usuarios</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Crear Usuario</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Haz clic en "Crear Usuario"</li>
                            <li>Completa el formulario:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Email (único en el sistema)</li>
                                    <li>Contraseña (se recomienda '123456' como temporal)</li>
                                    <li>Nombre completo del jugador</li>
                                    <li>Apodo (opcional)</li>
                                    <li>Teléfono (para contacto entre jugadores)</li>
                                    <li>Rol: PLAYER o ADMIN</li>
                                    <li>Grupo (temporada activa, opcional)</li>
                                </ul>
                            </li>
                            <li>El sistema crea automáticamente el usuario y el jugador asociado</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Editar Usuario</h3>
                        <p>Puedes modificar todos los datos del usuario excepto el email. Actualiza nombre, apodo, teléfono o cambia el grupo del jugador.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Activar/Desactivar Usuarios</h3>
                        <p>Los usuarios desactivados no pueden iniciar sesión ni aparecen en las propuestas de nueva temporada. Útil para jugadores que se dan de baja temporalmente.</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                        <p className="text-sm"><strong>⚠️ Nota:</strong> No se pueden eliminar usuarios, solo desactivarlos para preservar el historial.</p>
                    </div>
                </div>
            </section>

            {/* Gestión de Temporadas */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📅 Gestión de Temporadas</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Crear Temporada</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Ve a "Gestionar Temporadas"</li>
                            <li>Haz clic en "Nueva Temporada"</li>
                            <li>Ingresa:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Nombre (ej: "Temporada 2025-Nov-Dic")</li>
                                    <li>Fecha de inicio</li>
                                    <li>Fecha de fin</li>
                                </ul>
                            </li>
                            <li>La temporada se crea vacía (sin grupos ni jugadores)</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Marcar como Activa</h3>
                        <p>Solo puede haber una temporada activa a la vez. Al marcar una como activa, automáticamente se desactivan las demás. La temporada activa es donde se registran nuevos partidos.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Eliminar Temporada</h3>
                        <p>Solo se pueden eliminar temporadas completamente vacías (sin grupos, sin partidos, sin cierres). Esto protege el historial.</p>
                    </div>
                </div>
            </section>

            {/* Gestión de Grupos */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🏆 Gestión de Grupos</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Crear Grupo</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Haz clic en "Crear Grupo"</li>
                            <li>Asigna un nombre (ej: "Grupo 1", "Grupo 2")</li>
                            <li>Selecciona la temporada</li>
                            <li>El grupo se crea vacío, sin jugadores</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Asignar Jugadores</h3>
                        <p>Desde el detalle del grupo, puedes añadir jugadores uno por uno. El sistema actualiza automáticamente el ranking cuando se registran partidos.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Exportar Datos</h3>
                        <p>Cada grupo tiene un botón para exportar la clasificación en formato CSV para análisis externo.</p>
                    </div>
                </div>
            </section>

            {/* Propuestas de Temporada */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🔄 Propuestas y Cierre de Temporada</h2>
                <div className="space-y-6 text-slate-600 dark:text-slate-400">
                    
                    {/* Introducción al proceso */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                        <p className="text-sm">
                            <strong>📌 Visión General:</strong> El cierre de temporada es el proceso más importante de la administración de la liga. 
                            Aquí decides quién sube, quién baja y quién se mantiene, y luego generas automáticamente la nueva temporada con los grupos ya configurados.
                            Este proceso consta de <strong>3 fases distintas</strong> que debes completar en orden.
                        </p>
                    </div>

                    {/* FASE 1: Generación de la Propuesta */}
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-lg">📋 FASE 1: Generación de la Propuesta Automática</h3>
                        <div className="space-y-3 ml-4">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white mb-2">¿Cómo se crea la propuesta inicial?</p>
                                <ol className="list-decimal list-inside space-y-2 ml-4">
                                    <li>Ve a <strong>"Propuestas de Temporada"</strong> en el menú de administrador</li>
                                    <li>Selecciona la temporada que quieres cerrar de la lista</li>
                                    <li>Haz clic en <strong>"Generar Propuesta"</strong></li>
                                    <li>El sistema analiza automáticamente todos los grupos y crea una propuesta basándose en las clasificaciones finales</li>
                                </ol>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mt-3">
                                <p className="font-medium text-slate-900 dark:text-white mb-2">🤖 ¿Cómo decide el sistema los ascensos y descensos?</p>
                                <p className="mb-2">El sistema aplica estas reglas automáticamente:</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li><strong>Top 2 de cada grupo → ASCENSO:</strong> Los 2 primeros clasificados suben al grupo superior (excepto si ya están en el Grupo 1)</li>
                                    <li><strong>Últimos 2 de cada grupo → DESCENSO:</strong> Los 2 últimos clasificados bajan al grupo inferior (excepto si ya están en el grupo más bajo)</li>
                                    <li><strong>Posiciones 3 a N-2 → SE MANTIENEN:</strong> Los jugadores del medio permanecen en el mismo grupo</li>
                                    <li><strong>Grupo 1 (el mejor):</strong> Los primeros se mantienen porque ya están en lo más alto</li>
                                    <li><strong>Último grupo:</strong> Los últimos se mantienen porque ya están en el grupo más bajo</li>
                                </ul>
                            </div>

                            <div className="mt-3">
                                <p className="font-medium text-slate-900 dark:text-white mb-2">📊 Ejemplo práctico:</p>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                    <p className="mb-2">Imagina que tienes 3 grupos (Grupo 1, Grupo 2, Grupo 3) con 8 jugadores cada uno:</p>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-green-700 dark:text-green-400">Grupo 1 (el mejor):</p>
                                            <ul className="ml-6 mt-1">
                                                <li>• Posiciones 1-2: SE MANTIENEN (ya están arriba del todo)</li>
                                                <li>• Posiciones 3-6: SE MANTIENEN (centro del grupo)</li>
                                                <li>• Posiciones 7-8: DESCIENDEN a Grupo 2</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-700 dark:text-blue-400">Grupo 2 (intermedio):</p>
                                            <ul className="ml-6 mt-1">
                                                <li>• Posiciones 1-2: ASCIENDEN a Grupo 1</li>
                                                <li>• Posiciones 3-6: SE MANTIENEN en Grupo 2</li>
                                                <li>• Posiciones 7-8: DESCIENDEN a Grupo 3</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-orange-700 dark:text-orange-400">Grupo 3 (principiantes):</p>
                                            <ul className="ml-6 mt-1">
                                                <li>• Posiciones 1-2: ASCIENDEN a Grupo 2</li>
                                                <li>• Posiciones 3-6: SE MANTIENEN en Grupo 3</li>
                                                <li>• Posiciones 7-8: SE MANTIENEN (ya están abajo del todo)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FASE 2: Revisión y Ajustes */}
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-lg">✏️ FASE 2: Revisión y Ajustes Manuales (Opcional)</h3>
                        <div className="space-y-3 ml-4">
                            <p>Una vez generada la propuesta automática, tienes la oportunidad de hacer ajustes antes de aprobarla:</p>
                            
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white mb-2">🔄 Mover jugadores entre grupos</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Puedes arrastrar y soltar jugadores a diferentes grupos si crees que la propuesta automática no es justa</li>
                                    <li>Por ejemplo: si un jugador ha tenido lesiones y no pudo jugar todos sus partidos</li>
                                    <li>O si quieres equilibrar mejor los niveles entre grupos</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-slate-900 dark:text-white mb-2">➕ Añadir jugadores nuevos</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Puedes incorporar jugadores que no participaron en la temporada actual</li>
                                    <li>Asígnalos directamente al grupo que consideres apropiado según su nivel</li>
                                    <li>Estos aparecerán como "NUEVO" en el historial de movimientos</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-slate-900 dark:text-white mb-2">🚫 Desactivar jugadores</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Si alguien no va a continuar, márcalo como inactivo</li>
                                    <li>Los jugadores desactivados no aparecerán en la siguiente temporada</li>
                                    <li>Su historial se conserva pero quedan fuera de los grupos activos</li>
                                </ul>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-3">
                                <p className="text-sm">
                                    <strong>💡 Consejo:</strong> Si haces cambios manuales, haz clic en <strong>"Guardar Cambios"</strong> antes de aprobar la propuesta.
                                    Esto actualiza la propuesta con tus ajustes. Puedes guardar varias veces hasta estar satisfecho.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FASE 3: Aprobación y Generación */}
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-lg">✅ FASE 3: Aprobación y Generación de la Nueva Temporada</h3>
                        <div className="space-y-3 ml-4">
                            <p>Una vez que la propuesta está perfecta, hay DOS PASOS FINALES que debes hacer EN ORDEN:</p>
                            
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <p className="font-bold text-purple-900 dark:text-purple-300 mb-3">PASO 1: Aprobar la Propuesta</p>
                                <ul className="list-disc list-inside ml-4 space-y-2">
                                    <li>Haz clic en el botón <strong>"Aprobar Propuesta"</strong></li>
                                    <li>Esto crea el <strong>historial permanente</strong> de movimientos (ascensos, descensos, etc.)</li>
                                    <li>Se guarda en la base de datos como registro histórico de la temporada</li>
                                    <li>Una vez aprobado, <strong>NO SE PUEDE DESHACER</strong> (protección de datos históricos)</li>
                                    <li>El sistema marca la propuesta como "Aprobada"</li>
                                </ul>
                                <div className="mt-3 p-3 bg-purple-100 dark:bg-purple-900/40 rounded border border-purple-300 dark:border-purple-700">
                                    <p className="text-sm font-medium">⚠️ Después de este paso, la propuesta queda congelada. Asegúrate de que todo esté correcto antes de aprobar.</p>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4">
                                <p className="font-bold text-green-900 dark:text-green-300 mb-3">PASO 2: Generar la Siguiente Temporada</p>
                                <p className="mb-3">Después de aprobar, aparece un nuevo botón verde: <strong>"Generar Siguiente Temporada"</strong></p>
                                
                                <div className="mb-3">
                                    <p className="font-medium text-slate-900 dark:text-white mb-2">¿Qué hace este botón exactamente?</p>
                                    <ol className="list-decimal list-inside ml-4 space-y-2">
                                        <li><strong>Crea una nueva temporada:</strong>
                                            <ul className="list-disc list-inside ml-6 mt-1">
                                                <li>Le asigna un nombre automático (ej: "Temporada 2026-Ene-Feb" si estamos en enero)</li>
                                                <li>Calcula fechas de inicio y fin (2 meses por defecto desde hoy)</li>
                                                <li>La deja en estado INACTIVA (aún no se puede jugar)</li>
                                            </ul>
                                        </li>
                                        <li><strong>Replica los grupos existentes:</strong>
                                            <ul className="list-disc list-inside ml-6 mt-1">
                                                <li>Crea exactamente los mismos grupos que tenía la temporada anterior</li>
                                                <li>Mantiene los mismos nombres (Grupo 1, Grupo 2, Grupo 3...)</li>
                                                <li>Los grupos empiezan vacíos (sin jugadores aún)</li>
                                            </ul>
                                        </li>
                                        <li><strong>Asigna jugadores según la propuesta aprobada:</strong>
                                            <ul className="list-disc list-inside ml-6 mt-1">
                                                <li>Lee la propuesta que acabas de aprobar</li>
                                                <li>Coloca a cada jugador en el grupo correspondiente según sus ascensos/descensos</li>
                                                <li>Los jugadores desactivados NO se añaden</li>
                                                <li>Los jugadores nuevos se colocan en los grupos que especificaste</li>
                                            </ul>
                                        </li>
                                        <li><strong>Inicializa rankings:</strong>
                                            <ul className="list-disc list-inside ml-6 mt-1">
                                                <li>Todos los jugadores empiezan con ranking 0-0 (sin partidos)</li>
                                                <li>Las posiciones iniciales se asignan en el orden en que fueron añadidos al grupo</li>
                                            </ul>
                                        </li>
                                    </ol>
                                </div>

                                <div className="bg-green-100 dark:bg-green-900/40 rounded border border-green-300 dark:border-green-700 p-3">
                                    <p className="text-sm font-medium mb-2">✅ Resultado final:</p>
                                    <p className="text-sm">Tendrás una nueva temporada lista con todos los grupos formados y todos los jugadores ya asignados a sus grupos correspondientes. 
                                    Solo falta que la <strong>actives</strong> cuando quieras que empiece a contar para la clasificación.</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                                <p className="font-medium text-slate-900 dark:text-white mb-2">🎯 Última acción: Activar la nueva temporada</p>
                                <ol className="list-decimal list-inside ml-4 space-y-1">
                                    <li>Ve a "Gestionar Temporadas"</li>
                                    <li>Busca la temporada recién creada</li>
                                    <li>Haz clic en "Marcar como Activa"</li>
                                    <li>Esto desactiva automáticamente la temporada anterior</li>
                                    <li>Los jugadores ya pueden empezar a registrar partidos</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Resumen visual del flujo completo */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border-2 border-slate-300 dark:border-slate-600">
                        <p className="font-bold text-slate-900 dark:text-white mb-3 text-center">📍 RESUMEN: Flujo Completo del Cierre de Temporada</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">1.</span>
                                <span>Generar Propuesta automática (sistema calcula ascensos/descensos)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">2.</span>
                                <span>Revisar y ajustar manualmente si es necesario</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[20px]">3.</span>
                                <span>Guardar Cambios (si hiciste ajustes)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-purple-600 dark:text-purple-400 min-w-[20px]">4.</span>
                                <span><strong>Aprobar Propuesta</strong> (se guarda el historial permanente)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">5.</span>
                                <span><strong>Generar Siguiente Temporada</strong> (crea temporada + grupos + asigna jugadores)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">6.</span>
                                <span>Marcar la nueva temporada como Activa (desde Gestionar Temporadas)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-green-600 dark:text-green-400 min-w-[20px]">7.</span>
                                <span>¡Listo! Los jugadores pueden empezar a jugar partidos</span>
                            </div>
                        </div>
                    </div>

                    {/* Advertencia importante */}
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
                        <p className="text-sm"><strong>⚠️ MUY IMPORTANTE:</strong> No confundas "Aprobar Propuesta" con "Generar Siguiente Temporada". 
                        Son DOS PASOS SEPARADOS. Primero apruebas (guarda historial), luego generas (crea temporada nueva). 
                        Si solo apruebas sin generar, no tendrás nueva temporada. Si intentas generar sin aprobar, el sistema te dará error.</p>
                    </div>
                </div>
            </section>

            {/* Historial de Jugadores */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📈 Historial de Jugadores</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Vista global de la evolución de todos los jugadores a lo largo de las temporadas.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Gráficos Disponibles</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Jugadores Totales:</strong> Evolución del número de jugadores activos</li>
                            <li><strong>Desactivaciones:</strong> Jugadores que se han dado de baja por temporada</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Gestión de Bugs */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🐛 Gestión de Reportes</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Los jugadores pueden reportar problemas que aparecen en esta sección.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Estados de Bugs</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>OPEN:</strong> Bug reportado, pendiente de revisar</li>
                            <li><strong>IN_PROGRESS:</strong> Se está trabajando en la solución</li>
                            <li><strong>RESOLVED:</strong> Bug solucionado</li>
                            <li><strong>CLOSED:</strong> Bug cerrado y verificado</li>
                        </ul>
                    </div>
                    <p>Cambia el estado según el progreso de la resolución.</p>
                </div>
            </section>

            {/* Solución de Problemas Admin */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🔧 Problemas Comunes y Soluciones</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"No puedo eliminar una temporada"</h3>
                        <p>Esto es normal y es por diseño. Solo puedes eliminar temporadas que estén completamente vacías (sin grupos, sin partidos, sin cierres). Si intentas eliminar una temporada con datos, el sistema te mostrará un mensaje detallado de qué contiene. Esto protege el historial de la liga.</p>
                        <p className="mt-2"><strong>Solución:</strong> Si quieres "ocultar" una temporada antigua, simplemente desactívala (quítale el estado de "activa"). Seguirá en el sistema pero no se mostrará como la temporada en curso.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Aprobé la propuesta pero no se creó la nueva temporada"</h3>
                        <p>El proceso de cierre tiene DOS pasos separados:</p>
                        <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                            <li><strong>Aprobar Propuesta:</strong> Esto guarda el historial de ascensos/descensos de forma permanente</li>
                            <li><strong>Generar Siguiente Temporada:</strong> Esto crea la nueva temporada con los grupos y jugadores según la propuesta</li>
                        </ol>
                        <p className="mt-2">Son dos botones diferentes. Después de aprobar, busca el botón verde "Generar Siguiente Temporada" y haz clic en él.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Un jugador dice que no puede ver su grupo"</h3>
                        <p>Verifica lo siguiente:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>¿El jugador está asignado a un grupo de la temporada activa? Ve a Usuarios → busca al jugador → mira en qué grupo está</li>
                            <li>¿La temporada está marcada como activa? Ve a Temporadas → verifica que la temporada actual tiene el estado "Activa: Sí"</li>
                            <li>¿La cuenta del jugador está activa? Ve a Usuarios → verifica que no esté desactivada</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Los jugadores reportan que no pueden registrar partidos"</h3>
                        <p>Puede ser por varios motivos:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Ya han jugado contra todos los de su grupo</li>
                            <li>No tienen grupo asignado</li>
                            <li>La temporada no está activa</li>
                            <li>Están intentando registrar un resultado incorrecto (recuerda: solo 3-0, 3-1 o 3-2)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Quiero corregir un partido mal registrado"</h3>
                        <p>Como administrador puedes editar o eliminar cualquier partido:</p>
                        <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                            <li>Ve a "Ver todos los partidos" en el menú</li>
                            <li>Busca el partido (puedes filtrar por jugador, fecha, grupo...)</li>
                            <li>Haz clic en el botón de editar (icono de lápiz) o eliminar (icono de papelera)</li>
                            <li>La clasificación se actualizará automáticamente</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Las estadísticas no cuadran"</h3>
                        <p>Si ves números inconsistentes:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Recuerda que el Dashboard muestra estadísticas GLOBALES (todas las temporadas)</li>
                            <li>Cada grupo muestra solo estadísticas de esa temporada en concreto</li>
                            <li>Si aún así algo no cuadra, puede ser un bug real - repórtalo</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Qué hacer si hay un bug */}
            <section className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🐛 ¿Has Encontrado un Bug en el Sistema?</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Si algo no funciona como se describe en este manual, o el sistema hace algo inesperado, probablemente sea un bug (error de programación).</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Ejemplos de Bugs Reales</h3>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Al generar la siguiente temporada, los jugadores no se asignan a los grupos correctos</li>
                            <li>La clasificación no se actualiza después de registrar un partido</li>
                            <li>Un botón no hace nada cuando lo pulsas</li>
                            <li>Aparece un mensaje de error con código extraño</li>
                            <li>Los ascensos/descensos de la propuesta no coinciden con la clasificación final</li>
                            <li>No puedes crear un usuario nuevo aunque rellenes todos los campos</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cómo Documentar el Bug</h3>
                        <p>Antes de reportarlo, anota:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li><strong>¿Qué estabas haciendo?</strong> (ej: "Intentaba crear un nuevo usuario")</li>
                            <li><strong>¿Qué pasos seguiste?</strong> (ej: "Rellené nombre, email, contraseña y le di a Crear Usuario")</li>
                            <li><strong>¿Qué esperabas que pasara?</strong> (ej: "Que se creara el usuario y apareciera en la lista")</li>
                            <li><strong>¿Qué pasó en realidad?</strong> (ej: "Apareció un error rojo que decía 'Email ya existe', pero ese email no está en la lista de usuarios")</li>
                            <li><strong>¿Puedes reproducirlo?</strong> (ej: "Sí, pasa siempre que uso ese email")</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cómo Reportarlo</h3>
                        <p>Tienes dos opciones:</p>
                        <ol className="list-decimal list-inside ml-4 mt-2 space-y-2">
                            <li>
                                <strong>Desde la sección de Bugs:</strong> Ve a "Bugs" en el menú → Puedes ver bugs reportados por jugadores y marcarlos como resueltos. También puedes crear uno nuevo.
                            </li>
                            <li>
                                <strong>Contacto directo con desarrollo:</strong> Si tienes contacto directo con el equipo de desarrollo, envíales toda la información que anotaste arriba.
                            </li>
                        </ol>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-4">
                        <p className="text-sm"><strong>💡 Importante:</strong> Si descubres un bug crítico que impide el funcionamiento de la liga (por ejemplo, no se pueden registrar partidos), comunícalo inmediatamente. No esperes a que termine la temporada. Los bugs se solucionan más rápido cuando se reportan pronto y con detalle.</p>
                    </div>
                </div>
            </section>

            {/* Mejores Prácticas */}
            <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">💡 Mejores Prácticas</h2>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                    <li>✅ Crea la temporada con suficiente antelación</li>
                    <li>✅ Comunica a los jugadores las fechas de inicio y fin de temporada</li>
                    <li>✅ Revisa regularmente que los grupos tengan el número adecuado de jugadores</li>
                    <li>✅ Genera y revisa la propuesta de cierre antes de que finalice la temporada</li>
                    <li>✅ Aprueba el cierre solo cuando todos los partidos estén registrados</li>
                    <li>✅ Marca la nueva temporada como activa solo cuando esté lista para empezar</li>
                    <li>✅ Mantén comunicación con los jugadores sobre cambios y actualizaciones</li>
                    <li>✅ Respalda los datos exportando CSVs periódicamente</li>
                </ul>
            </section>

            {/* Protección de Datos */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🔒 Protección de Datos Históricos</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>El sistema protege automáticamente el historial de la liga:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>No se pueden eliminar temporadas con grupos, partidos o cierres</li>
                        <li>No se pueden eliminar usuarios (solo desactivar)</li>
                        <li>Los cierres aprobados quedan permanentes en el historial</li>
                        <li>Los ascensos y descensos quedan registrados para siempre</li>
                    </ul>
                    <p className="mt-4">
                        Si intentas eliminar datos protegidos, recibirás un mensaje detallado explicando qué datos 
                        se perderían y por qué no se puede proceder.
                    </p>
                </div>
            </section>
        </div>
    );
}
