import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const BASE_URL = 'https://free-liga-web.vercel.app';

type SeoConfig = {
    title: string;
    description: string;
    canonicalPath: string;
    robots: 'index,follow' | 'noindex,nofollow';
};

function upsertMetaByName(name: string, content: string) {
    let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
    let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
    let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
}

function upsertJsonLd(id: string, payload: unknown) {
    let el = document.head.querySelector(`#${id}`) as HTMLScriptElement | null;
    if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);
}

function removeJsonLd(id: string) {
    const el = document.head.querySelector(`#${id}`);
    if (el) {
        el.remove();
    }
}

function getSeoConfig(pathname: string, isBasque: boolean): SeoConfig {
    const homeTitle = isBasque
        ? 'FreeSquash Liga | Vitoria-Gasteizko squash liga'
        : 'FreeSquash Liga | Liga de squash en Vitoria-Gasteiz';
    const homeDescription = isBasque
        ? 'FreeSquash Liga (Free Liga Vitoria-Gasteiz): Vitoria-Gasteizko squash liga. Partidak, sailkapena, rankinga eta estatistikak denbora errealean.'
        : 'FreeSquash Liga (Free Liga Vitoria-Gasteiz), liga squash Vitoria-Gasteiz. Partidos, clasificacion, ranking y estadisticas en tiempo real.';

    if (pathname === '/' || pathname === '/inicio') {
        return {
            title: homeTitle,
            description: homeDescription,
            canonicalPath: pathname,
            robots: 'index,follow',
        };
    }

    if (pathname === '/public/groups') {
        return {
            title: isBasque
                ? 'Taldeak eta sailkapena | FreeSquash Liga'
                : 'Grupos y clasificacion | FreeSquash Liga',
            description: isBasque
                ? 'Ikusi denboraldiko taldeen sailkapena FreeSquash Liga-n, Vitoria-Gasteizko squash ligan.'
                : 'Consulta la clasificacion por grupos de la temporada en FreeSquash Liga, la liga de squash de Vitoria-Gasteiz.',
            canonicalPath: pathname,
            robots: 'index,follow',
        };
    }

    if (pathname === '/public/matches') {
        return {
            title: isBasque
                ? 'Azken partidak | FreeSquash Liga'
                : 'Ultimos partidos | FreeSquash Liga',
            description: isBasque
                ? 'Azken squash partidetako emaitzak ikusi FreeSquash Liga-n, Vitoria-Gasteizko ligan.'
                : 'Mira los resultados de los ultimos partidos de squash en FreeSquash Liga, en Vitoria-Gasteiz.',
            canonicalPath: pathname,
            robots: 'index,follow',
        };
    }

    if (pathname.startsWith('/public/group/')) {
        return {
            title: isBasque
                ? 'Taldearen sailkapen osoa | FreeSquash Liga'
                : 'Clasificacion completa del grupo | FreeSquash Liga',
            description: isBasque
                ? 'Taldeko sailkapen zehatza, partidak eta estatistikak FreeSquash Liga-n.'
                : 'Consulta la clasificacion completa del grupo, sus partidos y estadisticas en FreeSquash Liga.',
            canonicalPath: pathname,
            robots: 'index,follow',
        };
    }

    if (pathname === '/privacy' || pathname === '/terms' || pathname === '/legal') {
        return {
            title: isBasque ? 'Legezko informazioa | FreeSquash Liga' : 'Informacion legal | FreeSquash Liga',
            description: isBasque
                ? 'FreeSquash Liga-ren pribatutasun, zerbitzu eta lege baldintzak.'
                : 'Consulta las politicas de privacidad, terminos y aviso legal de FreeSquash Liga.',
            canonicalPath: pathname,
            robots: 'index,follow',
        };
    }

    return {
        title: 'FreeSquash Liga',
        description: homeDescription,
        canonicalPath: pathname,
        robots: 'noindex,nofollow',
    };
}

export default function SeoManager() {
    const location = useLocation();
    const { language, t } = useLanguage();

    useEffect(() => {
        const isBasque = language === 'eu';
        const seo = getSeoConfig(location.pathname, isBasque);
        if (location.pathname === '/' || location.pathname === '/inicio') {
            seo.title = t('seo.home.title');
            seo.description = t('seo.home.description');
        } else if (location.pathname === '/public/groups') {
            seo.title = t('seo.publicGroups.title');
            seo.description = t('seo.publicGroups.description');
        } else if (location.pathname === '/public/matches') {
            seo.title = t('seo.publicMatches.title');
            seo.description = t('seo.publicMatches.description');
        } else if (location.pathname.startsWith('/public/group/')) {
            seo.title = t('seo.publicGroupDetail.title');
            seo.description = t('seo.publicGroupDetail.description');
        } else if (location.pathname === '/privacy' || location.pathname === '/terms' || location.pathname === '/legal') {
            seo.title = t('seo.legal.title');
            seo.description = t('seo.legal.description');
        }
        const canonicalUrl = `${BASE_URL}${seo.canonicalPath}`;

        document.title = seo.title;
        upsertMetaByName('description', seo.description);
        upsertMetaByName('robots', seo.robots);
        upsertMetaByName('keywords', 'free squash liga, free liga vitoria-gasteiz, liga squash vitoria-gasteiz, squash vitoria-gasteiz');

        upsertCanonical(canonicalUrl);

        upsertMetaByProperty('og:type', 'website');
        upsertMetaByProperty('og:site_name', 'FreeSquash Liga');
        upsertMetaByProperty('og:url', canonicalUrl);
        upsertMetaByProperty('og:title', seo.title);
        upsertMetaByProperty('og:description', seo.description);
        upsertMetaByProperty('og:image', `${BASE_URL}/logo.jpg`);

        upsertMetaByProperty('twitter:card', 'summary_large_image');
        upsertMetaByProperty('twitter:url', canonicalUrl);
        upsertMetaByProperty('twitter:title', seo.title);
        upsertMetaByProperty('twitter:description', seo.description);
        upsertMetaByProperty('twitter:image', `${BASE_URL}/logo.jpg`);

        if (location.pathname === '/' || location.pathname === '/inicio') {
            upsertJsonLd('schema-organization', {
                '@context': 'https://schema.org',
                '@type': 'SportsOrganization',
                name: 'FreeSquash Liga',
                alternateName: ['FreeLiga', 'Free Liga Vitoria-Gasteiz'],
                url: BASE_URL,
                logo: `${BASE_URL}/logo.jpg`,
                sport: 'Squash',
                areaServed: 'Vitoria-Gasteiz',
                sameAs: ['https://www.instagram.com/freesquashgasteiz/'],
            });

            upsertJsonLd('schema-website', {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'FreeSquash Liga',
                alternateName: ['FreeLiga', 'Free Liga Vitoria-Gasteiz'],
                url: BASE_URL,
                inLanguage: isBasque ? ['eu', 'es'] : ['es', 'eu'],
            });
        } else {
            removeJsonLd('schema-organization');
            removeJsonLd('schema-website');
        }
    }, [language, location.pathname, t]);

    return null;
}
