# Puente de cron para FlotaControl (bypass anti-bot de InfinityFree)

InfinityFree bloquea las peticiones automatizadas simples (curl,
cron-job.org, wget, etc.) con un challenge anti-bot que requiere
ejecutar JavaScript como un navegador real. Esto impide que un cron
externo tradicional dispare `cron_alertas.php`.
