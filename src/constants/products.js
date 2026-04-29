export const TARGETS = {
  CLIENT_PRIVE: 'CLIENT_PRIVE',
  CLIENT_PUBLIC: 'CLIENT_PUBLIC',
  TOUS: 'TOUS',
};

export const PRODUCTS = [
  {
    id: 'PRODUIT_1',
    name: 'CRÉDIT FLASH',
    minAmount: 100000,
    maxAmount: 3000000,
    minDuration: 1,
    maxDuration: 24,
    rate: 11,
    fees: 25000,
    insurance: 0,
    target: TARGETS.CLIENT_PRIVE,
    description: 'Solution rapide pour vos besoins urgents.',
  },
  {
    id: 'PRODUIT_2',
    name: 'PRÊT CONSO',
    minAmount: 500000,
    maxAmount: 10000000,
    minDuration: 1,
    maxDuration: 60,
    rate: 9,
    fees: 35000,
    insurance: 0.7, // 0.7%
    target: TARGETS.CLIENT_PUBLIC,
    description: 'Financement pour vos projets de consommation.',
  },
  {
    id: 'PRODUIT_3',
    name: 'PRÊT SCOLAIRE',
    minAmount: 100000,
    maxAmount: 5000000,
    minDuration: 1,
    maxDuration: 12,
    rate: 7.5,
    fees: 20000,
    insurance: 0,
    target: TARGETS.TOUS,
    description: 'Accompagnement pour la réussite de vos enfants.',
  },
];
