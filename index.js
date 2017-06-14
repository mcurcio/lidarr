'use strict';

const bunyan = require('bunyan');
const checksum = require('checksum');
const express = require('express');
const fs = require('fs');
const {
    buildSchema,
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLList,
  GraphQLString
} = require('graphql');
const {
    GraphQLDate,
    GraphQLTime,
    GraphQLDateTime
} = require('graphql-iso-date');
const {globalIdField} = require('graphql-relay');
const {attributeFields, defaultArgs, defaultListArgs, resolver, relay: {sequelizeConnection}, typeMapper, nodeTypeMapper} = require('graphql-sequelize');
const graphqlHTTP = require('express-graphql');
const imageType = require('image-type');
const jimp = require('jimp');
const mkdirp_ = require('mkdirp');
const path = require('path');
const promisify = require('es6-promisify');
const readChunk = require('read-chunk');
const walk = require('walk');

const NAME = 'Lidarr';
const BASE = '/Volumes/Media/Photos/Inbox';
const EXTENSIONS = ['jpg', 'png'];
const THUMBNAIL_DIR = 'data/thumbnails';

const hash = promisify((file, cb) => checksum.file(file, {algorithm: 'sha512'}, cb));
const mkdirp = promisify(mkdirp_);
const stat = promisify(fs.stat);

let logger = bunyan.createLogger({
    name: 'lidarr',
    streams: [
        {
            stream: process.stdout
        },
        {
            type: 'rotating-file',
            path: 'data/lidarr.log',
            level: 'trace',
            period: '1d',
            count: 7
        }
    ],
    src: true
});

