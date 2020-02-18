/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 *  statesampler API server
 *
 *  Copyright 2018+ William Ross Morrow and Stanford University
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

// a function to call for coordination; initialized as a no-op, will defined by a master 
// thread when appropriate
var coordinate = () => {};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * BASIC ROUTINES
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// "internal", recursive call. DONT INVOKE DIRECTly, use "firstOfIn"
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
const notAuthorized = ( req , res ) => {
    res.status(403).send( "NotAuthorized: you are not allowed to make this call.\n" );
}

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
const loadData = ( data ) => {
    return new Promise( ( resolve , reject ) => {
        try {
            var D = new ( Datasources[data.type] )( data.source , data.options );
            datasets[ D.key ] = D; // create data set in the local store
            D.load() // actually "load" the data, whatever that means for the source
                .then( () => { resolve( { key : D.key , secret : D.secret } ); } )
                .catch( reject );
        } catch( err ) { reject( err ); }
    } );

};

// load data
const loadDataRequest = ( req , res ) => {

    if( ! req.body.type ){
        return res.status(400).send( "BadRequest: loading data requires a request body with a \"type\" field." );
    }

    if( ! ( req.body.type in Datasources ) ) {
        return res.status(400).send( `BadRequest: "${req.body.type}" is not a defined data source.` );
    }

    // default empty source
    if( ! ( "source" in req.body ) ) { req.body.source = ""; }

    // default empty options
    if( ! ( "options" in req.body ) ) { req.body.options = {}; }

    // don't let people request with defined secrets
    if( "secret" in req.body.options ) { delete req.body.options.secret; }

    // define data to load using
    let data = {
        request : 'dataset' ,
        type    : req.body.type , 
        source  : req.body.source , 
        options : req.body.options , 
    };

    // ok, actually load the data
    loadData( data )
        .then( ( result ) => {
            res.send( result );
            data.options.key = result.key; // we have to make sure keys are shared...
            data.options.secret = result.secret; // we have to make sure secrets are shared...
            coordinate( data );
        } ).catch( err => {
            res.status(500).send( err.toString() ); // ONLY IF WE HAVEN'T ALREADY RESPONDED
        } );

};

// attempt to create the sampler, store in our samplers object and resolve
const createSampler = ( data ) => {
    return new Promise( ( resolve , reject ) => {
        try {
            var S = new ( Samplers[data.type] )( datasets[data.dataset] , data.options );
            samplers[ S.key ] = S;
            resolve( { key : S.key , secret : S.secret } );
        } catch( err ) { reject(err); }
    } );
};

