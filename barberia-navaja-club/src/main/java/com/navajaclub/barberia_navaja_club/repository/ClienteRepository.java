package com.navajaclub.barberia_navaja_club.repository;

import com.navajaclub.barberia_navaja_club.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Busca un cliente por email (para no duplicarlo si ya existe)
    Optional<Cliente> findByEmail(String email);
}