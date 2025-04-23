import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

admin.initializeApp();

const corsHandler = cors({origin: true});

// Exemple d'une fonction Cloud pour analyser une image avec OpenAI
exports.analyzeImageWithAI = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Vérification de la méthode
      if (request.method !== "POST") {
        return response.status(405).json({error: "Method Not Allowed"});
      }

      // Extraction des données de la requête
      const {imageUrl} = request.body;
      if (!imageUrl) {
        return response.status(400).json({error: "Missing image URL"});
      }

      // Vérification de l'authentification
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(403).json({error: "Unauthorized"});
      }

      const idToken = authHeader.split("Bearer ")[1];
      try {
        await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error("Error verifying token:", error);
        return response.status(403).json({error: "Invalid token"});
      }

      // Appel à l'API OpenAI (à implémenter avec axios)
      // const analysisResult = await callOpenAIVisionAPI(imageUrl);

      // Pour l'instant, nous retournons une réponse simulée
      const analysisResult = {
        subject: "math",
        analysis: "Ceci est un exemple d'exercice de mathématiques.",
        confidence: 0.95,
      };

      // Enregistrement du résultat dans Firestore (optionnel)
      const homeworkRef = admin.firestore().collection("homework").doc();
      await homeworkRef.set({
        image_url: imageUrl,
        analysis: analysisResult.analysis,
        subject: analysisResult.subject,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        user_id: "user123", // Remplacer par l'ID utilisateur réel extrait du token
      });

      return response.status(200).json({
        success: true,
        result: analysisResult,
        homeworkId: homeworkRef.id,
      });
    } catch (error) {
      console.error("Error in analyzeImageWithAI:", error);
      return response.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
});

// Fonction pour générer une correction avec GPT-4
exports.generateCorrection = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    try {
      // Vérification de la méthode
      if (request.method !== "POST") {
        return response.status(405).json({error: "Method Not Allowed"});
      }

      // Extraction des données de la requête
      const {homeworkId} = request.body;
      if (!homeworkId) {
        return response.status(400).json({error: "Missing homeworkId"});
      }

      // Vérification de l'authentification
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return response.status(403).json({error: "Unauthorized"});
      }

      const idToken = authHeader.split("Bearer ")[1];
      let uid;
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (error) {
        console.error("Error verifying token:", error);
        return response.status(403).json({error: "Invalid token"});
      }

      // Récupération du devoir
      const homeworkRef = admin.firestore().collection("homework").doc(homeworkId);
      const homeworkDoc = await homeworkRef.get();

      if (!homeworkDoc.exists) {
        return response.status(404).json({error: "Homework not found"});
      }

      const homeworkData = homeworkDoc.data();

      // Vérification que l'utilisateur est le propriétaire du devoir
      if (homeworkData?.user_id !== uid) {
        return response.status(403).json({error: "Not authorized to access this homework"});
      }

      // Exemple de correction générée
      const correction = `
👋 Hey ! Je vois que tu bosses sur ${homeworkData?.subject}. Cool !

📝 Pour cet exercice, voici ce qu'on te demande :
${homeworkData?.analysis}

✨ Voici la correction complète :
[Correction détaillée simulée]

🔍 Comment j'ai fait pour résoudre ça :
[Explication de la méthode]

💡 Petites astuces pour la prochaine fois :
- Astuce 1
- Astuce 2
- Astuce 3

🎯 Pour t'entraîner :
Voici un exercice similaire simplifié pour pratiquer.

N'hésite pas si tu as des questions ! 😊
      `;

      // Mise à jour du document avec la correction
      await homeworkRef.update({
        correction: correction,
        corrected_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      return response.status(200).json({
        success: true,
        correction: correction,
      });
    } catch (error) {
      console.error("Error in generateCorrection:", error);
      return response.status(500).json({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
});

// Fonction pour traiter les callbacks de paiement Stripe (exemple)
exports.processStripeWebhook = functions.https.onRequest((request, response) => {
  corsHandler(request, response, async () => {
    // Implémentation à réaliser
    response.status(200).send("Webhook received");
  });
});

// Trigger qui s'exécute quand un nouveau devoir est créé
exports.onNewHomework = functions.firestore
    .document("homework/{homeworkId}")
    .onCreate(async (snapshot, context) => {
      const homeworkData = snapshot.data();
      const userId = homeworkData.user_id;

      // Mise à jour du compteur de devoirs de l'utilisateur
      const userRef = admin.firestore().collection("users").doc(userId);
      
      try {
        await admin.firestore().runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists) {
            return;
          }
          
          const userData = userDoc.data() || {};
          const homeworkCount = userData.homeworkCount || 0;
          
          transaction.update(userRef, {
            homeworkCount: homeworkCount + 1,
            lastHomeworkAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        console.log(`Updated homework count for user ${userId}`);
      } catch (error) {
        console.error("Error updating user homework count:", error);
      }
    });

// Fonction pour obtenir des statistiques utilisateur
exports.getUserStats = functions.https.onCall(async (data, context) => {
  // Vérification de l'authentification
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié."
    );
  }

  const uid = context.auth.uid;

  try {
    // Récupération des données utilisateur
    const userRef = admin.firestore().collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Utilisateur non trouvé."
      );
    }

    // Récupération des devoirs de l'utilisateur
    const homeworkQuery = await admin.firestore()
        .collection("homework")
        .where("user_id", "==", uid)
        .get();

    // Calcul des statistiques
    const totalHomework = homeworkQuery.size;
    
    // Calcul des statistiques par matière
    const subjectStats: Record<string, {count: number; lastDate: Date | null}> = {};
    
    homeworkQuery.forEach((doc) => {
      const data = doc.data();
      const subject = data.subject || "unknown";
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = {count: 0, lastDate: null};
      }
      
      subjectStats[subject].count += 1;
      
      const currentDate = data.created_at ? new Date(data.created_at) : null;
      if (currentDate && (!subjectStats[subject].lastDate || 
          currentDate > subjectStats[subject].lastDate)) {
        subjectStats[subject].lastDate = currentDate;
      }
    });

    return {
      totalHomework,
      subjectStats,
      // Ajoutez d'autres statistiques au besoin
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erreur lors de la récupération des statistiques."
    );
  }
});