import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeadersFor } from './cors.ts';

// Supabase prohibits secrets starting with SUPABASE_, so support non-reserved names first.
const supabaseUrl =
  Deno.env.get('SB_URL') ||
  Deno.env.get('SUPABASE_URL') ||
  (() => {
    throw new Error('Missing SB_URL/SUPABASE_URL env');
  })();

const supabaseServiceKey =
  Deno.env.get('SB_SERVICE_ROLE_KEY') ||
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
  (() => {
    throw new Error('Missing SB_SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY env');
  })();
/**
 * Response type for authentication errors
 */
export interface AuthErrorResponse {
  error: string;
  status: number;
}
/**
 * Successful authentication result
 */
export interface AuthSuccess {
  user: {
    id: string;
    email?: string;
  };
  supabase: SupabaseClient;
}
/**
 * Validate authorization header and authenticate user
 *
 * @param req - The incoming HTTP request
 * @returns AuthSuccess if authentication successful, AuthErrorResponse otherwise
 */
export async function authenticateUser(req: Request): Promise<AuthSuccess | AuthErrorResponse> {
  // Get authorization header to verify user identity
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: 'Missing or invalid authorization header',
      status: 401,
    };
  }
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey) as SupabaseClient;
  // Verify user JWT token
  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return {
      error: 'Invalid authentication token',
      status: 401,
    };
  }
  return {
    user: {
      id: user.id,
      email: user.email,
    },
    supabase,
  };
}
/**
 * Create a standardized error response
 *
 * @param error - Error message or object
 * @param status - HTTP status code (default: 500)
 * @returns HTTP Response with JSON error
 */
export function createErrorResponse(error: string | Error, status = 500, req?: Request): Response {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return new Response(JSON.stringify({ error: errorMessage }), {
    status,
    headers: { ...(req ? corsHeadersFor(req) : {}), 'Content-Type': 'application/json' },
  });
}
/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns HTTP Response with JSON data
 */
export function createSuccessResponse(data: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(req ? corsHeadersFor(req) : {}), 'Content-Type': 'application/json' },
  });
}
/**
 * Handle CORS preflight requests
 *
 * @param req - The incoming HTTP request
 * @returns Response if OPTIONS request, null otherwise
 */
export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeadersFor(req) });
  }
  return null;
}
/**
 * Validate HTTP method
 *
 * @param req - The incoming HTTP request
 * @param allowedMethods - Array of allowed HTTP methods
 * @returns null if valid, error Response if invalid
 */
export function validateMethod(req: Request, allowedMethods: string[]): Response | null {
  if (!allowedMethods.includes(req.method)) {
    return createErrorResponse(
      `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      405,
      req
    );
  }
  return null;
}
/**
 * UUID validation regex
 * Validates the general UUID format (8-4-4-4-12 hexadecimal groups)
 * Does NOT enforce RFC 4122 version/variant constraints
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a value is a valid UUID
 *
 * @param value - Value to check
 * @returns true if value is a valid UUID string
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Validate required fields in request body
 *
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns null if valid, error Response if missing fields
 */
export function validateRequiredFields(
  req: Request,
  body: Record<string, unknown>,
  requiredFields: string[]
): Response | null {
  const missingFields = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null
  );
  if (missingFields.length > 0) {
    return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400, req);
  }
  return null;
}

/**
 * Validate that specified fields are valid UUIDs.
 * Skips fields that are undefined or null (use validateRequiredFields for required fields).
 * Non-string values are coerced with String() and will fail the UUID format check;
 * optionally add a type check if you want clearer "wrong type" errors.
 *
 * @param req - The incoming HTTP request
 * @param body - Request body object
 * @param uuidFields - Array of field names that should contain UUIDs
 * @returns null if valid, error Response if any field is not a valid UUID
 */
export function validateUUIDs(
  req: Request,
  body: Record<string, unknown>,
  uuidFields: string[]
): Response | null {
  const invalidFields = uuidFields.filter(
    (field) =>
      body[field] !== undefined && body[field] !== null && !isValidUUID(String(body[field]))
  );
  if (invalidFields.length > 0) {
    return createErrorResponse(
      `Invalid UUID format for fields: ${invalidFields.join(', ')}`,
      400,
      req
    );
  }
  return null;
}
