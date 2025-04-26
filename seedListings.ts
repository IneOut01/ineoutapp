import { getFirestore, collection, addDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";

// 🔐 Configurazione Firebase corretta:
const firebaseConfig = {
  apiKey: "AIzaSyCYq0Po9hUcDkUGgqmKdj-NQtzZNLgJlJk",
  authDomain: "ineout-b7ce8.firebaseapp.com",
  projectId: "ineout-b7ce8",
  storageBucket: "ineout-b7ce8.firebasestorage.app",
  messagingSenderId: "716279621708",
  appId: "1:716279621708:web:807f1c314c807d9b3bace9",
  measurementId: "G-2C0R5V0M0M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listings = [
  // 🇮🇹 CITTÀ ITALIANE
  {
    city: "Roma",
    address: "Via del Corso 10",
    lat: 41.902782,
    lng: 12.496366,
  },
  {
    city: "Milano",
    address: "Via Monte Napoleone 5",
    lat: 45.465422,
    lng: 9.185924,
  },
  {
    city: "Napoli",
    address: "Via Toledo 100",
    lat: 40.851775,
    lng: 14.268124,
  },
  {
    city: "Torino",
    address: "Corso Vittorio Emanuele II 50",
    lat: 45.070339,
    lng: 7.686864,
  },
  {
    city: "Firenze",
    address: "Via dei Calzaiuoli 12",
    lat: 43.769562,
    lng: 11.255814,
  },
  {
    city: "Bologna",
    address: "Via dell'Indipendenza 23",
    lat: 44.494887,
    lng: 11.342616,
  },
  {
    city: "Venezia",
    address: "Calle Larga XXII Marzo",
    lat: 45.440847,
    lng: 12.315515,
  },
  {
    city: "Genova",
    address: "Via XX Settembre 30",
    lat: 44.405650,
    lng: 8.946256,
  },
  {
    city: "Verona",
    address: "Via Mazzini 18",
    lat: 45.438384,
    lng: 10.991622,
  },
  {
    city: "Palermo",
    address: "Via Roma 200",
    lat: 38.115690,
    lng: 13.361486,
  },
  // Altre città italiane
  {
    city: "Catania",
    address: "Via Etnea 290",
    lat: 37.507877,
    lng: 15.083030,
  },
  {
    city: "Padova",
    address: "Via Roma 10",
    lat: 45.406434,
    lng: 11.876761,
  },
  {
    city: "Trieste",
    address: "Piazza Unità d'Italia",
    lat: 45.649526,
    lng: 13.776818,
  },
  {
    city: "Bari",
    address: "Corso Cavour 20",
    lat: 41.117143,
    lng: 16.871871,
  },
  {
    city: "Bergamo",
    address: "Via XX Settembre 100",
    lat: 45.698264,
    lng: 9.677269,
  },
  {
    city: "Messina",
    address: "Viale San Martino 150",
    lat: 38.193769,
    lng: 15.554108,
  },
  {
    city: "Parma",
    address: "Strada della Repubblica 15",
    lat: 44.801485,
    lng: 10.327903,
  },
  {
    city: "Livorno",
    address: "Via Grande 70",
    lat: 43.548473,
    lng: 10.310567,
  },
  {
    city: "Taranto",
    address: "Via D'Aquino 100",
    lat: 40.464360,
    lng: 17.247030,
  },
  {
    city: "Perugia",
    address: "Corso Vannucci 25",
    lat: 43.110716,
    lng: 12.390827,
  },
  {
    city: "Rimini",
    address: "Viale Vespucci 50",
    lat: 44.060441,
    lng: 12.565104,
  },
  {
    city: "Salerno",
    address: "Corso Vittorio Emanuele 110",
    lat: 40.682441,
    lng: 14.768096,
  },
  {
    city: "Modena",
    address: "Via Emilia Centro 50",
    lat: 44.647128,
    lng: 10.925226,
  },
  {
    city: "Reggio Calabria",
    address: "Corso Giuseppe Garibaldi 250",
    lat: 38.114723,
    lng: 15.650000,
  },
  {
    city: "Reggio Emilia",
    address: "Via Emilia San Pietro 5",
    lat: 44.698993,
    lng: 10.629685,
  },
  {
    city: "Pescara",
    address: "Corso Umberto I 100",
    lat: 42.461790,
    lng: 14.216090,
  },
  {
    city: "Sassari",
    address: "Piazza d'Italia",
    lat: 40.725927,
    lng: 8.555682,
  },
  {
    city: "Lecce",
    address: "Via Trinchese 50",
    lat: 40.352913,
    lng: 18.174300,
  },
  {
    city: "Monza",
    address: "Via Italia 5",
    lat: 45.584500,
    lng: 9.274448,
  },
  {
    city: "Siracusa",
    address: "Corso Umberto I 90",
    lat: 37.075474,
    lng: 15.286586,
  },
  {
    city: "Pisa",
    address: "Corso Italia 150",
    lat: 43.716090,
    lng: 10.396589,
  },
  {
    city: "Latina",
    address: "Corso della Repubblica 70",
    lat: 41.467594,
    lng: 12.903569,
  },
  {
    city: "Cagliari",
    address: "Via Roma 150",
    lat: 39.223841,
    lng: 9.121661,
  },
  {
    city: "Vicenza",
    address: "Corso Palladio 25",
    lat: 45.545478,
    lng: 11.535421,
  },
  {
    city: "Terni",
    address: "Corso Tacito 100",
    lat: 42.563289,
    lng: 12.642660,
  },
  {
    city: "Brescia",
    address: "Via X Giornate 30",
    lat: 45.541552,
    lng: 10.211801,
  },
  {
    city: "Ancona",
    address: "Corso Garibaldi 80",
    lat: 43.616822,
    lng: 13.518915,
  },
  {
    city: "Forlì",
    address: "Corso della Repubblica 45",
    lat: 44.222660,
    lng: 12.040383,
  },
  {
    city: "Trento",
    address: "Via Belenzani 25",
    lat: 46.070763,
    lng: 11.121100,
  },
  {
    city: "Bolzano",
    address: "Via dei Portici 50",
    lat: 46.498295,
    lng: 11.354758,
  },

  // 🇪🇸 CITTÀ SPAGNOLE
  {
    city: "Madrid",
    address: "Gran Vía 25",
    lat: 40.416775,
    lng: -3.703790,
  },
  {
    city: "Barcellona",
    address: "Passeig de Gràcia 55",
    lat: 41.385063,
    lng: 2.173404,
  },
  {
    city: "Valencia",
    address: "Calle de Colón 10",
    lat: 39.469907,
    lng: -0.376288,
  },
  {
    city: "Siviglia",
    address: "Calle Sierpes 40",
    lat: 37.389092,
    lng: -5.984459,
  },
  {
    city: "Bilbao",
    address: "Gran Vía de Don Diego López de Haro 60",
    lat: 43.263012,
    lng: -2.934985,
  },
  {
    city: "Malaga",
    address: "Calle Larios 14",
    lat: 36.721274,
    lng: -4.421399,
  },
  {
    city: "Alicante",
    address: "Avenida Maisonnave 33",
    lat: 38.345996,
    lng: -0.490686,
  },
  {
    city: "Granada",
    address: "Calle Reyes Católicos 27",
    lat: 37.177336,
    lng: -3.598557,
  },
  {
    city: "Zaragoza",
    address: "Paseo de la Independencia 24",
    lat: 41.648823,
    lng: -0.889085,
  },
  {
    city: "Valladolid",
    address: "Calle Santiago 18",
    lat: 41.652251,
    lng: -4.724532,
  },
  // Altre città spagnole
  {
    city: "Murcia",
    address: "Gran Vía Alfonso X 8",
    lat: 37.983444,
    lng: -1.129889,
  },
  {
    city: "Gijón",
    address: "Calle Corrida 20",
    lat: 43.545260,
    lng: -5.661926,
  },
  {
    city: "Vigo",
    address: "Calle Príncipe 45",
    lat: 42.240598,
    lng: -8.720727,
  },
  {
    city: "Hospitalet de Llobregat",
    address: "Avinguda Carrilet 100",
    lat: 41.359612,
    lng: 2.100321,
  },
  {
    city: "A Coruña",
    address: "Calle Real 50",
    lat: 43.362343,
    lng: -8.411540,
  },
  {
    city: "Elche",
    address: "Calle Reina Victoria 12",
    lat: 38.269932,
    lng: -0.712560,
  },
  {
    city: "Oviedo",
    address: "Calle Uría 30",
    lat: 43.361914,
    lng: -5.849389,
  },
  {
    city: "Badalona",
    address: "Carrer de Francesc Layret 55",
    lat: 41.446988,
    lng: 2.245032,
  },
  {
    city: "Cartagena",
    address: "Calle Mayor 15",
    lat: 37.605123,
    lng: -0.986232,
  },
  {
    city: "Terrassa",
    address: "Rambla d'Ègara 80",
    lat: 41.564087,
    lng: 2.008726,
  },
  {
    city: "Jerez de la Frontera",
    address: "Calle Larga 70",
    lat: 36.681496,
    lng: -6.137305,
  },
  {
    city: "Sabadell",
    address: "Carrer de les Valls 45",
    lat: 41.548649,
    lng: 2.107187,
  },
  {
    city: "Móstoles",
    address: "Calle Antonio Hernández 25",
    lat: 40.322336,
    lng: -3.865764,
  },
  {
    city: "Alcalá de Henares",
    address: "Calle Mayor 90",
    lat: 40.481979,
    lng: -3.364465,
  },
  {
    city: "Pamplona",
    address: "Calle Estafeta 50",
    lat: 42.816871,
    lng: -1.643463,
  },
  {
    city: "Fuenlabrada",
    address: "Calle de Grecia 15",
    lat: 40.284196,
    lng: -3.794150,
  },
  {
    city: "Almería",
    address: "Paseo de Almería 20",
    lat: 36.834047,
    lng: -2.463713,
  },
  {
    city: "Leganés",
    address: "Calle Juan Muñoz 55",
    lat: 40.328690,
    lng: -3.763501,
  },
  {
    city: "San Sebastián",
    address: "Calle Hernani 10",
    lat: 43.322422,
    lng: -1.983888,
  },
  {
    city: "Santander",
    address: "Calle Burgos 25",
    lat: 43.462305,
    lng: -3.809980,
  },
  {
    city: "Burgos",
    address: "Calle Vitoria 60",
    lat: 42.343992,
    lng: -3.696906,
  },
  {
    city: "Albacete",
    address: "Calle Mayor 80",
    lat: 38.994349,
    lng: -1.858542,
  },
  {
    city: "Castellón de la Plana",
    address: "Calle Colón 45",
    lat: 39.986356,
    lng: -0.051324,
  },
  {
    city: "Getafe",
    address: "Calle Madrid 35",
    lat: 40.305537,
    lng: -3.732676,
  },
  {
    city: "Alcorcón",
    address: "Calle Mayor 10",
    lat: 40.345073,
    lng: -3.829681,
  },
  {
    city: "Logroño",
    address: "Calle Marqués de Murrieta 50",
    lat: 42.465015,
    lng: -2.448951,
  },
  {
    city: "Badajoz",
    address: "Avenida de Europa 25",
    lat: 38.878651,
    lng: -6.970648,
  },
  {
    city: "Salamanca",
    address: "Gran Vía 40",
    lat: 40.963416,
    lng: -5.663539,
  },
  {
    city: "Huelva",
    address: "Calle Berdigón 12",
    lat: 37.261421,
    lng: -6.944722,
  },
  {
    city: "Lleida",
    address: "Carrer Major 30",
    lat: 41.616741,
    lng: 0.622168,
  }
];

// Immagini di esempio per gli annunci
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80'
];

