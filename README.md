# Dashboard Mancuria

MVP web del panel administrativo para el Taller Automotriz Mancuria. La primera version funciona sin instalacion y usa datos de prueba basados en el flujo descrito en el informe: clientes, vehiculos, ordenes de trabajo, estados, montos, mecanicos e historial operativo.

## Como abrirlo

Abre `index.html` en el navegador. No requiere `npm install` ni servidor local.

## URLs publicadas

- Landing page: https://mancuria-automotriz.web.app
- Dashboard: https://mancuria-dashboard.web.app

## Conexion Firebase

La configuracion web del proyecto `mancuria-automotriz` ya esta cargada en `src/firebase-config.js`.

El dashboard intenta leer estas colecciones:

- `ordenes_trabajo`
- `clientes`
- `usuarios`

El inicio de sesion valida `usuario` y `password` contra la coleccion `usuarios`. Esto sirve para prueba interna, pero en produccion debe migrarse a Firebase Auth o a una Cloud Function para no exponer passwords desde el frontend.

Con las reglas actuales de Firestore, activa Firebase Authentication -> Sign-in method -> Anonymous. El dashboard usa esa sesion anonima solo para cumplir `request.auth != null` antes de leer `usuarios` y `clientes`.

## Alcance actual

- KPIs de vehiculos atendidos, ingresos, ticket promedio, OT abiertas y tiempo promedio de atencion.
- Filtros por fecha, mecanico, estado y busqueda por placa, cliente o servicio.
- Grafico de volumen por dia.
- Distribucion de ordenes por estado.
- Carga de trabajo por mecanico.
- Ranking de clientes frecuentes.
- Tabla de ordenes y modal de detalle con bitacora.
- Exportacion CSV de las ordenes filtradas.
- Inicio de sesion interno con usuarios Firestore.

## Siguiente fase

Migrar el login a Firebase Auth y reglas definitivas para que solo el administrador pueda leer datos operativos completos.
