# PrêtBancaire

Application web de gestion de prêts bancaires développée avec Flask et SQLAlchemy.

## Fonctionnalités

- **Clients** : soumettre des demandes de prêt, suivre l'état de leurs dossiers
- **Gestionnaires** : prendre en charge et étudier les dossiers, rendre un avis
- **Directeur Général (DG)** : validation finale des dossiers approuvés par les gestionnaires
- Simulateur de mensualité intégré
- Workflow complet : `En attente → En étude → Approuvé gestionnaire → Approuvé/Refusé DG`

## Installation

```bash
pip install -r requirements.txt
python3 app.py
```

L'application est disponible sur http://localhost:5000

## Comptes de démonstration

| Email | Rôle | Mot de passe |
|---|---|---|
| client@demo.com | Client | demo1234 |
| client2@demo.com | Client | demo1234 |
| gestionnaire@demo.com | Gestionnaire | demo1234 |
| dg@demo.com | Directeur Général | demo1234 |

## Stack technique

- **Backend** : Python / Flask / Flask-SQLAlchemy / Flask-Login
- **Base de données** : SQLite (`pretbancaire.db`)
- **Frontend** : Bootstrap 5 / Bootstrap Icons

