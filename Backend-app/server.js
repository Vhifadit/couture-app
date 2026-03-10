//importation du package http de node 
//on a ainsi acces a l'objet http nous 
//permettant de creer un serveur 
const http = require('http')
const mongoose = require('mongoose');
const app = require('./app');
const seedRoles = require('./utils/seedRole');

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
const port = normalizePort(process.env.PORT ||'3000');
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
    .then(() => console.log('Rôles initialisés avec succès'))
    .catch(err => console.error('Erreur lors de l\'initialisation des rôles:', err));
});
//pour permettre au serveur d'ecouter les requettes 
server.listen(port)

