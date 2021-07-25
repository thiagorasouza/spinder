
const cover = document.querySelector('.cover');
const btnSkip = document.querySelector('.btn-skip');
btnSkip.addEventListener('click', displayNextAlbum);

let authCookie = getAuthCookieObject();
let accessToken = authCookie.get('access_token');
let refreshToken = authCookie.get('refresh_token');
let expiration = Number(authCookie.get('expiration'));

const GENRE = 'pop';
let albums = [];

loadAlbums();

async function loadAlbums() {  
  if (expiration > Date.now()) {
    albums = await getAlbumsForGenre(GENRE);
    displayNextAlbum();
  } else {
    throw new Error('Authentication token expired');
    // todo: auto refresh token
  }
}

async function displayNextAlbum() {
  let nextAlbum = albums.shift();
  if (nextAlbum) {
    displayAlbum(nextAlbum);
  } else {
    await loadAlbums();
    displayNextAlbum();
  }
}

function displayAlbum(album) {
  cover.dataset.id = album.id;
  cover.style.backgroundImage = `url('${album.coverURL}')`;
}

async function getAlbumsForGenre(genre) {
  let tracks = await getTrackRecommendationsForGenre(genre);
  let albums = tracks.map(({album}) => {
    return {
      id: album.id,
      coverURL: album.images[0].url
    }
  });
  return albums;
}

async function getTrackRecommendationsForGenre(genre) {
  let url = 'https://api.spotify.com/v1/recommendations?seed_genres=' + genre;
  let options = { headers: { 'Authorization': `Bearer ${accessToken}` } };

  try {
    let response = await fetch(url, options);
    let json = await response.json();
    return json.tracks;
  } catch(error) {
    throw new Error('Failed to get recommendations.');
  }  
}


function getAuthCookieObject() {
  let rawValue = getCookieValue('spotify_auth_token');
  let decodedValue = decodeURIComponent(rawValue);
  return new URLSearchParams(decodedValue);
}

function getCookieValue(name) {
  return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
}