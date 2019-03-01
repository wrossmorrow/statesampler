/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 *  statesampler API server
 *
 *  Copyright 2018-2019 William Ross Morrow and Stanford University
 *
 *  Licensed under a modified Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *       https://github.com/wrossmorrow/statesampler/LICENSE.md
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * IMPORTS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const protect = ( a , b ) => { return ( a ? a : b ); }

const _express      = require( 'express' );
const _bodyParser   = require( 'body-parser' );
const _cors         = require( 'cors' );
const _config       = require( 'config.json' )( protect( process.env.CONF_FILE , './../conf.json' ) );

const Samplers      = require( './samplers.js' );
const Datasets      = require( './datasets.js' );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * CONFIGURATION
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var port = protect( process.env.PORT , protect( _config.port , 5000 ) );

var defaultSamplingStrategy = protect( process.env.STRATEGY , protect( _config.strategy , 'b' ) );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * LOGGING
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * CONSTANTS AND (GLOBAL) VARIABLE DECLARATIONS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// this is IF we want to use strict CORS during the survey
/*
const corsOptions = {
    origin: "https://mydomain.qualtrics.com" ,
    optionsSuccessStatus: 200
};
*/

// holders for datasets and samplers over datasets
var datasets = {} , samplers = {};

// How long do we hold these for? There are local storage "concerns"

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * ROUTINES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// load data
const loadData = ( req , res ) => {

    if( ! req.body.type ){
        res.status( 400 ).send( "BadRequest: loadData operation requires a request body with a \"type\" field." );
        return;
    }

    var type = req.body.type.toLowerCase();
    if( /^gsheet/.test( type ) ) { return loadGoogleSheet( req , res ); }
    else if( /^csv/.test( type ) ) { return loadCSVData( req , res ); }
    else if( /^json/.test( type ) ) { return loadJSONData( req , res ); }
    else {
        res.status( 400 ).send( "BadRequest: loadData doesn't understand the \"type\" field \"" + req.body.type + "\"." );
        return;
    }

};

// load data from a Google sheet, using body as the Google sheets request spec
const loadGoogleSheet = ( req , res ) => {

    if( ! req.body.sheet ){
        res.status( 400 ).send( "BadRequest: loading data from a Google Sheet requires a request body with a \"sheet\" field." );
        return;
    }

    logger( "PUT/POST /data request for spreadsheet " 
                + req.body.sheet.id + " and range " 
                + req.body.sheet.name + "!" 
                + req.body.sheet.range );

    var D = new Datasets.GoogleSheetData( req.body.apikey );
    datasets[ D.key ] = D;

    var onError = ( err ) => {
        console.log( err.toString() ); 
        res.status(500).write( err.toString() ).send(); 
    };

    var onLoad = (  ) => {
        logger( "POST /data/load request for spreadsheet " 
                + req.body.sheet.spreadsheetId + " and range " + req.body.sheet.range 
                + " appears to have succeeded.");
        res.send( D.key );
    };

    // create actual spec for google sheet API
    var spec = {
        spreadsheetId : req.body.sheet.id , 
        range : req.body.sheet.name + "!" + req.body.sheet.range
    };

    D.loadSheet( spec , () => { 
        if( req.body.header ) { D.loadHeader( req.body.header , onLoad , onError ); }
        else { onLoad(); }
    } , onError );

    if( "name" in req.body && req.body.name ) { D.setName( req.body.name ); }
    if( "desc" in req.body && req.body.desc ) { D.setDesc( req.body.desc ); }
    
};

// load data from a CSV string
const loadCSVData = ( req , res ) => {
    var D = new Datasets.CSVData( req.body.data );
    datasets[ D.key ] = D;
    res.send( D.key );
};

// load data from a JSON object
const loadJSONData = ( req , res ) => {
    var D = new Datasets.JSONData( req.body.data );
    datasets[ D.key ] = D;
    res.send( D.key );
};

// create a sampler for a dataset
const createSampler = ( req , res ) => {

    logger( "POST /sampler/" + req.params.did + " dataset" );

    if( ! datasets[req.params.did] ) {
        res.status( 404 ).send( "DatasetNotFound: " );
        return;
    }

    if( ! req.body.type ){
        res.status( 400 ).send( "BadRequest: createSampler operation requires a request body with a \"type\" field." );
        return;
    }
    
    var S;

    if( /^[rR]/.test( req.body.type ) ) {

        if( req.body.survey ) {
            S = new Samplers.RandomSampler( datasets[req.params.did] , req.body.survey );
        } else {
            S = new Samplers.RandomSampler( datasets[req.params.did] );
        }
        samplers[ S.key ] = S;

        if( req.body.dist ) { S.define( req.body.dist ); }

    } else if( /^[dD]/.test( req.body.type ) ) {

        if( req.body.survey ) {
            S = new Samplers.DoESampler( datasets[req.params.did] , req.body.survey );
        } else {
            S = new Samplers.DoESampler( datasets[req.params.did] );
        }
        samplers[ S.key ] = S;

        if( req.body.plan ) { S.define( req.body.plan ); }

    } else {

        res.status( 400 ).send( "BadRequest: createSampler doesn't understand the \"type\" field \"" + req.body.type + "\"." );
        return;
        
    }

    if( "name" in req.body && req.body.name ) { S.setName( req.body.name ); }
    if( "desc" in req.body && req.body.desc ) { S.setDesc( req.body.desc ); }

    res.send( S.key );

};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * SERVER SETUP AND MIDDLEWARE
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var app = _express();

