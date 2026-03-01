export default function Help() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">📚 Manual de Usuario</h1>
                <p className="text-blue-100">Guía completa para jugadores de FreeSquash League</p>
            </div>

            {/* Cómo Entrar */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🔐 Cómo Entrar en la Plataforma</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Primera Vez</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Abre tu navegador (Chrome, Firefox, Safari, Edge...)</li>
                            <li>Escribe en la barra de direcciones la dirección web de FreeSquash League (te la habrá dado el administrador)</li>
                            <li>Te aparecerá una pantalla de inicio de sesión con un logo de squash</li>
                            <li>Introduce tu <strong>correo electrónico</strong> (el que te dio el administrador)</li>
                            <li>Introduce tu <strong>contraseña</strong> (normalmente es "123456" la primera vez)</li>
                            <li>Haz clic en el botón azul "Iniciar Sesión"</li>
                        </ol>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                        <p className="text-sm"><strong>💡 Consejo:</strong> Después de entrar por primera vez, ve a "Perfil" (arriba a la derecha, donde está tu nombre) y cambia tu contraseña por una que recuerdes mejor. También puedes actualizar tu teléfono para que otros jugadores te puedan contactar.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿He olvidado mi contraseña?</h3>
                        <p>Tienes dos opciones:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li><strong>Si recuerdas tu email:</strong> Contacta con el administrador por teléfono o email, y él puede restablecer tu contraseña.</li>
                            <li><strong>Si recuerdas tu email:</strong> Puedes intentar acceder a tu cuenta y cambiar la contraseña desde tu perfil una vez dentro.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Por qué no me deja entrar?</h3>
                        <p>Si aparece un mensaje de error en rojo diciendo "Credenciales inválidas", puede ser por:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Has escrito mal el correo electrónico (revisa que no tenga espacios ni mayúsculas incorrectas)</li>
                            <li>Has escrito mal la contraseña</li>
                            <li>Tu cuenta está desactivada (contacta con el administrador)</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Introducción */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">¿Qué es FreeSquash League?</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    FreeSquash League es una página web que te permite organizar tu participación en la liga de squash. 
                    Piensa en ella como una agenda digital donde registras tus partidos, ves con quién tienes que jugar, 
                    y consultas tu posición en la clasificación.
                </p>
                <div className="space-y-3 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Cómo funciona la liga?</h3>
                        <p>La liga se divide en <strong>temporadas</strong> (normalmente 2 meses de duración). Cada temporada tiene varios <strong>grupos</strong> de jugadores de nivel similar. Por ejemplo:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Grupo 1: Los mejores jugadores</li>
                            <li>Grupo 2: Jugadores de nivel intermedio-alto</li>
                            <li>Grupo 3: Jugadores de nivel intermedio</li>
                            <li>Y así sucesivamente...</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué tengo que hacer?</h3>
                        <p>Durante cada temporada, debes jugar un partido contra cada uno de los jugadores de tu grupo. Tú y tu rival acordáis cuándo jugar (por teléfono o WhatsApp), jugáis el partido, y después el ganador o perdedor registra el resultado en esta página web.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Ascensos y Descensos</h3>
                        <p>Al final de cada temporada:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>🏆 Los 2 mejores de cada grupo <strong>suben</strong> al grupo superior (mejores rivales)</li>
                            <li>⬇️ Los 2 últimos de cada grupo <strong>bajan</strong> al grupo inferior</li>
                            <li>➡️ El resto se queda en el mismo grupo</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Dashboard */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🏠 Página de Inicio (Dashboard)</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Cuando entras en la página web después de iniciar sesión, lo primero que ves es tu página de inicio. 
                    Aquí tienes un resumen de toda tu información.
                </p>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué significa cada número?</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Racha Actual:</strong> Si has ganado varios partidos seguidos, verás algo como "🔥 3W" (3 victorias consecutivas). Si has perdido, verás "❄️ 2L" (2 derrotas consecutivas). Es como una racha de buena o mala suerte.</li>
                            <li><strong>Victorias/Derrotas:</strong> El número total de partidos que has ganado y perdido desde que empezaste en la liga. Por ejemplo: "15 victorias, 8 derrotas".</li>
                            <li><strong>Win Rate:</strong> Es un porcentaje que indica qué proporción de partidos has ganado. Si dice "65%", significa que has ganado 65 de cada 100 partidos jugados.</li>
                            <li><strong>Diferencia de Sets:</strong> Un partido se juega al mejor de 5 sets (primero en ganar 3 sets gana). Esta estadística suma todos los sets que has ganado y le resta los que has perdido. Un número positivo es bueno.</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Mi Grupo Actual</h3>
                        <p>Aquí ves:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>En qué grupo estás (ejemplo: "Grupo 2")</li>
                            <li>Tu posición actual en la clasificación (ejemplo: "3º de 8")</li>
                            <li>Con quién te falta jugar todavía</li>
                        </ul>
                        <p className="mt-2">Si haces clic en el nombre del grupo, verás más detalles: la clasificación completa y todos los partidos del grupo.</p>
                    </div>
                </div>
            </section>

            {/* Registrar Partido */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🎾 Cómo Registrar un Partido (Paso a Paso)</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Después de jugar un partido, alguien tiene que registrar el resultado en la web. Puede hacerlo el ganador o el perdedor, da igual. Solo se registra UNA vez.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Instrucciones Detalladas</h3>
                        <ol className="list-decimal list-inside space-y-3 ml-4">
                            <li>
                                <strong>Entra en "Registrar Partido"</strong>
                                <p className="ml-6 mt-1">En el menú de arriba de la página, busca el botón que dice "Registrar". Haz clic en él. Se abrirá un formulario (una página con campos para rellenar).</p>
                            </li>
                            <li>
                                <strong>Selecciona contra quién has jugado</strong>
                                <p className="ml-6 mt-1">Verás una lista desplegable (un menú que se abre hacia abajo) con nombres de jugadores. Busca y selecciona el nombre de tu rival. <em>Solo aparecen las personas contra las que todavía NO has jugado en esta temporada.</em></p>
                            </li>
                            <li>
                                <strong>Introduce el resultado</strong>
                                <p className="ml-6 mt-1">Aquí indicas los juegos (sets) que ganó cada uno. Usa los botones + y - para ajustar el marcador, o escribe directamente los números.</p>
                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                    <li><strong>Tus Juegos:</strong> Cuántos sets ganaste TÚ</li>
                                    <li><strong>Juegos del Oponente:</strong> Cuántos sets ganó tu RIVAL</li>
                                    <li>El formato válido es siempre <strong>3-0</strong>, <strong>3-1</strong> o <strong>3-2</strong> (el primero en llegar a 3 sets gana el partido)</li>
                                    <li>El sistema detecta automáticamente quién ganó según el marcador</li>
                                    <li>Si alguien se lesionó o el partido se canceló, selecciona "Lesión" o "Cancelado" en el menú "Estado del Partido"</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Selecciona la fecha</strong>
                                <p className="ml-6 mt-1">Haz clic en el calendario que aparece y selecciona el día en que jugasteis. Normalmente será el día de hoy o ayer.</p>
                            </li>
                            <li>
                                <strong>Haz clic en "Registrar Partido"</strong>
                                <p className="ml-6 mt-1">Al final del formulario hay un botón azul que dice "Registrar Partido". Haz clic en él. Si todo está correcto, verás un mensaje de confirmación en verde que dice "Partido registrado exitosamente".</p>
                            </li>
                        </ol>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                        <p className="text-sm"><strong>⚠️ Muy Importante:</strong></p>
                        <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
                            <li>Solo puedes jugar UNA vez contra cada persona de tu grupo</li>
                            <li>El resultado solo se registra UNA vez (no lo registréis los dos)</li>
                            <li>La clasificación se actualiza automáticamente al instante</li>
                            <li>Si te equivocas, puedes editar o borrar el partido desde "Mis partidos"</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Calendario y Programación de Partidos */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📅 (En fase de pruebas) Calendario y Programación de Partidos</h2>
                
                <div className="bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-400 p-4 mb-4">
                    <p className="text-sm"><strong>⚠️ Nota Importante:</strong> Esta es una característica en fase de pruebas. Para usar el Calendario, primero debes <strong>habilitarlo en tu perfil</strong>. Ve a tu Perfil → Características de Prueba → Activa "Características de Prueba". Una vez habilitado, verás el menú "Calendario" en la parte superior.</p>
                </div>

                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>El Calendario te permite programar partidos con tus rivales de forma anticipada y sincronizarlos con Google Calendar.</p>
                    
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Cómo Programar un Partido?</h3>
                        <ol className="list-decimal list-inside space-y-3 ml-4">
                            <li>
                                <strong>Accede al Calendario</strong>
                                <p className="ml-6 mt-1">En el menú superior, haz clic en "Calendario". Verás un calendario mensual con tus partidos programados y jugados.</p>
                            </li>
                            <li>
                                <strong>Haz clic en "Programar Partido"</strong>
                                <p className="ml-6 mt-1">Verás un botón verde "+ Programar Partido" en la parte derecha. Al hacer clic se abrirá un formulario.</p>
                            </li>
                            <li>
                                <strong>Selecciona tu rival</strong>
                                <p className="ml-6 mt-1">Elige de la lista desplegable contra quién quieres jugar. Solo aparecen jugadores de tu grupo con los que NO has jugado todavía.</p>
                            </li>
                            <li>
                                <strong>Elige fecha y hora</strong>
                                <p className="ml-6 mt-1">Selecciona el día y hora del partido. Las restricciones son:</p>
                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                    <li>Solo de lunes a viernes (no fines de semana)</li>
                                    <li>Entre las 08:00 y las 21:00 horas</li>
                                    <li>Solo en horas en punto o medias (ej: 10:00, 10:30, 11:00...)</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Indica la ubicación</strong>
                                <p className="ml-6 mt-1">Escribe dónde van a jugar (ej: "Mendi, pista 2", "Mendizorrotza pista 1"). Esto ayudará a recordar dónde quedaste.</p>
                            </li>
                            <li>
                                <strong>Guarda el partido</strong>
                                <p className="ml-6 mt-1">Haz clic en "Programar". El partido aparecerá en el calendario en color <span className="text-blue-600 dark:text-blue-400 font-semibold">azul</span> (partidos programados pendientes de jugar).</p>
                            </li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Códigos de Color en el Calendario</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><span className="inline-block w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></span><strong className="text-blue-600 dark:text-blue-400">Azul:</strong> Partidos programados (todavía no jugados)</li>
                            <li><span className="inline-block w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></span><strong className="text-green-600 dark:text-green-400">Verde:</strong> Partidos que ganaste</li>
                            <li><span className="inline-block w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></span><strong className="text-red-600 dark:text-red-400">Rojo:</strong> Partidos que perdiste</li>
                            <li><span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></span><strong className="text-gray-600 dark:text-gray-400">Gris:</strong> Partidos de otros jugadores (no estás involucrado)</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Sincronización con Google Calendar</h3>
                        <p className="mb-2">Puedes conectar tu cuenta de Google para que los partidos programados aparezcan automáticamente en tu Google Calendar.</p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 my-3">
                            <p className="text-sm"><strong>🔗 Cómo conectar con Google:</strong></p>
                            <ol className="list-decimal list-inside ml-4 mt-2 text-sm space-y-1">
                                <li>En la página del Calendario, verás un recuadro arriba que dice "Google Calendar"</li>
                                <li>Haz clic en el botón azul "Conectar"</li>
                                <li>Se abrirá una ventana de Google pidiendo permisos</li>
                                <li>Selecciona tu cuenta de Google e inicia sesión</li>
                                <li>Acepta los permisos (necesarios para crear eventos en tu calendario)</li>
                                <li>Volverás automáticamente a FreeSquash y verás "✓ Conectado"</li>
                            </ol>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            <strong>Nota:</strong> Una vez conectado, todos los partidos que programes se sincronizarán automáticamente con tu Google Calendar. Verás un badge azul 📅 Google en los partidos sincronizados.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Ver Detalles de un Partido</h3>
                        <p>Haz clic en cualquier partido del calendario para ver sus detalles:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li><strong>Partidos programados:</strong> Verás fecha/hora, ubicación, estado (Programado) y opciones para Editar o Cancelar</li>
                            <li><strong>Partidos jugados:</strong> Verás el resultado final y quién ganó</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Próximos Partidos</h3>
                        <p>Debajo del calendario mensual verás dos listas:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li><strong>"Próximos Partidos":</strong> Todos tus partidos programados que todavía no se han jugado, ordenados por fecha</li>
                            <li><strong>"Partidos Recientes":</strong> Los últimos 5 partidos que has jugado con sus resultados</li>
                        </ul>
                        <p className="mt-2">También puedes ver tus próximos partidos en el Dashboard (página de inicio) en la sección "Próximos Partidos".</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Registrar Resultado de Partido Programado</h3>
                        <p className="mb-2">Una vez hayas jugado el partido programado:</p>
                        <ol className="list-decimal list-inside ml-4 space-y-2">
                            <li>Ve a "Registrar" en el menú superior (como siempre)</li>
                            <li>Selecciona tu rival de la lista</li>
                            <li>Introduce el resultado (3-0, 3-1 o 3-2)</li>
                            <li>El sistema automáticamente:
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Encontrará el partido programado que tenías</li>
                                    <li>Lo actualizará con el resultado</li>
                                    <li>Cambiará su color en el calendario (verde si ganaste, rojo si perdiste)</li>
                                    <li>NO creará un partido duplicado</li>
                                </ul>
                            </li>
                        </ol>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cancelar un Partido Programado</h3>
                        <p className="mb-2">Si necesitas cancelar un partido que habías programado:</p>
                        <ol className="list-decimal list-inside ml-4 space-y-1">
                            <li>Haz clic en el partido en el calendario</li>
                            <li>Se abrirá un panel lateral con los detalles</li>
                            <li>Haz clic en el botón rojo "Cancelar Partido"</li>
                            <li>Confirma la cancelación</li>
                            <li>El partido desaparecerá del calendario y (si estaba sincronizado) también de tu Google Calendar</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                        <p className="text-sm"><strong>⚠️ Importante sobre Partidos Programados:</strong></p>
                        <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
                            <li>Los partidos programados NO cuentan en la clasificación hasta que se registre el resultado</li>
                            <li>NO aparecen en "Partidos Recientes" porque todavía no se han jugado</li>
                            <li>Puedes programar varios partidos con diferentes rivales</li>
                            <li>El sistema te recordará visualmente (⏳) cuáles son los partidos pendientes de jugar</li>
                            <li>La programación es opcional - puedes seguir jugando y registrando partidos sin programarlos primero</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Clasificación y Grupos */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📊 Clasificación y Grupos</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cómo Funciona</h3>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Estadísticas del Grupo:</strong> Tabla con victorias, derrotas, partidos restantes, lesiones y diferencia de sets</li>
                            <li><strong>Clasificación Actual:</strong> Ranking oficial del grupo con información de contacto de tus rivales</li>
                            <li><strong>Ascensos y Descensos:</strong>
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>🏆 Los 2 primeros ascienden al grupo superior</li>
                                    <li>⚠️ Los 2 últimos descienden al grupo inferior</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Contactar Rivales</h3>
                        <p>En la clasificación puedes ver botones de WhatsApp y Email para contactar a tus rivales y coordinar partidos.</p>
                    </div>
                </div>
            </section>

            {/* Historial de Partidos */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📜 Historial de Partidos</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Accede a todos tus partidos jugados a lo largo de las temporadas.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Filtros Disponibles</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Búsqueda:</strong> Busca partidos por nombre del oponente</li>
                            <li><strong>Rango de fechas:</strong> Filtra por fecha de inicio y fin</li>
                            <li><strong>Temporada:</strong> Selecciona una temporada específica</li>
                            <li><strong>Grupo:</strong> Filtra por grupo (se ajusta según la temporada)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Estados de los Partidos</h3>
                        <p>En el historial verás diferentes tipos de partidos:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Partidos Completados:</strong> Partidos ya jugados con resultado final</li>
                            <li><strong>Partidos Pendientes (⏳):</strong> Partidos programados que aún no se han jugado</li>
                            <li><strong>Partidos Recientes:</strong> Últimos 5 partidos jugados (visualización rápida)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Editar/Eliminar Partidos</h3>
                        <p>Puedes editar o eliminar tus propios partidos si cometiste un error al registrarlos. Los administradores pueden modificar cualquier partido. También puedes editar o cancelar partidos pendientes antes de jugarlos.</p>
                    </div>
                </div>
            </section>

            {/* Progreso del Jugador */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📈 Progreso del Jugador</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Gráficos de Evolución</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Victorias y Derrotas por Fecha:</strong> Gráfico de línea mostrando tu progreso acumulado con línea de tendencia</li>
                            <li><strong>Evolución de Grupo:</strong> Gráfico que muestra en qué grupo has estado en cada temporada
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Línea ascendente = estás bajando de grupo (números más altos)</li>
                                    <li>Línea descendente = estás subiendo de grupo (números más bajos)</li>
                                    <li>Puntos verdes = Ascenso en esa temporada</li>
                                    <li>Puntos rojos = Descenso en esa temporada</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Partidos Pendientes y Recientes</h3>
                        <p>En la página de progreso también puedes ver:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Próximos Partidos:</strong> Lista de partidos programados que aún no has jugado</li>
                            <li><strong>Partidos Recientes:</strong> Últimos 5 partidos jugados con sus resultados</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Filtro de Fechas</h3>
                        <p>Puedes filtrar los gráficos por rango de fechas para analizar períodos específicos.</p>
                    </div>
                </div>
            </section>

            {/* Perfil */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">👤 Perfil de Usuario</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>En tu perfil (acceso desde el menú superior, donde está tu nombre) puedes:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Ver tu información personal (nombre, apodo, email, teléfono)</li>
                        <li>Ver tu grupo actual y temporada activa</li>
                        <li>Actualizar tu información de contacto</li>
                    </ul>
                    
                    <div className="mt-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🔑 Cambiar tu Email de Acceso</h3>
                        <p className="mb-2">Si quieres cambiar el email con el que inicias sesión:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Ve a tu perfil</li>
                            <li>Busca la sección "Cambiar Email de Acceso" (botón amarillo con candado 🔑)</li>
                            <li>Introduce tu nuevo email</li>
                            <li>Haz clic en "Confirmar Cambio"</li>
                            <li>⚠️ <strong>Importante:</strong> Tendrás que volver a iniciar sesión con el nuevo email</li>
                        </ol>
                        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                            <strong>Nota:</strong> El email debe ser único. Si intentas usar un email que ya está registrado, verás un error.
                        </p>
                    </div>

                    <div className="mt-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">🔐 Cambiar tu Contraseña</h3>
                        <p className="mb-2">Para cambiar tu contraseña de acceso:</p>
                        <ol className="list-decimal list-inside space-y-2 ml-4">
                            <li>Ve a tu perfil</li>
                            <li>Busca la sección "Cambiar Contraseña" (botón verde con candado 🔐)</li>
                            <li>Introduce tu contraseña actual</li>
                            <li>Introduce tu nueva contraseña (mínimo 6 caracteres)</li>
                            <li>Repite la nueva contraseña para confirmar</li>
                            <li>Haz clic en "Confirmar Cambio"</li>
                        </ol>
                        <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                            <strong>Consejo:</strong> Elige una contraseña que sea fácil de recordar pero difícil de adivinar (no uses tu nombre o fecha de nacimiento).
                        </p>
                    </div>
                </div>
            </section>

            {/* Lista Negra */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">⚠️ Lista Negra</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>La Lista Negra es una herramienta de transparencia que muestra qué jugadores no están cumpliendo con su compromiso de jugar partidos en la liga.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Para qué sirve?</h3>
                        <p>Esta lista ayuda a identificar jugadores que:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Tienen muchos partidos pendientes sin jugar</li>
                            <li>Han registrado muchos partidos como lesión</li>
                            <li>No están participando activamente en la temporada</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Cómo acceder?</h3>
                        <p>Puedes acceder a la Lista Negra desde:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>El menú superior: "Más" → "Lista Negra"</li>
                            <li>En dispositivos móviles: Menú hamburguesa → "⚠️ Lista Negra"</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué información muestra?</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Temporada Actual:</strong> Jugadores con partidos pendientes en la temporada en curso</li>
                            <li><strong>Historial:</strong> Jugadores que tuvieron muchos partidos sin jugar en temporadas pasadas</li>
                            <li><strong>Estadísticas:</strong> Número de partidos jugados, pendientes, lesiones y porcentaje sin jugar</li>
                        </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                        <p className="text-sm"><strong>💡 Importante:</strong> Aparecer en la Lista Negra no es un "castigo", sino una herramienta de transparencia. Si tienes una razón válida (lesión, trabajo, viaje), comunícalo a tu grupo. El objetivo es fomentar la participación activa.</p>
                    </div>
                </div>
            </section>

            {/* Páginas Públicas */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🌐 Información Pública de la Liga</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Parte de la información de la liga está disponible públicamente (sin necesidad de iniciar sesión) para que cualquiera pueda ver cómo funciona la liga.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué se puede ver públicamente?</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Clasificaciones de Grupos:</strong> Rankings actuales de todos los grupos de la temporada activa</li>
                            <li><strong>Partidos Recientes:</strong> Últimos partidos jugados en la liga</li>
                            <li><strong>Estadísticas Generales:</strong> Número de jugadores, grupos, temporadas y partidos totales</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Dónde se accede?</h3>
                        <p>Esta información está disponible en la página de inicio pública (antes de iniciar sesión) en la URL principal de FreeSquash League.</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
                        <p className="text-sm"><strong>🔒 Privacidad:</strong> Los datos de contacto (teléfono, email) NO son públicos. Solo son visibles para jugadores que han iniciado sesión. La información pública solo incluye nombres, resultados de partidos y clasificaciones.</p>
                    </div>
                </div>
            </section>

            {/* Términos y Privacidad */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📄 Términos de Servicio y Privacidad</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Al usar FreeSquash League, aceptas nuestros términos de servicio y política de privacidad.</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Dónde puedo consultarlos?</h3>
                        <p>En el pie de página (footer) de cualquier página encontrarás enlaces a:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Política de Privacidad:</strong> Cómo manejamos y protegemos tus datos personales</li>
                            <li><strong>Términos de Servicio:</strong> Condiciones de uso de la plataforma</li>
                            <li><strong>Aviso Legal:</strong> Información legal sobre la plataforma</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Protección de Datos (GDPR)</h3>
                        <p>Cumplimos con el Reglamento General de Protección de Datos (GDPR). Esto significa que:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Tus datos personales están protegidos y encriptados</li>
                            <li>Solo recopilamos la información necesaria para el funcionamiento de la liga</li>
                            <li>Puedes solicitar la eliminación de tus datos contactando al administrador</li>
                            <li>No compartimos tu información con terceros sin tu consentimiento</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Reportar Bugs */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🐛 Reportar Problemas</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Si encuentras algún error o problema en la aplicación:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Ve a la sección "Reportar Bug" desde el menú</li>
                        <li>Escribe una descripción detallada del problema</li>
                        <li>Envía el reporte</li>
                        <li>Los administradores recibirán tu reporte y lo resolverán lo antes posible</li>
                    </ol>
                </div>
            </section>

            {/* Consejos */}
            <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">💡 Consejos y Mejores Prácticas</h2>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                    <li>✅ Registra tus partidos lo antes posible después de jugarlos</li>
                    <li>✅ Contacta a tus rivales con antelación para coordinar horarios</li>
                    <li>✅ Revisa regularmente tu clasificación y partidos pendientes</li>
                    <li>✅ Aprovecha el período de la temporada para jugar todos tus partidos</li>
                    <li>✅ Verifica bien el resultado antes de registrar un partido</li>
                    <li>✅ Mantén tu información de contacto actualizada</li>
                </ul>
            </section>

            {/* Solución de Problemas */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🔧 Problemas Comunes y Soluciones</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"No veo mi grupo" o "Dice que no tengo grupo"</h3>
                        <p>Puede ser porque:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>La temporada todavía no ha empezado (el administrador la activará cuando esté lista)</li>
                            <li>Eres nuevo y el administrador todavía no te ha asignado a un grupo</li>
                            <li>Contacta con el administrador si llevas más de un día sin ver tu grupo</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"No aparece mi rival en la lista para registrar partido"</h3>
                        <p>Esto es normal si:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Ya has jugado contra esa persona (solo se puede jugar una vez contra cada uno)</li>
                            <li>Esa persona no está en tu grupo</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Registré mal el resultado, ¿puedo cambiarlo?"</h3>
                        <p>Sí, puedes:</p>
                        <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                            <li>Ve a "Más" → "Mis partidos" en el menú de arriba</li>
                            <li>Busca el partido que quieres cambiar</li>
                            <li>Haz clic en el botón "Editar" (icono de lápiz)</li>
                            <li>Cambia el resultado y guarda</li>
                            <li>Si prefieres borrarlo, haz clic en el botón rojo "Eliminar" (icono de papelera)</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"Los números no cuadran" o "Mi clasificación es incorrecta"</h3>
                        <p>Si crees que hay un error en las estadísticas o clasificación:</p>
                        <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                            <li>Primero verifica en "Mis partidos" que todos los resultados estén bien registrados</li>
                            <li>Recuerda que las estadísticas del Dashboard muestran TODOS tus partidos (todas las temporadas), mientras que en tu grupo solo ves los partidos de la temporada actual</li>
                            <li>Si sigue sin cuadrar, repórtalo como un bug (ver sección siguiente)</li>
                        </ol>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">"La página va muy lenta" o "No carga"</h3>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Recarga la página: presiona F5 en tu teclado o el botón de recargar del navegador (flecha circular)</li>
                            <li>Cierra el navegador completamente y vuelve a abrirlo</li>
                            <li>Verifica tu conexión a Internet</li>
                            <li>Si el problema persiste, contacta con el administrador</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Características de Prueba */}
            <section className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">⚗️ Características de Prueba (Beta)</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <div className="bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-400 p-4 mb-4">
                        <p className="text-sm"><strong>ℹ️ Aviso Importante:</strong> Algunas características de esta plataforma están en fase de prueba (beta). Esto significa que pueden cambiar, tener comportamientos inesperados, o ser eliminadas en el futuro sin previo aviso.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Cuáles son las Características de Prueba?</h3>
                        <p className="mb-2">Las características de prueba te permiten acceder a funcionalidades experimentales. Estas están identificadas en la plataforma y pueden no estar completamente estables. Algunos ejemplos incluyen:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Nuevas integraciones con calendarios</li>
                            <li>Nuevas opciones de programación de partidos</li>
                            <li>Mejoras experimentales en reportes y estadísticas</li>
                            <li>Otras funcionalidades marcadas como "Beta" o "Experimental"</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué Debo Hacer con las Características de Prueba?</h3>
                        <p className="mb-2">Te recomendamos que <strong>desactives las características de prueba</strong> desde tu perfil si:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Prefieres usar solo funcionalidades estables y probadas</li>
                            <li>Experimentas problemas o comportamientos extraños</li>
                            <li>Quieres una experiencia de usuario más predecible</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cómo Desactivar las Características de Prueba</h3>
                        <ol className="list-decimal list-inside ml-4 space-y-2">
                            <li>
                                <strong>Abre tu Perfil</strong>
                                <p className="ml-6 mt-1">Haz clic en tu nombre en la esquina superior derecha de la página y selecciona "Perfil".</p>
                            </li>
                            <li>
                                <strong>Busca la sección "Preferencias"</strong>
                                <p className="ml-6 mt-1">Desplázate hacia abajo en tu perfil hasta encontrar la sección de "Características de Prueba" o "Beta Features".</p>
                            </li>
                            <li>
                                <strong>Desactiva la opción</strong>
                                <p className="ml-6 mt-1">Verás un interruptor (toggle) que dice "Activar Características de Prueba" o similar. Si está activado (en azul o verde), haz clic para desactivarlo (se volverá gris).</p>
                            </li>
                            <li>
                                <strong>Guarda los cambios</strong>
                                <p className="ml-6 mt-1">Tu perfil se actualizará automáticamente. Las características de prueba estarán desactivadas inmediatamente.</p>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                        <p className="text-sm"><strong>💡 Consejo:</strong> Si desactivas las características de prueba y luego quieres volver a activarlas, puedes hacer lo mismo en cualquier momento. Esto solo afecta a tu cuenta individual.</p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">¿Qué Pasa si Encuentro un Problema?</h3>
                        <p>Si experimentas algún problema con las características de prueba, consulta la sección "¿Has Encontrado un Error?" a continuación para aprender cómo reportar bugs. Tu feedback es muy valioso para mejorar estas características.</p>
                    </div>
                </div>
            </section>

            {/* Reportar Bugs Ampliado */}
            <section className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">🐛 ¿Has Encontrado un Error?</h2>
                <div className="space-y-4 text-slate-600 dark:text-slate-400">
                    <p>Si algo no funciona como se describe en este manual, o ves información incorrecta, es posible que hayas encontrado un "bug" (error en el programa).</p>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Ejemplos de Bugs que Deberías Reportar</h3>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Un partido se registra dos veces cuando solo lo has guardado una vez</li>
                            <li>Los números de victorias/derrotas no coinciden con tus partidos</li>
                            <li>No puedes hacer clic en un botón que debería funcionar</li>
                            <li>Aparece un mensaje de error extraño con código o letras raras</li>
                            <li>Tu clasificación no se actualiza después de registrar un partido</li>
                            <li>Ves información de otro jugador en tu perfil</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Cómo Reportar un Bug (Paso a Paso)</h3>
                        <ol className="list-decimal list-inside ml-4 space-y-2">
                            <li>
                                <strong>Busca el enlace "Reportar Bug"</strong>
                                <p className="ml-6 mt-1">Lo puedes encontrar en dos sitios:</p>
                                <ul className="list-disc list-inside ml-6 mt-1">
                                    <li>Abajo del todo en la página, en el pie de página (footer), junto a "Contacto"</li>
                                    <li>Haz clic en ese enlace</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Describe el problema</strong>
                                <p className="ml-6 mt-1">Se abrirá un cuadro de texto. Escribe con tus propias palabras qué ha pasado. Cuanto más detalle des, mejor:</p>
                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                    <li>¿Qué estabas intentando hacer?</li>
                                    <li>¿Qué esperabas que pasara?</li>
                                    <li>¿Qué pasó en realidad?</li>
                                    <li>¿Has intentado varias veces y siempre pasa lo mismo?</li>
                                </ul>
                                <p className="ml-6 mt-2"><strong>Ejemplo:</strong> "Intenté registrar mi partido contra Juan. Gané 3-1, pero cuando le di a guardar apareció un error que decía 'Invalid score'. Lo intenté 3 veces y siempre igual."</p>
                            </li>
                            <li>
                                <strong>Envía el reporte</strong>
                                <p className="ml-6 mt-1">Haz clic en el botón "Enviar Reporte". Recibirás un mensaje de confirmación. El administrador verá tu reporte y trabajará en solucionarlo.</p>
                            </li>
                        </ol>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-4">
                        <p className="text-sm"><strong>Recuerda:</strong> No hay "reportes tontos". Si crees que algo no funciona bien, repórtalo. Es mejor reportar algo que resulta no ser un problema, que quedarse callado y que el error afecte a más gente.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
