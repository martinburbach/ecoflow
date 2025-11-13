import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, LogBox } from 'react-native';

// Alle "Text strings must be rendered within a <Text>"-Warnungen unterdrücken
LogBox.ignoreLogs([
    'Text strings must be rendered within a <Text>'
  ]);

const DROPBOX_CLIENT_ID = 'ybzfgcuiwbfu2qq';

// Lokale Entwicklung (Expo Go, Tunnel, LAN, etc.)
const USE_EXPO_PROXY = true;

// Redirect URI dynamisch bestimmen
export const DROPBOX_REDIRECT_URI = AuthSession.makeRedirectUri({
  // Für die Entwicklung mit Expo Go oder einem Tunnel
  useProxy: true,
  // Für native Builds (iOS/Android) sollte ein eindeutiges Schema verwendet werden
  // Dieses Schema muss in app.json unter "expo.scheme" definiert sein
  native: 'ecoflowlocal://auth',
});

// --- WICHTIGER DEBUG-HINWEIS ---
// Loggt die exakte Redirect-URI, die in den Dropbox-Einstellungen hinterlegt sein muss.
console.log('================================================================');
console.log('Dropbox Auth: Verwende folgende Redirect URI:');
console.log(DROPBOX_REDIRECT_URI);
console.log('Kopiere diese URI und füge sie in den Dropbox App-Einstellungen unter "Redirect URIs" hinzu.');
console.log('================================================================');    

// FIX: Polyfill for makeCodeVerifier for older expo-auth-session versions
function generateCodeVerifier(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  const randomBytes = Crypto.getRandomBytes(length);
  for (let i = 0; i < length; i++) {
    text += possible.charAt(randomBytes[i] % possible.length);
  }
  return text;
}

interface DropboxTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

