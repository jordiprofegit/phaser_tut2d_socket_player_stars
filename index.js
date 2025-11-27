const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

var players = [];
var stars = []; // 👈 Array per a estrelles compartides

// Inicialitza les estrelles (mateixes posicions que el client)
function initializeStars() {
    stars = [];
    for (let i = 0; i < 12; i++) {
        stars.push({
            id: i,
            x: 12 + i * 70,
            y: 0,
            active: true
        });
    }
}

initializeStars(); // Crea estrelles inicials

// Configuración Express
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});

io.on('connection', (socket) => {
    players.push({
      posx: 100, 
      posy: 450, 
      id: socket.id,
      velocityX: 0 
      });

    // Envia l'estat actual de les estrelles al nou client
    socket.emit('starsUpdate', stars);

    // Envia l'estat actual dels jugadors al nou client
    socket.on('updatePlayers', (data) => {
        for (player of players) {
            if (player.id === socket.id) {  
                player.posx = data.posx;
                player.posy = data.posy;
                player.velocityX = data.velocityX || 0;
            }
        }
        io.emit('updatePlayers', players);
    });

    // quan un jugador recull una estrella
    socket.on('collectStar', (starId) => {
        const star = stars.find(s => s.id === starId);
        if (star && star.active) {
            star.active = false; // Marca l'estrella com a recollida
            io.emit('starsUpdate', stars); // Notifica a TOTS els clients
            
            // Si no queden estrelles actives, reinicia
            if (stars.filter(s => s.active).length === 0) {
                setTimeout(() => {
                    initializeStars();
                    io.emit('starsUpdate', stars);
                }, 1000);
            }
        }
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('updatePlayers', players); // Notifica a tots
    });
});