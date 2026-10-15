package com.navajaclub.barberia_navaja_club.repository;

import com.navajaclub.barberia_navaja_club.model.Turno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TurnoRepository extends JpaRepository<Turno, Long> {

    // Turnos de una fecha específica
    List<Turno> findByFecha(LocalDate fecha);

    // Turnos por estado
    List<Turno> findByEstado(String estado);

    // Turnos de una fecha con un estado específico
    List<Turno> findByFechaAndEstado(LocalDate fecha, String estado);

    // Turnos dentro de un rango de fechas (para reportes)
    List<Turno> findByFechaBetween(LocalDate desde, LocalDate hasta);

    // Turnos de un cliente específico (para el historial)
    List<Turno> findByClienteIdClienteOrderByFechaDesc(Long idCliente);
}