// main.js
import { Utils } from './utils/utils.js';
import { 
  setupGlobalEventListeners, 
  handleLogin, 
  handleRegister, 
  loadHome,
  handlePageChange 
} from './controller/controller.js';

document.addEventListener("DOMContentLoaded", () => {
  console.log("Letterboxd Clone - Inicializando...");
  
  setupGlobalEventListeners();
  
  document.getElementById("loginBtn").onclick = handleLogin;
  document.getElementById("registerBtn").onclick = handleRegister;
  
  document.getElementById("goToRegisterBtn").onclick = () => {
    Utils.navigate("register");
  };
  
  document.getElementById("goToLoginBtn").onclick = () => {
    Utils.navigate("login");
  };
  
  window.handlePageChange = handlePageChange;
  
  Utils.navigate("login");
});