# Plan de implementacion del dashboard Mancuria

## Fase 1 - MVP operativo

1. Crear dashboard web administrativo responsive.
2. Cargar datos de prueba realistas del taller.
3. Calcular KPIs principales de ordenes de trabajo.
4. Permitir filtros por rango de fechas, mecanico, estado y busqueda.
5. Mostrar detalle de OT con historial y exportacion CSV.

## Fase 2 - Conexion Firebase

1. Reemplazar datos mock por consultas a Firestore.
2. Agregar Firebase Auth para usuarios internos.
3. Implementar roles `admin` y `mecanico`.
4. Proteger reglas Firestore por rol.
5. Mover consultas publicas por placa a Cloud Functions.

## Fase 3 - Indicadores avanzados

1. Medir tiempo por estado: pendiente, en proceso, listo y entregado.
2. Agregar carga de trabajo por bahia o tipo de servicio.
3. Incorporar rentabilidad por categoria.
4. Agregar alertas de OT vencidas.
5. Exportar reportes PDF mensuales.

## Fase 4 - Integraciones futuras

1. Inventario de insumos y repuestos.
2. Facturacion o registro de comprobantes.
3. Notificaciones WhatsApp para cambios de estado.
4. Vista cliente con consulta segura por placa.
5. Registro de evidencia fotografica por OT.
