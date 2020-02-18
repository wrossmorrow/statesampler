
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * CONFIGURATION
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Need some "real" configuration here. Like mongoreadyserverconfig. 

const protect = ( a , b ) => { return ( a ? a : b ); }

const _config = require( protect( process.env.CONF_FILE , './../conf.json' ) );

const basePort = parseInt( protect( process.env.PORT , protect( _config.port , 5000 ) ) );

// 

if( ! "servers" in _config ) { _config.servers = 1; }
else if( ! /^[1-9][0-9]*$/.test(`${_config.servers}`) ) { _config.servers = 1; }
else { _config.servers = parseInt( `${_config.servers}` ); }

// _config.servers is an int, make sure it isn't too large... we use the number of CPUs here, 
// but we _could_ use more if the servers aren't always busy. (But if they aren't always busy, 
// then we should distribute work to them...)
const Ncpus = require( 'os' ).cpus().length;
_config.servers = ( _config.servers > Ncpus ? Ncpus : _config.servers );

// if we're running a single server, just require and launch
if( _config.servers == 1 ) { require( './server.js' ).launch( basePort ); }
else {

	// for more than one server, we have to cluster and manage

	const _cluster = require( 'cluster' );

	const masterMessageHandler = ( id , m ) => { 
		if( /ready/.test( m.type ) ) {
			// define port and tell to launch when a server process is ready
			let port = basePort + parseInt(id);
			_cluster.workers[id].send( { type : "launch" , data : port } );
		} else if( /coord/.test( m.type ) ) {
			// coordination messages have to get passed on to all _other_ workers
			for( const jd in _cluster.workers ) {
				if( _cluster.workers[jd].process.pid != parseInt(m.from) ) {
					_cluster.workers[jd].send( m ); // simply pass through data
				}
			}
		} else {
			console.log( `message type "${m.type}" not understood.` );
		}
	}

	if( _cluster.isMaster ) {

	    for( var i = 0 ; i < _config.servers ; i += 1 ) { _cluster.fork(); }

		for( const id in _cluster.workers ) {
	    	_cluster.workers[id].on( 'message' , masterMessageHandler.bind(this,id) );
		}

		// why is this thread not __also__ a server? Well, because this "master"
		// worker is also an information coordinator, passing on messages related 
		// to samples drawn in each srver process. 

		let server = require( './loadbalancer.js' )( _config );

	} else { 

		// if not master, run a server
		let server = require( './server.js' );

		// this will let us pass on a method to send messages
		server.coord( ( d ) => {
			process.send( { type : 'coord' , from : process.pid , data : d } );
		} ); 

		// let the master/coordinator know we are "ready" in this process
		process.send( { type : "ready" , from : process.pid , data : "hi!" } );

		// message handling (refers to 'server' object)
		process.on( "message" , ( m ) => {
			if( /launch/.test(m.type) ) { server.launch( parseInt(m.data) ); } 
			else if( /coord/.test( m.type ) ) { server.align( m.data ); }
			else {
				// any other message types? 
			}
		} );
	    
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