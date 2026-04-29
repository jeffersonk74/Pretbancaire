import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';
import { addMonths } from 'date-fns';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Dossier uploads créé');
}

const prisma = new PrismaClient();
const app = express();
const port = 3001;

// CORS configuré pour accepter toutes les origines (réseau local)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Utilise le chemin absolu
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Auth
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (user && user.password === password) {
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(401).json({ error: 'Identifiants invalides' });
  }
});

// Settings (DG)
app.get('/api/settings', async (req, res) => {
  const settings = await prisma.globalSettings.findMany();
  res.json(settings);
});

app.patch('/api/settings/:productName', async (req, res) => {
  const { productName } = req.params;
  const data = req.body;
  const setting = await prisma.globalSettings.update({
    where: { productName },
    data
  });
  res.json(setting);
});

// Loans
app.get('/api/loans', async (req, res) => {
  const { userId, role } = req.query;
  let loans;

  const include = { installments: true, user: true };

  if (role === 'CLIENT_PRIVE' || role === 'CLIENT_PUBLIC') {
    loans = await prisma.loan.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { requestDate: 'desc' },
      include
    });
  } else if (role === 'GESTIONNAIRE') {
    loans = await prisma.loan.findMany({
      orderBy: { requestDate: 'desc' },
      include
    });
  } else if (role === 'DG') {
    loans = await prisma.loan.findMany({
      where: { status: { in: ['PENDING_DG', 'APPROVED', 'DISBURSED', 'REJECTED'] } },
      orderBy: { requestDate: 'desc' },
      include
    });
  }

  res.json(loans || []);
});

// Route de test pour vérifier la connexion
app.post('/api/test', (req, res) => {
  console.log('=== TEST ROUTE RECEIVED ===');
  res.json({ message: 'Test route works!' });
});

app.post('/api/loans', upload.any(), async (req, res) => {
  console.log('=== POST /api/loans RECEIVED ===');
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { userId, productName, amount, duration, motif, income, charges } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID Utilisateur manquant' });
    }

    const userIdInt = parseInt(userId);
    console.log('Parsed userId:', userIdInt);

    // Vérification stricte des limites de demandes
    const userLoans = await prisma.loan.findMany({
      where: { userId: userIdInt },
      include: { installments: true }
    });

    // Compter les prêts actifs (non remboursés et non rejetés)
    let activeLoans = [];
    let rejectedLoans = [];

    for (const loan of userLoans) {
      // Si REJECTED, ajouter à la liste des rejetés
      if (loan.status === 'REJECTED') {
        rejectedLoans.push(loan);
        continue;
      }

      // Si DISBURSED, vérifier s'il est totalement remboursé
      if (loan.status === 'DISBURSED') {
        const allPaid = loan.installments.length > 0 && loan.installments.every(inst => inst.status === 'PAID');
        if (!allPaid) {
          activeLoans.push(loan); // Toujours actif si pas tout payé
        }
        // Si tout payé, ne pas compter (libère la place)
        continue;
      }

      // Les autres statuts (PENDING_GESTIONNAIRE, PENDING_DG, APPROVED) sont toujours actifs
      if (['PENDING_GESTIONNAIRE', 'PENDING_DG', 'APPROVED'].includes(loan.status)) {
        activeLoans.push(loan);
      }
    }

    // Règle 1: Max 2 demandes actives
    if (activeLoans.length >= 2) {
      return res.status(403).json({
        error: 'Limite de demandes atteinte. Vous ne pouvez avoir que 2 demandes en cours simultanément. Attendez le remboursement total ou le traitement de vos demandes existantes.'
      });
    }

    // Règle 2: Gestion des remplacements après rejet (max 1 remplacement par rejet)
    let replacementTargetId = null;

    if (activeLoans.length === 1 && rejectedLoans.length > 0) {
      // Chercher un rejeté qui n'a pas encore été remplacé (replacementCount === 0)
      const replaceableLoan = rejectedLoans.find(l => l.replacementCount === 0);

      if (replaceableLoan) {
        replacementTargetId = replaceableLoan.id;
      }
      // Si tous les rejets ont déjà été remplacés, on autorise une nouvelle demande normale
      // (pas un remplacement) car il reste de la place dans le quota
    }

    // Règle 3: Si 1 actif et au moins 1 rejeté non remplacé → autoriser avec incrémentation du compteur
    // Si 0 actif et jusqu'à 2 rejets → autoriser (cas normal)
    // Si déjà 2 actifs → bloqué (géré plus haut)

    const uploadedFiles = req.files || [];
    console.log('Uploaded files count:', uploadedFiles.length);
    const fileUrls = uploadedFiles.map((file) => `http://localhost:3001/uploads/${file.filename}`);
    const documentUrl = fileUrls[0] || null;
    const contractUrl = fileUrls[1] || null;

    // Création du nouveau prêt (transaction pour garantir l'intégrité)
    const result = await prisma.$transaction(async (tx) => {
      // Si remplacement, incrémenter le compteur du prêt rejeté
      if (replacementTargetId) {
        await tx.loan.update({
          where: { id: replacementTargetId },
          data: { replacementCount: { increment: 1 } }
        });
      }

      // Créer le nouveau prêt
      const loan = await tx.loan.create({
        data: {
          userId: userIdInt,
          productName: productName || 'Prêt Sans Nom',
          amount: parseFloat(amount) || 0,
          duration: parseInt(duration) || 0,
          motif: motif || '',
          income: income ? parseFloat(income) : 0,
          charges: charges ? parseFloat(charges) : 0,
          status: 'PENDING_GESTIONNAIRE',
          documentUrl,
          contractUrl,
          documents: JSON.stringify(fileUrls),
          replacementCount: 0
        }
      });

      return loan;
    });

    res.json(result);
  } catch (err) {
    console.error('Create loan error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du dossier' });
  }
});

