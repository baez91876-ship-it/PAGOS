# PAGOS

Registro de pagos diarios: **Día completo $40.000** y **Medio día $20.000**.

## Funciones

- Registrar un pago con fecha (se puede escribir como `dd/mm/aaaa` o elegir en el calendario), tipo de día y estado (pendiente o pagado).
- El monto se calcula automáticamente según el tipo de día.
- El motivo es obligatorio para los medios días.
- Marcar cada registro como pagado o pendiente, o marcar todo como pagado.
- Resumen del mes: total, conteo de días completos y medios días, pagado y pendiente.
- Calendario con los días registrados.
- Eliminar registros.

## Uso

Página publicada: https://baez91876-ship-it.github.io/PAGOS/

Entra con tu correo y contraseña. Funciona en el celular y en el computador.

Para trabajar en el código desde este equipo: doble clic en **`iniciar.bat`**, o:

```powershell
npm install
npm run dev
```

## Datos

Los registros se guardan en la nube (Supabase), así que no se pierden al borrar los datos del navegador ni al cambiar de dispositivo. Solo el usuario que inicia sesión puede verlos.

Sin internet, los cambios se guardan en el dispositivo y se suben solos cuando vuelve la conexión.

La conexión se configura en `.env` (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`). La clave anónima es pública por diseño; los datos están protegidos por la seguridad de filas (RLS) de la tabla.

## Publicación

Cada `git push` a `main` publica la página con GitHub Actions (`.github/workflows/deploy.yml`). En GitHub: **Settings → Pages → Source: GitHub Actions**.