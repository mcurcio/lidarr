'use strict';

module.exports = {
	up: function (queryInterface, Sequelize) {
		return (async () => {
			await queryInterface.createTable('thumbnails', {
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
				photoId: {
					type: Sequelize.INTEGER,
					referenced: {
						model: 'photos',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				ext: Sequelize.STRING(10),
				size: Sequelize.INTEGER,
				width: Sequelize.INTEGER,
				height: Sequelize.INTEGER,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			});
		})();
	},

	down: function (queryInterface, Sequelize) {
		return queryInterface.dropTable('thumbnails');
	}
};
