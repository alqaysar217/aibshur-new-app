'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, runTransaction, doc, collection, serverTimestamp, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init'; 

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
        const walletRef = doc(db, 'users', input.clientId, 'wallet', 'main');
        const walletDoc = await getDoc(walletRef);

        if (!walletDoc.exists()) {
            throw new Error("لم يتم العثور على محفظة العميل.");
        }
        
        const currentBalance = walletDoc.data().cashBalance;
        if (currentBalance < input.amount) {
            throw new Error("رصيد العميل غير كافٍ لعملية الاسترجاع.");
        }

        const newBalance = currentBalance - input.amount;

        // Step 1: Update balance
        await updateDoc(walletRef, { cashBalance: newBalance });

        // Step 2: Log transaction
        const logRef = doc(collection(db, 'walletTransactions'));
        await setDoc(logRef, {
            userId: input.clientId,
            type: 'refund',
            amount: -input.amount,
            newBalance: newBalance,
            notes: `استرجاع رصيد: ${input.reason}`,
            createdAt: serverTimestamp(),
        });
        
        return { success: true, message: "تم الاسترجاع بنجاح" };
        
    } catch (e: any) {
        console.error("Refund flow failed: ", e);
        return { success: false, message: e.message || "فشلت عملية الاسترجاع." };
    }
  }
);
