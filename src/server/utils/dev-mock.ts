export const IS_DEV = process.env['NODE_ENV'] !== 'production';

const page = <T>(items: T[], size = 10) => ({
  content: items,
  totalElements: items.length,
  totalPages: 1,
  size,
  number: 0,
  first: true,
  last: true,
});

export const MOCK = {
  login: {
    token: 'dev.mock.jwt.token',
    user: { id: 'usr-001', email: 'admin@solexpay.com', role: 'ADMIN', name: 'Dev Admin' },
  },

  forgotPassword: {
    message: 'If the email exists, a reset link has been sent.',
  },

  dashboard: {
    totalUsers: 1482,
    activeUsers: 1104,
    totalTransactions: 23410,
    totalTransactionVolume: 48200000,
    pendingKyc: 37,
    totalLoans: 512,
    activeLoans: 204,
    overdueLoans: 18,
    totalLoanDisbursed: 15600000,
    revenue: 980000,
    volumeByDay: [
      { date: '2024-01-01', amount: 150000 },
      { date: '2024-01-02', amount: 230000 },
      { date: '2024-01-03', amount: 180000 },
      { date: '2024-01-04', amount: 320000 },
      { date: '2024-01-05', amount: 280000 },
      { date: '2024-01-06', amount: 350000 },
      { date: '2024-01-07', amount: 410000 },
    ],
    pendingKycItems: [
      { id: '1', name: 'John Doe', type: 'BVN Verification', time: '2 min ago' },
      { id: '2', name: 'Jane Smith', type: 'NIN Verification', time: '15 min ago' },
      { id: '3', name: 'Mike Johnson', type: 'BVN Verification', time: '1 hour ago' },
    ],
    recentTransactions: [
      { id: '1', type: 'WALLET_FUNDING', amount: 50000, status: 'SUCCESS', createdAt: new Date().toISOString(), userName: 'John Doe' },
      { id: '2', type: 'LOAN_DISBURSEMENT', amount: 150000, status: 'SUCCESS', createdAt: new Date(Date.now() - 3600000).toISOString(), userName: 'Jane Smith' },
      { id: '3', type: 'NIP_TRANSFER', amount: 25000, status: 'PENDING', createdAt: new Date(Date.now() - 7200000).toISOString(), userName: 'Mike Johnson' },
      { id: '4', type: 'LOAN_REPAYMENT', amount: 12500, status: 'SUCCESS', createdAt: new Date(Date.now() - 86400000).toISOString(), userName: 'Sarah Williams' },
      { id: '5', type: 'BILL_PAYMENT', amount: 5000, status: 'FAILED', createdAt: new Date(Date.now() - 172800000).toISOString(), userName: 'Tom Brown' },
    ],
  },

  users: page([
    { id: 'usr-001', name: 'Chidi Okafor',    email: 'chidi@example.com',  phone: '08011111111', status: 'ACTIVE',    kycStatus: 'VERIFIED',  createdAt: '2024-01-10T09:00:00Z' },
    { id: 'usr-002', name: 'Amaka Eze',        email: 'amaka@example.com',  phone: '08022222222', status: 'ACTIVE',    kycStatus: 'VERIFIED',  createdAt: '2024-01-15T11:30:00Z' },
    { id: 'usr-003', name: 'Emeka Nwosu',      email: 'emeka@example.com',  phone: '08033333333', status: 'SUSPENDED', kycStatus: 'VERIFIED',  createdAt: '2024-02-01T08:00:00Z' },
    { id: 'usr-004', name: 'Ngozi Adeyemi',    email: 'ngozi@example.com',  phone: '08044444444', status: 'ACTIVE',    kycStatus: 'PENDING',   createdAt: '2024-02-14T14:00:00Z' },
    { id: 'usr-005', name: 'Tunde Balogun',    email: 'tunde@example.com',  phone: '08055555555', status: 'ACTIVE',    kycStatus: 'VERIFIED',  createdAt: '2024-03-02T10:00:00Z' },
    { id: 'usr-006', name: 'Ifeoma Okeke',     email: 'ifeoma@example.com', phone: '08066666666', status: 'ACTIVE',    kycStatus: 'REJECTED',  createdAt: '2024-03-20T16:45:00Z' },
  ]),

  transactions: page([
    { id: 'txn-001', userId: 'usr-001', type: 'TRANSFER',  amount: 15000,  status: 'SUCCESS',  reference: 'REF001', description: 'School fees',    createdAt: '2024-04-01T09:10:00Z' },
    { id: 'txn-002', userId: 'usr-002', type: 'DEPOSIT',   amount: 50000,  status: 'SUCCESS',  reference: 'REF002', description: 'Wallet top-up',  createdAt: '2024-04-02T11:00:00Z' },
    { id: 'txn-003', userId: 'usr-003', type: 'WITHDRAWAL',amount: 8000,   status: 'FAILED',   reference: 'REF003', description: 'ATM withdrawal', createdAt: '2024-04-03T13:20:00Z' },
    { id: 'txn-004', userId: 'usr-004', type: 'LOAN_DISBURSEMENT', amount: 100000, status: 'SUCCESS', reference: 'REF004', description: 'Loan payout', createdAt: '2024-04-04T08:30:00Z' },
    { id: 'txn-005', userId: 'usr-005', type: 'TRANSFER',  amount: 3500,   status: 'PENDING',  reference: 'REF005', description: 'Airtime',        createdAt: '2024-04-05T17:00:00Z' },
  ]),

  loans: page([
    { id: 'loan-001', userId: 'usr-001', amount: 100000, balance: 75000,  status: 'ACTIVE',    interestRate: 5, disbursedAt: '2024-01-20T09:00:00Z', dueDate: '2024-07-20' },
    { id: 'loan-002', userId: 'usr-002', amount: 50000,  balance: 50000,  status: 'PENDING',   interestRate: 5, disbursedAt: null,                   dueDate: null },
    { id: 'loan-003', userId: 'usr-003', amount: 75000,  balance: 80000,  status: 'OVERDUE',   interestRate: 5, disbursedAt: '2023-12-01T09:00:00Z', dueDate: '2024-03-01' },
    { id: 'loan-004', userId: 'usr-005', amount: 200000, balance: 200000, status: 'APPROVED',  interestRate: 5, disbursedAt: null,                   dueDate: null },
    { id: 'loan-005', userId: 'usr-006', amount: 30000,  balance: 0,      status: 'REPAID',    interestRate: 5, disbursedAt: '2024-02-01T09:00:00Z', dueDate: '2024-05-01' },
  ]),

  overdueLoans: page([
    { id: 'loan-003', userId: 'usr-003', amount: 75000, balance: 80000, status: 'OVERDUE', daysOverdue: 45, dueDate: '2024-03-01' },
  ]),

  kyc: page([
    { id: 'kyc-001', userId: 'USR-001', userName: 'John Doe',         type: 'BVN', documentNumber: '12345678901', status: 'PENDING', submittedAt: new Date(Date.now() - 300000).toISOString(),  documents: ['ID Front', 'ID Back', 'Selfie'] },
    { id: 'kyc-002', userId: 'USR-002', userName: 'Jane Smith',       type: 'NIN', documentNumber: '98765432109', status: 'PENDING', submittedAt: new Date(Date.now() - 900000).toISOString(),  documents: ['NIN Slip', 'Selfie'] },
    { id: 'kyc-003', userId: 'USR-003', userName: 'Michael Johnson',  type: 'BVN', documentNumber: '45678901234', status: 'PENDING', submittedAt: new Date(Date.now() - 1800000).toISOString(), documents: ['ID Front', 'ID Back', 'Utility Bill'] },
    { id: 'kyc-004', userId: 'USR-004', userName: 'Sarah Williams',   type: 'NIN', documentNumber: '78901234567', status: 'PENDING', submittedAt: new Date(Date.now() - 3600000).toISOString(), documents: ['NIN Slip'] },
  ]),
};
