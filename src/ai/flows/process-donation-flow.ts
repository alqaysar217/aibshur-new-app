'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, runTransaction, doc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase'; 

export const processDonationInputSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  amount: z.number().min(1),
  donationTypeId: z.string(),
});
export type ProcessDonationInput = z.infer<typeof processDonationInputSchema>;

export const processDonationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type ProcessDonationOutput = z.infer<typeof processDonationOutputSchema>;

export async function processDonation(input: ProcessDonationInput): Promise<ProcessDonationOutput> {
  return processDonationFlow(input);
}

const processDonationFlow = ai.defineFlow(
  {
    name: 'processDonationFlow',
    inputSchema: processDonationInputSchema,
    outputSchema: processDonationOutputSchema,
  },
  async (input) => {
    // This flow needs an admin-privileged Firestore instance.
    // We assume the server environment is configured correctly.
    const db = getFirestore(initializeFirebase().firebaseApp);
    
    try {
        await runTransaction(db, async (transaction) => {
            const walletRef = doc(db, 'users', input.userId, 'wallet', 'main');
            const walletDoc = await transaction.get(walletRef);

            let currentBalance = 0;
            if (walletDoc.exists()) {
                currentBalance = walletDoc.data().cashBalance || 0;
            } else {
                // If wallet doesn't exist, we can't proceed with balance check, but we can create it.
                // However, the logic requires a balance check, so we must assume it should exist or throw.
                // For robustness, let's check and throw.
                throw new Error("لم يتم العثور على محفظة المستخدم.");
            }
            
            if (currentBalance < input.amount) {
                throw new Error("رصيد المحفظة غير كافٍ لإتمام العملية.");
            }

            const newBalance = currentBalance - input.amount;
            transaction.update(walletRef, { cashBalance: newBalance });

            const donationRef = doc(collection(db, 'donations'));
            transaction.set(donationRef, {
                donorId: input.userId,
                donorName: input.userName,
                donorPhone: input.userPhone,
                amount: input.amount,
                typeId: input.donationTypeId,
                paymentMethod: 'wallet',
                donationDate: serverTimestamp(),
            });
        });
        
        return { success: true, message: "تم التبرع بنجاح. بارك الله فيك!" };

    } catch (e: any) {
        console.error("Donation transaction failed: ", e);
        return { success: false, message: e.message || "فشلت عملية التبرع. يرجى المحاولة مرة أخرى." };
    }
  }
);
