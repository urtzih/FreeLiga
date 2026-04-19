import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Welcome() {
    const { language } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);
    const emails = [
    'ahmad.hamam@ejemplo.com',
    'aitor.alonso@ejemplo.com',
    'aitor.fuente@ejemplo.com',
    'aitor.garcia@ejemplo.com',
    'aitor.longarte@ejemplo.com',
    'alberto.garcia@ejemplo.com',
    'alberto.garcia2@ejemplo.com',
    'alexander.egido@ejemplo.com',
    'ander.leyun@ejemplo.com',
    'antonio.perez@ejemplo.com',
    'aritz.ruiz@ejemplo.com',
    'asier.barrieta@ejemplo.com',
    'asier.etxenike@ejemplo.com',
    'asier.garaikoetxea@ejemplo.com',
    'asier.renobales@ejemplo.com',
    'asier.soto@ejemplo.com',
    'asier.usunaga@ejemplo.com',
    'axier.plaza@ejemplo.com',
    'bikendi.otalora@ejemplo.com',
    'cesar.berganzo@ejemplo.com',
    'chesco.angulo@ejemplo.com',
    'cristian.chaves@ejemplo.com',
    'damian.escobero@ejemplo.com',
    'david.arias@ejemplo.com',
    'david.gancedo@ejemplo.com',
    'eneko.izquierdo@ejemplo.com',
    'eneko.uriarte@ejemplo.com',
    'enekoitz.arregi@ejemplo.com',
    'enrique.estibariz@ejemplo.com',
    'enrique.oquinena@ejemplo.com',
    'felix.martin@ejemplo.com',
    'fernando.alonso@ejemplo.com',
    'gari.suarez@ejemplo.com',
    'gorka.ramirez@ejemplo.com',
    'guillermo.fortan@ejemplo.com',
    'hector.velasco@ejemplo.com',
    'iker.estibariz@ejemplo.com',
    'iker.pesquera@ejemplo.com',
    'inaki.hualde@ejemplo.com',
    'inigo.alonso@ejemplo.com',
    'inigo.hernandez@ejemplo.com',
    'inigo.ullibarri@ejemplo.com',
    'inigo.vera@ejemplo.com',
    'inigo.viana@ejemplo.com',
    'israel.idiakez@ejemplo.com',
    'itzel.reguero@ejemplo.com',
    'jaime.brea@ejemplo.com',
    'javier.crespo@ejemplo.com',
    'javier.fuente@ejemplo.com',
    'javier.guinea@ejemplo.com',
    'javier.pacheco@ejemplo.com',
    'javier.uribe@ejemplo.com',
    'jon.barrena@ejemplo.com',
    'jon.calleja@ejemplo.com',
    'jon.errasti@ejemplo.com',
    'jon.narvaez@ejemplo.com',
    'jon.tona@ejemplo.com',
    'jose.gil@ejemplo.com',
    'josu.jauregui@ejemplo.com',
    'juan.lopez@ejemplo.com',
    'julen.arejolaleiba@ejemplo.com',
    'koldo.txurruka@ejemplo.com',
    'luis.rodriguez@ejemplo.com',
    'markel.santamaria@ejemplo.com',
    'miguel.ricarte@ejemplo.com',
    'mikel.fernandez@ejemplo.com',
    'mikel.herran@ejemplo.com',
    'mikel.riano@ejemplo.com',
    'oier.quesada@ejemplo.com',
    'oskar.bustinza@gmail.com',
    'patxi.minguez@ejemplo.com',
    'pedro.garcia@ejemplo.com',
    'rakel.abad@ejemplo.com',
    'ricardo.alvarez@ejemplo.com',
    'roberto.mediavilla@ejemplo.com',
    'ruben.garcia@ejemplo.com',
    'sergio.barquin@ejemplo.com',
    'sergio.basconcillos@ejemplo.com',
    'santi.tobias@ejemplo.com',
    'simon.garcia@ejemplo.com',
    'unax.merino@ejemplo.com',
    'urtzi.diaz@ejemplo.com',
    'vicente.avila@ejemplo.com',
    'victor.cirre@ejemplo.com',
    'xabi.fndz@ejemplo.com',
    'yeray.olgado@ejemplo.com',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-900 dark:to-slate-800">
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
                        {tr('Bienvenido a FreeSquash Liga', 'Ongi etorri FreeSquash Ligara')}
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 px-2">
                        {tr('Temporada Enero-Febrero 2026', '2026ko Urtarrila-Otsaila denboraldia')}
                    </p>
                </div>

                {/* Mensaje Motivador */}
                <div className="bg-gradient-to-r from-green-50 to-amber-50 dark:from-green-900/20 dark:to-amber-900/20 rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 border-2 border-green-200 dark:border-green-700">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="text-3xl sm:text-5xl">🚀</div>
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
                                {tr('¡Adiós Excel, hola a la era digital!', 'Agur Excel, kaixo aro digitala!')}
                            </h2>
                            <div className="space-y-2 sm:space-y-3 text-slate-700 dark:text-slate-300">
                                <p className="text-base sm:text-lg leading-relaxed">
                                    {tr('Antes gestionábamos la liga con hojas de cálculo compartidas.', 'Lehen liga kalkulu-orri partekatuekin kudeatzen genuen.')}{' '}
                                    <strong>{tr('Era un caos:', 'Kaosa zen:')}</strong>{' '}
                                    {tr('resultados perdidos, clasificaciones desactualizadas, dificultad para contactar rivales...', 'emaitzak galduta, sailkapen zaharkituak eta aurkariekin harremanetan jartzeko zailtasunak...')}
                                </p>
                                <p className="text-base sm:text-lg leading-relaxed">
                                    <strong>{tr('Ahora todo cambia.', 'Orain dena aldatzen da.')}</strong> {tr('Con FreeSquash Liga puedes:', 'FreeSquash Ligarekin honako hau egin dezakezu:')}
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 my-3 sm:my-4">
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-lg">
                                        <span className="text-green-500 text-lg sm:text-xl">✓</span>
                                        <span className="text-sm sm:text-base">Ver tu clasificación en tiempo real</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>{tr('Registrar partidos en segundos', 'Partidak segundotan erregistratu')}</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>{tr('Contactar fácilmente a tus rivales', 'Zure aurkariekin erraz harremanetan jarri')}</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>{tr('Ver tu progreso y estadísticas', 'Zure aurrerapena eta estatistikak ikusi')}</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>{tr('Acceder desde cualquier dispositivo', 'Edozein gailutatik sartu')}</span>
                                    </li>
                                    <li className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <span className="text-green-500 text-xl">✓</span>
                                        <span>{tr('Recibir notificaciones de nuevos partidos', 'Partida berrien jakinarazpenak jaso')}</span>
                                    </li>
                                </ul>
                                <p className="text-base sm:text-lg font-semibold text-green-700 dark:text-green-400 mt-3 sm:mt-4">
                                    {tr('💪 ¡Es hora de llevar tu juego al siguiente nivel! Entra, juega, compite y mejora.', '💪 Zure jokoa hurrengo mailara eramateko ordua da! Sartu, jokatu, lehiatu eta hobetu.')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instrucciones de Primer Acceso */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                        {tr('🔑 Primer acceso', '🔑 Lehen sarbidea')}
                    </h2>
                    
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 sm:p-6 rounded-r-lg">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                                {tr('1. Encuentra tu email en la lista', '1. Aurkitu zure emaila zerrendan')}
                            </h3>
                            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300">
                                {tr('Busca tu email en la lista de jugadores registrados más abajo.', 'Bilatu zure emaila beheko jokalari erregistratuen zerrendan.')}
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 sm:p-6 rounded-r-lg">
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                                {tr('2. Inicia sesión con tu contraseña temporal', '2. Hasi saioa behin-behineko pasahitzarekin')}
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
                                {tr('3. Cambia tu contraseña (recomendado)', '3. Aldatu pasahitza (gomendatua)')}
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300">
                                Una vez dentro, ve a tu perfil y cambia la contraseña por una que solo tú conozcas.
                            </p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                {tr('4. Añade tu teléfono (importante)', '4. Gehitu zure telefonoa (garrantzitsua)')}
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300">
                                {tr('En tu perfil, añade tu número de teléfono. Esto permite que tus rivales puedan contactarte fácilmente para coordinar partidos por WhatsApp o llamada.', 'Zure profilean, gehitu telefono zenbakia. Horrela aurkariek errazago jar daitezke zurekin harremanetan partidak koordinatzeko WhatsApp edo deien bidez.')}
                            </p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-lg">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                                📱 Instala la app en tu móvil (recomendado)
                            </h3>
                            <div className="text-slate-700 dark:text-slate-300 space-y-3">
                                <p>
                                    Para una mejor experiencia, te recomendamos instalar FreeSquash como aplicación en tu móvil:
                                </p>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg">
                                    <p className="font-semibold mb-2">{tr('📲 En Android:', '📲 Androiden:')}</p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                                        <li>Abre esta página en Chrome</li>
                                        <li>Toca el menú (⋮) y selecciona "Añadir a pantalla de inicio"</li>
                                        <li>{tr('Confirma y la app aparecerá en tu pantalla de inicio', 'Berretsi eta app-a hasierako pantailan agertuko da')}</li>
                                    </ol>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-lg">
                                    <p className="font-semibold mb-2">{tr('🍎 En iPhone:', '🍎 iPhone-n:')}</p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                                        <li>Abre esta página en Safari</li>
                                        <li>Toca el botón de compartir (□↑)</li>
                                        <li>Selecciona "Añadir a pantalla de inicio"</li>
                                        <li>{tr('Confirma y busca el icono de FreeSquash en tu pantalla', 'Berretsi eta bilatu FreeSquash ikonoa pantailan')}</li>
                                    </ol>
                                </div>
                                <p className="text-sm italic">
                                    💡 Una vez instalada, podrás acceder a FreeSquash como cualquier otra app de tu móvil, sin necesidad de abrir el navegador.
                                </p>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <Link 
                                to="/login" 
                                className="inline-block px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg rounded-xl shadow-lg transition-colors"
                            >
                                {tr('Iniciar sesión →', 'Hasi saioa →')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Lista de Jugadores */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                        {tr(`👥 Jugadores registrados (${emails.length})`, `👥 Jokalari erregistratuak (${emails.length})`)}
                    </h2>
                    
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                        {tr('Busca tu email en esta lista para confirmar que estás registrado:', 'Bilatu zure emaila zerrenda honetan erregistratuta zaudela baieztatzeko:')}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 max-h-64 sm:max-h-96 overflow-y-auto p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {emails.map((email, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors"
                            >
                                <span className="text-amber-500 dark:text-amber-400">✓</span>
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
                            {tr('¿Problemas para acceder?', 'Sartzeko arazoak?')}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {tr('Contacta con el administrador de la liga', 'Jarri ligako administratzailearekin harremanetan')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

