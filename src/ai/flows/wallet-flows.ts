'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, query, orderBy, getDocs, Timestamp, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init'; 


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
      const transactionsRef = collection(db, 'users', input.clientId, 'walletTransactions');
      const q = query(transactionsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const transactions: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Firestore timestamps need to be converted to a serializable format (e.g., ISO string)
        const serializableData: { [key: string]: any } = {};
        for (const key in data) {
            if (data[key] instanceof Timestamp) {
                serializableData[key] = data[key].toDate().toISOString();
            } else {
                serializableData[key] = data[key];
            }
        }
        transactions.push({ id: doc.id, ...serializableData });
      });
      
      return transactions;
    } catch (e: any) {
      console.error("Get transactions flow failed: ", e);
      // Return an empty array on failure to avoid breaking the client
      return [];
    }
  }
);


// --- Deposit to Wallet Flow ---
const depositSchema = z.object({
    clientId: z.string(),
    amount: z.number().min(1),
    bankName: z.string().min(1),
    referenceNumber: z.string().min(1),
    receiptImageUrl: z.string().optional(),
});
type DepositInput = z.infer<typeof depositSchema>;

const flowOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
type FlowOutput = z.infer<typeof flowOutputSchema>;

export async function depositToWallet(input: DepositInput): Promise<FlowOutput> {
    return depositToWalletFlow(input);
}

const depositToWalletFlow = ai.defineFlow(
    {
        name: 'depositToWalletFlow',
        inputSchema: depositSchema,
        outputSchema: flowOutputSchema,
    },
    async (input) => {
        const db = getFirestore(initializeFirebase().firebaseApp);
        const { clientId, ...depositData } = input;
        
        try {
            await runTransaction(db, async (transaction) => {
                const walletRef = doc(db, 'users', clientId, 'wallet', 'main');
                const walletDoc = await transaction.get(walletRef);
                const currentBalance = walletDoc.exists() ? walletDoc.data().cashBalance : 0;
                const newBalance = currentBalance + depositData.amount;

                if (walletDoc.exists()) {
                    transaction.update(walletRef, { cashBalance: newBalance });
                } else {
                    transaction.set(walletRef, { userId: clientId, cashBalance: newBalance, pointsBalance: 0 });
                }
                
                const logRef = doc(collection(db, 'users', clientId, 'walletTransactions'));
                transaction.set(logRef, {
                    userId: clientId,
                    type: 'deposit',
                    amount: depositData.amount,
                    newBalance: newBalance,
                    notes: `إيداع عبر ${depositData.bankName}`,
                    bankDetails: {
                        bankName: depositData.bankName,
                        referenceNumber: depositData.referenceNumber,
                        receiptImageUrl: depositData.receiptImageUrl || '',
                    },
                    createdAt: serverTimestamp(),
                });
            });

            return { success: true, message: "تم الإيداع بنجاح" };
        } catch (e: any) {
            console.error("Deposit transaction failed:", e);
            return { success: false, message: e.message || "فشلت عملية الإيداع" };
        }
    }
);


// --- Refund from Wallet Flow ---
const refundSchema = z.object({
    clientId: z.string(),
    amount: z.number().min(1),
    reason: z.string().min(1),
});
type RefundInput = z.infer<typeof refundSchema>;

export async function refundFromWallet(input: RefundInput): Promise<FlowOutput> {
    return refundFromWalletFlow(input);
}

const refundFromWalletFlow = ai.defineFlow(
    {
        name: 'refundFromWalletFlow',
        inputSchema: refundSchema,
        outputSchema: flowOutputSchema,
    },
    async (input) => {
        const db = getFirestore(initializeFirebase().firebaseApp);
        const { clientId, amount, reason } = input;

        try {
            await runTransaction(db, async (transaction) => {
                const walletRef = doc(db, 'users', clientId, 'wallet', 'main');
                const walletDoc = await transaction.get(walletRef);

                if (!walletDoc.exists()) {
                    throw new Error("لم يتم العثور على محفظة العميل.");
                }

                const currentBalance = walletDoc.data().cashBalance || 0;
                if (currentBalance < amount) {
                    throw new Error("رصيد العميل غير كافٍ لعملية الاسترجاع.");
                }
                const newBalance = currentBalance - amount;

                transaction.update(walletRef, { cashBalance: newBalance });

                const logRef = doc(collection(db, 'users', clientId, 'walletTransactions'));
                transaction.set(logRef, {
                    userId: clientId,
                    type: 'refund',
                    amount: -amount,
                    newBalance: newBalance,
                    notes: `استرجاع رصيد: ${reason}`,
                    createdAt: serverTimestamp(),
                });
            });
            return { success: true, message: "تم الاسترجاع بنجاح" };
        } catch (e: any) {
             console.error("Refund transaction failed:", e);
            return { success: false, message: e.message || "فشلت عملية الاسترجاع" };
        }
    }
);
