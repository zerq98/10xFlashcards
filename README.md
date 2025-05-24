# 10xFlashcards

## Project Description

10xFlashcards is a web application designed to help users, primarily students, quickly and effectively create educational flashcards. It addresses the time-consuming nature of manual flashcard creation by offering AI-powered generation based on user-provided text, alongside traditional manual creation methods. Flashcards are organized within user-created "Topics". The application also includes standard user account management features (registration, login, password recovery, etc.) and integrates with an external Spaced Repetition (SR) library to facilitate learning.

The core goal of the Minimum Viable Product (MVP) is to deliver essential features for creating, managing, and studying flashcards, with a particular emphasis on streamlining the creation process through AI.

## Tech Stack

*   **Frontend:**
    *   [Astro 5](https://astro.build/): For building fast, content-focused websites with minimal client-side JavaScript.
    *   [React 19](https://react.dev/): For interactive UI components where needed.
    *   [TypeScript 5](https://www.typescriptlang.org/): For static typing and improved developer experience.
    *   [Tailwind CSS 4](https://tailwindcss.com/): For utility-first styling.
    *   [Shadcn/ui](https://ui.shadcn.com/): For accessible and reusable React components.
*   **Backend:**
    *   [Supabase](https://supabase.com/): Open-source Firebase alternative providing PostgreSQL database, authentication, and BaaS SDKs.
*   **AI:**
    *   [OpenAI API](https://platform.openai.com/): For accessing advanced language models to power the flashcard generation feature.
*   **Testing:**
    *   [Vitest](https://vitest.dev/): For unit and integration tests, compatible with the Vite ecosystem used by Astro.
    *   [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/): For testing React components.
    *   [MSW (Mock Service Worker)](https://mswjs.io/): For mocking API requests during tests.
    *   [Playwright](https://playwright.dev/): For end-to-end (E2E) testing across browsers and devices.
*   **CI/CD & Hosting:**
    *   [GitHub Actions](https://github.com/features/actions): For continuous integration and deployment pipelines.
    *   [DigitalOcean](https://www.digitalocean.com/): For hosting the application via Docker containers (planned).

## Getting Started Locally

Follow these steps to set up and run the project locally:

1.  **Prerequisites:**
    *   Node.js (LTS version recommended)
    *   npm, yarn, or pnpm package manager

2.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd react
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```

4.  **Set up environment variables:**
    *   Create a `.env` file in the project root.
    *   Add the necessary environment variables for Supabase (URL, anon key) and OpenRouter (API key). Refer to `.env.example` if available (Note: `.env.example` needs to be created).
    ```env
    # .env
    PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    OPENAI_API_KEY=YOUR_OPENAI_API_KEY
    # Add other variables as needed
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:4321` (or the port specified by Astro).

## Available Scripts

The following scripts are available in `package.json`:

*   `npm run dev`: Starts the Astro development server with hot module reloading.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Starts a local server to preview the production build.
*   `npm run astro`: Provides access to the Astro CLI for various commands.
*   `npm run test`: Runs unit and integration tests with Vitest.
*   `npm run test:e2e`: Runs end-to-end tests with Playwright.

## Project Scope (MVP)

### Included in MVP:

*   AI-powered flashcard generation from pasted text.
*   Manual flashcard creation.
*   Viewing, editing, and deleting flashcards and topics.
*   Basic user account system (email/password) for data persistence.
*   Integration with a pre-built, external Spaced Repetition (SR) library.
*   Web application accessible via a browser.

### Not Included in MVP:

*   Advanced or custom SR algorithm (like SuperMemo or Anki).
*   Importing flashcards from files (e.g., PDF, DOCX, CSV).
*   Social features (e.g., sharing flashcard sets, commenting).
*   Integrations with external educational platforms or tools.
*   Dedicated native mobile applications (iOS, Android).
*   Advanced text formatting on flashcards (e.g., Markdown, images).
*   Offline mode functionality.

## Project Status

The project is currently **under development**, focusing on implementing the features defined for the Minimum Viable Product (MVP).

## License

This project is licensed under the [MIT License](LICENSE). (Note: A `LICENSE` file needs to be added).
