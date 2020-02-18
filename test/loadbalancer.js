
const _express      = require( 'express' );
const _bodyParser   = require( 'body-parser' );
const _cors         = require( 'cors' );
const _request      = require( 'request' );

const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

const port = 5000;
const servers = [ 'http://localhost:5001' , 'http://localhost:5002' ];

let cur = 0;

var app = _express();

app.set( 'port' , port );
app.use( _cors() );

// a generic load balance handler
const handler = ( req , res ) => {
    // Add an error handler for the proxied request
    const _req = _request( { url: servers[cur] + req.url } ).on( 'error' , error => {
        res.status( 500 ).send( error.message );
    });
    req.pipe( _req ).pipe( res ); // "pipe" using "streams"
    cur = ( cur + 1 ) % servers.length; // round-robin like load balancing
};

// wrap each (used) method with handler
['get','put','post','patch','delete'].forEach( m => { app[m]( '*' , handler ); } );

const onListen = () => logger( `Load balancing server listening on port ${port}` );

let server = app.listen( port , onListen );