# Conexion Firebase - Mancuria

## 1. Configuracion web

La configuracion web real de `mancuria-automotriz` ya esta pegada en:

`src/firebase-config.js`

Si creas otro proyecto Firebase, reemplaza ese objeto.

## 2. Colecciones esperadas

El dashboard lee:

| Coleccion | Uso |
| --- | --- |
| `ordenes_trabajo` | KPIs, tabla, estados, montos y bitacora |
| `clientes` | Ranking de clientes y datos de contacto |
| `usuarios` | Lista de mecanicos o tecnicos |

Si tus colecciones tienen otros nombres, cambia `collectionNames` dentro de `src/firebase-config.js`.

## 3. Inicio de sesion

La pantalla de acceso valida contra la coleccion `usuarios`.

| Campo | Uso |
| --- | --- |
| `usuario` | Nombre corto para ingresar |
| `password` | Password temporal del usuario |
| `nombre` | Nombre mostrado en el dashboard |
| `rol` | Rol mostrado y usado para futuras reglas |
| `estado` | Debe estar activo |

Importante: esto es solo para prueba interna. En produccion no conviene guardar passwords en texto plano dentro de Firestore. La version final debe usar Firebase Auth o una Cloud Function que valide credenciales sin exponer la coleccion `usuarios`.

## 4. Campos reconocidos en ordenes

La normalizacion acepta varios nombres por campo para adaptarse al prototipo actual:

| KPI interno | Campos aceptados |
| --- | --- |
| Cliente | `clienteId`, `idCliente`, `clienteNombre`, `nombreCliente`, `cliente` |
| Vehiculo | `placa`, `marcaModelo`, `marca`, `modelo`, `vehiculo` |
| Servicio | `servicio`, `servicioNombre`, `tipoServicio`, `trabajo`, `trabajoRealizado` |
| Estado | `estado`, `status` |
| Fecha ingreso | `fechaIngreso`, `fecha_ingreso`, `fecha`, `createdAt` |
| Fecha entrega | `fechaEntrega`, `fecha_entrega`, `fechaCierre`, `closedAt` |
| Monto | `montoTotal`, `total`, `monto`, `importe`, `precio` |
| Bitacora | `historial`, `historialCambios`, `bitacora`, `eventos` |

## 5. Permisos

Con las reglas actuales:

- `ordenes_trabajo` permite lectura publica.
- `servicios` permite lectura publica.
- `clientes` requiere `request.auth != null`.
- `usuarios` requiere `request.auth != null`.

Por eso el dashboard inicia una sesion anonima con Firebase Auth antes de consultar `usuarios` y `clientes`. Para que funcione, activa el proveedor Anonymous en Firebase Console:

Authentication -> Sign-in method -> Anonymous -> Enable.

Si Anonymous no esta activo, el login mostrara: `Activa Anonymous en Firebase Authentication`.

No dejes lectura publica en produccion. La siguiente fase debe migrar a Firebase Auth o a una Cloud Function, y recien ahi aplicar reglas por usuario autenticado y rol.

## 6. Diagnostico

El estado de la barra lateral indica:

- `Firebase sin configurar`: falta pegar `firebaseConfig`.
- `Firestore conectado`: se estan leyendo datos reales.
- `Firebase: permiso denegado`: las reglas de Firestore no permiten lectura.
- `Firebase: red no disponible`: no se pudo cargar el SDK o no hay conexion.