app.post('/api/loans/:id/read', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  const data = {};
  if (role === 'GESTIONNAIRE') {
    data.isReadByGestionnaire = true;
    data.readAtGestionnaire = new Date();
  } else if (role === 'DG') {
    data.isReadByDG = true;
    data.readAtDG = new Date();
  }

  const loan = await prisma.loan.update({
    where: { id: parseInt(id) },
    data,
    include: { user: true }
  });
  res.json(loan);
});

// Disbursement Logic
const generateInstallments = (loan, annualRate) => {
  const principal = loan.amount;
  const months = loan.duration;
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  
  const installments = [];
  let remainingBalance = principal;
  
  for (let i = 1; i <= months; i++) {
    const interest = remainingBalance * monthlyRate;
    const capital = monthlyPayment - interest;
    remainingBalance -= capital;
    
    installments.push({
      month: i,
      amount: monthlyPayment,
      dueDate: addMonths(new Date(), i),
      status: 'UNPAID',
      capital,
      interest,
      insurance: 0, // Simplified for now
      remainingBalance: Math.max(0, remainingBalance)
    });
  }
  return installments;
};

app.patch('/api/loans/:id', async (req, res) => {
  const { id } = req.params;
  const { status, rejectionNote } = req.body;
  
  const currentLoan = await prisma.loan.findUnique({ 
    where: { id: parseInt(id) },
    include: { user: true }
  });

  if (status === 'DISBURSED' && currentLoan.status === 'APPROVED') {
    // Generate installments on disbursement
    const setting = await prisma.globalSettings.findUnique({
      where: { productName: currentLoan.productName }
    });

    if (!setting) {
      return res.status(400).json({ error: `Paramètres globaux introuvables pour le produit ${currentLoan.productName}` });
    }

    const installmentData = generateInstallments(currentLoan, setting.rate || 12);

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: parseInt(id) },
        data: { status, isDisbursed: true }
      }),
      ...installmentData.map(data => prisma.installment.create({
        data: { ...data, loanId: parseInt(id) }
      }))
    ]);
  } else {
    await prisma.loan.update({
      where: { id: parseInt(id) },
      data: { status, rejectionNote }
    });
  }
  
  res.json({ success: true });
});

// Payments - Seul le GESTIONNAIRE peut valider un paiement
app.post('/api/installments/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Vérification stricte : seul GESTIONNAIRE peut payer
  if (role !== 'GESTIONNAIRE') {
    return res.status(403).json({ 
      error: 'Action non autorisée. Seul le Gestionnaire peut valider un paiement.' 
    });
  }

  const installment = await prisma.installment.update({
    where: { id: parseInt(id) },
    data: { 
      status: 'PAID',
      paymentDate: new Date()
    }
  });
  res.json(installment);
});

// Cron/Check Delay Mock
app.post('/api/check-delays', async (req, res) => {
  const now = new Date();
  const lateInstallments = await prisma.installment.findMany({
    where: {
      status: 'UNPAID',
      dueDate: { lt: now }
    }
  });

  for (const inst of lateInstallments) {
    const penalty = inst.amount * 0.05; // 5% penalty
    await prisma.installment.update({
      where: { id: inst.id },
      data: { 
        status: 'LATE',
        penalty
      }
    });
  }
  res.json({ updated: lateInstallments.length });
});

// Reset System (DG)
app.post('/api/reset-system', async (req, res) => {
  try {
    // Delete all installments
    await prisma.installment.deleteMany({});
    // Delete all loans
    await prisma.loan.deleteMany({});
    
    // Clear uploads folder
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = await fs.promises.readdir(uploadsDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        await fs.promises.unlink(path.join(uploadsDir, file));
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Erreur lors de la remise à zéro' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port} (accessible depuis le réseau local)`);
});
