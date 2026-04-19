import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

function Section({
    title,
    children,
    tone = 'default',
}: {
    title: string;
    children: React.ReactNode;
    tone?: 'default' | 'info' | 'success' | 'warning';
}) {
    const toneClass =
        tone === 'info'
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
            : tone === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                : tone === 'warning'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';

    return (
        <section className={`rounded-2xl p-6 shadow-lg border ${toneClass}`}>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{title}</h2>
            <div className="space-y-3 text-slate-600 dark:text-slate-300">{children}</div>
        </section>
    );
}

export default function Help() {
    const { language } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">{tr('Manual de jugador', 'Jokalari gida')}</h1>
                <p className="text-amber-100">
                    {tr(
                        'Gu\u00EDa r\u00E1pida y actualizada para usar FreeSquash Liga.',
                        'FreeSquash Liga erabiltzeko gida azkar eta eguneratua.',
                    )}
                </p>
            </div>

            <Section title={tr('Inicio r\u00E1pido', 'Hasiera azkarra')}>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('Inicia sesi\u00F3n con tu email y contrase\u00F1a.', 'Hasi saioa zure emailarekin eta pasahitzarekin.')}</li>
                    <li>{tr('Revisa y actualiza tus datos en Perfil.', 'Egiaztatu eta eguneratu zure datuak Profilean.')}</li>
                    <li>{tr('Elige idioma desde el footer (ES/EU).', 'Aukeratu hizkuntza footerren (ES/EU).')}</li>
                    <li>{tr('Si no puedes entrar, contacta con un admin.', 'Sartu ezin baduzu, jarri harremanetan admin batekin.')}</li>
                </ul>
            </Section>

            <Section title={tr('Navegaci\u00F3n principal', 'Nabigazio nagusia')}>
                <p>{tr('Estas son las pantallas clave para el d\u00EDa a d\u00EDa:', 'Hauek dira eguneroko pantaila nagusiak:')}</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('Inicio: resumen de tu temporada y estad\u00EDsticas.', 'Hasiera: denboraldiko laburpena eta estatistikak.')}</li>
                    <li>{tr('Tu grupo: clasificaci\u00F3n, contactos y partidos.', 'Zure taldea: sailkapena, kontaktuak eta partidak.')}</li>
                    <li>{tr('Registrar partido: alta de resultados.', 'Partida erregistratu: emaitzen alta.')}</li>
                    <li>{tr('Historial: filtros, edici\u00F3n y control de resultados.', 'Historia: iragazkiak, edizioa eta emaitzen kontrola.')}</li>
                    <li>{tr('Resumen de grupos, Historia global y Lista Negra.', 'Taldeen laburpena, Historia orokorra eta Zerrenda Beltza.')}</li>
                </ul>
            </Section>

            <Section title={tr('C\u00F3mo registrar un partido', 'Nola erregistratu partida bat')}>
                <ol className="list-decimal list-inside space-y-2">
                    <li>{tr('Entra en "Registrar partido".', '"Partida erregistratu" atalera sartu.')}</li>
                    <li>{tr('Selecciona rival y fecha.', 'Aukeratu aurkaria eta data.')}</li>
                    <li>{tr('Marca estado y resultado (3-0, 3-1 o 3-2).', 'Markatu egoera eta emaitza (3-0, 3-1 edo 3-2).')}</li>
                    <li>{tr('Guarda y revisa en historial si necesitas editar.', 'Gorde eta historian berrikusi, editatu behar baduzu.')}</li>
                </ol>
                <p>
                    {tr(
                        'Si hubo lesi\u00F3n de temporada, usa la opci\u00F3n de lesi\u00F3n en el formulario.',
                        'Denboraldiko lesioa egon bada, erabili lesio aukera formularioan.',
                    )}
                </p>
                <div>
                    <Link to="/matches/record" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                        {tr('Ir a Registrar partido', 'Joan Partida erregistratzera')}
                    </Link>
                </div>
            </Section>

            <Section title={tr('Historial y correcciones', 'Historia eta zuzenketak')}>
                <p>
                    {tr(
                        'En "Historial de partidos" puedes filtrar por nombre, fecha, temporada y grupo.',
                        '"Partiden historia" atalean izen, data, denboraldi eta taldearen arabera iragazi dezakezu.',
                    )}
                </p>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('Puedes editar resultados cuando sea necesario.', 'Emaitzak editatu ditzakezu behar denean.')}</li>
                    <li>{tr('Los admins pueden eliminar partidos si hace falta.', 'Admin-ek partidak ezabatu ditzakete beharrezkoa bada.')}</li>
                </ul>
                <div>
                    <Link to="/matches/history" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                        {tr('Ir a Historial de partidos', 'Joan Partiden historiara')}
                    </Link>
                </div>
            </Section>

            <Section title={tr('Calendario (beta)', 'Egutegia (beta)')} tone="warning">
                <p>
                    {tr(
                        'El calendario est\u00E1 en fase beta. Primero act\u00EDvalo en tu Perfil.',
                        'Egutegia beta fasean dago. Lehenik eta behin Profilean aktibatu.',
                    )}
                </p>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('Permite programar partidos con fecha, hora y pista.', 'Data, ordua eta pista zehaztuta partidak programatzeko balio du.')}</li>
                    <li>{tr('Puedes sincronizar partidos con Google Calendar.', 'Partidak Google Calendarekin sinkroniza ditzakezu.')}</li>
                </ul>
                <div>
                    <Link to="/profile" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                        {tr('Ir a Perfil', 'Joan Profilera')}
                    </Link>
                </div>
            </Section>

            <Section title={tr('Notificaciones push', 'Push jakinarazpenak')} tone="info">
                <p>
                    {tr(
                        'Act\u00EDvalas en Perfil para recibir avisos en este dispositivo.',
                        'Aktibatu Profilean gailu honetan abisuak jasotzeko.',
                    )}
                </p>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('Si el navegador bloquea permisos, debes habilitarlos manualmente.', 'Nabigatzaileak baimenak blokeatzen baditu, eskuz gaitu behar dira.')}</li>
                    <li>{tr('Se usan para avisos de liga y cambios relevantes.', 'Ligako abisu eta aldaketa garrantzitsuetarako erabiltzen dira.')}</li>
                </ul>
            </Section>

            <Section title={tr('Informaci\u00F3n p\u00FAblica y privacidad', 'Info publikoa eta pribatutasuna')}>
                <ul className="list-disc list-inside space-y-1">
                    <li>{tr('P\u00FAblico: clasificaciones, partidos y estad\u00EDsticas generales.', 'Publikoa: sailkapenak, partidak eta estatistika orokorrak.')}</li>
                    <li>{tr('Privado: tel\u00E9fono y email solo para usuarios autenticados.', 'Pribatua: telefonoa eta emaila erabiltzaile autentifikatuentzat bakarrik.')}</li>
                    <li>{tr('Puedes consultar legal, t\u00E9rminos y privacidad en el footer.', 'Legezko oharra, baldintzak eta pribatutasuna footerren ikus ditzakezu.')}</li>
                </ul>
            </Section>

            <Section title={tr('Problemas comunes', 'Ohiko arazoak')}>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{tr('No veo mi grupo', 'Ez dut nire taldea ikusten')}</h3>
                    <p>{tr('Suele pasar si no est\u00E1s asignado o no hay temporada activa.', 'Normalean gertatzen da esleituta ez bazaude edo denboraldi aktiborik ez badago.')}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{tr('No aparece un rival en registro', 'Ez da aurkari bat agertzen erregistroan')}</h3>
                    <p>{tr('Puede ser porque ya jugaste ese cruce o no es de tu grupo.', 'Baliteke partida hori jokatuta egotea edo zure taldekoa ez izatea.')}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{tr('La web va lenta o no carga', 'Weba motel dabil edo ez du kargatzen')}</h3>
                    <p>{tr('Haz recarga dura (Ctrl+F5). Si sigue, reporta bug.', 'Egin karga gogorra (Ctrl+F5). Jarraitzen badu, bug bat bidali.')}</p>
                </div>
            </Section>

            <Section title={tr('Reportar un problema', 'Arazo bat bidali')} tone="success">
                <p>
                    {tr(
                        'Si encuentras un error, env\u00EDa un reporte con pasos claros: qu\u00E9 hiciste, qu\u00E9 esperabas y qu\u00E9 pas\u00F3.',
                        'Errore bat aurkitzen baduzu, bidali txosten bat pauso argiekin: zer egin duzun, zer espero zenuen eta zer gertatu den.',
                    )}
                </p>
                <div>
                    <Link to="/report-bug" className="text-green-700 dark:text-green-300 font-semibold hover:underline">
                        {tr('Ir a Reportar bug', 'Joan Bug-a bidaltzera')}
                    </Link>
                </div>
            </Section>
        </div>
    );
}
