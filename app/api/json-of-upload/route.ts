/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextApiRequest, NextApiResponse } from 'next'
import { loadDocs } from '@/lib/mcp/store';
import { useContextActions, useContextState } from '@/globalx/GlobalContext';

  // TO DO
  // const docs = await loadDocs();
  // const { state } = useContextState();
  // const { setPdfEntries, setPdfLoading, setPdfError, clearPdfEntries, fetchPdfFromApi } = useContextActions();
    
const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
 // to do 
 //make use of context pdf state

  try {
    if (!Array.isArray(pdf)) {
      throw new Error('Cannot find user data')
    }

    res.status(200).json(pdf)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler