package com.navajaclub.barberia_navaja_club.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Guarda el login del admin en la sesión (esto es para la cookie)
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           SecurityContextRepository securityContextRepository) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .securityContext(ctx -> ctx.securityContextRepository(securityContextRepository))
            .authorizeHttpRequests(auth -> auth
                // Login del admin
                .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()

                // Lo que usa la página pública (clientes)
                .requestMatchers(HttpMethod.GET, "/api/servicios/activos").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/turnos/disponibles/*").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/turnos").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/turnos/buscar").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/turnos/*/cancelar").permitAll()

                // Todo el resto de la API: solo el admin logueado
                .requestMatchers("/api/**").hasRole("ADMIN")

                // Páginas, CSS, JS e imágenes
                .anyRequest().permitAll()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout
                .logoutUrl("/api/admin/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
            );

        return http.build();
    }
}