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

```powershell
npm install
npm run dev
```

Luego abre http://localhost:5173

## Datos

Los registros se guardan en `data/registros.json`, no en el navegador, así que no se pierden al borrar los datos de navegación. Esa carpeta no se sube a Git porque contiene información personal.
