const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    process.env.MARIADB_DB,
    process.env.MARIADB_USER,
    process.env.MARIADB_PASS,
    {
        host: process.env.MARIADB_HOST,
        dialect: "mariadb",
        logging: false,
    }
);

const Reports = sequelize.define("reports", {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true,
    },
    type: {
        type: Sequelize.DataTypes.ENUM("user", "message"),
        allowNull: false,
    },
    reason: {
        type: Sequelize.DataTypes.ENUM(
            "harassment",
            "racism_sexism",
            "nsfw_nsfl",
            "malware",
            "other"
        ),
        defaultValue: "other",
        allowNull: false,
    },
    actionsTaken: {
        type: Sequelize.DataTypes.STRING, // where the fuck is the SET data type? screw you sequelize
        defaultValue: "",
    },
    targetId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    juryMessageId: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
});

const Votes = sequelize.define(
    "votes",
    {
        id: {
            type: Sequelize.DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true,
        },
        userId: {
            type: Sequelize.DataTypes.STRING,
            allowNull: false,
        },
        kind: {
            type: Sequelize.DataTypes.ENUM("ban", "delete"),
            allowNull: false,
        },
        vote: {
            type: Sequelize.DataTypes.ENUM("positive", "negative"),
            allowNull: false,
        },
    },
    {
        indexes: [
            {
                unique: true,
                fields: ["userId", "reportId", "kind"],
            },
        ],
    }
);

Reports.Votes = Votes.belongsTo(Reports);

const User = sequelize.define("users", {
    discordID: {
        primaryKey: true,
        unique: true,
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
    },
    karma: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
    },
    lastThank: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
    },
});

async function connect() {
    try {
        await sequelize.authenticate();
        console.log("Database connection has been established successfully");

        await sequelize.sync();
        console.log("Models synchronized");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
        process.exit(-1);
    }
}

module.exports = { connect, Reports, Votes, User };
