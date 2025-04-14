// Инициализация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDB8Vtxg3SjVyHRJ3ZOXT8osnHYrO_uw4A",
    authDomain: "cafe-90de8.firebaseapp.com",
    databaseURL: "https://cafe-90de8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cafe-90de8",
    storageBucket: "cafe-90de8.appspot.com",
    messagingSenderId: "1086414728245",
    appId: "1:1086414728245:web:fbbec8b3adf4eba659957c",
    measurementId: "G-2FVD2KRF16"
};

// Инициализируем Firebase только один раз
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Получаем сервисы Firebase
const auth = firebase.auth();
const db = firebase.database();

// Экспортируем для использования в других модулях
export { db, auth };
