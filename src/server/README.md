### Required for offline server functionality:

#### serviceAccountKey.json

The `serviceAccountKey.json` file is required for offline server functionality. It contains the credentials needed to access Firebase services.

To obtain the `serviceAccountKey.json` file:

1. Go to the Firebase Console.
2. Select your project.
3. Navigate to Project Settings > Service Accounts.
4. Click on the "Generate new private key" button.
5. Save the generated JSON file as `serviceAccountKey.json` in the `src/server` directory.

#### FatSecret API

You need to whitelist the server's IP address in the FatSecret API settings.
