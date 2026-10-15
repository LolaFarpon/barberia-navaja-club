package com.navajaclub.barberia_navaja_club.repository;

import com.navajaclub.barberia_navaja_club.model.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Long> {

    // Devuelve solo los servicios activos (para mostrarlos en el formulario público)
    List<Servicio> findByActivoTrue();
}
