document.getElementById('formLogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensajeError');

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            // Login exitoso: el servidor ya guardó la sesión en una cookie
            window.location.href = 'admin-panel.html';
        } else {
            mensajeError.textContent = 'Email o contraseña incorrectos.';
            mensajeError.classList.remove('d-none');
        }
    } catch (error) {
        mensajeError.textContent = 'Error al conectar con el servidor.';
        mensajeError.classList.remove('d-none');
    }
});