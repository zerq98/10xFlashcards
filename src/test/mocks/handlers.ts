import { http, HttpResponse } from 'msw';
import { v4 as uuidv4 } from 'uuid';

/**
 * MSW Handlers for mocking API responses in tests
 * Add more handlers as needed for your test cases
 * 
 * All handlers match the actual API structure of the application:
 * - Success responses use an ApiSuccessResponse<T> format with a data property
 * - Error responses use an ApiErrorResponse format with an error object containing code, message, and possibly details
 */
export const handlers = [  // Auth API handlers
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    console.log('🔐 Login request intercepted by MSW mock:', body);
    // Mock successful login
    if (body.email === 'test@example.com' && body.password === 'password123') {
      console.log('✅ Authentication successful for:', body.email);
      return HttpResponse.json({
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        }
      });
    }
    
    // Mock login failure
    console.log('❌ Authentication failed for:', body.email);
    return new HttpResponse(
      JSON.stringify({ 
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      }), 
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    // Mock successful registration
    if (body.email && body.password) {
      return HttpResponse.json({
        data: {
          user: { id: 'new-user-id', email: body.email },
          session: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' }
        }
      });
    }
    
    // Mock registration failure
    return new HttpResponse(
      JSON.stringify({ 
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Registration failed',
          details: 'Email is already in use'
        }
      }), 
      { status: 400 }
    );
  }),

  // Topics API handlers
  http.get('/api/topics', () => {
    // Mock topics list
    const timestamp = new Date().toISOString();
    
    return HttpResponse.json({
      data: [
        { 
          id: '1', 
          name: 'JavaScript', 
          description: 'JS programming language', 
          user_id: '123',
          created_at: timestamp,
          updated_at: timestamp,
          flashcard_count: 10 
        },
        { 
          id: '2', 
          name: 'React', 
          description: 'React library', 
          user_id: '123',
          created_at: timestamp,
          updated_at: timestamp,
          flashcard_count: 5 
        },
        { 
          id: '3', 
          name: 'Astro', 
          description: 'Astro framework', 
          user_id: '123',
          created_at: timestamp,
          updated_at: timestamp,
          flashcard_count: 3 
        },
      ]
    });
  }),

  // Create new topic
  http.post('/api/topics', async ({ request }) => {
    const body = await request.json() as { name: string; description?: string };
    const timestamp = new Date().toISOString();
    
    // Mock create topic success
    if (body.name) {
      return HttpResponse.json({
        data: {
          id: uuidv4(),
          name: body.name,
          description: body.description || '',
          user_id: '123',
          created_at: timestamp,
          updated_at: timestamp,
          flashcard_count: 0
        }
      });
    }
    
    // Mock create topic failure
    return new HttpResponse(
      JSON.stringify({ 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required',
          details: { name: ['Required'] }
        }
      }), 
      { status: 400 }
    );
  }),

  // Get flashcards from a topic
  http.get('/api/topics/:topicId/flashcards', ({ params }) => {
    const { topicId } = params;
    const timestamp = new Date().toISOString();
    
    // Mock flashcards based on topic ID
    const flashcards = [
      { 
        id: '101', 
        front: 'What is React?', 
        back: 'A JavaScript library for building user interfaces',
        is_ai_generated: false,
        sr_state: null,
        created_at: timestamp,
        updated_at: timestamp
      },
      {
        id: '102',
        front: 'What is JSX?',
        back: 'A syntax extension for JavaScript that looks similar to HTML',
        is_ai_generated: true,
        sr_state: null,
        created_at: timestamp,
        updated_at: timestamp
      },
    ];
    
    // Return with proper pagination structure
    return HttpResponse.json({
      data: {
        flashcards: flashcards,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: flashcards.length,
          per_page: 20
        }
      }
    });
  }),
  
  // Create new flashcard
  http.post('/api/topics/:topicId/flashcards', async ({ request, params }) => {
    const body = await request.json() as { front: string; back: string };
    const { topicId } = params;
    const timestamp = new Date().toISOString();
    
    // Mock create flashcard success
    if (body.front && body.back) {
      return HttpResponse.json({
        data: {
          id: uuidv4(),
          front: body.front,
          back: body.back,
          is_ai_generated: false,
          sr_state: null,
          created_at: timestamp,
          updated_at: timestamp
        }
      });
    }
    
    // Mock create flashcard failure
    return new HttpResponse(
      JSON.stringify({ 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid flashcard data',
          details: {
            front: body.front ? [] : ['Required'],
            back: body.back ? [] : ['Required']
          }
        }
      }), 
      { status: 400 }
    );
  }),
  
  // Update flashcard
  http.put('/api/topics/:topicId/flashcards/:flashcardId', async ({ request, params }) => {
    const body = await request.json() as { front: string; back: string };
    const { topicId, flashcardId } = params;
    const timestamp = new Date().toISOString();
    
    // Mock update flashcard success
    if (body.front && body.back) {
      return HttpResponse.json({
        data: {
          id: flashcardId,
          front: body.front,
          back: body.back,
          is_ai_generated: false,
          sr_state: null,
          created_at: timestamp,
          updated_at: timestamp
        }
      });
    }
    
    // Mock update flashcard failure
    return new HttpResponse(
      JSON.stringify({ 
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid flashcard data',
          details: {
            front: body.front ? [] : ['Required'],
            back: body.back ? [] : ['Required']
          }
        }
      }), 
      { status: 400 }
    );
  }),
  
  // Delete flashcard
  http.delete('/api/topics/:topicId/flashcards/:flashcardId', ({ params }) => {
    const { topicId, flashcardId } = params;
    
    // Always succeed with delete
    return HttpResponse.json({
      data: {
        success: true,
        id: flashcardId
      }
    });
  }),
  
  // Delete topic
  http.delete('/api/topics/:topicId', ({ params }) => {
    const { topicId } = params;
    
    // Always succeed with delete
    return HttpResponse.json({
      data: {
        success: true,
        id: topicId
      }
    });
  }),
  
  // AI flashcard generation
  http.post('/api/topics/:topicId/generate', async ({ request, params }) => {
    const body = await request.json() as { text: string; count?: number };
    const { topicId } = params;
    const generationId = uuidv4();
    
    // Mock AI generation
    if (body.text && body.text.trim().length > 0) {
      return HttpResponse.json({
        data: {
          status: "success",
          error_info: null,
          requested_count: body.count || 3,
          generated_count: 3,
          generation_id: generationId,
          flashcards: [
            {
              id: uuidv4(),
              front: 'What is the main concept of React?',
              back: 'The main concept of React is component-based architecture',
              is_ai_generated: true
            },
            {
              id: uuidv4(),
              front: 'What is JSX?',
              back: 'JSX is a syntax extension for JavaScript that allows writing HTML-like code in JavaScript files',
              is_ai_generated: true
            },
            {
              id: uuidv4(),
              front: 'What is a React Hook?',
              back: 'Hooks are functions that let you use state and other React features without writing a class',
              is_ai_generated: true
            }
          ]
        }
      });
    }
    
    // Mock AI generation failure
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Text is required for AI generation',
          details: {
            text: ['Required']
          }
        }
      }), 
      { status: 400 }
    );
  }),
  
  // Save generated flashcards
  http.post('/api/topics/:topicId/generate/:generationId/save', async ({ request, params }) => {
    const body = await request.json() as { flashcards: Array<{ front: string; back: string; was_edited_before_save: boolean }> };
    const { topicId, generationId } = params;
    
    // Mock save success
    if (body.flashcards && Array.isArray(body.flashcards) && body.flashcards.length > 0) {
      const flashcardIds = body.flashcards.map(() => uuidv4());
      
      return HttpResponse.json({
        data: {
          saved_count: body.flashcards.length,
          flashcard_ids: flashcardIds
        }
      }, { status: 201 });
    }
    
    // Mock save failure
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one flashcard must be provided',
          details: {
            flashcards: ['At least one flashcard must be provided']
          }
        }
      }), 
      { status: 400 }
    );
  }),
];
