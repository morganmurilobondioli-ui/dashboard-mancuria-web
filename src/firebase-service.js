(() => {
  const SDK_VERSION = "10.12.5";
  const SDK_BASE = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
  const REQUIRED_CONFIG_KEYS = ["apiKey", "projectId", "appId"];

  function hasFirebaseConfig(config) {
    return Boolean(config && REQUIRED_CONFIG_KEYS.every((key) => String(config[key] || "").trim()));
  }

  async function loadScript(src) {
    if ([...document.scripts].some((script) => script.src === src)) return;

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadFirebaseSdk() {
    if (window.firebase?.firestore) return window.firebase;

    await loadScript(`${SDK_BASE}/firebase-app-compat.js`);
    await loadScript(`${SDK_BASE}/firebase-firestore-compat.js`);
    await loadScript(`${SDK_BASE}/firebase-auth-compat.js`);

    if (!window.firebase?.firestore) {
      throw new Error("Firebase SDK no quedo disponible en el navegador.");
    }

    return window.firebase;
  }

  function getOptions() {
    const options = window.MANCURIA_FIREBASE_OPTIONS || {};
    return {
      ordersLimit: Number(options.ordersLimit || 250),
      collectionNames: {
        clientes: "clientes",
        ordenes: "ordenes_trabajo",
        servicios: "servicios",
        usuarios: "usuarios",
        users: "users",
        consultasPortal: "consultas_portal",
        ...(options.collectionNames || {}),
      },
    };
  }

  async function getFirestoreDb() {
    const config = window.MANCURIA_FIREBASE_CONFIG;
    if (!hasFirebaseConfig(config)) {
      throw new Error("Firebase sin configurar.");
    }

    const firebase = await loadFirebaseSdk();
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    return firebase.firestore(app);
  }

  async function getFirebaseAuth() {
    const config = window.MANCURIA_FIREBASE_CONFIG;
    if (!hasFirebaseConfig(config)) {
      throw new Error("Firebase sin configurar.");
    }

    const firebase = await loadFirebaseSdk();
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    return firebase.auth(app);
  }

  async function requireAuthenticatedUser() {
    const auth = await getFirebaseAuth();
    if (!auth.currentUser) {
      throw new Error("Sesion no iniciada.");
    }
    return auth.currentUser;
  }

  function pick(data, keys, fallback = "") {
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== "") return data[key];
    }
    return fallback;
  }

  function toDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value === "number") return new Date(value);
    if (typeof value === "object" && typeof value.seconds === "number") return new Date(value.seconds * 1000);
    if (typeof value === "string") {
      const localMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
      if (localMatch) {
        const [, day, month, year, hour = "0", minute = "0"] = localMatch;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
      }
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function toIso(value) {
    const date = toDate(value);
    return date ? date.toISOString() : new Date().toISOString();
  }

  function toNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function normalizeEstado(value) {
    const raw = String(value || "Pendiente").trim().toLowerCase();
    if (raw.includes("proceso") || raw === "en_proceso") return "En Proceso";
    if (raw.includes("list")) return "Listo";
    if (raw.includes("entreg")) return "Entregado";
    return "Pendiente";
  }

  function formatHistoryItem(item) {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "Evento registrado";

    const date = toDate(pick(item, ["fecha", "timestamp", "createdAt", "hora"], null));
    const label = pick(item, ["accion", "detalle", "descripcion", "estado", "mensaje"], "Evento registrado");
    if (!date) return String(label);

    const hour = new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    return `${hour} ${label}`;
  }

  function historyDate(item) {
    if (!item || typeof item !== "object") return null;
    return toDate(pick(item, ["fecha", "timestamp", "createdAt", "hora"], null));
  }

  function mapOrder(doc) {
    const data = doc.data();
    const fechaIngreso = pick(data, ["fechaIngreso", "fecha_ingreso", "fecha", "createdAt", "fechaCreacion"], null);
    const fechaInicioProceso = pick(data, ["fechaInicioProceso", "inicioProceso", "fechaProceso", "startedAt"], null);
    const fechaListo = pick(data, ["fechaListo", "listoAt", "readyAt"], null);
    const fechaEntrega = pick(data, ["fechaEntrega", "fecha_entrega", "entregadoAt", "fechaCierre", "closedAt"], null);
    const actualizadoEn = pick(data, ["actualizadoEn", "updatedAt", "fechaActualizacion", "modifiedAt"], null);
    const marca = pick(data, ["marca", "vehiculoMarca"], "");
    const modelo = pick(data, ["modelo", "vehiculoModelo"], "");
    const historial = pick(data, ["historial", "historialCambios", "bitacora", "eventos"], []);
    const historialFechas = Array.isArray(historial) ? historial.map(historyDate).filter(Boolean) : [];
    const lastHistoryDate = historialFechas.length ? new Date(Math.max(...historialFechas.map((date) => date.getTime()))) : null;
    const historyUser =
      Array.isArray(historial) && historial.length && typeof historial[0] === "object" ? pick(historial[0], ["usuario", "user"], "") : "";
    const mechanicName = pick(
      data,
      ["mecanicoNombre", "responsableNombre", "tecnicoNombre", "usuarioNombre", "responsable"],
      historyUser || "Sin asignar",
    );

    return {
      id: pick(data, ["id", "codigo", "numero", "ot"], doc.id),
      clienteId: pick(data, ["clienteId", "idCliente", "cliente_id"], ""),
      clienteNombre: pick(data, ["clienteNombre", "nombreCliente", "cliente", "razonSocial"], "Cliente no registrado"),
      placa: String(pick(data, ["placa", "vehiculoPlaca", "patente"], "SIN-PLACA")).toUpperCase(),
      marcaModelo: pick(data, ["marcaModelo", "vehiculo", "vehiculoNombre"], `${marca} ${modelo}`.trim() || "Vehiculo sin modelo"),
      servicio: pick(
        data,
        ["servicio", "servicioNombre", "tipoServicio", "trabajo", "descripcionServicio", "trabajoRealizado", "trabajo_realizado"],
        "Servicio sin clasificar",
      ),
      servicioId: pick(data, ["servicioId", "idServicio", "servicio_id"], ""),
      servicioNombre: pick(data, ["servicioNombre", "servicio", "tipoServicio"], ""),
      categoria: pick(data, ["categoria", "tipo", "area"], "General"),
      mecanicoId: pick(data, ["mecanicoId", "responsableId", "tecnicoId", "usuarioId"], mechanicName),
      mecanicoNombre: mechanicName,
      estado: normalizeEstado(pick(data, ["estado", "status"], "Pendiente")),
      fechaIngreso: toIso(fechaIngreso),
      fechaInicioProceso: fechaInicioProceso ? toIso(fechaInicioProceso) : null,
      fechaListo: fechaListo ? toIso(fechaListo) : null,
      fechaEntrega: fechaEntrega ? toIso(fechaEntrega) : null,
      actualizadoEn: actualizadoEn ? toIso(actualizadoEn) : lastHistoryDate ? lastHistoryDate.toISOString() : toIso(fechaIngreso),
      creadoPor: pick(data, ["creadoPor", "createdBy", "usuarioCreador"], ""),
      actualizadoPor: pick(data, ["actualizadoPor", "updatedBy", "usuarioActualizacion"], historyUser),
      prioridad: pick(data, ["prioridad", "priority"], "Normal"),
      evidenciasCount: toNumber(pick(data, ["evidenciasCount", "fotosCount", "imagenesCount", "adjuntosCount"], 0)),
      kilometraje: toNumber(pick(data, ["kilometraje", "km", "ultimoKilometraje"], 0)),
      montoTotal: toNumber(pick(data, ["montoTotal", "total", "monto", "importe", "precio"], 0)),
      fallaReportada: pick(data, ["fallaReportada", "fallareportada", "falla", "diagnosticoInicial", "descripcionFalla"], "Sin falla reportada."),
      trabajoRealizado: pick(data, ["trabajoRealizado", "trabajo_realizado", "observaciones", "detalleTrabajo"], "Sin trabajo registrado."),
      historial: Array.isArray(historial) && historial.length ? historial.map(formatHistoryItem) : ["Orden registrada en Firestore."],
      historialEventos: Array.isArray(historial)
        ? historial.map((item) => ({
            fecha: historyDate(item)?.toISOString() || null,
            usuario: typeof item === "object" ? pick(item, ["usuario", "user"], "") : "",
            accion: typeof item === "object" ? pick(item, ["accion", "detalle", "descripcion", "estado", "mensaje"], "") : String(item || ""),
          }))
        : [],
    };
  }

  function mapClient(doc) {
    const data = doc.data();
    return {
      id: pick(data, ["id", "clienteId"], doc.id),
      nombre: pick(data, ["nombre", "clienteNombre", "razonSocial", "razon_social"], "Cliente sin nombre"),
      tipoCliente: pick(data, ["tipoCliente", "tipo", "categoria"], "Cliente"),
      documento: pick(data, ["documento", "dni", "ruc", "identificacion"], ""),
      correo: pick(data, ["correo", "email"], ""),
      telefono: pick(data, ["telefono", "celular", "phone"], ""),
      cantidadVehiculos: toNumber(pick(data, ["cantidadVehiculos", "vehiculos", "totalVehiculos"], 0)),
    };
  }

  function mapUser(doc) {
    const data = doc.data();
    const estado = String(pick(data, ["estado", "status"], "activo")).toLowerCase();
    return {
      id: pick(data, ["id", "uid", "usuarioId"], doc.id),
      uid: pick(data, ["uid", "authUid", "userId"], doc.id),
      nombre: pick(data, ["nombre", "displayName", "usuarioNombre", "name"], "Usuario sin nombre"),
      usuario: pick(data, ["usuario", "username", "user"], ""),
      correo: pick(data, ["correo", "email"], ""),
      especialidad: pick(data, ["especialidad", "cargo", "rol"], "Tecnico del taller"),
      rol: String(pick(data, ["rol", "role", "tipo"], "")).toLowerCase(),
      activo: pick(data, ["activo", "enabled"], true) !== false && estado !== "inactivo",
    };
  }

  function mapService(doc) {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: pick(data, ["nombre", "name", "titulo", "descripcion"], "Servicio sin nombre"),
      categoria: pick(data, ["categoria", "tipo", "area"], ""),
      precioBase: toNumber(pick(data, ["precioBase", "precio", "costoBase"], 0)),
      activo: pick(data, ["activo", "enabled"], true) !== false,
    };
  }

  function mapPortalQuery(doc) {
    const data = doc.data();
    const fecha = pick(data, ["fecha", "createdAt", "timestamp", "consultadoEn"], null);
    return {
      id: doc.id,
      placa: String(pick(data, ["placa", "patente"], "")).toUpperCase(),
      fecha: fecha ? toIso(fecha) : null,
      resultado: pick(data, ["resultado", "status", "estado"], ""),
      encontrado: pick(data, ["encontrado", "found", "success"], false) === true,
    };
  }

  function deriveClientsFromOrders(orders) {
    const map = new Map();
    orders.forEach((order) => {
      if (!map.has(order.clienteId || order.clienteNombre)) {
        map.set(order.clienteId || order.clienteNombre, {
          id: order.clienteId || order.clienteNombre,
          nombre: order.clienteNombre,
          tipoCliente: "Cliente",
          telefono: "",
        });
      }
    });
    return [...map.values()];
  }

  function deriveMechanicsFromOrders(orders) {
    const map = new Map();
    orders.forEach((order) => {
      const id = order.mecanicoId || order.mecanicoNombre || "sin-asignar";
      if (!map.has(id)) {
        map.set(id, {
          id,
          nombre: order.mecanicoNombre || "Sin asignar",
          especialidad: "Tecnico del taller",
        });
      }
    });
    return [...map.values()];
  }

  async function getCollectionDocs(db, name, limit) {
    const snapshot = await db.collection(name).limit(limit).get();
    return snapshot.docs;
  }

  async function loadDashboardData() {
    const config = window.MANCURIA_FIREBASE_CONFIG;
    if (!hasFirebaseConfig(config)) {
      return {
        source: "mock",
        status: "Firebase sin configurar",
        clients: null,
        mechanics: null,
        orders: null,
      };
    }

    const options = getOptions();
    await requireAuthenticatedUser();
    const db = await getFirestoreDb();

    const [orderResult, clientResult, userResult, serviceResult, portalQueryResult] = await Promise.allSettled([
      getCollectionDocs(db, options.collectionNames.ordenes, options.ordersLimit),
      getCollectionDocs(db, options.collectionNames.clientes, options.ordersLimit),
      getCollectionDocs(db, options.collectionNames.usuarios, options.ordersLimit),
      getCollectionDocs(db, options.collectionNames.servicios, options.ordersLimit),
      getCollectionDocs(db, options.collectionNames.consultasPortal, options.ordersLimit),
    ]);

    if (orderResult.status === "rejected") {
      throw new Error(`No se pudo leer ${options.collectionNames.ordenes}: ${orderResult.reason.message}`);
    }

    const mappedOrders = orderResult.value.map(mapOrder);
    const mappedClients =
      clientResult.status === "fulfilled" && clientResult.value.length
        ? clientResult.value.map(mapClient)
        : deriveClientsFromOrders(mappedOrders);

    const mappedUsers =
      userResult.status === "fulfilled"
        ? userResult.value
            .map(mapUser)
            .filter((user) => user.activo !== false && (!user.rol || /mecan|tecn|oper/.test(user.rol)))
        : [];

    const mappedMechanics = mappedUsers.length ? mappedUsers : deriveMechanicsFromOrders(mappedOrders);
    const mappedServices = serviceResult.status === "fulfilled" ? serviceResult.value.map(mapService) : [];
    const mappedPortalQueries = portalQueryResult.status === "fulfilled" ? portalQueryResult.value.map(mapPortalQuery) : [];

    return {
      source: "firestore",
      status: `Firestore conectado: ${mappedOrders.length} OT`,
      clients: mappedClients,
      mechanics: mappedMechanics,
      orders: mappedOrders,
      services: mappedServices,
      portalQueries: mappedPortalQueries,
      warnings: [clientResult, userResult, serviceResult, portalQueryResult]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason.message),
    };
  }

  async function saveService(service) {
    const nombre = String(service?.nombre || "").trim();
    if (!nombre) {
      throw new Error("Ingresa el nombre del servicio.");
    }

    const options = getOptions();
    await requireAuthenticatedUser();
    const firebase = await loadFirebaseSdk();
    const db = await getFirestoreDb();
    const payload = {
      nombre,
      activo: service?.activo !== false,
      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (service?.id) {
      await db.collection(options.collectionNames.servicios).doc(service.id).set(payload, { merge: true });
      return { id: service.id, ...payload, actualizadoEn: new Date().toISOString() };
    }

    const doc = await db.collection(options.collectionNames.servicios).add({
      ...payload,
      creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { id: doc.id, ...payload, actualizadoEn: new Date().toISOString() };
  }

  async function deleteService(serviceId) {
    const id = String(serviceId || "").trim();
    if (!id) {
      throw new Error("Servicio no valido.");
    }

    const options = getOptions();
    await requireAuthenticatedUser();
    const db = await getFirestoreDb();
    await db.collection(options.collectionNames.servicios).doc(id).delete();
    return id;
  }

  function authUserToSession(authUser, profile = {}) {
    return {
      id: authUser.uid,
      uid: authUser.uid,
      nombre: profile.nombre || authUser.displayName || profile.usuario || authUser.email || "Usuario Mancuria",
      usuario: profile.usuario || authUser.email || authUser.uid,
      correo: profile.correo || authUser.email || "",
      rol: profile.rol || "usuario",
      especialidad: profile.especialidad || "",
      activo: profile.activo !== false,
    };
  }

  async function getDocIfExists(db, collection, id) {
    if (!collection || !id) return null;
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? doc : null;
  }

  async function findUserProfileDoc(db, authUser) {
    const options = getOptions();
    const uid = authUser.uid;
    const email = String(authUser.email || "").trim().toLowerCase();

    const directDoc =
      (await getDocIfExists(db, options.collectionNames.users, uid)) ||
      (await getDocIfExists(db, options.collectionNames.usuarios, uid));

    if (directDoc) return directDoc;

    const uidFields = ["uid", "authUid", "userId", "id"];
    for (const field of uidFields) {
      const snapshot = await db.collection(options.collectionNames.usuarios).where(field, "==", uid).limit(1).get();
      if (!snapshot.empty) return snapshot.docs[0];
    }

    if (email) {
      const emailFields = ["correo", "email"];
      for (const field of emailFields) {
        const snapshot = await db.collection(options.collectionNames.usuarios).where(field, "==", email).limit(1).get();
        if (!snapshot.empty) return snapshot.docs[0];
      }
    }

    return null;
  }

  async function loadCurrentUserProfile(authUser) {
    if (!authUser) return null;
    const db = await getFirestoreDb();
    const profileDoc = await findUserProfileDoc(db, authUser);
    const profile = profileDoc ? mapUser(profileDoc) : {};
    const sessionUser = authUserToSession(authUser, profile);

    if (!sessionUser.activo) {
      await logout();
      throw new Error("Usuario inactivo.");
    }

    return sessionUser;
  }

  async function loginWithEmailPassword(email, password) {
    const cleanEmail = String(email || "").trim();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      throw new Error("Ingresa correo y password.");
    }

    const auth = await getFirebaseAuth();
    const credential = await auth.signInWithEmailAndPassword(cleanEmail, cleanPassword);
    return loadCurrentUserProfile(credential.user);
  }

  async function getCurrentUserProfile() {
    const auth = await getFirebaseAuth();
    return auth.currentUser ? loadCurrentUserProfile(auth.currentUser) : null;
  }

  async function onAuthStateChanged(callback) {
    const auth = await getFirebaseAuth();
    return auth.onAuthStateChanged(async (authUser) => {
      if (!authUser) {
        callback(null);
        return;
      }

      try {
        callback(await loadCurrentUserProfile(authUser));
      } catch (error) {
        callback(null, error);
      }
    });
  }

  async function logout() {
    const auth = await getFirebaseAuth();
    await auth.signOut();
  }

  window.MANCURIA_FIREBASE = {
    requireAuthenticatedUser,
    hasFirebaseConfig,
    getCurrentUserProfile,
    onAuthStateChanged,
    loadDashboardData,
    loginWithEmailPassword,
    saveService,
    deleteService,
    logout,
  };
})();
