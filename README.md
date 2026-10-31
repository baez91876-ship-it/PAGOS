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

Requisito: MongoDB instalado y encendido en este PC (servicio **MongoDB**, `mongodb://127.0.0.1:27017`).

Doble clic en **`iniciar.bat`**: prepara la página, enciende el servidor y abre http://localhost:3001. Deja esa ventana abierta mientras la usas.

O desde la terminal:

```powershell
npm install
npm start        # página + API en http://localhost:3001
npm run dev      # para editar el código (http://localhost:5173)
```

## Datos

Los registros se guardan en la base de datos MongoDB local **`PAGOS`**, colección **`registros`**, así que no se pierden al borrar los datos del navegador. Para usar otra dirección o base, define `MONGODB_URI` o `MONGODB_DB`.

Si MongoDB o el servidor están apagados, los cambios se guardan temporalmente en el navegador y se pasan a MongoDB cuando vuelven a encenderse.

Los registros antiguos de `data/registros.json` se importan solos a MongoDB la primera vez (el archivo queda como `registros.json.importado`).

## GitHub Pages

Cada `git push` a `main` publica la página en https://baez91876-ship-it.github.io/PAGOS/ con GitHub Actions (**Settings → Pages → Source: GitHub Actions**).

La página publicada lee y guarda en la MongoDB de este PC a través de `servidor.js`, así que solo muestra los datos si se abre en este PC con `iniciar.bat` encendido. Si el navegador pregunta si permite el acceso a la red local, acepta.