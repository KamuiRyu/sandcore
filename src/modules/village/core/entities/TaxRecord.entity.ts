export interface TaxRecord {
  id: string;
  user: string;
  amount: number;
  period: string;
  verified_by: string;
  created: string;
}

export interface DonationRecord {
  id: string;
  user: string;
  amount: number;
  registered_by: string;
  period: string;
  created: string;
}

export interface BankTransaction {
  id: string;
  type: 'reward_payout' | 'tax_income' | 'donation_income';
  amount: number;
  user: string;
  mission_assignment?: string;
  description: string;
  created: string;
}
