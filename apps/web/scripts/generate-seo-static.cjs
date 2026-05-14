const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const baseFile = path.join(distDir, 'index.html');
const baseUrl = 'https://free-liga-web.vercel.app';

if (!fs.existsSync(baseFile)) {
  console.error('[seo-static] Missing dist/index.html. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(baseFile, 'utf8');

const routes = [
  {
    route: '/',
    title: 'FreeSquash Liga | Liga de squash en Vitoria-Gasteiz',
    description:
      'FreeSquash Liga, liga de squash en Vitoria-Gasteiz. Partidos, clasificacion, ranking y estadisticas en tiempo real.',
    robots: 'index,follow',
  },
  {
    route: '/inicio',
    title: 'FreeSquash Liga | Liga de squash en Vitoria-Gasteiz',
    description:
      'FreeSquash Liga, liga de squash en Vitoria-Gasteiz. Partidos, clasificacion, ranking y estadisticas en tiempo real.',
    robots: 'index,follow',
  },
  {
    route: '/public/groups',
    title: 'Grupos y clasificacion | FreeSquash Liga',
    description:
      'Consulta la clasificacion por grupos de la temporada en FreeSquash Liga, la liga de squash de Vitoria-Gasteiz.',
    robots: 'index,follow',
  },
  {
    route: '/public/matches',
    title: 'Ultimos partidos | FreeSquash Liga',
    description:
      'Mira los resultados de los ultimos partidos de squash en FreeSquash Liga, en Vitoria-Gasteiz.',
    robots: 'index,follow',
  },
  {
    route: '/legal',
    title: 'Informacion legal | FreeSquash Liga',
    description:
      'Consulta las politicas de privacidad, terminos y aviso legal de FreeSquash Liga.',
    robots: 'index,follow',
  },
  {
    route: '/privacy',
    title: 'Politica de privacidad | FreeSquash Liga',
    description:
      'Consulta la politica de privacidad de FreeSquash Liga.',
    robots: 'index,follow',
  },
  {
    route: '/terms',
    title: 'Terminos de servicio | FreeSquash Liga',
    description:
      'Consulta los terminos de servicio de FreeSquash Liga.',
    robots: 'index,follow',
  },
  {
    route: '/login',
    title: 'Iniciar sesion | FreeSquash Liga',
    description: 'Acceso para jugadores y administradores de FreeSquash Liga.',
    robots: 'noindex,nofollow',
  },
  {
    route: '/dashboard',
    title: 'Panel de usuario | FreeSquash Liga',
    description: 'Area privada de FreeSquash Liga.',
    robots: 'noindex,nofollow',
  },
  {
    route: '/admin',
    title: 'Panel admin | FreeSquash Liga',
    description: 'Area privada de administracion de FreeSquash Liga.',
    robots: 'noindex,nofollow',
  },
];

function applySeo(html, cfg) {
  const canonical = `${baseUrl}${cfg.route}`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${cfg.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/i, `<meta name="description" content="${cfg.description}" />`)
    .replace(/<meta name="robots" content="[^"]*"\s*\/?>/i, `<meta name="robots" content="${cfg.robots}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${cfg.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${cfg.description}" />`)
    .replace(/<meta property="twitter:url" content="[^"]*"\s*\/?>/i, `<meta property="twitter:url" content="${canonical}" />`)
    .replace(/<meta property="twitter:title" content="[^"]*"\s*\/?>/i, `<meta property="twitter:title" content="${cfg.title}" />`)
    .replace(/<meta property="twitter:description" content="[^"]*"\s*\/?>/i, `<meta property="twitter:description" content="${cfg.description}" />`);
}

for (const cfg of routes) {
  const targetDir = cfg.route === '/' ? distDir : path.join(distDir, cfg.route.slice(1));
  const targetFile = path.join(targetDir, 'index.html');
  fs.mkdirSync(targetDir, { recursive: true });
  const html = applySeo(baseHtml, cfg);
  fs.writeFileSync(targetFile, html, 'utf8');
}

console.log(`[seo-static] Generated ${routes.length} SEO route files.`);
