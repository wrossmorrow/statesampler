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

const _express      = require( 'express' );
const _bodyParser   = require( 'body-parser' );
const _cors         = require( 'cors' );

const _crypto       = require( 'crypto' );

const Datasources   = require( './loader.js' )( __dirname + "/datasources" , /.js$/ , "DataSourceBase.js" );
const Samplers      = require( './loader.js' )( __dirname + "/samplers" , /.js$/ , "SamplerBase.js" );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * CONFIGURATION
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const protect = ( a , b ) => { return ( a ? a : b ); }

const _config = require( 'config.json' )( protect( process.env.CONF_FILE , './../conf.json' ) );

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

// How long do we hold these for? There are local storage "concerns", yeah? 

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * BASIC ROUTINES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// "internal", recursive call. don't invoke directly, use "firstOfIn"
const _firstOfIn = ( obj , keys , i ) => {
    if( i >= keys.length ) { return null; }
    if( keys[i] in obj ) { return obj[keys[i]]; }
    else { return _firstOfIn( obj , keys , i+1 ); }
}

// 
const firstOfIn = ( obj , keys ) => { _firstOfIn( obj , keys , 0 ); }

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * RESPONSE WRAPPERS
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// generic response when a sampler was not found
const datasetNotFound = ( req , res ) => {
    res.status(404).send( `DatasetNotFound: ${req.params.did} is not defined and loaded.\n` );
}

