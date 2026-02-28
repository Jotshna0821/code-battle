// Cognito Integration Service - Connects AWS Cognito with Backend
import cognitoAuthService from './cognitoAuthNoVerify';
import { AuthTokens, SignUpData } from './cognitoAuthNoVerify';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

// ============================================
// SIGN UP - Register with Cognito and Backend
// ============================================
export const signUp = async (data: SignUpData): Promise<{ user: any; token: string }> => {
  try {
    // Step 1: Register with AWS Cognito
    const cognitoResult = await cognitoAuthService.signUp(data);
    
    // Step 2: Sign in to get tokens
    const tokens = await cognitoAuthService.signIn(data.email, data.password);
    
    // Step 3: Store tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    // Step 4: Register with backend (create user record)
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/cognito-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.idToken}`,
      },
      body: JSON.stringify({
        cognitoSub: cognitoResult.userSub,
        email: data.email,
        name: data.name,
        phoneNumber: data.phoneNumber,
      }),
    });
    
    if (!backendResponse.ok) {
      const error = await backendResponse.json();
      throw new Error(error.error || 'Backend registration failed');
    }
    
    const backendData = await backendResponse.json();
    
    return {
      user: backendData.user,
      token: tokens.idToken,
    };
  } catch (error: any) {
    throw error;
  }
};

// ============================================
// SIGN IN - Login with Cognito and get Backend data
// ============================================
export const signIn = async (email: string, password: string): Promise<{ user: any; token: string }> => {
  try {
    // Step 1: Sign in with AWS Cognito
    const tokens = await cognitoAuthService.signIn(email, password);
    
    // Step 2: Store tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    // Step 3: Get Cognito user info
    const cognitoUser = await cognitoAuthService.getCurrentUser();
    
    // Step 4: Try to get user data from backend
    let backendResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.idToken}`,
      },
    });
    
    // Step 5: If user doesn't exist in backend, create them
    if (!backendResponse.ok) {
      if (backendResponse.status === 404 || backendResponse.status === 401) {
        const createResponse = await fetch(`${BACKEND_URL}/api/auth/cognito-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.idToken}`,
          },
          body: JSON.stringify({
            cognitoSub: cognitoUser.sub,
            email: cognitoUser.email,
            name: cognitoUser.name || email.split('@')[0],
            phoneNumber: cognitoUser.phone_number,
          }),
        });
        
        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error('Failed to create backend user');
        }
        
        const userData = await createResponse.json();
        return {
          user: userData.user,
          token: tokens.idToken,
        };
      }
      
      throw new Error('Failed to get user data');
    }
    
    const userData = await backendResponse.json();
    
    return {
      user: userData,
      token: tokens.idToken,
    };
  } catch (error: any) {
    throw error;
  }
};

// ============================================
// SIGN OUT
// ============================================
export const signOut = (): void => {
  cognitoAuthService.signOut();
};

// ============================================
// GET CURRENT USER
// ============================================
export const getCurrentUser = async (): Promise<any> => {
  try {
    const token = localStorage.getItem('idToken');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// ============================================
// CHECK IF AUTHENTICATED
// ============================================
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const cognitoAuth = await cognitoAuthService.isAuthenticated();
    const token = localStorage.getItem('idToken');
    return cognitoAuth && !!token;
  } catch (error) {
    return false;
  }
};

// ============================================
// GET ACCESS TOKEN
// ============================================
export const getAccessToken = async (): Promise<string> => {
  const token = localStorage.getItem('idToken');
  if (!token) {
    throw new Error('No token found');
  }
  return token;
};

// ============================================
// REFRESH SESSION
// ============================================
export const refreshSession = async (): Promise<AuthTokens> => {
  const tokens = await cognitoAuthService.refreshSession();
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('idToken', tokens.idToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  return tokens;
};

// ============================================
// CHANGE PASSWORD
// ============================================
export const changePassword = async (oldPassword: string, newPassword: string): Promise<string> => {
  return await cognitoAuthService.changePassword(oldPassword, newPassword);
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  isAuthenticated,
  getAccessToken,
  refreshSession,
  changePassword,
};
