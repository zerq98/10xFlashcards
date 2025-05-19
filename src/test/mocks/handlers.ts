import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for mocking API responses in tests
 * Add more handlers as needed for your test cases
 */
export const handlers = [
  // Auth API handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    
    // Mock successful login
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
      });
    }
    
    // Mock login failure
    return new HttpResponse(
      JSON.stringify({ error: 'Invalid credentials' }), 
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    
    // Mock successful registration
    if (body.email && body.password) {
      return HttpResponse.json({
        user: { id: 'new-user-id', email: body.email },
        session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
      });
    }
    
    // Mock registration failure
    return new HttpResponse(
      JSON.stringify({ error: 'Registration failed' }), 
      { status: 400 }
    );
  }),

  // Topics API handlers
  http.get('/api/topics', () => {
    // Mock topics list
    return HttpResponse.json([
      { id: '1', title: 'JavaScript', description: 'JS programming language', flashcardCount: 10 },
      { id: '2', title: 'React', description: 'React library', flashcardCount: 5 },
      { id: '3', title: 'Astro', description: 'Astro framework', flashcardCount: 3 },
    ]);
  }),

  // Flashcard API handlers
  http.get('/api/topics/:topicId/flashcards', ({ params }) => {
    const { topicId } = params;
    
    // Mock flashcards based on topic ID
    const flashcards = [
      { 
        id: '101', 
        topicId, 
        front: 'What is React?', 
        back: 'A JavaScript library for building user interfaces',
        aiGenerated: false
      },
      {
        id: '102',
        topicId,
        front: 'What is JSX?',
        back: 'A syntax extension for JavaScript that looks similar to HTML',
        aiGenerated: true
      },
    ];
    
    return HttpResponse.json(flashcards);
  }),
];
