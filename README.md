# PAGOS

Registro de pagos diarios: **Día completo $40.000** y **Medio día $20.000**.

## Funciones

- Registrar un pago con fecha (se puede escribir como `dd/mm/aaaa` o elegir en el calendario) y tipo de día. Se guarda como pendiente.
- El monto se calcula automáticamente según el tipo de día.
- El motivo es obligatorio para los medios días.
- Marcar cada registro como pagado o pendiente, o marcar todo como pagado.
- Resumen del mes: total, conteo de días completos y medios días, pagado y pendiente.
- Calendario con los días registrados.
- Eliminar registros.

## En internet, sin depender del PC (Vercel)

La aplicación y la API se alojan juntas en Vercel. El PC puede estar apagado y no necesitas ejecutar `npm run dev`. MongoDB sigue siendo la base de datos. La configuración de `vercel.json` envía tanto la página como la API a una función Node con autenticación.

Las funciones se ejecutan bajo demanda; no tienes que dejar un proceso encendido. Puede haber arranques en frío y se aplican los límites de uso del plan de Vercel. No es una garantía de disponibilidad ininterrumpida.

### Configuración inicial

1. Sube estos cambios al repositorio de GitHub.
2. En Vercel, elige **Add New → Project** e importa este repositorio. Usa **Framework Preset: Other**, raíz del repositorio y Node 22. Conserva los comandos y la carpeta de salida definidos en `vercel.json`; no configures `npm start`, porque Vercel ejecuta `api/index.js` como función. Si ya existe el proyecto, revisa estos ajustes antes del siguiente despliegue.
3. En **Settings → Environment Variables**, configura estas variables **solo en el panel privado de Vercel**, para Production (y Preview si lo necesitas):
   - `MONGODB_URI`: el valor que ya tienes en `.env.local`. Nunca lo pongas en variables `VITE_*`, en GitHub ni en el código.
   - `MONGODB_DB`: `PAGOS`.
   - `MONGODB_COLECCION`: `PAGO` (conserva los valores de tu configuración actual si son distintos).
   - `APP_USUARIO`: el usuario que quieras para entrar (sin `:`).
   - `APP_CLAVE`: una contraseña larga y única.
4. En **MongoDB Atlas → Network Access**, permite el acceso desde Vercel. Permitir solo la IP de tu PC ya no es suficiente. Las IP de salida de las funciones pueden variar; para restringirlas, utiliza una opción de salida estática compatible con tu plan. Abrir `0.0.0.0/0` permite intentos de conexión desde cualquier IP y no es una lista restringida; evita esa opción cuando puedas y conserva un usuario de MongoDB con contraseña fuerte y permisos limitados a la base necesaria.
5. Despliega (o pulsa **Redeploy** después de cambiar variables), espera al estado **Ready** y abre la dirección HTTPS `https://<tu-proyecto>.vercel.app`. El navegador pedirá usuario y contraseña. Comprueba que ves tus registros y que los cambios persisten al recargar.

La función rechaza solicitudes si faltan la configuración de MongoDB o las credenciales de acceso. La página y la API están protegidas; `/health` solo indica que la función responde, no comprueba MongoDB. No añadas reglas que sirvan los archivos antes de la función: el orden actual protege también la página. El acceso a MongoDB sigue dependiendo de Atlas y de sus permisos de red. Usa siempre HTTPS en internet. Para salir en un equipo compartido, cierra todas las ventanas de la sesión privada del navegador; la autenticación del navegador no tiene botón de cerrar sesión.

### Conservar el enlace de GitHub Pages

Después de tener Vercel funcionando, configura en GitHub **Settings → Secrets and variables → Actions → Variables** una variable de repositorio `VERCEL_URL` con la dirección HTTPS de producción, sin usuario ni contraseña. Ejecuta el workflow **Publicar en GitHub Pages** (o haz un nuevo push a `main`). El enlace anterior redirigirá a Vercel; no intentará conectar con localhost. El workflow exige esta variable para no publicar una página sin API. Esta variable de GitHub no debe añadirse como `VITE_APP_URL` en Vercel: la redirección solo se compila para GitHub Pages.

**Antes de cambiar de dirección**, sincroniza los cambios pendientes del navegador usando el servidor local anterior. Los registros ya guardados en Atlas aparecen en Vercel automáticamente, pero el respaldo y la cola sin conexión pertenecen a cada dirección del navegador y no se transfieren entre GitHub Pages, localhost y Vercel.

## Desarrollo local

Requisito: un archivo **`.env.local`** en la carpeta del proyecto con la conexión a MongoDB Atlas (no se sube a GitHub):

```
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.0satleb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=PAGOS
MONGODB_COLECCION=PAGO
```

El usuario y la contraseña son los de **Atlas → Database Access**, y la IP del PC debe estar permitida en **Atlas → Network Access**. Sin `.env.local` se usa la MongoDB local (`mongodb://127.0.0.1:27017`, base `PAGOS`, colección `registros`).

Desde la terminal, en la carpeta del proyecto:

```powershell
npm install      # solo la primera vez
npm run dev      # página + API en http://localhost:5173 (deja la terminal abierta)
```

El servidor de desarrollo es solo para trabajar en este PC y no exige el usuario y contraseña de Vercel. Para probar el manejador de producción localmente, añade `APP_USUARIO` y `APP_CLAVE` a `.env.local`, ejecuta `npm run build` y después `npm start`; abre `http://localhost:3000`. Este comando es solo para pruebas locales, no para el despliegue en Vercel.

Validaciones: `npm test`, `npm run lint` y `npm run build`.

## Estructura

```
index.html                 HTML de la página (sin estilos)
public/favicon.svg         ícono de la pestaña
src/
  main.jsx                 arranque de React
  App.jsx                  arma la página y maneja la fecha elegida
  componentes/             Resumen, FormularioRegistro, CampoFecha, Calendario, PanelCalendario, ListaRegistros, Icono
  hooks/useRegistros.js    registros y acciones (crear, pagar, eliminar)
  estilos/index.css        todo el CSS (Tailwind y clases propias)
  servicios/datos.js       comunicación con la API y respaldo sin conexión
  utilidades/              fechas.js y pagos.js (montos, etiquetas, formato)
servidor/
  api.js                   API /api/registros compartida por desarrollo y producción
  db.js                    conexión a MongoDB (lee .env.local)
  http.js                  servidor de producción con autenticación y archivos compilados
  iniciar.js               inicio de producción (npm start)
api/index.js               entrada de la función Node de Vercel
vercel.json                compilación, archivos incluidos y rutas protegidas
```

## Datos

Los registros se guardan en MongoDB Atlas, base **`PAGOS`**, colección **`PAGO`**, así que no se pierden al borrar los datos del navegador.

Si el servidor o MongoDB no responden mientras tienes la página abierta, los cambios se guardan temporalmente en el navegador y se pasan a MongoDB cuando vuelve la conexión. Sin conexión no se puede abrir la página por primera vez.

## GitHub Pages

Cada `git push` a `main` publica la redirección a Vercel en https://baez91876-ship-it.github.io/PAGOS/ con GitHub Actions (**Settings → Pages → Source: GitHub Actions**), siempre que esté configurada `VERCEL_URL`. Con el proyecto de Vercel conectado a GitHub, los pushes también despliegan la aplicación allí.