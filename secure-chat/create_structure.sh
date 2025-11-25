#!/bin/bash

echo "=== Secure Chat Project Structure Generator ==="

# Backend
mkdir -p backend/src/{routes,services,db,ws}
touch backend/src/index.ts
touch backend/src/routes/.gitkeep
touch backend/src/services/.gitkeep
touch backend/src/db/.gitkeep
touch backend/src/ws/.gitkeep
touch backend/.env.example
touch backend/README.md

# Web frontend
mkdir -p web/src/{components,pages,styles,api}
mkdir -p web/src/components/{Chat,SecretBox,Settings,Common}
touch 
web/src/components/Chat/{ChatScreen.tsx,ChatHeader.tsx,ChatMessage.tsx}
touch web/src/components/SecretBox/SecretBox.tsx
touch web/src/components/Settings/Settings.tsx
touch web/src/components/Common/{Loading.tsx,Modal.tsx}
touch 
web/src/pages/{Home.tsx,ChatPage.tsx,SecretBoxPage.tsx,SettingsPage.tsx}
touch web/src/api/client.ts
touch web/src/api/chat.ts
touch web/src/styles/global.css

# iOS structure
mkdir -p ios
touch ios/README.md

# Docs
mkdir -p docs
touch docs/ui-wireframe.html
touch docs/project-notes.md

echo "=== All directories created successfully! ==="

