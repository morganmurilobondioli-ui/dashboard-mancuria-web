(() => {
const mockData = window.MANCURIA_DATA;
const firestoreCollections = mockData.firestoreCollections;
const appRoot = document.querySelector("#appRoot");

if (appRoot && window.MANCURIA_VIEWS?.renderApp) {
  appRoot.innerHTML = window.MANCURIA_VIEWS.renderApp();
}

let clients = [...mockData.clients];
let mechanics = [...mockData.mechanics];
let orders = [...mockData.orders];
let services = [...(mockData.services || [])];
let portalQueries = [...(mockData.portalQueries || [])];
let currentUser = null;
let authUnsubscribe = null;

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const shortDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

const longDate = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusColors = {
  Pendiente: "#d97706",
  "En Proceso": "#2563eb",
  Listo: "#059669",
  Entregado: "#52525b",
};

const state = {
  dateFrom: "",
  dateTo: "",
  mechanic: "todos",
  status: "todos",
  search: "",
  source: "mock",
};

const els = {
  dateFrom: document.querySelector("#dateFrom"),
  dateTo: document.querySelector("#dateTo"),
  mechanicFilter: document.querySelector("#mechanicFilter"),
  searchInput: document.querySelector("#searchInput"),
  segments: [...document.querySelectorAll(".segment")],
  kpiGrid: document.querySelector("#resumen"),
  weeklyChart: document.querySelector("#weeklyChart"),
  weekRangeLabel: document.querySelector("#weekRangeLabel"),
  statusDonut: document.querySelector("#statusDonut"),
  statusLegend: document.querySelector("#statusLegend"),
  mechanicLoad: document.querySelector("#mechanicLoad"),
  clientList: document.querySelector("#clientList"),
  ordersTable: document.querySelector("#ordersTable"),
  clearFilters: document.querySelector("#clearFilters"),
  exportCsv: document.querySelector("#exportCsv"),
  refreshData: document.querySelector("#refreshData"),
  orderDialog: document.querySelector("#orderDialog"),
  closeDialog: document.querySelector("#closeDialog"),
  dialogOrderId: document.querySelector("#dialogOrderId"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogBody: document.querySelector("#dialogBody"),
  sidebarStatus: document.querySelector(".sidebar-status"),
  dataSourceText: document.querySelector("#dataSourceText"),
  loginScreen: document.querySelector("#loginScreen"),
  appShell: document.querySelector("#appShell"),
  loginForm: document.querySelector("#loginForm"),
  loginUser: document.querySelector("#loginUser"),
  loginPassword: document.querySelector("#loginPassword"),
  loginButton: document.querySelector("#loginButton"),
  loginMessage: document.querySelector("#loginMessage"),
  userChip: document.querySelector("#userChip"),
  logoutButton: document.querySelector("#logoutButton"),
  navItems: [...document.querySelectorAll("[data-view]")],
  viewPanels: [...document.querySelectorAll("[data-view-panel]")],
  pageTitle: document.querySelector("#pageTitle"),
  pageEyebrow: document.querySelector("#pageEyebrow"),
  clientsSummary: document.querySelector("#clientsSummary"),
  clientsTable: document.querySelector("#clientsTable"),
  workersSummary: document.querySelector("#workersSummary"),
  workersTable: document.querySelector("#workersTable"),
  filters: document.querySelector(".filters"),
  servicesSummary: document.querySelector("#servicesSummary"),
  servicesTable: document.querySelector("#servicesTable"),
  overdueBreakdown: document.querySelector("#overdueBreakdown"),
  stateTimeList: document.querySelector("#stateTimeList"),
  serviceFrequencyList: document.querySelector("#serviceFrequencyList"),
  serviceRevenueList: document.querySelector("#serviceRevenueList"),
  recurrenceList: document.querySelector("#recurrenceList"),
  userAdoptionList: document.querySelector("#userAdoptionList"),
  serviceForm: document.querySelector("#serviceForm"),
  serviceId: document.querySelector("#serviceId"),
  serviceName: document.querySelector("#serviceName"),
  serviceMessage: document.querySelector("#serviceMessage"),
  newServiceButton: document.querySelector("#newServiceButton"),
  saveServiceButton: document.querySelector("#saveServiceButton"),
  cancelServiceButton: document.querySelector("#cancelServiceButton"),
};

async function init() {
  bindEvents();
  bindLoginEvents();
  await bindAuthState();
}

async function bindAuthState() {
  if (!window.MANCURIA_FIREBASE?.onAuthStateChanged) {
    lockDashboard();
    setLoginMessage("Firebase Auth no esta disponible.", true);
    return;
  }

  setLoginMessage("Validando sesion...", false);

  try {
    authUnsubscribe = await window.MANCURIA_FIREBASE.onAuthStateChanged(async (user, error) => {
      if (error) {
        console.error(error);
        currentUser = null;
        lockDashboard();
        setLoginMessage(loginErrorMessage(error), true);
        return;
      }

      if (user) {
        await unlockDashboard(user);
      } else {
        currentUser = null;
        lockDashboard();
      }
    });
  } catch (error) {
    console.error(error);
    lockDashboard();
    setLoginMessage(loginErrorMessage(error), true);
  }
}

function bindEvents() {
  els.navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveView(item.dataset.view);
    });
  });

  els.dateFrom.addEventListener("change", (event) => {
    state.dateFrom = event.target.value;
    render();
  });

  els.dateTo.addEventListener("change", (event) => {
    state.dateTo = event.target.value;
    render();
  });

  els.mechanicFilter.addEventListener("change", (event) => {
    state.mechanic = event.target.value;
    render();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  els.segments.forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      els.segments.forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  els.clearFilters.addEventListener("click", () => {
    setDefaultDateRange(true);
    state.mechanic = "todos";
    state.status = "todos";
    state.search = "";
    els.mechanicFilter.value = state.mechanic;
    els.searchInput.value = "";
    els.segments.forEach((item) => item.classList.toggle("active", item.dataset.status === "todos"));
    render();
  });

  els.exportCsv.addEventListener("click", exportFilteredOrders);

  els.newServiceButton.addEventListener("click", () => openServiceForm());
  els.cancelServiceButton.addEventListener("click", closeServiceForm);
  els.serviceForm.addEventListener("submit", saveServiceFromForm);

  els.refreshData.addEventListener("click", async () => {
    els.refreshData.classList.add("spin");
    await refreshFromFirebase({ preserveFilters: true });
    setTimeout(() => els.refreshData.classList.remove("spin"), 450);
  });

  els.logoutButton.addEventListener("click", () => {
    window.MANCURIA_FIREBASE?.logout?.().catch((error) => {
      console.error(error);
      setDataStatus("error", "No se pudo cerrar sesion");
    });
  });

  els.closeDialog.addEventListener("click", () => els.orderDialog.close());

  els.orderDialog.addEventListener("click", (event) => {
    if (event.target === els.orderDialog) {
      els.orderDialog.close();
    }
  });
}

function bindLoginEvents() {
  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = els.loginUser.value;
    const password = els.loginPassword.value;

    setLoginMessage("Validando acceso...", false);
    els.loginButton.disabled = true;

    try {
      await window.MANCURIA_FIREBASE.loginWithEmailPassword(email, password);
      els.loginForm.reset();
    } catch (error) {
      setLoginMessage(loginErrorMessage(error), true);
    } finally {
      els.loginButton.disabled = false;
    }
  });
}

