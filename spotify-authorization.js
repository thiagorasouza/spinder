import * as APIConfig from './api-config.js';
import axios from 'axios';
import qs from 'qs';

export default class SpotifyAuthorization {
  constructor(request, response) {
    this._request = request;
    this._response = response;
    this._token = null;
    this._state = null;
    this._stateKey = 'spotify_auth_state';
    this._tokenKey = 'spotify_auth_token';
    this._redirectURI = APIConfig.REDIRECT_URI;
    this._scopes = 'user-read-private user-read-email';
  }

  requestSpotifyAccess() {
    this._generateRandomState();
    this._createStateCookie();
    let authorizationURL = this._makeAuthorizationURL();
    this._response.redirect(authorizationURL);
  }

  _generateRandomState() {
    let state_length = 16;
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    let state = '';
    for (let i = 0; i < state_length; i++) {
      state += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    
    this._state = state;
  }  
  
  _makeAuthorizationURL() {
    return 'https://accounts.spotify.com/authorize' +
            '?response_type=code' +
            '&client_id=' + APIConfig.CLIENT_ID + 
            '&scope=' + encodeURIComponent(this._scopes) +
            '&redirect_uri=' + encodeURIComponent(this._redirectURI) +
            '&state=' + this._state;
  }

  async requestAndSaveToken() {
    if (!this._statesMatch())
      throw new Error('Authentication states mismatch.');
    
    this._clearStateCookie();

    this._token = await this._requestToken();
    this._createTokenCookie();
  }
  
  _statesMatch() {    
    let storedState = this._getStateCookie();
    let receivedState = this._getAuthState();
    
    return storedState && receivedState && storedState === receivedState;
  }

  async _requestToken() {
    let url = 'https://accounts.spotify.com/api/token';
    const data = {
      grant_type: 'authorization_code',
      code: this._getAuthCode(),
      redirect_uri: this._redirectURI
    };
    const options = {
      headers: {
        'Authorization': `Basic ${this._getEncodedSecret()}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: status => status === 200
    };

    try {
      let response = await axios.post(url, qs.stringify(data), options);
      return response.data;
    } catch (error) {
      throw new Error('Token request failed.');
    }
  }

  isAuthorized() {
    return this._getTokenCookie() ? true : false;    
  }

  removeToken() {
    this._clearTokenCookie();
  }

  _getEncodedSecret() {
    let buffer = Buffer.from(APIConfig.CLIENT_ID + ':' + APIConfig.CLIENT_SECRET);
    return buffer.toString('base64');
  }  

  _getAuthCode() {
    return this._request.query?.code;
  }

  _getAuthState() {
    return this._request.query?.state;
  }

  _createStateCookie() {
    this._response.cookie(this._stateKey, this._state);
  }

  _getStateCookie() {
    return this._request.cookies?.[this._stateKey];
  }

  _clearTokenCookie() {
    this._response.clearCookie(this._tokenKey);
  }

  _createTokenCookie() {
    let data = {
      access_token: this._token?.access_token,
      refresh_token: this._token?.refresh_token,
      expiration: Date.now() + (this._token?.expires_in * 1000)
    }
    this._response.cookie(this._tokenKey, qs.stringify(data));
  }

  _getTokenCookie() {
    return this._request.cookies?.[this._tokenKey];
  }

  _clearStateCookie() {
    this._response.clearCookie(this._stateKey);
  }
}