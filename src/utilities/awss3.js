
// a regex for S3 URLs
const s3URLFormat = /https:\/{2}(([^\.]+)\.){0,1}s3(-([^\.]+)){0,1}\.amazonaws\.com\/(.*)/;

// a function to "decode" S3 urls by "type", presuming we get a spec of the "parts"
const decodeS3URLFromParts = {

    'parts' : ( url ) => ( url ) , 
    's3obj' : ( url ) => ( url.bucket + '/' + url.key ) , 
    's3url' : ( url ) => {

        // parse S3 URL components, and exit if that fails
        let match = s3URLFormat.exec( url ); if( ! match ) { return null; }

        // decoding s3 urls...
        // bucket-format: match[2], match[4], match[5] are the bucket, region, and key
        // path-format: if match[2] is undefined, then match[5] starts with the bucket name
        let result = { bucket : match[2] , region : match[4] , key : match[5] };
        if( ! result.bucket ) {
            match  = /([^\/]+)\/(.*)/.exec( result.key );
            result.bucket = match[1]; 
            result.key = match[2];
        }

        // return the parsed result
        return result;
    } ,
    
};

// 
const formatS3URLFromParts = ( parts ) => {
    if( parts.region ) {
        return `https://${parts.bucket}.s3-${parts.region}.amazonaws.com/${parts.key}`;
    } else {
        return `https://${parts.bucket}.s3.amazonaws.com/${parts.key}`;
    }
};