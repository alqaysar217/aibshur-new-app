'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, doc, collection, serverTimestamp, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy, runTransaction } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init'; 

// --- Deposit Flow ---
const depositWalletInputSchema = z.object({
  clientId: z.string(),
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  bankName: z.string(),
  referenceNumber: z.string(),
  receiptImageUrl: z.string().optional(),
});
type DepositWalletInput = z.infer<typeof depositWalletInputSchema>;

const depositWalletOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
type DepositWalletOutput = z.infer<typeof depositWalletOutputSchema>;

export async function depositWallet(input: DepositWalletInput): Promise<DepositWalletOutput> {
  return depositWalletFlow(input);
}

const depositWalletFlow = ai.defineFlow(
  {
    name: 'depositWalletFlow',
    inputSchema: depositWalletInputSchema,
    outputSchema: depositWalletOutputSchema,
  },
  async (input) => {
    const db = getFirestore(initializeFirebase().firebaseApp);
    
    try {
        await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, 'users', input.clientId, 'wallet', 'main');
            const walletDoc = await transaction.get(walletRef);
            
            const currentBalance = walletDoc.exists() ? walletDoc.data().cashBalance : 0;
            const newBalance = currentBalance + input.amount;

            if (walletDoc.exists()) {
                transaction.update(walletRef, { cashBalance: newBalance });
            } else {
                transaction.set(walletRef, { userId: input.clientId, cashBalance: newBalance, pointsBalance: 0 });
            }
            
            const logRef = doc(collection(db, 'walletTransactions'));
            transaction.set(logRef, {
                userId: input.clientId,
                type: 'deposit',
                amount: input.amount,
                newBalance: newBalance,
                notes: `إيداع عبر ${input.bankName}`,
                bankDetails: {
                    bankName: input.bankName,
                    referenceNumber: input.referenceNumber,
                    receiptImageUrl: input.receiptImageUrl || '',
                },
                createdAt: serverTimestamp(),
            });
        });
      
        return { success: true, message: "تم الإيداع بنجاح" };

    } catch (e: any) {
        console.error("Deposit flow failed: ", e);
        return { success: false, message: e.message || "فشلت عملية الإيداع." };
    }
  }
);

// --- Refund Flow ---
const refundWalletInputSchema = z.object({
  clientId: z.string(),
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  reason: z.string().min(10, "الرجاء كتابة سبب واضح للاسترجاع"),
});
type RefundWalletInput = z.infer<typeof refundWalletInputSchema>;

const refundWalletOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
type RefundWalletOutput = z.infer<typeof refundWalletOutputSchema>;

export async function refundWallet(input: RefundWalletInput): Promise<RefundWalletOutput> {
  return refundWalletFlow(input);
}

const refundWalletFlow = ai.defineFlow(
  {
    name: 'refundWalletFlow',
    inputSchema: refundWalletInputSchema,
    outputSchema: refundWalletOutputSchema,
  },
  async (input) => {
    const db = getFirestore(initializeFirebase().firebaseApp);

    try {
        await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, 'users', input.clientId, 'wallet', 'main');
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw new Error("لم يتم العثور على محفظة العميل.");
            }
            
            const currentBalance = walletDoc.data().cashBalance;
            if (currentBalance < input.amount) {
                throw new Error("رصيد العميل غير كافٍ لعملية الاسترجاع.");
            }

            const newBalance = currentBalance - input.amount;

            transaction.update(walletRef, { cashBalance: newBalance });

            const logRef = doc(collection(db, 'walletTransactions'));
            transaction.set(logRef, {
                userId: input.clientId,
                type: 'refund',
                amount: -input.amount,
                newBalance: newBalance,
                notes: `استرجاع رصيد: ${input.reason}`,
                createdAt: serverTimestamp(),
            });
        });
        
        return { success: true, message: "تم الاسترجاع بنجاح" };
        
    } catch (e: any) {
        console.error("Refund flow failed: ", e);
        return { success: false, message: e.message || "فشلت عملية الاسترجاع." };
    }
  }
);


// --- Get Transactions Flow ---
const getWalletTransactionsInputSchema = z.object({
  clientId: z.string(),
});
type GetWalletTransactionsInput = z.infer<typeof getWalletTransactionsInputSchema>;

const getWalletTransactionsOutputSchema = z.any();

export async function getWalletTransactions(input: GetWalletTransactionsInput): Promise<any[]> {
  return getWalletTransactionsFlow(input);
}

const getWalletTransactionsFlow = ai.defineFlow(
  {
    name: 'getWalletTransactionsFlow',
    inputSchema: getWalletTransactionsInputSchema,
    outputSchema: getWalletTransactionsOutputSchema,
  },
  async (input) => {
    const db = getFirestore(initializeFirebase().firebaseApp);
    
    try {
      const transactionsRef = collection(db, 'walletTransactions');
      const q = query(transactionsRef, where('userId', '==', input.clientId), orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const transactions: any[] = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      
      return transactions;
    } catch (e: any) {
      console.error("Get transactions flow failed: ", e);
      return [];
    }
  }
);