import type { APIRoute } from 'astro';

/**
 * Endpoint API do wylogowania użytkownika
 * 
 * Ten endpoint:
 * 1. Wylogowuje użytkownika z Supabase Auth
 * 2. Czyści ciasteczka uwierzytelniające
 * 3. Zwraca odpowiedź z kodem 200 dla pomyślnego wylogowania
 */
export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  try {
    // Wylogowanie użytkownika z Supabase Auth
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error('Błąd podczas wylogowywania z Supabase:', error.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Wystąpił problem podczas wylogowywania.'
        }),
        { status: 500 }
      );
    }

    // Czyścimy ciasteczka uwierzytelniające
    cookies.delete('access_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    cookies.delete('user_id', { path: '/' });

    // Zwracamy pomyślną odpowiedź
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Nieoczekiwany błąd podczas wylogowywania:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Wystąpił nieoczekiwany błąd podczas wylogowywania.' 
      }),
      { status: 500 }
    );
  }
};
