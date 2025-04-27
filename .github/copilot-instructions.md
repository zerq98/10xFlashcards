# AI Rules for FlashcardMaster

FlashcardMaster to aplikacja web umożliwiająca użytkownikom szybkie i efektywne tworzenie fiszek edukacyjnych. Aplikacja pozwala na generowanie fiszek przy użyciu AI na podstawie wprowadzonego tekstu oraz ręczne tworzenie fiszek. Użytkownik przed przejściem do widoku listy fiszek najpierw wybiera kategorię, w ramach której mają być dodane fiszki – zarówno te wygenerowane przez AI, jak i te tworzone manualnie. Wspólna lista fiszek zawiera wyraźne oznaczenie, które fiszki są generowane przez AI, a które dodane ręcznie. Edycja danych fiszki odbywa się w modalnym oknie. Dodatkowo, aplikacja wspiera standardowe funkcje zarządzania kontem (rejestracja, logowanie, odzyskiwanie hasła, zmiana hasła i usuwanie konta) oraz integrację z gotowym algorytmem powtórek.

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/components` - client-side components written in Astro (static) and React (dynamic)
- `./src/assets` - static internal assets
- `./public` - public assets
- `./src/db` - database files

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling

## FRONTEND

use guidelines for frontend development from the [frontend.md](./instructions/frontend.md) file.

## SUPABASE
use guidelines for Supabase from the [supabase.md](./instructions/supabase.md) file.

## TESTING
use guidelines for testing from the [testing.md](./instructions/testing.md) file.