function getRandomPrice() {
  return Math.floor(Math.random() * (1200 - 300 + 1)) + 300;
}

function getRandomType() {
  const types = ["ROOM", "APARTMENT", "STUDIO", "OFFICE"];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomImage() {
  return SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
}

function getRandomSize() {
  return Math.floor(Math.random() * (120 - 30 + 1)) + 30;
}

function getRandomRooms() {
  return Math.floor(Math.random() * 4) + 1;
}

function getRandomBathrooms() {
  return Math.floor(Math.random() * 2) + 1;
}

async function seedListings() {
  console.log("Inizio seed di", listings.length, "annunci...");
  let countAdded = 0;
  
  for (const item of listings) {
    try {
      const type = getRandomType();
      const price = getRandomPrice();
      
      // Creazione di un titolo più descrittivo
      let title = "";
      switch(type) {
        case "ROOM":
          title = `Stanza in affitto a ${item.city}`;
          break;
        case "APARTMENT":
          title = `Appartamento luminoso a ${item.city}`;
          break;
        case "STUDIO":
          title = `Monolocale moderno a ${item.city}`;
          break;
        case "OFFICE":
          title = `Ufficio in zona ${item.city}`;
          break;
        default:
          title = `Immobile in affitto a ${item.city}`;
      }
      
      // Creazione di una descrizione più dettagliata
      const descrizione = `Fantastico ${type === "ROOM" ? "stanza" : type === "APARTMENT" ? "appartamento" : type === "STUDIO" ? "monolocale" : "ufficio"} 
      in ${item.address}, ${item.city}. ${type !== "ROOM" ? `${getRandomRooms()} stanze, ${getRandomBathrooms()} bagni, ${getRandomSize()} m².` : "Ambiente luminoso e ben arredato."} 
      Ottima posizione, vicino a mezzi pubblici e servizi. Disponibile da subito.`;
      
      await addDoc(collection(db, "listings"), {
        titolo: title,
        descrizione: descrizione,
        prezzo: price,
        immagine: getRandomImage(),
        indirizzo: item.address,
        città: item.city,
        nazione: item.lat > 35 ? "Italia" : "Spagna",
        latitudine: item.lat,
        longitudine: item.lng,
        tipo: type,
        timestamp: Date.now(),
        rooms: getRandomRooms(),
        bathrooms: getRandomBathrooms(),
        size: getRandomSize(),
        available: true
      });
      
      countAdded++;
      
      if (countAdded % 10 === 0) {
        console.log(`Aggiunti ${countAdded} annunci su ${listings.length}`);
      }
    } catch (error) {
      console.error("Errore nell'aggiunta dell'annuncio:", error);
    }
  }

  console.log(`Seed completato con successo. Aggiunti ${countAdded} annunci.`);
}

// Esporta le funzioni per poter essere usate altrove
export { seedListings, listings };

// Decommentare questa riga per eseguire il seed quando si esegue direttamente questo file
// seedListings(); 