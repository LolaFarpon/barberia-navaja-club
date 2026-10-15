package com.navajaclub.barberia_navaja_club.controller;

import com.navajaclub.barberia_navaja_club.model.Servicio;
import com.navajaclub.barberia_navaja_club.service.ServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    @Autowired
    private ServicioService servicioService;

    // Todos los servicios (para la tabla del admin)
    @GetMapping
    public List<Servicio> listarTodos() {
        return servicioService.listarTodos();
    }

    // Solo los activos (para el formulario público del cliente)
    @GetMapping("/activos")
    public List<Servicio> listarActivos() {
        return servicioService.listarActivos();
    }

    @PostMapping
    public ResponseEntity<?> crearServicio(@RequestBody Servicio servicio) {
        Servicio creado = servicioService.crearServicio(servicio);
        return ResponseEntity.ok(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarServicio(@PathVariable Long id, @RequestBody Servicio servicio) {
        try {
            Servicio actualizado = servicioService.actualizarServicio(id, servicio);
            return ResponseEntity.ok(actualizado);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}