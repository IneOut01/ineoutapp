// Script per verificare che l'URI di reindirizzamento OAuth sia corretto
const fs = require('fs');
const path = require('path');

// Legge il file app.json per ottenere lo slug
function getAppInfo() {
  try {
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    const slug = appJson.expo.slug;
    // In un ambiente reale, otterresti l'owner dal tuo account Expo
    // Per questo esempio, usiamo un valore fisso
    const owner = 'ineout01';
    
    return { slug, owner };
  } catch (error) {
    console.error('Errore nella lettura di app.json:', error);
    process.exit(1);
  }
}

function checkRedirectURI() {
  const { slug, owner } = getAppInfo();
  
  console.log('Configurazione app trovata:');
  console.log(`- Slug: ${slug}`);
  console.log(`- Owner: ${owner}`);
  
  const expectedRedirect = `https://auth.expo.io/@${owner}/${slug}`;
  
  console.log('\nURI di reindirizzamento OAuth atteso:');
  console.log(expectedRedirect);
  
  console.log('\nAssicurati di aggiungere questo URI nella console Google Cloud.');
}

checkRedirectURI(); 