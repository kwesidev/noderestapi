let refreshTokenInterval = null;
function login() {
    let username, password;
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;
    apiRequest({
        path: 'http://localhost:3000/auth/login/',
        method: 'POST',
        data: { username: username, password: password },
        onSuccess: function (response) {
            if (response.success) {
                window.localStorage.setItem('token', response.token);
                window.localStorage.setItem('refreshToken', response.refreshToken);
                refreshTokenInterval = setInterval(refreshToken, 1200000);
                init();
            }
        },
        onFailure: function (resultCode, resultText) {
            let result = JSON.parse(resultText);
            document.getElementById('errorMessage').innerHTML = result.error || result.errorMessage;
        }
    });
}
function logout() {
    apiRequest({
        path: 'http://localhost:3000/auth/logout',
        method: 'POST',
        data: { refreshToken: window.localStorage.getItem('refreshToken') },
        onSuccess: function (response) {
            if (response.success) {
                window.localStorage.clear();
                window.location.reload();
                clearInterval(refreshTokenInterval);
            }
        },
        onFailure: function(response){
            window.localStorage.clear();
            window.location.reload();
            clearInterval(refreshTokenInterval);
        }
    });
}

function refreshToken() {
    apiRequest({
        path: 'http://localhost:3000/auth/refreshToken',
        method: 'POST',
        data: { refreshToken: window.localStorage.getItem('refreshToken') },
        onSuccess: function (response) {
            if (response.success) {
                window.localStorage.clear();
                window.localStorage.setItem('token',response.token);
                window.localStorage.setItem('refreshToken',response.refreshToken);
            }
        },
        onFailure: function(response) {
            logout();
        }
    });
}
function apiRequest(request) {
    let bodyRequest, xhr, method, path, token;
    xhr = new XMLHttpRequest();
    if (request.hasOwnProperty('method')) {
        method = request.method;
    }
    else {
        method = 'GET';
    }
    if (request.hasOwnProperty('path')) {
        path = request.path;

    }
    if (path == null || '') {
        throw Error('Path is required');
    }
    xhr.open(method, path, true);
    token = window.localStorage.getItem('token');
    if (token) {
        xhr.setRequestHeader("token", token);
    }
    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => { // Call a function when the state changes.
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            let response = JSON.parse(xhr.responseText);
            if (request.hasOwnProperty('onSuccess')) {
                request.onSuccess(response);
            }
        }
        else if (xhr.readyState == XMLHttpRequest.DONE && xhr.status !== 200) {
            if (request.hasOwnProperty('onFailure') && request.onFailure !== null) {
                request.onFailure(xhr.status, xhr.responseText);
            }
        }
    }
    // xhr.setRequestHeader("Content-type", "application/json");
    if (request.hasOwnProperty('data')) {
        bodyRequest = JSON.stringify(request.data);
    }
    xhr.send(bodyRequest);
}

function init(){
    apiRequest({
        path: 'http://localhost:3000/users/',
        method: 'GET',
        onSuccess: function (response) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('welcomePage').style.display = 'block';
            document.getElementById('welcomeMessage').innerHTML = '<h1>' + response.message + '</h1>';
        }
    });
}