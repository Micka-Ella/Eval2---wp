import api, { initSession } from '../../config/api';

const DocumentService = {
  /**
   * Récupérer tous les documents liés à un élément
   * @param {string} itemType - Type de l'élément (ex: 'Computer', 'Monitor')
   * @param {number} itemId - ID de l'élément
   * @returns {Promise<Array>} Liste des documents
   */
  getDocumentsForItem: async (itemType, itemId) => {
    try {
      await initSession();
      
      console.log('📄 Fetching documents for:', { itemType, itemId });
      
      // Try approach 2 FIRST: Document_Item, since we know direct approach returns all
      try {
        // Fetch ALL Document_Item entries (use a large range)
        const documentItemsResponse = await api.get('/Document_Item', {
          params: {
            expand: ['Document'], // Expand to get the full Document data
            range: '0-9999' // Get up to 10000 entries to be safe
          }
        });
        console.log('📄 All Document_Item entries count:', documentItemsResponse.data.length);
        console.log('📄 First 10 Document_Item entries:', documentItemsResponse.data.slice(0, 10));
        
        // Filter manually - let's be flexible with types and IDs
        const filteredItems = documentItemsResponse.data.filter(item => {
          const matchId = Number(item.items_id) === Number(itemId);
          const matchType = item.itemtype?.toLowerCase() === itemType.toLowerCase();
          return matchId && matchType;
        });
        console.log('📄 Filtered Document_Item entries:', filteredItems);
        
        // Extract documents
        const documents = filteredItems.map(docItem => {
          if (docItem.Document) {
            return docItem.Document;
          }
          if (docItem.documents_id) {
            // Try to fetch the document if expand didn't work
            return DocumentService.getDocumentById(docItem.documents_id);
          }
          return null;
        }).filter(doc => doc !== null);
        
        // Resolve any promises
        const resolvedDocuments = await Promise.all(documents);
        console.log('📄 Final documents from Document_Item:', resolvedDocuments);
        
        return resolvedDocuments;
      } catch (docItemError) {
        console.error('📄 Document_Item approach failed:', docItemError);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching documents for item:', error);
      throw error;
    }
  },

  /**
   * Récupérer un document par son ID
   * @param {number} documentId - ID du document
   * @returns {Promise<Object>} Document
   */
  getDocumentById: async (documentId) => {
    try {
      await initSession();
      const response = await api.get(`/Document/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  /**
   * Télécharger un document (obtenir l'URL)
   * @param {number} documentId - ID du document
   * @returns {string} URL de téléchargement
   */
  getDocumentDownloadUrl: (documentId) => {
    // Note: This URL structure depends on your GLPI configuration
    // This is a common pattern, but adjust if needed
    return `${api.defaults.baseURL}/Document/${documentId}/download`;
  }
};

export default DocumentService;