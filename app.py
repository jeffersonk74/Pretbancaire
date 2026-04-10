import os
from datetime import datetime, date, timezone
from urllib.parse import urlsplit
from flask import Flask, render_template, redirect, url_for, flash, request, abort
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager, UserMixin, login_user, logout_user,
    login_required, current_user
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'pretbancaire-secret-key-2024')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pretbancaire.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
login_manager.login_message_category = 'warning'

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='client')  # client | gestionnaire | dg
    date_creation = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    actif = db.Column(db.Boolean, default=True)

    prets = db.relationship('Pret', back_populates='client', foreign_keys='Pret.client_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

    def __repr__(self):
        return f'<User {self.email}>'


class Pret(db.Model):
    __tablename__ = 'prets'
    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Informations du prêt
    montant = db.Column(db.Float, nullable=False)
    duree_mois = db.Column(db.Integer, nullable=False)
    taux_interet = db.Column(db.Float, nullable=False, default=5.0)
    objet = db.Column(db.String(200), nullable=False)
    type_pret = db.Column(db.String(50), nullable=False)  # immobilier | consommation | professionnel | auto
    description = db.Column(db.Text)

    # Statut
    statut = db.Column(db.String(30), nullable=False, default='en_attente')
    # en_attente | en_etude | approuve_gestionnaire | refuse_gestionnaire | approuve | refuse

    # Dates
    date_demande = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_mise_a_jour = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    date_decision = db.Column(db.DateTime)

    # Traitement gestionnaire
    gestionnaire_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    commentaire_gestionnaire = db.Column(db.Text)
    date_etude = db.Column(db.DateTime)

    # Décision DG
    dg_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    commentaire_dg = db.Column(db.Text)
    date_decision_dg = db.Column(db.DateTime)

    client = db.relationship('User', back_populates='prets', foreign_keys=[client_id])
    gestionnaire = db.relationship('User', foreign_keys=[gestionnaire_id])
    dg = db.relationship('User', foreign_keys=[dg_id])

    @property
    def mensualite(self):
        if self.taux_interet == 0:
            return self.montant / self.duree_mois
        r = (self.taux_interet / 100) / 12
        n = self.duree_mois
        return self.montant * r * (1 + r) ** n / ((1 + r) ** n - 1)

    @property
    def cout_total(self):
        return self.mensualite * self.duree_mois

    @property
    def statut_libelle(self):
        libelles = {
            'en_attente': 'En attente',
            'en_etude': 'En cours d\'étude',
            'approuve_gestionnaire': 'Approuvé (gestionnaire)',
            'refuse_gestionnaire': 'Refusé (gestionnaire)',
            'approuve': 'Approuvé',
            'refuse': 'Refusé',
        }
        return libelles.get(self.statut, self.statut)

    @property
    def statut_badge(self):
        badges = {
            'en_attente': 'warning',
            'en_etude': 'info',
            'approuve_gestionnaire': 'primary',
            'refuse_gestionnaire': 'danger',
            'approuve': 'success',
            'refuse': 'danger',
        }
        return badges.get(self.statut, 'secondary')

    def __repr__(self):
        return f'<Pret {self.numero}>'


# ---------------------------------------------------------------------------
# Login manager
# ---------------------------------------------------------------------------

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def generate_numero_pret():
    count = Pret.query.count() + 1
    return f"PRB-{date.today().year}-{count:05d}"


def role_required(*roles):
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ---------------------------------------------------------------------------
# Routes — Authentication
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password) and user.actif:
            login_user(user)
            next_page = request.args.get('next')
            # Only redirect to relative URLs to prevent open redirect
            if next_page and urlsplit(next_page).netloc:
                next_page = None
            flash(f'Bienvenue, {user.prenom} !', 'success')
            return redirect(next_page or url_for('dashboard'))
        flash('Email ou mot de passe incorrect.', 'danger')
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté.', 'info')
    return redirect(url_for('login'))


# ---------------------------------------------------------------------------
# Routes — Dashboard
# ---------------------------------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'client':
        return redirect(url_for('client_dashboard'))
    elif current_user.role == 'gestionnaire':
        return redirect(url_for('gestionnaire_dashboard'))
    elif current_user.role == 'dg':
        return redirect(url_for('dg_dashboard'))
    abort(403)


@app.route('/client/dashboard')
@login_required
@role_required('client')
def client_dashboard():
    prets = Pret.query.filter_by(client_id=current_user.id).order_by(Pret.date_demande.desc()).all()
    stats = {
        'total': len(prets),
        'en_attente': sum(1 for p in prets if p.statut in ('en_attente', 'en_etude')),
        'approuves': sum(1 for p in prets if p.statut == 'approuve'),
        'refuses': sum(1 for p in prets if p.statut in ('refuse', 'refuse_gestionnaire')),
    }
    return render_template('client/dashboard.html', prets=prets, stats=stats)


