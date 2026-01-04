import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center">
                        {/* Logo FreeSquash */}
                        <div className="mb-8 flex justify-center">
                            <img
                                src="/logo.jpg"
                                alt="FreeSquash Logo"
                                className="h-32 sm:h-40 lg:h-48 w-auto rounded-2xl shadow-2xl"
                            />
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[1.1] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
                            FreeSquash League
                        </h1>
                        <p className="text-xl sm:text-2xl text-gray-700 mb-4 max-w-3xl mx-auto">
                            Nuestra liga de squash en Vitoria-Gasteiz
                        </p>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Sistema de gestión interno para administrar grupos, partidos y clasificaciones de nuestra comunidad de squash
                        </p>

                        <div className="flex justify-center">
                            <Link
                                to="/login"
                                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                Acceder a la Plataforma
                            </Link>
                        </div>

                        <div className="mt-6 flex flex-col items-center gap-3">
                            <Link
                                to="/inicio"
                                className="text-blue-600 hover:text-blue-700 font-medium underline decoration-2 underline-offset-4 transition-colors"
                            >
                                📋 ¿Eres nuevo? Ver instrucciones de acceso
                            </Link>
                            <p className="text-sm text-gray-500">
                                🔒 Acceso solo para miembros registrados. Contacta con el administrador para unirte.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
                    Funcionalidades de la plataforma
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Grupos por Nivel</h3>
                        <p className="text-gray-600">
                            Organización en múltiples grupos según nivel de juego, con clasificaciones actualizadas automáticamente y sistema de ascensos/descensos al finalizar cada temporada.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">🎾</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Registro de Partidos</h3>
                        <p className="text-gray-600">
                            Registra los resultados de tus partidos de squash rápidamente. El sistema actualiza automáticamente las clasificaciones tras cada partido.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Ranking Justo</h3>
                        <p className="text-gray-600">
                            Sistema de clasificación con algoritmo de desempate que considera enfrentamientos directos y diferencia de sets para garantizar un ranking equitativo.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">📈</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Tu Evolución</h3>
                        <p className="text-gray-600">
                            Consulta todas tus estadísticas: victorias, derrotas, porcentaje de éxito, diferencia de sets y tu racha actual para seguir tu progreso.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">📞</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Contacto entre Jugadores</h3>
                        <p className="text-gray-600">
                            Encuentra los datos de contacto de otros jugadores de tu grupo para coordinar partidos fácilmente mediante WhatsApp o llamada.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-4xl mb-4">⬆️⬇️</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Ascensos y Descensos</h3>
                        <p className="text-gray-600">
                            Al final de cada temporada, los mejores ascienden y los últimos descienden, manteniendo grupos competitivos y equilibrados.
                        </p>
                    </div>
                </div>
            </div>

            {/* How to Use Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center text-white mb-12">
                        ¿Cómo funciona?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4 shadow-lg">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Contacta al Admin</h3>
                            <p className="text-blue-100">
                                El administrador te creará una cuenta y te asignará a tu grupo
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4 shadow-lg">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
                            <p className="text-blue-100">
                                Accede con tus credenciales y consulta tu grupo y clasificación
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4 shadow-lg">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Juega y Registra</h3>
                            <p className="text-blue-100">
                                Juega tus partidos y registra los resultados
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="text-center">
                            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-4 shadow-lg">
                                4
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Sigue la Liga</h3>
                            <p className="text-blue-100">
                                Consulta la clasificación, tu progreso y el historial de partidos
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roles Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
                    Tipos de Usuario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Player Role */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-2 border-green-200">
                        <div className="text-5xl mb-4">👤</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Jugador</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Ver clasificación y estadísticas personales</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Registrar resultados de partidos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Consultar historial completo</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">✓</span>
                                <span>Contactar con otros jugadores</span>
                            </li>
                        </ul>
                    </div>

                    {/* Admin Role */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2 border-purple-200">
                        <div className="text-5xl mb-4">👨‍💼</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Administrador</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Crear y gestionar temporadas</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Crear y gestionar grupos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Asignar jugadores a grupos</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-purple-600 mr-2">✓</span>
                                <span>Panel de administración completo</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Instalación Móvil */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-xl p-8 border-2 border-indigo-200 dark:border-indigo-700">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">📱</div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Instala FreeSquash en tu móvil
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Accede más rápido y cómodamente instalando nuestra app en tu dispositivo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {/* Android */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-4xl">🤖</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Android</h3>
                            </div>
                            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
                                    <span>Abre esta página en <strong>Chrome</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
                                    <span>Toca el menú <strong>(⋮)</strong> arriba a la derecha</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
                                    <span>Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">4.</span>
                                    <span>Confirma y busca el icono de FreeSquash</span>
                                </li>
                            </ol>
                        </div>

                        {/* iOS */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-4xl">🍎</div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">iPhone/iPad</h3>
                            </div>
                            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
                                    <span>Abre esta página en <strong>Safari</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
                                    <span>Toca el botón de compartir <strong>(□↑)</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
                                    <span>Desplázate y selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">4.</span>
                                    <span>Confirma y busca el icono de FreeSquash</span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600 dark:text-gray-400 italic">
                            💡 Después de instalar, podrás abrir FreeSquash como cualquier otra app sin necesidad del navegador
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        ¿Ya eres miembro?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Accede a tu cuenta para consultar clasificaciones, registrar partidos y seguir tus estadísticas
                    </p>
                    <div className="flex justify-center">
                        <Link
                            to="/login"
                            className="px-12 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                    <p className="mt-6 text-blue-100 text-sm">
                        ¿No tienes cuenta? Contacta con el administrador de la liga
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm">
                        © 2025 FreeSquash League. Todos los derechos reservados.
                    </p>
                    <p className="text-xs mt-2 text-gray-500">
                        Sistema interno de gestión de liga
                    </p>
                </div>
            </footer>
        </div>
    );
}
