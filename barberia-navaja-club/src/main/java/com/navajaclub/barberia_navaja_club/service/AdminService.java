package com.navajaclub.barberia_navaja_club.service;

import com.navajaclub.barberia_navaja_club.model.Administrador;
import com.navajaclub.barberia_navaja_club.repository.AdministradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AdminService {

    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Valida las credenciales del administrador al hacer login
    public boolean validarCredenciales(String email, String passwordIngresada) {
        Optional<Administrador> adminOpt = administradorRepository.findByEmail(email);

        if (adminOpt.isEmpty()) {
            return false;
        }

        Administrador admin = adminOpt.get();
        return passwordEncoder.matches(passwordIngresada, admin.getPassword());
    }

    // Crea el administrador inicial
    public Administrador crearAdministrador(String email, String passwordSinEncriptar) {
        Administrador admin = new Administrador();
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(passwordSinEncriptar));
        return administradorRepository.save(admin);
    }

    // Actualiza la contraseña de un admin existente (por email)
    public Administrador cambiarPassword(String email, String passwordNueva) {
        Administrador admin = administradorRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Administrador no encontrado."));

        admin.setPassword(passwordEncoder.encode(passwordNueva));
        return administradorRepository.save(admin);
    }
}