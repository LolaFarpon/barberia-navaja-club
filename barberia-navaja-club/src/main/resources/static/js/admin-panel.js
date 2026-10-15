const API_TURNOS = '/api/turnos';
const API_SERVICIOS = '/api/servicios';
const API_CLIENTES = '/api/clientes';
const API_REPORTES = '/api/reportes';

// Si el servidor dice "no estás logueado" (401), vuelve al login
const fetchOriginal = window.fetch;
window.fetch = async (...args) => {
    const response = await fetchOriginal(...args);
    if (response.status === 401) {
        window.location.href = 'admin-login.html';
    }
    return response;
};

// Al abrir el panel, pregunta al servidor si hay sesión
fetch('/api/admin/me');

function fechaHoy() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
}

// Navegación del sidebar
document.querySelectorAll('.nav-item[data-seccion]').forEach(boton => {
    boton.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        boton.classList.add('active');

        document.querySelectorAll('.seccion').forEach(s => s.classList.add('d-none'));
        document.getElementById('seccion-' + boton.dataset.seccion).classList.remove('d-none');

        if (boton.dataset.seccion === 'inicio') cargarInicio();
        if (boton.dataset.seccion === 'turnos') cargarTurnos();
        if (boton.dataset.seccion === 'clientes') cargarClientes();
        if (boton.dataset.seccion === 'servicios') cargarServicios();
        if (boton.dataset.seccion === 'reportes') cargarReportes();
    });
});

document.getElementById('btnCerrarSesion').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = 'index.html';
});

// ---------- INICIO ----------
async function cargarInicio() {
    const hoy = fechaHoy();
    document.getElementById('fechaHoy').textContent = hoy;

    try {
        const response = await fetch(`${API_TURNOS}/fecha/${hoy}`);
        const turnos = await response.json();

        const confirmados = turnos.filter(t => t.estado === 'confirmado').length;
        const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
        const ingresos = turnos
            .filter(t => t.estado === 'finalizado')
            .reduce((suma, t) => suma + Number(t.servicio.precio), 0);

        document.getElementById('statTotal').textContent = turnos.length;
        document.getElementById('statConfirmados').textContent = confirmados;
        document.getElementById('statCancelados').textContent = cancelados;
        document.getElementById('statIngresos').textContent = '$' + ingresos.toLocaleString('es-AR');
    } catch (error) {
        console.error('Error al cargar el inicio:', error);
    }
}

// ---------- TURNOS ----------
function badgeEstado(estado) {
    const colores = {
        pendiente: 'warning',
        confirmado: 'primary',
        cancelado: 'danger',
        finalizado: 'success'
    };
    return `<span class="badge bg-${colores[estado] || 'secondary'}">${estado}</span>`;
}

async function cargarTurnos() {
    const fechaSeleccionada = document.getElementById('filtroFecha').value || fechaHoy();
    const estadoFiltro = document.getElementById('filtroEstado').value;
    const orden = document.getElementById('filtroOrden').value;

    try {
        const response = await fetch(`${API_TURNOS}/fecha/${fechaSeleccionada}`);
        let turnos = await response.json();

        if (estadoFiltro !== 'todos') {
            turnos = turnos.filter(t => t.estado === estadoFiltro);
        }

        turnos.sort((a, b) => orden === 'asc' ? a.hora.localeCompare(b.hora) : b.hora.localeCompare(a.hora));

        const cuerpo = document.getElementById('cuerpoTablaTurnos');
        const mensajeVacio = document.getElementById('mensajeVacioTurnos');
        cuerpo.innerHTML = '';

        if (turnos.length === 0) {
            mensajeVacio.classList.remove('d-none');
            return;
        }
        mensajeVacio.classList.add('d-none');

        turnos.forEach(t => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${t.hora.substring(0, 5)}</td>
                <td>${t.cliente.nombre}</td>
                <td>${t.servicio.nombre}</td>
                <td>${badgeEstado(t.estado)}</td>
                <td>
                    ${accionesPorEstado(t)}
                </td>
            `;
            cuerpo.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar turnos:', error);
    }
}

function accionesPorEstado(turno) {
    if (turno.estado === 'pendiente') {
        return `
            <button class="btn btn-sm btn-primary" onclick="cambiarEstadoTurno(${turno.idTurno}, 'confirmado')">Confirmar</button>
            <button class="btn btn-sm btn-danger" onclick="cambiarEstadoTurno(${turno.idTurno}, 'cancelado')">Cancelar</button>
        `;
    }
    if (turno.estado === 'confirmado') {
        return `
            <button class="btn btn-sm btn-success" onclick="cambiarEstadoTurno(${turno.idTurno}, 'finalizado')">Finalizar</button>
            <button class="btn btn-sm btn-danger" onclick="cambiarEstadoTurno(${turno.idTurno}, 'cancelado')">Cancelar</button>
        `;
    }
    return '';
}

async function cambiarEstadoTurno(id, nuevoEstado) {
    await fetch(`${API_TURNOS}/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
    });
    cargarTurnos();
}

