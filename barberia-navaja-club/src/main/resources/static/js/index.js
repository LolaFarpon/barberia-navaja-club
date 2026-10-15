const API_URL = '/api/turnos';
const API_SERVICIOS = '/api/servicios';

const inputFecha = document.getElementById('fecha');
const selectHora = document.getElementById('hora');
const selectServicio = document.getElementById('servicio');

function fechaHoyISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
}

function esDomingo(fechaStr) {
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);
    return fecha.getDay() === 0;
}

// Carga los servicios activos en el desplegable del modal
async function cargarServicios() {
    try {
        const response = await fetch(`${API_SERVICIOS}/activos`);
        const servicios = await response.json();
        selectServicio.innerHTML = '<option value="">Seleccioná un servicio</option>';
        servicios.forEach(s => {
            const option = document.createElement('option');
            option.value = s.idServicio;
            option.textContent = `${s.nombre} - $${s.precio}`;
            selectServicio.appendChild(option);
        });
    } catch (error) {
        selectServicio.innerHTML = '<option value="">Error al cargar servicios</option>';
    }
}
cargarServicios();

// Carga las tarjetas de servicios en la página principal
const imagenesServicios = {
    'Corte de pelo': 'img/pelo.jpeg',
    'Barba': 'img/barba.jpeg',
    'Corte y barba': 'img/pelo-barba.jpeg'
};

async function cargarServiciosPublicos() {
    try {
        const response = await fetch(`${API_SERVICIOS}/activos`);
        const servicios = await response.json();
        const fila = document.getElementById('filaServiciosPublic');
        fila.innerHTML = '';

        servicios.forEach(s => {
            const imagen = imagenesServicios[s.nombre] || 'img/pelo.jpeg';
            const col = document.createElement('div');
            col.className = 'col-12 col-md-4';
            col.innerHTML = `
                <div class="card-custom p-0 overflow-hidden h-100">
                    <img src="${imagen}" alt="${s.nombre}" style="width:100%; height:180px; object-fit:cover;">
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
        console.error('Error al cargar servicios públicos:', error);
    }
}
cargarServiciosPublicos();

// Bloquea fechas pasadas
inputFecha.min = fechaHoyISO();

// Cuando el cliente elige una fecha, buscamos los horarios disponibles
inputFecha.addEventListener('change', async () => {
    const fecha = inputFecha.value;
    const errorFecha = document.getElementById('errorFechaCliente');

    if (!fecha) return;

    if (esDomingo(fecha)) {
        errorFecha.classList.remove('d-none');
        selectHora.innerHTML = '<option value="">Elegí otra fecha</option>';
        return;
    }
    errorFecha.classList.add('d-none');

    selectHora.innerHTML = '<option value="">Cargando horarios...</option>';

    try {
        const response = await fetch(`${API_URL}/disponibles/${fecha}`);
        const horarios = await response.json();

        if (horarios.length === 0) {
            selectHora.innerHTML = '<option value="">No hay horarios disponibles</option>';
            return;
        }

        selectHora.innerHTML = '<option value="">Elegí un horario</option>';
        horarios.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora.substring(0, 5);
            selectHora.appendChild(option);
        });
    } catch (error) {
        selectHora.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
});

// Enviar el formulario para crear el turno
document.getElementById('formTurno').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombreCliente').value;
    const telefono = document.getElementById('telefono').value;
    const email = document.getElementById('email').value;
    const idServicio = document.getElementById('servicio').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;

    const mensajeExito = document.getElementById('mensajeExito');
    const mensajeError = document.getElementById('mensajeError');
    mensajeExito.classList.add('d-none');
    mensajeError.classList.add('d-none');

    if (esDomingo(fecha)) {
        mensajeError.textContent = 'Los domingos el local está cerrado. Elegí otro día.';
        mensajeError.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, email, idServicio, fecha, hora })
        });

        if (response.ok) {
            const servicioTexto = selectServicio.options[selectServicio.selectedIndex].text;
            const mensajeWhatsapp = encodeURIComponent(
                `Hola! Quería confirmar mi turno en Navaja Club 💈\nNombre: ${nombre}\nServicio: ${servicioTexto}\nFecha: ${fecha}\nHora: ${hora.substring(0, 5)}hs`
            );

            const numeroLocal = '5493535694910';
            const linkWhatsapp = `https://wa.me/${numeroLocal}?text=${mensajeWhatsapp}`;

            mensajeExito.innerHTML = `
                ¡Turno confirmado para el ${fecha} a las ${hora.substring(0, 5)}hs!
                <br>
                <a href="${linkWhatsapp}" target="_blank" class="btn btn-success w-100 mt-2">
                    📲 Confirmar por WhatsApp
                </a>
            `;
            mensajeExito.classList.remove('d-none');
            document.getElementById('formTurno').reset();
            selectHora.innerHTML = '<option value="">Elegí una fecha primero</option>';
        } else {
            const errorTexto = await response.text();
            mensajeError.textContent = errorTexto || 'No se pudo agendar el turno.';
            mensajeError.classList.remove('d-none');
        }
    } catch (error) {
        mensajeError.textContent = 'Error al conectar con el servidor.';
        mensajeError.classList.remove('d-none');
    }
});

// Buscar turno por nombre y fecha (para consultar/cancelar)
async function buscarTurno() {
    const nombre = document.getElementById('buscarNombre').value.trim().toLowerCase();
    const fecha = document.getElementById('buscarFecha').value;
    const resultadoDiv = document.getElementById('resultadoBusqueda');

    if (!nombre || !fecha) {
        resultadoDiv.innerHTML = '<p class="text-danger mt-2">Completá tu nombre y la fecha.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/fecha/${fecha}`);
        const turnos = await response.json();

        const turno = turnos.find(t => t.cliente && t.cliente.nombre.toLowerCase() === nombre);

        if (!turno) {
            resultadoDiv.innerHTML = '<p class="text-muted mt-2">No se encontró ningún turno.</p>';
            return;
        }

        resultadoDiv.innerHTML = `
            <div class="mt-2 p-2 border rounded">
                <p class="mb-1"><strong>Hora:</strong> ${turno.hora.substring(0, 5)}hs</p>
                <p class="mb-2"><strong>Estado:</strong> ${turno.estado}</p>
                ${turno.estado === 'pendiente' ? `<button class="btn btn-sm btn-danger" onclick="cancelarTurno(${turno.idTurno})">Cancelar turno</button>` : ''}
            </div>
        `;
    } catch (error) {
        resultadoDiv.innerHTML = '<p class="text-danger mt-2">Error al buscar el turno.</p>';
    }
}

async function cancelarTurno(id) {
    if (confirm('¿Seguro que querés cancelar tu turno?')) {
        await fetch(`${API_URL}/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'cancelado' })
        });
        buscarTurno();
    }
}