async function unlockDashboard(user) {
  currentUser = user;
  els.loginScreen.classList.add("hidden");
  els.appShell.classList.remove("locked");
  els.userChip.textContent = `${user.nombre || user.correo || user.usuario} - ${user.rol || "usuario"}`;
  setDefaultDateRange(true);
  populateMechanicOptions();
  render();
  await refreshFromFirebase({ preserveFilters: false });
}

function lockDashboard() {
  els.appShell.classList.add("locked");
  els.loginScreen.classList.remove("hidden");
  setActiveView("dashboard");
  setLoginMessage("", false);
  window.setTimeout(() => els.loginUser.focus(), 0);
}

function setActiveView(view) {
  const activeView = els.viewPanels.some((panel) => panel.dataset.viewPanel === view) ? view : "dashboard";
  const titles = {
    dashboard: ["Taller Automotriz Mancuria", "Dashboard de KPIs"],
    ordenes: ["Operacion diaria", "Ordenes de trabajo"],
    clientes: ["Directorio comercial", "Clientes"],
    trabajadores: ["Equipo tecnico", "Usuarios trabajadores"],
    servicios: ["Catalogo operativo", "Servicios"],
  };

  els.viewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === activeView);
  });

  els.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  const [eyebrow, title] = titles[activeView] || titles.dashboard;
  els.pageEyebrow.textContent = eyebrow;
  els.pageTitle.textContent = title;
  els.filters.hidden = activeView === "servicios";
}

function setLoginMessage(message, isError) {
  els.loginMessage.textContent = message;
  els.loginMessage.classList.toggle("error", Boolean(isError));
}

function loginErrorMessage(error) {
  const message = String(error?.message || error || "No se pudo iniciar sesion.");
  if (/permission|Missing or insufficient permissions/i.test(message)) {
    return "Tu sesion no tiene permiso para leer estos datos.";
  }
  if (/user-not-found|auth\/user-not-found/i.test(message)) {
    return "No existe una cuenta con ese correo.";
  }
  if (/wrong-password|invalid-credential|auth\/invalid-credential|auth\/wrong-password/i.test(message)) {
    return "Correo o password incorrecto.";
  }
  if (/invalid-email|auth\/invalid-email/i.test(message)) {
    return "Ingresa un correo valido.";
  }
  if (/too-many-requests|auth\/too-many-requests/i.test(message)) {
    return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
  }
  if (/Authentication|operation-not-allowed|admin-restricted-operation/i.test(message)) {
    return "Activa Email/Password en Firebase Authentication.";
  }
  if (/network|fetch|cargar|load|sdk/i.test(message)) {
    return "No se pudo conectar con Firebase.";
  }
  return message;
}

async function refreshFromFirebase({ preserveFilters }) {
  if (!window.MANCURIA_FIREBASE?.loadDashboardData) {
    setDataStatus("mock", "Datos de prueba activos");
    return;
  }

  setDataStatus("loading", "Consultando Firebase...");

  try {
    const previousSource = state.source;
    const result = await window.MANCURIA_FIREBASE.loadDashboardData();

    if (result.source !== "firestore") {
      state.source = "mock";
      clients = [...mockData.clients];
      mechanics = [...mockData.mechanics];
      orders = [...mockData.orders];
      services = [...(mockData.services || [])];
      portalQueries = [...(mockData.portalQueries || [])];
      setDataStatus("mock", result.status || "Datos de prueba activos");
      if (!preserveFilters) setDefaultDateRange(true);
      populateMechanicOptions();
      render();
      return;
    }

    state.source = "firestore";
    clients = result.clients?.length ? result.clients : deriveClientsFromOrders(result.orders || []);
    mechanics = result.mechanics?.length ? result.mechanics : deriveMechanicsFromOrders(result.orders || []);
    orders = result.orders || [];
    services = result.services?.length ? result.services : [...(mockData.services || [])];
    portalQueries = result.portalQueries || [];

    setDataStatus("firebase", result.status || "Firestore conectado");

    if (!preserveFilters || previousSource !== "firestore") {
      setDefaultDateRange(true);
    }

    populateMechanicOptions();
    render();

    if (result.warnings?.length) {
      console.warn("Advertencias Firebase Mancuria:", result.warnings);
    }
  } catch (error) {
    console.error(error);
    setDataStatus("error", firebaseErrorMessage(error));
    if (!orders.length) {
      clients = [...mockData.clients];
      mechanics = [...mockData.mechanics];
      orders = [...mockData.orders];
      services = [...(mockData.services || [])];
      portalQueries = [...(mockData.portalQueries || [])];
      setDefaultDateRange(true);
      populateMechanicOptions();
      render();
    }
  }
}

function firebaseErrorMessage(error) {
  const message = String(error?.message || error || "Error Firebase");
  if (/permission|Missing or insufficient permissions/i.test(message)) {
    return "Firebase: permiso denegado";
  }
  if (/network|fetch|cargar|load/i.test(message)) {
    return "Firebase: red no disponible";
  }
  return message.length > 42 ? `${message.slice(0, 42)}...` : message;
}

