type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    username?: string;
  };
};

type SupabaseAuthResponse = {
  user?: SupabaseAuthUser | null;
  session?: {
    access_token?: string;
  } | null;
  error?: string;
  msg?: string;
  message?: string;
};

export class SupabaseAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAuthError";
  }
}

function getSupabaseAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env belum diset. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ke .env.");
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

async function requestSupabaseAuth<T>(path: string, body: object): Promise<T> {
  const { url, key } = getSupabaseAuthConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as T & SupabaseAuthResponse;

  if (!response.ok) {
    throw new SupabaseAuthError(data.error ?? data.msg ?? data.message ?? "Supabase Auth request gagal.");
  }

  return data;
}

export async function signUpWithSupabaseAuth(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}): Promise<SupabaseAuthResponse> {
  const result = await requestSupabaseAuth<any>("signup", {
    email: input.email,
    password: input.password,
    data: {
      name: input.name,
      username: input.username,
    },
  });

  // Jika email confirmation aktif, Supabase/GoTrue mengembalikan object user langsung di root (punya field id)
  // Jika email confirmation nonaktif, Supabase/GoTrue mengembalikan object session yang membungkus user dan session token
  if (result && !result.user && result.id) {
    return {
      user: result as SupabaseAuthUser,
      session: null,
    };
  }

  return result as SupabaseAuthResponse;
}

export async function signInWithSupabaseAuth(input: { email: string; password: string }) {
  return requestSupabaseAuth<SupabaseAuthResponse>("token?grant_type=password", {
    email: input.email,
    password: input.password,
  });
}
