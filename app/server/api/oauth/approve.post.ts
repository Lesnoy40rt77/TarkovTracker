import { createClient } from '@supabase/supabase-js';
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody(event);
  const authorizationId = body.authorization_id as string;
  if (!authorizationId) {
    throw createError({
      statusCode: 400,
      message: 'Missing authorization_id parameter',
    });
  }
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);
  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
  return data;
});