function setDataStatus(type, message) {
  els.sidebarStatus.classList.remove("mock", "firebase", "error", "loading");
  els.sidebarStatus.classList.add(type);
  els.dataSourceText.textContent = message;
}

function populateMechanicOptions() {
  const current = state.mechanic;
  els.mechanicFilter.innerHTML = `<option value="todos">Todos</option>`;

  mechanics.forEach((mechanic) => {
    const option = document.createElement("option");
    option.value = mechanic.id;
    option.textContent = mechanic.nombre;
    els.mechanicFilter.appendChild(option);
  });

  state.mechanic = mechanics.some((mechanic) => mechanic.id === current) ? current : "todos";
  els.mechanicFilter.value = state.mechanic;
}

function setDefaultDateRange(force = false) {
  if (!force && state.dateFrom && state.dateTo) return;

  const dates = orders.map((order) => new Date(order.fechaIngreso)).filter((date) => !Number.isNaN(date.getTime()));
  const latest = dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : new Date();
  const from = new Date(latest);
  from.setDate(latest.getDate() - 6);

  state.dateFrom = toInputDate(from);
  state.dateTo = toInputDate(latest);
  els.dateFrom.value = state.dateFrom;
  els.dateTo.value = state.dateTo;
}

function getFilteredOrders() {
  const from = state.dateFrom ? startOfDay(state.dateFrom) : null;
  const to = state.dateTo ? endOfDay(state.dateTo) : null;

  return orders.filter((order) => {
    const ingreso = new Date(order.fechaIngreso);
    const matchesDate = (!from || ingreso >= from) && (!to || ingreso <= to);
    const matchesMechanic = state.mechanic === "todos" || order.mecanicoId === state.mechanic;
    const matchesStatus = state.status === "todos" || order.estado === state.status;
    const searchable = `${order.id} ${order.placa} ${order.clienteNombre} ${order.servicio} ${order.marcaModelo}`.toLowerCase();
    const matchesSearch = !state.search || searchable.includes(state.search);
    return matchesDate && matchesMechanic && matchesStatus && matchesSearch;
  });
}

function render() {
  const filtered = getFilteredOrders();
  renderKpis(filtered);
  renderWeeklyChart(filtered);
  renderStatus(filtered);
  renderMechanicLoad(filtered);
  renderClients(filtered);
  renderOrders(filtered);
  renderClientDirectory(filtered);
  renderWorkerDirectory(filtered);
  renderServicesDirectory();
  renderAdvancedInsights(filtered);
}

function renderKpis(filtered) {
  const delivered = filtered.filter((order) => order.estado === "Entregado");
  const billable = filtered.filter((order) => order.montoTotal > 0);
  const revenue = billable.reduce((sum, order) => sum + order.montoTotal, 0);
  const averageTicket = billable.length ? revenue / billable.length : 0;
  const openOrders = filtered.filter((order) => order.estado === "Pendiente" || order.estado === "En Proceso").length;
  const cycleHours = delivered.map((order) => diffHours(order.fechaIngreso, order.fechaEntrega)).filter(Number.isFinite);
  const avgCycle = cycleHours.length ? cycleHours.reduce((sum, value) => sum + value, 0) / cycleHours.length : 0;
  const overdue = filtered.filter((order) => isOpenOrder(order) && orderAgeHours(order) >= 48);
  const stale = filtered.filter((order) => isOpenOrder(order) && hoursSinceLastUpdate(order) >= 24);
  const withoutAmount = filtered.filter((order) => Number(order.montoTotal || 0) <= 0);
  const avgMileage = average(filtered.map((order) => Number(order.kilometraje || 0)).filter((value) => value > 0));
  const completeHistory = filtered.filter(hasCompleteTraceability);
  const evidenceRisk = filtered.filter(hasEvidenceRisk);
  const recurringClients = countRecurring(filtered, (order) => order.clienteId || order.clienteNombre);
  const recurringVehicles = countRecurring(filtered, (order) => order.placa);
  const portalQueriesInRange = filterPortalQueriesByCurrentRange();
  const adoptionUsers = uniqueUserActions(filtered).size;
  const criticalMechanic = getCriticalMechanic(filtered);
  const reportedFailures = getReportedFailureStats(filtered).filter((item) => item.count > 0).length;

  const kpis = [
    {
      label: "Vehiculos atendidos",
      value: filtered.length,
      detail: `${delivered.length} entregados en el periodo`,
      accent: "teal",
      icon: "bi-car-front-fill",
    },
    {
      label: "Ingresos facturados",
      value: PEN.format(revenue),
      detail: `${billable.length} ordenes valorizadas`,
      accent: "red",
      icon: "bi-cash-coin",
    },
    {
      label: "Ticket promedio",
      value: PEN.format(averageTicket),
      detail: "Promedio por OT valorizada",
      accent: "blue",
      icon: "bi-receipt",
    },
    {
      label: "OT abiertas",
      value: openOrders,
      detail: "Pendientes o en proceso",
      accent: "amber",
      icon: "bi-tools",
    },
    {
      label: "Tiempo promedio",
      value: `${avgCycle.toFixed(1)} h`,
      detail: "Ingreso hasta entrega",
      accent: "slate",
      icon: "bi-stopwatch",
    },
    {
      label: "OT vencidas",
      value: overdue.length,
      detail: "Abiertas por mas de 48 h",
      accent: "red",
      icon: "bi-exclamation-circle",
    },
    {
      label: "Sin actualizar",
      value: stale.length,
      detail: "Sin movimiento por 24 h",
      accent: "amber",
      icon: "bi-hourglass-split",
    },
    {
      label: "Sin monto",
      value: withoutAmount.length,
      detail: "Pendientes de valorizar",
      accent: "blue",
      icon: "bi-cash-coin",
    },
    {
      label: "Historial completo",
      value: percent(completeHistory.length, filtered.length),
      detail: `${completeHistory.length} OT con datos clave`,
      accent: "teal",
      icon: "bi-clipboard-check",
    },
    {
      label: "Riesgo evidencia",
      value: evidenceRisk.length,
      detail: "OT con registro incompleto",
      accent: "red",
      icon: "bi-shield-exclamation",
    },
    {
      label: "Clientes recurrentes",
      value: recurringClients,
      detail: "Con mas de una OT",
      accent: "slate",
      icon: "bi-people",
    },
    {
      label: "Vehiculos recurrentes",
      value: recurringVehicles,
      detail: "Placas con mas de una OT",
      accent: "teal",
      icon: "bi-car-front-fill",
    },
    {
      label: "Km promedio",
      value: `${Math.round(avgMileage).toLocaleString("es-PE")} km`,
      detail: "Kilometraje al ingreso",
      accent: "blue",
      icon: "bi-speedometer2",
    },
    {
      label: "Consultas portal",
      value: portalQueriesInRange.length,
      detail: "Seguimiento por placa",
      accent: "amber",
      icon: "bi-search",
    },
    {
      label: "Adopcion interna",
      value: adoptionUsers,
      detail: "Usuarios con actividad",
      accent: "slate",
      icon: "bi-person-check",
    },
    {
      label: "Fallas reportadas",
      value: reportedFailures,
      detail: "Tipos de falla con OT",
      accent: "teal",
      icon: "bi-tools",
    },
    {
      label: "Carga critica",
      value: criticalMechanic ? criticalMechanic.open + criticalMechanic.overdue : 0,
      detail: criticalMechanic ? criticalMechanic.nombre : "Sin tecnico critico",
      accent: "red",
      icon: "bi-person-gear",
    },
  ];

  els.kpiGrid.innerHTML = kpis
    .map(
      (item) => `
        <article class="kpi-card ${item.accent}">
          <span class="kpi-icon"><i class="bi ${item.icon}" aria-hidden="true"></i></span>
          <span class="kpi-label">${item.label}</span>
          <strong>${item.value}</strong>
          <small>${item.detail}</small>
        </article>
      `,
    )
    .join("");
}

