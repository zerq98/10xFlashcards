/// <reference types="astro/client" />

/**
 * env.d.ts służy do kilku kluczowych celów w projekcie Astro:
 * 1. Definiuje typy dla zmiennych środowiskowych dostępnych przez import.meta.env
 * 2. Deklaruje typy dla lokalnego kontekstu Astro (context.locals)
 * 3. Rozszerza typy globalne jak App.Locals
 * 4. Zapewnia podpowiedzi TypeScript dla zmiennych używanych w całym projekcie
 * 
 * Ten plik NIE jest dostępny w przeglądarce - jest używany tylko podczas kompilacji.
 * Zmienne środowiskowe (SUPABASE_URL, SUPABASE_KEY itp.) są chronione:
 * - Po stronie serwera: dostępne w pełnej formie
 * - Po stronie klienta: dostępne tylko te z przedrostkiem PUBLIC_
 */

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

// Rozszerzenie globalnej przestrzeni nazw App dla Astro
declare global {
  namespace App {
    interface Locals {
      // Klient Supabase dostępny tylko na serwerze w context.locals
      supabase: SupabaseClient<Database>;
      // Sesja użytkownika z informacjami o uwierzytelnieniu
      session: Session | null;
      // Informacje o użytkowniku (dla wygody)
      user: User | null;
    }
  }
}

// Definicje zmiennych środowiskowych - kompilator sprawdzi ich użycie
interface ImportMetaEnv {
  // Zmienne dostępne tylko po stronie serwera (nie są eksponowane do przeglądarki)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_KEY?: string; // Opcjonalny klucz serwisowy z większymi uprawnieniami
  
  // Zmienne dostępne również po stronie klienta (z przedrostkiem PUBLIC_)
  readonly PUBLIC_APP_VERSION: string;
  readonly PUBLIC_API_BASE_URL?: string;
}

// Rozszerzenie ImportMeta dla dostępu do zmiennych środowiskowych
interface ImportMeta {
  readonly env: ImportMetaEnv;
}