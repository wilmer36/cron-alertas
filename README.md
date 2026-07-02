# Puente de cron para FlotaControl (bypass anti-bot de InfinityFree)

InfinityFree bloquea las peticiones automatizadas simples (curl,
cron-job.org, wget, etc.) con un challenge anti-bot que requiere
ejecutar JavaScript como un navegador real. Esto impide que un cron
externo tradicional dispare `cron_alertas.php`.

Este proyecto usa **GitHub Actions** + **Playwright** (Chromium
headless) para abrir la URL del cron como si fuera un navegador de
verdad, resolver el challenge, y dejar que `cron_alertas.php` se
ejecute con normalidad.

## 1. Crear el repositorio

1. Crea un repositorio nuevo en GitHub (puede ser **privado**, no
   hace falta que sea público).
2. Sube estos archivos manteniendo la estructura de carpetas
   exactamente así:
   ```
   .github/workflows/cron-alertas.yml
   run-cron.js
   package.json
   README.md
   ```
   (la carpeta `.github/workflows/` es obligatoria y debe llamarse así).

## 2. Configurar el secret con tu URL de cron

**No pongas la URL con el secret directo en el código** — usa un
secret de repositorio para no exponer `cron_secret` en un repo público
ni en el historial de commits.

1. En GitHub: **Settings → Secrets and variables → Actions → New
   repository secret**.
2. Name: `CRON_URL`
3. Value:
   ```
   https://kilometrajesviru.likesyou.org/administrador/cron_alertas.php?cron_secret=FlotaX-2026-Denis-9
   ```
4. Guardar.

## 3. Probar manualmente (sin esperar 5 minutos)

1. Ve a la pestaña **Actions** del repositorio.
2. Si es la primera vez, GitHub puede pedirte habilitar Actions —
   acéptalo.
3. Entra al workflow **"Cron Alertas FlotaControl"**.
4. Click en **"Run workflow"** (botón a la derecha) → **Run workflow**.
5. Espera ~30-60 segundos y abre el log del job **run-cron** → step
   **"Ejecutar cron_alertas.php vía navegador headless"**.

### Cómo saber si funcionó

En el log deberías ver algo como:

```
── Respuesta del servidor ─────────────────────────
[17:00:03] Revisando alertas — hora Lima: 17:00 | fecha: 2026-07-01
[17:00:03] Sin avisos programados hasta 17:00. Fin.
────────────────────────────────────────────────────
[OK] cron_alertas.php se ejecutó correctamente.
```

Si en cambio ves HTML, una página de "verificando tu navegador", o el
error `[ERROR] La respuesta no parece la de cron_alertas.php`, el
challenge no se resolvió a tiempo — sube el `waitForTimeout` en
`run-cron.js` (por ejemplo de 6000 a 10000 ms) y vuelve a probar.

Si ves `Acceso denegado`, revisa que el `cron_secret` en el secret
`CRON_URL` sea exactamente el mismo que tiene `cron_alertas.php` en el
servidor.

## 4. Dejar que corra solo

Una vez que la prueba manual funciona, no necesitas hacer nada más:
el `schedule` del workflow lo dispara automáticamente cada 5 minutos.

**Nota sobre el horario:** GitHub Actions no garantiza el minuto
exacto (mínimo soportado: cada 5 minutos, con posibles demoras
adicionales en horas pico). Por eso `cron_alertas.php` ya no compara
la hora de forma exacta: usa una ventana (`hora <= horaActual`) y
evita reenvíos duplicados revisando `alertas_historial`. Con eso, unos
minutos de retraso no hacen que se pierda un aviso — simplemente se
envía en la siguiente ejecución.

**Nota sobre inactividad:** GitHub puede pausar automáticamente los
workflows programados (`schedule`) si el repositorio queda 60 días sin
ningún commit. Si eso pasa, entra a Actions y reactívalo manualmente,
o haz un commit pequeño de vez en cuando (por ejemplo, actualizar este
README con la fecha).

## 5. Revisar que el lado del servidor también está funcionando

Además de este puente, recuerda que subiste una versión de
`cron_alertas.php` que escribe su propio log en
`administrador/cron_alertas.log`. Revísalo por FTP/gestor de archivos
después de una ejecución para confirmar que las alertas se están
insertando en `alertas_historial` y enviándose por FCM.
