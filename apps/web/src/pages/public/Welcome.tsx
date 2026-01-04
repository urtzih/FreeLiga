import { Link } from 'react-router-dom';

export default function Welcome() {
    const emails = [
        'jon.tona@ejemplo.com',
        'oier.quesada@ejemplo.com',
        'santi.tobias@ejemplo.com',
        'aitor.garcia@ejemplo.com',
        'david.gancedo@ejemplo.com',
        'itzel.reguero@ejemplo.com',
        'cesar.berganzo@ejemplo.com',
        'eneko.izquierdo@ejemplo.com',
        'bikendi.otalora@ejemplo.com',
        'inigo.alonso@ejemplo.com',
        'alexander.egido@ejemplo.com',
        'javier.pacheco@ejemplo.com',
        'javier.guinea@ejemplo.com',
        'gari.suarez@ejemplo.com',
        'javier.crespo@ejemplo.com',
        'ruben.garcia@ejemplo.com',
        'eneko.uriarte@ejemplo.com',
        'enrique.oquinena@ejemplo.com',
        'jon.barrena@ejemplo.com',
        'sergio.barquin@ejemplo.com',
        'asier.renobales@ejemplo.com',
        'vicente.avila@ejemplo.com',
        'aritz.ruiz@ejemplo.com',
        'alberto.garcia@ejemplo.com',
        'luis.rodriguez@ejemplo.com',
        'sergio.basconcillos@ejemplo.com',
        'yeray.olgado@ejemplo.com',
        'javier.uribe@ejemplo.com',
        'urtzi.diaz@ejemplo.com',
        'iker.estibariz@ejemplo.com',
        'antonio.perez@ejemplo.com',
        'miguel.ricarte@ejemplo.com',
        'inigo.ullibarri@ejemplo.com',
        'fernando.alonso@ejemplo.com',
        'javier.fuente@ejemplo.com',
        'victor.cirre@ejemplo.com',
        'patxi.minguez@ejemplo.com',
        'jon.calleja@ejemplo.com',
        'jose.gil@ejemplo.com',
        'enekoitz.arregi@ejemplo.com',
        'ander.leyun@ejemplo.com',
        'alberto.garcia2@ejemplo.com',
        'gorka.ramirez@ejemplo.com',
        'axier.plaza@ejemplo.com',
        'jon.errasti@ejemplo.com',
        'aitor.fuente@ejemplo.com',
        'ahmad.hamam@ejemplo.com',
        'roberto.mediavilla@ejemplo.com',
        'mikel.fernandez@ejemplo.com',
        'asier.etxenike@ejemplo.com',
        'ricardo.alvarez@ejemplo.com',
        'chesco.angulo@ejemplo.com',
        'asier.usunaga@ejemplo.com',
        'markel.santamaria@ejemplo.com',
        'asier.barrieta@ejemplo.com',
        'julen.arejolaleiba@ejemplo.com',
        'josu.jauregui@ejemplo.com',
        'felix.martin@ejemplo.com',
        'inigo.hernandez@ejemplo.com',
        'david.arias@ejemplo.com',
        'cristian.chaves@ejemplo.com',
        'aitor.alonso@ejemplo.com',
        'damian.escobero@ejemplo.com',
        'jon.narvaez@ejemplo.com',
        'inigo.viana@ejemplo.com',
        'guillermo.fortan@ejemplo.com',
        'juan.lopez@ejemplo.com',
        'enrique.estibariz@ejemplo.com',
        'simon.garcia@ejemplo.com',
        'inaki.hualde@ejemplo.com',
        'xabi.fndz@ejemplo.com',
        'aitor.longarte@ejemplo.com',
        'mikel.riano@ejemplo.com',
        'inigo.vera@ejemplo.com',
        'koldo.txurruka@ejemplo.com',
        'israel.idiakez@ejemplo.com',
        'pedro.garcia@ejemplo.com',
        'unax.merino@ejemplo.com',
        'mikel.herran@ejemplo.com',
        'iker.pesquera@ejemplo.com',
        'rakel.abad@ejemplo.com',
        'jaime.brea@ejemplo.com',
        'asier.garaikoetxea@ejemplo.com',
        'hector.velasco@ejemplo.com',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <img 
                            src="/logo.jpg" 
                            alt="FreeSquash Logo" 
                            className="h-32 w-32 sm:h-48 sm:w-48 object-cover rounded-full shadow-2xl border-4 border-white dark:border-slate-700"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 px-2">
                        Bienvenido a FreeSquash League
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 px-2">
                        Temporada Enero-Febrero 2026
                    </p>
                </div>

                {/* Mensaje Motivador */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 border-2 border-green-200 dark:border-green-700">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="text-3xl sm:text-5xl">🚀</div>
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                                ¡Adiós Excel, hola a la era digital!
                            </h2>
                            <div className="space-y-2 sm:space-y-3 text-slate-700 dark:text-slate-300">
                                <p className="text-base sm:text-lg leading-relaxed">
                                    Antes gestionábamos la liga con hojas de cálculo compartidas. <strong>Era un caos:</strong> resultados perdidos, 
                                    clasificaciones desactualizadas, dificultad para contactar rivales...
                                </p>
                                <p className="text-base sm:text-lg leading-relaxed">
                                    <strong>Ahora todo cambia.</strong> Con FreeSquash League puedes:
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 my-3 sm:my-4">
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-lg">
                                        <span className="text-green-500 text-lg sm:text-xl">✓</span>
                                        <span className="text-sm sm:text-base">Ver tu clasificación en tiempo real</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>Registrar partidos en segundos</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>Contactar fácilmente a tus rivales</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>Ver tu progreso y estadísticas</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>Acceder desde cualquier dispositivo</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>Recibir notificaciones de nuevos partidos</span>
                                    </li>
                                </ul>
                                <p className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400 mt-3 sm:mt-4">
                                    💪 ¡Es hora de llevar tu juego al siguiente nivel! Entra, juega, compite y mejora.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instrucciones de Primer Acceso */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                        🔑 Primer Acceso
                    </h2>
                    
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-lg">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                                1️⃣ Encuentra tu email en la lista
                            </h3>
                            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                Busca tu email en la lista de jugadores registrados más abajo.
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 sm:p-6 rounded-r-lg">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                                2️⃣ Inicia sesión con tu contraseña temporal
                            </h3>
                            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 mb-3">
                                Tu contraseña inicial es:
                            </p>
                            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-lg font-mono text-xl sm:text-2xl font-bold text-center text-green-600 dark:text-green-400 border-2 border-green-200 dark:border-green-700">
                                123456
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                3️⃣ Cambia tu contraseña (recomendado)
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300">
                                Una vez dentro, ve a tu perfil y cambia la contraseña por una que solo tú conozcas.
                            </p>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-6 rounded-r-lg">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                4️⃣ Añade tu teléfono (importante)
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300">
                                En tu perfil, añade tu número de teléfono. Esto permite que tus rivales puedan contactarte fácilmente para coordinar partidos por WhatsApp o llamada.
                            </p>
                        </div>

                        <div className="text-center mt-8">
                            <Link 
                                to="/login" 
                                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-colors"
                            >
                                Iniciar Sesión →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Lista de Jugadores */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                        👥 Jugadores Registrados ({emails.length})
                    </h2>
                    
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                        Busca tu email en esta lista para confirmar que estás registrado:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-h-64 sm:max-h-96 overflow-y-auto p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {emails.map((email, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                            >
                                <span className="text-blue-500 dark:text-blue-400">✓</span>
                                <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                                    {email}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ayuda */}
                <div className="mt-6 sm:mt-8 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 sm:p-6 inline-block">
                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                            ¿Problemas para acceder?
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Contacta con el administrador de la liga
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