@app.route('/gestionnaire/dashboard')
@login_required
@role_required('gestionnaire')
def gestionnaire_dashboard():
    en_attente = Pret.query.filter_by(statut='en_attente').order_by(Pret.date_demande).all()
    en_etude = Pret.query.filter_by(gestionnaire_id=current_user.id, statut='en_etude').order_by(Pret.date_demande).all()
    traites = Pret.query.filter(
        Pret.gestionnaire_id == current_user.id,
        Pret.statut.in_(['approuve_gestionnaire', 'refuse_gestionnaire', 'approuve', 'refuse'])
    ).order_by(Pret.date_etude.desc()).limit(10).all()
    stats = {
        'en_attente': Pret.query.filter_by(statut='en_attente').count(),
        'en_etude': Pret.query.filter_by(statut='en_etude').count(),
        'approuves_total': Pret.query.filter_by(statut='approuve').count(),
        'refuses_total': Pret.query.filter(Pret.statut.in_(['refuse', 'refuse_gestionnaire'])).count(),
    }
    return render_template('gestionnaire/dashboard.html',
                           en_attente=en_attente, en_etude=en_etude,
                           traites=traites, stats=stats)


@app.route('/dg/dashboard')
@login_required
@role_required('dg')
def dg_dashboard():
    a_valider = Pret.query.filter_by(statut='approuve_gestionnaire').order_by(Pret.date_etude).all()
    recents = Pret.query.filter(
        Pret.dg_id == current_user.id
    ).order_by(Pret.date_decision_dg.desc()).limit(10).all()
    stats = {
        'a_valider': Pret.query.filter_by(statut='approuve_gestionnaire').count(),
        'approuves': Pret.query.filter_by(statut='approuve').count(),
        'refuses': Pret.query.filter(Pret.statut.in_(['refuse', 'refuse_gestionnaire'])).count(),
        'en_cours': Pret.query.filter(Pret.statut.in_(['en_attente', 'en_etude'])).count(),
    }
    return render_template('dg/dashboard.html', a_valider=a_valider, recents=recents, stats=stats)


# ---------------------------------------------------------------------------
# Routes — Client: Demandes de prêt
# ---------------------------------------------------------------------------

@app.route('/client/pret/nouveau', methods=['GET', 'POST'])
@login_required
@role_required('client')
def nouveau_pret():
    if request.method == 'POST':
        try:
            montant = float(request.form['montant'])
            duree_mois = int(request.form['duree_mois'])
            taux = float(request.form.get('taux_interet', 5.0))
            objet = request.form['objet'].strip()
            type_pret = request.form['type_pret']
            description = request.form.get('description', '').strip()

            if montant <= 0 or duree_mois <= 0:
                flash('Le montant et la durée doivent être positifs.', 'danger')
                return render_template('client/nouveau_pret.html')

            pret = Pret(
                numero=generate_numero_pret(),
                client_id=current_user.id,
                montant=montant,
                duree_mois=duree_mois,
                taux_interet=taux,
                objet=objet,
                type_pret=type_pret,
                description=description,
            )
            db.session.add(pret)
            db.session.commit()
            flash(f'Votre demande de prêt {pret.numero} a été soumise avec succès.', 'success')
            return redirect(url_for('client_dashboard'))
        except (ValueError, KeyError):
            flash('Données invalides. Veuillez vérifier le formulaire.', 'danger')
    return render_template('client/nouveau_pret.html')


