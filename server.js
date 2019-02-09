/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 *  statesampler API server
 *
 *  Copyright 2018 William Ross Morrow
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
const _config       = require( 'config.json' )( protect( process.env.CONF_FILE , 'conf.json' ) );
// const _rng       = require( 'rng-js' );
const { google }    = require( 'googleapis' );

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

var gapiKey = protect( process.env.GAPIKEY , protect( _config.googleAPIKey , undefined ) );
var sheetId = protect( process.env.SHEETID , protect( _config.spreadsheetId , undefined ) );
var shrange = protect( process.env.SHRANGE , protect( _config.sheetNameRange , undefined ) );

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

const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

const sampleRow_u = function() { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random();
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_b = function() { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random() * ( 1.0 - Math.min( 1.0 , c/rowRequestCount ) );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_e = function() { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.exp( - Math.random() * c );
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

const sampleRow_r = function() { 
    var R = 0 , maxS = -1.0 , tmp = 0.0;
    counts.forEach( (c,i) => {
        tmp = Math.random() / c;
        if( tmp > maxS ) { maxS = tmp; R = i; }
    } );
    return R;
}

function extendedLexLessThan( s1 , s2 ) {
    if( s1.length < s2.length ) { return true; }
    if( s1.length > s2.length ) { return false; }
    return s1 < s2;
}

function getNameFromNumber( n ) {
    var nmod = n % 26;
    var chr = String.fromCharCode( 65 + nmod );
    var nfr = Math.floor( n / 26.0 );
    return ( nfr > 0 ? getNameFromNumber( nfr - 1 ) + chr : chr );
}

function listRange( start , finish ) {
    var istart = 0 , ifinish = 0;
    var nstart = getNameFromNumber( istart );
    while( extendedLexLessThan( nstart , start ) ) { istart += 1; nstart = getNameFromNumber( istart ); }
    ifinish = istart; 
    nfinish = getNameFromNumber( ifinish );
    while( extendedLexLessThan( nfinish , finish ) ) { ifinish += 1; nfinish = getNameFromNumber( ifinish ); }
    return [istart,ifinish];
}

// global variables, modifiable during server operation
var sheets = undefined , 
    header = [] , 
    rowRange = [1,1] , 
    colRange = ['A','A'] , 
    rows = [] , 
    counts = [] , 
    maxResponsesPerRow = 5 , 
    strategy = defaultSamplingStrategy , 
    sampleRow = sampleRow_b , 
    rowRequestCount = 0;

switch( strategy ) { 
    case 'u' : sampleRow = sampleRow_u; break;
    case 'b' : sampleRow = sampleRow_b; break;
    case 'e' : sampleRow = sampleRow_e; break;
    case 'r' : sampleRow = sampleRow_r; break;
    default  : return;
}

// uses sheets, so put after variable declaration
function loadSheet( spec , onLoad , onError ) {

    if( ! sheets ) { 
        if( onError ) { onError( "ValueError: No sheets object initialized." ); } 
        return; 
    }

    sheets.spreadsheets.values.get( spec , ( error , response ) => {

        // respond to caller based on status
        if( error ) { 
            if( onError ) { onError( error ); }
            return;
        }

        // 
        if( onLoad ) { onLoad(); }

        // actually load rows and set counts vector
        rows = Object.assign( [] , response.data.values );
        counts = new Array( rows.length );
        for( var i = 0 ; i < rows.length ; i++ ) { counts[i] = 0.0; }

        // initialize header by parsing range spec sent in
        var match = /(.*)!([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)/.exec( spec.range );
        sheetName = match[1];
        colRange[0] = match[2];
        colRange[1] = match[4];
        rowRange[0] = parseInt( match[3] );
        rowRange[1] = parseInt( match[5] );

        var iColRange = listRange( colRange[0] , colRange[1] );
        header = [];
        for( var i = iColRange[0] ; i <= iColRange[1] ; i++ ) {
            header.push( getNameFromNumber( i ) );
        }

    });

}

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
    res.send("API server to return sampled rows from a Google sheet.. "); 
} );

// load google sheets app using an API key passed in the request body (data)
app.post( '/sheets/init' , ( req , res ) => {
    logger( "POST /sheets/init request (apikey sent not logged)" );
    sheets = google.sheets( { version : 'v4' , auth : req.body.apikey } );
    // console.log( sheets );
    res.send();
}); 

// load actual google sheet, using body as the Google sheets request spec
app.post( '/sheet/load' , ( req , res ) => {

    // for example, called with data like 
    // 
    //      req.body ~ { spreadsheetId : '...' , range : 'Sheet1!A2:D6' }
    //
    // that is, the request body (data) should contain the sheets request. 

    logger( "POST /sheet/load request for spreadsheet " 
                + req.body.spreadsheetId + " and range " + req.body.range );

    if( !sheets ) { 
        res.write( "Cannot load a sheet before initializing Google API (POST to /sheets/init)" );
        res.status(500).send();
        return;
    }

    loadSheet(  req.body , 
                () => res.send() , 
                (e) => {
		    // JSON.stringify( e.errors );
		    res.status(e.code).write( JSON.stringify(e.errors) );
		    res.send();
    } );

    // DON'T respond to the caller without actually loading sheet... which is an async call
    // so we can't respond here. need to know if this succeeds. 

}); 

// load actual google sheet, using body as the Google sheets request spec
app.post( '/sheet/header' , ( req , res ) => {

    // for example, called with data like 
    // 
    //      req.body ~ { spreadsheetId : '...' , range : 'Sheet1!A2:D6' }
    //
    // that is, the request body (data) should contain the sheets request. 

    logger( "POST /sheet/header request using spreadsheet " + req.body.spreadsheetId 
                + ", sheet " + req.body.sheet 
                + ", columns " + req.body.from + " to " + req.body.to
                + ", and row " + req.body.row );

    if( !sheets ) { 
        res.write( "Cannot load a sheet before initializing Google API (POST to /sheets/init)" );
        res.status(500).send();
        return;
    }

    var request = { spreadsheetId : req.body.spreadsheetId , 
                    range : req.body.sheet + "!" 
                                + req.body.from + "" + req.body.row 
                                + ":" + req.body.to + "" + req.body.row }

    sheets.spreadsheets.values.get( request , ( err , response ) => {

        // respond to caller based on status
        if( err ) { 
            console.log( err ); 
            res.status(500).write( JSON.stringify(err) ).send(); 
            return;
        } else { res.send(); }

        // actually set header (for fields in each row)
        header = Object.assign( [] , response.data.values[0] );

    });

    // don't respond to the caller without loading sheet... which is an async call

}); 

// get header that will be used to label response fields
app.get( '/header' , ( req , res ) => { res.json( header ); } );

// set the sampling strategy
app.post( '/strategy/:s' , ( req , res ) => {
    logger( "POST /strategy request, change to " + req.params.s );
    switch( req.params.s ) { 
        case 'u' : strategy = req.params.s; sampleRow = sampleRow_u; break;
        case 'b' : strategy = req.params.s; sampleRow = sampleRow_b; break;
        case 'e' : strategy = req.params.s; sampleRow = sampleRow_e; break;
        case 'r' : strategy = req.params.s; sampleRow = sampleRow_r; break;
        default : 
            res.write( "Strategy code " + req.params.s + " not understood. Please use one of 'b', 'u', 'e', 'r'." )
            res.send( 500 );
            return;
    }
    res.send();
});

// get (text describing) the sampling strategy
app.get( '/strategy' , ( req , res ) => {
    logger( "GET  /strategy request" );
    switch( strategy ) { 
        case 'u' : res.write( "Set to sample uniformly randomly." ); res.send(); break;
        case 'b' : res.write( "Set to sample balanced-uniformly, up to a count of " + maxResponsesPerRow + " views." ); res.send(); break;
        case 'e' : res.write( "Set to sample exponentially randomly, away from large counts." ); res.send(); break;
        case 'r' : res.write( "Set to sample reciprocally randomly, away from large counts." ); res.send(); break;
        default : 
            res.write( "Strategy code " + req.params.s + " not understood." )
            res.send();
            break;
    }
});

const sampleRowRouteAction = (req,res) => {

    var sid = req.query.survey , rid = req.query.response; 
    
    if( rows.length == 0 ) {
	logger( "GET  /sample request before sheet object loaded." );
	res.write( "Don't appear to have a sheet object to sample from yet." )
	res.status(500).send();
	return;
    }
    
    var R = sampleRow();
    rowRequestCount += 1;
    logger( "GET  /sample request " + rowRequestCount + " sampled row " + R );
    var response = { Row : R + rowRange[0] }
    header.map( (k,i) => { response[k] = rows[R][i]; } );
    res.json( response );
    counts[R]++;

}

// get an actual row (requires sheet loaded)
app.get( '/sample' , sampleRowRouteAction );
app.get( '/sample/:sid' , sampleRowRouteAction );
app.get( '/sample/:sid/:rid' , sampleRowRouteAction );

// get the vector of counts (debugging, basically)
app.get( '/counts' , (req,res) => { 
    logger( "GET  /get/counts request " );
    res.json(counts); 
} );

// reset the counts vector, in case we need to run multiple trials (for testing or otherwise)
// over the same sheet. Same effect as reloading the sheet. 
app.post( '/reset' , (req,res) => { 
    logger( "POST /reset request " );
    for( var i = 0 ; i < counts.length ; i++ ) { counts[i] = 0.0; }
    res.send(); 
} );

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

server = app.listen( app.get('port') );
logger( "listening on port " + app.get('port') );

if( gapiKey ) { 
    logger( "  setting default Google API connection (using api key from conf.json)" );
    sheets = google.sheets( { version : 'v4' , auth : gapiKey } );
    if( sheetId ) {
        if( shrange ) {
            logger( "  loading default spreadsheet" );
            loadSheet(  { "spreadsheetId" : sheetId , "range" : shrange } , 
                        () => logger( "    loaded default spreadsheet " + sheetId + " " + shrange ) , 
                        (e) => logger( "    spreadsheet load error: " + e ) );
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
