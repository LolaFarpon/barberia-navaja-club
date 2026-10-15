package com.navajaclub.barberia_navaja_club.repository;

import com.navajaclub.barberia_navaja_club.model.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministradorRepository extends JpaRepository<Administrador, Long> {

    // Busca al administrador por email (lo vamos a usar para el login)
    Optional<Administrador> findByEmail(String email);
}