app.set( 'port' , port );
app.use( _bodyParser.json() );
app.use( _bodyParser.urlencoded({ extended: false }) );
app.use( _cors() );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * SERVER ROUTES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// app.options('/', _cors(corsOptions) , ... ) for more restrictive CORS settings

// a blank request to serve as info
app.get( '/' , (req,res) => {
    logger( "GET  / request" );
    res.send("STATESAMPLER API server to assist with sampling data for online surveys."); 
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * NEW API
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// data loading routes
app.put( '/data' , loadData ); app.post( '/data' , loadData ); 

// get data (ids only)
app.get( '/data' , ( req , res ) => {
    logger( "GET /data request" );
    res.json( Object.keys( datasets ) );
} );

// delete a dataset
app.delete( '/data/:did' , ( req , res ) => {
    if( ! datasets[req.params.did] ) {
        res.status( 404 ).send( "DatasetNotFound: " );
        return;
    }
    delete datasets[req.params.did];
    res.send( );
} );

// get dataset header that will be used to label response fields
app.get( '/header/:did' , ( req , res ) => { 
    if( ! datasets[req.params.did] ) {
        res.status( 404 ).send( "DatasetNotFound: " );
        return;
    }
    res.json( datasets[req.params.did].header ); 
} );

// get summary data about samplers
app.get( '/samplers' , ( req , res ) => {
    var r = Object.values( samplers ).map( S => (
        { id : S.key , name : S.name , desc : S.desc }
    ) );
    res.json( r );
} );

// create a sampler for a dataset (referenced by ID)
app.put( '/sampler/:did' , createSampler ); app.post( '/sampler/:did' , createSampler );

// update properties of a sampler
app.patch( '/sampler/:sid' , ( req , res ) => {
    res.send();
} );

// get summary data about a sampler
app.get( '/sampler/:sid' , ( req , res ) => {
    res.send();
} );

// delete a sampler
app.delete( '/sampler/:sid' , ( req , res ) => {
    if( ! samplers[req.params.sid] ) {
        res.status( 404 ).send( "SamplerNotFound: " );
        return;
    }
    delete samplers[req.params.sid];
    res.send( );
} );

// sample an actual row (requires sheet loaded)
app.get( '/sample/:sid' , ( req , res ) => {

    logger( "GET /sample/" + req.params.sid + " request" );

    if( ! samplers[req.params.sid] ) {
        res.status( 404 ).send( "SamplerNotFound: " );
        return;
    }

    // get survey, response, and/or question ids if they exist in the query params
    var sid = ( "survey"   in req.query ? req.query.survey   : ( "s" in req.query ? req.query.s : null ) ); 
    var rid = ( "response" in req.query ? req.query.response : ( "r" in req.query ? req.query.r : null ) ); 
    var qid = ( "question" in req.query ? req.query.question : ( "q" in req.query ? req.query.q : null ) ); 

    var response = samplers[req.params.sid].sample( rid , qid );
    if( response === null ) { res.status( 400 ).send( ); }
    else { res.json( response ); }

} );

// placeholder for feedback about choices made in response to samples drawn
app.post( '/choices/:sid' , ( req , res ) => {

    res.send();

} );

// get a sampler's vector of counts (debugging, basically)
app.get( '/counts/:sid' , (req,res) => { 
    logger( "GET  /counts/" + req.params.sid + " request " );
    if( ! samplers[req.params.sid] ) {
        res.status( 404 ).send( "SamplerNotFound: " );
        return;
    }
    res.json( samplers[req.params.sid].counts ); 
} );

// reset a sampler's counts vector. Same effect as reloading the sheet. 
app.post( '/reset/:sid' , (req,res) => { 
    logger( "POST /reset/" + req.params.sid + " request " );
    if( ! samplers[req.params.sid] ) {
        res.status( 404 ).send( "SamplerNotFound: " );
        return;
    }
    samplers[req.params.sid].reset();
    res.send();
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * CLIENT SIDE ERROR HANDLING
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// naive error post back method; this is so we write client-side errors back into the server log
app.post( '/error' , (req,res) => { 
    logger( "POST /error request : " + JSON.stringify( req.body ) );
    res.send(); 
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * SERVER LAUNCH
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var server = undefined;
if( _config.ssl ) {
    server = _https.createServer( {
        key     : _fs.readFileSync( _config.ssl.key  ) ,
        cert    : _fs.readFileSync( _config.ssl.cert ) ,
        ca      : _fs.readFileSync( _config.ssl.csr  ) ,
        requestCert : false ,
        rejectUnauthorized : false
    } , app );
    server.listen( port , () => logger( "Listening on port " + port ) );
} else {
    server = app.listen( port , () => logger( "Listening on port " + port ) );
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
