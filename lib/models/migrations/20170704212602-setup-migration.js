'use strict';

module.exports = {
	up: function (queryInterface, Sequelize) {
		return queryInterface.createTable(
			'cameras', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				name: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		).then(cameras => queryInterface.createTable(
			'photos', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				uuid: {
					type: Sequelize.UUID,
					defaultValue: Sequelize.UUIDV4,
					unique: true,
					allowNull: false
				},
				hash: {
					type: Sequelize.STRING(128),
					unique: true,
					allowNull: false
				},
				cameraId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'cameras',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				type: Sequelize.STRING(6),
				width: Sequelize.INTEGER,
				height: Sequelize.INTEGER,
				takenAt: Sequelize.DATE,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		))
		.then(photos => queryInterface.addConstraint('photos', ['uuid'], {type: 'unique'}))
		.then(index => queryInterface.addConstraint('photos', ['hash'], {type: 'unique'}))
		.then(index => queryInterface.createTable(
			'locations', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				photoId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'photos',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				path: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		));
	},

	down: function (queryInterface, Sequelize) {
		return queryInterface.dropAllTables();
	}
};
