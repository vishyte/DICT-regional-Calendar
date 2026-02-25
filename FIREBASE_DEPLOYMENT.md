# Firebase Integration & Deployment Guide

## Overview
This project uses Firebase for real-time database, authentication, file storage, and analytics. Firebase is configured using environment variables for secure deployment.

## Local Development Setup

### 1. Install Firebase
```bash
npm install firebase
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

See `.env.example` for the template.

### 3. Test Firebase Locally
```bash
npm run dev
```

Your Firebase services will be initialized at app startup. Check the browser console for any configuration errors.

## Deployment Setup

### For Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add each Firebase configuration variable:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
   - Set for **Production** environment
3. **Deploy** — Vercel will automatically build and deploy

### For Netlify Deployment

1. **Connect your GitHub repository** to Netlify
2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add Environment Variables:**
   - Go to **Site settings** → **Build & deploy** → **Environment**
   - Add all Firebase configuration variables
4. **Deploy** — Netlify will build and deploy automatically

### For Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Build directory: `dist`
   - Configure as single-page app: `Yes`

4. **Update `firebase.json`:**
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

5. **Create `.env` for production:**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your Firebase credentials
   ```

6. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

## Firebase Services Available

The app initializes the following Firebase services:

- **Authentication** (`auth`) — User sign-up, sign-in, password reset
- **Firestore** (`firestore`) — Real-time NoSQL database
- **Cloud Storage** (`storage`) — File uploads and storage
- **Analytics** (`analytics`) — Optional, only enabled in production

## Using Firebase in Components

### Import Firebase Services
```tsx
import { auth, firestore, storage } from '../config/firebase';
```

### Example: Firestore Query
```tsx
import { collection, query, where, getDocs } from 'firebase/firestore';

const fetchActivities = async () => {
  const q = query(collection(firestore, 'activities'), where('status', '==', 'approved'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};
```

### Example: File Upload
```tsx
import { ref, uploadBytes } from 'firebase/storage';

const uploadFile = async (file: File) => {
  const storageRef = ref(storage, `files/${file.name}`);
  await uploadBytes(storageRef, file);
};
```

## Security Rules

### Firestore Rules (Set in Firebase Console)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage Rules (Set in Firebase Console)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Firebase Configuration is Incomplete
- Check `.env.local` file exists and has all variables
- Ensure variable names match exactly (case-sensitive)
- Restart dev server after adding env variables

### Firebase Not Initializing
- Check browser console for error messages
- Verify API key is valid in Firebase Console
- Ensure your Firebase project is active

### Analytics Not Initializing
- Analytics only initializes in production (`import.meta.env.PROD`)
- In development, check console for warnings but it's safe to ignore

## Security Notes

⚠️ **Important:** Never commit `.env.local` to version control. The file is in `.gitignore`.

- All Firebase credentials in `.env.local` are for client-side access
- Use Firebase Security Rules to restrict database access
- Never use sensitive API keys in client-side code beyond what Firebase provides

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firebase Console](https://console.firebase.google.com)
