package com.navajaclub.barberia_navaja_club.controller;

import com.navajaclub.barberia_navaja_club.model.Cliente;
import com.navajaclub.barberia_navaja_club.model.Servicio;
import com.navajaclub.barberia_navaja_club.model.Turno;
import com.navajaclub.barberia_navaja_club.service.ClienteService;
import com.navajaclub.barberia_navaja_club.service.ServicioService;
import com.navajaclub.barberia_navaja_club.service.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    @Autowired
    private TurnoService turnoService;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private ServicioService servicioService;

    @GetMapping
    public List<Turno> listarTodos() {
        return turnoService.listarTodos();
    }

    @GetMapping("/fecha/{fecha}")
    public List<Turno> listarPorFecha(@PathVariable("fecha") String fecha) {
        return turnoService.listarPorFecha(LocalDate.parse(fecha));
    }

    @GetMapping("/disponibles/{fecha}")
    public List<LocalTime> obtenerDisponibles(@PathVariable("fecha") String fecha) {
        return turnoService.obtenerHorariosDisponibles(LocalDate.parse(fecha));
    }

    // esto lo usa el formulario público del cliente (crea/reutiliza el Cliente automáticamente)
    @PostMapping
    public ResponseEntity<?> crearTurnoPublico(@RequestBody Map<String, String> datos) {
        try {
            Cliente cliente = clienteService.buscarOCrear(
                    datos.get("nombre"), datos.get("telefono"), datos.get("email"));

            Servicio servicio = servicioService.listarActivos().stream()
                    .filter(s -> s.getIdServicio().toString().equals(datos.get("idServicio")))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Servicio no válido."));

            LocalDate fecha = LocalDate.parse(datos.get("fecha"));
            LocalTime hora = LocalTime.parse(datos.get("hora"));

            Turno turno = turnoService.crearTurno(cliente, servicio, fecha, hora);
            return ResponseEntity.ok(turno);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Usado por el admin desde el panel: carga (o reutiliza) el cliente y crea el turno ya confirmado
    @PostMapping("/admin")
    public ResponseEntity<?> crearTurnoAdmin(@RequestBody Map<String, String> datos) {
        try {
            Cliente cliente = clienteService.buscarOCrear(
                    datos.get("nombre"), datos.get("telefono"), datos.get("email"));

            Servicio servicio = servicioService.listarTodos().stream()
                    .filter(s -> s.getIdServicio().toString().equals(datos.get("idServicio")))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Servicio no encontrado."));

            LocalDate fecha = LocalDate.parse(datos.get("fecha"));
            LocalTime hora = LocalTime.parse(datos.get("hora"));

            Turno turno = turnoService.crearTurno(cliente, servicio, fecha, hora);
            turno = turnoService.cambiarEstado(turno.getIdTurno(), "confirmado");

            return ResponseEntity.ok(turno);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // NUEVO - Público: el cliente busca sus turnos con su email
    @PostMapping("/buscar")
    public ResponseEntity<?> buscarTurnoCliente(@RequestBody Map<String, String> datos) {
        try {
            LocalDate fecha = LocalDate.parse(datos.get("fecha"));
            List<Map<String, Object>> resultado = turnoService.buscarPorEmailYFecha(datos.get("email"), fecha)
                    .stream()
                    .map(t -> Map.<String, Object>of(
                            "idTurno", t.getIdTurno(),
                            "hora", t.getHora().toString(),
                            "estado", t.getEstado(),
                            "servicio", t.getServicio().getNombre()))
                    .toList();
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Datos de búsqueda inválidos.");
        }
    }

    // NUEVO - Público: el cliente cancela su turno (el email tiene que coincidir)
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarTurnoCliente(@PathVariable Long id, @RequestBody Map<String, String> datos) {
        try {
            turnoService.cancelarPorCliente(id, datos.get("email"));
            return ResponseEntity.ok(Map.of("mensaje", "Turno cancelado"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // (Solo admin) Cambia el estado de un turno (pendiente, confirmado, cancelado, finalizado)
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> datos) {
        try {
            Turno turno = turnoService.cambiarEstado(id, datos.get("estado"));
            return ResponseEntity.ok(turno);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}