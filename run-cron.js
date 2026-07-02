// run-cron.js
// Abre cron_alertas.php con un navegador headless real (Chromium vía Playwright)
// para superar la protección anti-bot de InfinityFree, que bloquea peticiones
// automatizadas simples (curl, cron-job.org, etc.) pero permite navegadores
// que ejecutan JavaScript.

const { chromium } = require('playwright');

const CRON_URL = process.env.CRON_URL;

if (!CRON_URL) {
  console.error('[ERROR] Falta la variable de entorno CRON_URL (configúrala como secret en GitHub).');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  console.log(`[${new Date().toISOString()}] Abriendo: ${CRON_URL}`);

  try {
    await page.goto(CRON_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // El challenge anti-bot de InfinityFree suele tardar unos segundos
    // en resolverse y recargar la página. Le damos margen.
    await page.waitForTimeout(6000);

    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log('── Respuesta del servidor ─────────────────────────');
    console.log(bodyText.trim());
    console.log('────────────────────────────────────────────────────');

    if (bodyText.includes('Acceso denegado')) {
      console.error('[ERROR] El secret del cron fue rechazado (403). Revisa el valor de CRON_URL.');
      process.exitCode = 1;
    } else if (
      !bodyText.includes('Proceso completado') &&
      !bodyText.includes('Revisando alertas')
    ) {
      console.error(
        '[ERROR] La respuesta no parece la de cron_alertas.php. ' +
          'Es posible que el challenge anti-bot no se haya resuelto a tiempo, ' +
          'o que la ruta/URL haya cambiado.'
      );
      process.exitCode = 1;
    } else {
      console.log('[OK] cron_alertas.php se ejecutó correctamente.');
    }
  } catch (err) {
    console.error('[ERROR] Fallo navegando a la URL:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
