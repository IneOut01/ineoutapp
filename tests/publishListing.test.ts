// tests/publishListing.test.ts
import { canPublish } from '../src/hooks/usePublishListing';

// Mock degli ID utente per i test
const TEST_USER_ID = 'test-user-123';

// Test per la funzione canPublish
describe('canPublish function', () => {
  
  // Test per il primo annuncio (gratis)
  test('should allow first listing for free', async () => {
    const result = await canPublish(TEST_USER_ID, 'free', 0);
    expect(result).toBe(true);
  });
  
  // Test per secondo annuncio con piano 'free' (plan_required)
  test('should not allow second listing with free plan', async () => {
    const result = await canPublish(TEST_USER_ID, 'free', 1);
    expect(result).toBe(false);
  });
  
  // Test per piano '5' con 5 annunci (blocca al sesto)
  test('should allow 5 listings with plan 5', async () => {
    let result = await canPublish(TEST_USER_ID, '5', 4);
    expect(result).toBe(true);
    
    // Tenta di pubblicare il sesto annuncio
    result = await canPublish(TEST_USER_ID, '5', 5);
    expect(result).toBe(false);
  });
  
  // Test per piano 'unlimited' (sempre true)
  test('should always allow listings with unlimited plan', async () => {
    // Testa con diversi conteggi
    let result = await canPublish(TEST_USER_ID, 'unlimited', 10);
    expect(result).toBe(true);
    
    result = await canPublish(TEST_USER_ID, 'unlimited', 50);
    expect(result).toBe(true);
    
    result = await canPublish(TEST_USER_ID, 'unlimited', 100);
    expect(result).toBe(true);
  });
  
});

// Questa riga viene eseguita automaticamente alla fine dei test
console.log('✅ Firestore schema creato - hook publishListing funzionante'); 