function renderWeeklyChart(filtered) {
  const from = startOfDay(state.dateFrom);
  const to = endOfDay(state.dateTo);
  els.weekRangeLabel.textContent = `${shortDate.format(from)} - ${shortDate.format(to)}`;

  const days = [];
  for (let date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    days.push(new Date(date));
  }

  const series = days.map((date) => {
    const key = toInputDate(date);
    const dayOrders = filtered.filter((order) => order.fechaIngreso.startsWith(key));
    const revenue = dayOrders.reduce((sum, order) => sum + order.montoTotal, 0);
    return {
      label: shortDate.format(date),
      count: dayOrders.length,
      revenue,
    };
  });

  const max = Math.max(...series.map((item) => item.count), 1);

  els.weeklyChart.innerHTML = `
    <div class="bar-chart">
      ${series
        .map(
          (item) => `
            <div class="bar-item">
              <div class="bar-track" title="${item.count} vehiculos, ${PEN.format(item.revenue)}">
                <span style="height:${Math.max((item.count / max) * 100, item.count ? 12 : 0)}%"></span>
              </div>
              <strong>${item.count}</strong>
              <small>${item.label}</small>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderStatus(filtered) {
  const counts = ["Pendiente", "En Proceso", "Listo", "Entregado"].map((status) => ({
    status,
    count: filtered.filter((order) => order.estado === status).length,
  }));
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    els.statusDonut.style.background = "#eef2f5";
  } else {
    let current = 0;
    const segments = counts
      .map((item) => {
        const start = current;
        const amount = (item.count / total) * 100;
        current += amount;
        return `${statusColors[item.status]} ${start}% ${current}%`;
      })
      .join(", ");
    els.statusDonut.style.background = `conic-gradient(${segments})`;
  }

  els.statusLegend.innerHTML = counts
    .map(
      (item) => `
        <div class="legend-item">
          <span style="background:${statusColors[item.status]}"></span>
          <strong>${item.status}</strong>
          <small>${item.count} OT</small>
        </div>
      `,
    )
    .join("");
}

function renderMechanicLoad(filtered) {
  const visibleMechanics = mechanics.length ? mechanics : deriveMechanicsFromOrders(orders);
  const max = Math.max(
    ...visibleMechanics.map((mechanic) => filtered.filter((order) => order.mecanicoId === mechanic.id).length),
    1,
  );

  els.mechanicLoad.innerHTML = visibleMechanics
    .map((mechanic) => {
      const assigned = filtered.filter((order) => order.mecanicoId === mechanic.id);
      const open = assigned.filter((order) => order.estado === "Pendiente" || order.estado === "En Proceso").length;
      const width = (assigned.length / max) * 100;
      return `
        <div class="load-row">
          <div>
            <strong>${mechanic.nombre}</strong>
            <small>${mechanic.especialidad}</small>
          </div>
          <div class="load-meter" aria-label="${assigned.length} ordenes">
            <span style="width:${width}%"></span>
          </div>
          <b>${assigned.length}</b>
          <em>${open} abiertas</em>
        </div>
      `;
    })
    .join("");
}

function renderClients(filtered) {
  const visibleClients = clients.length ? clients : deriveClientsFromOrders(orders);
  const ranked = visibleClients
    .map((client) => {
      const clientOrders = filtered.filter((order) => order.clienteId === client.id || order.clienteNombre === client.nombre);
      const revenue = clientOrders.reduce((sum, order) => sum + order.montoTotal, 0);
      return { ...client, orders: clientOrders.length, revenue };
    })
    .filter((client) => client.orders > 0)
    .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue)
    .slice(0, 5);

  els.clientList.innerHTML = ranked.length
    ? ranked
        .map(
          (client) => `
            <div class="client-row">
              <div>
                <strong>${client.nombre}</strong>
                <small>${client.tipoCliente} - ${client.telefono || "sin telefono"}</small>
              </div>
              <span>${client.orders} OT</span>
              <b>${PEN.format(client.revenue)}</b>
            </div>
          `,
        )
        .join("")
    : `<p class="empty">No hay clientes con ordenes en este filtro.</p>`;
}

