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

## Uso

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
  api.js                   API /api/registros (la atiende npm run dev)
  db.js                    conexión a MongoDB (lee .env.local)
```

## Datos

Los registros se guardan en MongoDB Atlas, base **`PAGOS`**, colección **`PAGO`**, así que no se pierden al borrar los datos del navegador.

Si la conexión con MongoDB o `npm run dev` están apagados, los cambios se guardan temporalmente en el navegador y se pasan a MongoDB cuando vuelven a encenderse.

## GitHub Pages

Cada `git push` a `main` publica la página en https://baez91876-ship-it.github.io/PAGOS/ con GitHub Actions (**Settings → Pages → Source: GitHub Actions**).

La página publicada lee y guarda en MongoDB a través de `npm run dev` (http://localhost:5173), así que solo muestra los datos si se abre en este PC con `npm run dev` encendido. Si el navegador pregunta si permite el acceso a la red local, acepta.