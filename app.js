import express from 'express';
import cookieParser from 'cookie-parser';
import * as Helpers from './helpers.js';
import SpotifyAuthorization from './spotify-authorization.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.static('public'))

app.use('/*', function(request, response, next) {
  const auth = new SpotifyAuthorization(request, response);
  response.locals.auth = auth;

  let authorized = auth.isAuthorized();
  let basePath = request.baseUrl.split('/')[1];

  if (authorized && basePath === 'login') {
    response.redirect('/home');    
  } else if (!authorized && basePath === 'home') {
    response.redirect('/login');
  } else {
    next();
  }
});

app.get('/', (request, response) => {
  response.redirect('/home');
});

app.get('/login', (request, response) => {
  let loginPage = Helpers.getPublicFilePath('login.html');
  response.sendFile(loginPage);
});

app.get('/login/redirect/to-spotify', (request, response) => {
  const auth = response.locals.auth;
  auth.requestSpotifyAccess();
});

app.get('/login/redirect/from-spotify', (request, response) => {
  const auth = response.locals.auth;
  auth.requestAndSaveToken().then(() =>
    response.redirect('/home')
  );
});

app.get('/home', (request, response) => {
  let homePage = Helpers.getPublicFilePath('home.html');
  response.sendFile(homePage);
});

app.get('/logout', (request, response) => {
  const auth = response.locals.auth;
  auth.removeToken();
  response.redirect('/login')
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`)
});
