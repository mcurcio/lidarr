#!/usr/bin/env node

'use strict';

const imagemagick = require('imagemagick');
const util = require('util');

imagemagick.readMetadata('/Users/Matt/Development/lidarr/test/6132942800_3edd54eafc_o.jpg', function(err, metadata){
  if (err) throw err;
  console.log('Shot at '+util.inspect(metadata.exif));
})
