
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

console.log( `Loading Data Sources...` );

// ok, read the "datasources" subdirectory

_fs.readdirSync( __dirname + '/datasources' )
	.filter( i => ( /.js$/.test(i) && ( i !== "DataSourceBase.js" ) ) )
	.forEach( i => {
        let n = i.replace( /.js$/ , '' ) , m = require( __dirname + '/datasources/' + i );
        console.log( `  loaded datasource ${n}` );
        module.exports[n] = m;
    } );

/*
_fs.readdir( __dirname + '/datasources' , ( err , items ) => {
    // for all read files 
    items.filter( i => ( /.js$/.test(i) && ( i !== "DataSourceBase.js" ) ) ).forEach( i => {
        let n = i.replace( /.js$/ , '' ) , m = require( __dirname + '/datasources/' + i );
        console.log( `  loaded datasource ${n}` );
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