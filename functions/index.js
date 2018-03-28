'use strict';

const functions = require('firebase-functions'); // Cloud Functions for Firebase library

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const ref = admin.database().ref('/recipe-tracker');

const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.result) {
    processV1Request(request, response);
  } else {
    console.log('Invalid Request');
    return response.status(400).end('Invalid Webhook Request (expecting v1 webhook request)');
  }
});

/*
* Function to handle v1 webhook requests from Dialogflow
*/
function processV1Request (request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {

      'input.add_recipe': () => {

        //todo write to database

        var contextObj = JSON.parse('[{"name":"edit_recipe", "lifespan":5, "parameters":{}}]');

        let responseToUser = {
          speech: 'You created a new recipe. Please say first inredient',
          text: 'You created a new recipe. Please say first inredient',
          contexts : contextObj
        };

        if (requestSource === googleAssistantRequest) {
            sendGoogleResponse(responseToUser);
        } else {
            sendResponse(responseToUser);
        }
      },

      'input.open_recipe': () => {

        //todo write to database

        var contextObj = JSON.parse('[{"name":"edit_recipe", "lifespan":5, "parameters":{}}]');

        let responseToUser = {
          speech: 'You opened a new recipe. Please continue cooking',
          text: 'You opened a new recipe. Please continue cooking',
          contexts : contextObj
        };

        if (requestSource === googleAssistantRequest) {
            sendGoogleResponse(responseToUser);
        } else {
            sendResponse(responseToUser);
        }
      },

      'edit_recipe.add_record': () => {

        //add ingredient to database
		    var newChildRef = ref.push();
        newChildRef.set(parameters);

        var contextObj = JSON.parse('[{"name":"edit_recipe", "lifespan":5, "parameters":{}}]');
        
        let responseToUser = {
          speech: 'Ingredient added!',
          text: 'Ingredient added!',
          contexts : contextObj
        };
	  
        if (requestSource === googleAssistantRequest) {
            sendGoogleResponse(responseToUser);
        } else {
            sendResponse(responseToUser);
        }
      },

      'input.read_recipe': () => {

        //todo read from database

        if (requestSource === googleAssistantRequest) {
            sendGoogleResponse('Your recipe contains the next ingredients');
        } else {
            sendResponse('Your recipe contains the next ingredients');
        }
      },

      'input.unknown': () => {
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      
      let responseToUser = {
        speech: 'Sorry, I can\'t help!', // spoken response
        text: 'Sorry, I can\'t help!' // displayed response
      };
    
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse(responseToUser);
      } else {
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.contexts) {
        app.setContext(responseToUser.contexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.contexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
}