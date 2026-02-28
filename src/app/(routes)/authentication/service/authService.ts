const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function signUp(payload: SignUpPayload) {
    console.log("payload", payload);

  const res = await fetch(`${API_BASE_URL}/user/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = "Sign up failed";
    try {
      const err = await res.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function googleLogin(idToken: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/user/google-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    let msg = 'Google login failed';
    try {
      const err = await res.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  data: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin' | 'moderator';
    permissions: string[];
    employeeId?: string;
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Login failed';
    try {
      const err = await res.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
