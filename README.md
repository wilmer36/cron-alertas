# Cron externo para FlotaControl (vía GitHub Actions)

Este mini-repo no necesita tener nada de tu sitio dentro. Su único trabajo es
abrir la URL de `cron_alertas.php` cada 15 minutos usando un navegador
headless real (Puppeteer), para que el sistema anti-bot de InfinityFree
ejecute el JavaScript del challenge y deje pasar la petición — algo que un
`curl` simple (como el que usa cron-job.org) no puede hacer.

## Pasos para configurarlo

1. **Crea un repositorio nuevo en GitHub** (puede ser público — así los
   Actions son ilimitados/gratis — o privado, con el límite gratis de 2000
   minutos/mes, que alcanza de sobra corriendo cada 15 min).

2. **Sube esta carpeta** tal cual (mantén la ruta `.github/workflows/`).

3. **Configura el secret con tu URL completa**, para que el `cron_secret`
   nunca quede visible en el código ni en los logs:
   - Ve a `Settings` → `Secrets and variables` → `Actions` → `New repository secret`.
   - Nombre: `CRON_URL`
   - Valor:
     ```
     https://kilometrajesviru.likesyou.org/administrador/cron_alertas.php?cron_secret=FlotaX-2026-Denis-9
     ```

4. **Haz commit y push.** GitHub detecta el workflow automáticamente.

5. Ve a la pestaña **Actions** del repo:
   - Deberías ver el workflow "Disparar cron de alertas FlotaControl".
   - Puedes probarlo ya mismo con el botón **Run workflow** (gracias a
     `workflow_dispatch`), sin esperar a que llegue la hora programada.
   - Revisa el log del run: si ves `[OK] Cron disparado correctamente.` y
     `HTTP status: 200`, funcionó. Si ves `[WARN]`, probablemente el challenge
     anti-bot cambió de forma y hay que ajustar el script.

## Notas importantes

- **El horario es en UTC**, no en hora Lima. `*/15 * * * *` corre cada
  15 minutos las 24 horas, así que no necesitas convertir husos horarios —
  simplemente siempre habrá una ejecución cerca de cualquier hora que
  configures en tus avisos (17:00, 18:00, etc. hora Lima).

- **GitHub no garantiza el minuto exacto.** En horas de mucha carga puede
  haber retrasos de varios minutos. Tu `cron_alertas.php` ya está diseñado
  con una ventana de tolerancia ("hora programada <= hora actual"), así que
  esto no debería ser un problema.

- **Si el repo queda sin actividad 60 días**, GitHub desactiva
  automáticamente los workflows programados. Tendrás que entrar a la
  pestaña Actions y reactivarlo manualmente (o hacer algún commit de vez en
  cuando).

- **Este método no es 100% a prueba de futuro.** InfinityFree podría
  reforzar su protección anti-bot y volver a bloquear estas peticiones
  aunque vengan de un navegador real. Si eso pasa, revisa el log del
  workflow — el script imprime los primeros 500 caracteres de la respuesta,
  lo cual ayuda a diagnosticar qué está pasando.