// create a sampler for a dataset
const createSamplerRequest = ( req , res ) => {

    if( ! datasets[req.params.did] ) { 
        return datasetNotFound( req , res ); 
    }

    if( ! req.body.type ) {
        return res.status(400).send( "BadRequest: creating a sampler requires a request body with a \"type\" field." );
    }

    if( ! ( req.body.type in Samplers ) ) {
        return res.status(400).send( `BadRequest: "${req.body.type}" is not a defined sampler.` );
    }

    // default empty options
    if( ! ( "options" in req.body ) ) { req.body.options = {}; }

    // don't let people request with defined secrets
    if( "secret" in req.body.options ) {
        delete req.body.options.secret;
    }

    let data = {
        request : 'sampler' ,
        type    : req.body.type , 
        dataset : req.params.did , 
        options : req.body.options
    };

    createSampler( data )
        .then( ( result ) => {
            res.send( result );
            data.options.key = result.key; // we have to make sure keys are shared...
            data.options.secret = result.secret; // we have to make sure secrets are shared...
            coordinate( data );
        } ).catch( err => {
            return res.status( err.code ).send( err.message ); 
        } );

};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const launchServer = ( port ) => {

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

        logger( "REQLOG," + process.pid 
                        + "," + req.key 
                        + "," + req.method.toUpperCase()
                        + "," + req.url );

        const send_ = res.send;
        res.send = function( object ) { 
            const now = Date.now() / 1000.0;
            logger(  "RESLOG," + process.pid 
                            + "," + req.key 
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
        coordinate( { request : '/' } );
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

    // get data (ids only?)
    app.get( '/data' , ( req , res ) => {
        res.json( Object.keys( datasets ) );
    } );

    // data loading routes
    app.put(  '/data' , loadDataRequest ); // (coordinated across other servers)
    app.post( '/data' , loadDataRequest ); // (coordinated across other servers)

    // get data (full content)
    app.get( '/data/:did' , ( req , res ) => {
        if( ! datasets[req.params.did] ) { return datasetNotFound( req , res ); }
        res.json( datasets[req.params.did].info() );
    } );

    // get data row (debugging)
    app.get( '/data/:did/row/:row' , ( req , res ) => {
        if( ! datasets[req.params.did] ) { return datasetNotFound( req , res ); }
        res.json( datasets[req.params.did].getRow( parseInt( req.params.row ) ) );
        // coordinate across other server instances? 
    } );

    // delete a dataset
    app.delete( '/data/:did' , ( req , res ) => {
        if( ! datasets[req.params.did] ) { return datasetNotFound( req , res ); }
        if( ! "secret" in req.body ) { return notAuthorized( req , res ); }
        if( datasets[req.params.did].secret !== req.body.secret ) { return notAuthorized( req , res ); }
        delete datasets[req.params.did];
        res.send( );
        // coordinate across other server instances? 
    } );

    // get dataset header that will be used to label response fields
    app.get( '/header/:did' , ( req , res ) => { 
        if( ! datasets[req.params.did] ) { return datasetNotFound( req , res ); }
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
        if( "types" in req.query ) {
            res.json( Object.keys( Samplers ) );
        } else {
            var r = Object.values( samplers ).map( S => ( { id : S.key , name : S.name , desc : S.desc } ) );
            res.json( r );
        }
    } );

    // create a sampler for a dataset (referenced by it's ID)
    app.put(  '/sampler/:did' , createSamplerRequest ); // (coordinated across other servers)
    app.post( '/sampler/:did' , createSamplerRequest ); // (coordinated across other servers)

    // PLACEHOLDER: get summary data about a sampler
    app.get( '/sampler/:sid' , ( req , res ) => {
        if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
        res.json( samplers[req.params.sid].info() );
    } );

    // update properties of a sampler
    app.patch( '/sampler/:sid' , ( req , res ) => {
        if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }

        if( ! "secret" in req.body ) { return notAuthorized( req , res ); }
        if( samplers[req.params.sid].secret !== req.body.secret ) { return notAuthorized( req , res ); }
        res.send();
        // coordinate across other server instances? 
    } );

    // delete a sampler
    app.delete( '/sampler/:sid' , ( req , res ) => {
        if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
        if( ! "secret" in req.body ) { return notAuthorized( req , res ); }
        if( samplers[req.params.sid].secret !== req.body.secret ) { return notAuthorized( req , res ); }
        delete samplers[req.params.sid];g
        res.send( );
        // coordinate across other server instances? 
    } );

    // sample an actual row (requires sheet loaded)
    app.get( '/sample/:sid' , ( req , res ) => {

        if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }

        var sid = req.params.sid;

        // get survey, response, and/or question ids if they exist in the query params
        var rid = firstOfIn( req.query , ["r","rid","response"] ) , 
            qid = firstOfIn( req.query , ["q","qid","question"] ) ;

        // construct sampler response (Promise-based? that would be general...)
        var smpl = samplers[req.params.sid].sample( rid , qid );
        if( smpl === null ) { res.status( 400 ).send( ); }
        else { 
            if( Promise.resolve( smpl ) === smpl ) { // returned value is a promise
                smpl.then( data => { res.json( data ); } )
                    .catch( err => { res.status(500).send(err.toString()); } )
            } else { res.json( smpl ); } // returned value is NOT a promise

            // coordinate sample with other server instances?

        }

    } );

    // PLACEHOLDER: feedback about _choices made_ in response to samples drawn
    app.post( '/choices/:sid' , ( req , res ) => {
        if( ! ( req.params.sid in samplers ) ) { return samplerNotFound( req , res ); }
        res.send();
        // coordinate across other server instances? 
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
        if( ! "secret" in req.body ) { return notAuthorized( req , res ); }
        if( samplers[req.params.sid].secret !== req.body.secret ) { return notAuthorized( req , res ); }
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

    const onListen = () => logger( `Process ${process.pid} listening on port ${port}` );

    var server = undefined;
    if( _config.ssl ) {
        server = _https.createServer( {
            key     : _fs.readFileSync( _config.ssl.key  ) ,
            cert    : _fs.readFileSync( _config.ssl.cert ) ,
            ca      : _fs.readFileSync( _config.ssl.csr  ) ,
            requestCert : false ,
            rejectUnauthorized : false
        } , app );
        server.listen( port , onListen );
    } else {
        server = app.listen( port , onListen );
    }

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

module.exports = {

    launch : launchServer , 

    coord  : ( f ) => { 
        coordinate = ( d ) => {
            logger( `coordinate call "${d.request}" from process "${process.pid}"` );
            f( d );
        };
    } , 

    align  : ( d ) => {

        logger( `align request "${d.request}" in process "${process.pid}"` );

        if( /^sample$/.test( d.request ) ) {

        } else if( /^dataset$/.test( d.request ) ) {

            loadData( d )
                .then( () => {
                    logger( "coordinated build of dataset succeeded" );
                } ).catch( console.log );

        } else if( /^sampler$/.test( d.request ) ) {

            createSampler( d )
                .then( () => {
                    logger( "coordinated build of sampler succeeded" );
                } ).catch( console.log );

        } else {

        }
    }
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