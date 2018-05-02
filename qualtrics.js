Qualtrics.SurveyEngine.addOnload( function()
{
	
	// question index. change this in different questions, so we don't have to make multiple changes below. 
	// (it would be nice if this was more automated...)
	var questionIndex = 1;

	// get place to store custom HTML for rows sampled...
	var container = this.getQuestionTextContainer();

	// call sampler API's main routine
	fetch( "https://my.server.com/statesampler/api/sample" )
		.then( data => {
			// process data recieved as JSON data
			data.json().then( json => {

					// Replace question's text container with a custom format of the response 
					container.innerHTML = ...

					// store the Row number as embedded data so we have it later for response analysis
					Qualtrics.SurveyEngine.setEmbeddedData( 'R' + questionIndex , json.Row );

				} )
			} , error => {

				// Dump error, if we can, to the server. Otherwise we have no window into client-side errors. 
				var postOpt = { method : 'post', body : JSON.stringify( error ) };
				fetch( "https://my.server.com/statesampler/api/error" , postOpt );

			} );

} );