// generic response when a sampler was not found
const samplerNotFound = ( req , res ) => {
    res.status(404).send( `SamplerNotFound: ${req.params.sid} is not registered.\n` );
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * MORE INVOLVED ROUTINES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// load data
const loadData = ( req , res ) => {

    if( ! req.body.type ){
        return res.status(400).send( "BadRequest: loading data requires a request body with a \"type\" field." );
    }

    if( ! ( req.body.type in Datasources ) ) {
        return res.status(400).send( `BadRequest: "${req.body.type}" is not a defined data source.` );
    }

    // attempt to create the dataset from requested source
    var D;
    try {
        D = new (Datasources[req.body.type])( req.body.options );
    } catch( err ) {
        console.error( err )
        return res.status( err.code ).send( err.message ); 
    }

    // respond after construction? or after load? I think after load. 
    // res.send( D.key );

    // create data SET
    datasets[ D.key ] = D;

    var onError = ( err ) => {
        console.log( err.toString() ); 
        res.status(500).send( err.toString() ); // ONLY IF WE HAVEN'T ALREADY RESPONDED
    };

    var onLoad = (  ) => {
        res.send( D.key ); // ONLY IF WE HAVEN'T ALREADY RESPONDED
    };

    // actually "load" the data, whatever that means for the source
    D.load().then( onLoad ).catch( onError );

};

// create a sampler for a dataset
const createSampler = ( req , res ) => {

    if( ! datasets[req.params.did] ) { 
        return datasetNotFound( req , res ); 
    }

    if( ! req.body.type ) {
        return res.status(400).send( "BadRequest: creating a sampler requires a request body with a \"type\" field." );
    }

    if( ! ( req.body.type in Samplers ) ) {
        return res.status(400).send( `BadRequest: "${req.body.type}" is not a defined sampler.` );
    }
    
    // attempt to create the sampler
    var S;
    try {
        S = new (Samplers[req.body.type])( datasets[req.params.did] , req.body.options );
    } catch( err ) {
        console.log( err )
        return res.status( err.code ).send( err.message ); 
    }

    // respond after construction (no "loading")
    res.send( S.key );

    // store in our samplers object
    samplers[ S.key ] = S;

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

// logging middleware
app.use( function( req , res , next ) { 

    const start = Date.now() / 1000.0; 
    req.key = _crypto.randomBytes(12).toString('hex');

    logger( "REQLOG," + req.key 
                    + "," + req.method.toUpperCase()
                    + "," + req.url );

    const send_ = res.send;
    res.send = function( object ) { 
        const now = Date.now() / 1000.0;
        logger(  "RESLOG," + req.key 
                        + "," + req.method.toUpperCase()
                        + "," + req.url
                        + "," + res.statusCode
                        + "," + start.toFixed(3) 
                        + "," + now.toFixed(3) 
                        + "," + (now-start).toFixed(3) );
        send_.call( res , object );
    };

    next();

} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * GENERIC SERVER ROUTES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// app.options('/', _cors(corsOptions) , ... ) for more restrictive CORS settings

// a blank request to serve as info
app.get( '/' , (req,res) => {
    res.send( "STATESAMPLER server, to assist with sampling content for online surveys." ); 
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * DATASET ROUTES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// data loading routes
app.put(  '/data' , loadData ); 
app.post( '/data' , loadData ); 

// get data (ids only?)
app.get( '/data' , ( req , res ) => {
    res.json( Object.keys( datasets ) );
} );

// get data (full content)
app.get( '/data/:did' , ( req , res ) => {
    if( ! datasets[req.params.did] ) {
        return datasetNotFound( req , res ); 
    }
    res.json( datasets[req.params.did] );
} );

// get data row (debugging)
app.get( '/data/:did/row/:row' , ( req , res ) => {
    if( ! datasets[req.params.did] ) {
        return datasetNotFound( req , res ); 
    }
    res.json( datasets[req.params.did].getRow( parseInt( req.params.row ) ) );
} );

// delete a dataset
app.delete( '/data/:did' , ( req , res ) => {
    if( ! datasets[req.params.did] ) {
        return datasetNotFound( req , res ); 
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

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * SAMPLER ROUTES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// get summary data about samplers
app.get( '/samplers' , ( req , res ) => {
    var r = Object.values( samplers ).map( S => ( { id : S.key , name : S.name , desc : S.desc } ) );
    res.json( r );
} );

// create a sampler for a dataset (referenced by it's ID)
app.put(  '/sampler/:did' , createSampler ); 
app.post( '/sampler/:did' , createSampler );

// PLACEHOLDER: get summary data about a sampler
app.get( '/sampler/:sid' , ( req , res ) => {
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
    res.json( samplers[req.params.sid].info() );
} );

// update properties of a sampler
app.patch( '/sampler/:sid' , ( req , res ) => {
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
    res.send();
} );

// delete a sampler
app.delete( '/sampler/:sid' , ( req , res ) => {
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
    delete samplers[req.params.sid];
    res.send( );
} );

// sample an actual row (requires sheet loaded)
app.get( '/sample/:sid' , ( req , res ) => {

    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }

    // get survey, response, and/or question ids if they exist in the query params
    
    //var sid = ( "survey"   in req.query ? req.query.survey   : ( "s" in req.query ? req.query.s : null ) ); 
    //var rid = ( "response" in req.query ? req.query.response : ( "r" in req.query ? req.query.r : null ) ); 
    //var qid = ( "question" in req.query ? req.query.question : ( "q" in req.query ? req.query.q : null ) ); 

    var sid = firstOfIn( req.query , ["s","sid", "survey" ] ) , // is this used? 
        rid = firstOfIn( req.query , ["r","rid","response"] ) , 
        qid = firstOfIn( req.query , ["q","qid","question"] ) ;

    // construct sampler response (Promise-based? that would be general...)
    var smpl = samplers[req.params.sid].sample( rid , qid );
    if( smpl === null ) { res.status( 400 ).send( ); }
    else { 
        if( Promise.resolve( smpl ) === smpl ) { // returned value is a promise
            smpl.then( data => { res.json( data ); } )
                .catch( err => { res.status(500).send(err.toString()); } )
        } else { res.json( smpl ); }
    }

} );

// PLACEHOLDER: feedback about _choices made_ in response to samples drawn
app.post( '/choices/:sid' , ( req , res ) => {
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
    res.send();
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * INFORMATION ROUTES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// get a sampler's vector of counts (debugging, basically)
app.get( '/counts/:sid' , ( req , res ) => { 
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
    res.json( samplers[req.params.sid].counts ); 
} );

// reset a sampler's counts vector. Same effect as reloading the sheet on which the data
// is being drawn? 
app.post( '/reset/:sid' , (req,res) => { 
    if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
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

// PLACEHOLDER: error post back method; this is so we write client-side errors back into the 
// server log or database. need to actually store the data somewhere... 
app.post( '/error' , (req,res) => { 
    res.send(); 
} );

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * ACTUAL SERVER LAUNCH
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