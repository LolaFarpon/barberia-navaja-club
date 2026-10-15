package com.navajaclub.barberia_navaja_club.service;

import com.navajaclub.barberia_navaja_club.model.Cliente;
import com.navajaclub.barberia_navaja_club.model.Servicio;
import com.navajaclub.barberia_navaja_club.model.Turno;
import com.navajaclub.barberia_navaja_club.repository.TurnoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TurnoService {

    @Autowired
    private TurnoRepository turnoRepository;

    private static final LocalTime HORA_INICIO = LocalTime.of(9, 0);
    private static final LocalTime HORA_FIN = LocalTime.of(19, 0);
    private static final int DURACION_TURNO_MINUTOS = 30;

    public List<Turno> listarTodos() {
        return turnoRepository.findAll();
    }

    public List<Turno> listarPorFecha(LocalDate fecha) {
        return turnoRepository.findByFecha(fecha);
    }

    public List<Turno> listarPorRango(LocalDate desde, LocalDate hasta) {
        return turnoRepository.findByFechaBetween(desde, hasta);
    }

    public List<Turno> listarPorCliente(Long idCliente) {
        return turnoRepository.findByClienteIdClienteOrderByFechaDesc(idCliente);
    }

    public List<LocalTime> obtenerHorariosDisponibles(LocalDate fecha) {
        List<LocalTime> horariosPosibles = new ArrayList<>();
        LocalTime horaActual = HORA_INICIO;

        while (horaActual.isBefore(HORA_FIN)) {
            horariosPosibles.add(horaActual);
            horaActual = horaActual.plusMinutes(DURACION_TURNO_MINUTOS);
        }

        List<Turno> turnosDelDia = turnoRepository.findByFecha(fecha);
        List<LocalTime> horasOcupadas = turnosDelDia.stream()
                .filter(t -> !t.getEstado().equals("cancelado"))
                .map(Turno::getHora)
                .toList();

        horariosPosibles.removeAll(horasOcupadas);
        return horariosPosibles;
    }

    public Turno crearTurno(Cliente cliente, Servicio servicio, LocalDate fecha, LocalTime hora) {
        // Los domingos el local está cerrado
        if (fecha.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new IllegalStateException("Los domingos el local está cerrado.");
        }

        // No se pueden sacar turnos en fechas que ya pasaron
        if (fecha.isBefore(LocalDate.now())) {
            throw new IllegalStateException("No se puede reservar un turno en una fecha pasada.");
        }

        List<LocalTime> disponibles = obtenerHorariosDisponibles(fecha);

        if (!disponibles.contains(hora)) {
            throw new IllegalStateException("El horario seleccionado ya no está disponible.");
        }

        Turno turno = new Turno();
        turno.setCliente(cliente);
        turno.setServicio(servicio);
        turno.setFecha(fecha);
        turno.setHora(hora);
        turno.setEstado("pendiente");

        return turnoRepository.save(turno);
    }

    public Turno cambiarEstado(Long idTurno, String nuevoEstado) {
        Turno turno = turnoRepository.findById(idTurno)
                .orElseThrow(() -> new IllegalStateException("Turno no encontrado."));

        turno.setEstado(nuevoEstado);
        return turnoRepository.save(turno);
    }

    // Turnos de un cliente en una fecha, buscando por su email
    public List<Turno> buscarPorEmailYFecha(String email, LocalDate fecha) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        String emailBuscado = email.trim();
        return turnoRepository.findByFecha(fecha).stream()
                .filter(t -> t.getCliente().getEmail() != null
                        && t.getCliente().getEmail().equalsIgnoreCase(emailBuscado))
                .toList();
    }

    // Cancelación hecha por el propio cliente
    public Turno cancelarPorCliente(Long idTurno, String email) {
        Turno turno = turnoRepository.findById(idTurno)
                .orElseThrow(() -> new IllegalStateException("Turno no encontrado."));

        String emailTurno = turno.getCliente().getEmail();
        if (email == null || emailTurno == null || !emailTurno.equalsIgnoreCase(email.trim())) {
            throw new IllegalStateException("Turno no encontrado.");
        }
        if (!turno.getEstado().equals("pendiente")) {
            throw new IllegalStateException("Solo se pueden cancelar turnos pendientes.");
        }

        turno.setEstado("cancelado");
        return turnoRepository.save(turno);
    }

    // Métricas para el dashboard (sección Inicio)
    public long contarPorEstadoYFecha(LocalDate fecha, String estado) {
        return turnoRepository.findByFechaAndEstado(fecha, estado).size();
    }

    public double calcularIngresosDelDia(LocalDate fecha) {
        return turnoRepository.findByFecha(fecha).stream()
                .filter(t -> t.getEstado().equals("finalizado"))
                .mapToDouble(t -> t.getServicio().getPrecio().doubleValue())
                .sum();
    }

    // Reporte: cantidad de turnos por servicio, dentro de un rango de fechas
    public Map<String, Long> contarTurnosPorServicio(LocalDate desde, LocalDate hasta) {
        List<Turno> turnos = turnoRepository.findByFechaBetween(desde, hasta);

        return turnos.stream()
                .filter(t -> t.getEstado().equals("finalizado"))
                .collect(Collectors.groupingBy(
                        t -> t.getServicio().getNombre(),
                        Collectors.counting()
                ));
    }

    // Reporte: ingresos totales dentro de un rango de fechas
    public double calcularIngresosPorRango(LocalDate desde, LocalDate hasta) {
        return turnoRepository.findByFechaBetween(desde, hasta).stream()
                .filter(t -> t.getEstado().equals("finalizado"))
                .mapToDouble(t -> t.getServicio().getPrecio().doubleValue())
                .sum();
    }
}