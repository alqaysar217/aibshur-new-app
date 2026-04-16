'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, doc, collection, serverTimestamp, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
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
      throw e; // Re-throw the error to be caught by the client
    }
  }
);
