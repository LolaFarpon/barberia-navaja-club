package com.navajaclub.barberia_navaja_club.controller;

import com.navajaclub.barberia_navaja_club.model.Cliente;
import com.navajaclub.barberia_navaja_club.service.ClienteService;
import com.navajaclub.barberia_navaja_club.service.TurnoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private TurnoService turnoService;

    @GetMapping
    public List<Cliente> listarTodos() {
        return clienteService.listarTodos();
    }

    @PostMapping
    public ResponseEntity<?> crearCliente(@RequestBody Cliente cliente) {
        Cliente creado = clienteService.crearCliente(cliente);
        return ResponseEntity.ok(creado);
    }

    // Historial de turnos de un cliente puntual
    @GetMapping("/{id}/turnos")
    public ResponseEntity<?> historialTurnos(@PathVariable Long id) {
        return ResponseEntity.ok(turnoService.listarPorCliente(id));
    }
}