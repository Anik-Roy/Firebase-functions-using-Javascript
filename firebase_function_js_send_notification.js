const functions = require('firebase-functions');
// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');

var serviceAccount = require("./healthfull-7553e-firebase-adminsdk-kihdv-339c6a4d04.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cohesive-folio-192513.firebaseio.com"
});

// Take the text parameter passed to this HTTP endpoint and insert it into 
// Cloud Firestore under the path /messages/:documentId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into Cloud Firestore using the Firebase Admin SDK.
    const writeResult = await admin.firestore().collection('messages').add({original: original});
    // Send back a message that we've succesfully written the message
    console.log("add message console")
    res.json({result: `Message with ID: ${writeResult.id} added.`});
  });
  
  // Listens for new messages added to /messages/:documentId/original and creates an
  // uppercase version of the message to /messages/:documentId/uppercase
  exports.makeUppercase = functions.firestore.document('/messages/{documentId}')
      .onCreate((snap, context) => {
        // Grab the current value of what was written to Cloud Firestore.
        const original = snap.data().original;
  
        // Access the parameter `{documentId}` with `context.params`
        console.log('Uppercasing', context.params.documentId, original);
        
        const uppercase = original.toUpperCase();
        
        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to Cloud Firestore.
        // Setting an 'uppercase' field in Cloud Firestore document returns a Promise.
        return snap.ref.set({uppercase}, {merge: true});
});

// This registration token comes from the client FCM SDKs.
var registrationToken = 'fENqK6_lRsiStQ17IJYWXU:APA91bGeCA_1El57xo1h19zjoZYvcm-Iin9jm95G8L6VOLSX4nr-tG1VTqLw5SHJsREF_5HnCWx8gYAJC-cv3M0NodmxzjOfOQ2FaeggxaACu7ETPaj7xeJcoAeDL46Ijz4M9ydQ2Hba';
var message = {
  data: {
    score: '850',
    time: '2:45'
  },
  token: registrationToken
};

exports.sendNotification = functions.https.onRequest(async (req, res) => {
  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      res.json({result: `notification with ID: ${registrationToken} sent`});
      return console.log('Successfully sent message:', registrationToken);
    })
    .catch((error) => {
      return console.log('Error sending message:', registrationToken);
    });
});

exports.getUsersIds = functions.https.onRequest(async (req, res) => {
  admin.firestore().doc("id-collections/user-ids").get()
  .then(usersSnapshot => {
    const user_ids = Object.keys(usersSnapshot.data());
    const promises = [];
    
    //res.send(user_ids[0]); // it will return all user id in browser window

    user_ids.forEach(element => {
        console.log(element);
        const p = admin.firestore().doc(`users/${element}`).get();
        promises.push(p);
    });

    // for(const user_id in user_ids) {
    //   const p = admin.firestore().doc(`users/${user_id}`).get();
    //   console.log(user_id);
    //   promises.push(p);
    // }
    return Promise.all(promises);
  })
  .then(tokenSnapshot => {
    const registrationTokens = [];
    tokenSnapshot.forEach(token => {
      tokenId = token.data().firebase_instance_id;
      registrationTokens.push(tokenId);
    })

    const message = {
      data: {title: 'Take more food to complete your daily necessary colorie', target: 'You\'ve to take more 150 colorie', time: '2:45'},
      tokens: registrationTokens,
    }
    
    admin.messaging().sendMulticast(message)
      .then((response) => {
        console.log(response.successCount + ' messages were sent successfully');
        return response.successCount + ' messages were sent successfully';
      })
      .catch(error => {
        console.log(error)
        res.status(500).send(error);
      });

    return res.send(registrationTokens);
  })
  .catch(error => {
    // handle the error
    console.log(error)
    res.status(500).send(error);
  })
});

exports.getAllUserData = functions.https.onRequest(async (req, res) => {
  admin.firestore().doc("users/JhVK8PaaCkdElcPjpOmILxyjsJt1").get()
  .then(snapshot => {
    const mydata = snapshot.data();
    return res.send(mydata);
  })
  .catch(error => {
    // handle the error
    console.log(error)
    res.status(500).send(error);
  })
});
