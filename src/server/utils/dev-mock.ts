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
    totalVolume: 48200000,
    activeUsers: 1104,
    totalTransactions: 23410,
    totalTransactionVolume: 48200000,
    pendingKyc: 37,
    totalLoans: 512,
    activeLoans: 204,
    overdueLoans: 18,
    totalLoanDisbursed: 15600000,
    revenue: 980000,
    trends: {
      users: 12.5,
      volume: 8.3,
      loans: -2.1,
    },
    volumeByDay: [
      { date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10), amount: 150000 },
      { date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10), amount: 230000 },
      { date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10), amount: 180000 },
      { date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), amount: 320000 },
      { date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), amount: 280000 },
      { date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10), amount: 350000 },
      { date: new Date().toISOString().slice(0, 10), amount: 410000 },
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
    { id: 'usr-001', firstName: 'Chidi',  lastName: 'Okafor',   email: 'chidi@example.com',  phoneNumber: '08011111111', status: 'ACTIVE',    kycTier: 'TIER_2', createdAt: '2026-01-10T09:00:00Z', walletBalance: 125000 },
    { id: 'usr-002', firstName: 'Amaka',  lastName: 'Eze',      email: 'amaka@example.com',  phoneNumber: '08022222222', status: 'ACTIVE',    kycTier: 'TIER_2', createdAt: '2026-01-15T11:30:00Z', walletBalance: 89000 },
    { id: 'usr-003', firstName: 'Emeka',  lastName: 'Nwosu',    email: 'emeka@example.com',  phoneNumber: '08033333333', status: 'SUSPENDED', kycTier: 'TIER_2', createdAt: '2026-02-01T08:00:00Z', walletBalance: 0 },
    { id: 'usr-004', firstName: 'Ngozi',  lastName: 'Adeyemi',  email: 'ngozi@example.com',  phoneNumber: '08044444444', status: 'ACTIVE',    kycTier: 'TIER_1', createdAt: '2026-02-14T14:00:00Z', walletBalance: 45000 },
    { id: 'usr-005', firstName: 'Tunde',  lastName: 'Balogun',  email: 'tunde@example.com',  phoneNumber: '08055555555', status: 'ACTIVE',    kycTier: 'TIER_2', createdAt: '2026-03-02T10:00:00Z', walletBalance: 52000 },
    { id: 'usr-006', firstName: 'Ifeoma', lastName: 'Okeke',    email: 'ifeoma@example.com', phoneNumber: '08066666666', status: 'ACTIVE',    kycTier: 'TIER_0', createdAt: '2026-03-20T16:45:00Z', walletBalance: 3000 },
  ]),

  transactions: page([
    { id: 'txn-001', type: 'WALLET_FUNDING', amount: 50000, status: 'SUCCESS', senderName: 'GTBank', recipientName: 'Chidi Okafor', reference: 'WAL-20260418001', description: 'Wallet funding via bank transfer', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'txn-002', type: 'LOAN_DISBURSEMENT', amount: 150000, status: 'SUCCESS', senderName: 'SolexPay', recipientName: 'Amaka Eze', reference: 'LOAN-20260418002', description: 'Loan disbursement - Education', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
    { id: 'txn-003', type: 'NIP_TRANSFER', amount: 25000, status: 'PENDING', senderName: 'Emeka Nwosu', recipientName: 'UBA Account', reference: 'NIP-20260418003', description: 'Interbank transfer', createdAt: new Date(Date.now() - 10 * 3600000).toISOString() },
    { id: 'txn-004', type: 'LOAN_REPAYMENT', amount: 12500, status: 'SUCCESS', senderName: 'Ngozi Adeyemi', recipientName: 'SolexPay', reference: 'REP-20260417004', description: 'Monthly loan repayment', createdAt: new Date(Date.now() - 20 * 3600000).toISOString() },
    { id: 'txn-005', type: 'BILL_PAYMENT', amount: 5000, status: 'FAILED', senderName: 'Tunde Balogun', recipientName: 'PHCN', reference: 'BILL-20260416005', description: 'Electricity bill payment', createdAt: new Date(Date.now() - 22 * 3600000).toISOString() },
  ]),

  loans: page([
    { id: 'LOAN-001', userId: 'USR-001', userName: 'Chidi Okafor', schoolName: 'University of Lagos', amount: 150000, interestRate: 15, tenorMonths: 6, monthlyRepayment: 28750, status: 'OPS_REVIEW', purpose: 'Tuition Fees', appliedAt: new Date(Date.now() - 86400000).toISOString(), creditScore: 720 },
    { id: 'LOAN-002', userId: 'USR-002', userName: 'Amaka Eze', schoolName: 'Covenant University', amount: 250000, interestRate: 12, tenorMonths: 12, monthlyRepayment: 23333, status: 'PENDING', purpose: 'Accommodation', appliedAt: new Date(Date.now() - 172800000).toISOString(), creditScore: 680 },
    { id: 'LOAN-003', userId: 'USR-003', userName: 'Emeka Nwosu', schoolName: 'University of Ibadan', amount: 100000, interestRate: 18, tenorMonths: 3, monthlyRepayment: 34500, status: 'OPS_REVIEW', purpose: 'Books & Materials', appliedAt: new Date(Date.now() - 259200000).toISOString(), creditScore: 450 },
    { id: 'LOAN-004', userId: 'USR-004', userName: 'Ngozi Adeyemi', schoolName: 'Ahmadu Bello University', amount: 500000, interestRate: 10, tenorMonths: 24, monthlyRepayment: 22917, status: 'APPROVED', purpose: 'Tuition Fees', appliedAt: new Date(Date.now() - 432000000).toISOString(), creditScore: 780 },
    { id: 'LOAN-005', userId: 'USR-005', userName: 'Tunde Balogun', schoolName: 'University of Abuja', amount: 120000, interestRate: 14, tenorMonths: 9, monthlyRepayment: 15400, status: 'DISBURSED', purpose: 'Hostel Fees', appliedAt: new Date(Date.now() - 604800000).toISOString(), creditScore: 640 },
  ]),

  overdueLoans: page([
    { id: 'loan-003', userId: 'usr-003', amount: 75000, balance: 80000, status: 'OVERDUE', daysOverdue: 45, dueDate: '2026-03-01' },
  ]),

  kyc: page([
    { id: 'kyc-001', userId: 'USR-001', userName: 'John Doe',         type: 'BVN', documentNumber: '12345678901', status: 'PENDING', submittedAt: new Date(Date.now() - 300000).toISOString(),  documents: ['ID Front', 'ID Back', 'Selfie'] },
    { id: 'kyc-002', userId: 'USR-002', userName: 'Jane Smith',       type: 'NIN', documentNumber: '98765432109', status: 'PENDING', submittedAt: new Date(Date.now() - 900000).toISOString(),  documents: ['NIN Slip', 'Selfie'] },
    { id: 'kyc-003', userId: 'USR-003', userName: 'Michael Johnson',  type: 'BVN', documentNumber: '45678901234', status: 'PENDING', submittedAt: new Date(Date.now() - 1800000).toISOString(), documents: ['ID Front', 'ID Back', 'Utility Bill'] },
    { id: 'kyc-004', userId: 'USR-004', userName: 'Sarah Williams',   type: 'NIN', documentNumber: '78901234567', status: 'PENDING', submittedAt: new Date(Date.now() - 3600000).toISOString(), documents: ['NIN Slip'] },
  ]),
};
