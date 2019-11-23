/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * WRAPPER MODULE TO LOAD "PLUGINS"
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const _fs = require( 'fs' );

module.exports = ( path , match , exclude , loadAsync ) => {

	// initialize an empty exports object
	var loaded = {};

	// which files to consider
	var theFilter = ( i ) => ( match.test(i) && ( exclude.indexOf(i) < 0 ) );

	// what we'll execute on every loadable file found
	var theAction = ( i ) => {
        let n = i.replace( match , '' ) , m = require( `${__dirname}/${path}/${i}` );
        console.log( `  loaded ${i} as "${n}"` );
        loaded[n] = m.class;
        if( m.nicknames ) {
        	m.nicknames.forEach( n => { 
        		console.log( `    also aliased ${i} as "${n}"` );
        		loaded[n] = m.classw; 
        	} );
        }
    }

	// assert that the "exclude"
	if( ! Array.isArray(exclude) ) { exclude = [ exclude ]; }

	// print out what we're doing
	console.log( `Loading ${__dirname}/${path}/${match.toString().replace(/^\/|\/$/g,'')}` );

	// ok, read the directory
	if( loadAsync ) {
		_fs.readdir( __dirname + '/' + path , ( err , items ) => {
		    items.filter( theFilter ).forEach( theAction );
		} );
	} else {
		_fs.readdirSync( __dirname + '/' + path )
			.filter( theFilter ).forEach( theAction );
	}

	// return the loaded modules
	return loaded;

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