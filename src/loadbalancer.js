
const _express      = require( 'express' );
const _cors         = require( 'cors' );
const _request      = require( 'request' );

var servers = [];

const logger = ( s ) => { console.log( ( new Date( Date.now() ).toISOString() ) + " | " + s ); }

let cur = 0;

module.exports = ( _config ) => {

	var app = _express();

	app.set( 'port' , _config.port );
	app.use( _cors() );

	for( var i = 0 ; i < _config.servers ; i++ ) {
		servers.push( "http://localhost:" + (Number.parseInt(_config.port)+i+1) );
	}

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

	const onListen = () => logger( `Load balancing server listening on port ${_config.port}` );

    var server = undefined;
    if( _config.ssl ) {
        server = _https.createServer( {
            key     : _fs.readFileSync( _config.ssl.key  ) ,
            cert    : _fs.readFileSync( _config.ssl.cert ) ,
            ca      : _fs.readFileSync( _config.ssl.csr  ) ,
            requestCert : false ,
            rejectUnauthorized : false
        } , app );
        server.listen( _config.port , onListen );
    } else {
        server = app.listen( _config.port , onListen );
    }

}