import os
import json
from datetime import datetime, date, timedelta
from functools import wraps
from dateutil.relativedelta import relativedelta

from flask import (Flask, render_template, redirect, url_for, request,
                   flash, abort, jsonify, send_from_directory)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (LoginManager, login_user, logout_user,
                         login_required, current_user)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# App configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'pretbancaire-secret-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'pretbancaire.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
login_manager.login_message_category = 'warning'

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='client')  # client | gestionnaire | dg
    balance = db.Column(db.Float, default=0.0)
    sector = db.Column(db.String(30), default='prive')  # prive | public
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    loans = db.relationship('LoanRequest', backref='client', lazy=True,
                            foreign_keys='LoanRequest.client_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # Flask-Login interface
    def get_id(self):
        return str(self.id)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class LoanSettings(db.Model):
    __tablename__ = 'loan_settings'
    id = db.Column(db.Integer, primary_key=True)
    interest_rate = db.Column(db.Float, default=5.0)      # percentage per year
    min_amount = db.Column(db.Float, default=10000.0)
    max_amount = db.Column(db.Float, default=5000000.0)
    late_penalty_rate = db.Column(db.Float, default=2.0)  # % penalty on overdue installment
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)


# Loan statuses (ordered workflow)
STATUS_PENDING_MANAGER = 'en_attente_gestionnaire'
STATUS_PENDING_DG = 'en_attente_dg'
STATUS_APPROVED = 'approuve'
STATUS_REJECTED = 'rejete'
STATUS_ACTIVE = 'actif'
STATUS_CLOSED = 'cloture'

STATUS_LABELS = {
    STATUS_PENDING_MANAGER: 'En attente de gestionnaire',
    STATUS_PENDING_DG: 'En attente DG',
    STATUS_APPROVED: 'Approuvé',
    STATUS_REJECTED: 'Rejeté',
    STATUS_ACTIVE: 'Prêt Actif',
    STATUS_CLOSED: 'Clôturé',
}


class LoanRequest(db.Model):
    __tablename__ = 'loan_request'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    loan_type = db.Column(db.String(50), default='scolaire')
    amount = db.Column(db.Float, nullable=False)
    duration_months = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    sector = db.Column(db.String(30), default='prive')
    status = db.Column(db.String(40), default=STATUS_PENDING_MANAGER)
    gestionnaire_note = db.Column(db.Text, nullable=True)
    dg_note = db.Column(db.Text, nullable=True)
    interest_rate = db.Column(db.Float, nullable=True)   # rate snapshotted at creation
    monthly_payment = db.Column(db.Float, nullable=True)
    total_repayment = db.Column(db.Float, nullable=True)
    dg_signature = db.Column(db.String(200), nullable=True)
    disbursed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    has_overdue = db.Column(db.Boolean, default=False)

    documents = db.relationship('Document', backref='loan', lazy=True, cascade='all, delete-orphan')
    installments = db.relationship('Installment', backref='loan', lazy=True,
                                   order_by='Installment.due_date', cascade='all, delete-orphan')

    @property
    def status_label(self):
        return STATUS_LABELS.get(self.status, self.status)


class Document(db.Model):
    __tablename__ = 'document'
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey('loan_request.id'), nullable=False)
    doc_type = db.Column(db.String(50), nullable=False)  # photo | identite | contrat | arrete
    filename = db.Column(db.String(256), nullable=False)
    original_name = db.Column(db.String(256), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)


# Installment statuses
INST_UNPAID = 'non_paye'
INST_PAID = 'paye'
INST_OVERDUE = 'en_retard'

INST_LABELS = {
    INST_UNPAID: 'Non payé',
    INST_PAID: 'Payé',
    INST_OVERDUE: 'En retard',
}


class Installment(db.Model):
    __tablename__ = 'installment'
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey('loan_request.id'), nullable=False)
    installment_number = db.Column(db.Integer, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    penalty = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default=INST_UNPAID)
    paid_at = db.Column(db.DateTime, nullable=True)

    @property
    def total_due(self):
        return self.amount + self.penalty

    @property
    def status_label(self):
        return INST_LABELS.get(self.status, self.status)


class Notification(db.Model):
    __tablename__ = 'notification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    loan_id = db.Column(db.Integer, db.ForeignKey('loan_request.id'), nullable=True)


# ---------------------------------------------------------------------------
# Flask-Login loader
# ---------------------------------------------------------------------------
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_settings():
    s = LoanSettings.query.first()
    if s is None:
        s = LoanSettings()
        db.session.add(s)
        db.session.commit()
    return s


def calculate_monthly_payment(principal, annual_rate, months):
    """Standard annuity formula."""
    if annual_rate == 0:
        return principal / months
    r = annual_rate / 100 / 12
    return principal * r * (1 + r) ** months / ((1 + r) ** months - 1)


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated
    return decorator


def notify(user_id, message, loan_id=None):
    notif = Notification(user_id=user_id, message=message, loan_id=loan_id)
    db.session.add(notif)


def unread_count():
    if current_user.is_authenticated:
        return Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return 0


app.jinja_env.globals['unread_count'] = unread_count
app.jinja_env.globals['now'] = datetime.utcnow


# ---------------------------------------------------------------------------
# Authentication routes
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
        if user and user.check_password(password):
            login_user(user)
            flash(f'Bienvenue, {user.name} !', 'success')
            return redirect(url_for('dashboard'))
        flash('Email ou mot de passe incorrect.', 'danger')
    return render_template('auth/login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        sector = request.form.get('sector', 'prive')
        if not name or not email or not password:
            flash('Tous les champs sont obligatoires.', 'danger')
        elif User.query.filter_by(email=email).first():
            flash('Cet email est déjà utilisé.', 'danger')
        else:
            user = User(name=name, email=email, role='client', sector=sector, balance=0.0)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            flash('Compte créé avec succès !', 'success')
            return redirect(url_for('dashboard'))
    return render_template('auth/register.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Vous avez été déconnecté.', 'info')
    return redirect(url_for('login'))


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


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
@app.route('/notifications')
@login_required
def notifications():
    notifs = (Notification.query
              .filter_by(user_id=current_user.id)
              .order_by(Notification.created_at.desc())
              .all())
    # Mark all as read
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return render_template('notifications.html', notifications=notifs)


# ---------------------------------------------------------------------------
# CLIENT routes
# ---------------------------------------------------------------------------
@app.route('/client/dashboard')
@login_required
@role_required('client')
def client_dashboard():
    loans = LoanRequest.query.filter_by(client_id=current_user.id).order_by(
        LoanRequest.created_at.desc()).all()
    # Check overdue on active loans
    _check_overdue()
    active_loans = [l for l in loans if l.status == STATUS_ACTIVE]
    return render_template('client/dashboard.html', loans=loans, active_loans=active_loans)


@app.route('/client/loan/new', methods=['GET', 'POST'])
@login_required
@role_required('client')
def client_loan_new():
    settings = get_settings()
    if request.method == 'POST':
        amount = request.form.get('amount', type=float)
        duration = request.form.get('duration', type=int)
        reason = request.form.get('reason', '').strip()
        sector = request.form.get('sector', current_user.sector)

        errors = []
        if not amount or amount < settings.min_amount or amount > settings.max_amount:
            errors.append(f'Le montant doit être entre {settings.min_amount:,.0f} et {settings.max_amount:,.0f} FCFA.')
        if not duration or duration < 1 or duration > 120:
            errors.append('La durée doit être entre 1 et 120 mois.')
        if not reason:
            errors.append('Le motif est obligatoire.')

        # File validation
        photo = request.files.get('photo')
        identite = request.files.get('identite')
        contrat_travail = request.files.get('contrat_travail') if sector == 'prive' else None
        arrete = request.files.get('arrete') if sector == 'public' else None

        if not photo or not allowed_file(photo.filename):
            errors.append('La photo est obligatoire (jpg, png, gif).')
        if not identite or not allowed_file(identite.filename):
            errors.append("La pièce d'identité/passeport est obligatoire.")
        if sector == 'prive' and (not contrat_travail or not allowed_file(contrat_travail.filename)):
            errors.append('Le contrat de travail est obligatoire pour le secteur privé.')
        if sector == 'public' and (not arrete or not allowed_file(arrete.filename)):
            errors.append("L'arrêté d'intégration est obligatoire pour le secteur public.")

        if errors:
            for e in errors:
                flash(e, 'danger')
            return render_template('client/loan_form.html', settings=settings, sector=sector)

        # Calculate financials
        monthly = calculate_monthly_payment(amount, settings.interest_rate, duration)
        total = monthly * duration

        loan = LoanRequest(
            client_id=current_user.id,
            loan_type='scolaire',
            amount=amount,
            duration_months=duration,
            reason=reason,
            sector=sector,
            status=STATUS_PENDING_MANAGER,
            interest_rate=settings.interest_rate,
            monthly_payment=round(monthly, 2),
            total_repayment=round(total, 2),
        )
        db.session.add(loan)
        db.session.flush()  # get loan.id

        # Save documents
        def save_doc(file_obj, doc_type):
            fname = secure_filename(f"{loan.id}_{doc_type}_{file_obj.filename}")
            path = os.path.join(app.config['UPLOAD_FOLDER'], fname)
            file_obj.save(path)
            doc = Document(loan_id=loan.id, doc_type=doc_type,
                           filename=fname, original_name=file_obj.filename)
            db.session.add(doc)

        save_doc(photo, 'photo')
        save_doc(identite, 'identite')
        if sector == 'prive' and contrat_travail:
            save_doc(contrat_travail, 'contrat_travail')
        if sector == 'public' and arrete:
            save_doc(arrete, 'arrete')

        # Notify gestionnaires
        gestionnaires = User.query.filter_by(role='gestionnaire').all()
        for g in gestionnaires:
            notify(g.id, f'Nouvelle demande de prêt #{loan.id} de {current_user.name}.', loan.id)

        db.session.commit()
        flash('Votre demande de prêt a été soumise avec succès !', 'success')
        return redirect(url_for('client_loan_detail', loan_id=loan.id))

    sector = current_user.sector
    return render_template('client/loan_form.html', settings=settings, sector=sector)


@app.route('/client/loan/<int:loan_id>')
@login_required
@role_required('client')
def client_loan_detail(loan_id):
    loan = LoanRequest.query.filter_by(id=loan_id, client_id=current_user.id).first_or_404()
    _check_overdue()
    return render_template('client/loan_detail.html', loan=loan)


@app.route('/client/loan/<int:loan_id>/pay/<int:installment_id>', methods=['POST'])
@login_required
@role_required('client')
def client_pay_installment(loan_id, installment_id):
    loan = LoanRequest.query.filter_by(id=loan_id, client_id=current_user.id).first_or_404()
    inst = Installment.query.filter_by(id=installment_id, loan_id=loan_id).first_or_404()
    if inst.status == INST_PAID:
        flash('Cette échéance est déjà payée.', 'info')
    else:
        inst.status = INST_PAID
        inst.paid_at = datetime.utcnow()
        # Check if all installments paid → close loan
        unpaid = Installment.query.filter_by(loan_id=loan_id).filter(
            Installment.status != INST_PAID).count()
        if unpaid == 0:
            loan.status = STATUS_CLOSED
            notify(current_user.id, f'Félicitations ! Votre prêt #{loan_id} est entièrement remboursé.', loan_id)
        db.session.commit()
        flash('Paiement enregistré avec succès !', 'success')
    return redirect(url_for('client_loan_detail', loan_id=loan_id))


# ---------------------------------------------------------------------------
# GESTIONNAIRE routes
# ---------------------------------------------------------------------------
@app.route('/gestionnaire/dashboard')
@login_required
@role_required('gestionnaire')
def gestionnaire_dashboard():
    _check_overdue()
    pending = LoanRequest.query.filter_by(status=STATUS_PENDING_MANAGER).order_by(
        LoanRequest.created_at.desc()).all()
    approved = LoanRequest.query.filter_by(status=STATUS_APPROVED).order_by(
        LoanRequest.created_at.desc()).all()
    active = LoanRequest.query.filter_by(status=STATUS_ACTIVE).order_by(
        LoanRequest.created_at.desc()).all()
    overdue_loans = LoanRequest.query.filter_by(status=STATUS_ACTIVE, has_overdue=True).all()
    return render_template('gestionnaire/dashboard.html',
                           pending=pending, approved=approved,
                           active=active, overdue_loans=overdue_loans)


@app.route('/gestionnaire/loan/<int:loan_id>')
@login_required
@role_required('gestionnaire')
def gestionnaire_loan_detail(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    return render_template('gestionnaire/loan_detail.html', loan=loan)


@app.route('/gestionnaire/loan/<int:loan_id>/approve', methods=['POST'])
@login_required
@role_required('gestionnaire')
def gestionnaire_approve(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    if loan.status != STATUS_PENDING_MANAGER:
        flash('Action non autorisée sur ce dossier.', 'danger')
        return redirect(url_for('gestionnaire_loan_detail', loan_id=loan_id))
    loan.status = STATUS_PENDING_DG
    notify(loan.client_id, f'Votre dossier #{loan_id} a été transmis au Directeur Général.', loan_id)
    # Notify DGs
    for dg in User.query.filter_by(role='dg').all():
        notify(dg.id, f'Dossier #{loan_id} de {loan.client.name} à approuver.', loan_id)
    db.session.commit()
    flash('Dossier transmis au DG avec succès.', 'success')
    return redirect(url_for('gestionnaire_dashboard'))


@app.route('/gestionnaire/loan/<int:loan_id>/reject', methods=['POST'])
@login_required
@role_required('gestionnaire')
def gestionnaire_reject(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    if loan.status not in (STATUS_PENDING_MANAGER, STATUS_PENDING_DG):
        flash('Action non autorisée sur ce dossier.', 'danger')
        return redirect(url_for('gestionnaire_loan_detail', loan_id=loan_id))
    note = request.form.get('note', '').strip()
    if not note:
        flash('Une note explicative est obligatoire pour le rejet.', 'danger')
        return redirect(url_for('gestionnaire_loan_detail', loan_id=loan_id))
    loan.status = STATUS_REJECTED
    loan.gestionnaire_note = note
    notify(loan.client_id,
           f'Votre demande #{loan_id} a été rejetée. Motif : {note}', loan_id)
    db.session.commit()
    flash('Dossier rejeté.', 'warning')
    return redirect(url_for('gestionnaire_dashboard'))


@app.route('/gestionnaire/loan/<int:loan_id>/disburse', methods=['POST'])
@login_required
@role_required('gestionnaire')
def gestionnaire_disburse(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    if loan.status != STATUS_APPROVED:
        flash('Le prêt doit être approuvé par le DG avant décaissement.', 'danger')
        return redirect(url_for('gestionnaire_loan_detail', loan_id=loan_id))
    loan.status = STATUS_ACTIVE
    loan.disbursed_at = datetime.utcnow()
    # Credit client balance
    loan.client.balance += loan.amount
    # Generate installments (one per calendar month from disbursement date)
    start_date = date.today()
    for i in range(1, loan.duration_months + 1):
        due = start_date + relativedelta(months=i)
        inst = Installment(
            loan_id=loan.id,
            installment_number=i,
            due_date=due,
            amount=loan.monthly_payment,
        )
        db.session.add(inst)
    notify(loan.client_id,
           f'Votre prêt #{loan_id} de {loan.amount:,.0f} FCFA a été décaissé ! '
           f'Consultez votre échéancier.', loan_id)
    db.session.commit()
    flash(f'Prêt #{loan_id} décaissé avec succès. Montant crédité au client.', 'success')
    return redirect(url_for('gestionnaire_dashboard'))


# ---------------------------------------------------------------------------
# DG routes
# ---------------------------------------------------------------------------
@app.route('/dg/dashboard')
@login_required
@role_required('dg')
def dg_dashboard():
    _check_overdue()
    pending = LoanRequest.query.filter_by(status=STATUS_PENDING_DG).order_by(
        LoanRequest.created_at.desc()).all()
    approved = LoanRequest.query.filter_by(status=STATUS_APPROVED).order_by(
        LoanRequest.created_at.desc()).all()
    return render_template('dg/dashboard.html', pending=pending, approved=approved)


@app.route('/dg/loan/<int:loan_id>')
@login_required
@role_required('dg')
def dg_loan_detail(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    return render_template('dg/loan_detail.html', loan=loan)


@app.route('/dg/loan/<int:loan_id>/approve', methods=['POST'])
@login_required
@role_required('dg')
def dg_approve(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    if loan.status != STATUS_PENDING_DG:
        flash('Action non autorisée sur ce dossier.', 'danger')
        return redirect(url_for('dg_loan_detail', loan_id=loan_id))
    loan.status = STATUS_APPROVED
    # UTC timestamp is used for audit trail consistency across timezones
    loan.dg_signature = f"Approuvé électroniquement par {current_user.name} le {datetime.utcnow().strftime('%d/%m/%Y à %H:%M')} UTC"
    notify(loan.client_id,
           f'Félicitations ! Votre demande #{loan_id} a été approuvée par le DG.', loan_id)
    # Notify gestionnaires
    for g in User.query.filter_by(role='gestionnaire').all():
        notify(g.id, f'Dossier #{loan_id} approuvé par le DG. Procéder au décaissement.', loan_id)
    db.session.commit()
    flash('Dossier approuvé et signé électroniquement.', 'success')
    return redirect(url_for('dg_dashboard'))


@app.route('/dg/loan/<int:loan_id>/reject', methods=['POST'])
@login_required
@role_required('dg')
def dg_reject(loan_id):
    loan = LoanRequest.query.get_or_404(loan_id)
    if loan.status != STATUS_PENDING_DG:
        flash('Action non autorisée sur ce dossier.', 'danger')
        return redirect(url_for('dg_loan_detail', loan_id=loan_id))
    note = request.form.get('note', '').strip()
    if not note:
        flash('Une note explicative est obligatoire pour le rejet.', 'danger')
        return redirect(url_for('dg_loan_detail', loan_id=loan_id))
    loan.status = STATUS_REJECTED
    loan.dg_note = note
    notify(loan.client_id,
           f'Votre demande #{loan_id} a été rejetée par le DG. Motif : {note}', loan_id)
    # Notify gestionnaires
    for g in User.query.filter_by(role='gestionnaire').all():
        notify(g.id, f'Dossier #{loan_id} rejeté par le DG. Note : {note}', loan_id)
    db.session.commit()
    flash('Dossier rejeté.', 'warning')
    return redirect(url_for('dg_dashboard'))


@app.route('/dg/settings', methods=['GET', 'POST'])
@login_required
@role_required('dg')
def dg_settings():
    settings = get_settings()
    if request.method == 'POST':
        try:
            settings.interest_rate = float(request.form['interest_rate'])
            settings.min_amount = float(request.form['min_amount'])
            settings.max_amount = float(request.form['max_amount'])
            settings.late_penalty_rate = float(request.form['late_penalty_rate'])
            settings.updated_at = datetime.utcnow()
            settings.updated_by = current_user.id
            db.session.commit()
            flash('Paramètres mis à jour avec succès.', 'success')
        except (ValueError, KeyError):
            flash('Valeurs invalides.', 'danger')
        return redirect(url_for('dg_settings'))
    return render_template('dg/settings.html', settings=settings)


# ---------------------------------------------------------------------------
# File serving
# ---------------------------------------------------------------------------
@app.route('/uploads/<path:filename>')
@login_required
def uploaded_file(filename):
    # Only gestionnaire and dg can view files
    if current_user.role not in ('gestionnaire', 'dg'):
        abort(403)
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ---------------------------------------------------------------------------
# Overdue check (simulates cron job)
# ---------------------------------------------------------------------------
def _check_overdue():
    """Check all active loans for overdue installments and apply penalties."""
    today = date.today()
    settings = get_settings()
    active_loans = LoanRequest.query.filter_by(status=STATUS_ACTIVE).all()
    changed = False
    for loan in active_loans:
        overdue_found = False
        for inst in loan.installments:
            if inst.status == INST_UNPAID and inst.due_date < today:
                inst.status = INST_OVERDUE
                # Apply penalty if not already applied
                if inst.penalty == 0:
                    inst.penalty = round(inst.amount * settings.late_penalty_rate / 100, 2)
                overdue_found = True
                changed = True
        if overdue_found and not loan.has_overdue:
            loan.has_overdue = True
            # Notify client
            notify(loan.client_id,
                   f'⚠️ Votre prêt #{loan.id} a des échéances en retard. '
                   f'Des pénalités ont été appliquées.', loan.id)
            # Notify gestionnaires
            for g in User.query.filter_by(role='gestionnaire').all():
                notify(g.id,
                       f'⚠️ Prêt #{loan.id} de {loan.client.name} est en retard de paiement.',
                       loan.id)
            changed = True
        elif not overdue_found:
            loan.has_overdue = False
    if changed:
        db.session.commit()


@app.route('/api/check-overdue', methods=['POST'])
@login_required
@role_required('gestionnaire', 'dg')
def api_check_overdue():
    """Manual trigger for overdue check (simulates cron)."""
    _check_overdue()
    return jsonify({'status': 'ok', 'message': 'Vérification des retards effectuée.'})


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
# Database initialization & seed
# ---------------------------------------------------------------------------
def init_db():
    with app.app_context():
        db.create_all()
        # Create default settings
        if not LoanSettings.query.first():
            db.session.add(LoanSettings())
            db.session.commit()
        # Seed demo users if none exist
        if not User.query.first():
            users = [
                ('Client Privé', 'client.prive@pretbank.com', 'Password123!!', 'client', 'prive'),
                ('Client Public', 'client.public@pretbank.com', 'Password123!!', 'client', 'public'),
                ('Gestionnaire', 'gestionnaire@pretbank.com', 'Password123!!', 'gestionnaire', 'prive'),
                ('Directeur Général', 'dg@pretbank.com', 'Password123!!', 'dg', 'prive'),
            ]
            for name, email, pw, role, sector in users:
                u = User(name=name, email=email, role=role, sector=sector)
                u.set_password(pw)
                db.session.add(u)
            db.session.commit()
            print('✅ Demo users created (password: Password123!!)')


if __name__ == '__main__':
    init_db()
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
