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
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Proceso de Cierre</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Ve a "Propuestas de Temporada" y selecciona la temporada a cerrar</li>
                            <li>El sistema genera automáticamente una propuesta:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Los 2 primeros de cada grupo → ASCENSO</li>
                                    <li>Los 2 últimos de cada grupo → DESCENSO</li>
                                    <li>El resto → SE MANTIENE</li>
                                </ul>
                            </li>
                            <li>Revisa y modifica movimientos si es necesario (arrastra jugadores entre grupos)</li>
                            <li>Puedes añadir jugadores nuevos a grupos específicos</li>
                            <li>Puedes desactivar jugadores que no continuarán</li>
                            <li>Guarda los cambios si los hiciste</li>
                            <li><strong>Aprobar Propuesta:</strong> Marca el cierre como aprobado y crea el historial de movimientos</li>
                            <li><strong>Generar Siguiente Temporada:</strong> Crea automáticamente la nueva temporada con los mismos grupos y asigna jugadores según la propuesta aprobada</li>
                        </ol>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
                        <p className="text-sm"><strong>⚠️ Importante:</strong> Una vez aprobada una propuesta, se crea el historial permanente. Revisa cuidadosamente antes de aprobar.</p>
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
