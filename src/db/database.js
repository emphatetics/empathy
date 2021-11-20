const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.MARIADB_DB, process.env.MARIADB_USER, process.env.MARIADB_PASS, {
    host: process.env.MARIADB_HOST,
    dialect: 'mariadb',
    logging: false
})

const Reports = sequelize.define('reports', {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    },
    type: {
        type: Sequelize.DataTypes.ENUM('user', 'message'),
        allowNull: false
    },
    actionsTaken: {
        type: Sequelize.DataTypes.STRING, // where the fuck is the SET data type? screw you sequelize 
        defaultValue: ""
    },
    targetId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
    },
    juryMessageId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
    }
})

const Votes = sequelize.define('votes', {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
    },
    userId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
    },
    kind: {
        type: Sequelize.DataTypes.ENUM('ban', 'delete'),
        allowNull: false
    },
    vote: {
        type: Sequelize.DataTypes.ENUM('positive', 'negative'),
        allowNull: false
    },
},
{
    indexes: [
        {
            unique: true,
            fields: ['userId', 'reportId', 'kind']
        }
    ]
})

Reports.Votes = Votes.belongsTo(Reports)

async function connect() {
    try {
        await sequelize.authenticate();
        console.log("Database connection has been established successfully");

        await sequelize.sync();
        console.log("Models synchronized")
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(-1);
    }
}

module.exports = { connect, Reports, Votes }