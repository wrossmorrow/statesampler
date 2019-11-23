
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

const _fs = require( 'fs' );

// initialize an empty exports object
module.exports = {};

console.log( `Loading Samplers...` );

_fs.readdirSync( __dirname + '/samplers' )
	.filter( i => ( /.js$/.test(i) && ( i !== "SamplerBase.js" ) ) )
	.forEach( i => {
        let n = i.replace( /.js$/ , '' ) , m = require( __dirname + '/samplers/' + i );
        console.log( `  loaded sampler ${n}` );
        module.exports[n] = m;
    } );

/*

// ok, read the "samples" subdirectory
_fs.readdir( __dirname + '/samplers' , ( err , items ) => {
    // for all read files 
    items.filter( i => ( /.js$/.test(i) && ( i !== "SamplerBase.js" ) ) ).forEach( i => {
        let n = i.replace( /.js$/ , '' ) , m = require( __dirname + '/samplers/' + i );
        console.log( `  loaded sampler ${n}` );
        module.exports[n] = m;
    } );
} );

*/

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * 
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */