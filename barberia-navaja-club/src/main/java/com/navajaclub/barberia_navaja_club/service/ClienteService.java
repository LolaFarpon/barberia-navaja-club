package com.navajaclub.barberia_navaja_club.service;

import com.navajaclub.barberia_navaja_club.model.Cliente;
import com.navajaclub.barberia_navaja_club.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    // Busca un cliente por email, o lo crea si no existe (usado al agendar turno desde la web)
    public Cliente buscarOCrear(String nombre, String telefono, String email) {
        Optional<Cliente> existente = clienteRepository.findByEmail(email);

        if (existente.isPresent()) {
            return existente.get();
        }

        Cliente nuevo = new Cliente();
        nuevo.setNombre(nombre);
        nuevo.setTelefono(telefono);
        nuevo.setEmail(email);
        return clienteRepository.save(nuevo);
    }

    // Crea un cliente manualmente (usado por el admin desde el panel)
    public Cliente crearCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }
}