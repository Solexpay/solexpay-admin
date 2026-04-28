export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiResponse {
  status: number | string;
  description: string;
  body?: string;
}

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  auth: 'None' | 'Bearer Token' | 'Admin Only' | 'School Only';
  requestBody?: string;
  queryParams?: ApiParameter[];
  responses: ApiResponse[];
}

export interface ApiSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoints: ApiEndpoint[];
}

export const API_SECTIONS: ApiSection[] = [
  {
    id: 'section-auth',
    title: 'Authentication',
    description: 'User registration, OTP, login, PIN management',
    icon: 'key',
    endpoints: [
      {
        id: 'auth-otp-reg',
        method: 'POST',
        path: '/auth/otp/registration',
        summary: 'Send OTP for registration',
        description: 'Sends a 6-digit OTP to the provided phone number as the first step of user registration.',
        auth: 'None',
        requestBody: JSON.stringify({ phoneNumber: '08012345678' }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          {
            status: 200,
            description: 'OK',
            body: JSON.stringify({
              success: true,
              message: 'OTP sent',
              data: {
                message: 'OTP sent to your phone',
                phoneNumber: '08012345678',
                expiresAt: '2026-04-28T10:10:00Z',
                reference: 'otp-ref-abc123'
              },
              timestamp: '2026-04-28T10:00:00Z'
            }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;').replace(/@/g, '&#64;')
          }
        ]
      },
      {
        id: 'auth-register',
        method: 'POST',
        path: '/auth/register',
        summary: 'Register new user',
        description: 'Completes user registration. Requires a valid OTP obtained from POST /auth/otp/registration.',
        auth: 'None',
        requestBody: JSON.stringify({
          phoneNumber: '08012345678',
          firstName: 'Chidi',
          lastName: 'Okafor',
          otpCode: '123456'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Registration successful' }
        ]
      },
      {
        id: 'auth-otp-pin',
        method: 'POST',
        path: '/auth/otp/pin-setup',
        summary: 'Send OTP for PIN setup',
        description: 'Triggers OTP for first-time PIN setup after registration.',
        auth: 'None',
        responses: [
          { status: 200, description: 'OTP sent' }
        ]
      },
      {
        id: 'auth-pin-set',
        method: 'POST',
        path: '/auth/pin/set',
        summary: 'Set PIN for first time',
        description: 'Sets a 4-digit transaction PIN. Requires OTP verification.',
        auth: 'None',
        requestBody: JSON.stringify({
          phoneNumber: '08012345678',
          otpCode: '123456',
          pin: '1234'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'PIN set successfully' }
        ]
      },
      {
        id: 'auth-pin-change',
        method: 'POST',
        path: '/auth/pin/change',
        summary: 'Change existing PIN',
        description: 'Changes an existing transaction PIN. All three fields are required and must be 4 digits.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          oldPin: '1234',
          newPin: '5678',
          confirmNewPin: '5678'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'PIN changed successfully' }
        ]
      }
    ]
  },
  {
    id: 'section-account',
    title: 'Account',
    description: 'User profile management',
    icon: 'person',
    endpoints: [
      {
        id: 'account-get-profile',
        method: 'GET',
        path: '/account/profile',
        summary: 'Get user profile',
        description: 'Retrieves the currently authenticated user\'s profile information.',
        auth: 'Bearer Token',
        responses: [
          {
            status: 200,
            description: 'OK',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'uuid',
                phoneNumber: '08012345678',
                firstName: 'Chidi',
                lastName: 'Okafor',
                email: 'chidi@example.com'
              }
            }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;').replace(/@/g, '&#64;')
          }
        ]
      },
      {
        id: 'account-update-profile',
        method: 'PUT',
        path: '/account/profile',
        summary: 'Update user profile',
        description: 'Updates user profile. All fields are optional — only include fields to change.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          firstName: 'Chidi',
          lastName: 'Okafor',
          email: 'chidi@example.com',
          dateOfBirth: '1995-06-15',
          address: '12 Akin Street',
          city: 'Lagos',
          state: 'Lagos'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;').replace(/@/g, '&#64;'),
        responses: [
          { status: 200, description: 'Profile updated' }
        ]
      }
    ]
  },
  {
    id: 'section-wallet',
    title: 'Wallet',
    description: 'Balance and funding',
    icon: 'account_balance_wallet',
    endpoints: [
      {
        id: 'wallet-balance',
        method: 'GET',
        path: '/wallets/balance',
        summary: 'Get wallet balance',
        description: 'Retrieves current balance and account details.',
        auth: 'Bearer Token',
        responses: [
          {
            status: 200,
            description: 'OK',
            body: JSON.stringify({
              success: true,
              data: {
                walletId: 'uuid',
                accountNumber: '1234567890',
                balanceNaira: 15000.00,
                balanceKobo: 1500000,
                status: 'ACTIVE'
              }
            }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;')
          }
        ]
      },
      {
        id: 'wallet-fund',
        method: 'POST',
        path: '/wallets/fund',
        summary: 'Fund wallet',
        description: 'Records an inbound bank transfer to fund the wallet.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          amountKobo: 500000,
          sourceBank: 'GTBank',
          sourceAccountNumber: '0123456789',
          sourceAccountName: 'John Doe',
          narration: 'Wallet top-up',
          reference: 'TRF-2026-001'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Wallet funded successfully' }
        ]
      }
    ]
  },
  {
    id: 'section-kyc',
    title: 'KYC Verification',
    description: 'Identity verification to upgrade user tier',
    icon: 'verified_user',
    endpoints: [
      {
        id: 'kyc-bvn',
        method: 'POST',
        path: '/kyc/verify/bvn',
        summary: 'Verify BVN',
        description: 'Submits BVN for Tier 2 verification. Pattern: ^[0-9]&#123;11&#125;$',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({ bvn: '12345678901' }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Verification submitted' }
        ]
      },
      {
        id: 'kyc-nin',
        method: 'POST',
        path: '/kyc/verify/nin',
        summary: 'Verify NIN',
        description: 'Submits NIN for Tier 2 verification.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({ nin: '12345678901' }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Verification submitted' }
        ]
      },
      {
        id: 'kyc-status',
        method: 'GET',
        path: '/kyc/status',
        summary: 'Check KYC status',
        description: 'Returns full verification status for the current user.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Status retrieved' }
        ]
      },
      {
        id: 'kyc-check',
        method: 'GET',
        path: '/kyc/check',
        summary: 'Quick KYC check',
        description: 'Quick boolean check — has the current user completed KYC?',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Result: true/false' }
        ]
      }
    ]
  },
  {
    id: 'section-nip',
    title: 'NIP Transfers',
    description: 'Interbank transfers (NIP/NBS)',
    icon: 'send',
    endpoints: [
      {
        id: 'nip-name',
        method: 'POST',
        path: '/transfers/nip/name-enquiry',
        summary: 'Bank Name Enquiry',
        description: 'Verifies an external bank account and retrieves the account holder name.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({ bankCode: '058', accountNumber: '0123456789' }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Account found' }
        ]
      },
      {
        id: 'nip-fee',
        method: 'POST',
        path: '/transfers/nip/fee-estimate',
        summary: 'Get Fee Estimate',
        description: 'Returns the fee and total deduction for a given transfer amount.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({ amount: 50000 }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Fee calculated' }
        ]
      },
      {
        id: 'nip-init',
        method: 'POST',
        path: '/transfers/nip',
        summary: 'Initiate NIP Transfer',
        description: 'Executes the interbank transfer.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          recipientBankCode: '058',
          recipientAccountNumber: '0123456789',
          recipientAccountName: 'John Doe',
          nameEnquirySessionId: 'session-abc123',
          amount: 50000,
          description: 'School fees',
          pin: '1234',
          idempotencyKey: 'unique-key-001'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Transfer initiated' }
        ]
      },
      {
        id: 'nip-banks',
        method: 'GET',
        path: '/transfers/nip/banks',
        summary: 'List Supported Banks',
        description: 'Returns the list of all supported banks.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Banks retrieved' }
        ]
      },
      {
        id: 'nip-details',
        method: 'GET',
        path: '/transfers/nip/&#123;transferId&#125;',
        summary: 'Get NIP Transfer Details',
        description: 'Retrieves full details of a specific NIP transfer.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Details retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-p2p',
    title: 'P2P Transfers',
    description: 'Wallet-to-wallet transfers',
    icon: 'swap_horiz',
    endpoints: [
      {
        id: 'p2p-lookup',
        method: 'POST',
        path: '/transfers/p2p/recipient-lookup',
        summary: 'Lookup Recipient',
        description: 'Looks up a Solexpay user by phone or account number.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'User found' }
        ]
      },
      {
        id: 'p2p-init',
        method: 'POST',
        path: '/transfers/p2p',
        summary: 'Initiate P2P Transfer',
        description: 'Transfers funds between two Solexpay wallets instantly.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          recipientIdentifier: '08012345678',
          amountNaira: 5000,
          pin: '1234',
          description: 'Sending money',
          idempotencyKey: 'key-001'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Transfer completed' }
        ]
      },
      {
        id: 'p2p-history',
        method: 'GET',
        path: '/transfers/p2p/history',
        summary: 'P2P Transfer History',
        description: 'Returns P2P transfer history.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'History retrieved' }
        ]
      },
      {
        id: 'p2p-details',
        method: 'GET',
        path: '/transfers/p2p/&#123;transferId&#125;',
        summary: 'Get P2P Details',
        description: 'Returns single P2P transfer details.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Details retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-transactions',
    title: 'Transactions',
    description: 'Full transaction ledger',
    icon: 'receipt_long',
    endpoints: [
      {
        id: 'txn-list',
        method: 'GET',
        path: '/transactions',
        summary: 'List Transactions',
        description: 'Returns paginated transaction history using cursor-based pagination.',
        auth: 'Bearer Token',
        queryParams: [
          { name: 'cursor', type: 'string', required: false, description: 'Cursor from previous response' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20)' }
        ],
        responses: [
          { status: 200, description: 'List retrieved' }
        ]
      },
      {
        id: 'txn-details',
        method: 'GET',
        path: '/transactions/&#123;transactionId&#125;',
        summary: 'Get Transaction Details',
        description: 'Single transaction response.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Details retrieved' }
        ]
      },
      {
        id: 'txn-ledger',
        method: 'GET',
        path: '/transactions/&#123;transactionId&#125;/ledger-entries',
        summary: 'Get Ledger Entries',
        description: 'Returns double-entry ledger breakdown.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Entries retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-loans',
    title: 'Loans',
    description: 'Education loan applications',
    icon: 'school',
    endpoints: [
      {
        id: 'loan-apply',
        method: 'POST',
        path: '/loans/apply',
        summary: 'Apply for Loan',
        description: 'Student applies for a school education loan.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({
          schoolId: 'uuid',
          amountNaira: 150000,
          purpose: 'Tuition Fees',
          academicLevel: '300 Level',
          academicSession: '2025/2026',
          idempotencyKey: 'loan-key-001'
        }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Application submitted' }
        ]
      },
      {
        id: 'loan-my',
        method: 'GET',
        path: '/loans/my-loans',
        summary: 'My Loans',
        description: 'Returns all loan applications for the currently authenticated student.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Loans retrieved' }
        ]
      },
      {
        id: 'loan-id',
        method: 'GET',
        path: '/loans/&#123;loanId&#125;',
        summary: 'Get Loan Details',
        description: 'Single loan application response with all status timestamps.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Details retrieved' }
        ]
      },
      {
        id: 'loan-sched',
        method: 'GET',
        path: '/loans/&#123;loanId&#125;/repayment-schedule',
        summary: 'Get Repayment Schedule',
        description: 'Returns the installment-by-installment repayment schedule for an active loan.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Schedule retrieved' }
        ]
      },
      {
        id: 'loan-accept',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/student-accept',
        summary: 'Accept Loan Offer',
        description: 'Student accepts an approved loan offer.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Offer accepted' }
        ]
      },
      {
        id: 'loan-cancel',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/student-cancel',
        summary: 'Cancel Loan',
        description: 'Student cancels a loan application or accepted offer.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Loan cancelled' }
        ]
      }
    ]
  },
  {
    id: 'section-repayment',
    title: 'Loan Repayment',
    description: 'Managing loan installments',
    icon: 'payments',
    endpoints: [
      {
        id: 'repay-sched',
        method: 'GET',
        path: '/loans/&#123;loanId&#125;/repayments/schedule',
        summary: 'Detailed Schedule',
        description: 'Returns the structured repayment schedule as InstallmentDto objects.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Schedule retrieved' }
        ]
      },
      {
        id: 'repay-balance',
        method: 'GET',
        path: '/loans/&#123;loanId&#125;/repayments/balance',
        summary: 'Get Outstanding Balance',
        description: 'Retrieves current outstanding principal, interest and next installment details.',
        auth: 'Bearer Token',
        responses: [
          {
            status: 200,
            description: 'OK',
            body: JSON.stringify({
              success: true,
              data: {
                loanId: 'uuid',
                totalOutstanding: 103500.00,
                nextDueDate: '2026-05-28',
                nextInstallmentAmount: 28750.00
              }
            }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;')
          }
        ]
      },
      {
        id: 'repay-exec',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/repayments',
        summary: 'Make Repayment',
        description: 'Executes a loan repayment from the user\'s wallet.',
        auth: 'Bearer Token',
        requestBody: JSON.stringify({ amount: 28750, idempotencyKey: 'rep-001' }, null, 2).replace(/{/g, '&#123;').replace(/}/g, '&#125;'),
        responses: [
          { status: 200, description: 'Repayment successful' }
        ]
      },
      {
        id: 'repay-preview',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/repayments/preview',
        summary: 'Preview Schedule',
        description: 'Generates a full amortization table for a hypothetical loan.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Preview generated' }
        ]
      }
    ]
  },
  {
    id: 'section-savings',
    title: 'Savings',
    description: 'High-interest savings accounts',
    icon: 'savings',
    endpoints: [
      {
        id: 'sav-create',
        method: 'POST',
        path: '/savings/accounts',
        summary: 'Create Savings Account',
        description: 'Creates a new regular, target or emergency savings account.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Account created' }
        ]
      },
      {
        id: 'sav-list',
        method: 'GET',
        path: '/savings/accounts',
        summary: 'List Savings Accounts',
        description: 'Returns all savings accounts for the current user.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Accounts retrieved' }
        ]
      },
      {
        id: 'sav-id',
        method: 'GET',
        path: '/savings/accounts/&#123;accountId&#125;',
        summary: 'Get Savings Details',
        description: 'Retrieves current balance and accrued interest for a savings account.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Details retrieved' }
        ]
      },
      {
        id: 'sav-dep',
        method: 'POST',
        path: '/savings/deposit',
        summary: 'Deposit to Savings',
        description: 'Moves funds from the user\'s wallet into a savings account.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Deposit successful' }
        ]
      },
      {
        id: 'sav-with',
        method: 'POST',
        path: '/savings/withdraw',
        summary: 'Withdraw from Savings',
        description: 'Moves funds from a savings account back to the user\'s wallet.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Withdrawal successful' }
        ]
      },
      {
        id: 'sav-close',
        method: 'POST',
        path: '/savings/accounts/&#123;accountId&#125;/close',
        summary: 'Close Savings Account',
        description: 'Closes a savings account. Any remaining balance is moved to the user\'s wallet.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Account closed' }
        ]
      },
      {
        id: 'sav-int',
        method: 'GET',
        path: '/savings/accounts/&#123;accountId&#125;/interest-history',
        summary: 'Interest History',
        description: 'Returns array of daily interest accrual records.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'History retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-bills',
    title: 'Bills & VTU',
    description: 'Airtime, data, and utility payments',
    icon: 'bolt',
    endpoints: [
      {
        id: 'bill-airtime',
        method: 'POST',
        path: '/bills/airtime',
        summary: 'Purchase Airtime',
        description: 'Buy airtime for any Nigerian mobile network.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Purchase successful' }
        ]
      },
      {
        id: 'bill-data',
        method: 'POST',
        path: '/bills/data',
        summary: 'Purchase Data',
        description: 'Buy mobile data bundles.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Purchase successful' }
        ]
      },
      {
        id: 'bill-query',
        method: 'POST',
        path: '/bills/&#123;paymentId&#125;/query',
        summary: 'Query Status',
        description: 'Queries the live status of a bill payment from the provider.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Status updated' }
        ]
      },
      {
        id: 'bill-id',
        method: 'GET',
        path: '/bills/&#123;paymentId&#125;',
        summary: 'Get Receipt',
        description: 'Returns payment confirmation and provider reference.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Receipt retrieved' }
        ]
      },
      {
        id: 'bill-history',
        method: 'GET',
        path: '/bills/history',
        summary: 'Bills History',
        description: 'Returns all bill and VTU payments for the current user.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'History retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-notifications',
    title: 'Notifications',
    description: 'In-app alerts and counts',
    icon: 'notifications',
    endpoints: [
      {
        id: 'notif-list',
        method: 'GET',
        path: '/notifications',
        summary: 'List Notifications',
        description: 'Returns paginated list of notifications.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'List retrieved' }
        ]
      },
      {
        id: 'notif-count',
        method: 'GET',
        path: '/notifications/unread-count',
        summary: 'Unread Count',
        description: 'Returns the number of unread notifications.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Count: 7' }
        ]
      },
      {
        id: 'notif-read',
        method: 'POST',
        path: '/notifications/&#123;notificationId&#125;/read',
        summary: 'Mark as Read',
        description: 'Marks a single notification as read.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Success' }
        ]
      },
      {
        id: 'notif-read-all',
        method: 'POST',
        path: '/notifications/read-all',
        summary: 'Mark All as Read',
        description: 'Marks all unread notifications for the user as read.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Success' }
        ]
      },
      {
        id: 'notif-del',
        method: 'DELETE',
        path: '/notifications/&#123;notificationId&#125;',
        summary: 'Delete Notification',
        description: 'Removes a notification record.',
        auth: 'Bearer Token',
        responses: [
          { status: 200, description: 'Success' }
        ]
      }
    ]
  },
  {
    id: 'section-admin',
    title: 'Admin Dashboard',
    description: 'System-wide KPIs and management',
    icon: 'admin_panel_settings',
    endpoints: [
      {
        id: 'admin-metrics',
        method: 'GET',
        path: '/admin/dashboard/metrics',
        summary: 'System Metrics',
        description: 'Retrieves total users, transaction volume, and loan portfolio KPIs.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Metrics retrieved' }
        ]
      },
      {
        id: 'admin-users',
        method: 'GET',
        path: '/admin/users',
        summary: 'Manage Users',
        description: 'Search and list users with advanced filtering.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Users list' }
        ]
      },
      {
        id: 'admin-txns',
        method: 'GET',
        path: '/admin/transactions',
        summary: 'Manage Transactions',
        description: 'Audit all system-wide financial movements.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Transactions list' }
        ]
      },
      {
        id: 'admin-loans',
        method: 'GET',
        path: '/admin/loans',
        summary: 'Manage Loans',
        description: 'Audit and filter all system loans.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Loans list' }
        ]
      },
      {
        id: 'admin-overdue',
        method: 'GET',
        path: '/admin/loans/overdue',
        summary: 'Overdue Loans',
        description: 'Quick view of all loans with missed installments.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Overdue list' }
        ]
      },
      {
        id: 'admin-suspend',
        method: 'POST',
        path: '/admin/users/&#123;userId&#125;/suspend',
        summary: 'Suspend User',
        description: 'Freezes user account. Requires a reason.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'User suspended' }
        ]
      },
      {
        id: 'admin-reactivate',
        method: 'POST',
        path: '/admin/users/&#123;userId&#125;/reactivate',
        summary: 'Reactivate User',
        description: 'Restores access to a suspended user account.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'User reactivated' }
        ]
      },
      {
        id: 'admin-kyc-app',
        method: 'POST',
        path: '/admin/kyc/&#123;verificationId&#125;/approve',
        summary: 'Manual KYC Approval',
        description: 'Force-approves a pending KYC request.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'KYC approved' }
        ]
      },
      {
        id: 'admin-broadcast',
        method: 'POST',
        path: '/admin/broadcast',
        summary: 'System Broadcast',
        description: 'Sends notification to targeted audience segments.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Broadcast sent' }
        ]
      }
    ]
  },
  {
    id: 'section-school',
    title: 'School Portal',
    description: 'Endpoints for verified schools',
    icon: 'domain',
    endpoints: [
      {
        id: 'school-login',
        method: 'POST',
        path: '/school/auth/login',
        summary: 'School Login',
        description: 'Returns a school-scoped JWT.',
        auth: 'None',
        responses: [
          { status: 200, description: 'Login successful' }
        ]
      },
      {
        id: 'school-students',
        method: 'GET',
        path: '/school/students',
        summary: 'My Students',
        description: 'Returns all students with loans at this school.',
        auth: 'School Only',
        responses: [
          { status: 200, description: 'Students list' }
        ]
      },
      {
        id: 'school-ver-pending',
        method: 'GET',
        path: '/school/verifications/pending',
        summary: 'Pending Verifications',
        description: 'Loans awaiting school-side enrollment check.',
        auth: 'School Only',
        responses: [
          { status: 200, description: 'List retrieved' }
        ]
      },
      {
        id: 'school-loan-ver',
        method: 'POST',
        path: '/school/loans/&#123;loanId&#125;/verify',
        summary: 'Verify Enrollment',
        description: 'School confirms student is currently enrolled.',
        auth: 'School Only',
        responses: [
          { status: 200, description: 'Verified' }
        ]
      },
      {
        id: 'loan-school-ver',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/school-verify',
        summary: 'Direct School Verify',
        description: 'Alias for verifying enrollment via loan route.',
        auth: 'School Only',
        responses: [
          { status: 200, description: 'Verified' }
        ]
      },
      {
        id: 'loan-school-rej',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/school-reject',
        summary: 'Reject Application',
        description: 'School rejects loan (e.g., student not enrolled).',
        auth: 'School Only',
        responses: [
          { status: 200, description: 'Rejected' }
        ]
      },
      {
        id: 'loan-school-pend',
        method: 'GET',
        path: '/loans/school-pending',
        summary: 'Global Pending List',
        description: 'Returns loans pending review for any school.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'List retrieved' }
        ]
      }
    ]
  },
  {
    id: 'section-ops',
    title: 'Loan Operations',
    description: 'Internal back-office loan processing',
    icon: 'rate_review',
    endpoints: [
      {
        id: 'ops-pending',
        method: 'GET',
        path: '/loans/ops-pending',
        summary: 'Ops Queue',
        description: 'Returns all loans in OPS_REVIEW status.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Queue retrieved' }
        ]
      },
      {
        id: 'ops-approve',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/ops-approve',
        summary: 'Approve Loan',
        description: 'Internal approval after credit checks.',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Approved' }
        ]
      },
      {
        id: 'ops-reject',
        method: 'POST',
        path: '/loans/&#123;loanId&#125;/ops-reject',
        summary: 'Reject Loan',
        description: 'Internal rejection (e.g., credit score low).',
        auth: 'Admin Only',
        responses: [
          { status: 200, description: 'Rejected' }
        ]
      }
    ]
  },
  {
    id: 'section-webhooks',
    title: 'Webhooks',
    description: 'Inbound events from external providers',
    icon: 'webhook',
    endpoints: [
      {
        id: 'webhook-anchor',
        method: 'POST',
        path: '/webhooks/nip/anchor',
        summary: 'Anchor Payment Webhook',
        description: 'Called by Anchor to report transfer status updates.',
        auth: 'None',
        responses: [
          { status: 200, description: 'Event received' }
        ]
      },
      {
        id: 'webhook-kyc',
        method: 'POST',
        path: '/kyc/webhook/&#123;provider&#125;',
        summary: 'KYC Result Webhook',
        description: 'Called by KYC providers with verification results.',
        auth: 'None',
        responses: [
          { status: 200, description: 'Event received' }
        ]
      }
    ]
  }
];
