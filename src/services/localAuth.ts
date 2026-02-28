// Local authentication service (no AWS Cognito required)
// This is used for local development without AWS credentials

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  college?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

// Simple mock JWT token generator
const generateMockToken = (email: string, sub: string): string => {
  // Create a proper JWT structure that can be decoded by jwt.decode()
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    sub,
    email,
    'cognito:username': email,
    name: email.split('@')[0],
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    iat: Math.floor(Date.now() / 1000), // issued at
  };
  
  // Create base64url encoded parts (JWT standard)
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signature = 'mock-signature-for-local-dev';
  
  return `${headerB64}.${payloadB64}.${signature}`;
};

export const signUp = async (data: SignUpData): Promise<any> => {
  // Validate phone number format if provided
  if (data.phoneNumber && !data.phoneNumber.startsWith('+')) {
    throw new Error('Phone number must start with + and country code (e.g., +1234567890)');
  }
  
  // Generate a mock Cognito sub
  const userSub = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in localStorage for persistence
  const users = JSON.parse(localStorage.getItem('localUsers') || '{}');
  
  if (users[data.email]) {
    const error: any = new Error('User already exists');
    error.code = 'UsernameExistsException';
    throw error;
  }
  
  users[data.email] = {
    email: data.email,
    password: data.password, // In real app, this would be hashed
    name: data.name,
    phoneNumber: data.phoneNumber,
    college: data.college,
    sub: userSub,
  };
  
  localStorage.setItem('localUsers', JSON.stringify(users));
  
  console.log('✅ Local user registered:', data.email);
  
  return {
    user: { username: data.email },
    userConfirmed: true,
    userSub,
  };
};

export const signIn = async (email: string, password: string): Promise<AuthTokens> => {
  const users = JSON.parse(localStorage.getItem('localUsers') || '{}');
  const user = users[email];
  
  if (!user || user.password !== password) {
    const error: any = new Error('Invalid email or password');
    error.code = 'NotAuthorizedException';
    throw error;
  }
  
  const token = generateMockToken(email, user.sub);
  
  const tokens = {
    accessToken: token,
    idToken: token,
    refreshToken: `refresh-${token}`,
  };
  
  // Store tokens
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('idToken', tokens.idToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  console.log('✅ Local user logged in:', email);
  
  return tokens;
};

export const signOut = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
};

export const getCurrentUser = async (): Promise<any> => {
  const token = localStorage.getItem('idToken');
  if (!token) {
    throw new Error('No user found');
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    throw new Error('Invalid token');
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = localStorage.getItem('idToken');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getAccessToken = async (): Promise<string> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No token found');
  }
  return token;
};

export const refreshSession = async (): Promise<AuthTokens> => {
  const user = await getCurrentUser();
  const token = generateMockToken(user.email, user.sub);
  
  const tokens = {
    accessToken: token,
    idToken: token,
    refreshToken: `refresh-${token}`,
  };
  
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('idToken', tokens.idToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  
  return tokens;
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<string> => {
  const user = await getCurrentUser();
  const users = JSON.parse(localStorage.getItem('localUsers') || '{}');
  
  if (!users[user.email] || users[user.email].password !== oldPassword) {
    throw new Error('Incorrect old password');
  }
  
  users[user.email].password = newPassword;
  localStorage.setItem('localUsers', JSON.stringify(users));
  
  return 'Password changed successfully';
};

// Dummy functions for compatibility
export const confirmSignUp = async (email: string, code: string): Promise<string> => {
  return 'Not needed - auto-confirmed';
};

export const resendConfirmationCode = async (email: string): Promise<string> => {
  return 'Not needed - auto-confirmed';
};

export const forgotPassword = async (email: string): Promise<any> => {
  throw new Error('Forgot password not implemented in local mode');
};

export const confirmForgotPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<string> => {
  throw new Error('Password reset not implemented in local mode');
};

export const deleteUser = async (): Promise<string> => {
  const user = await getCurrentUser();
  const users = JSON.parse(localStorage.getItem('localUsers') || '{}');
  delete users[user.email];
  localStorage.setItem('localUsers', JSON.stringify(users));
  signOut();
  return 'User deleted successfully';
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  isAuthenticated,
  getAccessToken,
  refreshSession,
  confirmSignUp,
  resendConfirmationCode,
  forgotPassword,
  confirmForgotPassword,
  changePassword,
  deleteUser,
};
