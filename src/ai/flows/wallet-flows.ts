'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
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
