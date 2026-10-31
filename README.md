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
MONGODB_DB=pagos
```

El usuario y la contraseña son los de **Atlas → Database Access**, y la IP del PC debe estar permitida en **Atlas → Network Access**. Sin `.env.local` se usa la MongoDB local (`mongodb://127.0.0.1:27017`, base `PAGOS`).

Doble clic en **`iniciar.bat`**: prepara la página, enciende el servidor y abre http://localhost:3001. Deja esa ventana abierta mientras la usas.

O desde la terminal:

```powershell
npm install
npm start        # página + API en http://localhost:3001
npm run dev      # para editar el código (http://localhost:5173)
```

## Datos

Los registros se guardan en MongoDB Atlas, base **`pagos`**, colección **`registros`**, así que no se pierden al borrar los datos del navegador.

Si MongoDB o el servidor están apagados, los cambios se guardan temporalmente en el navegador y se pasan a MongoDB cuando vuelven a encenderse.

## GitHub Pages

Cada `git push` a `main` publica la página en https://baez91876-ship-it.github.io/PAGOS/ con GitHub Actions (**Settings → Pages → Source: GitHub Actions**).

La página publicada lee y guarda en MongoDB a través del `servidor.js` de este PC, así que solo muestra los datos si se abre en este PC con `iniciar.bat` encendido. Si el navegador pregunta si permite el acceso a la red local, acepta.