class DropboxService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async authenticate(): Promise<boolean> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (storedTokens && this.isTokenValid(storedTokens)) {
        this.accessToken = storedTokens.accessToken;
        this.refreshToken = storedTokens.refreshToken || null;
        return true;
      }

      const codeVerifier = generateCodeVerifier();
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      const codeChallenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${DROPBOX_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}&` +
        `response_type=code&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256&` +
        `token_access_type=offline`;

      let authResult;
      try {
        console.log('Opening auth session...');
        authResult = await WebBrowser.openAuthSessionAsync(
          authUrl,
          DROPBOX_REDIRECT_URI,
          {
            showInRecents: true,
            preferEphemeralSession: true
          }
        );
        
        // Wichtig: Browser-Session explizit schließen
        await WebBrowser.coolDownAsync();
        console.log('Auth session result:', JSON.stringify(authResult, null, 2));
      } catch (error) {
        console.error('WebBrowser error:', error);
        return false;
      }

      if (authResult?.type === 'success' && authResult.url) {
        const url = new URL(authResult.url);
        const code = url.searchParams.get('code');
        console.log('Extracted auth code:', code);
        
        if (code) {
          try {
            const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                client_id: DROPBOX_CLIENT_ID,
                redirect_uri: DROPBOX_REDIRECT_URI,
                code_verifier: codeVerifier,
              }).toString(),
            });

            console.log('Token response status:', tokenResponse.status);
            const tokenData = await tokenResponse.json();
            console.log('Token response data:', JSON.stringify(tokenData, null, 2));

            if (tokenResponse.ok && tokenData.access_token) {
              this.accessToken = tokenData.access_token;
              this.refreshToken = tokenData.refresh_token;

              await this.storeTokens({
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
              });
              console.log('Successfully authenticated and stored tokens.');
              return true;
            } else {
              console.error('Failed to get access token. Response:', tokenData);
            }
          } catch (error) {
            console.error('Error during token exchange fetch:', error);
            return false;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Dropbox authentication error:', error);
      return false;
    }
  }

  async uploadBackup(backupData: string, filename: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Authentication failed');
        }
      }

      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/EcoFlow_Backups/${filename}`,
            mode: 'overwrite',
            autorename: true,
          }),
        },
        body: backupData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backup uploaded successfully:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Upload failed with status', response.status, ':', errorText);
        
        if (response.status === 401) {
          console.log('Attempting to refresh access token due to 401.');
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            console.log('Access token refreshed, retrying upload.');
            return this.uploadBackup(backupData, filename);
          } else {
            console.error('Failed to refresh access token.');
          }
        }
        
        return false;
      }
    } catch (error: any) {
      console.error('Dropbox upload error:', error.message);
      return false;
    }
  }

  async downloadBackup(filename: string, onProgress?: (progress: number) => void): Promise<string | null> {
    try {
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Authentication failed');
        }
      }

      const downloadUrl = 'https://content.dropboxapi.com/2/files/download';
      console.log('Attempting to download from Dropbox URL:', downloadUrl, 'with filename:', filename);

      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: `/EcoFlow_Backups/${filename}`,
          }),
        },
      });

      if (response.ok) {
        console.log(`Download response.ok is true for ${filename}.`);
        const contentLength = response.headers.get('Content-Length');
        console.log(`Content-Length header: ${contentLength}`);

        if (onProgress) {
          onProgress(0); // Start progress
        }

        const backupData = await response.text();
        console.log(`Downloaded backupData length: ${backupData.length}`);

        if (onProgress) {
          onProgress(100); // Ensure 100% is reported on completion
        }
        return backupData;
      } else {
        console.error(`Download failed. HTTP Status: ${response.status}, Status Text: ${response.statusText}`);
        const errorResponse = await response.text(); // Read as text to avoid JSON parsing errors
        try {
          const errorJson = JSON.parse(errorResponse);
          if (errorJson.error_summary && errorJson.error_summary.startsWith('path/not_found')) {
            console.warn(`Download failed: File '${filename}' not found on Dropbox. Status: ${response.status}`);
            return null; // File not found is not an error in the sync context
          } else {
            console.error(`Download failed with status ${response.status}:`, errorJson);
          }
        } catch (parseError) {
          console.error(`Download failed with status ${response.status}. Could not parse error response:`, errorResponse);
          console.error('Raw error response:', errorResponse);
        }
        
        if (response.status === 401) {
          console.log('Attempting to refresh access token due to 401 during download.');
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            console.log('Access token refreshed, retrying download.');
            return this.downloadBackup(filename, onProgress);
          }
        }
        
        return null;
      }
    } catch (error: any) {
      console.error('Dropbox download error:', error.message);
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error('Network request failed. Please check your internet connection and firewall settings.');
      } else if (error.response) {
        console.error('Error response from Dropbox:', error.response.status, error.response.data);
      } else {
        console.error('An unexpected error occurred during Dropbox download.', error);
      }
      if (onProgress) {
        onProgress(0); // Reset progress on error
      }
      return null;
    }
  }

  async listBackups(): Promise<{ name: string; modified: string; size: number }[]> {
    try {
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Authentication failed');
        }
      }

      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/EcoFlow_Backups',
          recursive: false,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.entries
          .filter((entry: any) => entry['.tag'] === 'file' && entry.name.endsWith('.json'))
          .map((entry: any) => ({ name: entry.name, modified: entry.server_modified, size: entry.size }))
          .sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      } else {
        const error = await response.json();
        
        if (error.error?.path_lookup?.['.tag'] === 'not_found') {
          // This is expected on first run, create the folder and return empty list.
          await this.createBackupFolder();
          return [];
        } else {
          // For other errors, log them.
          console.error('List backups failed:', error);
        }
        
        if (response.status === 401) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.listBackups();
          }
        }
        
        return [];
      }
    } catch (error) {
      console.error('Dropbox list backups error:', error);
      return [];
    }
  }

  async createBackupFolder(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) return false;
      }

      const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/EcoFlow_Backups',
          autorename: false,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Create folder error:', error);
      return false;
    }
  }

  async forceUpload(localData: any): Promise<boolean> {
    const SYNC_FILENAME = 'ecoflow_synced_backup.json';
    console.log('Forcing upload of local data to Dropbox, overwriting remote file.');
    const backupString = JSON.stringify(localData, null, 2);
    return await this.uploadBackup(backupString, SYNC_FILENAME);
  }

  async getLatestBackupMetadata(): Promise<{ name: string; timestamp: Date; size: number } | null> {
    try {
      const backups = await this.listBackups();
      if (backups.length > 0) {
        const latest = backups[0];
        return {
          name: latest.name,
          timestamp: latest.modified ? new Date(latest.modified) : new Date(), // Ensure it's a Date object
          size: latest.size,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting latest backup metadata:', error);
      return null;
    }
  }

  async syncWithDropbox(localData: any): Promise<{ success: boolean; merged: boolean; data?: any; message: string }> {
    const SYNC_FILENAME = 'ecoflow_synced_backup.json';
    try {
      if (!this.accessToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return { success: false, merged: false, message: 'Authentication failed' };
        }
      }

      // First, test if the token is valid for a simple API call
      const isTokenValid = await this.testApiToken();
      if (!isTokenValid) {
        console.log('syncWithDropbox: Token test failed. Attempting to refresh...');
        const refreshed = await this.refreshAccessToken();
        if (!refreshed || !(await this.testApiToken())) {
          console.error('syncWithDropbox: Failed to refresh token or token is still invalid.');
          return { success: false, merged: false, message: 'Dropbox token is invalid and could not be refreshed.' };
        }
        console.log('syncWithDropbox: Token successfully refreshed.');
      }

      // Try to download the existing sync file
      console.log('syncWithDropbox: Attempting to download existing sync file.');
      const remoteDataString = await this.downloadBackup(SYNC_FILENAME);

      if (!remoteDataString) {
        // No remote backup exists, or it failed to download.
        // Let's create it from local data.
        console.log('syncWithDropbox: No remote backup found. Uploading local data.');
        const backupString = JSON.stringify(localData, null, 2);
        const uploadSuccess = await this.uploadBackup(backupString, SYNC_FILENAME);
        if (uploadSuccess) {
          console.log('syncWithDropbox: Initial backup uploaded successfully.');
          return { success: true, merged: false, message: 'Initial backup uploaded to Dropbox.' };
        } else {
          console.error('syncWithDropbox: Failed to upload initial backup.');
          return { success: false, merged: false, message: 'Failed to upload initial backup.' };
        }
      }

      // Per your request, remote data is now always preferred.
      // This will overwrite any local changes if a remote file exists.
      console.log('syncWithDropbox: Remote data found. It will be used as the source of truth.');
      const remoteData = JSON.parse(remoteDataString);
      return { success: true, merged: true, data: remoteData, message: 'Remote data has been downloaded.' };

    } catch (error: any) {
      console.error('Dropbox sync error:', error);
      return { success: false, merged: false, message: error.message };
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        return false;
      }

      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: DROPBOX_CLIENT_ID,
        }).toString(),
      });

      const tokenData = await response.json();

      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token;
        
        await this.storeTokens({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || this.refreshToken,
          expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const storedTokens = await this.getStoredTokens();
    if (storedTokens && this.isTokenValid(storedTokens)) {
      this.accessToken = storedTokens.accessToken;
      this.refreshToken = storedTokens.refreshToken || null;
      return true;
    }
    return false;
  }

  async testApiToken(): Promise<boolean> {
    if (!this.accessToken) {
      console.log('testApiToken: No access token available.');
      return false;
    }
    try {
      console.log('testApiToken: Testing token with users/get_current_account...');
      const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      console.log('testApiToken: Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('testApiToken: Token test failed with status', response.status, errorText);
      }
      return response.ok;
    } catch (error) {
      console.error('testApiToken: Network request failed.', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      await AsyncStorage.removeItem('dropbox_tokens');
    }
  }

  private async storeTokens(tokens: DropboxTokens): Promise<void> {
    await AsyncStorage.setItem('dropbox_tokens', JSON.stringify(tokens));
  }

  private async getStoredTokens(): Promise<DropboxTokens | null> {
    try {
      const stored = await AsyncStorage.getItem('dropbox_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading stored Dropbox tokens. Clearing corrupted data.', error);
      await AsyncStorage.removeItem('dropbox_tokens');
      return null;
    }
  }

  private isTokenValid(tokens: DropboxTokens): boolean {
    if (!tokens.accessToken) return false;
    if (tokens.expiresAt && Date.now() >= tokens.expiresAt) return false;
    return true;
  }
}

export const dropboxService = new DropboxService();
export default dropboxService;