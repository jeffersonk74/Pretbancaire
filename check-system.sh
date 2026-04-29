#!/bin/bash

echo "=== VÉRIFICATION DU SYSTÈME PRÊTBANK ==="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier le dossier uploads
echo -n "Dossier uploads... "
if [ -d "uploads" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}CRÉÉ${NC}"
    mkdir -p uploads
fi

# Vérifier si le backend tourne
echo -n "Backend (port 3001)... "
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}EN COURS${NC}"
else
    echo -e "${RED}ARRÊTÉ${NC}"
fi

# Vérifier si le frontend tourne
echo -n "Frontend (port 5173)... "
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}EN COURS${NC}"
else
    echo -e "${RED}ARRÊTÉ${NC}"
fi

# Vérifier la base de données
echo -n "Base de données... "
if [ -f "prisma/dev.db" ]; then
    echo -e "${GREEN}EXISTE${NC}"
else
    echo -e "${YELLOW}À INITIALISER${NC}"
fi

echo ""
echo "=== COMMANDES UTILES ==="
echo "Démarrer backend:  npm run server"
echo "Démarrer frontend: npm run dev"
echo "Redémarrer tous:   pkill -f 'node server.js' && npm run server"
echo ""
