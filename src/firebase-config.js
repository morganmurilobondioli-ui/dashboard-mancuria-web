(() => {
  window.MANCURIA_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBtRTeIXyY6XAXTFa-t2OGIQfSrUBcZifI",
    authDomain: "mancuria-automotriz.firebaseapp.com",
    projectId: "mancuria-automotriz",
    storageBucket: "mancuria-automotriz.firebasestorage.app",
    messagingSenderId: "24914455876",
    appId: "1:24914455876:web:2e5d2114f34edc04d23b11",
    measurementId: "G-06P5TTSMBY",
  };

  window.MANCURIA_FIREBASE_OPTIONS = {
    ordersLimit: 250,
    collectionNames: {
      clientes: "clientes",
      ordenes: "ordenes_trabajo",
      servicios: "servicios",
      usuarios: "usuarios",
      users: "users",
      consultasPortal: "consultas_portal",
    },
  };
})();