document.getElementById('filtroFecha').value = fechaHoy();
document.getElementById('filtroFecha').addEventListener('change', cargarTurnos);
document.getElementById('filtroEstado').addEventListener('change', cargarTurnos);
document.getElementById('filtroOrden').addEventListener('change', cargarTurnos);

// ---------- MODAL NUEVO TURNO ----------
async function cargarServiciosSelect() {
    const select = document.getElementById('ntServicio');
    try {
        const response = await fetch(API_SERVICIOS);
        const servicios = await response.json();
        select.innerHTML = '<option value="">Seleccioná un servicio</option>';
        servicios.forEach(s => {
            const option = document.createElement('option');
            option.value = s.idServicio;
            option.textContent = `${s.nombre} - $${s.precio}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

document.getElementById('modalNuevoTurno').addEventListener('show.bs.modal', cargarServiciosSelect);

document.getElementById('ntFecha').min = fechaHoy();

document.getElementById('ntFecha').addEventListener('change', async () => {
    const fecha = document.getElementById('ntFecha').value;
    const selectHora = document.getElementById('ntHora');
    const errorFecha = document.getElementById('errorFechaAdmin');
    if (!fecha) return;

    const [anio, mes, dia] = fecha.split('-').map(Number);
    const esDomingo = new Date(anio, mes - 1, dia).getDay() === 0;

    if (esDomingo) {
        errorFecha.classList.remove('d-none');
        selectHora.innerHTML = '<option value="">Elegí otra fecha</option>';
        return;
    }
    errorFecha.classList.add('d-none');

    selectHora.innerHTML = '<option value="">Cargando...</option>';
    try {
        const response = await fetch(`${API_TURNOS}/disponibles/${fecha}`);
        const horarios = await response.json();

        if (horarios.length === 0) {
            selectHora.innerHTML = '<option value="">No hay horarios disponibles</option>';
            return;
        }
        selectHora.innerHTML = '<option value="">Elegí un horario</option>';
        horarios.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = h.substring(0, 5);
            selectHora.appendChild(option);
        });
    } catch (error) {
        selectHora.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
});

document.getElementById('formNuevoTurno').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('errorNuevoTurno');
    errorDiv.classList.add('d-none');

    const fechaElegida = document.getElementById('ntFecha').value;
    const [anio, mes, dia] = fechaElegida.split('-').map(Number);
    if (new Date(anio, mes - 1, dia).getDay() === 0) {
        errorDiv.textContent = 'Los domingos el local está cerrado. Elegí otro día.';
        errorDiv.classList.remove('d-none');
        return;
    }

    const datos = {
        nombre: document.getElementById('ntNombre').value,
        telefono: document.getElementById('ntTelefono').value,
        email: document.getElementById('ntEmail').value,
        idServicio: document.getElementById('ntServicio').value,
        fecha: document.getElementById('ntFecha').value,
        hora: document.getElementById('ntHora').value
    };

    try {
        const response = await fetch(`${API_TURNOS}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            document.getElementById('formNuevoTurno').reset();
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoTurno')).hide();
            cargarTurnos();
            cargarInicio();
        } else {
            const texto = await response.text();
            errorDiv.textContent = texto || 'No se pudo crear el turno.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Error al conectar con el servidor.';
        errorDiv.classList.remove('d-none');
    }
});

// ---------- CLIENTES ----------
async function cargarClientes() {
    try {
        const response = await fetch(API_CLIENTES);
        const clientes = await response.json();

        const cuerpo = document.getElementById('cuerpoTablaClientes');
        const mensajeVacio = document.getElementById('mensajeVacioClientes');
        cuerpo.innerHTML = '';

        if (clientes.length === 0) {
            mensajeVacio.classList.remove('d-none');
            return;
        }
        mensajeVacio.classList.add('d-none');

        for (const cliente of clientes) {
            const turnosResp = await fetch(`${API_CLIENTES}/${cliente.idCliente}/turnos`);
            const turnos = await turnosResp.json();

            const cantidad = turnos.filter(t => t.estado === 'finalizado').length;
            const ultimoTurno = turnos.length > 0 ? turnos[0].fecha : '-';

            const fila = document.createElement('tr');
            fila.style.cursor = 'pointer';
            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || '-'}</td>
                <td>${ultimoTurno}</td>
                <td>${cantidad}</td>
            `;
            fila.addEventListener('click', () => mostrarHistorial(cliente, turnos));
            cuerpo.appendChild(fila);
        }
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

function mostrarHistorial(cliente, turnos) {
    document.getElementById('historialTitulo').textContent = `Historial de ${cliente.nombre}`;
    const cuerpo = document.getElementById('cuerpoHistorial');
    const mensajeVacio = document.getElementById('mensajeVacioHistorial');
    cuerpo.innerHTML = '';

    if (turnos.length === 0) {
        mensajeVacio.classList.remove('d-none');
    } else {
        mensajeVacio.classList.add('d-none');
        turnos.forEach(t => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${t.fecha}</td>
                <td>${t.hora.substring(0, 5)}</td>
                <td>${t.servicio.nombre}</td>
                <td>${badgeEstado(t.estado)}</td>
            `;
            cuerpo.appendChild(fila);
        });
    }

    new bootstrap.Modal(document.getElementById('modalHistorialCliente')).show();
}

