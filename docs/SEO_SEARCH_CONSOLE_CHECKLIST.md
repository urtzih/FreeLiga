# SEO Search Console Checklist (FreeSquash Liga)

Fecha base: 2026-05-14
Propiedad canonica: https://free-liga-web.vercel.app/

## 1) Alta y verificacion
1. Entrar en Google Search Console con la cuenta del proyecto.
2. Anadir propiedad de tipo URL-prefix: `https://free-liga-web.vercel.app/`.
3. Completar verificacion con el metodo disponible (recomendado: HTML tag o DNS si hay dominio propio despues).

## 2) Envio de sitemap
1. Abrir `Indexacion -> Sitemaps`.
2. Enviar `https://free-liga-web.vercel.app/sitemap.xml`.
3. Confirmar estado `Correcto`.

## 3) Solicitud de indexacion de URLs clave
Usar `Inspeccion de URL` y pedir indexacion para:
- `https://free-liga-web.vercel.app/`
- `https://free-liga-web.vercel.app/public/groups`
- `https://free-liga-web.vercel.app/public/matches`
- `https://free-liga-web.vercel.app/inicio`
- `https://free-liga-web.vercel.app/legal`

## 4) Seguimiento semanal
1. Revisar `Paginas` (indexadas, excluidas, descubiertas).
2. Revisar `Sitemaps` (sin errores de lectura).
3. Revisar `Rendimiento -> Consultas` para variaciones de marca:
- `freesquash liga`
- `free liga squash`
- `liga squash vitoria`
4. Si una URL clave no indexa en 2-3 semanas, reinspeccionar y solicitar indexacion otra vez.

## 5) Criterios de aceptacion
- Sitemap sin errores en Search Console.
- Home y rutas publicas clave como indexadas.
- Empiezan a aparecer impresiones/clics de marca en `Rendimiento`.