function renderOrders(filtered) {
  const sorted = [...filtered].sort((a, b) => new Date(b.fechaIngreso) - new Date(a.fechaIngreso));

  els.ordersTable.innerHTML = sorted.length
    ? sorted
        .map(
          (order) => `
            <tr>
              <td><strong>${order.id}</strong></td>
              <td>${order.placa}</td>
              <td>${order.clienteNombre}</td>
              <td>${order.servicio}</td>
              <td>${order.mecanicoNombre}</td>
              <td><span class="status-pill" style="--status-color:${statusColors[order.estado]}">${order.estado}</span></td>
              <td>${shortDate.format(new Date(order.fechaIngreso))}</td>
              <td>${PEN.format(order.montoTotal)}</td>
              <td>
                <button class="icon-button small" type="button" data-order="${order.id}" aria-label="Ver detalle de ${order.id}" title="Ver detalle">
                  <i class="bi bi-eye" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td class="table-empty" colspan="9">No hay ordenes para los filtros seleccionados.</td>
      </tr>
    `;

  [...els.ordersTable.querySelectorAll("[data-order]")].forEach((button) => {
    button.addEventListener("click", () => openOrderDetail(button.dataset.order));
  });
}

function renderClientDirectory(filtered) {
  if (!els.clientsTable || !els.clientsSummary) return;

  const visibleClients = clients.length ? clients : deriveClientsFromOrders(orders);
  const enriched = visibleClients
    .map((client) => {
      const clientOrders = filtered.filter((order) => order.clienteId === client.id || order.clienteNombre === client.nombre);
      const revenue = clientOrders.reduce((sum, order) => sum + order.montoTotal, 0);
      return {
        ...client,
        orders: clientOrders.length,
        revenue,
      };
    })
    .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue || a.nombre.localeCompare(b.nombre));

  const activeClients = enriched.filter((client) => client.orders > 0).length;
  const totalRevenue = enriched.reduce((sum, client) => sum + client.revenue, 0);

  els.clientsSummary.innerHTML = `
    <article>
      <i class="bi bi-people" aria-hidden="true"></i>
      <span>${visibleClients.length}</span>
      <small>clientes registrados</small>
    </article>
    <article>
      <i class="bi bi-person-check" aria-hidden="true"></i>
      <span>${activeClients}</span>
      <small>clientes con OT filtrada</small>
    </article>
    <article>
      <i class="bi bi-cash-stack" aria-hidden="true"></i>
      <span>${PEN.format(totalRevenue)}</span>
      <small>facturado en el filtro</small>
    </article>
  `;

  els.clientsTable.innerHTML = enriched.length
    ? enriched
        .map(
          (client) => `
            <tr>
              <td>
                <strong>${client.nombre}</strong>
                <small>${client.tipoCliente || "Cliente"}</small>
              </td>
              <td>${client.documento || "-"}</td>
              <td>${client.telefono || "-"}</td>
              <td>${client.cantidadVehiculos || 0}</td>
              <td>${client.orders}</td>
              <td>${PEN.format(client.revenue)}</td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td class="table-empty" colspan="6">No hay clientes registrados.</td>
      </tr>
    `;
}

function renderWorkerDirectory(filtered) {
  if (!els.workersTable || !els.workersSummary) return;

  const visibleWorkers = mechanics.length ? mechanics : deriveMechanicsFromOrders(orders);
  const enriched = visibleWorkers
    .map((worker) => {
      const assigned = filtered.filter((order) => order.mecanicoId === worker.id || order.mecanicoNombre === worker.nombre);
      const open = assigned.filter((order) => order.estado === "Pendiente" || order.estado === "En Proceso").length;
      const revenue = assigned.reduce((sum, order) => sum + order.montoTotal, 0);
      return {
        ...worker,
        assigned: assigned.length,
        open,
        revenue,
      };
    })
    .sort((a, b) => b.assigned - a.assigned || b.revenue - a.revenue || a.nombre.localeCompare(b.nombre));

  const activeWorkers = enriched.filter((worker) => worker.assigned > 0).length;
  const openOrders = enriched.reduce((sum, worker) => sum + worker.open, 0);
  const totalRevenue = enriched.reduce((sum, worker) => sum + worker.revenue, 0);

  els.workersSummary.innerHTML = `
    <article>
      <i class="bi bi-person-gear" aria-hidden="true"></i>
      <span>${visibleWorkers.length}</span>
      <small>trabajadores registrados</small>
    </article>
    <article>
      <i class="bi bi-wrench-adjustable" aria-hidden="true"></i>
      <span>${activeWorkers}</span>
      <small>con OT en el filtro</small>
    </article>
    <article>
      <i class="bi bi-exclamation-circle" aria-hidden="true"></i>
      <span>${openOrders}</span>
      <small>OT abiertas asignadas</small>
    </article>
    <article>
      <i class="bi bi-cash-stack" aria-hidden="true"></i>
      <span>${PEN.format(totalRevenue)}</span>
      <small>facturado asociado</small>
    </article>
  `;

  els.workersTable.innerHTML = enriched.length
    ? enriched
        .map(
          (worker) => `
            <tr>
              <td>
                <strong>${worker.nombre}</strong>
                <small>${worker.usuario || worker.estado || "usuario interno"}</small>
              </td>
              <td>${worker.rol || "mecanico"}</td>
              <td>${worker.especialidad || "Tecnico del taller"}</td>
              <td>${worker.assigned}</td>
              <td>${worker.open}</td>
              <td>${PEN.format(worker.revenue)}</td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td class="table-empty" colspan="6">No hay trabajadores registrados.</td>
      </tr>
    `;
}

function renderServicesDirectory() {
  if (!els.servicesTable || !els.servicesSummary) return;

  const sorted = [...services].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const usedCount = sorted.filter((service) => serviceUsageCount(service) > 0).length;

  els.servicesSummary.innerHTML = `
    <article>
      <i class="bi bi-tools" aria-hidden="true"></i>
      <span>${sorted.length}</span>
      <small>servicios registrados</small>
    </article>
    <article>
      <i class="bi bi-card-checklist" aria-hidden="true"></i>
      <span>${usedCount}</span>
      <small>servicios usados en OT</small>
    </article>
    <article>
      <i class="bi bi-person-check" aria-hidden="true"></i>
      <span>${state.source === "firestore" ? "Real" : "Demo"}</span>
      <small>origen del catalogo</small>
    </article>
  `;

  els.servicesTable.innerHTML = sorted.length
    ? sorted
        .map((service) => {
          const usage = serviceUsageCount(service);
          return `
            <tr>
              <td>
                <strong>${escapeHtml(service.nombre)}</strong>
                <small>${escapeHtml(service.categoria || "Catalogo de taller")}</small>
              </td>
              <td>${usage} OT</td>
              <td><span class="status-pill" style="--status-color:${service.activo === false ? "#64748b" : "#059669"}">${service.activo === false ? "Inactivo" : "Activo"}</span></td>
              <td>
                <div class="row-actions">
                  <button class="icon-button small" type="button" data-edit-service="${escapeHtml(service.id)}" aria-label="Editar ${escapeHtml(service.nombre)}" title="Editar">
                    <i class="bi bi-pencil" aria-hidden="true"></i>
                  </button>
                  <button class="icon-button small danger" type="button" data-delete-service="${escapeHtml(service.id)}" aria-label="Eliminar ${escapeHtml(service.nombre)}" title="Eliminar">
                    <i class="bi bi-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join("")
    : `
      <tr>
        <td class="table-empty" colspan="4">No hay servicios registrados.</td>
      </tr>
    `;

  [...els.servicesTable.querySelectorAll("[data-edit-service]")].forEach((button) => {
    button.addEventListener("click", () => {
      const service = services.find((item) => item.id === button.dataset.editService);
      if (service) openServiceForm(service);
    });
  });

  [...els.servicesTable.querySelectorAll("[data-delete-service]")].forEach((button) => {
    button.addEventListener("click", () => deleteServiceFromTable(button.dataset.deleteService));
  });
}

function renderAdvancedInsights(filtered) {
  renderOverdueBreakdown(filtered);
  renderStateTimes(filtered);
  renderServiceFrequency(filtered);
  renderServiceRevenue(filtered);
  renderRecurrence(filtered);
  renderUserAdoption(filtered);
}

function renderOverdueBreakdown(filtered) {
  if (!els.overdueBreakdown) return;

  const open = filtered.filter(isOpenOrder);
  const buckets = [
    { label: "24 h", count: open.filter((order) => orderAgeHours(order) >= 24).length },
    { label: "48 h", count: open.filter((order) => orderAgeHours(order) >= 48).length },
    { label: "72 h", count: open.filter((order) => orderAgeHours(order) >= 72).length },
  ];
  const stale = open.filter((order) => hoursSinceLastUpdate(order) >= 24).length;
  const critical = getCriticalMechanic(filtered);

  els.overdueBreakdown.innerHTML = `
    ${buckets.map((item) => insightRow(item.label, `${item.count} OT`, "abiertas por encima del umbral")).join("")}
    ${insightRow("Sin actualizar", `${stale} OT`, "sin historial reciente")}
    ${insightRow("Tecnico critico", critical ? critical.nombre : "Sin datos", critical ? `${critical.open} abiertas, ${critical.overdue} vencidas` : "sin carga vencida")}
  `;
}

function renderStateTimes(filtered) {
  if (!els.stateTimeList) return;

  const pendingToProcess = average(
    filtered.map((order) => diffHours(order.fechaIngreso, order.fechaInicioProceso)).filter(Number.isFinite),
  );
  const processToReady = average(
    filtered.map((order) => diffHours(order.fechaInicioProceso, order.fechaListo)).filter(Number.isFinite),
  );
  const readyToDelivered = average(filtered.map((order) => diffHours(order.fechaListo, order.fechaEntrega)).filter(Number.isFinite));
  const fullCycle = average(filtered.map((order) => diffHours(order.fechaIngreso, order.fechaEntrega)).filter(Number.isFinite));

  els.stateTimeList.innerHTML = [
    insightRow("Pendiente -> Proceso", formatHoursKpi(pendingToProcess), "requiere fechaInicioProceso"),
    insightRow("Proceso -> Listo", formatHoursKpi(processToReady), "requiere fechaListo"),
    insightRow("Listo -> Entregado", formatHoursKpi(readyToDelivered), "requiere fechaEntrega"),
    insightRow("Ciclo completo", formatHoursKpi(fullCycle), "ingreso hasta entrega"),
  ].join("");
}

function renderServiceFrequency(filtered) {
  if (!els.serviceFrequencyList) return;

  const stats = getReportedFailureStats(filtered).filter((item) => item.count > 0).slice(0, 6);
  els.serviceFrequencyList.innerHTML = stats.length
    ? stats.map((item) => insightRow(item.nombre, `${item.count} OT`, `${PEN.format(item.revenue)} facturado`)).join("")
    : `<p class="empty">No hay fallas reportadas en este filtro.</p>`;
}

function renderServiceRevenue(filtered) {
  if (!els.serviceRevenueList) return;

  const stats = getReportedFailureStats(filtered).filter((item) => item.revenue > 0).slice(0, 6);
  els.serviceRevenueList.innerHTML = stats.length
    ? stats.map((item) => insightRow(item.nombre, PEN.format(item.revenue), `${item.count} OT valorizadas`)).join("")
    : `<p class="empty">No hay ingresos por falla reportada en este filtro.</p>`;
}

function renderRecurrence(filtered) {
  if (!els.recurrenceList) return;

  const clientsRanking = rankedCounts(filtered, (order) => order.clienteNombre || order.clienteId)
    .filter((item) => item.count > 1)
    .slice(0, 3);
  const vehicleRanking = rankedCounts(filtered, (order) => order.placa)
    .filter((item) => item.count > 1)
    .slice(0, 3);

  const clientRows = clientsRanking.length
    ? clientsRanking.map((item) => insightRow(item.label, `${item.count} OT`, "cliente recurrente")).join("")
    : insightRow("Clientes", "0", "sin recurrencia en el filtro");
  const vehicleRows = vehicleRanking.length
    ? vehicleRanking.map((item) => insightRow(item.label, `${item.count} OT`, "vehiculo recurrente")).join("")
    : insightRow("Vehiculos", "0", "sin placas repetidas");

  els.recurrenceList.innerHTML = `${clientRows}${vehicleRows}`;
}

function renderUserAdoption(filtered) {
  if (!els.userAdoptionList) return;

  const ranked = [...getUserActionStats(filtered).values()].sort((a, b) => b.count - a.count).slice(0, 6);
  const portalQueriesInRange = filterPortalQueriesByCurrentRange();

  els.userAdoptionList.innerHTML = `
    ${ranked.length ? ranked.map((item) => insightRow(item.usuario, `${item.count} eventos`, "historial de OT")).join("") : `<p class="empty">Aun no hay actividad por usuario registrada.</p>`}
    ${insightRow("Portal publico", `${portalQueriesInRange.length} consultas`, "busquedas por placa")}
  `;
}

function openServiceForm(service = null) {
  els.serviceForm.hidden = false;
  els.serviceId.value = service?.id || "";
  els.serviceName.value = service?.nombre || "";
  setServiceMessage(service ? "Editando servicio seleccionado." : "Nuevo servicio.", false);
  els.serviceName.focus();
}

function closeServiceForm() {
  els.serviceForm.reset();
  els.serviceId.value = "";
  els.serviceForm.hidden = true;
  setServiceMessage("", false);
}

async function saveServiceFromForm(event) {
  event.preventDefault();
  const id = els.serviceId.value;
  const nombre = els.serviceName.value.trim();

  if (!nombre) {
    setServiceMessage("Ingresa el nombre del servicio.", true);
    return;
  }

  const duplicate = services.some((service) => service.id !== id && service.nombre.trim().toLowerCase() === nombre.toLowerCase());
  if (duplicate) {
    setServiceMessage("Ya existe un servicio con ese nombre.", true);
    return;
  }

  els.saveServiceButton.disabled = true;
  setServiceMessage("Guardando servicio...", false);

  try {
    if (state.source === "firestore" && window.MANCURIA_FIREBASE?.saveService) {
      await window.MANCURIA_FIREBASE.saveService({ id, nombre });
      await refreshFromFirebase({ preserveFilters: true });
    } else if (id) {
      services = services.map((service) => (service.id === id ? { ...service, nombre } : service));
      renderServicesDirectory();
    } else {
      services = [{ id: `local-${Date.now()}`, nombre, activo: true }, ...services];
      renderServicesDirectory();
    }

    closeServiceForm();
  } catch (error) {
    console.error(error);
    setServiceMessage(serviceErrorMessage(error), true);
  } finally {
    els.saveServiceButton.disabled = false;
  }
}

async function deleteServiceFromTable(serviceId) {
  const service = services.find((item) => item.id === serviceId);
  if (!service) return;

  const usage = serviceUsageCount(service);
  const suffix = usage ? ` Tiene ${usage} OT relacionada(s).` : "";
  const confirmed = window.confirm(`Eliminar el servicio "${service.nombre}"?${suffix}`);
  if (!confirmed) return;

  try {
    if (state.source === "firestore" && window.MANCURIA_FIREBASE?.deleteService) {
      await window.MANCURIA_FIREBASE.deleteService(serviceId);
      await refreshFromFirebase({ preserveFilters: true });
    } else {
      services = services.filter((item) => item.id !== serviceId);
      renderServicesDirectory();
    }
    closeServiceForm();
  } catch (error) {
    console.error(error);
    openServiceForm(service);
    setServiceMessage(serviceErrorMessage(error), true);
  }
}

function setServiceMessage(message, isError) {
  els.serviceMessage.textContent = message;
  els.serviceMessage.classList.toggle("error", Boolean(isError));
}

function serviceErrorMessage(error) {
  const message = String(error?.message || error || "No se pudo guardar el servicio.");
  if (/permission|Missing or insufficient permissions/i.test(message)) {
    return "Firebase no permite modificar servicios. Revisa las reglas.";
  }
  if (/network|fetch|sdk|load|cargar/i.test(message)) {
    return "No se pudo conectar con Firebase.";
  }
  return message.length > 90 ? `${message.slice(0, 90)}...` : message;
}

function serviceUsageCount(service) {
  const target = normalizeText(service.nombre);
  return orders.filter((order) => getReportedFailureLabels(order).some((label) => normalizeText(label) === target)).length;
}

function isOpenOrder(order) {
  return order.estado === "Pendiente" || order.estado === "En Proceso";
}

function orderAgeHours(order) {
  return diffHours(order.fechaIngreso, new Date().toISOString());
}

function hoursSinceLastUpdate(order) {
  return diffHours(order.actualizadoEn || order.fechaIngreso, new Date().toISOString());
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
}

function percent(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function hasCompleteTraceability(order) {
  return Boolean(
    order.fechaIngreso &&
      order.clienteNombre &&
      order.placa &&
      order.marcaModelo &&
      order.fallaReportada &&
      order.fallaReportada !== "Sin falla reportada." &&
      order.trabajoRealizado &&
      order.trabajoRealizado !== "Sin trabajo registrado." &&
      order.mecanicoNombre &&
      order.mecanicoNombre !== "Sin asignar" &&
      Array.isArray(order.historial) &&
      order.historial.length,
  );
}

function hasEvidenceRisk(order) {
  return (
    !hasCompleteTraceability(order) ||
    Number(order.evidenciasCount || 0) <= 0 ||
    (isOpenOrder(order) && hoursSinceLastUpdate(order) >= 24)
  );
}

function countRecurring(sourceOrders, keyFn) {
  return rankedCounts(sourceOrders, keyFn).filter((item) => item.count > 1).length;
}

function rankedCounts(sourceOrders, keyFn) {
  const map = new Map();
  sourceOrders.forEach((order) => {
    const key = String(keyFn(order) || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function getReportedFailureStats(sourceOrders) {
  const map = new Map();
  sourceOrders.forEach((order) => {
    const labels = getReportedFailureLabels(order);
    const revenueShare = Number(order.montoTotal || 0) / Math.max(labels.length, 1);
    labels.forEach((nombre) => {
      const id = normalizeText(nombre);
      const current = map.get(id) || { id, nombre, count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += revenueShare;
      map.set(id, current);
    });
  });

  return [...map.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue || a.nombre.localeCompare(b.nombre));
}

function getReportedFailureLabels(order) {
  const raw = order.fallaReportada;
  const values = Array.isArray(raw) ? raw : [raw];
  const labels = values
    .flatMap((value) => String(value || "").split(/\n|;/))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => normalizeText(value) !== normalizeText("Sin falla reportada."));

  return labels.length ? [...new Set(labels)] : ["Falla sin clasificar"];
}

function getCriticalMechanic(sourceOrders) {
  const map = new Map();
  sourceOrders.forEach((order) => {
    const id = order.mecanicoId || order.mecanicoNombre || "sin-asignar";
    const current = map.get(id) || {
      id,
      nombre: order.mecanicoNombre || "Sin asignar",
      open: 0,
      overdue: 0,
    };
    if (isOpenOrder(order)) current.open += 1;
    if (isOpenOrder(order) && orderAgeHours(order) >= 48) current.overdue += 1;
    map.set(id, current);
  });

  return [...map.values()].sort((a, b) => b.overdue - a.overdue || b.open - a.open || a.nombre.localeCompare(b.nombre))[0] || null;
}

function uniqueUserActions(sourceOrders) {
  return new Set([...getUserActionStats(sourceOrders).keys()]);
}

function getUserActionStats(sourceOrders) {
  const map = new Map();
  sourceOrders.forEach((order) => {
    const users = new Set();
    if (order.creadoPor) users.add(order.creadoPor);
    if (order.actualizadoPor) users.add(order.actualizadoPor);
    (order.historialEventos || []).forEach((event) => {
      if (event.usuario) users.add(event.usuario);
    });

    users.forEach((usuario) => {
      const key = String(usuario).trim();
      if (!key) return;
      const current = map.get(key) || { usuario: key, count: 0 };
      current.count += 1;
      map.set(key, current);
    });
  });
  return map;
}

function filterPortalQueriesByCurrentRange() {
  const from = state.dateFrom ? startOfDay(state.dateFrom) : null;
  const to = state.dateTo ? endOfDay(state.dateTo) : null;
  return portalQueries.filter((query) => {
    if (!query.fecha) return false;
    const date = new Date(query.fecha);
    return (!from || date >= from) && (!to || date <= to);
  });
}

function formatHoursKpi(value) {
  return value > 0 ? `${value.toFixed(1)} h` : "Sin datos";
}

function insightRow(label, value, detail) {
  return `
    <div class="insight-row">
      <div>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(detail)}</small>
      </div>
      <b>${escapeHtml(value)}</b>
    </div>
  `;
}

function openOrderDetail(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) return;

  els.dialogOrderId.textContent = order.id;
  els.dialogTitle.textContent = `${order.placa} - ${order.marcaModelo}`;
  els.dialogBody.innerHTML = `
    <div class="detail-grid">
      <section>
        <h3>Datos operativos</h3>
        <dl>
          <div><dt>Cliente</dt><dd>${order.clienteNombre}</dd></div>
          <div><dt>Servicio</dt><dd>${order.servicio}</dd></div>
          <div><dt>Mecanico</dt><dd>${order.mecanicoNombre}</dd></div>
          <div><dt>Estado</dt><dd><span class="status-pill" style="--status-color:${statusColors[order.estado]}">${order.estado}</span></dd></div>
          <div><dt>Kilometraje</dt><dd>${Number(order.kilometraje || 0).toLocaleString("es-PE")} km</dd></div>
          <div><dt>Monto</dt><dd>${PEN.format(order.montoTotal)}</dd></div>
        </dl>
      </section>
      <section>
        <h3>Diagnostico</h3>
        <p>${order.fallaReportada}</p>
        <h3>Trabajo realizado</h3>
        <p>${order.trabajoRealizado}</p>
      </section>
      <section class="history-section">
        <h3>Bitacora</h3>
        <ol>
          ${(order.historial || []).map((item) => `<li>${item}</li>`).join("")}
        </ol>
      </section>
      <section>
        <h3>Fechas</h3>
        <dl>
          <div><dt>Ingreso</dt><dd>${longDate.format(new Date(order.fechaIngreso))}</dd></div>
          <div><dt>Entrega</dt><dd>${order.fechaEntrega ? longDate.format(new Date(order.fechaEntrega)) : "Pendiente"}</dd></div>
        </dl>
      </section>
    </div>
  `;

  els.orderDialog.showModal();
}

function exportFilteredOrders() {
  const filtered = getFilteredOrders();
  const header = ["id", "placa", "cliente", "servicio", "mecanico", "estado", "fechaIngreso", "montoTotal"];
  const rows = filtered.map((order) => [
    order.id,
    order.placa,
    order.clienteNombre,
    order.servicio,
    order.mecanicoNombre,
    order.estado,
    order.fechaIngreso,
    order.montoTotal,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ordenes-mancuria-${state.dateFrom}-${state.dateTo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function deriveClientsFromOrders(sourceOrders) {
  const map = new Map();
  sourceOrders.forEach((order) => {
    const id = order.clienteId || order.clienteNombre;
    if (!map.has(id)) {
      map.set(id, {
        id,
        nombre: order.clienteNombre,
        tipoCliente: "Cliente",
        telefono: "",
      });
    }
  });
  return [...map.values()];
}

function deriveMechanicsFromOrders(sourceOrders) {
  const map = new Map();
  sourceOrders.forEach((order) => {
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

function startOfDay(value) {
  return new Date(`${value}T00:00:00`);
}

function endOfDay(value) {
  return new Date(`${value}T23:59:59`);
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffHours(start, end) {
  if (!end) return Number.NaN;
  return (new Date(end).getTime() - new Date(start).getTime()) / 36e5;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.__MANCURIA_DASHBOARD__ = {
  firestoreCollections,
  getFilteredOrders,
  refreshFromFirebase,
  getDataSource: () => ({
    source: state.source,
    status: els.dataSourceText.textContent,
    user: currentUser,
    orders: orders.length,
    clients: clients.length,
    mechanics: mechanics.length,
    services: services.length,
    portalQueries: portalQueries.length,
  }),
};

init();
})();
