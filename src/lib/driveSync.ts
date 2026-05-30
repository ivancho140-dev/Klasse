import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize Auth
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might have expired or not cached yet on refresh
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Login Trigger via popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error("Failed to retrieve access token from Google Sign-In.");
    }
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error("Firebase Login Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Logout Trigger
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

// ==========================================
// Google Drive API REST Integration helpers
// ==========================================

// 1. Find or Create Klasse Backups Folder
async function getOrCreateFolderId(token: string): Promise<string> {
  const folderName = "Klasse Portal Backups";
  
  // Search for existing folder
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    throw new Error(`Google Drive API Search Failed: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // If not found, create new folder
  const createUrl = "https://www.googleapis.com/drive/v3/files";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder"
    })
  });
  
  if (!createRes.ok) {
    throw new Error(`Google Drive Folder Creation Failed: ${createRes.statusText}`);
  }
  
  const createdFolder = await createRes.json();
  return createdFolder.id;
}

// 2. Perform Drive Backup
export interface DrivePayload {
  students: any[];
  classrooms?: any[];
  syncDate: string;
}

export async function uploadBackupToDrive(
  token: string,
  students: any[],
  classrooms?: any[]
): Promise<{ success: boolean; lastSyncDate: string; fileId: string }> {
  const folderId = await getOrCreateFolderId(token);
  const fileName = "klasse_backup.json";
  
  // Search for existing file inside that folder
  const query = encodeURIComponent(`name = '${fileName}' and '${folderId}' in parents and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    throw new Error(`Search for backup file failed: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  let fileId = "";
  
  const payload: DrivePayload = {
    students,
    classrooms,
    syncDate: new Date().toLocaleString()
  };
  
  if (searchData.files && searchData.files.length > 0) {
    // Existing file found, update it using simple upload endpoint
    fileId = searchData.files[0].id;
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    
    const updateRes = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!updateRes.ok) {
      throw new Error(`Updating backup file on Drive failed: ${updateRes.statusText}`);
    }
  } else {
    // Create new file metadata first
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fileName,
        parents: [folderId],
        mimeType: "application/json"
      })
    });
    
    if (!createRes.ok) {
      throw new Error(`Creating backup file metadata failed: ${createRes.statusText}`);
    }
    
    const createdFile = await createRes.json();
    fileId = createdFile.id;
    
    // Upload the file payload content
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!uploadRes.ok) {
      throw new Error(`Uploading backup file content failed: ${uploadRes.statusText}`);
    }
  }
  
  return {
    success: true,
    lastSyncDate: payload.syncDate,
    fileId
  };
}

// 3. Download/Restore Backup from Drive
export async function downloadBackupFromDrive(token: string): Promise<DrivePayload | null> {
  const folderId = await getOrCreateFolderId(token);
  const fileName = "klasse_backup.json";
  
  const query = encodeURIComponent(`name = '${fileName}' and '${folderId}' in parents and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    throw new Error(`Search for backup file failed: ${searchRes.statusText}`);
  }
  
  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) {
    return null;
  }
  
  const fileId = searchData.files[0].id;
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  const downloadRes = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!downloadRes.ok) {
    throw new Error(`Downloading backup file failed: ${downloadRes.statusText}`);
  }
  
  return await downloadRes.json();
}