document.getElementById('formNuevoCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('errorNuevoCliente');
    errorDiv.classList.add('d-none');

    const datos = {
        nombre: document.getElementById('ncNombre').value,
        telefono: document.getElementById('ncTelefono').value,
        email: document.getElementById('ncEmail').value
    };

    try {
        const response = await fetch(API_CLIENTES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            document.getElementById('formNuevoCliente').reset();
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoCliente')).hide();
            cargarClientes();
        } else {
            const texto = await response.text();
            errorDiv.textContent = texto || 'No se pudo crear el cliente.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Error al conectar con el servidor.';
        errorDiv.classList.remove('d-none');
    }
});

// ---------- SERVICIOS EN INICIO ----------
const imagenesServicios = {
    'Corte de pelo': 'img/pelo.jpeg',
    'Barba': 'img/barba.jpeg',
    'Corte y barba': 'img/pelo-barba.jpeg'
};

async function cargarServiciosInicio() {
    try {
        const response = await fetch(API_SERVICIOS);
        const servicios = await response.json();

        const fila = document.getElementById('filaServicios');
        fila.innerHTML = '';

        servicios.forEach(s => {
            const imagen = imagenesServicios[s.nombre] || 'img/pelo.jpeg';
            const col = document.createElement('div');
            col.className = 'col-12 col-md-4';
            col.innerHTML = `
                <div class="stat-card p-0 overflow-hidden">
                    <img src="${imagen}" alt="${s.nombre}" style="width:100%; height:160px; object-fit:cover;">
                    <div class="p-3">
                        <h6 class="mb-1" style="color:#6b4226;">${s.nombre}</h6>
                        <p class="mb-1 text-muted" style="font-size:0.9rem;">${s.descripcion || ''}</p>
                        <strong style="color:#8b5e3c;">$${s.precio}</strong>
                    </div>
                </div>
            `;
            fila.appendChild(col);
        });
    } catch (error) {
        console.error('Error al cargar servicios en inicio:', error);
    }
}

