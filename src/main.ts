

const params = new URLSearchParams(window.location.search);
const redirect = params.get('redirect');
if (redirect) {
  // Haz que tu router navegue a la ruta indicada
  window.history.replaceState({}, '', redirect);
  // Ahora inicializa tu SPA normalmente
}

window.addEventListener('DOMContentLoaded', () => {
  // Crear el contenedor del juego si no existe
  let gameDiv = document.getElementById('game');
  if (!gameDiv) {
    gameDiv = document.createElement('div');
    gameDiv.id = 'game';
    document.body.appendChild(gameDiv);
  }

  // Este archivo no debe contener lógica del juego ni inicialización de PixiJS.
  // El punto de entrada de la app es src/main.tsx, que carga React y el router.

  // Puedes eliminar este archivo si no lo usas, o dejarlo vacío como referencia.
});
