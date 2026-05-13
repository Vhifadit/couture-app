//importation du package http de node 
//on a ainsi acces a l'objet http nous 
//permettant de creer un serveur 
const http = require('http')
const app = require('./app');
const seedRoles = require('./utils/seedRole');
const seedAdmin = require('./utils/seedAdmin');
const { processReminders } = require('./controllers/notification');


//SUR LE PORT ou l'appli express doit tourner 
const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};


/*c'est la fonction qui sera appelle 
a chaque foisque le serveur recois une requette 
res=requette et res=reponse  */
const server = http.createServer(app)
server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
  
  // Initialiser les rôles après que le serveur écoute
  seedRoles()
    .then(() => seedAdmin({ fromServer: true }))
    .then(() => console.log('✅ Setup complet: rôles + admin'))
    .catch(err => console.error('❌ Erreur setup:', err));

  processReminders().catch(err => console.error('Erreur rappels:', err.message));
  setInterval(() => {
    processReminders().catch(err => console.error('Erreur rappels:', err.message));
  }, 60 * 60 * 1000);
});
//pour permettre au serveur d'ecouter les requettes 
server.listen(port)

