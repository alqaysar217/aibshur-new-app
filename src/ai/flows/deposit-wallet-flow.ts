'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init';

const depositWalletInputSchema = z.object({
  clientId: z.string(),
  amount: z.number().min(1),
  bankName: z.string(),
  referenceNumber: z.string(),
  receiptImageUrl: z.string().optional(),
});
export type DepositWalletInput = z.infer<typeof depositWalletInputSchema>;

const depositWalletOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newBalance: z.number().optional(),
});
export type DepositWalletOutput = z.infer<typeof depositWalletOutputSchema>;

export async function depositToWallet(input: DepositWalletInput): Promise<DepositWalletOutput> {
  return depositWalletFlow(input);
}

const depositWalletFlow = ai.defineFlow(
  {
    name: 'depositWalletFlow',
    inputSchema: depositWalletInputSchema,
    outputSchema: depositWalletOutputSchema,
  },
  async (input) => {
    // This flow runs on the server with admin privileges, bypassing client-side security rules.
    const db = getFirestore(initializeFirebase().firebaseApp);
    
    try {
      const newBalance = await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'users', input.clientId, 'wallet', 'main');
        const logRef = doc(collection(db, 'walletTransactions'));
        
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = walletDoc.exists() ? walletDoc.data().cashBalance : 0;
        const calculatedNewBalance = currentBalance + input.amount;

        if (walletDoc.exists()) {
          transaction.update(walletRef, { cashBalance: calculatedNewBalance });
        } else {
          // If wallet doesn't exist, create it.
          transaction.set(walletRef, { userId: input.clientId, cashBalance: calculatedNewBalance, pointsBalance: 0 });
        }

        transaction.set(logRef, {
            userId: input.clientId,
            type: 'deposit',
            amount: input.amount,
            newBalance: calculatedNewBalance,
            notes: `إيداع عبر ${input.bankName}`,
            bankDetails: {
                bankName: input.bankName,
                referenceNumber: input.referenceNumber,
                receiptImageUrl: input.receiptImageUrl || '',
            },
            createdAt: serverTimestamp(),
        });

        return calculatedNewBalance;
      });

      return { success: true, message: "تم الإيداع بنجاح!", newBalance };

    } catch (e: any) {
        console.error("Deposit transaction failed: ", e);
        return { success: false, message: e.message || "فشلت عملية الإيداع." };
    }
  }
);
