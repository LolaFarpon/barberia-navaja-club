package com.navajaclub.barberia_navaja_club.controller;

import com.navajaclub.barberia_navaja_club.service.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private TurnoService turnoService;

    // GET /api/reportes?periodo=mes | 6meses | 12meses
    @GetMapping
    public Map<String, Object> obtenerReporte(@RequestParam String periodo) {
        LocalDate hoy = LocalDate.now();
        LocalDate desde;

        switch (periodo) {
            case "6meses" -> desde = hoy.minusMonths(6);
            case "12meses" -> desde = hoy.minusMonths(12);
            default -> desde = hoy.withDayOfMonth(1); // "mes" = desde el día 1 del mes actual
        }

        List<com.navajaclub.barberia_navaja_club.model.Turno> turnosDelPeriodo =
                turnoService.listarPorRango(desde, hoy);

        long realizados = turnosDelPeriodo.stream()
                .filter(t -> t.getEstado().equals("finalizado"))
                .count();

        long cancelados = turnosDelPeriodo.stream()
                .filter(t -> t.getEstado().equals("cancelado"))
                .count();

        double ingresos = turnoService.calcularIngresosPorRango(desde, hoy);

        Map<String, Long> porServicio = turnoService.contarTurnosPorServicio(desde, hoy);

        return Map.of(
                "turnosRealizados", realizados,
                "turnosCancelados", cancelados,
                "ingresos", ingresos,
                "porServicio", porServicio
        );
    }
}