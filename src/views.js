(() => {
  function renderLogin() {
    return `
      <section class="login-screen" id="loginScreen" aria-label="Inicio de sesion">
        <div class="login-panel">
          <div class="login-brand">
            <img class="login-logo" src="./assets/mancuria-logo-final-hero.png" alt="Mancuria" />
            <div>
              <p class="eyebrow">Taller Automotriz Mancuria</p>
              <h1>Acceso interno</h1>
            </div>
          </div>

          <form class="login-form" id="loginForm">
            <label class="field">
              <span>Correo</span>
              <input id="loginUser" name="correo" type="email" autocomplete="email" placeholder="correo@mancuria.com" required />
            </label>
            <label class="field">
              <span>Password</span>
              <input id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="Password" required />
            </label>
            <button class="button login-button" id="loginButton" type="submit">
              <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
              Ingresar
            </button>
            <p class="login-message" id="loginMessage" role="status"></p>
          </form>
        </div>
      </section>
    `;
  }

  function renderSidebar() {
    return `
      <aside class="sidebar" aria-label="Navegacion principal">
        <a class="brand" href="#dashboard" data-view="dashboard" aria-label="Ir al resumen">
          <img class="brand-logo" src="./assets/mancuria-logo-final-nav.png" alt="Mancuria" />
          <span>
            <small>Control operativo</small>
          </span>
        </a>

        <nav class="nav-list" aria-label="Secciones">
          <a class="nav-item active" href="#dashboard" data-view="dashboard">
            <i class="bi bi-speedometer2" aria-hidden="true"></i>
            Resumen
          </a>
          <a class="nav-item" href="#ordenes" data-view="ordenes">
            <i class="bi bi-card-checklist" aria-hidden="true"></i>
            Ordenes
          </a>
          <a class="nav-item" href="#clientes" data-view="clientes">
            <i class="bi bi-people" aria-hidden="true"></i>
            Clientes
          </a>
          <a class="nav-item" href="#trabajadores" data-view="trabajadores">
            <i class="bi bi-person-gear" aria-hidden="true"></i>
            Trabajadores
          </a>
          <a class="nav-item" href="#servicios" data-view="servicios">
            <i class="bi bi-tools" aria-hidden="true"></i>
            Servicios
          </a>
        </nav>

        <section class="sidebar-visual" aria-label="Imagen del taller">
          <img src="./assets/workshop-dashboard-banner.png" alt="Taller automotriz organizado con bahia de diagnostico" />
        </section>

        <section class="sidebar-status" aria-label="Estado operativo">
          <span class="status-dot"></span>
          <span id="dataSourceText">Datos de prueba activos</span>
        </section>
      </aside>
    `;
  }

  function renderTopbar() {
    return `
      <header class="topbar">
        <div>
          <p class="eyebrow" id="pageEyebrow">Taller Automotriz Mancuria</p>
          <h1 id="pageTitle">Dashboard de KPIs</h1>
        </div>
        <div class="topbar-actions">
          <div class="user-chip" id="userChip" aria-label="Usuario actual"></div>
          <button class="icon-button" id="refreshData" type="button" aria-label="Actualizar datos" title="Actualizar datos">
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          </button>
          <button class="icon-button" id="logoutButton" type="button" aria-label="Cerrar sesion" title="Cerrar sesion">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
          </button>
          <button class="button secondary" id="exportCsv" type="button">
            <i class="bi bi-download" aria-hidden="true"></i>
            CSV
          </button>
        </div>
      </header>
    `;
  }

  function renderFilters() {
    return `
      <section class="filters" aria-label="Filtros del dashboard">
        <label class="field">
          <span>Desde</span>
          <input id="dateFrom" type="date" />
        </label>
        <label class="field">
          <span>Hasta</span>
          <input id="dateTo" type="date" />
        </label>
        <label class="field">
          <span>Mecanico</span>
          <select id="mechanicFilter">
            <option value="todos">Todos</option>
          </select>
        </label>
        <label class="field search-field">
          <span>Buscar</span>
          <input id="searchInput" type="search" placeholder="Placa, cliente o servicio" />
        </label>
        <div class="segmented" role="group" aria-label="Filtro por estado">
          <button class="segment active" type="button" data-status="todos">Todos</button>
          <button class="segment" type="button" data-status="Pendiente">Pendiente</button>
          <button class="segment" type="button" data-status="En Proceso">En proceso</button>
          <button class="segment" type="button" data-status="Listo">Listo</button>
          <button class="segment" type="button" data-status="Entregado">Entregado</button>
        </div>
      </section>
    `;
  }

  function renderDashboardView() {
    return `
      <section class="view-panel active" id="dashboard" data-view-panel="dashboard" aria-label="Resumen de KPIs">
        <section id="resumen" class="kpi-grid" aria-label="Indicadores principales"></section>

        <section class="dashboard-grid" aria-label="Analisis operativo">
          <article class="panel chart-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Volumen semanal</p>
                <h2>Vehiculos atendidos</h2>
              </div>
              <span class="panel-meta" id="weekRangeLabel"></span>
            </div>
            <div id="weeklyChart" class="chart-area" aria-label="Grafico de vehiculos por dia"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Distribucion</p>
                <h2>Estados de OT</h2>
              </div>
            </div>
            <div class="status-layout">
              <div class="donut" id="statusDonut" aria-hidden="true"></div>
              <div id="statusLegend" class="legend"></div>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Asignacion</p>
                <h2>Carga por mecanico</h2>
              </div>
            </div>
            <div id="mechanicLoad" class="load-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Cartera</p>
                <h2>Clientes frecuentes</h2>
              </div>
            </div>
            <div id="clientList" class="client-list"></div>
          </article>
        </section>

        <section class="insight-grid" aria-label="KPIs avanzados">
          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Control de atrasos</p>
                <h2>OT vencidas</h2>
              </div>
            </div>
            <div id="overdueBreakdown" class="insight-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Trazabilidad</p>
                <h2>Tiempos por estado</h2>
              </div>
            </div>
            <div id="stateTimeList" class="insight-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Catalogo</p>
                <h2>Fallas reportadas</h2>
              </div>
            </div>
            <div id="serviceFrequencyList" class="insight-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Rentabilidad</p>
                <h2>Ingresos por falla</h2>
              </div>
            </div>
            <div id="serviceRevenueList" class="insight-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Fidelizacion</p>
                <h2>Clientes y vehiculos recurrentes</h2>
              </div>
            </div>
            <div id="recurrenceList" class="insight-list"></div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Adopcion interna</p>
                <h2>Uso por trabajador</h2>
              </div>
            </div>
            <div id="userAdoptionList" class="insight-list"></div>
          </article>
        </section>
      </section>
    `;
  }

  function renderOrdersView() {
    return `
      <section class="view-panel" id="ordenes" data-view-panel="ordenes" aria-label="Ordenes de trabajo">
        <section class="orders-section">
          <div class="section-header">
            <div>
              <p class="eyebrow">Operacion diaria</p>
              <h2>Ordenes de trabajo</h2>
            </div>
            <button class="button primary" id="clearFilters" type="button">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
              Limpiar filtros
            </button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>OT</th>
                  <th>Placa</th>
                  <th>Cliente</th>
                  <th>Servicio</th>
                  <th>Mecanico</th>
                  <th>Estado</th>
                  <th>Ingreso</th>
                  <th>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="ordersTable"></tbody>
            </table>
          </div>
        </section>
      </section>
    `;
  }

  function renderClientsView() {
    return `
      <section class="view-panel" id="clientes" data-view-panel="clientes" aria-label="Clientes">
        <section class="orders-section">
          <div class="section-header">
            <div>
              <p class="eyebrow">Directorio comercial</p>
              <h2>Clientes</h2>
            </div>
          </div>
          <div class="directory-summary" id="clientsSummary"></div>
          <div class="table-wrap">
            <table class="directory-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Telefono</th>
                  <th>Vehiculos</th>
                  <th>OT</th>
                  <th>Facturado</th>
                </tr>
              </thead>
              <tbody id="clientsTable"></tbody>
            </table>
          </div>
        </section>
      </section>
    `;
  }

  function renderWorkersView() {
    return `
      <section class="view-panel" id="trabajadores" data-view-panel="trabajadores" aria-label="Trabajadores">
        <section class="orders-section">
          <div class="section-header">
            <div>
              <p class="eyebrow">Equipo tecnico</p>
              <h2>Usuarios trabajadores</h2>
            </div>
          </div>
          <div class="directory-summary" id="workersSummary"></div>
          <div class="table-wrap">
            <table class="directory-table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Rol</th>
                  <th>Especialidad</th>
                  <th>OT asignadas</th>
                  <th>Abiertas</th>
                  <th>Facturado</th>
                </tr>
              </thead>
              <tbody id="workersTable"></tbody>
            </table>
          </div>
        </section>
      </section>
    `;
  }

  function renderServicesView() {
    return `
      <section class="view-panel" id="servicios" data-view-panel="servicios" aria-label="Servicios">
        <section class="orders-section">
          <div class="section-header">
            <div>
              <p class="eyebrow">Catalogo operativo</p>
              <h2>Servicios</h2>
            </div>
            <button class="button primary" id="newServiceButton" type="button">
              <i class="bi bi-plus-lg" aria-hidden="true"></i>
              Nuevo servicio
            </button>
          </div>

          <div class="directory-summary" id="servicesSummary"></div>

          <form class="service-form" id="serviceForm" hidden>
            <input id="serviceId" type="hidden" />
            <label class="field">
              <span>Nombre del servicio</span>
              <input id="serviceName" type="text" maxlength="90" placeholder="Ej. Mantenimiento menor" required />
            </label>
            <div class="form-actions">
              <button class="button primary" id="saveServiceButton" type="submit">
                <i class="bi bi-check-lg" aria-hidden="true"></i>
                Guardar
              </button>
              <button class="button secondary" id="cancelServiceButton" type="button">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
                Cancelar
              </button>
            </div>
            <p class="message-line" id="serviceMessage" role="status"></p>
          </form>

          <div class="table-wrap">
            <table class="directory-table services-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Uso en OT</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="servicesTable"></tbody>
            </table>
          </div>
        </section>
      </section>
    `;
  }

  function renderDialog() {
    return `
      <dialog class="order-dialog" id="orderDialog">
        <div class="dialog-header">
          <div>
            <p class="eyebrow" id="dialogOrderId"></p>
            <h2 id="dialogTitle"></h2>
          </div>
          <button class="icon-button" id="closeDialog" type="button" aria-label="Cerrar detalle" title="Cerrar">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="dialog-body" id="dialogBody"></div>
      </dialog>
    `;
  }

  function renderApp() {
    return `
      ${renderLogin()}
      <div class="app-shell locked" id="appShell">
        ${renderSidebar()}
        <main class="main-content">
          ${renderTopbar()}
          ${renderFilters()}
          ${renderDashboardView()}
          ${renderOrdersView()}
          ${renderClientsView()}
          ${renderWorkersView()}
          ${renderServicesView()}
        </main>
      </div>
      ${renderDialog()}
    `;
  }

  window.MANCURIA_VIEWS = {
    renderApp,
  };
})();
