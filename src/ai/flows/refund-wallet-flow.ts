'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, runTransaction, doc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const refundWalletInputSchema = z.object({
  clientId: z.string(),
  amount: z.number().min(1),
  reason: z.string().min(10),
});
export type RefundWalletInput = z.infer<typeof refundWalletInputSchema>;

export const refundWalletOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newBalance: z.number().optional(),
});
export type RefundWalletOutput = z.infer<typeof refundWalletOutputSchema>;

export async function refundFromWallet(input: RefundWalletInput): Promise<RefundWalletOutput> {
  return refundWalletFlow(input);
}

const refundWalletFlow = ai.defineFlow(
  {
    name: 'refundWalletFlow',
    inputSchema: refundWalletInputSchema,
    outputSchema: refundWalletOutputSchema,
  },
  async (input) => {
    // This flow runs on the server with admin privileges
    const db = getFirestore(initializeFirebase().firebaseApp);
    
    try {
      const newBalance = await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, 'users', input.clientId, 'wallet', 'main');
        const logRef = doc(collection(db, 'walletTransactions'));
        
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("المحفظة غير موجودة!");

        const currentBalance = walletDoc.data().cashBalance;
        if (currentBalance < input.amount) throw new Error("الرصيد غير كافي لعملية الاسترجاع!");
        
        const calculatedNewBalance = currentBalance - input.amount;
        transaction.update(walletRef, { cashBalance: calculatedNewBalance });

        transaction.set(logRef, {
            userId: input.clientId,
            type: 'refund',
            amount: -input.amount,
            newBalance: calculatedNewBalance,
            notes: `استرجاع رصيد: ${input.reason}`,
            createdAt: serverTimestamp(),
        });

        return calculatedNewBalance;
      });

      return { success: true, message: "تم الاسترجاع بنجاح!", newBalance };

    } catch (e: any) {
        console.error("Refund transaction failed: ", e);
        return { success: false, message: e.message || "فشلت عملية الاسترجاع." };
    }
  }
);