@app.route('/client/pret/<int:pret_id>')
@login_required
@role_required('client')
def client_pret_detail(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    if pret.client_id != current_user.id:
        abort(403)
    return render_template('client/pret_detail.html', pret=pret)


# ---------------------------------------------------------------------------
# Routes — Gestionnaire
# ---------------------------------------------------------------------------

@app.route('/gestionnaire/pret/<int:pret_id>')
@login_required
@role_required('gestionnaire')
def gestionnaire_pret_detail(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    return render_template('gestionnaire/pret_detail.html', pret=pret)


@app.route('/gestionnaire/pret/<int:pret_id>/prendre_en_charge', methods=['POST'])
@login_required
@role_required('gestionnaire')
def prendre_en_charge(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    if pret.statut != 'en_attente':
        flash('Ce prêt ne peut pas être pris en charge.', 'warning')
        return redirect(url_for('gestionnaire_dashboard'))
    pret.statut = 'en_etude'
    pret.gestionnaire_id = current_user.id
    pret.date_etude = datetime.now(timezone.utc)
    pret.date_mise_a_jour = datetime.now(timezone.utc)
    db.session.commit()
    flash(f'Prêt {pret.numero} pris en charge.', 'success')
    return redirect(url_for('gestionnaire_pret_detail', pret_id=pret.id))


@app.route('/gestionnaire/pret/<int:pret_id>/decision', methods=['POST'])
@login_required
@role_required('gestionnaire')
def gestionnaire_decision(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    if pret.gestionnaire_id != current_user.id or pret.statut != 'en_etude':
        flash('Action non autorisée.', 'danger')
        return redirect(url_for('gestionnaire_dashboard'))
    decision = request.form.get('decision')
    commentaire = request.form.get('commentaire', '').strip()
    if decision == 'approuver':
        pret.statut = 'approuve_gestionnaire'
        flash(f'Prêt {pret.numero} approuvé. En attente de validation DG.', 'success')
    elif decision == 'refuser':
        pret.statut = 'refuse_gestionnaire'
        pret.date_decision = datetime.now(timezone.utc)
        flash(f'Prêt {pret.numero} refusé.', 'warning')
    else:
        flash('Décision invalide.', 'danger')
        return redirect(url_for('gestionnaire_pret_detail', pret_id=pret.id))
    pret.commentaire_gestionnaire = commentaire
    pret.date_mise_a_jour = datetime.now(timezone.utc)
    db.session.commit()
    return redirect(url_for('gestionnaire_dashboard'))


# ---------------------------------------------------------------------------
# Routes — DG
# ---------------------------------------------------------------------------

@app.route('/dg/pret/<int:pret_id>')
@login_required
@role_required('dg')
def dg_pret_detail(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    return render_template('dg/pret_detail.html', pret=pret)


@app.route('/dg/pret/<int:pret_id>/decision', methods=['POST'])
@login_required
@role_required('dg')
def dg_decision(pret_id):
    pret = Pret.query.get_or_404(pret_id)
    if pret.statut != 'approuve_gestionnaire':
        flash('Ce prêt ne peut pas être traité.', 'warning')
        return redirect(url_for('dg_dashboard'))
    decision = request.form.get('decision')
    commentaire = request.form.get('commentaire', '').strip()
    if decision == 'approuver':
        pret.statut = 'approuve'
        flash(f'Prêt {pret.numero} approuvé définitivement.', 'success')
    elif decision == 'refuser':
        pret.statut = 'refuse'
        flash(f'Prêt {pret.numero} refusé.', 'warning')
    else:
        flash('Décision invalide.', 'danger')
        return redirect(url_for('dg_pret_detail', pret_id=pret.id))
    pret.dg_id = current_user.id
    pret.commentaire_dg = commentaire
    pret.date_decision = datetime.now(timezone.utc)
    pret.date_decision_dg = datetime.now(timezone.utc)
    pret.date_mise_a_jour = datetime.now(timezone.utc)
    db.session.commit()
    return redirect(url_for('dg_dashboard'))


# ---------------------------------------------------------------------------
# Routes — Tous les rôles: liste complète
# ---------------------------------------------------------------------------

@app.route('/prets')
@login_required
def liste_prets():
    if current_user.role == 'client':
        return redirect(url_for('client_dashboard'))
    prets = Pret.query.order_by(Pret.date_demande.desc()).all()
    return render_template('liste_prets.html', prets=prets)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(403)
def forbidden(e):
    return render_template('errors/403.html'), 403


@app.errorhandler(404)
def not_found(e):
    return render_template('errors/404.html'), 404


# ---------------------------------------------------------------------------
# Database seeding
# ---------------------------------------------------------------------------

def seed_database():
    if User.query.count() > 0:
        return

    users = [
        User(nom='Dupont', prenom='Jean', email='client@demo.com', role='client'),
        User(nom='Martin', prenom='Sophie', email='client2@demo.com', role='client'),
        User(nom='Bernard', prenom='Pierre', email='gestionnaire@demo.com', role='gestionnaire'),
        User(nom='Directeur', prenom='Marie', email='dg@demo.com', role='dg'),
    ]
    for u in users:
        u.set_password('demo1234')
        db.session.add(u)
    db.session.flush()

    client1 = users[0]
    client2 = users[1]

    prets = [
        Pret(
            numero='PRB-2024-00001',
            client_id=client1.id,
            montant=15000,
            duree_mois=36,
            taux_interet=4.5,
            objet='Achat véhicule',
            type_pret='auto',
            statut='en_attente',
        ),
        Pret(
            numero='PRB-2024-00002',
            client_id=client1.id,
            montant=50000,
            duree_mois=120,
            taux_interet=3.2,
            objet='Rénovation appartement',
            type_pret='immobilier',
            statut='approuve',
        ),
        Pret(
            numero='PRB-2024-00003',
            client_id=client2.id,
            montant=8000,
            duree_mois=24,
            taux_interet=5.5,
            objet='Financement formation professionnelle',
            type_pret='professionnel',
            statut='en_etude',
            gestionnaire_id=users[2].id,
        ),
        Pret(
            numero='PRB-2024-00004',
            client_id=client2.id,
            montant=200000,
            duree_mois=240,
            taux_interet=2.8,
            objet='Achat résidence principale',
            type_pret='immobilier',
            statut='approuve_gestionnaire',
            gestionnaire_id=users[2].id,
            commentaire_gestionnaire='Dossier solide, revenus stables.',
        ),
    ]
    for p in prets:
        db.session.add(p)
    db.session.commit()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_database()
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug, host='0.0.0.0', port=5000)
