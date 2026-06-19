import dotenv from 'dotenv';
dotenv.config();

import db from './data/database.js';
import storage from './modules/shared/supabase/supabase.js';

async function testConnection() {
  console.log("=== INICIANDO PRUEBAS DE CONEXIÓN ===");
  
  // 1. Probar PostgreSQL
  console.log("\n1. Probando conexión a PostgreSQL (DATABASE_URL)...");
  try {
    const result = await db.raw('SELECT 1+1 AS result');
    console.log("✅ ¡Conexión a PostgreSQL EXITOSA!");
  } catch (error) {
    console.error("❌ Error conectando a PostgreSQL:");
    console.error(error.message);
  }

  // 2. Probar Supabase Storage
  console.log("\n2. Probando conexión a Supabase Storage (SUPABASE_URL y ANON_KEY)...");
  try {
    const { data, error } = await storage.getBucket(process.env.STORAGE_BUCKET);
    if (error) {
      console.error("❌ Error accediendo al bucket de Storage:", error.message);
    } else {
      console.log("✅ ¡Conexión a Supabase Storage EXITOSA!");
      console.log(`   Bucket encontrado: ${data.name}`);
    }
  } catch (error) {
    console.error("❌ Error conectando a Storage:");
    console.error(error.message);
  }

  console.log("\n=== PRUEBAS FINALIZADAS ===");
  process.exit(0);
}

testConnection();
