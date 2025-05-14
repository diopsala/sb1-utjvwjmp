// Import required modules
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();

const corsHandler = cors({origin: true});

// Analyze image with AI (OpenAI GPT-4 Vision)
exports.analyzeImageWithAI = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Validate request method
      if (request.method !== 'POST') {
        return response.status(405).json({error: 'Method not allowed'});
      }

      // Validate request body
      const {imageUrl} = request.body;
      if (!imageUrl) {
        return response.status(400).json({error: 'Missing imageUrl'});
      }

      // Validate authentication
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({error: 'Unauthorized'});
      }

      const idToken = authHeader.split('Bearer ')[1];
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error('Error verifying token:', error);
        return response.status(401).json({error: 'Invalid token'});
      }

      // Configure prompt for OpenAI
      const promptSettings = {
        subject: 'Texte ou exercice visible dans l\'image',
        message: 'Analyse ce devoir et explique-le de façon détaillée. Identifie la matière et décris la méthode de résolution. Ne te contente pas de décrire ce que tu vois - explique vraiment le sujet, les concepts et les méthodes pour arriver à la solution.',
      };

      // Get OpenAI model from request or use default
      const model = request.body.model || process.env.OPENAI_MODEL || 'gpt-4o';

      // Make the API call to OpenAI
      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system', 
              content: `Tu es un professeur expert qui analyse des exercices scolaires pour les élèves. 
              Ton objectif est de fournir une analyse précise et pédagogique. 
              Identifie la matière, le niveau, et explique pas à pas comment résoudre l'exercice.
              Si c'est un exercice de maths, analyse chaque étape. 
              Pour les langues, explique la grammaire, le vocabulaire ou la structure.
              En sciences, clarifie les concepts et la méthode.
              Sois précis, pédagogique, et encourage l'élève à comprendre plutôt que juste mémoriser.`
            },
            {
              role: 'user',
              content: [
                {type: 'text', text: promptSettings.message},
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('OpenAI API error:', errorData);
        return response.status(500).json({error: 'Error from OpenAI API'});
      }

      const openaiResponse = await apiResponse.json();

      return response.status(200).json({
        success: true,
        result: {
          subject: promptSettings.subject,
          analysis: openaiResponse.choices[0]?.message?.content || '',
        }
      });
    } catch (error) {
      console.error('Error analyzing image with AI:', error);
      return response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Generate correction for homework
exports.generateCorrection = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Validate request method
      if (request.method !== 'POST') {
        return response.status(405).json({error: 'Method not allowed'});
      }

      // Validate request body
      const {homeworkId} = request.body;
      if (!homeworkId) {
        return response.status(400).json({error: 'Missing homeworkId'});
      }

      // Validate authentication
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({error: 'Unauthorized'});
      }

      const idToken = authHeader.split('Bearer ')[1];
      let uid;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (error) {
        console.error('Error verifying token:', error);
        return response.status(401).json({error: 'Invalid token'});
      }

      // Get the homework document
      const homeworkRef = admin.firestore().collection('homework').doc(homeworkId);
      const homeworkDoc = await homeworkRef.get();

      if (!homeworkDoc.exists) {
        return response.status(404).json({error: 'Homework not found'});
      }

      const homeworkData = homeworkDoc.data();

      // Ensure user owns the homework
      if (homeworkData?.user_id !== uid) {
        return response.status(403).json({error: 'You do not have permission to access this homework'});
      }

      // Get OpenAI model from request or use default
      const model = request.body.model || process.env.OPENAI_MODEL || 'gpt-4o';

      // Configure prompt for correction
      const correctionPrompt = `
Exercice à corriger:

${homeworkData?.analysis}

---

Génère une correction détaillée pour cet exercice. Ta réponse doit suivre ce format exact:

👋 Introduction: Présente le sujet et le type d'exercice

📝 Concepts clés: Explique les notions théoriques essentielles pour comprendre l'exercice

✨ Méthode de résolution: Détaille l'approche générale à utiliser

🔍 Résolution pas à pas: Explique chaque étape de la résolution avec clarté

💡 Points importants: Souligne les aspects cruciaux ou les pièges à éviter

🎯 Conclusion: Résume la démarche et les enseignements à retenir

Sois pédagogique, précis et adapte ton explication au niveau scolaire approprié.`;

      // Call OpenAI API for correction generation
      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: correctionPrompt
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to generate correction with OpenAI API');
      }

      const data = await apiResponse.json();
      
      const correction = data.choices[0]?.message?.content;

      // Update the homework document with the correction
      await homeworkRef.update({
        correction: correction,
        correction_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return response.status(200).json({
        success: true,
        correction: correction,
      });
    } catch (error) {
      console.error('Error generating correction:', error);
      return response.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
});

// Health check endpoint
exports.healthCheckFunction = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    // Simple health check
    response.status(200).send("Service is healthy");
  });
});

// Helper function to increment view count for resources
exports.incrementView = functions.firestore
    .document('resources/{resourceId}')
    .onUpdate(async (change, context) => {
      const newDocument = change.after.data();
      const docId = context.params.resourceId;

      try {
        await admin.firestore().runTransaction(async (transaction) => {
          const docRef = admin.firestore().collection('resources').doc(docId);
          const docSnap = await transaction.get(docRef);
          
          if (!docSnap.exists) {
            return;
          }
          
          const userData = docSnap.data() || {};
          const currentViews = userData.view_count || 0;
          
          transaction.update(docRef, {
            view_count: currentViews + 1,
            last_viewed_at: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        console.log(`Successfully incremented view count for resource ${docId}`);
      } catch (error) {
        console.error(`Error incrementing view count: ${error}`);
      }
    });

// Get statistics for user
exports.getStats = functions.https.callable(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const uid = context.auth.uid;

  try {
    // Get all homework documents for the user
    const q = admin.firestore().collection('homework')
      .where('user_id', '==', uid);
    
    const querySnapshot = await q.get();
    const homeworkData = querySnapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    })) as any[];
    
    // Get all performance records for all subjects
    const q2 = admin.firestore()
      .collection('revision_performances')
      .doc(uid)
      .collection('records');
    
    const performanceSnapshot = await q2.get();
    const performances = performanceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      homeworkData,
      performances,
      // Add any additional statistics here
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to retrieve user statistics data.'
    );
  }
});