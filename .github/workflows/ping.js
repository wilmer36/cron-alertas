// ping.js — Abre la URL de cron_alertas.php con un navegador headless real,
// para que InfinityFree resuelva su challenge JS y deje pasar la petición.
//
// La URL completa (con el cron_secret) se lee de la variable de entorno
// CRON_URL, que viene del secret de GitHub Actions. Así el secreto nunca
// queda expuesto en el código ni en los logs del workflow.

const puppeteer = require('puppeteer');

const CRON_URL = process.env.CRON_URL;

if (!CRON_URL) {
  console.error('[ERROR] Falta la variable de entorno CRON_URL (configura el secret en GitHub).');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // User-Agent de navegador normal, para que no parezca headless de entrada.
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    console.log('[INFO] Abriendo URL de cron...');
    const response = await page.goto(CRON_URL, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });

    const status = response ? response.status() : null;
    const texto = await page.content();

    console.log('[INFO] HTTP status:', status);
    // Solo mostramos los primeros 500 caracteres del cuerpo, por si hay HTML del challenge.
    console.log('[INFO] Primeros 500 caracteres de la respuesta:');
    console.log(texto.slice(0, 500));

    if (status !== 200) {
      console.error('[WARN] La respuesta no fue 200. Puede que el challenge anti-bot no se haya resuelto.');
      process.exitCode = 1;
    } else {
      console.log('[OK] Cron disparado correctamente.');
    }
  } catch (err) {
    console.error('[ERROR] Fallo al abrir la URL:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
