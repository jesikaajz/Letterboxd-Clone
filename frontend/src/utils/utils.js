// utils/utils.js

// Configuración global
// En utils.js - REEMPLAZA el contenido actual:
export const API_URL = "http://localhost:8000/api"; // Django API
export const TMDB_KEY = "9fcfa50488cf85409f7494574642e9e0";
export const TMDB_URL = "https://api.themoviedb.org/3";

// Funciones de utilidad general
export const Utils = {
  navigate(to) {
    const views = {
      login: "loginView",
      register: "registerView",
      home: "homeView",
      movie: "movieDetailView"
    };

    Object.values(views).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    document.getElementById(views[to]).style.display = "block";
  },

  showModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
      overlay.style.display = "block";
      modal.style.display = "block";
    }
  },

  hideModal(modalId, overlayId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById(overlayId);
    
    if (modal && overlay) {
      overlay.style.display = "none";
      modal.style.display = "none";
    }
  },

  createElement(tag, className, innerHTML, attributes = {}) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
};