require('./lib/db.js')(NAME, logger).then((db) => {
    class App {
        constructor(db, logger) {
            this._db = db;
            this._logger = logger;
        }

        sync(dir) {
            return new Promise((resolve, reject) => {
                let walker = walk.walk(dir);

                walker.on('file', function (root, stats, next) {
                    let file = path.join(root, stats.name);
                    let relative = path.join(path.relative(dir, root), stats.name);
                    this._logger.debug({file, relative}, 'Found file');

                    readChunk(file, 0, 12)
                        .then((chunk) => {
                            const type = imageType(chunk);
                            if (!type || EXTENSIONS.indexOf(type.ext) === -1) {
                                throw new Error('Not an image');
                            }

                            return Promise.all([
                                stat(file),
                                hash(file),
                                type.ext
                            ]);
                        })
                        .then(([stats, hash_, ext]) => {
                            return Promise.all([
                                this._db.Photo.findOrCreate({
                                    where: {hash: hash_},
                                    defaults: {
                                        path: relative,
                                        hash: hash_,
                                        takenAt: stats.birthtime
                                    }
                                }),
                                ext
                            ]);
                        })
                        .then(([[photo, meta], ext]) => {
                            this._logger.info({photo}, 'Synchronizing photo');

                            const thumbnailDir = photo.uuid.substring(0, 2);

                            this._logger.info({thumbnailDir, photo}, 'Making thumbnail directory');

                            return Promise.all([
                                Promise.resolve(photo),
                                jimp.read(file),
                                mkdirp(THUMBNAIL_DIR + '/' + thumbnailDir),
                                Promise.resolve(thumbnailDir),
                                Promise.resolve(ext)
                            ]);
                        })
                        .then(([photo, image, dir, thumbnailDir, ext]) => {
                            const thumbnail = thumbnailDir + '/' + photo.uuid.substring(2) + '.' + ext;

                            this._logger.info({photo, thumbnailDir, ext}, 'Making thumbnail');

                            return Promise.all([
                                Promise.resolve(photo),
                                image.scaleToFit(300, 300).write(THUMBNAIL_DIR + '/' + thumbnail),
                                Promise.resolve(thumbnail)
                            ]);
                        })
                        .then(([photo, image, thumbnail]) => {
                            photo.thumbnail = thumbnail;
                            return photo.save();
                        })
                        .then(next)
                        .catch((err) => {
                            this._logger.error({file, e: err}, 'Failed on photo');
                            next(err);
                        });
                });

                walker.on('errors', function (root, statsArray, next) {
                    next();
                });

                walker.on('end', function () {
                    resolve();
                });
            });
        }
    }

    const server = express();
/*
    const schema = buildSchema(`
        type Photo {
            id: Int!
            uuid: String!
            hash: String!
            path: String!
            thumbnail: String!
            takenAt: DateTime!
        }

        input PhotoSearch {
            ids: [Int]
        }

        type Query {
            photo(id: Int): Photo
            photos(params: PhotoSearch): [Photo]
        }
    `);

    class Photo {
        constructor(model) {
            this.id = model.id;
            this.uuid = model.uuid;
            this.hash = model.hash;
            this.path = model.path;
            this.thumbnail = model.thumbnail;
            this.takenAt = model.takenAt;
        }
    }

    const root = {
        photo: ({id}) => {
            return db.Photo.findById(id)
                .then((photo) => {
                    return new Photo(photo);
                });
        },
        photos: ({params}) => {
            console.log('photos', params);
            return db.Photo.all()
                .then((photos) => {
                    return photos.map(photo => new Photo(photo))
                });
        }
    };

    const {
        nodeInterface,
        nodeField,
        nodeTypeMapper
    } = sequelizeNodeInterface(db);
*/

/*
    const CameraType = new GraphQLObjectType({
        name: db.Camera.name,
        description: 'A camera',
        fields: Object.assign(attributeFields(db.Camera), {

        })
    });

    const PhotoType = new GraphQLObjectType({
        name: db.Photo.name,
        desription: 'A Photo',
        fields: Object.assign(attributeFields(db.Photo), {
            id: globalIdField(db.Photo.name),
            camera: {
                type: CameraType,
                resolve: resolver(db.Photo.Camera)
            }
        })
    });
    const util = require('util');
    console.log('camera type', CameraType._typeConfig, CameraType._fields, CameraType.getFields());
    CameraType._typeConfig['photos'] = {
        type: new GraphQLList(PhotoType),
        resolve: resolver(db.Camera.photos)
    };
    console.log('camera type', CameraType._fields, CameraType.getFields());


    const GraphSchema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'RootType',
            fields: {
                photos: {
                    type: new GraphQLList(PhotoType),
                    args: defaultListArgs(db.Photo),
                    resolve: resolver(db.Photo)
                },
                cameras: {
                    type: new GraphQLList(CameraType),
                    args: defaultListArgs(db.Camera),
                    resolve: resolver(db.Camera)
                },
                node: nodeField
            }
        })
    });
*/

    const PhotoType = new GraphQLObjectType({
        name: db.Photo.name,
        fields: Object.assign(attributeFields(db.Photo), {
            id: globalIdField(db.Photo.name)
        })
    });

    const CameraPhotoConnection = sequelizeConnection({
        name: db.Camera.name + db.Photo.name,
        nodeType: PhotoType,
        target: db.Camera
    });

    const CameraType = new GraphQLObjectType({
        name: db.Camera.name,
        fields: {
            photos: {
                type: CameraPhotoConnection.connectionType,
                args: CameraPhotoConnection.connectionArgs,
                resolve: CameraPhotoConnection.resolve
            }
        }
    });
/*
    nodeTypeMapper.mapTypes({
        [db.Camera.name]: CameraType,
        [db.Photo.name]: PhotoType
    });
*/
    typeMapper.mapType((type) => {
        if (type instanceof db.Sequelize.DATE) {
            return GraphQLDateTime;
        } else if (type instanceof db.Sequelize.DATEONLY) {
            return GraphQLDate;
        }

        return false;
    });

    const Schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'RootQueryType',
            fields: {
                camera: {
                    type: new GraphQLList(CameraType),
                    resolve: () => db.Camera.findAll()
                },
                photos: {
                    type: new GraphQLList(PhotoType),
                    resolve: resolver(db.Photo)
                }
            }
        })
    });




    server.use('/graphql', graphqlHTTP({
        schema: Schema,
    //    rootValue: root,
        graphiql: true
    }));

    server.listen(4000);
});
