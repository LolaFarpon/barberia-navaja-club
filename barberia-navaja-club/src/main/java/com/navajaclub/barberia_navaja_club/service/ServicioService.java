package com.navajaclub.barberia_navaja_club.service;

import com.navajaclub.barberia_navaja_club.model.Servicio;
import com.navajaclub.barberia_navaja_club.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioService {

    @Autowired
    private ServicioRepository servicioRepository;

    public List<Servicio> listarTodos() {
        return servicioRepository.findAll();
    }

    public List<Servicio> listarActivos() {
        return servicioRepository.findByActivoTrue();
    }

    public Servicio crearServicio(Servicio servicio) {
        return servicioRepository.save(servicio);
    }

    public Servicio actualizarServicio(Long id, Servicio datosNuevos) {
        Servicio servicio = servicioRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Servicio no encontrado."));

        servicio.setNombre(datosNuevos.getNombre());
        servicio.setDescripcion(datosNuevos.getDescripcion());
        servicio.setPrecio(datosNuevos.getPrecio());
        servicio.setActivo(datosNuevos.isActivo());

        return servicioRepository.save(servicio);
    }
}