// ---------- SERVICIOS (sección) ----------
async function cargarServicios() {
    try {
        const response = await fetch(API_SERVICIOS);
        const servicios = await response.json();

        const cuerpo = document.getElementById('cuerpoTablaServicios');
        const mensajeVacio = document.getElementById('mensajeVacioServicios');
        cuerpo.innerHTML = '';

        if (servicios.length === 0) {
            mensajeVacio.classList.remove('d-none');
            return;
        }
        mensajeVacio.classList.add('d-none');

        servicios.forEach(s => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${s.nombre}</td>
                <td>${s.descripcion || '-'}</td>
                <td>$${s.precio}</td>
                <td>${s.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
                <td><button class="btn btn-sm btn-outline-brown" onclick='abrirEditarServicio(${JSON.stringify(s)})'>Editar</button></td>
            `;
            cuerpo.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

document.getElementById('formNuevoServicio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('errorNuevoServicio');
    errorDiv.classList.add('d-none');

    const datos = {
        nombre: document.getElementById('nsNombre').value,
        descripcion: document.getElementById('nsDescripcion').value,
        precio: Number(document.getElementById('nsPrecio').value),
        activo: document.getElementById('nsActivo').checked
    };

    try {
        const response = await fetch(API_SERVICIOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            document.getElementById('formNuevoServicio').reset();
            document.getElementById('nsActivo').checked = true;
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoServicio')).hide();
            cargarServicios();
            cargarServiciosInicio();
        } else {
            const texto = await response.text();
            errorDiv.textContent = texto || 'No se pudo crear el servicio.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Error al conectar con el servidor.';
        errorDiv.classList.remove('d-none');
    }
});

function abrirEditarServicio(servicio) {
    document.getElementById('esId').value = servicio.idServicio;
    document.getElementById('esNombre').value = servicio.nombre;
    document.getElementById('esDescripcion').value = servicio.descripcion || '';
    document.getElementById('esPrecio').value = servicio.precio;
    document.getElementById('esActivo').checked = servicio.activo;
    new bootstrap.Modal(document.getElementById('modalEditarServicio')).show();
}

document.getElementById('formEditarServicio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('errorEditarServicio');
    errorDiv.classList.add('d-none');

    const id = document.getElementById('esId').value;
    const datos = {
        nombre: document.getElementById('esNombre').value,
        descripcion: document.getElementById('esDescripcion').value,
        precio: Number(document.getElementById('esPrecio').value),
        activo: document.getElementById('esActivo').checked
    };

    try {
        const response = await fetch(`${API_SERVICIOS}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditarServicio')).hide();
            cargarServicios();
            cargarServiciosInicio();
        } else {
            const texto = await response.text();
            errorDiv.textContent = texto || 'No se pudo editar el servicio.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        errorDiv.textContent = 'Error al conectar con el servidor.';
        errorDiv.classList.remove('d-none');
    }
});

// ---------- REPORTES ----------
let graficoServiciosChart = null;

async function cargarReportes() {
    const periodo = document.getElementById('selectorPeriodo').value;

    try {
        const response = await fetch(`${API_REPORTES}?periodo=${periodo}`);
        const datos = await response.json();

        document.getElementById('repRealizados').textContent = datos.turnosRealizados;
        document.getElementById('repCancelados').textContent = datos.turnosCancelados;
        document.getElementById('repIngresos').textContent = '$' + Number(datos.ingresos).toLocaleString('es-AR');

        dibujarGraficoServicios(datos.porServicio);
        dibujarGraficoComparativo(datos.porServicio);
    } catch (error) {
        console.error('Error al cargar reportes:', error);
    }
}

function dibujarGraficoServicios(porServicio) {
    const mensajeVacio = document.getElementById('mensajeVacioReportes');
    const canvas = document.getElementById('graficoServicios');
    const etiquetas = Object.keys(porServicio);
    const valores = Object.values(porServicio);

    if (graficoServiciosChart) {
        graficoServiciosChart.destroy();
    }

    if (etiquetas.length === 0) {
        mensajeVacio.classList.remove('d-none');
        canvas.classList.add('d-none');
        return;
    }
    mensajeVacio.classList.add('d-none');
    canvas.classList.remove('d-none');

    graficoServiciosChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: etiquetas,
            datasets: [{
                data: valores,
                backgroundColor: ['#6b4226', '#8b5e3c', '#c9a679', '#a6764a', '#e0c9a6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

let graficoComparativoChart = null;

function dibujarGraficoComparativo(porServicio) {
    const mensajeVacio = document.getElementById('mensajeVacioComparativo');
    const canvas = document.getElementById('graficoComparativo');

    const pelo = porServicio['Corte de pelo'] || 0;
    const barba = porServicio['Barba'] || 0;

    if (graficoComparativoChart) {
        graficoComparativoChart.destroy();
    }

    if (pelo === 0 && barba === 0) {
        mensajeVacio.classList.remove('d-none');
        canvas.classList.add('d-none');
        return;
    }
    mensajeVacio.classList.add('d-none');
    canvas.classList.remove('d-none');

    graficoComparativoChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Corte de pelo', 'Barba'],
            datasets: [{
                data: [pelo, barba],
                backgroundColor: ['#2563eb', '#facc15']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}


document.getElementById('selectorPeriodo').addEventListener('change', cargarReportes);

cargarInicio();
cargarServiciosInicio();