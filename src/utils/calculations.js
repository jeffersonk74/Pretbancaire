/**
 * Calculate the monthly payment for a loan.
 * Formula: M = (P * r) / (1 - (1 + r)^-n)
 */
export const calculateMonthlyPayment = (principal, annualRate, months) => {
  if (!principal || !annualRate || !months) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const denominator = 1 - Math.pow(1 + monthlyRate, -months);
  if (denominator === 0) return 0;
  return (principal * monthlyRate) / denominator;
};

export const generateAmortizationSchedule = (principal, annualRate, months, fees = 0, insuranceRate = 0) => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, months);
  const monthlyRate = annualRate / 100 / 12;
  const totalInsurance = (principal * (insuranceRate / 100)) * (months / 12);
  const monthlyInsurance = totalInsurance / months;
  const schedule = [];
  let remainingBalance = principal;
  let totalInterest = 0;

  for (let i = 1; i <= months; i++) {
    const interest = remainingBalance * monthlyRate;
    const capital = monthlyPayment - interest;
    remainingBalance -= capital;
    schedule.push({
      month: i,
      payment: monthlyPayment + monthlyInsurance,
      capital,
      interest,
      insurance: monthlyInsurance,
      remainingBalance: Math.max(0, remainingBalance),
    });
    totalInterest += interest;
  }

  const totalCost = totalInterest + fees + totalInsurance;
  return {
    schedule,
    monthlyPayment: monthlyPayment + monthlyInsurance,
    totalInterest,
    totalInsurance,
    totalCost,
    totalAmountToRepay: principal + totalCost,
  };
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('XOF', 'FCFA');
};
