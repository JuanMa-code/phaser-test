# 🎮 Arcade GO GO

Una colección completa de juegos clásicos recreados con tecnologías modernas. Este proyecto incluye 19 juegos populares desarrollados con React, TypeScript, PIXI.js y Phaser.

## 🚀 Demo en Vivo

**¡Prueba todos los juegos ahora mismo!**  
👉 **[https://juanma-code.github.io/phaser-test/](https://juanma-code.github.io/phaser-test/)**

## 🎯 Juegos Disponibles

### 🕹️ Arcade Clásicos
- **🐍 Snake** - El clásico juego de la serpiente con mecánicas modernas
- **🏓 Pong** - El primer videojuego de la historia, modernizado
- **🏒 Air Hockey** - Hockey de aire con física realista y bot inteligente
- **🐸 Frogger** - Cruza la carretera evitando obstáculos
- **🦕 Dino** - El famoso juego offline de Chrome
- **🐦 Flappy Bird** - Vuela entre las tuberías sin chocar
- **👾 Space Invaders** - Defiende la Tierra de la invasión alienígena
- **🧱 Arkanoid** - Rompe todos los bloques con tu pelota
- **☄️ Asteroids** - Navega y destruye asteroides en el espacio

### 🧩 Puzzles y Estrategia
- **🧠 Tetris** - El puzzle de bloques más famoso del mundo
- **💣 Minesweeper** - Encuentra todas las minas sin explotar
- **🧩 Unblock Me** - Mueve los bloques para liberar el rojo
- **🧩 Sudoku** - Generación de tableros con solución única y 4 niveles de dificultad (Fácil, Medio, Difícil, Experto)
- **🏰 Tower Defense** - Defiende tu base con torres estratégicas

### 🎪 Juegos de Diversión
- **🦘 Doodle Jump** - Salta de plataforma en plataforma hacia arriba
- **🔨 Whac-A-Mole** - Golpea los topos que salen de los agujeros
- **⚽ Football** - Simulador de fútbol con IA inteligente y dos tiempos
- **🎯 Brotato** - Supervivencia tipo roguelike con mecánicas RPG

## 🚀 Estructura del Proyecto

```
phaser-test/
├── src/
│   ├── main.tsx         # Punto de entrada principal
│   ├── App.tsx          # Componente principal con menú
│   ├── assets/          # Recursos del juego (imágenes, sonidos)
│   ├── AirHockey.tsx    # Hockey de aire con bot inteligente
│   ├── Arkanoid.tsx     # Juego de romper bloques
│   ├── Asteroids.tsx    # Juego de asteroides espaciales
│   ├── Brotato.tsx      # Juego de supervivencia roguelike
│   ├── Dino.tsx         # Juego del dinosaurio de Chrome
│   ├── DoodleJump.tsx   # Juego de saltos en plataformas
│   ├── Flappy.tsx       # Clon de Flappy Bird
│   ├── Football.tsx     # Simulador de fútbol con IA
│   ├── Frogger.tsx      # Juego de cruzar la carretera
│   ├── Minesweeper.tsx  # Buscaminas clásico
│   ├── Pong.tsx         # Tenis de mesa retro
│   ├── Snake.tsx        # Serpiente clásica
│   ├── SpaceInvaders.tsx # Invasores del espacio
│   ├── Sudoku.tsx       # Sudoku con generador y 4 dificultades
│   ├── Tetris.tsx       # Puzzle de bloques
│   ├── TowerDefense.tsx # Defensa de torres
│   ├── UnblockMe.tsx    # Puzzle de bloques deslizantes
│   └── WhacAMole.tsx    # Golpea el topo
├── package.json         # Configuración de npm
├── tsconfig.json        # Configuración de TypeScript
├── vite.config.ts       # Configuración de Vite
└── README.md           # Documentación del proyecto
```

## 🛠️ Tecnologías Utilizadas

- **React 19.1.0** - Framework de interfaz de usuario
- **TypeScript** - Tipado estático para JavaScript
- **PIXI.js 7.4.3** - Motor de renderizado 2D de alto rendimiento
- **Phaser 3.90.0** - Framework de desarrollo de juegos HTML5
- **Vite** - Herramienta de construcción y desarrollo
- **React Router** - Navegación entre juegos

## 📦 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/JuanMa-code/phaser-test.git
   cd phaser-test
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   ```

5. **Previsualizar build de producción:**
   ```bash
   npm run preview
   ```

6. **Desplegar a GitHub Pages:**
   ```bash
   npm run deploy
   ```
   
   **⚠️ Requisitos previos para el despliegue:**
   - Tener una cuenta de GitHub y permisos de escritura en el repositorio
   - Haber configurado GitHub Pages en el repositorio (Settings → Pages → Source: "Deploy from a branch" → Branch: "gh-pages")
   - Tener Git configurado localmente con credenciales válidas
   - El comando creará automáticamente la rama `gh-pages` si no existe
   
   **📝 Nota:** El primer despliegue puede tardar unos minutos en estar disponible en la URL de GitHub Pages.

## 🌐 Configuración de GitHub Pages

Para habilitar GitHub Pages en tu fork del repositorio:

1. **Ve a la configuración del repositorio:**
   - Navega a tu repositorio en GitHub
   - Haz clic en "Settings" (Configuración)

2. **Configura GitHub Pages:**
   - Desplázate hasta la sección "Pages" en el menú lateral
   - En "Source" selecciona "Deploy from a branch"
   - En "Branch" selecciona "gh-pages" y carpeta "/ (root)"
   - Haz clic en "Save"

3. **Ejecuta el despliegue:**
   ```bash
   npm run deploy
   ```

4. **Accede a tu sitio:**
   - Tu sitio estará disponible en: `https://[tu-usuario].github.io/phaser-test/`
   - La URL aparecerá en la sección Pages de la configuración

## 🎨 Características Destacadas

### 🖼️ Interfaz Moderna
- **Diseño Glassmorphism** - Efectos de cristal con blur y transparencias
- **Responsive Design** - Adaptable a diferentes tamaños de pantalla
- **Animaciones Suaves** - Transiciones y efectos visuales profesionales
- **Tema Consistente** - Colores y estilos unificados por juego

### 🎮 Mecánicas Avanzadas
- **Sistema de Puntuaciones** - Récords locales guardados automáticamente
- **Múltiples Niveles** - Dificultad progresiva en varios juegos
- **Controles Intuitivos** - Mouse, teclado y touch compatibles
- **Estados de Juego** - Menús, instrucciones, pausa y game over

### 🏆 Juegos Destacados

#### 🧩 Sudoku (Nuevo)
- Generación de tableros con solución única
- 4 niveles de dificultad: Fácil, Medio, Difícil, Experto
- Teclado y keypad táctil, detección de conflictos y temporizador
- Resolver/Reiniciar en un clic y pantalla de victoria

#### ⚽ Football (Complejo)
- Simulador de fútbol completo con dos tiempos de juego
- Sistema de IA inteligente con comportamientos tácticos por posición
- Cambio de campo automático en el medio tiempo
- 6 jugadores por equipo con roles específicos (Portero, Defensa, Medio, Delantero)
- Física realista de pelota con fricción y rebotes
- Controles intuitivos para mover al jugador seleccionado

#### 🎯 Brotato (Más Complejo)
- Sistema de salud y escudo del jugador
- 4 tipos diferentes de enemigos
- Mecánicas de disparo múltiple y críticos
- Interfaz separada del área de juego
- Sistema de partículas avanzado

#### 🏰 Tower Defense
- Colocación estratégica de torres
- Diferentes tipos de enemigos con rutas
- Sistema de recursos y upgrade
- Múltiples oleadas progresivas

## 🎯 Cómo Jugar

Cada juego incluye una pantalla de instrucciones detallada con:
- **Objetivo del juego**
- **Controles específicos**
- **Estrategias y consejos**
- **Sistema de puntuación**

Simplemente selecciona un juego del menú principal y disfruta de la experiencia arcade completa.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Puedes:
- Reportar bugs
- Sugerir nuevas características
- Añadir nuevos juegos
- Mejorar la documentación

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

*Desarrollado con ❤️ para recrear la experiencia arcade clásica con tecnologías modernas.*